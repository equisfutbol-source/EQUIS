import { NextResponse } from "next/server";
import { createPaymentOrder } from "@/lib/yappy";
import { saveOrder, type StoredOrderItem } from "@/lib/order-store";
import { ITBMS_RATE } from "@/types/quote";

/** Strips a phone number down to the bare Panamanian number Yappy's aliasYappy expects (no +507 prefix, no punctuation). */
function toAliasYappy(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^507/, "");
}

export const runtime = "nodejs";

interface YappyCheckoutRequestBody {
  orderId: string;
  accountType: "person" | "business";
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  ruc?: string;
  dv?: string;
  items: StoredOrderItem[];
  subtotal: number;
  volumeDiscount: number;
}

function isValidBody(body: unknown): body is YappyCheckoutRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.orderId === "string" &&
    b.orderId.trim().length > 0 &&
    (b.accountType === "person" || b.accountType === "business") &&
    typeof b.customerName === "string" &&
    b.customerName.trim().length > 0 &&
    typeof b.email === "string" &&
    b.email.trim().length > 0 &&
    typeof b.phone === "string" &&
    b.phone.trim().length > 0 &&
    Array.isArray(b.items) &&
    b.items.length > 0 &&
    typeof b.subtotal === "number" &&
    typeof b.volumeDiscount === "number"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Faltan datos requeridos para iniciar el pago." }, { status: 400 });
  }

  const netSubtotal = body.subtotal - body.volumeDiscount;
  const itbms = netSubtotal * ITBMS_RATE;
  const total = netSubtotal + itbms;

  try {
    const { transactionId, token, documentName } = await createPaymentOrder({
      orderId: body.orderId,
      aliasYappy: toAliasYappy(body.phone),
      subtotal: netSubtotal.toFixed(2),
      total: total.toFixed(2),
      taxes: itbms.toFixed(2),
      discount: body.volumeDiscount.toFixed(2),
    });

    const now = new Date().toISOString();
    await saveOrder({
      orderId: body.orderId,
      transactionId,
      status: "PENDING_YAPPY_PAYMENT",
      accountType: body.accountType,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone,
      companyName: body.companyName,
      ruc: body.ruc,
      dv: body.dv,
      items: body.items,
      subtotal: body.subtotal,
      volumeDiscount: body.volumeDiscount,
      itbms,
      total,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ body: { transactionId, token, documentName }, total });
  } catch (error) {
    console.error("[api/checkout/yappy] order creation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar el pago con Yappy." },
      { status: 502 }
    );
  }
}
