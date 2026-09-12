"use client";

import type { ReactNode } from "react";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ModeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <WhatsAppButton />
        </CartProvider>
      </AuthProvider>
    </ModeProvider>
  );
}
