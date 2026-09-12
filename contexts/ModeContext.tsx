"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type StoreMode = "atleta" | "equipo";

interface ModeContextValue {
  mode: StoreMode;
  setMode: (mode: StoreMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StoreMode>("atleta");

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === "atleta" ? "equipo" : "atleta")),
    }),
    [mode]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return ctx;
}
