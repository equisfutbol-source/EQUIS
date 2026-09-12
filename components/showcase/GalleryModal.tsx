"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageOff, Quote, X } from "lucide-react";
import { ProductImage } from "@/components/shop/ProductImage";
import type { GalleryItem } from "@/lib/showcase-data";

interface GalleryModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

export function GalleryModal({ item, onClose }: GalleryModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto border border-zinc-800 bg-black text-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                Equipos Equis
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="border border-zinc-800 p-2 transition-colors hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {item.image ? (
              <ProductImage
                src={item.image}
                alt={item.teamName}
                className="aspect-[4/5] w-full"
                sizes="(min-width: 768px) 672px, 100vw"
                fit="contain"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-zinc-900">
                <ImageOff className="h-8 w-8 text-zinc-700" />
              </div>
            )}

            <div className="flex flex-col gap-4 p-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{item.teamName}</h2>
                <p className="mt-1 font-mono text-sm text-zinc-400">{item.equipmentSpec}</p>
              </div>

              {item.quote && (
                <div className="flex gap-3 border border-zinc-800 bg-zinc-950 p-4">
                  <Quote className="h-5 w-5 shrink-0 text-zinc-600" />
                  <div>
                    <p className="text-sm italic text-zinc-300">&ldquo;{item.quote}&rdquo;</p>
                    {item.quoteAuthor && (
                      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-zinc-500">
                        {item.quoteAuthor}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
