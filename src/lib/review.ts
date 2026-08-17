import { scanDocument } from "./markdown/scan";
import type { BrewDoc } from "./storage";

/**
 * Revisión del documento: todo lo que va a fallar al imprimir, en una lista.
 *
 * Cada aviso ya se ve por separado —recuadro rojo en la imagen que falta, `??`
 * en la referencia rota, filete en la página desbordada—, pero en un manual de
 * doscientas páginas nadie los encuentra todos a ojo.
 */

export type IssueKind =
  | "imagen-perdida"
  | "ancla-perdida"
  | "criatura-perdida"
  | "pagina-desbordada"
  | "indice-vacio";

export interface Issue {
  kind: IssueKind;
  /** Qué pasa, en una línea. */
  message: string;
  /** Línea del editor a la que saltar, si la hay. */
  line?: number;
  /** Página afectada, si aplica. */
  page?: number;
}

const TITLES: Record<IssueKind, string> = {
  "imagen-perdida": "Imágenes que ya no existen",
  "ancla-perdida": "Referencias a anclas inexistentes",
  "criatura-perdida": "Criaturas que no están en el bestiario",
  "pagina-desbordada": "Páginas cuyo texto no cabe",
  "indice-vacio": "Índices sin nada que listar",
};

export function issueTitle(kind: IssueKind): string {
  return TITLES[kind];
}

interface ReviewInput {
  doc: BrewDoc;
  imageIds: Set<string>;
  creatureSlugs: Set<string>;
  overflowingPages: number[];
}

/** Número de línea (1-indexado) de una posición dentro del texto. */
function lineAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === "\n") line++;
  }
  return line;
}

export function reviewDocument({
  doc,
  imageIds,
  creatureSlugs,
  overflowingPages,
}: ReviewInput): Issue[] {
  const source = doc.content;
  const scan = scanDocument(source);
  const issues: Issue[] = [];

  for (const match of source.matchAll(/\(brew:([\w-]+)\)/g)) {
    if (!imageIds.has(match[1])) {
      issues.push({
        kind: "imagen-perdida",
        message: `La imagen «${match[1]}» ya no está guardada.`,
        line: lineAt(source, match.index ?? 0),
      });
    }
  }

  for (const match of source.matchAll(/\{\{ref\s+([^}]+)\}\}/g)) {
    const anchor = match[1].trim();
    if (!(anchor in scan.anchors)) {
      issues.push({
        kind: "ancla-perdida",
        message: `No hay ningún «{{#${anchor}}}» al que apuntar.`,
        line: lineAt(source, match.index ?? 0),
      });
    }
  }

  for (const match of source.matchAll(/^\s*ref:\s*([\w-]+)\s*$/gm)) {
    if (!creatureSlugs.has(match[1])) {
      issues.push({
        kind: "criatura-perdida",
        message: `«${match[1]}» no está en el bestiario.`,
        line: lineAt(source, match.index ?? 0),
      });
    }
  }

  for (const page of overflowingPages) {
    issues.push({
      kind: "pagina-desbordada",
      message: `El texto de la página ${page} no cabe y no saldrá impreso.`,
      page,
    });
  }

  if (/```toc/.test(source) && scan.outline.length === 0) {
    issues.push({
      kind: "indice-vacio",
      message: "El índice automático no encuentra encabezados.",
    });
  }
  if (/```index/.test(source) && scan.terms.length === 0) {
    issues.push({
      kind: "indice-vacio",
      message: "El índice alfabético no encuentra términos marcados con {{ix}}.",
    });
  }

  return issues;
}

export function groupIssues(issues: Issue[]): [IssueKind, Issue[]][] {
  const groups = new Map<IssueKind, Issue[]>();
  for (const issue of issues) {
    groups.set(issue.kind, [...(groups.get(issue.kind) ?? []), issue]);
  }
  return [...groups.entries()];
}
