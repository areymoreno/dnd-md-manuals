# Aplicación de escritorio (macOS)

La app es cliente puro, así que se empaqueta con Electron sin tocar la lógica:
Next.js compila a estáticos y Electron los sirve.

```bash
npm run desktop:dev    # compila y abre la app
npm run desktop:dmg    # genera dist-desktop/*.dmg
```

## Por qué Electron y no Tauri

Tauri usaría el WebView del sistema, que en macOS es el motor de Safari. Todo lo
que hay aquí —máscaras de los bordes rasgados, detección de desborde por
`scrollWidth`, `:has()`, `@layer`, `@scope`, `column-span`— está verificado
contra Chrome, y el PDF está afinado para cómo Chrome trata `@page size`.

Además, con Electron el PDF sale **de un clic**: `webContents.printToPDF()`
recibe el tamaño de papel como parámetro, así que no hay que abrir el diálogo
del navegador ni acordarse de poner los márgenes a cero y activar los gráficos
de fondo. El precio es el tamaño del paquete: ~198 MB de DMG.

## Decisiones que no son cosméticas

**Un esquema propio, no `file://`.** La app se sirve por `forja://app/`. Bajo
`file://` el origen es opaco y `localStorage` —donde viven todos los
documentos— se comporta de forma inestable y puede vaciarse entre versiones.
Con un esquema registrado como `standard` y `secure` hay un origen de verdad:
el almacenamiento persiste, funciona el `fetch("/brew.css")` que usa el
exportador de HTML, y las URL de blob de las imágenes siguen valiendo.

**Aislamiento de contexto activo.** `contextIsolation: true` y
`nodeIntegration: false`; la página solo ve las dos funciones que expone
`preload.js`. Comprobado desde dentro de la app: `window.require` y
`window.process` son `undefined`.

**`pageSize` en pulgadas.** La documentación antigua de `printToPDF` habla de
micras, pero eso es de la API anterior a Electron 21. Pasarle micras falla con
«Printing failed» y ningún detalle más.

## Firma y distribución

El DMG se firma con el certificado de desarrollo que haya en el llavero, pero
**no está notarizado**. En otro Mac, Gatekeeper lo bloqueará: hay que abrirlo
con clic derecho → Abrir la primera vez, o quitarle la cuarentena con
`xattr -dr com.apple.quarantine "/Applications/Forja de Manuales.app"`.

Para repartirlo sin fricción hace falta una cuenta de desarrollador de Apple
(99 €/año) y añadir notarización a la configuración de `electron-builder`.

## Pendiente

- **Icono propio**: ahora usa el de Electron. Basta un `build/icon.icns`.
- **Universal**: el DMG generado es solo `arm64`. La configuración ya declara
  `["arm64", "x64"]`; compilar ambos tarda bastante más.
- **Documentos en disco**: siguen en `localStorage`, con su límite de ~5 MB. En
  escritorio lo natural sería guardarlos como archivos `.md` y las imágenes en
  una carpeta, y quitar de en medio toda la maquinaria de aviso de cuota.

## Si `npm run desktop:dev` arranca como Node

Si el terminal tiene `ELECTRON_RUN_AS_NODE=1` —el de VS Code lo pone en algunos
casos—, el binario de Electron se comporta como Node y falla con
`Cannot read properties of undefined (reading 'registerSchemesAsPrivileged')`.
Se arregla arrancando con `env -u ELECTRON_RUN_AS_NODE`.
