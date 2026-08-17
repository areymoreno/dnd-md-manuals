import { newShortId, run, SNAPSHOTS } from "./db";
import type { BrewDoc } from "./storage";

/**
 * Copias con fecha de un documento. Deshacer solo vive en la sesión: en cuanto
 * recargas, lo escrito hace media hora ya no tiene vuelta atrás. Esto la da.
 *
 * Van en IndexedDB por lo mismo que las imágenes: en `localStorage` se comerían
 * el presupuesto del propio documento.
 */
export interface Snapshot {
  id: string;
  docId: string;
  /** Nombre del documento cuando se guardó, para reconocerlo tras renombrar. */
  docName: string;
  content: string;
  style?: string;
  createdAt: number;
  /** `false` cuando la pediste tú desde el menú. */
  auto: boolean;
}

export type SnapshotMeta = Omit<Snapshot, "content" | "style">;

/** Automáticas que se conservan por documento; las manuales no se tocan. */
export const AUTO_LIMIT = 15;

/** Tiempo mínimo entre automáticas. */
export const AUTO_INTERVAL_MS = 5 * 60 * 1000;

export async function listSnapshots(docId: string): Promise<Snapshot[]> {
  const all = await run<Snapshot[]>(SNAPSHOTS, "readonly", (store) =>
    store.index("docId").getAll(docId),
  );
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSnapshot(id: string): Promise<Snapshot | undefined> {
  return run<Snapshot | undefined>(SNAPSHOTS, "readonly", (store) =>
    store.get(id),
  );
}

export async function deleteSnapshot(id: string): Promise<void> {
  await run(SNAPSHOTS, "readwrite", (store) => store.delete(id));
}

/**
 * Guarda una versión si merece la pena. Devuelve `null` cuando no se guardó
 * nada, para que quien llame no anuncie una copia que no existe.
 */
export async function takeSnapshot(
  doc: BrewDoc,
  { auto = true }: { auto?: boolean } = {},
): Promise<Snapshot | null> {
  const existing = await listSnapshots(doc.id);
  const last = existing[0];

  // Nada que guardar si el texto no ha cambiado desde la última.
  if (last && last.content === doc.content && last.style === doc.style) {
    return null;
  }
  // Las automáticas se espacian; las manuales van siempre.
  if (auto && last?.auto && Date.now() - last.createdAt < AUTO_INTERVAL_MS) {
    return null;
  }

  const snapshot: Snapshot = {
    id: newShortId(),
    docId: doc.id,
    docName: doc.name,
    content: doc.content,
    style: doc.style,
    createdAt: Date.now(),
    auto,
  };
  await run(SNAPSHOTS, "readwrite", (store) => store.put(snapshot));

  // Poda: solo se van las automáticas más viejas.
  const autos = [snapshot, ...existing].filter((item) => item.auto);
  for (const stale of autos.slice(AUTO_LIMIT)) {
    await deleteSnapshot(stale.id);
  }

  return snapshot;
}

/** Borra las versiones de un documento que ya no existe. */
export async function purgeSnapshots(docId: string): Promise<void> {
  for (const snapshot of await listSnapshots(docId)) {
    await deleteSnapshot(snapshot.id);
  }
}

export function describeAge(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return "hace un momento";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}
