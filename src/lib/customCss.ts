/**
 * El CSS que escribe el usuario en la pestaña «Estilo» se aplica dentro de la
 * app envuelto en `@scope (.brew)`: así puede tocar cualquier cosa del
 * documento sin poder romper la interfaz del editor. `:scope` es la página
 * entera del documento.
 *
 * En el HTML exportado no hace falta —allí solo está el documento— y además
 * conviene no depender de `@scope`, que un navegador antiguo descartaría
 * entero. Por eso `forExport` lo deja tal cual.
 */
export function scopeCss(css: string, forExport = false): string {
  const trimmed = css.trim();
  if (!trimmed) return "";
  if (forExport) return trimmed;

  const supportsScope =
    typeof window !== "undefined" && "CSSScopeRule" in window;

  return supportsScope ? `@scope (.brew) {\n${trimmed}\n}` : trimmed;
}

export const STYLE_PLACEHOLDER = `/* CSS propio de este documento.
   Ejemplos:

   :scope            { --parchment: #f6efe0; }
   .page h1          { font-family: Georgia, serif; }
   .page .note       { --note-bg: #e8e0f0; }
   .page .statblock  { --statblock-accent: #1d4e6b; }
*/
`;
