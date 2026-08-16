/**
 * Archivos de texto que llegan mal codificados.
 *
 * Hay dos averías distintas y no se arreglan igual:
 *
 * 1. El archivo está en Windows-1252 o Latin-1 y lo leemos como UTF-8. Los
 *    bytes son inválidos, así que se detecta con certeza y se decodifica bien.
 * 2. El archivo *es* UTF-8 válido, pero su contenido ya venía estropeado: en
 *    algún paso anterior alguien leyó UTF-8 como Latin-1 y lo volvió a guardar,
 *    y «é» quedó escrito literalmente como «Ã©». Aquí no hay nada que
 *    decodificar; hay que sustituir secuencias.
 */

/** Pares inequívocos: así se ve cada carácter cuando UTF-8 se leyó como Latin-1. */
const MOJIBAKE: [string, string][] = [
  ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
  ["Ã±", "ñ"], ["Ã¼", "ü"], ["Ã ", "à"], ["Ã¨", "è"], ["Ã¬", "ì"],
  ["Ã²", "ò"], ["Ã¹", "ù"], ["Ã¢", "â"], ["Ãª", "ê"], ["Ã®", "î"],
  ["Ã´", "ô"], ["Ã»", "û"], ["Ã§", "ç"], ["Ã£", "ã"], ["Ãµ", "õ"],
  ["Ã‰", "É"], ["Ã“", "Ó"], ["Ãš", "Ú"], ["Ã‘", "Ñ"], ["Ãœ", "Ü"],
  ["Ã€", "À"], ["Ãˆ", "È"], ["Ã‡", "Ç"], ["Ãƒ", "Ã"], ["Ã•", "Õ"],
  ["Â¿", "¿"], ["Â¡", "¡"], ["Â«", "«"], ["Â»", "»"],
  ["Âº", "º"], ["Âª", "ª"], ["Â°", "°"], ["Â·", "·"],
  ["Â´", "´"], ["Â¨", "¨"], ["Â­", ""], ["Â ", " "],
  ["â€œ", "“"], ["â€", "”"], ["â€˜", "‘"], ["â€™", "’"],
  ["â€“", "–"], ["â€”", "—"], ["â€¦", "…"], ["â€¢", "•"],
  ["â‚¬", "€"], ["â„¢", "™"], ["Â©", "©"], ["Â®", "®"],
];

/**
 * Restos que quedan cuando el daño original perdió bytes. El caso típico es una
 * capital acentuada: el segundo byte de Á (0x81) e Í (0x8D) no existe en
 * Windows-1252 y se cae, dejando «CAPÃTULO» sin forma de saber si era Á o Í.
 * En castellano bien escrito no aparece ninguno de estos caracteres, así que
 * sirven de aviso — se cuentan, nunca se tocan.
 */
const LEFTOVER = /[ÃÂâ]/g;

export interface Repair {
  text: string;
  /** Secuencias sustituidas con certeza. */
  replaced: number;
  /** Restos ambiguos que hay que repasar a mano; no se modifican. */
  unresolved: number;
}

export function countMojibake(text: string): number {
  let total = 0;
  for (const [broken] of MOJIBAKE) {
    total += text.split(broken).length - 1;
  }
  return total;
}

export function repairMojibake(text: string): Repair {
  let output = text;
  let replaced = 0;

  for (const [broken, fixed] of MOJIBAKE) {
    const parts = output.split(broken);
    if (parts.length === 1) continue;
    replaced += parts.length - 1;
    output = parts.join(fixed);
  }

  return {
    text: output,
    replaced,
    unresolved: (output.match(LEFTOVER) ?? []).length,
  };
}

export interface DecodedFile {
  text: string;
  /** Codificación con la que se acabó leyendo. */
  encoding: "utf-8" | "windows-1252";
  /** Secuencias rotas detectadas dentro de un UTF-8 por lo demás válido. */
  mojibake: number;
}

/**
 * Lee el archivo con la codificación correcta y avisa si además trae el texto
 * ya estropeado de origen.
 */
export async function decodeFile(file: File): Promise<DecodedFile> {
  const buffer = await file.arrayBuffer();

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { text, encoding: "utf-8", mojibake: countMojibake(text) };
  } catch {
    // No es UTF-8 válido: la apuesta segura para un .md de Windows.
    const text = new TextDecoder("windows-1252").decode(buffer);
    return { text, encoding: "windows-1252", mojibake: 0 };
  }
}
