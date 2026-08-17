"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  title?: string;
  className?: string;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
  maxHeight: number;
}

const MARGIN = 8;

export default function Dropdown({
  label,
  children,
  align = "left",
  title,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /**
   * El panel se dibuja en un portal con posición fija, no dentro del botón.
   * Cualquier ancestro con `overflow` distinto de `visible` recortaría un hijo
   * en posición absoluta —y basta con poner `overflow-x` para que el eje Y
   * deje de ser visible—, así que la barra de fragmentos, que se desplaza en
   * horizontal, se comía los menús enteros.
   */
  const place = useCallback(() => {
    const button = root.current?.getBoundingClientRect();
    if (!button) return;

    const top = button.bottom + 4;
    setPosition({
      top,
      ...(align === "right"
        ? { right: Math.max(MARGIN, window.innerWidth - button.right) }
        : { left: Math.min(button.left, window.innerWidth - MARGIN) }),
      maxHeight: window.innerHeight - top - MARGIN,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (root.current?.contains(target) || panel.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const reposition = () => place();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", reposition);
    // En captura: así se entera también del scroll de los paneles internos.
    window.addEventListener("scroll", reposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

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

      {open &&
        position &&
        createPortal(
          <div
            ref={panel}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              right: position.right,
              maxHeight: position.maxHeight,
            }}
            className="z-[120] min-w-56 overflow-auto rounded-lg border border-[var(--chrome-border)] bg-[#191512] p-1.5 shadow-2xl shadow-black/60"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
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
