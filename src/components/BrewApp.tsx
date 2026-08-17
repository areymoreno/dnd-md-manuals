"use client";

import type { EditorView } from "@codemirror/view";
import {
  BookOpen,
  BookOpenText,
  ChevronDown,
  ClipboardCheck,
  Columns2,
  Eye,
  FileText,
  Link2,
  Maximize,
  Palette,
  PanelLeft,
  Pencil,
  Printer,
  Scroll,
  Search,
  TriangleAlert,
  Unlink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBrewImages } from "@/hooks/useBrewImages";
import { formatBytes } from "@/lib/images";
import { useSnapshots } from "@/hooks/useSnapshots";
import { scopeCss, STYLE_PLACEHOLDER } from "@/lib/customCss";
import { countMojibake, decodeFile, repairMojibake } from "@/lib/encoding";
import {
  extractOutline,
  pageForLine,
  parseMetadata,
  renderBrew,
  renderPages,
} from "@/lib/markdown";
import { SAMPLE_BREW } from "@/lib/sample";
import { CURSOR_TOKEN } from "@/lib/snippets";
import {
  buildShareUrl,
  canShare,
  decodeShare,
  MAX_URL_CHARS,
  takeSharedFragment,
} from "@/lib/share";
import { reviewDocument } from "@/lib/review";
import type { Snapshot } from "@/lib/snapshots";
import {
  bestiaryMap,
  createCreature,
  loadBestiary,
  saveBestiary,
  statblockAround,
  type Creature,
} from "@/lib/bestiary";
import {
  createUserSnippet,
  loadUserSnippets,
  saveUserSnippets,
  type UserSnippet,
} from "@/lib/userSnippets";
import {
  buildBackup,
  createDoc,
  downloadFile,
  DOC_DEFAULTS,
  duplicateDoc,
  loadActiveId,
  loadDocs,
  loadLegacySettings,
  loadSettings,
  migrateDocSettings,
  mergeBackup,
  readBackup,
  safeFilename,
  saveActiveId,
  saveDocs,
  saveSettings,
  storageUsage,
  type BrewDoc,
  type BrewSettings,
  type BrewTheme,
} from "@/lib/storage";
import Dropdown, { MenuItem, MenuLabel } from "./Dropdown";
import HelpDialog from "./HelpDialog";
import ImagePanel from "./ImagePanel";
import DiffDialog from "./DiffDialog";
import ReviewDialog from "./ReviewDialog";
import SearchDialog from "./SearchDialog";
import SnippetMenu from "./SnippetMenu";
import Preview from "./Preview";
import Sidebar, { type SidebarTab } from "./Sidebar";

const MarkdownEditor = dynamic(() => import("./MarkdownEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--chrome-muted)]">
      Cargando editor…
    </div>
  ),
});

/** Los temas que trae el proyecto; el orden es el del menú. */
const THEMES: Record<BrewTheme, { label: string; short: string }> = {
  phb: { label: "Manual del Jugador", short: "PHB" },
  dmg: { label: "Guía del Dungeon Master", short: "DMG" },
  limpio: { label: "Limpio (papel blanco)", short: "Limpio" },
  grimorio: { label: "Grimorio (oscuro)", short: "Grimorio" },
  diario: { label: "Diario (sepia)", short: "Diario" },
};

const CM_PER_PX = 37.7952755;
const PAGE_WIDTH_PX = { letter: 21.59 * CM_PER_PX, a4: 21 * CM_PER_PX };

/** Se ejecuta una sola vez, ya en el navegador (ver BrewAppClient). */
function restore(): { docs: BrewDoc[]; activeId: string; settings: BrewSettings } {
  const stored = loadDocs();
  const base = stored?.length
    ? stored
    : [createDoc("La Cripta del Rey Sin Nombre", SAMPLE_BREW)];
  // Tamaño, tema y numeración eran globales hasta hace poco: se bajan al
  // documento la primera vez, para no cambiarle el papel a nadie sin avisar.
  const docs = migrateDocSettings(base, loadLegacySettings());
  const previous = loadActiveId();

  return {
    docs,
    activeId:
      previous && docs.some((doc) => doc.id === previous)
        ? previous
        : docs[0].id,
    settings: loadSettings(),
  };
}

