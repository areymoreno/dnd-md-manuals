"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteImage,
  getAllImages,
  prepareImage,
  putImage,
  toDataUrl,
  type ImageMeta,
  type StoredImage,
} from "@/lib/images";

export interface BrewImages {
  list: ImageMeta[];
  /** id → blob URL, tal como lo espera el renderizador. */
  urls: Record<string, string>;
  /** Cambia con cada alta o baja; invalida la caché de páginas. */
  key: string;
  totalBytes: number;
  /** Devuelve el id y, si se comprimió, qué se le hizo. Lo segundo se devuelve
   *  en vez de guardarse en estado: quien llama lo necesita en el mismo tick. */
  add: (file: File) => Promise<{ id: string; note: string | null }>;
  remove: (id: string) => Promise<void>;
  /** Las mismas imágenes como data URI, para incrustarlas al exportar. */
  asDataUrls: () => Promise<Record<string, string>>;
}

export function useBrewImages(): BrewImages {
  const [list, setList] = useState<ImageMeta[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(0);
  const created = useRef<string[]>([]);

  const track = useCallback((record: StoredImage): string => {
    const url = URL.createObjectURL(record.blob);
    created.current.push(url);
    return url;
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAllImages()
      .then((records) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const record of records) next[record.id] = track(record);
        setUrls(next);
        setList(
          records.map(({ blob, ...meta }) => {
            void blob;
            return meta;
          }),
        );
        setVersion((value) => value + 1);
      })
      .catch((error) => console.warn("No se pudieron leer las imágenes", error));

    return () => {
      cancelled = true;
    };
  }, [track]);

  // Las URLs de objeto viven mientras viva la pestaña; se sueltan al cerrar.
  useEffect(
    () => () => {
      for (const url of created.current) URL.revokeObjectURL(url);
      created.current = [];
    },
    [],
  );

  const add = useCallback(
    async (file: File) => {
      // Se reduce antes de guardar: lo que entra aquí acaba en base64 dentro
      // del HTML exportado, donde engorda otro 33 %.
      const { blob: prepared, note } = await prepareImage(file);
      const record = await putImage(prepared, file.name || "imagen");
      const { blob, ...meta } = record;
      void blob;

      setUrls((current) => ({ ...current, [record.id]: track(record) }));
      setList((current) => [meta, ...current]);
      setVersion((value) => value + 1);
      return { id: record.id, note };
    },
    [track],
  );

  const remove = useCallback(async (id: string) => {
    await deleteImage(id);
    setUrls((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setList((current) => current.filter((image) => image.id !== id));
    setVersion((value) => value + 1);
  }, []);

  const asDataUrls = useCallback(async () => {
    const records = await getAllImages();
    const entries = await Promise.all(
      records.map(
        async (record) => [record.id, await toDataUrl(record.blob)] as const,
      ),
    );
    return Object.fromEntries(entries);
  }, []);

  return {
    list,
    urls,
    key: String(version),
    totalBytes: list.reduce((total, image) => total + image.size, 0),
    add,
    remove,
    asDataUrls,
  };
}
