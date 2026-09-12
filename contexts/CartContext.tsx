"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ballUnitPrice, PRODUCTS, type Product } from "@/lib/mock-data";
import { cartLineKey, type CartItem } from "@/types/cart";

const STORAGE_KEY = "equisCart";

export interface CartVariant {
  color?: string;
  size?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number, variant?: CartVariant) => void;
  removeItem: (productId: string, variant?: CartVariant) => void;
  updateQuantity: (productId: string, quantity: number, variant?: CartVariant) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hasHydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      addItem: (product, quantity = 1, variant) => {
        setItems((current) => {
          const key = cartLineKey({ productId: product.id, ...variant });
          const existing = current.find((item) => cartLineKey(item) === key);
          if (existing) {
            const newQuantity = existing.quantity + quantity;
            return current.map((item) =>
              cartLineKey(item) === key
                ? { ...item, quantity: newQuantity, unitPrice: ballUnitPrice(product, newQuantity) }
                : item
            );
          }
          return [
            ...current,
            {
              productId: product.id,
              name: product.name,
              sku: product.sku,
              unitPrice: ballUnitPrice(product, quantity),
              image: product.images[0],
              quantity,
              color: variant?.color,
              size: variant?.size,
            },
          ];
        });
      },
      removeItem: (productId, variant) => {
        const key = cartLineKey({ productId, ...variant });
        setItems((current) => current.filter((item) => cartLineKey(item) !== key));
      },
      updateQuantity: (productId, quantity, variant) => {
        const key = cartLineKey({ productId, ...variant });
        setItems((current) =>
          quantity <= 0
            ? current.filter((item) => cartLineKey(item) !== key)
            : current.map((item) => {
                if (cartLineKey(item) !== key) return item;
                const product = PRODUCTS.find((p) => p.id === item.productId);
                const unitPrice = product ? ballUnitPrice(product, quantity) : item.unitPrice;
                return { ...item, quantity, unitPrice };
              })
        );
      },
      clearCart: () => setItems([]),
    };
  }, [items, isCartOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
