"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import type { BrewImages } from "@/hooks/useBrewImages";
import { formatBytes } from "@/lib/images";

interface ImagePanelProps {
  images: BrewImages;
  onPick: () => void;
  onInsert: (id: string, name: string) => void;
}

/**
 * Vive en las pestañas del editor, junto a Texto y Estilo: insertar una imagen
 * es escribir en el documento, así que su sitio es el panel donde se escribe.
 */
export default function ImagePanel({
  images,
  onPick,
  onInsert,
}: ImagePanelProps) {
  return (
    <div className="editor-host flex flex-col bg-[var(--chrome-panel)]">
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onPick}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--chrome-border)] px-2 py-2.5 text-xs text-[var(--chrome-muted)] transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
        >
          <ImagePlus size={14} />
          Añadir imagen
        </button>
        <p className="px-1 pt-1.5 text-[11px] leading-snug text-[var(--chrome-muted)]">
          También puedes arrastrarlas o pegarlas sobre el editor. Se reducen
          solas si vienen muy grandes.
        </p>
      </div>

      {images.list.length === 0 ? (
        <p className="px-4 py-4 text-xs text-[var(--chrome-muted)]">
          Todavía no hay ninguna.
        </p>
      ) : (
        <ul className="flex-1 space-y-1 overflow-auto px-2 py-3">
          {images.list.map((image) => (
            <li key={image.id}>
              <div className="group flex items-center gap-2 rounded-md p-1 transition hover:bg-[#221d19]">
                <button
                  type="button"
                  onClick={() => onInsert(image.id, image.name)}
                  title="Insertar en el documento"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images.urls[image.id]}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
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
                  onClick={() => void images.remove(image.id)}
                  className="rounded p-1 text-[var(--chrome-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[#e08a7a]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
