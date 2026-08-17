import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

/**
 * Autocompletado de la sintaxis del proyecto. Son tres contextos distintos y
 * cada uno se dispara con lo que ya has escrito, sin atajos que recordar.
 */

interface Entry {
  label: string;
  detail?: string;
  info?: string;
}

/** Clases de bloque y de línea que entiende `{{ }}`. */
const BLOCKS: Entry[] = [
  { label: "note", detail: "caja verde de nota" },
  { label: "descriptive", detail: "caja para leer en voz alta" },
  { label: "quote", detail: "cita con filete" },
  { label: "wide", detail: "cruza todas las columnas" },
  { label: "columns-2", detail: "dos columnas (con wide)" },
  { label: "columns-3", detail: "tres columnas (con wide)" },
  { label: "chapter", detail: "cabecera de capítulo" },
  { label: "chapter,flourish", detail: "cabecera con rasgo dorado" },
  { label: "frontCover", detail: "portada" },
  { label: "frontCover,framed", detail: "portada con cenefa" },
  { label: "partCover", detail: "portadilla de parte" },
  { label: "backCover", detail: "contraportada" },
  { label: "bleed,bottom", detail: "ilustración al pie, a sangre" },
  { label: "bleed,top", detail: "ilustración arriba, a sangre" },
  { label: "toc,wide,columns-3", detail: "índice a tres columnas" },
  { label: "memo,pinned", detail: "tarjeta ladeada" },
  { label: "map,grid", detail: "mapa con cuadrícula" },
  { label: "map,hexgrid", detail: "mapa con hexágonos" },
  { label: "watercolor,wc-verde", detail: "mancha de acuarela" },
  { label: "split-table", detail: "dos tablas en paralelo" },
  { label: "framed-table", detail: "tabla con marco" },
  { label: "class-table", detail: "tabla de progresión" },
  { label: "license", detail: "aviso legal" },
  { label: "footnote ", detail: "pie de página" },
  { label: "pageNumber ", detail: "número de página manual" },
  { label: "artist ", detail: "crédito de ilustración" },
  { label: "scale ", detail: "escala del mapa" },
  { label: "ix ", detail: "marcar término para el índice" },
  { label: "ix,hidden ", detail: "marcar sin escribirlo" },
  { label: "ref ", detail: "página de un ancla" },
  { label: "smallcaps ", detail: "versalitas" },
  { label: "f-body ", detail: "tipografía de texto" },
  { label: "f-heading ", detail: "tipografía de titulares" },
  { label: "f-display ", detail: "tipografía de capitulares" },
  { label: "f-sans ", detail: "tipografía de fichas" },
  { label: "f-hand ", detail: "tipografía manuscrita" },
  { label: "f-mono ", detail: "monoespaciada" },
  ...[
    "d4",
    "d6",
    "d20",
    "espada",
    "escudo",
    "calavera",
    "pocion",
    "pergamino",
    "corazon",
    "llama",
    "luna",
    "huella",
  ].map((icon) => ({ label: `icon-${icon}`, detail: "icono en línea" })),
];

/** Lenguajes de bloque cercado que el renderizador reconoce. */
const FENCES: Entry[] = [
  { label: "statblock", detail: "ficha de criatura (YAML)" },
  { label: "spell", detail: "conjuro (YAML)" },
  { label: "item", detail: "objeto mágico (YAML)" },
  { label: "sheet", detail: "hoja de personaje (YAML)" },
  { label: "toc", detail: "índice automático" },
  { label: "index", detail: "índice alfabético" },
  { label: "metadata", detail: "cabecera del documento" },
];

export interface CompletionData {
  /** Imágenes guardadas, para `brew:`. */
  images: { id: string; name: string }[];
  /** Anclas del documento, para `{{ref`. */
  anchors: string[];
}

export function brewCompletions(data: CompletionData) {
  return (context: CompletionContext): CompletionResult | null => {
    // `{{ref ancla}}` — se ofrecen las anclas que existen en el documento.
    const ref = context.matchBefore(/\{\{ref\s+[\w-]*/);
    if (ref) {
      return {
        from: ref.from + ref.text.indexOf(" ") + 1,
        options: data.anchors.map((anchor) => ({
          label: anchor,
          type: "variable",
          detail: "ancla",
        })),
      };
    }

    // `![](brew:` — se ofrecen las imágenes guardadas, por su nombre.
    const image = context.matchBefore(/brew:[\w-]*/);
    if (image) {
      return {
        from: image.from + "brew:".length,
        options: data.images.map((img) => ({
          label: img.id,
          type: "constant",
          detail: img.name,
        })),
      };
    }

    // ```lenguaje al principio de línea.
    const fence = context.matchBefore(/^\s*```[\w]*/);
    if (fence) {
      return {
        from: fence.from + fence.text.indexOf("```") + 3,
        options: FENCES.map((entry) => ({
          label: entry.label,
          type: "keyword",
          detail: entry.detail,
        })),
      };
    }

    // `{{clase` — el grueso de la sintaxis.
    const block = context.matchBefore(/\{\{[\w-]*/);
    if (block) {
      return {
        from: block.from + 2,
        options: BLOCKS.map((entry) => ({
          label: entry.label,
          type: "class",
          detail: entry.detail,
        })),
      };
    }

    return null;
  };
}
