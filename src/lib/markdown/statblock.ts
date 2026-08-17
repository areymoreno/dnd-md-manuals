import { load } from "js-yaml";
import type { MarkdownIt, Token } from "markdown-it";

type Entry = { name?: string; desc?: string } | string;

interface StatblockData {
  name?: string;
  size?: string;
  type?: string;
  subtype?: string;
  alignment?: string;

  ac?: string | number;
  armor_class?: string | number;
  hp?: string | number;
  hit_points?: string | number;
  speed?: string;

  stats?: (number | string)[];
  str?: number | string;
  dex?: number | string;
  con?: number | string;
  int?: number | string;
  wis?: number | string;
  cha?: number | string;

  saves?: string;
  saving_throws?: string;
  skills?: string;
  vulnerabilities?: string;
  damage_vulnerabilities?: string;
  resistances?: string;
  damage_resistances?: string;
  immunities?: string;
  damage_immunities?: string;
  condition_immunities?: string;
  gear?: string;
  senses?: string;
  languages?: string;
  cr?: string | number;
  challenge?: string | number;
  pb?: string;
  proficiency_bonus?: string;

  traits?: Entry[] | string;
  actions?: Entry[] | string;
  bonus_actions?: Entry[] | string;
  reactions?: Entry[] | string;
  legendary?: Entry[] | string;
  legendary_intro?: string;
  lair?: Entry[] | string;
  lair_intro?: string;
  mythic?: Entry[] | string;
  mythic_intro?: string;
  description?: string;

  wide?: boolean;
  frame?: boolean;

  lang?: "es" | "en";
  labels?: Partial<Labels>;
  /** Nombre corto de una ficha del bestiario; lo demás la sobrescribe. */
  ref?: string;
}

type Labels = typeof LABELS.es;

const LABELS = {
  es: {
    unnamed: "Criatura sin nombre",
    ac: "Clase de Armadura",
    hp: "Puntos de Golpe",
    speed: "Velocidad",
    saves: "Tiradas de Salvación",
    skills: "Habilidades",
    vulnerabilities: "Vulnerabilidades al Daño",
    resistances: "Resistencias al Daño",
    immunities: "Inmunidades al Daño",
    condition_immunities: "Inmunidades a Estados",
    gear: "Equipo",
    senses: "Sentidos",
    languages: "Idiomas",
    cr: "Desafío",
    pb: "Bono de Competencia",
    actions: "Acciones",
    bonus_actions: "Acciones Adicionales",
    reactions: "Reacciones",
    legendary: "Acciones Legendarias",
    mythic: "Acciones Míticas",
    lair: "Acciones de Guarida",
    abilities: ["FUE", "DES", "CON", "INT", "SAB", "CAR"],
    xp: "PX",
    xpZero: "0 o 10",
    locale: "es-ES",
  },
  en: {
    unnamed: "Unnamed Creature",
    ac: "Armor Class",
    hp: "Hit Points",
    speed: "Speed",
    saves: "Saving Throws",
    skills: "Skills",
    vulnerabilities: "Damage Vulnerabilities",
    resistances: "Damage Resistances",
    immunities: "Damage Immunities",
    condition_immunities: "Condition Immunities",
    gear: "Gear",
    senses: "Senses",
    languages: "Languages",
    cr: "Challenge",
    pb: "Proficiency Bonus",
    actions: "Actions",
    bonus_actions: "Bonus Actions",
    reactions: "Reactions",
    legendary: "Legendary Actions",
    mythic: "Mythic Actions",
    lair: "Lair Actions",
    abilities: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
    xp: "XP",
    xpZero: "0 or 10",
    locale: "en-US",
  },
} as const;

