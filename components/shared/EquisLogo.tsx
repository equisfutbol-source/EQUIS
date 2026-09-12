"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EquisLogoProps {
  className?: string;
  textClassName?: string;
  size?: number;
  /** The source asset is a white mark on a transparent background; invert it to show on light surfaces. */
  invert?: boolean;
}

export function EquisLogo({ className, textClassName, size = 36, invert = false }: EquisLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "font-mono font-black uppercase tracking-[0.3em] text-current",
          textClassName
        )}
      >
        E Q U I S
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="EQUIS"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("h-auto w-auto", invert && "invert", className)}
    />
  );
}
