import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EQUIS | Distribuidor de Equipo Deportivo",
  description:
    "EQUIS — distribuidor premier de equipo deportivo en Panamá para atletas individuales y compras corporativas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
