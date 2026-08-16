"use client";

import type { EditorView } from "@codemirror/view";
import {
  BookOpen,
  ChevronDown,
  Columns2,
  Eye,
  FileText,
  Maximize,
  Palette,
  PanelLeft,
  Pencil,
  Printer,
  Scroll,
  Sparkles,
  TriangleAlert,
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
import { scopeCss, STYLE_PLACEHOLDER } from "@/lib/customCss";
import { countMojibake, decodeFile, repairMojibake } from "@/lib/encoding";
import { extractOutline, parseMetadata, renderBrew, renderPages } from "@/lib/markdown";
import { SAMPLE_BREW } from "@/lib/sample";
import { CURSOR_TOKEN, SNIPPET_GROUPS } from "@/lib/snippets";
import {
  buildBackup,
  createDoc,
  downloadFile,
  loadActiveId,
  loadDocs,
  loadSettings,
  mergeBackup,
  readBackup,
  safeFilename,
  saveActiveId,
  saveDocs,
  saveSettings,
  storageUsage,
  type BrewDoc,
  type BrewSettings,
} from "@/lib/storage";
import Dropdown, { MenuItem, MenuLabel } from "./Dropdown";
import HelpDialog from "./HelpDialog";
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

const CM_PER_PX = 37.7952755;
const PAGE_WIDTH_PX = { letter: 21.59 * CM_PER_PX, a4: 21 * CM_PER_PX };

/** Se ejecuta una sola vez, ya en el navegador (ver BrewAppClient). */
function restore(): { docs: BrewDoc[]; activeId: string; settings: BrewSettings } {
  const stored = loadDocs();
  const docs = stored?.length
    ? stored
    : [createDoc("La Cripta del Rey Sin Nombre", SAMPLE_BREW)];
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
  const [editorTab, setEditorTab] = useState<"text" | "style">("text");
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [autoZoom, setAutoZoom] = useState(1);
  const [saveError, setSaveError] = useState<"quota" | "error" | null>(null);
  const [storage, setStorage] = useState({ chars: 0, ratio: 0 });

  const images = useBrewImages();

  const viewRef = useRef<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const pendingSnippet = useRef<string | null>(null);

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeId) ?? docs[0],
    [docs, activeId],
  );

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
    style.textContent = `@page { size: ${
      settings.pageSize === "a4" ? "A4" : "letter"
    }; margin: 0; }`;
  }, [settings.pageSize]);

  /* -------------------------------------------------------- renderizado --- */

  const source = activeDoc?.content ?? "";
  const deferredSource = useDeferredValue(source);

  const pages = useMemo(
    () =>
      renderPages(deferredSource, {
        pageNumbers: settings.pageNumbers,
        images: images.urls,
        imagesKey: images.key,
      }),
    [deferredSource, settings.pageNumbers, images.urls, images.key],
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
      const scale = available / PAGE_WIDTH_PX[settings.pageSize];
      setAutoZoom(Math.min(1.6, Math.max(0.25, scale)));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(node);
    return () => observer.disconnect();
  }, [settings.pageSize, settings.view]);

  const zoom = settings.zoom === 0 ? autoZoom : settings.zoom;

  /* ------------------------------------------------------------ acciones --- */

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

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
    addDoc(createDoc(`${activeDoc.name} (copia)`, activeDoc.content));
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
        setActiveId(fresh.id);
        return;
      }

      setDocs(next);
      if (id === activeId) setActiveId(next[0].id);
    },
    [docs, activeId],
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

      if (/dmg/i.test(meta?.theme ?? "")) {
        setSettings((current) => ({ ...current, theme: "dmg" }));
      }

      addDoc(createDoc(name, text));
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
      for (const file of pictures) {
        const id = await images.add(file);
        lines.push(`![${file.name.replace(/\.[^.]+$/, "")}](brew:${id})`);
      }
      insertText(`${lines.join("\n")}\n`);
      flash(
        pictures.length === 1
          ? "Imagen guardada en el navegador"
          : `${pictures.length} imágenes guardadas`,
      );
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
      buildBackup(docs),
      "application/json;charset=utf-8",
    );
    flash("Copia de seguridad descargada");
  }, [docs, flash]);

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

  const handleExportMarkdown = useCallback(() => {
    if (!activeDoc) return;
    downloadFile(`${safeFilename(activeDoc.name)}.md`, activeDoc.content);
  }, [activeDoc]);

  const handleExportHtml = useCallback(async () => {
    if (!activeDoc) return;
    const css = await fetch("/brew.css").then((response) => response.text());
    // Las imágenes locales viajan dentro del archivo, no como enlace.
    const embedded = await images.asDataUrls();
    const size = settings.pageSize === "a4" ? "A4" : "letter";
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
<div class="brew" data-size="${settings.pageSize}" data-theme="${settings.theme}">
${renderBrew(activeDoc.content, {
  pageNumbers: settings.pageNumbers,
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
    settings.pageSize,
    settings.pageNumbers,
    settings.theme,
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

  const showEditor = settings.view !== "preview";
  const showPreview = settings.view !== "editor";

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

        <Dropdown
          label={
            <>
              <Sparkles size={15} />
              <span>Insertar</span>
              <ChevronDown size={14} />
            </>
          }
        >
          {(close) => (
            <div className="min-w-72">
              {SNIPPET_GROUPS.map((group) => (
                <div key={group.label}>
                  <MenuLabel>{group.label}</MenuLabel>
                  {group.items.map((snippet) => (
                    <MenuItem
                      key={snippet.label}
                      hint={snippet.hint}
                      onClick={() => {
                        insertSnippet(snippet.text);
                        close();
                      }}
                    >
                      {snippet.label}
                    </MenuItem>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Dropdown>

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
                <span className="uppercase">{settings.pageSize}</span>
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
                    setSettings((s) => ({ ...s, pageSize: "letter" }));
                    close();
                  }}
                >
                  Carta
                </MenuItem>
                <MenuItem
                  hint="21 × 29,7 cm"
                  onClick={() => {
                    setSettings((s) => ({ ...s, pageSize: "a4" }));
                    close();
                  }}
                >
                  A4
                </MenuItem>
                <div className="my-1 h-px bg-[var(--chrome-border)]" />
                <MenuItem
                  hint={settings.pageNumbers ? "sí" : "no"}
                  onClick={() => {
                    setSettings((s) => ({
                      ...s,
                      pageNumbers: !s.pageNumbers,
                    }));
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
                <span className="hidden sm:inline">
                  {settings.theme === "dmg" ? "DMG" : "PHB"}
                </span>
                <ChevronDown size={14} />
              </>
            }
          >
            {(close) => (
              <div className="min-w-52">
                <MenuLabel>Tema</MenuLabel>
                <MenuItem
                  hint="5ePHB"
                  onClick={() => {
                    setSettings((s) => ({ ...s, theme: "phb" }));
                    close();
                  }}
                >
                  Manual del Jugador
                </MenuItem>
                <MenuItem
                  hint="5eDMG"
                  onClick={() => {
                    setSettings((s) => ({ ...s, theme: "dmg" }));
                    close();
                  }}
                >
                  Guía del Dungeon Master
                </MenuItem>
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
              addDoc(createDoc(`${doc.name} (copia)`, doc.content))
            }
            onDelete={handleDelete}
            onNew={handleNew}
            onImport={() => fileInputRef.current?.click()}
            outline={outline}
            onJump={handleJumpToPage}
            images={images}
            onPickImage={() => imageInputRef.current?.click()}
            onInsertImage={(id, name) =>
              insertText(`![${name.replace(/\.[^.]+$/, "")}](brew:${id})\n`)
            }
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
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setEditorTab(id)}
                  className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition ${
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

            {editorTab === "text" ? (
              <MarkdownEditor
                key="text"
                value={source}
                onChange={handleChange}
                onReady={(view) => {
                  viewRef.current = view;
                  const queued = pendingSnippet.current;
                  if (queued) {
                    pendingSnippet.current = null;
                    window.setTimeout(() => insertSnippet(queued), 0);
                  }
                }}
              />
            ) : (
              <MarkdownEditor
                key="style"
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
                  <span>
                    {pageCount} {pageCount === 1 ? "página" : "páginas"}
                  </span>
                  <span>{source.length.toLocaleString("es-ES")} caracteres</span>
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
            pageSize={settings.pageSize}
            theme={settings.theme}
            zoom={zoom}
            customCss={activeDoc.style}
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

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