const XP_BY_CR: Record<string, number> = {
  "0": 0,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1100,
  "5": 1800,
  "6": 2300,
  "7": 2900,
  "8": 3900,
  "9": 5000,
  "10": 5900,
  "11": 7200,
  "12": 8400,
  "13": 10000,
  "14": 11500,
  "15": 13000,
  "16": 15000,
  "17": 18000,
  "18": 20000,
  "19": 22000,
  "20": 25000,
  "21": 33000,
  "22": 41000,
  "23": 50000,
  "24": 62000,
  "25": 75000,
  "26": 90000,
  "27": 105000,
  "28": 120000,
  "29": 135000,
  "30": 155000,
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const modifier = (score: number): string => {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const DIVIDER = `<svg class="statblock-divider" viewBox="0 0 400 5" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,2.5 400,0 400,5"></polyline></svg>`;

function normalizeEntries(
  value: Entry[] | string | undefined,
): { name: string; desc: string }[] {
  if (!value) return [];

  if (typeof value === "string") {
    // Loose form: one entry per paragraph, `**Name.** description`.
    return value
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const match = /^\*{0,2}([^.*]+?)\.?\*{0,2}\.\s+([\s\S]+)$/.exec(chunk);
        return match
          ? { name: match[1].trim(), desc: match[2].trim() }
          : { name: "", desc: chunk };
      });
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const match = /^\*{0,2}(.+?)\*{0,2}\.\s+([\s\S]+)$/.exec(entry);
        return match
          ? { name: match[1].trim(), desc: match[2].trim() }
          : { name: "", desc: entry };
      }
      return { name: (entry.name ?? "").trim(), desc: (entry.desc ?? "").trim() };
    })
    .filter((entry) => entry.name || entry.desc);
}

function subtitle(data: StatblockData): string {
  const kind = [data.size, data.type].filter(Boolean).join(" ");
  const withSubtype = data.subtype ? `${kind} (${data.subtype})` : kind;
  return [withSubtype, data.alignment].filter(Boolean).join(", ");
}

function abilityScores(data: StatblockData): number[] | null {
  if (Array.isArray(data.stats) && data.stats.length === 6) {
    return data.stats.map((value) => Number(value) || 10);
  }
  const keys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  if (keys.every((key) => data[key] === undefined)) return null;
  return keys.map((key) => Number(data[key]) || 10);
}

function challengeLine(data: StatblockData, labels: Labels): string | null {
  const raw = data.cr ?? data.challenge;
  if (raw === undefined || raw === null || raw === "") return null;

  const value = String(raw).trim();
  if (!value || value.includes("(")) return value || null;

  const xp = XP_BY_CR[value];
  if (xp === undefined) return value;
  if (xp === 0) return `${value} (${labels.xpZero} ${labels.xp})`;

  const amount = new Intl.NumberFormat(labels.locale).format(xp);
  return `${value} (${amount} ${labels.xp})`;
}

