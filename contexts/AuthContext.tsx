"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SignInProfile } from "@/types/auth";

const STORAGE_KEY = "equisUserProfile";

interface AuthContextValue {
  profile: SignInProfile | null;
  isSignInOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  signIn: (profile: SignInProfile) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sign-in state persists in localStorage indefinitely — there is no expiry
 * timer, idle timeout, or auto sign-out anywhere in this provider. The user
 * stays signed in, on whatever page they're on, until they explicitly sign
 * out themselves.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SignInProfile | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setProfile(JSON.parse(stored) as SignInProfile);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isSignInOpen,
      openSignIn: () => setIsSignInOpen(true),
      closeSignIn: () => setIsSignInOpen(false),
      signIn: (nextProfile) => {
        setProfile(nextProfile);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
        setIsSignInOpen(false);
      },
      signOut: () => {
        setProfile(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [profile, isSignInOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
