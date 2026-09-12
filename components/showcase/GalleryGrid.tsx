"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { ProductImage } from "@/components/shop/ProductImage";
import { GalleryModal } from "@/components/showcase/GalleryModal";
import { GALLERY_ITEMS, type GalleryItem } from "@/lib/showcase-data";

export function GalleryGrid() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedItem(item)}
            className="group flex flex-col border border-zinc-800 bg-black text-left transition-colors hover:border-zinc-600"
          >
            {item.image ? (
              <ProductImage
                src={item.image}
                alt={item.teamName}
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                fit="contain"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-900">
                <ImageOff className="h-8 w-8 text-zinc-700" />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="w-fit border border-zinc-700 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                {item.teamName}
              </span>
              <p className="text-sm text-zinc-300">{item.equipmentSpec}</p>
            </div>
          </button>
        ))}
      </div>

      <GalleryModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
