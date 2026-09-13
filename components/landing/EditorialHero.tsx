"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EquisLogo } from "@/components/shared/EquisLogo";

interface HeroTile {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image?: string;
  comingSoon?: boolean;
}

const TILES: HeroTile[] = [
  {
    title: "EQUIPAMIENTO EQUIS",
    subtitle: "Balones Oficiales de Partido",
    cta: "VER EQUIPAMIENTO",
    href: "/productos?category=elite",
    image: "/balon-tamano-5.png",
  },
  {
    title: "EQUIS PERFORMANCE",
    subtitle: "Ropa y equipamiento individual",
    cta: "COMPRAR INDIVIDUAL",
    href: "/productos?category=ropa",
    comingSoon: true,
  },
];

export function EditorialHero() {
  return (
    <section className="grid grid-cols-1 gap-1 pt-32 md:grid-cols-2 md:h-[85vh]">
      {TILES.map((tile) =>
        tile.comingSoon ? (
          <div
            key={tile.title}
            className="flex h-[70vh] flex-col items-center justify-center gap-6 bg-white p-8 md:h-full md:p-10"
          >
            <EquisLogo size={96} className="w-24" invert />
            <h2 className="text-3xl font-black uppercase tracking-tight text-black lg:text-4xl">
              Performance
            </h2>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-zinc-500">
              Coming Soon...
            </p>
          </div>
        ) : (
          <Link
            key={tile.title}
            href={tile.href}
            className="group relative flex h-[70vh] flex-col justify-end overflow-hidden bg-zinc-900 p-8 md:h-full md:p-10"
          >
            {tile.image && (
              <Image
                src={tile.image}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            <div className="relative z-10 text-white">
              <h2 className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
                {tile.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-300">{tile.subtitle}</p>
              <span className="mt-6 inline-flex items-center gap-2 border border-white px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors group-hover:bg-white group-hover:text-black">
                {tile.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        )
      )}
    </section>
  );
}
