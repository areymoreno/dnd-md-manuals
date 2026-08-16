"use client";

import { memo, type RefObject } from "react";
import { scopeCss } from "@/lib/customCss";
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
  theme: "phb" | "dmg";
  zoom: number;
  customCss?: string;
  paneRef: RefObject<HTMLDivElement | null>;
}

export default function Preview({
  pages,
  pageSize,
  theme,
  zoom,
  customCss,
  paneRef,
}: PreviewProps) {
  const scoped = scopeCss(customCss ?? "");
  return (
    <div className="preview-pane" ref={paneRef}>
      <div
        className="brew-scaler"
        style={{ ["--brew-zoom" as string]: zoom }}
      >
        <div className="brew" data-size={pageSize} data-theme={theme}>
          {scoped && <style>{scoped}</style>}
          {pages.map((page, index) => (
            <Page key={index} page={page} />
          ))}
        </div>
      </div>
    </div>
  );
}
