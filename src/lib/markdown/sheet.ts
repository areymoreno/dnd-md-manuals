import { load } from "js-yaml";
import type { MarkdownIt, Token } from "markdown-it";

/**
 * Hoja de personaje.
 *
 * Los campos son los de las reglas —características, salvaciones, las
 * dieciocho habilidades y sus características asociadas— y esos son términos
 * de juego, publicados en la SRD bajo CC-BY. La maqueta, en cambio, es de este
 * proyecto: no es un calco de la hoja oficial, que sí es obra de su editorial.
 *
 * Dos ediciones, porque la de 2024 no es la de 2014 con otro marco: mueve las
 * salvaciones junto a las características, agrupa las habilidades por
 * característica y cambia los recuadros de trasfondo por dotes, rasgos de
 * especie y entrenamientos.
 */

type Ability = "fue" | "des" | "con" | "int" | "sab" | "car";

const ABILITIES: { id: Ability; label: string }[] = [
  { id: "fue", label: "Fuerza" },
  { id: "des", label: "Destreza" },
  { id: "con", label: "Constitución" },
  { id: "int", label: "Inteligencia" },
  { id: "sab", label: "Sabiduría" },
  { id: "car", label: "Carisma" },
];

const SKILLS: { id: string; label: string; ability: Ability }[] = [
  { id: "acrobacias", label: "Acrobacias", ability: "des" },
  { id: "arcanos", label: "Arcanos", ability: "int" },
  { id: "atletismo", label: "Atletismo", ability: "fue" },
  { id: "enganio", label: "Engaño", ability: "car" },
  { id: "historia", label: "Historia", ability: "int" },
  { id: "interpretacion", label: "Interpretación", ability: "car" },
  { id: "intimidacion", label: "Intimidación", ability: "car" },
  { id: "investigacion", label: "Investigación", ability: "int" },
  { id: "juego-de-manos", label: "Juego de Manos", ability: "des" },
  { id: "medicina", label: "Medicina", ability: "sab" },
  { id: "naturaleza", label: "Naturaleza", ability: "int" },
  { id: "percepcion", label: "Percepción", ability: "sab" },
  { id: "perspicacia", label: "Perspicacia", ability: "sab" },
  { id: "persuasion", label: "Persuasión", ability: "car" },
  { id: "religion", label: "Religión", ability: "int" },
  { id: "sigilo", label: "Sigilo", ability: "des" },
  { id: "supervivencia", label: "Supervivencia", ability: "sab" },
  { id: "trato-con-animales", label: "Trato con Animales", ability: "sab" },
];

interface SheetData {
  edition?: 2014 | 2024 | "2014" | "2024";
  name?: string;
  class?: string;
  level?: number;
  species?: string;
  background?: string;
  alignment?: string;
  player?: string;

  stats?: (number | string)[];
  fue?: number;
  des?: number;
  con?: number;
  int?: number;
  sab?: number;
  car?: number;

  /** Salvaciones con competencia: `[fue, con]`. */
  saves?: string[];
  /** Habilidades con competencia, por su nombre en minúscula sin tildes. */
  skills?: string[];
  /** Habilidades con pericia (doble bono). */
  expertise?: string[];

  ac?: number | string;
  initiative?: number | string;
  speed?: string;
  hp?: number | string;
  hp_max?: number | string;
  hit_dice?: string;
  size?: string;

  attacks?: { name?: string; bonus?: string; damage?: string; notes?: string }[];
  equipment?: string;
  coins?: string;
  features?: string;
  traits?: string;
  feats?: string;
  proficiencies?: string;
  languages?: string;
  personality?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  armor_training?: string;
  weapon_mastery?: string;
  notes?: string;
}

const DIVIDER = `<svg class="statblock-divider" viewBox="0 0 400 5" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,2.5 400,0 400,5"></polyline></svg>`;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const signed = (value: number): string =>
  value >= 0 ? `+${value}` : String(value);

const modifier = (score: number): number => Math.floor((score - 10) / 2);

