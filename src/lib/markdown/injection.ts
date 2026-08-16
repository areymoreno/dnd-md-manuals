import type { MarkdownIt, StateCore, StateInline, Token } from "markdown-it";
import { applyAttrs, parseCurlyArgs, type CurlyAttrs } from "./attrs";

const OPEN = 0x7b; /* { */

/**
 * Un argumento válido es una clase (`nota`, `.nota`, `#id`) o una declaración
 * CSS (`width:6cm`). Exigir que las clases empiecen por letra evita tragarse
 * texto normal entre llaves como `{1d6}` o `{2d8 + 4}`.
 */
const CLASS_ARG = /^[.#]?[a-zA-Z][\w-]*$/;
const STYLE_ARG = /^-{0,2}[a-zA-Z][\w-]*\s*:\s*\S/;

function looksLikeInjection(body: string): boolean {
  if (!body.trim()) return false;
  if (/[{}\n]/.test(body)) return false;

  return body
    .split(",")
    .every((part) => {
      const arg = part.trim();
      return arg !== "" && (CLASS_ARG.test(arg) || STYLE_ARG.test(arg));
    });
}

/**
 * Inyección de estilos y clases con llave simple, al modo de Homebrewery:
 *
 *   ![portada](fondo.jpg) {position:absolute,top:0,width:816px}
 *   # Capítulo 1 {color:#fff}
 *   {{note … }}
 *   {width:6cm}
 *
 * El token que se emite aquí es provisional: la regla de núcleo de más abajo lo
 * resuelve contra el elemento que le corresponda y lo borra del árbol.
 */
function injectionInline(state: StateInline, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;

  if (src.charCodeAt(start) !== OPEN) return false;
  if (src.charCodeAt(start + 1) === OPEN) return false; // {{ es un bloque

  const end = src.indexOf("}", start + 1);
  if (end === -1 || end > state.posMax) return false;

  const body = src.slice(start + 1, end);
  if (!looksLikeInjection(body)) return false;

  if (silent) {
    state.pos = end + 1;
    return true;
  }

  const token = state.push("injection", "", 0);
  token.meta = { attrs: parseCurlyArgs(body) };
  state.pos = end + 1;
  return true;
}

const isBlank = (token: Token): boolean =>
  token.type === "text" && token.content.trim() === "";

/** Dado un token de cierre en `index`, devuelve su token de apertura. */
function matchingOpen(tokens: Token[], index: number): Token | null {
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    if (tokens[i].nesting === -1) depth++;
    else if (tokens[i].nesting === 1) {
      depth--;
      if (depth === 0) return tokens[i];
    }
  }
  return null;
}

/** Elemento de bloque inmediatamente anterior al párrafo que abre en `index`. */
function previousBlock(tokens: Token[], index: number): Token | null {
  const at = index - 2; // saltamos el *_open del propio párrafo
  if (at < 0) return null;

  const token = tokens[at];
  if (token.nesting === -1) return matchingOpen(tokens, at);
  if (token.nesting === 0) return token;
  return null;
}

function attrsOf(token: Token): CurlyAttrs {
  return (token.meta as { attrs: CurlyAttrs }).attrs;
}

function resolveInjections(state: StateCore): boolean {
  const tokens = state.tokens;

  for (let i = 0; i < tokens.length; i++) {
    const inline = tokens[i];
    if (inline.type !== "inline" || !inline.children) continue;

    const children = inline.children;
    const content = children.filter((child) => !isBlank(child));

    // Una línea que solo contiene inyecciones se aplica al bloque anterior y
    // desaparece: es la forma de dar estilo a una tabla, una nota o una lista.
    if (
      content.length > 0 &&
      content.every((child) => child.type === "injection") &&
      tokens[i - 1]?.type === "paragraph_open" &&
      tokens[i + 1]?.type === "paragraph_close"
    ) {
      const target = previousBlock(tokens, i);
      if (target) {
        for (const child of content) applyAttrs(target, attrsOf(child));
        tokens.splice(i - 1, 3);
        i -= 2;
        continue;
      }
    }

    for (let j = children.length - 1; j >= 0; j--) {
      if (children[j]?.type !== "injection") continue;
      const attrs = attrsOf(children[j]);

      let k = j - 1;
      while (k >= 0 && isBlank(children[k])) k--;
      const previous = k >= 0 ? children[k] : null;

      if (previous && previous.nesting === -1) {
        // `**negrita**{color:red}` → el <strong> que se acaba de cerrar.
        const open = matchingOpen(children, k);
        if (open) applyAttrs(open, attrs);
      } else if (previous && previous.nesting === 0 && previous.type !== "text") {
        // `![img](url) {…}` → la propia imagen.
        applyAttrs(previous, attrs);
      } else if (tokens[i - 1]?.nesting === 1) {
        // `# Título {…}` → el bloque que contiene esta línea.
        applyAttrs(tokens[i - 1], attrs);
      }

      children.splice(j, 1);
      const before = j > 0 ? children[j - 1] : undefined;

      if (before && isBlank(before)) {
        // Se va también el espacio que separaba la inyección del elemento; hay
        // que bajar el índice a la vez que el array se acorta.
        children.splice(j - 1, 1);
        j--;
      } else if (before?.type === "text") {
        before.content = before.content.replace(/\s+$/, "");
      }
    }
  }

  return false;
}

export function injectionPlugin(md: MarkdownIt): void {
  md.inline.ruler.before("backticks", "injection", injectionInline);
  md.core.ruler.after("inline", "brew_injections", resolveInjections);
  md.renderer.rules.injection = () => "";
}
