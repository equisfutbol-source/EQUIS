"use client";

import { Suspense, useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileDown, QrCode, ShoppingBag } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { ProductImage } from "@/components/shop/ProductImage";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getNextOrderNumber, ISSUER } from "@/lib/company";
import { discountRateForQuantity, ITBMS_RATE } from "@/types/quote";
import { cartLineKey } from "@/types/cart";
import type { Order, OrderAccountType } from "@/types/order";
import { cn } from "@/lib/utils";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Yappy's "Botón de Pago" web component (bt-cdn) is a custom element not
// known to JSX by default — declare it so <btn-yappy> type-checks.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "btn-yappy": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { theme?: string };
    }
  }
}

/**
 * The btn-yappy custom element exposes eventPayment() as an instance
 * method and isButtonLoading as a settable property, per Banco General's
 * events/error catalog doc.
 */
interface YappyButtonElement extends HTMLElement {
  eventPayment: (params: { transactionId: string; documentName: string; token: string }) => void;
  isButtonLoading: boolean;
}

// Banco General's Yappy error catalog — codes surfaced via the widget's
// eventError. Unlisted codes fall back to a generic message.
const YAPPY_ERROR_MESSAGES: Record<string, string> = {
  E005: "Número de Yappy no registrado.",
  E007: "Este pedido ya fue procesado.",
  E009: "El identificador del pedido no es válido.",
  E010: "El valor de los montos no es correcto.",
  E011: "Error en los campos de URL. Intenta de nuevo.",
};

function extractYappyErrorCode(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;
    const code = record.code ?? record.errorCode ?? record.status;
    if (typeof code === "string") return code;
  }
  return null;
}