export function renderStatblock(data: StatblockData, md: MarkdownIt): string {
  const labels: Labels = {
    ...(LABELS[data.lang === "en" ? "en" : "es"] as Labels),
    ...data.labels,
  };
  const inline = (text: string) => md.renderInline(text.trim());
  const block = (text: string) => md.render(text.trim());

  const propertyLine = (label: string, value?: string | number | null) => {
    if (value === undefined || value === null || value === "") return "";
    return `<div class="property-line"><h4>${escapeHtml(label)}</h4><p>${inline(String(value))}</p></div>`;
  };

  const entryBlock = (
    title: string | null,
    entries: { name: string; desc: string }[],
    intro?: string,
  ) => {
    if (!entries.length && !intro) return "";
    const heading = title ? `<h3>${escapeHtml(title)}</h3>${DIVIDER}` : "";
    const introHtml = intro ? `<div class="statblock-intro">${block(intro)}</div>` : "";
    const body = entries
      .map((entry) => {
        const name = entry.name
          ? `<strong><em>${inline(entry.name)}${/[.!?]$/.test(entry.name) ? "" : "."}</em></strong> `
          : "";
        return `<div class="statblock-entry"><p>${name}${inline(entry.desc)}</p></div>`;
      })
      .join("");
    return `<div class="statblock-section">${heading}${introHtml}${body}</div>`;
  };

  const scores = abilityScores(data);
  const abilities = scores
    ? `<div class="abilities">${labels.abilities
        .map(
          (label, index) =>
            `<div class="ability"><h4>${label}</h4><p>${scores[index]} (${modifier(scores[index])})</p></div>`,
        )
        .join("")}</div>`
    : "";

  const topStats = [
    propertyLine(labels.ac, data.ac ?? data.armor_class),
    propertyLine(labels.hp, data.hp ?? data.hit_points),
    propertyLine(labels.speed, data.speed),
  ].join("");

  const details = [
    propertyLine(labels.saves, data.saves ?? data.saving_throws),
    propertyLine(labels.skills, data.skills),
    propertyLine(labels.vulnerabilities, data.vulnerabilities ?? data.damage_vulnerabilities),
    propertyLine(labels.resistances, data.resistances ?? data.damage_resistances),
    propertyLine(labels.immunities, data.immunities ?? data.damage_immunities),
    propertyLine(labels.condition_immunities, data.condition_immunities),
    propertyLine(labels.gear, data.gear),
    propertyLine(labels.senses, data.senses),
    propertyLine(labels.languages, data.languages),
    propertyLine(labels.cr, challengeLine(data, labels)),
    propertyLine(labels.pb, data.pb ?? data.proficiency_bonus),
  ].join("");

  const sections = [
    entryBlock(null, normalizeEntries(data.traits)),
    entryBlock(labels.actions, normalizeEntries(data.actions)),
    entryBlock(labels.bonus_actions, normalizeEntries(data.bonus_actions)),
    entryBlock(labels.reactions, normalizeEntries(data.reactions)),
    entryBlock(labels.legendary, normalizeEntries(data.legendary), data.legendary_intro),
    entryBlock(labels.mythic, normalizeEntries(data.mythic), data.mythic_intro),
    entryBlock(labels.lair, normalizeEntries(data.lair), data.lair_intro),
  ].join("");

  const heading = `<div class="creature-heading"><h1>${inline(data.name ?? labels.unnamed)}</h1>${
    subtitle(data) ? `<h2>${inline(subtitle(data))}</h2>` : ""
  }</div>`;

  const classes = ["statblock"];
  if (data.wide) classes.push("wide");
  if (data.frame !== false) classes.push("frame");

  const descriptionHtml = data.description
    ? `<div class="statblock-description">${block(data.description)}</div>`
    : "";

  return `<div class="${classes.join(" ")}"><div class="statblock-inner">
${heading}${DIVIDER}
<div class="top-stats">${topStats}</div>
${abilities ? `${DIVIDER}${abilities}${DIVIDER}` : DIVIDER}
<div class="top-stats">${details}</div>
${DIVIDER}
${sections}${descriptionHtml}
</div></div>`;
}

export function statblockPlugin(md: MarkdownIt): void {
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const info = tokens[idx].info.trim().toLowerCase();
    if (info !== "statblock" && info !== "monster") {
      return defaultFence(tokens, idx, options, env, self);
    }

    try {
      const data = load(tokens[idx].content) as StatblockData | null;
      if (!data || typeof data !== "object") {
        throw new Error("el bloque debe ser un mapa YAML");
      }

      // `ref:` trae la ficha del bestiario y lo escrito aquí la sobrescribe,
      // que es como se hace una variante sin duplicar el YAML entero.
      if (data.ref) {
        const stored = (env as { creatures?: Record<string, string> } | undefined)
          ?.creatures?.[data.ref];
        if (!stored) {
          throw new Error(`no hay ninguna criatura «${data.ref}» en el bestiario`);
        }
        const base = (load(stored) ?? {}) as StatblockData;
        return renderStatblock({ ...base, ...data, ref: undefined }, md);
      }

      return renderStatblock(data, md);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `<div class="brew-error"><strong>Stat block error:</strong> ${escapeHtml(message)}</div>`;
    }
  };
}
