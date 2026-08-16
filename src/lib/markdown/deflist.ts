import type { MarkdownIt, StateBlock } from "markdown-it";

/**
 * Definition lists, the way stat blocks want to be written:
 *
 *   **Armor Class** :: 19 (natural armor)
 *   **Hit Points**  :: 256 (19d12 + 133)
 *
 * A run of consecutive `term :: definition` lines becomes one `<dl>`.
 */
function definitionList(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;

  const split = (line: number): [string, string] | null => {
    const text = state.src.slice(
      state.bMarks[line] + state.tShift[line],
      state.eMarks[line],
    );
    const at = text.indexOf("::");
    if (at < 1) return null;
    // `\::` escapes the separator.
    if (text.charCodeAt(at - 1) === 0x5c) return null;
    return [text.slice(0, at).trim(), text.slice(at + 2).trim()];
  };

  const first = split(startLine);
  if (!first) return false;
  if (silent) return true;

  const rows: [string, string][] = [first];
  let nextLine = startLine + 1;

  while (nextLine < endLine && !state.isEmpty(nextLine)) {
    const row = split(nextLine);
    if (!row) break;
    rows.push(row);
    nextLine++;
  }

  const open = state.push("dl_open", "dl", 1);
  open.map = [startLine, nextLine];
  open.block = true;

  rows.forEach(([term, definition], index) => {
    const dt = state.push("dt_open", "dt", 1);
    dt.map = [startLine + index, startLine + index + 1];
    dt.block = true;

    const dtInline = state.push("inline", "", 0);
    dtInline.content = term;
    dtInline.map = [startLine + index, startLine + index + 1];
    dtInline.children = [];

    state.push("dt_close", "dt", -1).block = true;

    state.push("dd_open", "dd", 1).block = true;
    const ddInline = state.push("inline", "", 0);
    ddInline.content = definition;
    ddInline.map = [startLine + index, startLine + index + 1];
    ddInline.children = [];
    state.push("dd_close", "dd", -1).block = true;
  });

  state.push("dl_close", "dl", -1).block = true;
  state.line = nextLine;
  return true;
}

export function definitionListPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "definition_list", definitionList, {
    alt: ["paragraph", "reference", "blockquote"],
  });
}