function yappyErrorMessage(detail: unknown): string {
  const code = extractYappyErrorCode(detail);
  if (code && YAPPY_ERROR_MESSAGES[code]) return YAPPY_ERROR_MESSAGES[code];
  return "Ocurrió un error al procesar el pago con Yappy. Intenta de nuevo.";
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const initialName = profile
    ? profile.account_type === "person"
      ? profile.full_name
      : profile.contact_person_name
    : "";
  const initialCompanyName = profile?.account_type === "business" ? profile.company_name : "";
  const initialRuc = profile?.account_type === "business" ? profile.ruc : "";
  const initialDv = profile?.account_type === "business" ? profile.dv : "";

  const [accountType, setAccountType] = useState<OrderAccountType>(
    searchParams.get("type") === "business" ? "business" : "person"
  );
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [ruc, setRuc] = useState(initialRuc);
  const [dv, setDv] = useState(initialDv);
  const [yappyReference, setYappyReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  // Generated once, client-side only (getNextOrderNumber reads
  // window.localStorage, so it can't run during SSR) — so the same orderId
  // is used both when creating the Yappy payment order and when the order
  // is later persisted/shown on success.
  const [orderId, setOrderId] = useState("");
  useEffect(() => {
    setOrderId(getNextOrderNumber());
  }, []);
  const yappyButtonRef = useRef<HTMLElement | null>(null);
  const [isYappyOnline, setIsYappyOnline] = useState(true);

  const isBusiness = accountType === "business";
  const volumeDiscount = isBusiness
    ? items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity * discountRateForQuantity(item.quantity),
        0
      )
    : 0;
  const netSubtotal = subtotal - volumeDiscount;
  const itbms = netSubtotal * ITBMS_RATE;
  const total = netSubtotal + itbms;

  function validateContact(): boolean {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Completa tus datos de contacto.");
      return false;
    }
    if (isBusiness && (!companyName.trim() || !ruc.trim() || !dv.trim())) {
      setError("Completa los datos de tu empresa (Razón Social, RUC y DV).");
      return false;
    }
    return true;
  }

  function buildOrder(): Order {
    return {
      orderId,
      date: new Date().toISOString(),
      accountType,
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      companyName: isBusiness ? companyName.trim() : undefined,
      ruc: isBusiness ? ruc.trim() : undefined,
      dv: isBusiness ? dv.trim() : undefined,
      paymentMethod: "yappy",
      yappyReference: yappyReference.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        image: item.image,
        color: item.color,
        size: item.size,
      })),
      subtotal,
      volumeDiscount,
      itbms,
      total,
    };
  }

  useEffect(() => {
    const button = yappyButtonRef.current;
    if (!button) return;

    const yappyButton = button as YappyButtonElement;

    function handleIsYappyOnline(event: Event) {
      const online = (event as CustomEvent).detail;
      console.log("[Yappy] isYappyOnline:", online);
      setIsYappyOnline(online !== false);
    }

    function handleEventSuccess(event: Event) {
      console.log("[Yappy] eventSuccess:", (event as CustomEvent).detail);
      const order = buildOrder();
      window.localStorage.setItem("equisLastOrder", JSON.stringify(order));
      clearCart();
      router.push("/checkout/success");
    }

    function handleEventError(event: Event) {
      const detail = (event as CustomEvent).detail;
      console.error("[Yappy] eventError:", detail);
      yappyButton.isButtonLoading = false;
      setError(yappyErrorMessage(detail));
    }

    async function handleEventClick() {
      setError(null);
      if (!validateContact()) return;
      if (!orderId) {
        setError("Un momento, preparando tu pedido. Intenta de nuevo.");
        return;
      }

      yappyButton.isButtonLoading = true;
      try {
        const response = await fetch("/api/checkout/yappy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            accountType,
            customerName: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            companyName: isBusiness ? companyName.trim() : undefined,
            ruc: isBusiness ? ruc.trim() : undefined,
            dv: isBusiness ? dv.trim() : undefined,
            items: items.map((item) => ({
              sku: item.sku,
              name: item.name,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              color: item.color,
              size: item.size,
            })),
            subtotal,
            volumeDiscount,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "No se pudo iniciar el pago con Yappy.");
        }

        const result = (await response.json()) as {
          body: { token: string; documentName: string; transactionId: string };
        };

        setYappyReference(result.body.transactionId);
        yappyButton.isButtonLoading = false;
        yappyButton.eventPayment({
          transactionId: result.body.transactionId,
          documentName: result.body.documentName,
          token: result.body.token,
        });
      } catch (err) {
        console.error("[Yappy] eventClick failed:", err);
        yappyButton.isButtonLoading = false;
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago con Yappy.");
      }
    }

    button.addEventListener("isYappyOnline", handleIsYappyOnline);
    button.addEventListener("eventSuccess", handleEventSuccess);
    button.addEventListener("eventError", handleEventError);
    button.addEventListener("eventClick", handleEventClick);

    return () => {
      button.removeEventListener("isYappyOnline", handleIsYappyOnline);
      button.removeEventListener("eventSuccess", handleEventSuccess);
      button.removeEventListener("eventError", handleEventError);
      button.removeEventListener("eventClick", handleEventClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orderId,
    accountType,
    name,
    email,
    phone,
    isBusiness,
    companyName,
    ruc,
    dv,
    items,
    subtotal,
    volumeDiscount,
  ]);

  async function handleDownloadPdf() {
    setError(null);
    if (!validateContact()) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch("/api/quote/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          ruc: ruc.trim(),
          dv: dv.trim(),
          contactName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          items: items.map((item) => ({
            sku: item.sku,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo generar la cotización.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Cotizacion-EQUIS-${companyName.trim().replace(/\s+/g, "-") || "Empresa"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatusMessage("Cotización oficial descargada en PDF.");
    } catch {
      setError("No se pudo generar la cotización en PDF. Intenta de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderNav />
        <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4 pb-24 pt-48 text-center">
          <ShoppingBag className="h-10 w-10 text-zinc-700" />
          <h1 className="text-2xl font-black uppercase tracking-tight">Tu carrito está vacío</h1>
          <p className="text-sm text-zinc-400">Agrega productos antes de continuar al pago.</p>
          <Link
            href="/productos"
            className="mt-2 border border-white px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-white hover:text-black"
          >
            Explorar Productos
          </Link>
        </main>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-black text-white"
    >
      <Script
        src="https://bt-cdn-uat.yappycloud.com/v1/cdn/web-component-btn-yappy.js"
        type="module"
        strategy="afterInteractive"
      />
      <HeaderNav />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">Checkout</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">Finalizar Compra</h1>

        <div className="mt-8 flex border border-zinc-800">
          <button
            type="button"
            onClick={() => setAccountType("person")}
            className={cn(
              "flex-1 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-colors",
              accountType === "person" ? "bg-white text-black" : "text-white hover:bg-zinc-900"
            )}
          >
            Persona
          </button>
          <button
            type="button"
            onClick={() => setAccountType("business")}
            className={cn(
              "flex-1 border-l border-zinc-800 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-colors",
              accountType === "business" ? "bg-white text-black" : "text-white hover:bg-zinc-900"
            )}
          >
            Empresa / B2B
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">
                {isBusiness ? "Datos de Contacto de la Empresa" : "Datos de Contacto"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isBusiness ? "Nombre de Contacto" : "Nombre Completo"}
                  value={name}
                  onChange={setName}
                  placeholder="Ana Torres"
                  required
                />
                <Field
                  label="Correo"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="ana@correo.com"
                  required
                />
                <Field
                  label="Teléfono"
                  mono
                  value={phone}
                  onChange={setPhone}
                  placeholder="+507 6000-0000"
                  required
                  className="sm:col-span-2"
                />
              </div>

              {isBusiness && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Razón Social"
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="Distribuidora Deportiva S.A."
                    required
                    className="sm:col-span-2"
                  />
                  <Field
                    label="RUC"
                    mono
                    value={ruc}
                    onChange={setRuc}
                    placeholder="155632158-2-2016"
                    required
                  />
                  <Field label="DV" mono value={dv} onChange={setDv} placeholder="59" required />
                </div>
              )}
            </section>

            {isBusiness && (
              <section>
                <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">
                  Facturado Por
                </h2>
                <div className="border border-zinc-800 bg-zinc-900 p-4 text-sm">
                  <p className="font-black uppercase tracking-tight">{ISSUER.companyName}</p>
                  <p className="mt-1 text-zinc-400">
                    RUC: {ISSUER.ruc} · DV: {ISSUER.dv}
                  </p>
                  <p className="text-zinc-400">
                    {ISSUER.email} · {ISSUER.phone}
                  </p>
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">
                Método de Pago
              </h2>
              <div className="border border-white p-4">
                <div className="flex items-center gap-3">
                  <QrCode className="h-4 w-4" />
                  <span className="font-mono text-sm font-bold uppercase tracking-wider">
                    YAPPY (BANCO GENERAL)
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-4 border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white">
                      YAPPY
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                      Banco General
                    </span>
                  </div>
                  {isYappyOnline ? (
                    <>
                      <p className="text-sm text-zinc-300">
                        Completa tus datos de contacto y pulsa el botón de Yappy para pagar.
                      </p>
                      <btn-yappy ref={yappyButtonRef} theme="dark"></btn-yappy>
                    </>
                  ) : (
                    <>
                      {/* btn-yappy stays mounted (hidden) so it can keep dispatching isYappyOnline and recover on its own. */}
                      <p className="border border-amber-900 bg-amber-950/40 px-4 py-3 text-xs text-amber-300">
                        Yappy no está disponible en este momento. Intenta más tarde.
                      </p>
                      <btn-yappy ref={yappyButtonRef} theme="dark" className="hidden"></btn-yappy>
                    </>
                  )}
                </div>
              </div>
            </section>

            {error && (
              <p className="border border-red-900 bg-red-950/40 px-4 py-3 text-xs text-red-300">{error}</p>
            )}
            {statusMessage && (
              <p className="border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
                {statusMessage}
              </p>
            )}
          </div>

          <aside className="h-fit border border-zinc-800 bg-zinc-900 p-6">
            <p className="mb-4 font-mono text-xs uppercase tracking-wider text-zinc-500">
              Resumen del Pedido
            </p>

            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={cartLineKey(item)} className="flex gap-3">
                  {item.image ? (
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 shrink-0"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-zinc-800">
                      <ShoppingBag className="h-5 w-5 text-zinc-600" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-bold">{item.name}</p>
                    {(item.color || item.size) && (
                      <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                        {[item.color, item.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="font-mono text-xs text-zinc-500">
                      {item.quantity} x ${currency(item.unitPrice)}
                      {isBusiness && discountRateForQuantity(item.quantity) > 0 && (
                        <> · -{Math.round(discountRateForQuantity(item.quantity) * 100)}%</>
                      )}
                    </p>
                  </div>
                  <p className="font-mono text-sm">${currency(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4 font-mono text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>${currency(subtotal)}</span>
              </div>
              {isBusiness && volumeDiscount > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Descuento por Volumen</span>
                  <span>-${currency(volumeDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>ITBMS ({Math.round(ITBMS_RATE * 100)}%)</span>
                <span>${currency(itbms)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-bold text-white">
                <span>Total USD</span>
                <span>${currency(total)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {isBusiness && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex w-full items-center justify-center gap-2 border border-white px-6 py-4 font-mono text-sm uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4" />
                  {isGeneratingPdf ? "Generando..." : "Descargar Cotización en PDF"}
                </button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
  required = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white",
          mono && "font-mono"
        )}
      />
    </label>
  );
}
