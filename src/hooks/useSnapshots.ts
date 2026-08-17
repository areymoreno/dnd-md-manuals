"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteSnapshot,
  listSnapshots,
  purgeSnapshots,
  takeSnapshot,
  type Snapshot,
} from "@/lib/snapshots";
import type { BrewDoc } from "@/lib/storage";

export interface BrewSnapshots {
  list: Snapshot[];
  save: (doc: BrewDoc, auto?: boolean) => Promise<Snapshot | null>;
  remove: (id: string) => Promise<void>;
  purge: (docId: string) => Promise<void>;
  refresh: () => void;
}

/** Versiones guardadas del documento abierto. */
export function useSnapshots(docId: string | undefined): BrewSnapshots {
  const [list, setList] = useState<Snapshot[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const pending = docId ? listSnapshots(docId) : Promise.resolve([]);

    pending
      .then((items) => {
        if (!cancelled) setList(items);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      });

    return () => {
      cancelled = true;
    };
  }, [docId, version]);

  const save = useCallback(
    async (doc: BrewDoc, auto = true) => {
      const snapshot = await takeSnapshot(doc, { auto });
      if (snapshot) refresh();
      return snapshot;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSnapshot(id);
      refresh();
    },
    [refresh],
  );

  const purge = useCallback(
    async (id: string) => {
      await purgeSnapshots(id);
      refresh();
    },
    [refresh],
  );

  // Estable a propósito: el efecto de autoguardado de BrewApp lo lleva en sus
  // dependencias, y un objeto nuevo en cada render reiniciaría su temporizador
  // sin parar.
  return useMemo(
    () => ({ list, save, remove, purge, refresh }),
    [list, save, remove, purge, refresh],
  );
}
