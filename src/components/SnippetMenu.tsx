"use client";

import { ChevronDown, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import Dropdown, { MenuItem, MenuLabel } from "./Dropdown";
import { SNIPPET_GROUPS, SNIPPET_TABS, type SnippetTab } from "@/lib/snippets";
import type { UserSnippet } from "@/lib/userSnippets";
import type { Creature } from "@/lib/bestiary";

type Tab = SnippetTab | "mios" | "bestiario";

const TABS: { id: Tab; label: string }[] = [
  ...SNIPPET_TABS,
  { id: "mios", label: "Míos" },
  { id: "bestiario", label: "Bestiario" },
];

interface SnippetMenuProps {
  onInsert: (text: string) => void;
  mine: UserSnippet[];
  onSaveSelection: () => void;
  onDeleteMine: (id: string) => void;
  bestiary: Creature[];
  onSaveCreature: () => void;
  onDeleteCreature: (id: string) => void;
}

/** Un único menú «Insertar» en la barra superior, con las categorías dentro. */
export default function SnippetMenu({
  onInsert,
  mine,
  onSaveSelection,
  onDeleteMine,
  bestiary,
  onSaveCreature,
  onDeleteCreature,
}: SnippetMenuProps) {
  const [tab, setTab] = useState<Tab>("phb");

  return (
    <Dropdown
      label={
        <>
          <Sparkles size={15} />
          <span>Insertar</span>
          <ChevronDown size={14} />
        </>
      }
    >
      {(close) => (
        <div className="min-w-80">
          <div className="mb-1 flex gap-0.5 border-b border-[var(--chrome-border)] pb-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded px-2 py-1 text-[11px] font-semibold tracking-wider uppercase transition ${
                  tab === item.id
                    ? "bg-[var(--chrome-border)] text-[var(--chrome-accent)]"
                    : "text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "bestiario" ? (
            <div>
              <MenuItem
                hint="del cursor"
                onClick={() => {
                  onSaveCreature();
                  close();
                }}
              >
                Guardar la ficha del cursor…
              </MenuItem>

              {bestiary.length === 0 ? (
                <p className="px-2.5 py-3 text-xs leading-relaxed text-[var(--chrome-muted)]">
                  Pon el cursor dentro de un bloque ```statblock y guárdalo aquí.
                  Después lo insertas en cualquier documento con
                  <span className="font-mono"> ref: </span>y solo escribes lo que
                  cambie.
                </p>
              ) : (
                <>
                  <div className="my-1 h-px bg-[var(--chrome-border)]" />
                  {bestiary.map((creature) => (
                    <div
                      key={creature.id}
                      className="group flex items-center gap-1 rounded px-1 transition hover:bg-[var(--chrome-border)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onInsert("```statblock\nref: " + creature.slug + "\n```\n");
                          close();
                        }}
                        className="min-w-0 flex-1 truncate px-1.5 py-1.5 text-left text-sm"
                        title={`ref: ${creature.slug}`}
                      >
                        {creature.label}
                      </button>
                      <button
                        type="button"
                        title="Quitar del bestiario"
                        onClick={() => onDeleteCreature(creature.id)}
                        className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[#e08a7a]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : tab === "mios" ? (
            <div>
              <MenuItem
                hint="de la selección"
                onClick={() => {
                  onSaveSelection();
                  close();
                }}
              >
                Guardar fragmento…
              </MenuItem>

              {mine.length === 0 ? (
                <p className="px-2.5 py-3 text-xs leading-relaxed text-[var(--chrome-muted)]">
                  Selecciona texto en el editor y guárdalo aquí para reutilizarlo
                  en cualquier documento.
                </p>
              ) : (
                <>
                  <div className="my-1 h-px bg-[var(--chrome-border)]" />
                  {mine.map((snippet) => (
                    <div
                      key={snippet.id}
                      className="group flex items-center gap-1 rounded px-1 transition hover:bg-[var(--chrome-border)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onInsert(snippet.text);
                          close();
                        }}
                        className="min-w-0 flex-1 truncate px-1.5 py-1.5 text-left text-sm"
                      >
                        {snippet.label}
                      </button>
                      <button
                        type="button"
                        title="Eliminar fragmento"
                        onClick={() => onDeleteMine(snippet.id)}
                        className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[#e08a7a]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            SNIPPET_GROUPS.filter((group) => (group.tab ?? "phb") === tab).map(
              (group) => (
                <div key={group.label}>
                  <MenuLabel>{group.label}</MenuLabel>
                  {group.items.map((snippet) => (
                    <MenuItem
                      key={snippet.label}
                      hint={snippet.hint}
                      onClick={() => {
                        onInsert(snippet.text);
                        close();
                      }}
                    >
                      {snippet.label}
                    </MenuItem>
                  ))}
                </div>
              ),
            )
          )}
        </div>
      )}
    </Dropdown>
  );
}
