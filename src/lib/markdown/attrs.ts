import type { Token } from "markdown-it";

export interface CurlyAttrs {
  classes: string[];
  styles: [string, string][];
  id?: string;
}

/** Split on commas that are not inside quotes or parentheses. */
function splitArgs(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let cur = "";

  for (const ch of raw) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

const CSS_PROPERTY = /^-{0,2}[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * Parses the argument list of a `{{ ... }}` block.
 *
 *   note                 -> class="note"
 *   .wide,note           -> class="wide note"
 *   #intro               -> id="intro"
 *   width:6cm            -> style="width:6cm"
 *   --my-var:red         -> style="--my-var:red"
 */
export function parseCurlyArgs(raw: string): CurlyAttrs {
  const attrs: CurlyAttrs = { classes: [], styles: [] };

  for (const part of splitArgs(raw)) {
    const arg = part.trim();
    if (!arg) continue;

    if (arg.startsWith("#")) {
      attrs.id = arg.slice(1);
      continue;
    }

    const colon = arg.indexOf(":");
    if (colon > 0) {
      const key = arg.slice(0, colon).trim();
      const value = arg.slice(colon + 1).trim();
      if (CSS_PROPERTY.test(key) && value) {
        attrs.styles.push([key, value]);
        continue;
      }
    }

    attrs.classes.push(arg.replace(/^\./, ""));
  }

  return attrs;
}

export function applyAttrs(token: Token, attrs: CurlyAttrs): void {
  if (attrs.classes.length) token.attrSet("class", attrs.classes.join(" "));
  if (attrs.id) token.attrSet("id", attrs.id);
  if (attrs.styles.length) {
    token.attrSet("style", attrs.styles.map(([k, v]) => `${k}:${v}`).join(";"));
  }
}
