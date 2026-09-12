"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { ProductCard } from "@/components/shop/ProductCard";
import { PRODUCTS } from "@/lib/mock-data";

const CATEGORY_COPY: Record<string, { eyebrow: string; title: string }> = {
  ropa: { eyebrow: "Equis Performance", title: "Ropa de Entrenamiento" },
  elite: { eyebrow: "Equipamiento Equis", title: "Balones y Accesorios Pro" },
};

export default function ProductosPage() {
  return (
    <Suspense fallback={null}>
      <ProductosPageContent />
    </Suspense>
  );
}

function ProductosPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const products =
    category === "elite"
      ? PRODUCTS.filter((product) => product.category !== "Ropa")
      : PRODUCTS.filter((product) => product.category === "Ropa");

  const copy = category === "elite" ? CATEGORY_COPY.elite : CATEGORY_COPY.ropa;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-black text-white"
    >
      <HeaderNav />

      <main className="pt-32">
        <div className="border-b border-zinc-800 px-4 py-10 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white lg:text-5xl">
            {copy.title}
          </h1>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-24 text-center">
            <p className="text-lg font-black uppercase tracking-tight">Próximamente</p>
            <p className="text-sm text-zinc-400">Esta categoría no tiene productos disponibles todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}
