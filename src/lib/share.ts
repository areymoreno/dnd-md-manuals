import type { BrewDoc } from "./storage";

/**
 * Compartir un documento por enlace sin servidor: va comprimido dentro del
 * fragmento (`#`) de la URL, que el navegador **no** envía al servidor. Así el
 * texto no sale de la máquina de quien comparte más que hacia quien reciba el
 * enlace.
 *
 * Las imágenes no viajan: son blobs de IndexedDB y meterlas dispararía el
 * tamaño. Un documento con imágenes propias se comparte exportando el `.html`,
 * que sí las lleva incrustadas.
 */

const PREFIX = "#doc=";

/** Límite prudente: por encima, muchos navegadores y chats cortan la URL. */
export const MAX_URL_CHARS = 8000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function compress(input: string): Promise<Uint8Array> {
  const stream = new Blob([input])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

export interface SharedDoc {
  name: string;
  content: string;
  style?: string;
  pageSize?: BrewDoc["pageSize"];
  theme?: BrewDoc["theme"];
  pageNumbers?: boolean;
}

export async function encodeShare(doc: BrewDoc): Promise<string> {
  const payload: SharedDoc = {
    name: doc.name,
    content: doc.content,
    style: doc.style,
    pageSize: doc.pageSize,
    theme: doc.theme,
    pageNumbers: doc.pageNumbers,
  };
  return toBase64Url(await compress(JSON.stringify(payload)));
}

export async function decodeShare(fragment: string): Promise<SharedDoc | null> {
  try {
    const parsed = JSON.parse(await decompress(fromBase64Url(fragment)));
    if (typeof parsed?.content !== "string") return null;
    return parsed as SharedDoc;
  } catch {
    return null;
  }
}

export async function buildShareUrl(doc: BrewDoc): Promise<string> {
  const origin = `${window.location.origin}${window.location.pathname}`;
  return `${origin}${PREFIX}${await encodeShare(doc)}`;
}

/** Lee y limpia el enlace compartido de la URL, si lo hay. */
export function takeSharedFragment(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash.startsWith(PREFIX)) return null;

  const fragment = hash.slice(PREFIX.length);
  // Se quita de la barra: si no, recargar volvería a importar el documento.
  window.history.replaceState(null, "", window.location.pathname);
  return fragment;
}

/** ¿Está el navegador en condiciones de comprimir? (Safari < 16.4 no). */
export const canShare =
  typeof window !== "undefined" && typeof CompressionStream !== "undefined";
