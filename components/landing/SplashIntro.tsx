"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LogoSplashOverlay } from "@/components/shared/LogoSplashOverlay";

const STORAGE_KEY = "hasSeenEquisIntro";

export function SplashIntro({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const hasSeenIntro = window.localStorage.getItem(STORAGE_KEY) === "true";
    setShowSplash(!hasSeenIntro);
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!showSplash) return;

    const timeout = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, "true");
      setShowSplash(false);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>{hasMounted && showSplash && <LogoSplashOverlay />}</AnimatePresence>
      {children}
    </>
  );
}
