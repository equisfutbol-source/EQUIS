"use client";

import { motion } from "framer-motion";
import { EquisLogo } from "@/components/shared/EquisLogo";
import { cn } from "@/lib/utils";

interface LogoSplashOverlayProps {
  /** "dark" = black bg with the white logo mark; "light" = white bg with the logo inverted to black. */
  theme?: "dark" | "light";
}

export function LogoSplashOverlay({ theme = "dark" }: LogoSplashOverlayProps) {
  const isLight = theme === "light";

  return (
    <motion.div
      key="logo-splash-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        isLight ? "bg-equis-white" : "bg-equis-black"
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        <EquisLogo
          size={180}
          className="w-32 sm:w-44"
          textClassName={cn("text-4xl sm:text-6xl", isLight && "text-equis-black")}
          invert={isLight}
        />
      </motion.div>
    </motion.div>
  );
}
