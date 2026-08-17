"use client";

import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { groupIssues, issueTitle, type Issue } from "@/lib/review";

interface ReviewDialogProps {
  issues: Issue[];
  docName: string;
  onClose: () => void;
  onGoToLine: (line: number) => void;
  onGoToPage: (page: number) => void;
}

export default function ReviewDialog({
  issues,
  docName,
  onClose,
  onGoToLine,
  onGoToPage,
}: ReviewDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const groups = groupIssues(issues);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--chrome-border)] bg-[#191512] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--chrome-border)] px-5 py-3.5">
          <h2 className="text-lg font-semibold text-[var(--chrome-accent)]">
            Revisión de «{docName}»
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 text-[var(--chrome-muted)] transition hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-text)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {issues.length === 0 ? (
            <p className="flex items-center gap-2 px-1 py-4 text-sm text-[#8fbf7a]">
              <CircleCheck size={16} />
              Nada que corregir: ni imágenes perdidas, ni referencias rotas, ni
              páginas desbordadas.
            </p>
          ) : (
            groups.map(([kind, list]) => (
              <section key={kind} className="mb-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[#e08a7a] uppercase">
                  <TriangleAlert size={13} />
                  {issueTitle(kind)} ({list.length})
                </h3>
                <ul className="space-y-0.5">
                  {list.map((issue, index) => (
                    <li key={`${kind}-${index}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (issue.line) onGoToLine(issue.line);
                          else if (issue.page) onGoToPage(issue.page);
                          onClose();
                        }}
                        className="flex w-full items-baseline gap-2 rounded px-2 py-1.5 text-left text-sm transition hover:bg-[var(--chrome-border)]"
                      >
                        <span className="w-14 shrink-0 font-mono text-[11px] text-[var(--chrome-muted)]">
                          {issue.line
                            ? `línea ${issue.line}`
                            : issue.page
                              ? `pág. ${issue.page}`
                              : ""}
                        </span>
                        <span className="min-w-0 flex-1 text-[var(--chrome-text)]/85">
                          {issue.message}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