/** Bono de competencia por nivel: +2 y sube uno cada cuatro niveles. */
const proficiencyBonus = (level: number): number =>
  2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .trim();

function scores(data: SheetData): Record<Ability, number> {
  const list = Array.isArray(data.stats) ? data.stats.map(Number) : [];
  const result = {} as Record<Ability, number>;

  ABILITIES.forEach((ability, index) => {
    const explicit = data[ability.id];
    const value = explicit !== undefined ? Number(explicit) : list[index];
    result[ability.id] = Number.isFinite(value) ? value : 10;
  });

  return result;
}

/** Caja con etiqueta y valor; vacía queda como recuadro para rellenar a mano. */
const field = (
  label: string,
  value?: string | number,
  extra = "",
  icon = "",
) =>
  `<div class="sheet-field ${extra}">${
    icon ? `<i class="sheet-icon icon-${icon}"></i>` : ""
  }<span class="sheet-label">${escapeHtml(label)}</span><span class="sheet-value">${
    value === undefined || value === "" ? "" : escapeHtml(String(value))
  }</span></div>`;

const panel = (title: string, body: string, extra = "") =>
  `<section class="sheet-panel ${extra}"><h5>${escapeHtml(title)}</h5>${DIVIDER}${body}</section>`;

const prose = (value?: string) =>
  `<div class="sheet-prose">${value ? escapeHtml(value).replace(/\n/g, "<br>") : ""}</div>`;

