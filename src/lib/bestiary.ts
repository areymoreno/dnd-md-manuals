import { newId } from "./storage";

/**
 * Bestiario: fichas de criatura guardadas una vez y reutilizables desde
 * cualquier documento con `ref:` dentro de un bloque `statblock`.
 *
 * Se guarda el YAML tal cual, no el HTML: así una ficha vieja se sigue
 * beneficiando de cualquier mejora del renderizador, y se puede editar.
 */

export interface Creature {
  id: string;
  /** Nombre corto con el que se referencia: `ref: esqueleto`. */
  slug: string;
  label: string;
  yaml: string;
  createdAt: number;
}

const KEY = "dnd-markdown.bestiary.v1";

const isBrowser = () => typeof window !== "undefined";

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "criatura"
  );
}

export function loadBestiary(): Creature[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Creature =>
        typeof item?.slug === "string" && typeof item?.yaml === "string",
    );
  } catch {
    return [];
  }
}

export function saveBestiary(creatures: Creature[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(creatures));
  } catch {
    // Igual que los documentos: quien llama ya avisa si no cabe.
  }
}

export function createCreature(label: string, yaml: string): Creature {
  return {
    id: newId(),
    slug: slugify(label),
    label: label.trim(),
    yaml,
    createdAt: Date.now(),
  };
}

/** `slug` → YAML, tal como lo espera el renderizador de fichas. */
export function bestiaryMap(creatures: Creature[]): Record<string, string> {
  return Object.fromEntries(creatures.map((item) => [item.slug, item.yaml]));
}

/**
 * Extrae el bloque ```statblock que rodea a una posición del texto. Devuelve
 * `null` si el cursor no está dentro de uno.
 */
export function statblockAround(
  source: string,
  offset: number,
): { yaml: string; name: string } | null {
  const lines = source.split("\n");
  let position = 0;
  let start = -1;
  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = position + line.length + 1;

    if (/^```\s*(statblock|monster)\s*$/i.test(line.trim())) {
      start = next;
      startLine = i;
    } else if (line.trim() === "```" && startLine !== -1) {
      if (offset >= start - line.length && offset <= position + line.length) {
        const yaml = lines.slice(startLine + 1, i).join("\n");
        const name = /^\s*name:\s*(.+)$/m.exec(yaml)?.[1]?.trim() ?? "";
        return { yaml, name };
      }
      start = -1;
      startLine = -1;
    }

    position = next;
  }

  return null;
}
