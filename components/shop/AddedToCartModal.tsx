"use client";

import { Check, X } from "lucide-react";
import { ProductImage } from "@/components/shop/ProductImage";
import type { Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AddedToCartModalProps {
  isOpen: boolean;
  product: Product | null;
  /** Unit price actually charged (may differ from product.price, e.g. ball volume pricing). Defaults to product.price. */
  unitPrice?: number;
  color: string;
  size: string;
  quantity: number;
  cartSubtotal: number;
  onClose: () => void;
  onGoToCart: () => void;
}

export function AddedToCartModal({
  isOpen,
  product,
  unitPrice,
  color,
  size,
  quantity,
  cartSubtotal,
  onClose,
  onGoToCart,
}: AddedToCartModalProps) {
  if (!isOpen || !product) return null;
  const effectiveUnitPrice = unitPrice ?? product.price;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md border border-zinc-800 bg-black p-6 text-white sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 border border-zinc-800 p-2 text-white transition-colors hover:bg-white hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="text-lg font-black uppercase tracking-tight">¡Añadido al Carrito!</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Successfully added to bag
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4 border-t border-zinc-800 pt-6">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="h-20 w-20 shrink-0"
            sizes="80px"
          />
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm font-bold">{product.name}</p>
            <p className="font-mono text-xs text-zinc-500">
              {color} · Talla {size} · Cant. {quantity}
            </p>
            <p className="mt-1 font-mono text-sm">${currency(effectiveUnitPrice * quantity)}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4 font-mono text-sm">
          <span className="uppercase tracking-wider text-zinc-500">Subtotal del Carrito</span>
          <span className="font-bold">${currency(cartSubtotal)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoToCart}
            className={cn(
              "flex w-full items-center justify-center gap-2 bg-white px-6 py-4 font-black uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
            )}
          >
            Ver Carrito
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 border border-zinc-800 px-6 py-3 font-mono text-xs uppercase tracking-wider text-zinc-400 transition-colors hover:border-white hover:text-white"
          >
            Seguir Comprando
          </button>
        </div>
      </div>
    </div>
  );
}