export function renderSheet(data: SheetData, md: MarkdownIt): string {
  const edition = String(data.edition ?? 2024) === "2014" ? 2014 : 2024;
  const level = Number(data.level ?? 1);
  const pb = proficiencyBonus(level);
  const value = scores(data);

  const proficientSaves = new Set((data.saves ?? []).map(normalize));
  const proficientSkills = new Set((data.skills ?? []).map(normalize));
  const expertSkills = new Set((data.expertise ?? []).map(normalize));

  const abilityBoxes = ABILITIES.map((ability) => {
    const mod = modifier(value[ability.id]);
    const saveMark = proficientSaves.has(ability.id) ? "on" : "";
    const save = mod + (proficientSaves.has(ability.id) ? pb : 0);

    return `<div class="sheet-ability">
      <span class="sheet-ability-name">${escapeHtml(ability.label)}</span>
      <span class="sheet-ability-mod">${signed(mod)}</span>
      <span class="sheet-ability-score"><b>${value[ability.id]}</b></span>
      ${
        edition === 2024
          ? `<span class="sheet-save"><i class="dot ${saveMark}"></i>Salvación ${signed(save)}</span>`
          : ""
      }
    </div>`;
  }).join("");

  const skillRows = SKILLS.map((skill) => {
    const expert = expertSkills.has(skill.id);
    const proficient = expert || proficientSkills.has(skill.id);
    const total =
      modifier(value[skill.ability]) + (proficient ? pb : 0) + (expert ? pb : 0);

    return `<li><i class="dot ${expert ? "double" : proficient ? "on" : ""}"></i><span class="sheet-skill-name">${escapeHtml(
      skill.label,
    )}</span><span class="sheet-skill-ability">${skill.ability.toUpperCase()}</span><span class="sheet-skill-mod">${signed(total)}</span></li>`;
  }).join("");

  const savesPanel =
    edition === 2014
      ? panel(
          "Tiradas de salvación",
          `<ul class="sheet-list">${ABILITIES.map((ability) => {
            const on = proficientSaves.has(ability.id);
            const total = modifier(value[ability.id]) + (on ? pb : 0);
            return `<li><i class="dot ${on ? "on" : ""}"></i><span class="sheet-skill-name">${escapeHtml(
              ability.label,
            )}</span><span class="sheet-skill-mod">${signed(total)}</span></li>`;
          }).join("")}</ul>`,
        )
      : "";

  const attacks = (data.attacks ?? []).length
    ? (data.attacks ?? [])
        .map(
          (attack) =>
            `<tr><td>${escapeHtml(attack.name ?? "")}</td><td>${escapeHtml(
              attack.bonus ?? "",
            )}</td><td>${escapeHtml(attack.damage ?? "")}</td><td>${escapeHtml(
              attack.notes ?? "",
            )}</td></tr>`,
        )
        .join("")
    : Array.from(
        { length: 4 },
        () => "<tr><td></td><td></td><td></td><td></td></tr>",
      ).join("");

  const header = `<header class="sheet-header">
    <div class="sheet-name">${field("Personaje", data.name)}</div>
    <div class="sheet-header-grid">
      ${field(edition === 2024 ? "Clase y nivel" : "Clase y nivel", [data.class, data.level].filter(Boolean).join(" "))}
      ${field(edition === 2024 ? "Especie" : "Raza", data.species)}
      ${field("Trasfondo", data.background)}
      ${edition === 2014 ? field("Alineamiento", data.alignment) : field("Tamaño", data.size)}
      ${field("Jugador", data.player)}
      ${field("Bono de competencia", signed(pb))}
    </div>
  </header>`;

  const combat = `<div class="sheet-combat">
    ${field("Clase de armadura", data.ac, "big", "escudo")}
    ${field("Iniciativa", data.initiative ?? signed(modifier(value.des)), "big", "d20")}
    ${field("Velocidad", data.speed, "big", "huella")}
    ${field("Puntos de golpe", data.hp ?? data.hp_max, "big", "corazon")}
    ${field("Dados de golpe", data.hit_dice)}
    ${
      edition === 2024
        ? `<div class="sheet-field"><span class="sheet-label">Inspiración heroica</span><span class="sheet-value"><i class="dot"></i></span></div>`
        : field("Inspiración", "")
    }
  </div>`;

  const right =
    edition === 2024
      ? [
          panel("Rasgos de clase", prose(data.features)),
          panel("Rasgos de especie", prose(data.traits)),
          panel("Dotes", prose(data.feats)),
          panel("Entrenamiento con armaduras", prose(data.armor_training)),
          panel("Maestría con armas", prose(data.weapon_mastery)),
        ].join("")
      : [
          panel("Rasgos y aptitudes", prose(data.features)),
          panel("Personalidad", prose(data.personality)),
          panel("Ideales", prose(data.ideals)),
          panel("Vínculos", prose(data.bonds)),
          panel("Defectos", prose(data.flaws)),
        ].join("");

  void md;

  return `<div class="sheet sheet-${edition}">
${header}
<div class="sheet-body">
  <div class="sheet-col">
    <div class="sheet-abilities">${abilityBoxes}</div>
    ${savesPanel}
    ${panel("Habilidades", `<ul class="sheet-list">${skillRows}</ul>`)}
  </div>

  <div class="sheet-col">
    ${combat}
    ${panel(
      "Ataques y conjuros",
      `<table class="sheet-attacks"><thead><tr><th>Nombre</th><th>Ataque</th><th>Daño</th><th>Notas</th></tr></thead><tbody>${attacks}</tbody></table>`,
    )}
    ${panel("Competencias e idiomas", prose([data.proficiencies, data.languages].filter(Boolean).join("\n")))}
    ${panel("Equipo", prose([data.equipment, data.coins].filter(Boolean).join("\n")))}
  </div>

  <div class="sheet-col">
    ${right}
    ${data.notes ? panel("Notas", prose(data.notes)) : ""}
  </div>
</div>
</div>`;
}

export function sheetPlugin(md: MarkdownIt): void {
  const previous =
    md.renderer.rules.fence ??
    ((tokens: Token[], idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const info = tokens[idx].info.trim().toLowerCase();
    if (info !== "sheet" && info !== "hoja") {
      return previous(tokens, idx, options, env, self);
    }

    try {
      const data = (load(tokens[idx].content) ?? {}) as SheetData;
      return renderSheet(data, md);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `<div class="brew-error"><strong>Error en la hoja:</strong> ${escapeHtml(message)}</div>`;
    }
  };
}
