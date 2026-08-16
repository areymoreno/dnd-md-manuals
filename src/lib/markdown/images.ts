import type { MarkdownIt, Token } from "markdown-it";

/** Prefijo de las imágenes guardadas en el navegador: `![alt](brew:<id>)`. */
export const BREW_SCHEME = "brew:";

export interface BrewEnv {
  [key: string | symbol]: unknown;
  /** id de la imagen → URL utilizable (blob: en la app, data: al exportar). */
  images?: Record<string, string>;
}

/**
 * Resuelve `brew:<id>` contra las imágenes que el documento tiene guardadas.
 * Si falta una, deja marcado el hueco para poder avisar en la vista previa.
 */
export function imagesPlugin(md: MarkdownIt): void {
  const previous =
    md.renderer.rules.image ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = String(token.attrGet("src") ?? "");

    if (src.startsWith(BREW_SCHEME)) {
      const url = (env as BrewEnv | undefined)?.images?.[
        src.slice(BREW_SCHEME.length)
      ];
      if (url) {
        token.attrSet("src", url);
      } else {
        token.attrSet("src", "");
        token.attrSet("data-missing", "");
      }
    }

    return previous(tokens, idx, options, env, self);
  };
}
