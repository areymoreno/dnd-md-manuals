import { load } from "js-yaml";
import type { MarkdownIt, Token } from "markdown-it";
import { groupByInitial, type DocScan } from "./scan";

/**
 * Índice de contenidos y índice alfabético, generados a partir de la pasada
 * previa. Los números de página salen de la paginación real, así que mover un
 * párrafo no deja el índice mintiendo.
 */

interface TocOptions {
  title?: string;
  columns?: 2 | 3;
  /** Hasta qué nivel de encabezado se incluye (1 a 3). */
  levels?: number;
  wide?: boolean;
}

interface IndexOptions {
  title?: string;
  columns?: 2 | 3;
  wide?: boolean;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const entry = (text: string, page: number) =>
  `<a href="#p${page}"><span>${escapeHtml(text)}</span><span>${page}</span></a>`;

function renderToc(options: TocOptions, scan: DocScan): string {
  const levels = Math.min(3, Math.max(1, options.levels ?? 3));
  const visible = scan.outline.filter((item) => item.level <= levels);

  if (!visible.length) {
    return `<div class="brew-error">El índice automático no encontró encabezados.</div>`;
  }

  // Los niveles se anidan en listas; un salto de dos niveles no rompe nada,
  // simplemente abre las listas que falten.
  let html = "";
  let current = 0;
  const heading = ["h3", "h4", "h5"];

  for (const item of visible) {
    while (current < item.level) {
      html += current === 0 ? "<ul>" : "<ul>";
      current++;
    }
    while (current > item.level) {
      html += "</ul>";
      current--;
    }
    const tag = heading[item.level - 1];
    html += `<li><${tag}>${entry(item.text, item.page)}</${tag}></li>`;
  }
  while (current > 0) {
    html += "</ul>";
    current--;
  }

  const classes = ["toc"];
  if (options.wide !== false) classes.push("wide");
  if (options.columns === 3) classes.push("columns-3");
  else if (options.columns === 2) classes.push("columns-2");

  const title = options.title ?? "Contenidos";
  return `<div class="${classes.join(" ")}">${
    title ? `<h1>${escapeHtml(title)}</h1>` : ""
  }${html}</div>`;
}

function renderIndex(options: IndexOptions, scan: DocScan): string {
  if (!scan.terms.length) {
    return `<div class="brew-error">El índice alfabético está vacío: marca términos con {{ix término}}.</div>`;
  }

  const groups = groupByInitial(scan.terms)
    .map(
      ([initial, terms]) =>
        `<h4 class="index-letter">${escapeHtml(initial)}</h4><ul>${terms
          .map(
            (item) =>
              `<li><span>${escapeHtml(item.term)}</span><span>${item.pages
                .map((page) => `<a href="#p${page}">${page}</a>`)
                .join(", ")}</span></li>`,
          )
          .join("")}</ul>`,
    )
    .join("");

  const classes = ["brew-index"];
  if (options.wide !== false) classes.push("wide");
  classes.push(options.columns === 2 ? "columns-2" : "columns-3");

  const title = options.title ?? "Índice alfabético";
  return `<div class="${classes.join(" ")}">${
    title ? `<h1>${escapeHtml(title)}</h1>` : ""
  }${groups}</div>`;
}

export function tocPlugin(md: MarkdownIt): void {
  const previous =
    md.renderer.rules.fence ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const info = tokens[idx].info.trim().toLowerCase();
    if (info !== "toc" && info !== "index") {
      return previous(tokens, idx, options, env, self);
    }

    const scan = (env as { scan?: DocScan } | undefined)?.scan;
    if (!scan) {
      return `<div class="brew-error">El índice automático necesita el documento completo.</div>`;
    }

    try {
      const data = (load(tokens[idx].content) ?? {}) as Record<string, unknown>;
      return info === "toc"
        ? renderToc(data as TocOptions, scan)
        : renderIndex(data as IndexOptions, scan);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `<div class="brew-error"><strong>Error en el bloque ${info}:</strong> ${escapeHtml(message)}</div>`;
    }
  };
}
