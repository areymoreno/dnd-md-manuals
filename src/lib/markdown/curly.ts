import type { MarkdownIt, StateBlock, StateInline, Token } from "markdown-it";
import { applyAttrs, parseCurlyArgs } from "./attrs";

const OPEN = 0x7b; /* { */
const CLOSE = 0x7d; /* } */

function lineText(state: StateBlock, line: number): string {
  return state.src.slice(
    state.bMarks[line] + state.tShift[line],
    state.eMarks[line],
  );
}

/**
 * Separa la lista de argumentos del contenido. Un espacio inicial significa
 * «sin argumentos»: todo el cuerpo es contenido.
 */
function splitBody(body: string): { args: string; content: string } {
  if (/^\s/.test(body)) return { args: "", content: body.trim() };

  const at = body.indexOf(" ");
  if (at === -1) return { args: body, content: "" };
  return { args: body.slice(0, at), content: body.slice(at + 1).trim() };
}

function pushSingleLineBlock(
  state: StateBlock,
  line: number,
  body: string,
): boolean {
  const { args, content } = splitBody(body);

  const open = state.push("curly_open", "div", 1);
  open.markup = "{{";
  open.block = true;
  open.map = [line, line + 1];
  applyAttrs(open, parseCurlyArgs(args));

  if (content) {
    const inline = state.push("inline", "", 0);
    inline.content = content;
    inline.map = [line, line + 1];
    inline.children = [];
  }

  state.push("curly_close", "div", -1).block = true;
  state.line = line + 1;
  return true;
}

/**
 * Block form:
 *
 *   {{note
 *   ##### A Warning
 *   Text goes here.
 *   }}
 *
 * Blocks nest, so a `{{monster}}` may contain a `{{note}}`.
 */
function curlyBlock(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;

  const line = lineText(state, startLine);
  if (line.charCodeAt(0) !== OPEN || line.charCodeAt(1) !== OPEN) return false;

  // `{{footnote texto}}` o `{{frontCover }}` en una línea suelta: bloque cerrado
  // en sí mismo, no un span dentro de un párrafo.
  const single = /^\{\{(.*)\}\}$/.exec(line.trim());
  if (single && !/\{\{|\}\}/.test(single[1])) {
    if (silent) return true;
    return pushSingleLineBlock(state, startLine, single[1]);
  }

  const args = line.slice(2).trim();
  // A `}}` on the same line means this is the inline form.
  if (args.includes("}}")) return false;
  if (silent) return true;

  let depth = 1;
  let nextLine = startLine;
  let closed = false;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) break;

    const text = lineText(state, nextLine).trim();
    if (text === "}}") {
      depth--;
      if (depth === 0) {
        closed = true;
        break;
      }
    } else if (text.startsWith("{{") && !text.includes("}}")) {
      depth++;
    }
  }

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = "curly";
  state.lineMax = nextLine;

  const open = state.push("curly_open", "div", 1);
  open.markup = "{{";
  open.block = true;
  open.map = [startLine, nextLine];
  applyAttrs(open, parseCurlyArgs(args));

  state.md.block.tokenize(state, startLine + 1, nextLine);

  const close = state.push("curly_close", "div", -1);
  close.markup = "}}";
  close.block = true;

  state.parentType = oldParent;
  state.lineMax = oldLineMax;
  state.line = closed ? nextLine + 1 : nextLine;
  return true;
}

/**
 * Inline form: `{{color:#58180d,bold Ancient Red Dragon}}`
 * The first whitespace-delimited chunk is the argument list; a leading space
 * means "no arguments, just wrap this text in a plain span".
 */
function curlyInline(state: StateInline, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;

  if (src.charCodeAt(start) !== OPEN || src.charCodeAt(start + 1) !== OPEN) {
    return false;
  }

  let depth = 1;
  let i = start + 2;
  let end = -1;

  while (i < state.posMax - 1) {
    if (src.charCodeAt(i) === OPEN && src.charCodeAt(i + 1) === OPEN) {
      depth++;
      i += 2;
      continue;
    }
    if (src.charCodeAt(i) === CLOSE && src.charCodeAt(i + 1) === CLOSE) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
      i += 2;
      continue;
    }
    i++;
  }

  if (end < 0) return false;

  const body = src.slice(start + 2, end);
  if (body.includes("\n")) return false;

  if (silent) {
    state.pos = end + 2;
    return true;
  }

  const { args, content } = splitBody(body);

  const open = state.push("curly_inline_open", "span", 1);
  applyAttrs(open, parseCurlyArgs(args));

  if (content) {
    const children: Token[] = [];
    state.md.inline.parse(content, state.md, state.env, children);
    for (const child of children) state.tokens.push(child);
  }

  state.push("curly_inline_close", "span", -1);
  state.pos = end + 2;
  return true;
}

export function curlyPlugin(md: MarkdownIt): void {
  md.block.ruler.before("fence", "curly_block", curlyBlock, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.inline.ruler.before("backticks", "curly_inline", curlyInline);
}
