import type { KeyBinding } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";

/**
 * Atajos de escritura. Envolver alterna: si lo seleccionado ya está entre las
 * marcas, se quitan, que es lo que espera cualquiera que venga de un editor de
 * texto normal.
 */
function wrap(view: EditorView, mark: string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const outside = state.sliceDoc(
      Math.max(0, range.from - mark.length),
      Math.min(state.doc.length, range.to + mark.length),
    );

    // Ya envuelto por dentro: `**texto**` seleccionado entero.
    if (text.length >= mark.length * 2 && text.startsWith(mark) && text.endsWith(mark)) {
      const inner = text.slice(mark.length, -mark.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: state.selection.ranges[0].extend(range.from, range.from + inner.length),
      };
    }

    // Ya envuelto por fuera: `**` justo antes y después de la selección.
    if (outside === `${mark}${text}${mark}`) {
      return {
        changes: {
          from: range.from - mark.length,
          to: range.to + mark.length,
          insert: text,
        },
        range: state.selection.ranges[0].extend(
          range.from - mark.length,
          range.to - mark.length,
        ),
      };
    }

    return {
      changes: {
        from: range.from,
        to: range.to,
        insert: `${mark}${text}${mark}`,
      },
      range: state.selection.ranges[0].extend(
        range.from + mark.length,
        range.to + mark.length,
      ),
    };
  });

  view.dispatch(changes, { scrollIntoView: true, userEvent: "input.wrap" });
  return true;
}

function link(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  const text = state.sliceDoc(range.from, range.to) || "texto";

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `[${text}]()` },
    // El cursor cae dentro del paréntesis, que es donde toca escribir.
    selection: { anchor: range.from + text.length + 3 },
    scrollIntoView: true,
  });
  return true;
}

function pageBreak(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);

  view.dispatch({
    changes: { from: line.to, insert: "\n\n\\page\n\n" },
    selection: { anchor: line.to + 9 },
    scrollIntoView: true,
  });
  return true;
}

export const markdownKeymap: KeyBinding[] = [
  { key: "Mod-b", run: (view) => wrap(view, "**"), preventDefault: true },
  { key: "Mod-i", run: (view) => wrap(view, "*"), preventDefault: true },
  { key: "Mod-k", run: link, preventDefault: true },
  { key: "Mod-Enter", run: pageBreak, preventDefault: true },
];
