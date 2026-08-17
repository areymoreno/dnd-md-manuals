"use client";

import { memo, useEffect, useRef, type RefObject } from "react";
import { scopeCss } from "@/lib/customCss";
import type { BrewTheme } from "@/lib/storage";
import type { RenderedPage } from "@/lib/markdown";

/**
 * Cada página es su propio componente y se compara por el HTML ya generado.
 * Al escribir solo cambia una página, así que React deja intactas las demás y
 * el navegador se ahorra rehacer el layout del documento entero.
 */
const Page = memo(
  function Page({ page }: { page: RenderedPage }) {
    return (
      <div
        className={`page page-${page.side}`}
        id={`p${page.number}`}
        data-page={page.number}
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    );
  },
  (before, after) =>
    before.page.html === after.page.html &&
    before.page.number === after.page.number &&
    before.page.side === after.page.side,
);

interface PreviewProps {
  pages: RenderedPage[];
  pageSize: "letter" | "a4";
  theme: BrewTheme;
  columns: 2 | 3;
  spread: boolean;
  reading?: boolean;
  printMarks?: boolean;
  zoom: number;
  customCss?: string;
  paneRef: RefObject<HTMLDivElement | null>;
  /** Páginas cuyo contenido no cabe en el papel. */
  onOverflow?: (pages: number[]) => void;
}

export default function Preview({
  pages,
  pageSize,
  theme,
  columns,
  spread,
  reading,
  printMarks,
  zoom,
  customCss,
  paneRef,
  onOverflow,
}: PreviewProps) {
  const brew = useRef<HTMLDivElement>(null);

  /**
   * Una página con altura fija y `overflow: hidden` no tira el exceso hacia
   * abajo: el multicolumna crea columnas de más hacia la derecha y las recorta.
   * El texto desaparece de la pantalla y del PDF sin dejar rastro, así que hay
   * que buscarlo a mano — `scrollWidth` mayor que `clientWidth` lo delata.
   */
  useEffect(() => {
    const node = brew.current;
    if (!node) return;

    const id = requestAnimationFrame(() => {
      const desbordadas: number[] = [];

      for (const page of node.querySelectorAll<HTMLElement>(".page")) {
        const overflows = page.scrollWidth > page.clientWidth + 2;
        page.classList.toggle("is-overflowing", overflows);
        if (overflows) desbordadas.push(Number(page.dataset.page));
      }

      onOverflow?.(desbordadas);
    });

    return () => cancelAnimationFrame(id);
  }, [pages, pageSize, columns, customCss, onOverflow]);
  const scoped = scopeCss(customCss ?? "");
  return (
    <div className="preview-pane" ref={paneRef}>
      <div
        className="brew-scaler"
        style={{ ["--brew-zoom" as string]: zoom }}
      >
        <div
          ref={brew}
          className="brew"
          data-size={pageSize}
          data-theme={theme}
          data-columns={columns}
          data-spread={spread && !reading ? "true" : undefined}
          data-reading={reading ? "true" : undefined}
          data-marks={printMarks ? "true" : undefined}
        >
          {scoped && <style>{scoped}</style>}
          {pages.map((page, index) =>
            /* Con marcas de corte hace falta un envoltorio: `.page` recorta con
               `overflow: hidden` y se comería sus propias marcas. */
            printMarks ? (
              <div className="page-marks" key={index}>
                <Page page={page} />
              </div>
            ) : (
              <Page key={index} page={page} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
