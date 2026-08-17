/**
 * Las imágenes van en IndexedDB, no en localStorage: allí caben megabytes y se
 * guardan como Blob, sin el 33 % que engorda base64.
 */

import { IMAGES, newShortId, run as runTx } from "./db";

export interface StoredImage {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  blob: Blob;
}

export type ImageMeta = Omit<StoredImage, "blob">;

const run = <T,>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) => runTx<T>(IMAGES, mode, action);

export async function putImage(file: File | Blob, name: string): Promise<StoredImage> {
  const record: StoredImage = {
    id: newShortId(),
    name,
    type: file.type || "image/png",
    size: file.size,
    createdAt: Date.now(),
    blob: file,
  };
  await run("readwrite", (store) => store.put(record));
  return record;
}

export async function getAllImages(): Promise<StoredImage[]> {
  const all = await run<StoredImage[]>("readonly", (store) => store.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteImage(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
}

/** Data URI, para incrustar la imagen en el HTML exportado. */
export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Lado mayor al que se reduce una imagen. Una página son 816 px de ancho, así
 * que 2200 da margen de sobra para imprimir a 2,5× sin que se vea el pixelado.
 */
const MAX_EDGE = 2200;

/** No se tocan por debajo de esto: recomprimir solo añadiría artefactos. */
const MIN_BYTES = 300 * 1024;

/** Formatos que se dejan intactos y por qué. */
const KEEP_AS_IS: Record<string, string> = {
  "image/svg+xml": "es vectorial",
  "image/gif": "podría estar animado",
};

export interface PreparedImage {
  blob: Blob;
  /** Explicación corta de qué se hizo, para poder contárselo a quien la suelta. */
  note: string | null;
}

/**
 * Reduce y recomprime una imagen grande antes de guardarla. Un PNG de cámara
 * ocupa lo mismo en IndexedDB que en disco, y al exportar a HTML se convierte
 * en base64, que engorda otro 33 %.
 *
 * Solo sustituye el original si de verdad sale más pequeño.
 */
export async function prepareImage(file: File | Blob): Promise<PreparedImage> {
  const type = file.type || "image/png";

  if (KEEP_AS_IS[type]) {
    return { blob: file, note: null };
  }
  if (file.size < MIN_BYTES) {
    return { blob: file, note: null };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return { blob: file, note: null };
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const encoded = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!encoded || encoded.size >= file.size) {
      return { blob: file, note: null };
    }

    const saved = Math.round((1 - encoded.size / file.size) * 100);
    const resized = scale < 1 ? `${width}×${height}, ` : "";
    return {
      blob: encoded,
      note: `${resized}${formatBytes(file.size)} → ${formatBytes(encoded.size)} (−${saved} %)`,
    };
  } catch {
    // Si el navegador no sabe decodificarla, se guarda tal cual.
    return { blob: file, note: null };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
