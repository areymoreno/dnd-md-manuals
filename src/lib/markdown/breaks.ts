import type { MarkdownIt, StateBlock } from "markdown-it";

const COLUMN_BREAK = /^\\column\s*$/;
const SPACER = /^:+$/;

/**
 * Una línea con solo `:` deja una línea en blanco que Markdown no colapsa; cada
 * `:` adicional añade otra. Sirve para separar párrafos dentro de una columna.
 */
function spacer(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const text = state.src
    .slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine])
    .trim();

  if (!SPACER.test(text)) return false;
  if (silent) return true;

  const token = state.push("brew_spacer", "div", 0);
  token.block = true;
  token.map = [startLine, startLine + 1];
  token.markup = text;
  state.line = startLine + 1;
  return true;
}

/**
 * `\column` on its own line pushes the following content into the next column.
 * (`\page` is handled earlier, when the source is split into pages.)
 */
function columnBreak(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const text = state.src.slice(
    state.bMarks[startLine] + state.tShift[startLine],
    state.eMarks[startLine],
  );

  if (!COLUMN_BREAK.test(text)) return false;
  if (silent) return true;

  const token = state.push("column_break", "div", 0);
  token.block = true;
  token.map = [startLine, startLine + 1];
  state.line = startLine + 1;
  return true;
}

export function breaksPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "column_break", columnBreak, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.block.ruler.before("paragraph", "brew_spacer", spacer, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.column_break = () => `<div class="column-break"></div>\n`;
  md.renderer.rules.brew_spacer = (tokens, idx) =>
    `<div class="blank-line"></div>\n`.repeat(tokens[idx].markup.length);
}
