import type { Metadata, Viewport } from "next";
import {
  Alegreya_Sans,
  Cinzel,
  Cinzel_Decorative,
  EB_Garamond,
} from "next/font/google";
import "./globals.css";

const body = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-brew-body",
  display: "swap",
});

const heading = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-brew-heading",
  display: "swap",
});

const display = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-brew-display",
  display: "swap",
});

const sans = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-brew-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forja de Manuales",
  description:
    "Editor Markdown local para maquetar aventuras y suplementos con el estilo de los manuales de D&D 5e.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/*
          Deliberadamente servido como archivo estático y no importado por el
          bundler: el exportador de HTML hace fetch de esta misma URL para
          incrustar los estilos en el archivo final, así que debe existir tal
          cual en /brew.css.
        */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/brew.css" />
      </head>
      <body
        className={`${body.variable} ${heading.variable} ${display.variable} ${sans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
