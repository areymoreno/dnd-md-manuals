export interface OutlineEntry {
  level: number;
  text: string;
  page: number;
}

const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const PAGE_BREAK = /^\\page\s*$/;
const FENCE = /^(?:```|~~~)/;

/** Deja el texto del encabezado legible: sin marcas de Markdown ni llaves. */
function clean(text: string): string {
  return text
    .replace(/\{\{[^\s}]*\s?/g, "")
    .replace(/\}\}/g, "")
    .replace(/\{[^}]*\}\s*$/, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

/**
 * Lista de capítulos y secciones con la página en la que cae cada uno. Se lee
 * del Markdown, no del HTML: es más barato y da el número de página directo.
 */
export function extractOutline(source: string): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
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

    const heading = HEADING.exec(trimmed);
    if (!heading) continue;

    const text = clean(heading[2]);
    if (text) entries.push({ level: heading[1].length, text, page });
  }

  return entries;
}
