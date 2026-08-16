"use client";

import { css as cssLanguage } from "@codemirror/lang-css";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";

const editorTheme = EditorView.theme(
  {
    "&": {
      color: "#e8e0d2",
      backgroundColor: "#1d1916",
    },
    ".cm-content": {
      caretColor: "#c9ad6a",
      padding: "1rem 0.5rem 6rem",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#c9ad6a" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "#3d3123" },
    ".cm-gutters": {
      backgroundColor: "#1d1916",
      color: "#5c5045",
      border: "none",
      paddingRight: "0.35rem",
    },
    ".cm-activeLine": { backgroundColor: "rgba(201, 173, 106, 0.06)" },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(201, 173, 106, 0.08)",
      color: "#c9ad6a",
    },
    ".cm-selectionMatch": { backgroundColor: "rgba(201, 173, 106, 0.2)" },
    ".cm-searchMatch": {
      backgroundColor: "rgba(146, 38, 16, 0.4)",
      outline: "1px solid #922610",
    },
    ".cm-panels": { backgroundColor: "#14110e", color: "#e8e0d2" },
    ".cm-tooltip": {
      backgroundColor: "#14110e",
      border: "1px solid #342d25",
    },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: tags.heading1, color: "#e0b666", fontWeight: "700" },
  { tag: tags.heading2, color: "#d9a95c", fontWeight: "700" },
  { tag: tags.heading3, color: "#c9ad6a", fontWeight: "700" },
  { tag: [tags.heading4, tags.heading5, tags.heading6], color: "#b79f68" },
  { tag: tags.strong, color: "#f0e4cc", fontWeight: "700" },
  { tag: tags.emphasis, color: "#d8cbb4", fontStyle: "italic" },
  { tag: tags.link, color: "#88b7d1", textDecoration: "underline" },
  { tag: tags.url, color: "#6f95ab" },
  { tag: tags.monospace, color: "#9fd18b" },
  { tag: tags.quote, color: "#a6b083", fontStyle: "italic" },
  { tag: tags.list, color: "#c9ad6a" },
  { tag: tags.contentSeparator, color: "#922610", fontWeight: "700" },
  { tag: tags.processingInstruction, color: "#7a6a56" },
  { tag: tags.keyword, color: "#d98c6a" },
  { tag: tags.string, color: "#9fd18b" },
  { tag: tags.number, color: "#c9ad6a" },
  { tag: tags.comment, color: "#6b5f52", fontStyle: "italic" },
  { tag: tags.propertyName, color: "#d9a95c" },
]);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onReady: (view: EditorView) => void;
  /** `css` cambia el resaltado para la pestaña de estilos del documento. */
  language?: "markdown" | "css";
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  onReady,
  language = "markdown",
  placeholder,
}: MarkdownEditorProps) {
  const extensions = useMemo(
    () => [
      language === "css"
        ? cssLanguage()
        : markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      syntaxHighlighting(highlight),
    ],
    [language],
  );

  return (
    <CodeMirror
      className="editor-host"
      value={value}
      onChange={onChange}
      onCreateEditor={onReady}
      placeholder={placeholder}
      extensions={extensions}
      theme={editorTheme}
      height="100%"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: false,
        bracketMatching: false,
        closeBrackets: false,
      }}
    />
  );
}
