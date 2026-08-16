"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DropdownProps {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  title?: string;
  className?: string;
}

export default function Dropdown({
  label,
  children,
  align = "left",
  title,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        title={title}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-panel)] px-2.5 py-1.5 text-sm text-[var(--chrome-text)] transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)] ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 max-h-[70vh] min-w-56 overflow-auto rounded-lg border border-[var(--chrome-border)] bg-[#191512] p-1.5 shadow-2xl shadow-black/60 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  children,
  hint,
  danger = false,
}: {
  onClick: () => void;
  children: ReactNode;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded px-2.5 py-1.5 text-left text-sm transition hover:bg-[var(--chrome-border)] ${
        danger
          ? "text-[#e08a7a] hover:bg-[#3a1a14]"
          : "text-[var(--chrome-text)]"
      }`}
    >
      <span>{children}</span>
      {hint && (
        <span className="shrink-0 font-mono text-xs text-[var(--chrome-muted)]">
          {hint}
        </span>
      )}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-[var(--chrome-muted)] uppercase">
      {children}
    </div>
  );
}
