import { load } from "js-yaml";
import type { MarkdownIt, Token } from "markdown-it";

export interface BrewMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  systems?: string[];
  renderer?: string;
  theme?: string;
}

const METADATA_FENCE = /^```[ \t]*metadata[ \t]*$([\s\S]*?)^```[ \t]*$/m;

/**
 * Lee el bloque ```metadata de cabecera que traen los documentos de
 * Homebrewery. Se usa al importar, para nombrar el documento.
 */
export function parseMetadata(source: string): BrewMetadata | null {
  const match = METADATA_FENCE.exec(source);
  if (!match) return null;

  try {
    const data = load(match[1]);
    return data && typeof data === "object" ? (data as BrewMetadata) : null;
  } catch {
    return null;
  }
}

/** El bloque de metadatos no se dibuja: es cabecera, no contenido. */
export function metadataPlugin(md: MarkdownIt): void {
  const previous =
    md.renderer.rules.fence ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const info = tokens[idx].info.trim().toLowerCase();
    if (info === "metadata" || info === "meta") return "";
    return previous(tokens, idx, options, env, self);
  };
}
