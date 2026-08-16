"use client";

import dynamic from "next/dynamic";

/**
 * La app entera vive en el navegador: lee y escribe `localStorage` durante el
 * primer render, así que no debe prerenderizarse en el servidor.
 */
const BrewApp = dynamic(() => import("./BrewApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center text-sm text-[var(--chrome-muted)]">
      Encendiendo las antorchas…
    </div>
  ),
});

export default function BrewAppClient() {
  return <BrewApp />;
}
