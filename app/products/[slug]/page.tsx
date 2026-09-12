"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { ProductImage } from "@/components/shop/ProductImage";
import { AddedToCartModal } from "@/components/shop/AddedToCartModal";
import { useCart } from "@/contexts/CartContext";
import { ballUnitPrice, PRODUCTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem, subtotal, openCart } = useCart();

  const product = PRODUCTS.find((p) => p.id === params.slug);
  const colorSiblings = product ? PRODUCTS.filter((p) => p.groupId === product.groupId) : [];

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [showAddedModal, setShowAddedModal] = useState(false);

  // Variant-dependent state must reset whenever the underlying product
  // changes (e.g. clicking a different color swatch navigates to a
  // different slug but reuses this same component instance).
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setSizeError(false);
  }, [params.slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderNav />
        <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4 pb-24 pt-48 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Producto no encontrado</h1>
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

  const unitPrice = ballUnitPrice(product, quantity);
  const hasBallDiscount = unitPrice < product.price;

  function handleAddToCart() {
    if (!product || product.soldOut) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem(product, quantity, { color: product.colorName, size: selectedSize });
    setShowAddedModal(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-black text-white"
    >
      <HeaderNav />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className="aspect-square w-full"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />

          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                {product.category}
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight lg:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 flex items-baseline gap-2 font-mono text-lg">
                {hasBallDiscount ? (
                  <>
                    <span className="text-zinc-500 line-through">${currency(product.price)}</span>
                    <span className="text-white">${currency(unitPrice)}</span>
                  </>
                ) : (
                  <span className="text-zinc-300">${currency(product.price)}</span>
                )}
              </p>
              {product.soldOut && (
                <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-red-600">
                  Agotado
                </p>
              )}
            </div>

            <p className="text-sm leading-relaxed text-zinc-400">{product.description}</p>

            {colorSiblings.length > 1 && (
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
                  Color: <span className="text-white">{product.colorName}</span>
                </p>
                <div className="flex gap-3">
                  {colorSiblings.map((sibling) => (
                    <button
                      key={sibling.id}
                      type="button"
                      onClick={() => {
                        if (sibling.id !== product.id) router.push(`/products/${sibling.id}`);
                      }}
                      aria-label={sibling.colorName}
                      aria-pressed={sibling.id === product.id}
                      style={{ backgroundColor: sibling.colorHex }}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition-all",
                        sibling.id === product.id
                          ? "border-white ring-2 ring-white ring-offset-2 ring-offset-black"
                          : "border-zinc-700 hover:border-zinc-400"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
                Talla{selectedSize ? `: ${selectedSize}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={cn(
                      "min-w-[3rem] border px-4 py-3 font-mono text-sm uppercase tracking-wider transition-colors",
                      selectedSize === size
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 text-white hover:border-zinc-500"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="mt-2 font-mono text-xs text-red-400">Por favor selecciona una talla</p>
              )}
            </div>

            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-zinc-500">Cantidad</p>
              <div className="flex w-fit items-center border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Disminuir cantidad"
                  className="px-4 py-3 text-white transition-colors hover:bg-white hover:text-black"
                >
                  −
                </button>
                <span className="w-12 text-center font-mono text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar cantidad"
                  className="px-4 py-3 text-white transition-colors hover:bg-white hover:text-black"
                >
                  +
                </button>
              </div>
              {product.category === "Balones" && (
                <p className="mt-2 font-mono text-xs text-zinc-500">
                  5+ balones: ${currency(20)}/balón · 15+ balones: ${currency(18)}/balón
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.soldOut}
              className="mt-2 flex w-full items-center justify-center gap-2 bg-white px-6 py-4 font-black uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.soldOut ? "Agotado" : "Agregar al Carrito"}
            </button>
          </div>
        </div>
      </main>

      <AddedToCartModal
        isOpen={showAddedModal}
        product={product}
        unitPrice={unitPrice}
        color={product.colorName}
        size={selectedSize ?? ""}
        quantity={quantity}
        cartSubtotal={subtotal}
        onClose={() => setShowAddedModal(false)}
        onGoToCart={() => {
          setShowAddedModal(false);
          openCart();
        }}
      />
    </motion.div>
  );
}
