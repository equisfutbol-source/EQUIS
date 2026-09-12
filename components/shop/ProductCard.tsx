"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/shop/ProductImage";
import type { Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  theme?: "dark" | "light";
}

export function ProductCard({ product, theme = "light" }: ProductCardProps) {
  const isLight = theme === "light";

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group flex flex-col border",
        isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-black"
      )}
    >
      <ProductImage
        src={product.images[0]}
        alt={product.name}
        className="aspect-square w-full"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        theme={theme}
      />
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3
            className={cn(
              "text-lg font-black uppercase tracking-tight",
              isLight ? "text-black" : "text-white"
            )}
          >
            {product.name}
          </h3>
          <p className={cn("mt-1 font-mono text-sm", isLight ? "text-zinc-600" : "text-zinc-300")}>
            ${product.price.toFixed(2)}
          </p>
          {product.soldOut && (
            <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-red-600">
              Agotado
            </p>
          )}
        </div>
        <span
          className={cn(
            "mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider",
            isLight ? "text-zinc-500 group-hover:text-black" : "text-zinc-500 group-hover:text-white"
          )}
        >
          Ver Producto
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
