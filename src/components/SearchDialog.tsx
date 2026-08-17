"use client";

import { Replace, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BrewDoc } from "@/lib/storage";

interface Hit {
  docId: string;
  docName: string;
  line: number;
  text: string;
  from: number;
  to: number;
}

const MAX_HITS = 120;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function search(docs: BrewDoc[], query: string): Hit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const hits: Hit[] = [];
  for (const doc of docs) {
    const lines = doc.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const haystack = lines[i].toLowerCase();
      let at = haystack.indexOf(needle);
      while (at !== -1) {
        hits.push({
          docId: doc.id,
          docName: doc.name,
          line: i + 1,
          text: lines[i],
          from: at,
          to: at + needle.length,
        });
        if (hits.length >= MAX_HITS) return hits;
        at = haystack.indexOf(needle, at + needle.length);
      }
    }
  }
  return hits;
}

/** Recorta la línea alrededor del hallazgo y resalta la parte encontrada. */
function Excerpt({ hit }: { hit: Hit }) {
  const start = Math.max(0, hit.from - 40);
  const before = (start > 0 ? "…" : "") + hit.text.slice(start, hit.from);
  const match = hit.text.slice(hit.from, hit.to);
  const after = hit.text.slice(hit.to, hit.to + 60);

  return (
    <span className="block truncate font-mono text-[12px] text-[var(--chrome-text)]/80">
      {before}
      <mark className="rounded-sm bg-[var(--chrome-accent)]/30 text-[var(--chrome-accent)]">
        {match}
      </mark>
      {after}
    </span>
  );
}

interface SearchDialogProps {
  docs: BrewDoc[];
  activeId: string;
  onClose: () => void;
  onOpen: (docId: string, line: number) => void;
  onReplace: (replacements: { docId: string; content: string }[]) => void;
}

export default function SearchDialog({
  docs,
  activeId,
  onClose,
  onOpen,
  onReplace,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [everywhere, setEverywhere] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const scope = useMemo(
    () => (everywhere ? docs : docs.filter((doc) => doc.id === activeId)),
    [docs, everywhere, activeId],
  );

  const hits = useMemo(() => search(scope, query), [scope, query]);

  /**
   * Reemplaza sin expresiones regulares y sin distinguir mayúsculas, igual que
   * busca: lo que ves en la lista es exactamente lo que se cambia.
   */
  const applyReplace = () => {
    const needle = query.trim();
    if (!needle) return;

    const affected = scope
      .map((doc) => {
        const parts = doc.content.split(new RegExp(escapeRegExp(needle), "gi"));
        if (parts.length === 1) return null;
        return { docId: doc.id, content: parts.join(replacement) };
      })
      .filter((item): item is { docId: string; content: string } => item !== null);

    if (!affected.length) return;

    const total = hits.length;
    const ok = window.confirm(
      `Se van a sustituir ${total} ${total === 1 ? "aparición" : "apariciones"} de ` +
        `«${needle}» por «${replacement}» en ${affected.length} ` +
        `${affected.length === 1 ? "documento" : "documentos"}.\n\n` +
        `Se guarda una versión antes, por si acaso.\n\n¿Continúo?`,
    );
    if (!ok) return;

    onReplace(affected);
    onClose();
  };

  const byDoc = useMemo(() => {
    const groups = new Map<string, Hit[]>();
    for (const hit of hits) {
      const list = groups.get(hit.docId) ?? [];
      list.push(hit);
      groups.set(hit.docId, list);
    }
    return [...groups.values()];
  }, [hits]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--chrome-border)] bg-[#191512] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--chrome-border)] px-4 py-3">
          <Search size={16} className="text-[var(--chrome-muted)]" />
          <input
            ref={input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={everywhere ? "Buscar en todos los documentos…" : "Buscar en este documento…"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--chrome-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 text-[var(--chrome-muted)] hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-text)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--chrome-border)] px-4 py-2">
          <Replace size={16} className="text-[var(--chrome-muted)]" />
          <input
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
            placeholder="Reemplazar por…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--chrome-muted)]"
          />
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--chrome-muted)]">
            <input
              type="checkbox"
              checked={everywhere}
              onChange={(event) => setEverywhere(event.target.checked)}
            />
            en todos
          </label>
          <button
            type="button"
            onClick={applyReplace}
            disabled={hits.length === 0}
            className="shrink-0 rounded border border-[var(--chrome-border)] px-2 py-1 text-xs transition enabled:hover:border-[var(--chrome-accent)] enabled:hover:text-[var(--chrome-accent)] disabled:opacity-40"
          >
            Reemplazar {hits.length > 0 ? hits.length : ""}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-4 text-sm text-[var(--chrome-muted)]">
              Escribe al menos dos caracteres.
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[var(--chrome-muted)]">
              Sin resultados en {scope.length}{" "}
              {scope.length === 1 ? "documento" : "documentos"}.
            </p>
          ) : (
            <>
              <p className="px-3 pb-1 text-[11px] tracking-widest text-[var(--chrome-muted)] uppercase">
                {hits.length}
                {hits.length === MAX_HITS ? "+" : ""}{" "}
                {hits.length === 1 ? "resultado" : "resultados"}
              </p>
              {byDoc.map((group) => (
                <div key={group[0].docId} className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-[var(--chrome-accent)]">
                    {group[0].docName}
                  </p>
                  <ul>
                    {group.map((hit, index) => (
                      <li key={`${hit.line}-${hit.from}-${index}`}>
                        <button
                          type="button"
                          onClick={() => {
                            onOpen(hit.docId, hit.line);
                            onClose();
                          }}
                          className="flex w-full items-baseline gap-2 rounded px-3 py-1.5 text-left transition hover:bg-[var(--chrome-border)]"
                        >
                          <span className="w-10 shrink-0 text-right font-mono text-[11px] text-[var(--chrome-muted)]">
                            {hit.line}
                          </span>
                          <Excerpt hit={hit} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
