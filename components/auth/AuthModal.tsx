"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SignInAccountType, SignInProfile } from "@/types/auth";
import { cn } from "@/lib/utils";

const EMPTY_PERSON = { full_name: "", email: "", phone_number: "" };
const EMPTY_BUSINESS = {
  company_name: "",
  contact_person_name: "",
  phone_number: "",
  email: "",
  ruc: "",
  dv: "",
};

const PERSON_POST_SIGNIN_HREF = "/productos";
const BUSINESS_POST_SIGNIN_HREF = "/productos";

export function AuthModal() {
  const { isSignInOpen, closeSignIn, signIn } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState<SignInAccountType | null>(null);
  const [personForm, setPersonForm] = useState(EMPTY_PERSON);
  const [businessForm, setBusinessForm] = useState(EMPTY_BUSINESS);

  function reset() {
    setAccountType(null);
    setPersonForm(EMPTY_PERSON);
    setBusinessForm(EMPTY_BUSINESS);
  }

  function handleClose() {
    closeSignIn();
    reset();
  }

  function handleSubmit() {
    if (accountType === "person") {
      const profile: SignInProfile = { account_type: "person", ...personForm };
      signIn(profile);
      reset();
      router.push(PERSON_POST_SIGNIN_HREF);
    } else if (accountType === "business") {
      const profile: SignInProfile = { account_type: "business", ...businessForm };
      signIn(profile);
      reset();
      router.push(BUSINESS_POST_SIGNIN_HREF);
    }
  }

  const canSubmitPerson =
    personForm.full_name.trim() !== "" &&
    personForm.email.trim() !== "" &&
    personForm.phone_number.trim() !== "";

  const canSubmitBusiness = Object.values(businessForm).every((v) => v.trim() !== "");

  return (
    <AnimatePresence>
      {isSignInOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto border border-zinc-200 bg-white text-black"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  EQUIS
                </p>
                <h2 className="text-xl font-black uppercase tracking-tight">Iniciar Sesión</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="border border-zinc-200 p-2 transition-colors hover:bg-black hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {!accountType && (
                <div className="grid gap-4">
                  <p className="text-sm text-zinc-600">¿Eres una persona o una empresa?</p>

                  <button
                    type="button"
                    onClick={() => setAccountType("person")}
                    className="group flex items-center justify-between border border-black px-5 py-4 text-left transition-colors hover:bg-black hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <span className="font-mono text-sm uppercase tracking-wider">Persona</span>
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType("business")}
                    className="group flex items-center justify-between border border-black px-5 py-4 text-left transition-colors hover:bg-black hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      <span className="font-mono text-sm uppercase tracking-wider">Empresa</span>
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}

              {accountType === "person" && (
                <div className="grid gap-4">
                  <Field
                    label="Nombre Completo"
                    value={personForm.full_name}
                    onChange={(v) => setPersonForm((f) => ({ ...f, full_name: v }))}
                    placeholder="Ana Torres"
                  />
                  <Field
                    label="Correo Electrónico"
                    type="email"
                    value={personForm.email}
                    onChange={(v) => setPersonForm((f) => ({ ...f, email: v }))}
                    placeholder="ana@correo.com"
                  />
                  <Field
                    label="Teléfono"
                    mono
                    value={personForm.phone_number}
                    onChange={(v) => setPersonForm((f) => ({ ...f, phone_number: v }))}
                    placeholder="+507 6000-0000"
                  />
                </div>
              )}

              {accountType === "business" && (
                <div className="grid gap-4">
                  <Field
                    label="Razón Social"
                    value={businessForm.company_name}
                    onChange={(v) => setBusinessForm((f) => ({ ...f, company_name: v }))}
                    placeholder="Distribuidora Deportiva S.A."
                  />
                  <Field
                    label="Persona de Contacto"
                    value={businessForm.contact_person_name}
                    onChange={(v) => setBusinessForm((f) => ({ ...f, contact_person_name: v }))}
                    placeholder="Julián Ríos"
                  />
                  <Field
                    label="Teléfono"
                    mono
                    value={businessForm.phone_number}
                    onChange={(v) => setBusinessForm((f) => ({ ...f, phone_number: v }))}
                    placeholder="+507 6000-0000"
                  />
                  <Field
                    label="Correo Electrónico"
                    type="email"
                    value={businessForm.email}
                    onChange={(v) => setBusinessForm((f) => ({ ...f, email: v }))}
                    placeholder="compras@empresa.com"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="RUC"
                      mono
                      value={businessForm.ruc}
                      onChange={(v) => setBusinessForm((f) => ({ ...f, ruc: v }))}
                      placeholder="155632158-2-2016"
                    />
                    <Field
                      label="DV"
                      mono
                      value={businessForm.dv}
                      onChange={(v) => setBusinessForm((f) => ({ ...f, dv: v }))}
                      placeholder="59"
                    />
                  </div>
                </div>
              )}
            </div>

            {accountType && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setAccountType(null)}
                  className="flex items-center gap-2 border border-zinc-200 px-4 py-2 font-mono text-xs uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={accountType === "person" ? !canSubmitPerson : !canSubmitBusiness}
                  className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-xs uppercase tracking-wider text-white disabled:opacity-30"
                >
                  Iniciar Sesión
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black",
          mono && "font-mono"
        )}
      />
    </label>
  );
}
