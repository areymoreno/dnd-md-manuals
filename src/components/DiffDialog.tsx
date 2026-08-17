"use client";

import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { diffLines } from "@/lib/diff";
import { describeAge, type Snapshot } from "@/lib/snapshots";

interface DiffDialogProps {
  snapshot: Snapshot;
  current: string;
  onClose: () => void;
  onRestore: () => void;
}

export default function DiffDialog({
  snapshot,
  current,
  onClose,
  onRestore,
}: DiffDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const diff = useMemo(
    () => diffLines(snapshot.content, current),
    [snapshot.content, current],
  );

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/70 p-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--chrome-border)] bg-[#191512] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--chrome-border)] px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--chrome-accent)]">
              Versión de {describeAge(snapshot.createdAt)}
            </h2>
            <p className="text-xs text-[var(--chrome-muted)]">
              comparada con lo que tienes ahora ·{" "}
              <span className="text-[#8fbf7a]">+{diff.added}</span>{" "}
              <span className="text-[#e08a7a]">−{diff.removed}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onRestore}
              className="rounded-md border border-[var(--chrome-border)] px-2.5 py-1.5 text-sm transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
            >
              Restaurar esta
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded p-1 text-[var(--chrome-muted)] transition hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-text)]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-3 font-mono text-[12px] leading-relaxed">
          {diff.truncated ? (
            <p className="px-2 py-4 font-sans text-sm text-[var(--chrome-muted)]">
              El cambio es demasiado grande para mostrarlo línea a línea:{" "}
              {diff.removed} líneas de entonces frente a {diff.added} de ahora.
            </p>
          ) : diff.lines.length === 0 ? (
            <p className="px-2 py-4 font-sans text-sm text-[var(--chrome-muted)]">
              No hay diferencias: esta versión es idéntica al texto actual.
            </p>
          ) : (
            diff.lines.map((line, index) => (
              <div
                key={index}
                className={
                  line.kind === "añadida"
                    ? "bg-[#1d2e1a] text-[#b6d9a4]"
                    : line.kind === "quitada"
                      ? "bg-[#3a1a14] text-[#e0a89c]"
                      : "text-[var(--chrome-muted)]"
                }
              >
                <span className="mr-2 inline-block w-3 select-none opacity-70">
                  {line.kind === "añadida"
                    ? "+"
                    : line.kind === "quitada"
                      ? "−"
                      : " "}
                </span>
                <span className="whitespace-pre-wrap">{line.text || " "}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
