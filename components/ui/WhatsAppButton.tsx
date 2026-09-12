"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_PHONE_DIGITS = "50769922295";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_PHONE_DIGITS}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp: +507 6992-2295"
      className="group fixed bottom-6 right-6 z-[150] flex h-14 w-14 items-center justify-center rounded-full border border-black bg-black text-white shadow-lg transition-all duration-300 ease-out hover:scale-110 hover:bg-white hover:text-black"
    >
      <MessageCircle className="h-6 w-6 transition-colors duration-300" strokeWidth={1.75} />
    </a>
  );
}
