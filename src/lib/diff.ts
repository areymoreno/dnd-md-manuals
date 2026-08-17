/**
 * Diff de líneas para comparar una versión guardada con el texto actual.
 *
 * Se recortan primero el principio y el final comunes, que en una edición
 * normal son casi todo el documento. Lo que queda suele ser pequeño y ahí sí
 * sale a cuenta una subsecuencia común más larga; si aún así es enorme, se
 * informa del tamaño en vez de bloquear el navegador con una matriz de
 * millones de celdas.
 */

export type DiffKind = "igual" | "añadida" | "quitada";

export interface DiffLine {
  kind: DiffKind;
  text: string;
  /** Número de línea en el texto nuevo, cuando existe allí. */
  lineNew?: number;
}

/** Por encima de esto no se compara línea a línea. */
const LCS_LIMIT = 1500;

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  /** `true` si el cambio era demasiado grande para detallarlo. */
  truncated: boolean;
}

export function diffLines(before: string, after: string): DiffResult {
  const a = before.split("\n");
  const b = after.split("\n");

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end++;
  }

  const midA = a.slice(start, a.length - end);
  const midB = b.slice(start, b.length - end);

  if (midA.length === 0 && midB.length === 0) {
    return { lines: [], added: 0, removed: 0, truncated: false };
  }

  if (midA.length * midB.length > LCS_LIMIT * LCS_LIMIT) {
    return {
      lines: [],
      added: midB.length,
      removed: midA.length,
      truncated: true,
    };
  }

  // Subsecuencia común más larga, clásica.
  const table: number[][] = Array.from({ length: midA.length + 1 }, () =>
    new Array<number>(midB.length + 1).fill(0),
  );
  for (let i = midA.length - 1; i >= 0; i--) {
    for (let j = midB.length - 1; j >= 0; j--) {
      table[i][j] =
        midA[i] === midB[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let i = 0;
  let j = 0;

  while (i < midA.length && j < midB.length) {
    if (midA[i] === midB[j]) {
      lines.push({ kind: "igual", text: midA[i], lineNew: start + j + 1 });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ kind: "quitada", text: midA[i] });
      removed++;
      i++;
    } else {
      lines.push({ kind: "añadida", text: midB[j], lineNew: start + j + 1 });
      added++;
      j++;
    }
  }
  while (i < midA.length) {
    lines.push({ kind: "quitada", text: midA[i++] });
    removed++;
  }
  while (j < midB.length) {
    lines.push({ kind: "añadida", text: midB[j], lineNew: start + j + 1 });
    added++;
    j++;
  }

  return { lines, added, removed, truncated: false };
}
