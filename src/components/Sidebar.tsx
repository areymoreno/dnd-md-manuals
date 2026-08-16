"use client";

import { Copy, FilePlus, ImagePlus, Trash2, Upload } from "lucide-react";
import { formatBytes } from "@/lib/images";
import type { OutlineEntry } from "@/lib/markdown";
import type { BrewDoc } from "@/lib/storage";
import type { BrewImages } from "@/hooks/useBrewImages";

export type SidebarTab = "docs" | "outline" | "images";

const TABS: { id: SidebarTab; label: string }[] = [
  { id: "docs", label: "Documentos" },
  { id: "outline", label: "Índice" },
  { id: "images", label: "Imágenes" },
];

interface SidebarProps {
  tab: SidebarTab;
  onTab: (tab: SidebarTab) => void;

  docs: BrewDoc[];
  activeId: string;
  onSelect: (id: string) => void;
  onDuplicate: (doc: BrewDoc) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onImport: () => void;

  outline: OutlineEntry[];
  onJump: (page: number) => void;

  images: BrewImages;
  onPickImage: () => void;
  onInsertImage: (id: string, name: string) => void;

  storage: { chars: number; ratio: number };
}

export default function Sidebar({
  tab,
  onTab,
  docs,
  activeId,
  onSelect,
  onDuplicate,
  onDelete,
  onNew,
  onImport,
  outline,
  onJump,
  images,
  onPickImage,
  onInsertImage,
  storage,
}: SidebarProps) {
  return (
    <aside className="app-chrome flex w-64 shrink-0 flex-col border-r border-[var(--chrome-border)] bg-[#191512]">
      <div className="flex border-b border-[var(--chrome-border)]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`flex-1 px-1 py-2 text-[11px] font-semibold tracking-wider uppercase transition ${
              tab === item.id
                ? "border-b-2 border-[var(--chrome-accent)] text-[var(--chrome-accent)]"
                : "text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "docs" && (
        <>
          <div className="flex justify-end gap-1 px-2 pt-2">
            <button
              type="button"
              onClick={onImport}
              title="Importar .md"
              className="rounded p-1.5 text-[var(--chrome-muted)] hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-accent)]"
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={onNew}
              title="Nuevo documento"
              className="rounded p-1.5 text-[var(--chrome-muted)] hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-accent)]"
            >
              <FilePlus size={14} />
            </button>
          </div>

          <ul className="flex-1 space-y-0.5 overflow-auto px-2 pt-1 pb-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <div
                  className={`group flex items-center gap-1 rounded-md px-2 py-1.5 transition ${
                    doc.id === activeId
                      ? "bg-[var(--chrome-border)] text-[var(--chrome-accent)]"
                      : "hover:bg-[#221d19]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(doc.id)}
                    className="min-w-0 flex-1 truncate text-left text-sm"
                    title={doc.name}
                  >
                    {doc.name}
                  </button>
                  <button
                    type="button"
                    title="Duplicar"
                    onClick={() => onDuplicate(doc)}
                    className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--chrome-text)]"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => onDelete(doc.id)}
                    className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[#e08a7a]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "outline" && (
        <div className="flex-1 overflow-auto px-2 py-2">
          {outline.length === 0 ? (
            <p className="px-2 py-3 text-xs text-[var(--chrome-muted)]">
              Sin encabezados todavía. Escribe `# Título` para que aparezcan aquí.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {outline.map((entry, index) => (
                <li key={`${entry.page}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onJump(entry.page)}
                    className="flex w-full items-baseline gap-2 rounded px-2 py-1 text-left transition hover:bg-[#221d19] hover:text-[var(--chrome-accent)]"
                    style={{ paddingLeft: `${0.5 + (entry.level - 1) * 0.7}rem` }}
                  >
                    <span
                      className={`min-w-0 flex-1 truncate ${
                        entry.level === 1
                          ? "text-sm font-semibold text-[var(--chrome-text)]"
                          : "text-[13px] text-[var(--chrome-text)]/80"
                      }`}
                    >
                      {entry.text}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--chrome-muted)]">
                      {entry.page}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "images" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-2 pt-2">
            <button
              type="button"
              onClick={onPickImage}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--chrome-border)] px-2 py-2 text-xs text-[var(--chrome-muted)] transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
            >
              <ImagePlus size={14} />
              Añadir imagen
            </button>
            <p className="px-1 pt-1.5 text-[11px] leading-snug text-[var(--chrome-muted)]">
              También puedes arrastrarlas o pegarlas sobre el editor.
            </p>
          </div>

          <ul className="flex-1 space-y-1 overflow-auto px-2 py-2">
            {images.list.map((image) => (
              <li key={image.id}>
                <div className="group flex items-center gap-2 rounded-md p-1 transition hover:bg-[#221d19]">
                  <button
                    type="button"
                    onClick={() => onInsertImage(image.id, image.name)}
                    title="Insertar en el documento"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images.urls[image.id]}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-[var(--chrome-text)]">
                        {image.name}
                      </span>
                      <span className="block text-[11px] text-[var(--chrome-muted)]">
                        {formatBytes(image.size)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Eliminar imagen"
                    onClick={() => images.remove(image.id)}
                    className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[#e08a7a]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-[var(--chrome-border)] px-3 py-2 text-[11px] text-[var(--chrome-muted)]">
        <div
          className="mb-1 flex justify-between"
          title={`${storage.chars.toLocaleString("es-ES")} de 4.900.000 caracteres`}
        >
          <span>Texto</span>
          <span>{Math.round(storage.ratio * 100)}% del navegador</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[var(--chrome-border)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(2, storage.ratio * 100)}%`,
              background:
                storage.ratio > 0.85
                  ? "#e08a7a"
                  : storage.ratio > 0.6
                    ? "#d9a95c"
                    : "var(--chrome-accent)",
            }}
          />
        </div>
        {images.totalBytes > 0 && (
          <div className="mt-1.5 flex justify-between">
            <span>Imágenes</span>
            <span>{formatBytes(images.totalBytes)}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
