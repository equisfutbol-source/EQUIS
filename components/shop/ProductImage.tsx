"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  theme?: "dark" | "light";
  fit?: "cover" | "contain";
}

export function ProductImage({
  src,
  alt,
  className,
  sizes,
  theme = "dark",
  fit = "cover",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const isLight = theme === "light";

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          isLight ? "bg-zinc-100" : "bg-zinc-900",
          className
        )}
      >
        <ImageOff className={cn("h-8 w-8", isLight ? "text-zinc-300" : "text-zinc-700")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isLight ? "bg-zinc-100" : "bg-zinc-900",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        onError={() => setFailed(true)}
        className={fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
