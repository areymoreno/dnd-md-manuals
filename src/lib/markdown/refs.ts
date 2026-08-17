import type { MarkdownIt, StateCore, Token } from "markdown-it";
import type { DocScan } from "./scan";

/**
 * Dos marcas que se resuelven contra la pasada previa:
 *
 *   {{ref cripta}}      → «47», el número de página donde está {{#cripta}}
 *   {{ix hechicero}}    → escribe «hechicero» y lo apunta en el índice
 *   {{ix,hidden brujo}} → no escribe nada, solo lo apunta
 *
 * Se resuelven después de que `curly` haya construido los spans, para no
 * duplicar el análisis de argumentos.
 */

const classesOf = (token: Token): string[] =>
  String(token.attrGet("class") ?? "").split(/\s+/).filter(Boolean);

function textBetween(children: Token[], from: number): string {
  let text = "";
  for (let i = from; i < children.length; i++) {
    if (children[i].type === "curly_inline_close") break;
    text += children[i].content;
  }
  return text.trim();
}

function replaceSpan(
  state: StateCore,
  children: Token[],
  open: number,
  content: string,
): void {
  let close = open + 1;
  while (close < children.length && children[close].type !== "curly_inline_close") {
    close++;
  }

  // `state.Token` en vez de importar la clase: markdown-it solo la expone
  // como tipo, y la instancia viaja en el propio estado.
  const text = new state.Token("text", "", 0);
  text.content = content;

  // Se sustituye todo el interior del span por el texto resuelto.
  children.splice(open + 1, close - open - 1, ...(content ? [text] : []));
}

function resolve(state: StateCore): boolean {
  const scan = (state.env as { scan?: DocScan } | undefined)?.scan;

  for (const block of state.tokens) {
    if (block.type !== "inline" || !block.children) continue;
    const children = block.children;

    for (let i = 0; i < children.length; i++) {
      const token = children[i];
      if (token.type !== "curly_inline_open") continue;

      const classes = classesOf(token);
      const isRef = classes.includes("ref");
      const isIndex = classes.includes("ix");
      if (!isRef && !isIndex) continue;

      const inner = textBetween(children, i + 1);

      if (isRef) {
        const page = scan?.anchors[inner];
        token.attrSet("class", "ref");
        replaceSpan(state, children, i, page ? String(page) : "??");
        if (!page) token.attrSet("class", "ref ref-missing");
        continue;
      }

      // Marca de índice: se ve el término salvo que pidas lo contrario.
      const hidden = classes.includes("hidden");
      token.attrSet("class", hidden ? "ix hidden" : "ix");
      replaceSpan(state, children, i, hidden ? "" : inner);
    }
  }

  return false;
}

export function refsPlugin(md: MarkdownIt): void {
  md.core.ruler.after("brew_injections", "brew_refs", resolve);
}
