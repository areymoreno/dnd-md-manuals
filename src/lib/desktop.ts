/**
 * Puente con la app de escritorio. En el navegador estas funciones no existen,
 * así que todo lo que hay aquí devuelve `null` o `false` y la web sigue
 * imprimiendo con el diálogo del navegador de siempre.
 */

export interface PdfOptions {
  nombre: string;
  anchoCm: number;
  altoCm: number;
}

interface ForjaBridge {
  esEscritorio: true;
  exportarPdf: (
    options: PdfOptions,
  ) => Promise<{ ok: boolean; motivo?: string; ruta?: string }>;
  alExportarPdf: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    forja?: ForjaBridge;
  }
}

export const bridge = (): ForjaBridge | null =>
  typeof window !== "undefined" && window.forja ? window.forja : null;

export const isDesktop = (): boolean => bridge() !== null;

/** Medidas del papel en centímetros, marcas de corte incluidas. */
export function paperSize(
  pageSize: "letter" | "a4",
  printMarks: boolean,
): { anchoCm: number; altoCm: number } {
  const [ancho, alto] = pageSize === "a4" ? [21, 29.7] : [21.59, 27.94];
  const extra = printMarks ? 1.6 : 0;
  return { anchoCm: ancho + extra, altoCm: alto + extra };
}
