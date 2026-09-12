"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { EquisLogo } from "@/components/shared/EquisLogo";
import { ProductImage } from "@/components/shop/ProductImage";
import { useMode } from "@/contexts/ModeContext";
import { useCart } from "@/contexts/CartContext";
import { cartLineKey } from "@/types/cart";
import { cn } from "@/lib/utils";

const currency = (value: number) =>
  value.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CATEGORIES = [{ label: "Equipos Equis", href: "/equipos" }];

export function HeaderNav() {
  const { mode } = useMode();
  const isDark = mode === "atleta";
  const { items, itemCount, subtotal, isCartOpen, openCart, closeCart, removeItem, updateQuantity } =
    useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.style.transition = "padding-top 0.25s ease-out";
    document.body.style.paddingTop = isMenuOpen ? `${mobileNavRef.current?.scrollHeight ?? 0}px` : "0px";

    return () => {
      document.body.style.paddingTop = "0px";
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center bg-black px-4 text-center font-mono text-[11px] tracking-wide text-zinc-300">
        <p className="truncate">
          🇵🇦 Envíos a todo Panamá&nbsp;|&nbsp;Cotizaciones institucionales con RUC &amp; DV
        </p>
      </div>

      <header
        className={cn(
          "fixed inset-x-0 top-8 z-50 border-b transition-colors duration-300",
          isDark
            ? "border-zinc-800 bg-equis-black text-equis-white"
            : "border-zinc-200 bg-equis-white text-equis-black"
        )}
      >
        <div className="mx-auto flex h-24 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Ir al inicio" className="shrink-0">
            <EquisLogo size={64} className="w-16" textClassName="text-3xl" invert={!isDark} />
          </Link>

          <nav className="hidden items-center gap-8 font-mono text-base uppercase tracking-wider lg:flex">
            {CATEGORIES.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className={cn(
                  "transition-colors",
                  isDark ? "text-equis-light hover:text-equis-white" : "text-equis-zinc hover:text-equis-black"
                )}
              >
                {category.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              className={cn(
                "flex items-center gap-2 border p-3 transition-colors lg:hidden",
                isDark
                  ? "border-zinc-800 text-equis-white hover:bg-equis-white hover:text-equis-black"
                  : "border-zinc-200 text-equis-black hover:bg-equis-black hover:text-equis-white"
              )}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <label
              className={cn(
                "hidden items-center gap-2 border px-4 py-3 md:flex",
                isDark ? "border-zinc-800" : "border-zinc-200"
              )}
            >
              <Search className={cn("h-5 w-5", isDark ? "text-equis-light" : "text-equis-zinc")} />
              <input
                type="search"
                placeholder="Buscar productos..."
                className={cn(
                  "w-48 bg-transparent text-base outline-none placeholder:text-zinc-500",
                  isDark ? "text-equis-white" : "text-equis-black"
                )}
              />
            </label>

            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrito"
              className={cn(
                "relative flex items-center gap-2 border p-3 transition-colors",
                isDark
                  ? "border-zinc-800 text-equis-white hover:bg-equis-white hover:text-equis-black"
                  : "border-zinc-200 text-equis-black hover:bg-equis-black hover:text-equis-white"
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center px-1 font-mono text-xs font-bold",
                    isDark ? "bg-white text-black" : "bg-black text-white"
                  )}
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed inset-x-0 top-32 z-40 overflow-hidden border-b lg:hidden",
              isDark ? "border-zinc-800 bg-equis-black" : "border-zinc-200 bg-equis-white"
            )}
          >
            <nav
              ref={mobileNavRef}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8"
            >
              {CATEGORIES.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider transition-colors",
                    isDark ? "text-equis-light hover:text-equis-white" : "text-equis-zinc hover:text-equis-black"
                  )}
                >
                  {category.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70"
            onClick={closeCart}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-zinc-200 bg-white text-black"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Tu Carrito {itemCount > 0 && `(${itemCount})`}
                </h2>
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Cerrar carrito"
                  className="border border-zinc-200 p-2 transition-colors hover:bg-black hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <ShoppingCart className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm text-zinc-500">Tu carrito está vacío.</p>
                  <Link
                    href="/productos"
                    onClick={closeCart}
                    className="mt-2 border border-black px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-black hover:text-white"
                  >
                    Explorar Productos
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
                    {items.map((item) => {
                      const variant = { color: item.color, size: item.size };
                      return (
                        <div key={cartLineKey(item)} className="flex gap-3 border-b border-zinc-100 pb-4">
                          {item.image ? (
                            <ProductImage
                              src={item.image}
                              alt={item.name}
                              className="h-16 w-16 shrink-0"
                              sizes="64px"
                              theme="light"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-zinc-100">
                              <ShoppingCart className="h-5 w-5 text-zinc-300" />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col gap-1">
                            <p className="text-sm font-bold">{item.name}</p>
                            {(item.color || item.size) && (
                              <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                                {[item.color, item.size].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            <p className="font-mono text-xs text-zinc-500">${currency(item.unitPrice)}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <div className="flex items-center border border-zinc-200">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1, variant)}
                                  aria-label="Disminuir cantidad"
                                  className="p-1.5 text-black transition-colors hover:bg-black hover:text-white"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center font-mono text-xs">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1, variant)}
                                  aria-label="Aumentar cantidad"
                                  className="p-1.5 text-black transition-colors hover:bg-black hover:text-white"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId, variant)}
                                aria-label={`Quitar ${item.name}`}
                                className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-black"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-zinc-200 px-6 py-4">
                    <div className="mb-4 flex items-center justify-between font-mono text-sm">
                      <span className="uppercase tracking-wider text-zinc-500">Subtotal</span>
                      <span className="font-bold">${currency(subtotal)}</span>
                    </div>
                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="flex w-full items-center justify-center bg-black px-6 py-4 font-mono text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                    >
                      Ir a Pagar
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