export default function BrewApp() {
  const [initial] = useState(restore);
  const [docs, setDocs] = useState<BrewDoc[]>(initial.docs);
  const [activeId, setActiveId] = useState<string>(initial.activeId);
  const [settings, setSettings] = useState<BrewSettings>(initial.settings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("docs");
  const [editorTab, setEditorTab] = useState<"text" | "style" | "images">(
    "text",
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [comparing, setComparing] = useState<Snapshot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [autoZoom, setAutoZoom] = useState(1);
  const [saveError, setSaveError] = useState<"quota" | "error" | null>(null);
  const [storage, setStorage] = useState({ chars: 0, ratio: 0 });
  const [cursorLine, setCursorLine] = useState(1);
  const [overflowing, setOverflowing] = useState<number[]>([]);
  const [mySnippets, setMySnippets] = useState<UserSnippet[]>(loadUserSnippets);
  const [bestiary, setBestiary] = useState<Creature[]>(loadBestiary);

  const images = useBrewImages();
  const snapshots = useSnapshots(activeId);

  const viewRef = useRef<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const pendingSnippet = useRef<string | null>(null);
  /** Última línea visitada en cada documento, para volver donde lo dejaste. */
  const lastLine = useRef(new Map<string, number>());

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeId) ?? docs[0],
    [docs, activeId],
  );

  const pageSize = activeDoc.pageSize ?? DOC_DEFAULTS.pageSize;
  const theme = activeDoc.theme ?? DOC_DEFAULTS.theme;
  const columns = activeDoc.columns ?? DOC_DEFAULTS.columns;
  const pageNumbers = activeDoc.pageNumbers ?? DOC_DEFAULTS.pageNumbers;

  /* ------------------------------------------------------ persistencia --- */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = saveDocs(docs);
      setSaveError(result.ok ? null : result.reason);
      setStorage(storageUsage());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [docs]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  /**
   * Versión automática mientras escribes. El propio `takeSnapshot` decide si
   * toca —espacia las automáticas y descarta las que no cambian nada—, así que
   * aquí basta con proponérselo cuando el texto deja de moverse.
   */
  useEffect(() => {
    const id = window.setTimeout(() => {
      void snapshots.save(activeDoc, true);
    }, 4000);
    return () => window.clearTimeout(id);
  }, [activeDoc, snapshots]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  /* --------------------------------------------------- tamaño de papel --- */

  useEffect(() => {
    let style = document.getElementById(
      "brew-page-size",
    ) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "brew-page-size";
      document.head.appendChild(style);
    }
    // Con marcas, la hoja crece 1,6 cm por eje: sangrado, hueco y marca a cada
    // lado. Si no, la impresora recortaría justo lo que hay que ver.
    const extra = settings.printMarks ? 1.6 : 0;
    const size = pageSize === "a4" ? [21, 29.7] : [21.59, 27.94];

    style.textContent = settings.printMarks
      ? `@page { size: ${size[0] + extra}cm ${size[1] + extra}cm; margin: 0; }`
      : `@page { size: ${pageSize === "a4" ? "A4" : "letter"}; margin: 0; }`;
  }, [pageSize, settings.printMarks]);

  /* -------------------------------------------------------- renderizado --- */

  const source = activeDoc?.content ?? "";
  const deferredSource = useDeferredValue(source);

  const pages = useMemo(
    () =>
      renderPages(deferredSource, {
        pageNumbers,
        images: images.urls,
        imagesKey: images.key,
        creatures: bestiaryMap(bestiary),
        creaturesKey: String(bestiary.length) + (bestiary[0]?.id ?? ""),
        startPage: activeDoc.startPage ?? 1,
        numberStyle: activeDoc.numberStyle ?? "arabic",
      }),
    [
      deferredSource,
      pageNumbers,
      images.urls,
      images.key,
      bestiary,
      activeDoc.startPage,
      activeDoc.numberStyle,
    ],
  );

  const outline = useMemo(
    () => extractOutline(deferredSource),
    [deferredSource],
  );

  const pageCount = pages.length;

  /* -------------------------------------------------------------- zoom --- */

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;

    const recompute = () => {
      const available = node.clientWidth - 48;
      const scale = available / PAGE_WIDTH_PX[pageSize];
      setAutoZoom(Math.min(1.6, Math.max(0.25, scale)));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(node);
    return () => observer.disconnect();
  }, [pageSize, settings.view]);

  const zoom = settings.zoom === 0 ? autoZoom : settings.zoom;

  /* ------------------------------------------------ seguir al cursor --- */

  /** Lo que el autocompletado necesita saber del documento abierto. */
  const completions = useMemo(
    () => ({
      images: images.list.map((image) => ({ id: image.id, name: image.name })),
      anchors: [
        ...new Set(
          [...deferredSource.matchAll(/[{,]#([A-Za-z][\w-]*)/g)].map(
            (match) => match[1],
          ),
        ),
      ],
    }),
    [images.list, deferredSource],
  );

  const issues = useMemo(
    () =>
      reviewOpen
        ? reviewDocument({
            doc: activeDoc,
            imageIds: new Set(images.list.map((image) => image.id)),
            creatureSlugs: new Set(bestiary.map((creature) => creature.slug)),
            overflowingPages: overflowing,
          })
        : [],
    [reviewOpen, activeDoc, images.list, bestiary, overflowing],
  );

  const cursorPage = useMemo(
    () => pageForLine(deferredSource, cursorLine),
    [deferredSource, cursorLine],
  );

  /**
   * Al mover el cursor, la vista previa se acerca a la página que estás
   * tocando. Solo cuando cambia de página: si no, cada pulsación de tecla
   * pelearía con el scroll y no se podría leer nada.
   */
  useEffect(() => {
    if (!settings.syncScroll || settings.view === "editor") return;

    const pane = previewRef.current;
    const target = pane?.querySelector<HTMLElement>(`#p${cursorPage}`);
    if (!pane || !target) return;

    for (const el of pane.querySelectorAll(".page.is-current")) {
      el.classList.remove("is-current");
    }
    target.classList.add("is-current");

    const id = window.setTimeout(() => {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [cursorPage, settings.syncScroll, settings.view, pages.length]);

  /* ------------------------------------------------------------ acciones --- */

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  /* ---------------------------------------------------------- atajos --- */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ------------------------------------------------ enlace compartido --- */

  const importedShares = useRef(new Set<string>());

  /**
   * Abre el documento que venga en el `#doc=` de la URL.
   *
   * La importación es idempotente por fragmento en vez de cancelable: en
   * desarrollo React monta, desmonta y vuelve a montar los efectos, y una
   * cancelación en el desmontaje abortaba la descompresión a medias — el hash
   * ya se había limpiado, así que en el segundo montaje no quedaba nada que
   * leer y el documento se perdía.
   */
  const importShared = useCallback(() => {
    const fragment = takeSharedFragment();
    if (!fragment || importedShares.current.has(fragment)) return;
    importedShares.current.add(fragment);

    decodeShare(fragment)
      .then((shared) => {
        if (!shared) {
          flash("El enlace no se pudo leer");
          return;
        }
        const doc = createDoc(
          shared.name || "Documento compartido",
          shared.content,
        );
        doc.style = shared.style;
        doc.pageSize = shared.pageSize;
        doc.theme = shared.theme;
        doc.pageNumbers = shared.pageNumbers;
        setDocs((current) => [doc, ...current]);
        setActiveId(doc.id);
        flash(`«${doc.name}» abierto desde el enlace`);
      })
      .catch(() => flash("El enlace no se pudo leer"));
  }, [flash]);

  /**
   * También en `hashchange`: pegar un enlace en una pestaña que ya tiene la app
   * abierta es una navegación dentro del mismo documento, sin recarga.
   */
  useEffect(() => {
    importShared();
    window.addEventListener("hashchange", importShared);
    return () => window.removeEventListener("hashchange", importShared);
  }, [importShared]);

  const updateActive = useCallback(
    (patch: Partial<BrewDoc>) => {
      setDocs((current) =>
        current.map((doc) =>
          doc.id === activeId ? { ...doc, ...patch, updatedAt: Date.now() } : doc,
        ),
      );
    },
    [activeId],
  );

  const handleChange = useCallback(
    (value: string) => updateActive({ content: value }),
    [updateActive],
  );

  const insertSnippet = useCallback(
    (text: string) => {
      const view = viewRef.current;
      // Los fragmentos son Markdown: si estás en la pestaña de estilos, se
      // vuelve a la de texto y se inserta cuando el editor esté montado.
      if (!view || editorTab !== "text") {
        pendingSnippet.current = text;
        setEditorTab("text");
        return;
      }

      const marker = text.indexOf(CURSOR_TOKEN);
      const insert =
        marker >= 0 ? text.replace(CURSOR_TOKEN, "") : text;
      const { from, to } = view.state.selection.main;

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + (marker >= 0 ? marker : insert.length) },
        scrollIntoView: true,
      });
      view.focus();
    },
    [editorTab],
  );

  /** Guarda lo seleccionado en el editor como fragmento reutilizable. */
  const handleSaveSnippet = useCallback(() => {
    const view = viewRef.current;
    const { from, to } = view?.state.selection.main ?? { from: 0, to: 0 };
    const text = view?.state.sliceDoc(from, to) ?? "";

    if (!text.trim()) {
      window.alert(
        "Selecciona en el editor el texto que quieras guardar como fragmento.",
      );
      return;
    }

    const label = window.prompt(
      "Nombre del fragmento",
      text.trim().split("\n")[0].slice(0, 40),
    );
    if (!label?.trim()) return;

    setMySnippets((current) => {
      const next = [createUserSnippet(label, text), ...current];
      saveUserSnippets(next);
      return next;
    });
    flash("Fragmento guardado");
  }, [flash]);

  /** Guarda en el bestiario la ficha en la que está el cursor. */
  const handleSaveCreature = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;

    const found = statblockAround(
      view.state.doc.toString(),
      view.state.selection.main.head,
    );
    if (!found) {
      window.alert(
        "Pon el cursor dentro de un bloque ```statblock para guardarlo en el bestiario.",
      );
      return;
    }

    const label = window.prompt("Nombre en el bestiario", found.name);
    if (!label?.trim()) return;

    const creature = createCreature(label, found.yaml);
    setBestiary((current) => {
      const next = [creature, ...current.filter((c) => c.slug !== creature.slug)];
      saveBestiary(next);
      return next;
    });
    flash(`«${creature.label}» guardada como ${creature.slug}`);
  }, [flash]);

  const handleDeleteCreature = useCallback((id: string) => {
    setBestiary((current) => {
      const next = current.filter((item) => item.id !== id);
      saveBestiary(next);
      return next;
    });
  }, []);

  const handleDeleteSnippet = useCallback((id: string) => {
    setMySnippets((current) => {
      const next = current.filter((item) => item.id !== id);
      saveUserSnippets(next);
      return next;
    });
  }, []);

  const addDoc = useCallback(
    (doc: BrewDoc) => {
      setDocs((current) => [doc, ...current]);
      setActiveId(doc.id);
    },
    [],
  );

  const handleNew = useCallback(() => {
    addDoc(createDoc("Documento sin título", "# Título\n\n"));
    flash("Documento creado");
  }, [addDoc, flash]);

  const handleDuplicate = useCallback(() => {
    if (!activeDoc) return;
    addDoc(duplicateDoc(activeDoc));
    flash("Documento duplicado");
  }, [activeDoc, addDoc, flash]);

  const handleRename = useCallback(() => {
    if (!activeDoc) return;
    const name = window.prompt("Nombre del documento", activeDoc.name);
    if (name?.trim()) updateActive({ name: name.trim() });
  }, [activeDoc, updateActive]);

  const handleDelete = useCallback(
    (id: string) => {
      const doc = docs.find((item) => item.id === id);
      if (!doc) return;
      if (!window.confirm(`¿Eliminar «${doc.name}»? No se puede deshacer.`)) {
        return;
      }
      const next = docs.filter((item) => item.id !== id);
      if (next.length === 0) {
        const fresh = createDoc("Documento sin título", "# Título\n\n");
        setDocs([fresh]);
        void snapshots.purge(id);
        setActiveId(fresh.id);
        return;
      }

      setDocs(next);
      void snapshots.purge(id);
      if (id === activeId) setActiveId(next[0].id);
    },
    [docs, activeId, snapshots],
  );

  const handleImport = useCallback(
    async (file: File) => {
      const decoded = await decodeFile(file);
      let text = decoded.text;

      if (decoded.encoding !== "utf-8") {
        flash(`Leído como ${decoded.encoding}`);
      } else if (decoded.mojibake > 0) {
        const preview = repairMojibake(text);
        const accept = window.confirm(
          `Este archivo trae ${decoded.mojibake} acentos rotos («Ã©» en vez de «é»): ` +
            `viene de haberse guardado con la codificación cambiada.\n\n` +
            `¿Los reparo al importarlo?` +
            (preview.unresolved
              ? `\n\n${
                  preview.unresolved === 1
                    ? "Quedará 1 resto que perdió bytes"
                    : `Quedarán ${preview.unresolved} restos que perdieron bytes`
                } en el daño original y hay que repasar a mano.`
              : ""),
        );
        if (accept) text = preview.text;
      }

      // Los brews de Homebrewery traen título y tema en el bloque ```metadata.
      const meta = parseMetadata(text);
      const name =
        meta?.title?.trim() || file.name.replace(/\.(md|markdown|txt)$/i, "");

      // El tema del brew es del documento, así que viaja con él.
      const doc = createDoc(name, text);
      if (/dmg/i.test(meta?.theme ?? "")) doc.theme = "dmg";

      addDoc(doc);
      flash(`«${name}» importado`);
    },
    [addDoc, flash],
  );

  const insertText = useCallback((text: string) => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
      scrollIntoView: true,
    });
    view.focus();
  }, []);

  const addImages = useCallback(
    async (files: File[]) => {
      const pictures = files.filter((file) => file.type.startsWith("image/"));
      if (!pictures.length) return;

      const lines: string[] = [];
      const notes: string[] = [];
      for (const file of pictures) {
        const { id, note } = await images.add(file);
        lines.push(`![${file.name.replace(/\.[^.]+$/, "")}](brew:${id})`);
        if (note) notes.push(note);
      }
      insertText(`${lines.join("\n")}\n`);

      const base =
        pictures.length === 1
          ? "Imagen guardada en el navegador"
          : `${pictures.length} imágenes guardadas`;
      // Si se comprimió, dilo: es una imagen distinta de la que soltaste.
      flash(notes.length === 1 ? `${base} · ${notes[0]}` : base);
    },
    [images, insertText, flash],
  );

  const handleJumpToPage = useCallback((page: number) => {
    previewRef.current
      ?.querySelector(`#p${page}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleExportBackup = useCallback(() => {
    downloadFile(
      `forja-de-manuales-${new Date().toISOString().slice(0, 10)}.json`,
      buildBackup(docs, mySnippets),
      "application/json;charset=utf-8",
    );
    flash("Copia de seguridad descargada");
  }, [docs, mySnippets, flash]);

  const handleRestoreBackup = useCallback(
    async (file: File) => {
      try {
        const restored = readBackup(await file.text());
        setDocs((current) => mergeBackup(current, restored));
        flash(
          `${restored.length} ${restored.length === 1 ? "documento restaurado" : "documentos restaurados"}`,
        );
      } catch (error) {
        window.alert(
          `No se pudo restaurar la copia.\n\n${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    [flash],
  );

  const handleRepairAccents = useCallback(() => {
    if (!activeDoc) return;

    const found = countMojibake(activeDoc.content);
    if (found === 0) {
      window.alert("Este documento no tiene acentos rotos que reparar.");
      return;
    }

    const repaired = repairMojibake(activeDoc.content);
    const ok = window.confirm(
      `Se van a corregir ${repaired.replaced} secuencias.` +
        (repaired.unresolved
          ? `\n\n${
              repaired.unresolved === 1
                ? "Quedará 1 resto («Ã», «Â» o «â»)"
                : `Quedarán ${repaired.unresolved} restos («Ã», «Â», «â»)`
            } que perdió bytes en el daño original: no se puede saber si era Á o Í, así que se deja intacto para que lo repases.`
          : "") +
        "\n\n¿Continúo?",
    );
    if (!ok) return;

    updateActive({ content: repaired.text });
    flash(`${repaired.replaced} acentos reparados`);
  }, [activeDoc, updateActive, flash]);

  const handleSaveVersion = useCallback(async () => {
    const saved = await snapshots.save(activeDoc, false);
    flash(saved ? "Versión guardada" : "Sin cambios desde la última versión");
  }, [activeDoc, snapshots, flash]);

  /** Restaura de verdad; el diálogo de comparación es quien lo llama. */
  const applyRestore = useCallback(
    async (snapshot: Snapshot) => {
      await snapshots.save(activeDoc, false);
      updateActive({ content: snapshot.content, style: snapshot.style });
      setComparing(null);
      flash("Versión restaurada");
    },
    [activeDoc, snapshots, updateActive, flash],
  );

  const handleShare = useCallback(async () => {
    if (!canShare) {
      window.alert(
        "Este navegador no puede comprimir el enlace. Exporta el documento a .md o .html.",
      );
      return;
    }

    const url = await buildShareUrl(activeDoc);
    if (url.length > MAX_URL_CHARS) {
      const seguir = window.confirm(
        `El enlace sale de ${url.length.toLocaleString("es-ES")} caracteres y muchos ` +
          `navegadores y aplicaciones de mensajería cortan por encima de ` +
          `${MAX_URL_CHARS.toLocaleString("es-ES")}.\n\n` +
          `Para un manual largo es mejor exportar el .html.\n\n¿Lo copio igualmente?`,
      );
      if (!seguir) return;
    }

    try {
      await navigator.clipboard.writeText(url);
      flash("Enlace copiado al portapapeles");
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }, [activeDoc, flash]);

  const handleInsertImage = useCallback(
    (id: string, name: string) => {
      // Vía `insertSnippet` y no `insertText`: al pulsar desde la pestaña de
      // imágenes el editor de texto todavía no está montado, y esa es la que
      // sabe encolar la inserción hasta que lo esté.
      insertSnippet(`![${name.replace(/\.[^.]+$/, "")}](brew:${id})\n`);
    },
    [insertSnippet],
  );

  /** Abre un resultado de la búsqueda global: documento y línea. */
  const handleOpenHit = useCallback(
    (docId: string, line: number) => {
      lastLine.current.set(docId, line);
      if (docId !== activeId) {
        setActiveId(docId);
        return; // al montar, el editor restaura la línea recordada
      }
      const view = viewRef.current;
      if (!view || line > view.state.doc.lines) return;
      const at = view.state.doc.line(line).from;
      view.dispatch({ selection: { anchor: at }, scrollIntoView: true });
      view.focus();
    },
    [activeId],
  );

  /** Aplica un reemplazo global, con copia de seguridad previa. */
  const handleReplace = useCallback(
    async (replacements: { docId: string; content: string }[]) => {
      // Una versión antes de tocar nada: un reemplazo masivo mal hecho es de
      // las pocas cosas que no se arreglan con Cmd+Z si cambias de documento.
      await snapshots.save(activeDoc, false);

      const byId = new Map(replacements.map((item) => [item.docId, item.content]));
      setDocs((current) =>
        current.map((doc) =>
          byId.has(doc.id)
            ? { ...doc, content: byId.get(doc.id)!, updatedAt: Date.now() }
            : doc,
        ),
      );
      flash(
        replacements.length === 1
          ? "Reemplazado"
          : `Reemplazado en ${replacements.length} documentos`,
      );
    },
    [activeDoc, snapshots, flash],
  );

  const handleExportMarkdown = useCallback(() => {
    if (!activeDoc) return;
    downloadFile(`${safeFilename(activeDoc.name)}.md`, activeDoc.content);
  }, [activeDoc]);

  const handleExportHtml = useCallback(async () => {
    if (!activeDoc) return;
    const css = await fetch("/brew.css").then((response) => response.text());
    // Las imágenes locales viajan dentro del archivo, no como enlace.
    const embedded = await images.asDataUrls();
    const size = pageSize === "a4" ? "A4" : "letter";
    const page = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${activeDoc.name}</title>
<!-- Quita esta línea si prefieres no depender de Google Fonts; el documento
     caerá entonces a las fuentes equivalentes que tengas instaladas. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700&family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap">
<style>
${css}
@page { size: ${size}; margin: 0; }
html, body { margin: 0; background: #22201c; }
.brew { padding: 1.5rem 0 3rem; }
@media print { .brew { padding: 0; } html, body { background: #fff; } }
</style>
${
  activeDoc.style?.trim()
    ? `<style>\n/* Estilos propios de este documento */\n${scopeCss(activeDoc.style, true)}\n</style>`
    : ""
}
</head>
<body>
<div class="brew" data-size="${pageSize}" data-theme="${theme}" data-columns="${columns}">
${renderBrew(activeDoc.content, {
  pageNumbers,
  images: embedded,
  imagesKey: "export",
})}
</div>
</body>
</html>
`;
    downloadFile(
      `${safeFilename(activeDoc.name)}.html`,
      page,
      "text/html;charset=utf-8",
    );
    flash("HTML exportado");
  }, [
    activeDoc,
    pageSize,
    pageNumbers,
    theme,
    columns,
    images,
    flash,
  ]);

  /* ------------------------------------------------------- panel resize --- */

  const startResize = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const container = mainRef.current;
    if (!container) return;

    const onMove = (move: MouseEvent) => {
      const bounds = container.getBoundingClientRect();
      const ratio = (move.clientX - bounds.left) / bounds.width;
      setSettings((current) => ({
        ...current,
        splitRatio: Math.min(0.75, Math.max(0.2, ratio)),
      }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  /* ------------------------------------------------------------- render --- */

  const showEditor = settings.view !== "preview" && settings.view !== "lectura";
  const showPreview = settings.view !== "editor";
  const reading = settings.view === "lectura";

  return (
    <div className="app-shell">
      <header className="app-chrome flex flex-wrap items-center gap-2 border-b border-[var(--chrome-border)] bg-[var(--chrome-panel)] px-3 py-2">
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          title="Documentos"
          className={`rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)] ${
            sidebarOpen ? "text-[var(--chrome-accent)]" : ""
          }`}
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-2 pr-1">
          <Scroll size={17} className="text-[var(--chrome-accent)]" />
          <button
            type="button"
            onClick={handleRename}
            title="Renombrar documento"
            className="max-w-[16rem] truncate text-sm font-medium hover:text-[var(--chrome-accent)]"
          >
            {activeDoc.name}
          </button>
        </div>

        <div className="mx-1 h-6 w-px bg-[var(--chrome-border)]" />



        <SnippetMenu
          onInsert={insertSnippet}
          mine={mySnippets}
          onSaveSelection={handleSaveSnippet}
          onDeleteMine={handleDeleteSnippet}
          bestiary={bestiary}
          onSaveCreature={handleSaveCreature}
          onDeleteCreature={handleDeleteCreature}
        />

        <Dropdown
          label={
            <>
              <FileText size={15} />
              <span>Archivo</span>
              <ChevronDown size={14} />
            </>
          }
        >
          {(close) => (
            <div className="min-w-60">
              <MenuItem
                onClick={() => {
                  handleNew();
                  close();
                }}
              >
                Nuevo documento
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleDuplicate();
                  close();
                }}
              >
                Duplicar actual
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleRename();
                  close();
                }}
              >
                Renombrar…
              </MenuItem>
              <MenuItem
                onClick={() => {
                  void handleSaveVersion();
                  close();
                }}
              >
                Guardar versión
              </MenuItem>
              <MenuItem
                hint="sin servidor"
                onClick={() => {
                  void handleShare();
                  close();
                }}
              >
                Copiar enlace para compartir
              </MenuItem>
              <MenuItem
                hint="Ã© → é"
                onClick={() => {
                  handleRepairAccents();
                  close();
                }}
              >
                Reparar acentos…
              </MenuItem>
              <div className="my-1 h-px bg-[var(--chrome-border)]" />
              <MenuItem
                onClick={() => {
                  fileInputRef.current?.click();
                  close();
                }}
              >
                Importar .md…
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleExportMarkdown();
                  close();
                }}
              >
                Exportar .md
              </MenuItem>
              <MenuItem
                onClick={() => {
                  void handleExportHtml();
                  close();
                }}
              >
                Exportar .html
              </MenuItem>
              <div className="my-1 h-px bg-[var(--chrome-border)]" />
              <MenuItem
                hint="todo"
                onClick={() => {
                  handleExportBackup();
                  close();
                }}
              >
                Copia de seguridad…
              </MenuItem>
              <MenuItem
                onClick={() => {
                  backupInputRef.current?.click();
                  close();
                }}
              >
                Restaurar copia…
              </MenuItem>
            </div>
          )}
        </Dropdown>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-[var(--chrome-border)]">
            {(
              [
                ["editor", Pencil, "Solo editor"],
                ["split", Columns2, "Editor y vista previa"],
                ["preview", Eye, "Solo vista previa"],
                ["lectura", BookOpenText, "Modo lectura, para la mesa"],
              ] as const
            ).map(([mode, Icon, title]) => (
              <button
                key={mode}
                type="button"
                title={title}
                onClick={() => setSettings((s) => ({ ...s, view: mode }))}
                className={`p-2 transition ${
                  settings.view === mode
                    ? "bg-[var(--chrome-border)] text-[var(--chrome-accent)]"
                    : "hover:text-[var(--chrome-accent)]"
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <button
            type="button"
            title={
              settings.syncScroll
                ? "La vista previa sigue al cursor — pulsa para soltarla"
                : "La vista previa va suelta — pulsa para que siga al cursor"
            }
            onClick={() =>
              setSettings((s) => ({ ...s, syncScroll: !s.syncScroll }))
            }
            className={`rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] ${
              settings.syncScroll
                ? "text-[var(--chrome-accent)]"
                : "text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]"
            }`}
          >
            {settings.syncScroll ? <Link2 size={15} /> : <Unlink size={15} />}
          </button>

          <div className="flex items-center gap-1 rounded-md border border-[var(--chrome-border)] px-1">
            <button
              type="button"
              title="Alejar"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  zoom: Math.max(0.25, (s.zoom === 0 ? autoZoom : s.zoom) - 0.1),
                }))
              }
              className="p-1.5 hover:text-[var(--chrome-accent)]"
            >
              <ZoomOut size={15} />
            </button>
            <button
              type="button"
              title="Ajustar al ancho"
              onClick={() => setSettings((s) => ({ ...s, zoom: 0 }))}
              className="min-w-12 text-center font-mono text-xs text-[var(--chrome-muted)] hover:text-[var(--chrome-accent)]"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              title="Acercar"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  zoom: Math.min(2, (s.zoom === 0 ? autoZoom : s.zoom) + 0.1),
                }))
              }
              className="p-1.5 hover:text-[var(--chrome-accent)]"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <Dropdown
            align="right"
            label={
              <>
                <Maximize size={15} />
                <span className="uppercase">{pageSize}</span>
                <span className="text-[var(--chrome-muted)]">·</span>
                <span>{columns}c</span>
                <ChevronDown size={14} />
              </>
            }
          >
            {(close) => (
              <div className="min-w-52">
                <MenuLabel>Tamaño de página</MenuLabel>
                <MenuItem
                  hint="21,6 × 27,9 cm"
                  onClick={() => {
                    updateActive({ pageSize: "letter" });
                    close();
                  }}
                >
                  Carta
                </MenuItem>
                <MenuItem
                  hint="21 × 29,7 cm"
                  onClick={() => {
                    updateActive({ pageSize: "a4" });
                    close();
                  }}
                >
                  A4
                </MenuItem>
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <MenuLabel>Numeración</MenuLabel>
                <MenuItem
                  hint={(activeDoc.numberStyle ?? "arabic") === "arabic" ? "•" : undefined}
                  onClick={() => {
                    updateActive({ numberStyle: "arabic" });
                    close();
                  }}
                >
                  Arábigos (1, 2, 3)
                </MenuItem>
                <MenuItem
                  hint={activeDoc.numberStyle === "roman" ? "•" : undefined}
                  onClick={() => {
                    updateActive({ numberStyle: "roman" });
                    close();
                  }}
                >
                  Romanos (i, ii, iii)
                </MenuItem>
                <MenuItem
                  hint={String(activeDoc.startPage ?? 1)}
                  onClick={() => {
                    const raw = window.prompt(
                      "¿En qué número empieza la primera página?",
                      String(activeDoc.startPage ?? 1),
                    );
                    const value = Number(raw);
                    if (Number.isFinite(value) && value > 0) {
                      updateActive({ startPage: Math.floor(value) });
                    }
                    close();
                  }}
                >
                  Empezar a numerar en…
                </MenuItem>
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <MenuItem
                  hint={settings.spellcheck ? "sí" : "no"}
                  onClick={() => {
                    setSettings((s) => ({ ...s, spellcheck: !s.spellcheck }));
                    close();
                  }}
                >
                  Corrector ortográfico
                </MenuItem>
                <MenuItem
                  hint={settings.printMarks ? "sí" : "no"}
                  onClick={() => {
                    setSettings((s) => ({ ...s, printMarks: !s.printMarks }));
                    close();
                  }}
                >
                  Marcas de corte y sangrado
                </MenuItem>
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <MenuLabel>Columnas</MenuLabel>
                <MenuItem
                  hint={columns === 2 ? "•" : undefined}
                  onClick={() => {
                    updateActive({ columns: 2 });
                    close();
                  }}
                >
                  Dos columnas
                </MenuItem>
                <MenuItem
                  hint={columns === 3 ? "•" : undefined}
                  onClick={() => {
                    updateActive({ columns: 3 });
                    close();
                  }}
                >
                  Tres columnas
                </MenuItem>
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <MenuItem
                  hint={pageNumbers ? "sí" : "no"}
                  onClick={() => {
                    updateActive({ pageNumbers: !pageNumbers });
                    close();
                  }}
                >
                  Números de página
                </MenuItem>
              </div>
            )}
          </Dropdown>

          <Dropdown
            align="right"
            label={
              <>
                <Palette size={15} />
                <span className="hidden sm:inline">{THEMES[theme].short}</span>
                <ChevronDown size={14} />
              </>
            }
          >
            {(close) => (
              <div className="min-w-64">
                <MenuLabel>Tema</MenuLabel>
                {(Object.keys(THEMES) as BrewTheme[]).map((id) => (
                  <MenuItem
                    key={id}
                    hint={theme === id ? "•" : undefined}
                    onClick={() => {
                      updateActive({ theme: id });
                      close();
                    }}
                  >
                    {THEMES[id].label}
                  </MenuItem>
                ))}
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <p className="px-2.5 py-1.5 text-[11px] leading-snug text-[var(--chrome-muted)]">
                  El tuyo propio se hace en la pestaña Estilo, redefiniendo
                  variables sobre <span className="font-mono">:scope</span>.
                </p>
              </div>
            )}
          </Dropdown>

          <button
            type="button"
            onClick={() => window.print()}
            title="Imprimir o guardar como PDF"
            className="flex items-center gap-1.5 rounded-md border border-[var(--chrome-border)] px-2.5 py-1.5 text-sm transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            type="button"
            title={
              settings.spread
                ? "Páginas enfrentadas — pulsa para verlas seguidas"
                : "Páginas seguidas — pulsa para verlas enfrentadas"
            }
            onClick={() =>
              setSettings((s) => ({ ...s, spread: !s.spread }))
            }
            className={`rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] ${
              settings.spread
                ? "text-[var(--chrome-accent)]"
                : "text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]"
            }`}
          >
            <BookOpen size={16} />
          </button>

          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            title="Revisar el documento antes de imprimir"
            className={`rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] ${
              overflowing.length > 0
                ? "text-[#e08a7a]"
                : "hover:text-[var(--chrome-accent)]"
            }`}
          >
            <ClipboardCheck size={16} />
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            title="Buscar y reemplazar (⇧⌘F)"
            className="rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            title="Referencia de sintaxis"
            className="rounded-md border border-[var(--chrome-border)] p-2 transition hover:border-[var(--chrome-accent)] hover:text-[var(--chrome-accent)]"
          >
            <BookOpen size={16} />
          </button>
        </div>
      </header>

      {saveError && (
        <div className="app-chrome flex items-start gap-2 border-b border-[#7a3326] bg-[#3a1a14] px-3 py-2 text-sm text-[#f0c4b8]">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <strong className="font-semibold">
              {saveError === "quota"
                ? "Se ha llenado el almacenamiento del navegador."
                : "No se pudo guardar en el navegador."}
            </strong>{" "}
            {saveError === "quota"
              ? "Lo que escribas a partir de ahora no se está guardando. Descarga una copia de seguridad y borra algún documento para hacer sitio."
              : "Lo que escribas a partir de ahora no se está guardando. Descarga una copia de seguridad antes de cerrar."}
          </div>
          <button
            type="button"
            onClick={handleExportBackup}
            className="shrink-0 rounded border border-[#a4543f] px-2 py-1 text-xs font-medium text-[#f7ded6] transition hover:bg-[#54241b]"
          >
            Descargar copia
          </button>
        </div>
      )}

      <div className="app-main" ref={mainRef}>
        {sidebarOpen && (
          <Sidebar
            tab={sidebarTab}
            onTab={setSidebarTab}
            docs={docs}
            activeId={activeId}
            onSelect={setActiveId}
            onDuplicate={(doc) =>
              addDoc(duplicateDoc(doc))
            }
            onDelete={handleDelete}
            onNew={handleNew}
            onImport={() => fileInputRef.current?.click()}
            outline={outline}
            onJump={handleJumpToPage}
            imageBytes={images.totalBytes}
            snapshots={snapshots.list}
            onSaveVersion={() => void handleSaveVersion()}
            onRestoreVersion={setComparing}
            onDeleteVersion={(id) => void snapshots.remove(id)}
            storage={storage}
          />
        )}

        {showEditor && (
          <div
            className="editor-pane"
            style={{
              width: showPreview
                ? `${settings.splitRatio * 100}%`
                : "100%",
              flex: showPreview ? "0 0 auto" : "1 1 auto",
            }}
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes("Files")) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              const files = Array.from(event.dataTransfer.files);
              if (files.some((file) => file.type.startsWith("image/"))) {
                event.preventDefault();
                void addImages(files);
              }
            }}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files);
              if (files.some((file) => file.type.startsWith("image/"))) {
                event.preventDefault();
                void addImages(files);
              }
            }}
          >
            <div className="app-chrome editor-tabs flex border-b border-[var(--chrome-border)]">
              {(
                [
                  ["text", "Texto"],
                  ["style", "Estilo"],
                  ["images", "Imágenes"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setEditorTab(id)}
                  className={`shrink-0 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition ${
                    editorTab === id
                      ? "border-b-2 border-[var(--chrome-accent)] text-[var(--chrome-accent)]"
                      : "text-[var(--chrome-muted)] hover:text-[var(--chrome-text)]"
                  }`}
                >
                  {label}
                  {id === "style" && activeDoc.style?.trim() && (
                    <span className="ml-1 text-[var(--chrome-accent)]">•</span>
                  )}
                </button>
              ))}
            </div>

            {editorTab === "images" ? (
              <ImagePanel
                images={images}
                onPick={() => imageInputRef.current?.click()}
                onInsert={handleInsertImage}
              />
            ) : editorTab === "text" ? (
              <MarkdownEditor
                /* La clave lleva el id del documento a propósito: al cambiar de
                   documento el editor se vuelve a montar con un historial de
                   deshacer limpio. Sin eso, CodeMirror registra el cambio de
                   documento como una edición más y un Cmd+Z traería el texto
                   del documento anterior encima del actual — machacándolo. */
                key={`text-${activeDoc.id}`}
                value={source}
                onChange={handleChange}
                completions={completions}
                spellcheck={settings.spellcheck}
                onCursorLine={(line) => {
                  lastLine.current.set(activeDoc.id, line);
                  setCursorLine(line);
                }}
                onReady={(view) => {
                  viewRef.current = view;

                  // Al volver a un documento, el cursor recupera su sitio: el
                  // editor se remonta con historial limpio y arrancaría arriba.
                  const remembered = lastLine.current.get(activeDoc.id);
                  if (remembered && remembered <= view.state.doc.lines) {
                    const at = view.state.doc.line(remembered).from;
                    view.dispatch({
                      selection: { anchor: at },
                      scrollIntoView: true,
                    });
                  }

                  const queued = pendingSnippet.current;
                  if (queued) {
                    pendingSnippet.current = null;
                    window.setTimeout(() => insertSnippet(queued), 0);
                  }
                }}
              />
            ) : (
              <MarkdownEditor
                key={`style-${activeDoc.id}`}
                language="css"
                placeholder={STYLE_PLACEHOLDER}
                value={activeDoc.style ?? ""}
                onChange={(style) => updateActive({ style })}
                onReady={() => {}}
              />
            )}

            <div className="app-chrome editor-status flex items-center justify-between border-t border-[var(--chrome-border)] px-3 py-1.5 text-[11px] text-[var(--chrome-muted)]">
              {editorTab === "text" ? (
                <>
                  <span className="flex items-center gap-2">
                    <span>
                      página {Math.min(cursorPage, pageCount)} de {pageCount}
                    </span>
                    {overflowing.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleJumpToPage(overflowing[0])}
                        title="Hay texto que no cabe en el papel y no saldrá impreso"
                        className="flex items-center gap-1 rounded bg-[#4a1a12] px-1.5 py-0.5 text-[#f0b4a4] transition hover:bg-[#5e2118]"
                      >
                        <TriangleAlert size={11} />
                        {overflowing.length === 1
                          ? `la página ${overflowing[0]} se sale`
                          : `${overflowing.length} páginas se salen`}
                      </button>
                    )}
                  </span>
                  <span>{source.length.toLocaleString("es-ES")} caracteres</span>
                </>
              ) : editorTab === "images" ? (
                <>
                  <span>
                    {images.list.length}{" "}
                    {images.list.length === 1 ? "imagen" : "imágenes"}
                  </span>
                  <span>{formatBytes(images.totalBytes)}</span>
                </>
              ) : (
                <>
                  <span>CSS de este documento</span>
                  <span>
                    {(activeDoc.style ?? "").length.toLocaleString("es-ES")}{" "}
                    caracteres
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {showEditor && showPreview && (
          <div
            className="split-handle"
            onMouseDown={startResize}
            role="separator"
            aria-orientation="vertical"
          />
        )}

        {showPreview && (
          <Preview
            pages={pages}
            pageSize={pageSize}
            theme={theme}
            columns={columns}
            spread={settings.spread}
            reading={reading}
            printMarks={settings.printMarks}
            zoom={zoom}
            customCss={activeDoc.style}
            onOverflow={setOverflowing}
            paneRef={previewRef}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
          event.target.value = "";
        }}
      />

      <input
        ref={backupInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleRestoreBackup(file);
          event.target.value = "";
        }}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void addImages(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {toast && (
        <div className="app-chrome fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-md border border-[var(--chrome-border)] bg-[#191512] px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {searchOpen && (
        <SearchDialog
          docs={docs}
          activeId={activeId}
          onClose={() => setSearchOpen(false)}
          onOpen={handleOpenHit}
          onReplace={handleReplace}
        />
      )}

      {reviewOpen && (
        <ReviewDialog
          issues={issues}
          docName={activeDoc.name}
          onClose={() => setReviewOpen(false)}
          onGoToLine={(line) => handleOpenHit(activeDoc.id, line)}
          onGoToPage={handleJumpToPage}
        />
      )}

      {comparing && (
        <DiffDialog
          snapshot={comparing}
          current={activeDoc.content}
          onClose={() => setComparing(null)}
          onRestore={() => void applyRestore(comparing)}
        />
      )}

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
