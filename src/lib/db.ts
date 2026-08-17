/**
 * Única puerta a IndexedDB. Todo lo que no cabe en `localStorage` —imágenes y
 * versiones guardadas— vive aquí.
 *
 * Importa que la apertura esté centralizada: si dos módulos abrieran la misma
 * base con números de versión distintos, el segundo dispararía un
 * `versionchange` sobre el primero y una de las dos conexiones se quedaría
 * bloqueada.
 */

const DB_NAME = "dnd-markdown";
const DB_VERSION = 2;

export const IMAGES = "images";
export const SNAPSHOTS = "snapshots";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGES)) {
        db.createObjectStore(IMAGES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SNAPSHOTS)) {
        const store = db.createObjectStore(SNAPSHOTS, { keyPath: "id" });
        store.createIndex("docId", "docId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Ejecuta una operación sobre un almacén y cierra la conexión al terminar. */
export function run<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = action(tx.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      }),
  );
}

export function newShortId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
