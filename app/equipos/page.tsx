"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { ClientLogos } from "@/components/showcase/ClientLogos";
import { GalleryGrid } from "@/components/showcase/GalleryGrid";

export default function EquiposPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-black text-white"
    >
      <HeaderNav />

      <main className="pt-32">
        <div className="border-b border-zinc-800 px-4 py-10 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
            Social Proof
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight lg:text-5xl">
            Equipos Equis
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Clubes, colegios y academias que confían en nuestro equipamiento en la cancha.
          </p>
        </div>

        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <ClientLogos />
        </div>

        <div className="border-t border-zinc-800 px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
            Galería Destacada
          </p>
          <GalleryGrid />
        </div>

        <div className="border-t border-zinc-800 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
            Equipa a tu Club con Calidad Profesional
          </h2>
          <Link
            href="/productos"
            className="group mt-8 inline-flex items-center gap-2 border border-white px-8 py-4 font-mono text-sm uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
          >
            Ver Productos
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </motion.div>
  );
}
