import { load } from "js-yaml";
import type { MarkdownIt, Token } from "markdown-it";

/**
 * Bloques YAML para conjuros y objetos mágicos, hermanos de `statblock`.
 * La ficha de criatura ya se escribía así; estos dos eran los que quedaban
 * a mano, y son justo los que más se repiten en un suplemento.
 */

interface SpellData {
  name?: string;
  level?: number | string;
  school?: string;
  ritual?: boolean;
  casting_time?: string;
  range?: string;
  components?: string;
  duration?: string;
  concentration?: boolean;
  classes?: string | string[];
  description?: string;
  higher_levels?: string;
  lang?: "es" | "en";
}

interface ItemData {
  name?: string;
  type?: string;
  rarity?: string;
  attunement?: boolean | string;
  description?: string;
  lang?: "es" | "en";
}

const LABELS = {
  es: {
    castingTime: "Tiempo de lanzamiento",
    range: "Alcance",
    components: "Componentes",
    duration: "Duración",
    classes: "Clases",
    higher: "A niveles superiores",
    cantrip: "Truco",
    levelOf: (level: string, school: string) =>
      `${school} de nivel ${level}`.trim(),
    cantripOf: (school: string) => `${school} (truco)`.trim(),
    ritual: "ritual",
    concentration: "Concentración, ",
    attunement: "requiere sintonización",
  },
  en: {
    castingTime: "Casting Time",
    range: "Range",
    components: "Components",
    duration: "Duration",
    classes: "Classes",
    higher: "At Higher Levels",
    cantrip: "Cantrip",
    levelOf: (level: string, school: string) => `${level}-level ${school}`.trim(),
    cantripOf: (school: string) => `${school} cantrip`.trim(),
    ritual: "ritual",
    concentration: "Concentration, ",
    attunement: "requires attunement",
  },
};

type Labels = (typeof LABELS)["es"];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function subtitle(data: SpellData, labels: Labels): string {
  const school = (data.school ?? "").trim();
  const level = String(data.level ?? "").trim();

  const base =
    level === "" || level === "0" || /truco|cantrip/i.test(level)
      ? labels.cantripOf(school)
      : labels.levelOf(level, school);

  return data.ritual ? `${base} (${labels.ritual})` : base;
}

export function renderSpell(data: SpellData, md: MarkdownIt): string {
  const labels = LABELS[data.lang === "en" ? "en" : "es"];
  const inline = (text: string) => md.renderInline(text.trim());
  const block = (text: string) => md.render(text.trim());

  const row = (label: string, value?: string) =>
    value
      ? `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${inline(value)}</dd>`
      : "";

  const duration = data.duration
    ? `${data.concentration ? labels.concentration : ""}${data.duration}`
    : "";

  const rows = [
    row(labels.castingTime, data.casting_time),
    row(labels.range, data.range),
    row(labels.components, data.components),
    row(labels.duration, duration),
    row(
      labels.classes,
      Array.isArray(data.classes) ? data.classes.join(", ") : data.classes,
    ),
  ].join("");

  const higher = data.higher_levels
    ? `<p><strong><em>${escapeHtml(labels.higher)}.</em></strong> ${inline(data.higher_levels)}</p>`
    : "";

  return `<div class="spell">
<h4>${inline(data.name ?? "")}</h4>
<p class="spell-subtitle"><em>${escapeHtml(subtitle(data, labels))}</em></p>
${rows ? `<dl>${rows}</dl>` : ""}
${data.description ? block(data.description) : ""}${higher}
</div>`;
}

export function renderItem(data: ItemData, md: MarkdownIt): string {
  const labels = LABELS[data.lang === "en" ? "en" : "es"];
  const inline = (text: string) => md.renderInline(text.trim());
  const block = (text: string) => md.render(text.trim());

  const attunement =
    data.attunement === true
      ? ` (${labels.attunement})`
      : typeof data.attunement === "string" && data.attunement.trim()
        ? ` (${data.attunement.trim()})`
        : "";

  const line = [data.type, data.rarity].filter(Boolean).join(", ") + attunement;

  return `<div class="magic-item">
<h4>${inline(data.name ?? "")}</h4>
${line.trim() ? `<p class="item-subtitle"><em>${inline(line)}</em></p>` : ""}
${data.description ? block(data.description) : ""}
</div>`;
}

export function blocksPlugin(md: MarkdownIt): void {
  const previous =
    md.renderer.rules.fence ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const info = tokens[idx].info.trim().toLowerCase();
    if (info !== "spell" && info !== "item" && info !== "conjuro" && info !== "objeto") {
      return previous(tokens, idx, options, env, self);
    }

    try {
      const data = load(tokens[idx].content);
      if (!data || typeof data !== "object") {
        throw new Error("el bloque debe ser un mapa YAML");
      }
      return info === "spell" || info === "conjuro"
        ? renderSpell(data as SpellData, md)
        : renderItem(data as ItemData, md);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `<div class="brew-error"><strong>Error en el bloque ${escapeHtml(info)}:</strong> ${escapeHtml(message)}</div>`;
    }
  };
}
