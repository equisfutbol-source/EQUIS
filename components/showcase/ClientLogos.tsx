"use client";

import { useState } from "react";
import Image from "next/image";
import { CLIENT_LOGOS, type ClientLogo } from "@/lib/showcase-data";

export function ClientLogos() {
  const track = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <div
      className="group relative overflow-hidden border-y border-zinc-800"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {track.map((client, index) => (
          <ClientLogoTile key={`${client.name}-${index}`} client={client} />
        ))}
      </div>
    </div>
  );
}

function ClientLogoTile({ client }: { client: ClientLogo }) {
  const [failed, setFailed] = useState(false);
  const showImage = client.image && !failed;

  return (
    <div className="flex h-44 w-80 shrink-0 items-center justify-center border-r border-zinc-800 bg-black px-8 transition-colors hover:border-r-zinc-600">
      {showImage ? (
        <div className="relative h-32 w-full">
          <Image
            src={client.image as string}
            alt={client.name}
            fill
            sizes="280px"
            className="object-contain"
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <span className="text-center font-mono text-[11px] uppercase leading-tight tracking-wider text-zinc-400">
          {client.name}
        </span>
      )}
    </div>
  );
}
