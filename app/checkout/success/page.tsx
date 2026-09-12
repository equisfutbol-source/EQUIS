"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ShoppingBag } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { OrderReceiptEmail } from "@/components/emails/OrderReceiptEmail";
import type { Order } from "@/types/order";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("equisLastOrder");
    if (stored) {
      try {
        setOrder(JSON.parse(stored) as Order);
      } catch {
        window.localStorage.removeItem("equisLastOrder");
      }
    }
    setHasChecked(true);
  }, []);

  if (hasChecked && !order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderNav />
        <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4 pb-24 pt-48 text-center">
          <ShoppingBag className="h-10 w-10 text-zinc-700" />
          <h1 className="text-2xl font-black uppercase tracking-tight">No hay ningún pedido reciente</h1>
          <p className="text-sm text-zinc-400">Completa una compra para ver su confirmación aquí.</p>
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

  if (!order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderNav />
      </div>
    );
  }

  const paymentStatus =
    order.paymentMethod === "yappy"
      ? { label: "Pendiente de verificación", icon: Clock }
      : { label: "Pago aprobado (simulado)", icon: CheckCircle2 };
  const StatusIcon = paymentStatus.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-black text-white"
    >
      <HeaderNav />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-32 text-center sm:px-6">
        <CheckCircle2 className="mx-auto h-12 w-12 text-white" strokeWidth={1.5} />
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">Pedido Confirmado</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Guarda tu número de pedido — te contactaremos por WhatsApp o correo con los detalles de envío.
        </p>

        <div className="mt-8 border border-zinc-800 bg-zinc-900 p-6 text-left">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Número de Pedido
              </p>
              <p className="font-mono text-lg font-bold">{order.orderId}</p>
            </div>
            <div className="flex items-center gap-2 border border-zinc-700 px-3 py-1.5">
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] uppercase tracking-wider">{paymentStatus.label}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1 text-sm">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-mono">${currency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-zinc-800 pt-3 font-mono text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>${currency(order.subtotal)}</span>
            </div>
            {order.volumeDiscount > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Descuento por Volumen</span>
                <span>-${currency(order.volumeDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>ITBMS</span>
              <span>${currency(order.itbms)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-bold">
              <span>Total</span>
              <span>${currency(order.total)}</span>
            </div>
          </div>
        </div>

        <Link
          href="/productos"
          className="mt-8 inline-flex items-center justify-center border border-white px-8 py-4 font-mono text-sm uppercase tracking-wider transition-colors hover:bg-white hover:text-black"
        >
          Volver a Productos
        </Link>

        <div className="mt-16 text-left">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
            Recibo de tu Pedido
          </p>
          <div className="overflow-hidden border border-zinc-800">
            <OrderReceiptEmail order={order} />
          </div>
        </div>
      </main>
    </motion.div>
  );
}
