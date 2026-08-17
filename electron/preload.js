"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Única puerta entre la app y el sistema. Con `contextIsolation` activo, la
 * página no ve `require` ni el módulo `fs`: solo estas dos funciones.
 */
contextBridge.exposeInMainWorld("forja", {
  esEscritorio: true,

  /** Guarda el documento como PDF con un diálogo nativo. */
  exportarPdf: (opciones) => ipcRenderer.invoke("exportar-pdf", opciones),

  /** El menú «Archivo → Exportar a PDF…» avisa por aquí. */
  alExportarPdf: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("menu:exportar-pdf", handler);
    return () => ipcRenderer.off("menu:exportar-pdf", handler);
  },
});
