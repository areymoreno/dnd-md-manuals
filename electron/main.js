"use strict";

const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..", "out");
const SCHEME = "forja";

/**
 * La app se sirve por un esquema propio y no por `file://`.
 *
 * No es cosmético: bajo `file://` el origen es opaco, y `localStorage` —donde
 * viven todos los documentos— se comporta de forma inestable y puede vaciarse
 * entre versiones. Con un esquema estándar y seguro hay un origen de verdad,
 * el almacenamiento persiste y además funcionan `fetch` relativo (el
 * exportador de HTML pide «/brew.css») y las URL de blob de las imágenes.
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function serveStatic() {
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const relative = decodeURIComponent(pathname);
    const target = relative === "/" ? "/index.html" : relative;

    // Nada fuera de `out/`: una ruta con «..» no puede escaparse del paquete.
    const resolved = path.normalize(path.join(ROOT, target));
    if (!resolved.startsWith(ROOT)) {
      return new Response("No encontrado", { status: 404 });
    }

    try {
      return await net.fetch(pathToFileURL(resolved).toString());
    } catch {
      return new Response("No encontrado", { status: 404 });
    }
  });
}

let ventana = null;

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 900,
    minHeight: 600,
    title: "Forja de Manuales",
    backgroundColor: "#14110e",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  ventana.loadURL(`${SCHEME}://app/`);

  // Los enlaces externos van al navegador, no abren ventanas de la app.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  ventana.on("closed", () => {
    ventana = null;
  });
}

/**
 * PDF sin diálogo del navegador. `printToPDF` aplica los estilos de impresión,
 * así que la interfaz desaparece igual que al imprimir desde la web, pero sin
 * tener que acordarse de poner los márgenes a cero ni activar los gráficos de
 * fondo: aquí se pasan como parámetros.
 */
ipcMain.handle("exportar-pdf", async (event, opciones) => {
  const origen = BrowserWindow.fromWebContents(event.sender);
  if (!origen) return { ok: false, motivo: "sin ventana" };

  const { filePath, canceled } = await dialog.showSaveDialog(origen, {
    title: "Guardar PDF",
    defaultPath: `${opciones?.nombre ?? "manual"}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { ok: false, motivo: "cancelado" };

  const pdf = await origen.webContents.printToPDF({
    printBackground: true,
    margins: { marginType: "none" },
    pageSize: {
      // En pulgadas. La documentación antigua habla de micras, pero eso es de
      // la API anterior a Electron 21: pasarle micras hace fallar la impresión
      // con «Printing failed» y ningún detalle más.
      width: (opciones?.anchoCm ?? 21.59) / 2.54,
      height: (opciones?.altoCm ?? 27.94) / 2.54,
    },
  });

  await fs.writeFile(filePath, pdf);
  return { ok: true, ruta: filePath };
});

function construirMenu() {
  const plantilla = [
    { role: "appMenu" },
    {
      label: "Archivo",
      submenu: [
        {
          label: "Exportar a PDF…",
          accelerator: "CmdOrCtrl+P",
          click: () => ventana?.webContents.send("menu:exportar-pdf"),
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    { role: "editMenu" },
    {
      label: "Ver",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(plantilla));
}

app.whenReady().then(() => {
  serveStatic();
  construirMenu();
  crearVentana();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
