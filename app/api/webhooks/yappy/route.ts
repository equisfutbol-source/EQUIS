import crypto from "node:crypto";
import { createElement } from "react";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getOrder, updateOrderStatus, type StoredOrder } from "@/lib/order-store";
import { OrderReceiptEmail } from "@/components/emails/OrderReceiptEmail";
import { ISSUER } from "@/lib/company";
import type { Order } from "@/types/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Yappy V2 IPN — `GET /api/webhooks/yappy?orderId=...&status=...&domain=...&Hash=...`
 *
 * `status` is one of Banco General's single-letter codes:
 *   E = Ejecutado (paid)   R = Rechazado (declined)
 *   C = Cancelado          X = Expirado
 *
 * The Hash param is verified as HMAC-SHA256(`${orderId}${status}${domain}`),
 * keyed with the decoded secret described below, compared in constant time
 * via crypto.timingSafeEqual (Banco General's own sample uses `===`; kept
 * as timingSafeEqual here since that was already hardened in an earlier
 * pass and there's no reason to reintroduce a timing side-channel).
 * Requests that fail this check are rejected before touching the order store.
 */

/**
 * YAPPY_SECRET_KEY (or CLAVE_SECRETA) as stored is itself base64 of a
 * "."-delimited value — the actual HMAC key is the first segment after
 * decoding, per Banco General's sample. This previously used the raw env
 * var directly as the HMAC key, which does not match what Yappy signs with.
 */
function getYappyHmacSecret(): string | null {
  const raw = process.env.YAPPY_SECRET_KEY ?? process.env.CLAVE_SECRETA;
  if (!raw) return null;
  const decoded = Buffer.from(raw, "base64").toString("utf-8");
  return decoded.split(".")[0];
}

function isValidYappySignature(orderId: string, status: string, domain: string, hash: string): boolean {
  const secretKey = getYappyHmacSecret();
  if (!secretKey) {
    console.error("[webhooks/yappy] YAPPY_SECRET_KEY (or CLAVE_SECRETA) not set — cannot verify IPN signature.");
    return false;
  }

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(`${orderId}${status}${domain}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const receivedBuffer = Buffer.from(hash, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function storedOrderToOrder(stored: StoredOrder): Order {
  return {
    orderId: stored.orderId,
    date: stored.createdAt,
    accountType: stored.accountType,
    customerName: stored.customerName,
    email: stored.email,
    phone: stored.phone,
    companyName: stored.companyName,
    ruc: stored.ruc,
    dv: stored.dv,
    paymentMethod: "yappy",
    yappyReference: stored.transactionId,
    items: stored.items.map((item) => ({
      productId: item.sku,
      name: item.name,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    subtotal: stored.subtotal,
    volumeDiscount: stored.volumeDiscount,
    itbms: stored.itbms,
    total: stored.total,
  };
}

async function sendConfirmationEmail(order: Order): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[webhooks/yappy] RESEND_API_KEY not set — skipping confirmation email.");
    return;
  }

  const resend = new Resend(apiKey);

  // Falls back to Resend's own verified sandbox domain so sending works
  // immediately in dev/testing; set RESEND_FROM_EMAIL to a real verified
  // domain (e.g. pedidos@equisfutbol.com once verified) for production.
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: order.email,
    replyTo: ISSUER.email,
    subject: `Confirmación de Pedido ${order.orderId} — EQUIS`,
    react: createElement(OrderReceiptEmail, { order }),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const domain = searchParams.get("domain");
  const hash = searchParams.get("Hash") ?? searchParams.get("hash");

  if (!orderId || !status || !domain || !hash) {
    return NextResponse.json(
      { error: "Missing required query parameters (orderId, status, domain, Hash)" },
      { status: 400 }
    );
  }

  if (!isValidYappySignature(orderId, status, domain, hash)) {
    console.error(`[webhooks/yappy] SECURITY ALERT: Invalid Yappy IPN hash signature for orderId "${orderId}"`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const order = await getOrder(orderId);
    if (!order) {
      console.error(`[webhooks/yappy] IPN received for unknown orderId "${orderId}"`);
      // Still ACK with 200 so Banco General doesn't retry indefinitely for
      // an order that will never exist on our side.
      return NextResponse.json({ status: "success" });
    }

    switch (status) {
      case "E": {
        if (order.status !== "PAID") {
          const updated = await updateOrderStatus(order.orderId, "PAID");
          if (updated) {
            await sendConfirmationEmail(storedOrderToOrder(updated));
          }
        }
        break;
      }
      case "R": {
        if (order.status === "PENDING_YAPPY_PAYMENT") {
          await updateOrderStatus(order.orderId, "FAILED");
        }
        break;
      }
      case "C": {
        if (order.status === "PENDING_YAPPY_PAYMENT") {
          await updateOrderStatus(order.orderId, "CANCELLED");
        }
        break;
      }
      case "X": {
        if (order.status === "PENDING_YAPPY_PAYMENT") {
          await updateOrderStatus(order.orderId, "EXPIRED");
        }
        break;
      }
      default: {
        console.warn(`[webhooks/yappy] IPN for order ${orderId} reported unrecognized status "${status}" — order left as-is.`);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[webhooks/yappy] failed to process IPN:", error);
    // Still ACK 200 per spec even on internal failure, to avoid Banco
    // General retry storms; the error is logged for manual follow-up.
    return NextResponse.json({ status: "success" });
  }
}
