import { extractOutline, type OutlineEntry } from "./outline";

/**
 * Pasada previa sobre el documento entero. La paginación es determinista
 * —los saltos los pones tú con `\page`—, así que se puede saber en qué página
 * cae cada encabezado, ancla y término *antes* de renderizar, y con eso montar
 * índices y referencias con números que no hay que escribir a mano.
 */

export interface IndexTerm {
  term: string;
  pages: number[];
}

export interface DocScan {
  outline: OutlineEntry[];
  /** id de ancla → página en la que está. */
  anchors: Record<string, number>;
  terms: IndexTerm[];
  /** Cambia cuando cambia algo de lo anterior; invalida la caché de páginas. */
  signature: string;
}

const PAGE_BREAK = /^\\page\s*$/;
const FENCE = /^(?:```|~~~)/;

/** `{{#ancla …}}` y `{…,#ancla}` — las dos formas de poner un id. */
const ANCHOR = /[{,]#([A-Za-z][\w-]*)/g;
/** `{{ix término}}`, con o sin la marca `hidden`. */
const INDEX_MARK = /\{\{ix(?:,[^\s}]*)?\s+([^}]+)\}\}/g;

export function scanDocument(source: string): DocScan {
  const anchors: Record<string, number> = {};
  const byTerm = new Map<string, Set<number>>();

  let page = 1;
  let fence: string | null = null;

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (fence) {
      if (trimmed.startsWith(fence)) fence = null;
      continue;
    }
    if (FENCE.test(trimmed)) {
      fence = trimmed.slice(0, 3);
      continue;
    }
    if (PAGE_BREAK.test(trimmed)) {
      page++;
      continue;
    }

    for (const match of line.matchAll(ANCHOR)) {
      // Gana la primera aparición: un ancla repetida es un error del autor,
      // y apuntar a la primera es menos sorprendente que a la última.
      anchors[match[1]] ??= page;
    }

    for (const match of line.matchAll(INDEX_MARK)) {
      const term = match[1].trim();
      if (!term) continue;
      const pages = byTerm.get(term) ?? new Set<number>();
      pages.add(page);
      byTerm.set(term, pages);
    }
  }

  const outline = extractOutline(source);
  const terms: IndexTerm[] = [...byTerm.entries()]
    .map(([term, pages]) => ({ term, pages: [...pages].sort((a, b) => a - b) }))
    .sort((a, b) => a.term.localeCompare(b.term, "es", { sensitivity: "base" }));

  const signature = JSON.stringify([
    outline.map((entry) => [entry.level, entry.text, entry.page]),
    anchors,
    terms.map((entry) => [entry.term, entry.pages]),
  ]);

  return { outline, anchors, terms, signature };
}

/** Agrupa el índice alfabético por inicial, ya normalizada. */
export function groupByInitial(terms: IndexTerm[]): [string, IndexTerm[]][] {
  const groups = new Map<string, IndexTerm[]>();

  for (const entry of terms) {
    const initial = entry.term
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .charAt(0)
      .toUpperCase();
    const key = /[A-Z]/.test(initial) ? initial : "#";
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
}
