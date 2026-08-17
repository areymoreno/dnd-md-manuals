export type PageSize = "letter" | "a4";
export type BrewTheme = "phb" | "dmg" | "limpio" | "grimorio" | "diario";
export type PageColumns = 2 | 3;

/**
 * Tamaño, tema y numeración viven en el documento, no en los ajustes: son
 * propiedades de la obra, no del escritorio. Así un manual en A4 y otro en
 * Carta pueden convivir sin pisarse. Son opcionales para que los documentos
 * guardados antes de este cambio sigan abriéndose.
 */
export interface BrewDoc {
  id: string;
  name: string;
  content: string;
  /** CSS propio del documento; ver `customCss.ts`. */
  style?: string;
  pageSize?: PageSize;
  theme?: BrewTheme;
  columns?: PageColumns;
  pageNumbers?: boolean;
  /** Número de la primera página; permite reiniciar la cuenta por secciones. */
  startPage?: number;
  /** Romanos para los preliminares. */
  numberStyle?: "arabic" | "roman";
  createdAt: number;
  updatedAt: number;
}

export const DOC_DEFAULTS = {
  pageSize: "letter" as PageSize,
  theme: "phb" as BrewTheme,
  columns: 2 as PageColumns,
  pageNumbers: true,
};

/** Ajustes del escritorio: cómo miras el documento, no cómo es el documento. */
export interface BrewSettings {
  view: "split" | "editor" | "preview" | "lectura";
  zoom: number;
  splitRatio: number;
  /** La vista previa sigue al cursor del editor. */
  syncScroll: boolean;
  /** Páginas enfrentadas, como un libro abierto. */
  spread: boolean;
  /** Marcas de corte y sangrado de 3 mm, para impresión bajo demanda. */
  printMarks: boolean;
  /** Corrector ortográfico del navegador en el editor. */
  spellcheck: boolean;
}

const DOCS_KEY = "dnd-markdown.docs.v1";
const ACTIVE_KEY = "dnd-markdown.active.v1";
const SETTINGS_KEY = "dnd-markdown.settings.v1";

export const DEFAULT_SETTINGS: BrewSettings = {
  view: "split",
  zoom: 0,
  splitRatio: 0.42,
  syncScroll: true,
  spread: false,
  printMarks: false,
  spellcheck: true,
};

/**
 * Traslada a cada documento el tamaño/tema/numeración que antes eran globales,
 * para que quien ya tuviera elegido A4 no se lo encuentre de pronto en Carta.
 */
export function migrateDocSettings(
  docs: BrewDoc[],
  legacy: Partial<Record<"pageSize" | "theme" | "pageNumbers", unknown>>,
): BrewDoc[] {
  const size = legacy.pageSize === "a4" ? "a4" : undefined;
  const theme = legacy.theme === "dmg" ? "dmg" : undefined;
  const numbers = legacy.pageNumbers === false ? false : undefined;
  if (!size && !theme && numbers === undefined) return docs;

  return docs.map((doc) => ({
    ...doc,
    pageSize: doc.pageSize ?? size,
    theme: doc.theme ?? theme,
    pageNumbers: doc.pageNumbers ?? numbers,
  }));
}

/** Lee los ajustes antiguos tal cual, para poder migrarlos una sola vez. */
export function loadLegacySettings(): Record<string, unknown> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const isBrowser = () => typeof window !== "undefined";

export function newId(): string {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `brew-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDoc(name = "Documento sin título", content = ""): BrewDoc {
  const now = Date.now();
  return { id: newId(), name, content, createdAt: now, updatedAt: now };
}

/** Copia un documento entero —estilo, papel, tema— con identidad nueva. */
export function duplicateDoc(doc: BrewDoc, name = `${doc.name} (copia)`): BrewDoc {
  const now = Date.now();
  return { ...doc, id: newId(), name, createdAt: now, updatedAt: now };
}

export function loadDocs(): BrewDoc[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (doc): doc is BrewDoc =>
        typeof doc?.id === "string" && typeof doc?.content === "string",
    );
  } catch {
    return null;
  }
}

export type SaveResult =
  | { ok: true; chars: number }
  | { ok: false; reason: "quota" | "error"; chars: number };

/**
 * Devuelve el resultado en vez de tragárselo. Un fallo silencioso aquí
 * significa seguir escribiendo sobre algo que ya no se está guardando.
 */
export function saveDocs(docs: BrewDoc[]): SaveResult {
  if (!isBrowser()) return { ok: true, chars: 0 };

  const payload = JSON.stringify(docs);
  const chars = payload.length;

  try {
    window.localStorage.setItem(DOCS_KEY, payload);
    return { ok: true, chars };
  } catch (error) {
    const quota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "error", chars };
  }
}

/**
 * El límite de localStorage se cuenta en caracteres, no en bytes: medido en
 * Chrome caben ~4,98 M caracteres tanto si escribes «x» como «é» o «☃». Contar
 * bytes UTF-8 o UTF-16 daría un aviso a mitad de camino, en un sentido o en el
 * otro, según cuántas tildes lleve el texto.
 */
export const STORAGE_BUDGET_CHARS = 4_900_000;

export function storageUsage(): { chars: number; ratio: number } {
  if (!isBrowser()) return { chars: 0, ratio: 0 };

  let chars = 0;
  for (const key of [DOCS_KEY, ACTIVE_KEY, SETTINGS_KEY]) {
    chars += (window.localStorage.getItem(key) ?? "").length;
  }
  return { chars, ratio: Math.min(1, chars / STORAGE_BUDGET_CHARS) };
}

export function loadActiveId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACTIVE_KEY, id);
}

export function loadSettings(): BrewSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: BrewSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function downloadFile(
  filename: string,
  contents: string,
  mime = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "brew"
  );
}

/* ------------------------------------------------------ copias de respaldo --- */

export interface Backup {
  format: "forja-de-manuales";
  version: 1;
  exportedAt: string;
  docs: BrewDoc[];
  /** Fragmentos propios; ver `userSnippets.ts`. */
  snippets?: unknown[];
}

export function buildBackup(docs: BrewDoc[], snippets: unknown[] = []): string {
  const backup: Backup = {
    format: "forja-de-manuales",
    version: 1,
    exportedAt: new Date().toISOString(),
    docs,
    snippets,
  };
  return JSON.stringify(backup, null, 2);
}

/** Lanza con un mensaje legible si el archivo no es una copia válida. */
export function readBackup(raw: string): BrewDoc[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El archivo no es JSON válido.");
  }

  const backup = parsed as Partial<Backup>;
  if (backup?.format !== "forja-de-manuales" || !Array.isArray(backup.docs)) {
    throw new Error("El archivo no es una copia de Forja de Manuales.");
  }

  const docs = backup.docs.filter(
    (doc): doc is BrewDoc =>
      typeof doc?.id === "string" &&
      typeof doc?.name === "string" &&
      typeof doc?.content === "string",
  );
  if (!docs.length) throw new Error("La copia no contiene documentos.");
  return docs;
}

/** Fusiona una copia con lo que ya hay, sin pisar nada: los ids repetidos entran como duplicado. */
export function mergeBackup(current: BrewDoc[], incoming: BrewDoc[]): BrewDoc[] {
  const taken = new Set(current.map((doc) => doc.id));
  const restored = incoming.map((doc) =>
    taken.has(doc.id) ? { ...doc, id: newId(), name: `${doc.name} (restaurado)` } : doc,
  );
  return [...restored, ...current];
}
