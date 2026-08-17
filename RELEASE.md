# Forja de Manuales v2.0

Editor Markdown para maquetar aventuras y suplementos con el aspecto de los
manuales de D&D 5e. Como The Homebrewery o DM Bind, pero corriendo entero en tu
navegador: sin servidor, sin cuentas y sin llamadas a servicios externos.

**Demo:** https://dnd-markdown.vercel.app

---

## Lo principal

**Escribes Markdown, sale un manual.** Páginas reales de tamaño Carta o A4, a dos
o tres columnas, con pergamino, capitulares, cajas de nota, tablas de filas
alternas y numeración. El PDF lo genera el propio navegador, con los fondos
incluidos.

**Los bloques del manual, en YAML.** Fichas de criatura, conjuros, objetos
mágicos y hojas de personaje se escriben como datos y se maquetan solos, con los
modificadores, el bono de competencia y los PX calculados.

**Los índices se escriben solos.** Como los saltos de página los pones tú con
`\page`, la paginación es determinista: una pasada previa sabe en qué página cae
cada encabezado, ancla y término marcado, y con eso monta el índice de
contenidos, el alfabético y las referencias cruzadas con números que nunca se
quedan desfasados.

---

## Sintaxis

Además de CommonMark con tablas:

| Sintaxis | Resultado |
| --- | --- |
| `\page` · `\column` | Salto de página y de columna |
| `{{note … }}` · `{{descriptive … }}` · `{{quote … }}` | Las cajas del manual |
| `{{wide … }}` · `{{wide,columns-3 … }}` | Bloques que cruzan columnas |
| `{{clase,width:6cm … }}` | Palabra suelta → clase CSS; `clave:valor` → estilo |
| `![](x.jpg) {cover}` | Llave simple: aplica clases y CSS al elemento anterior |
| `**Alcance** :: 36 metros` | Listas de definición |
| `:` | Línea en blanco que Markdown no colapsa |
| ` ```statblock ` · ` ```spell ` · ` ```item ` · ` ```sheet ` | Bloques de datos |
| ` ```toc ` · ` ```index ` | Índices automáticos |
| `{{#ancla}}` · `{{ref ancla}}` · `{{ix término}}` | Referencias e índice alfabético |

Los bloques `{{ }}` anidan. Texto entre llaves que no parezca CSS se respeta tal
cual, así que `{1d6}` o `{2d8 + 4}` se escriben sin escapar.

## Maquetación

- **Portadas** a sangre (`{{frontCover }}`, `{{partCover }}`, `{{backCover }}`),
  sin textura de pergamino para que la ilustración salga con sus colores.
- **Cabeceras de capítulo** con la ilustración sangrando por tres lados y el
  título sobre papel rasgado.
- **Ilustraciones al pie** con `{{bleed,bottom }}`; la página se reserva el sitio
  sola.
- **Adornos**: bordes rasgados y de pincel, manchas de acuarela, doce iconos en
  línea, tarjetas ladeadas y mapas con cuadrícula o hexágonos.
- **Cinco temas** por documento: Manual del Jugador, Guía del Dungeon Master,
  Limpio, Grimorio (oscuro) y Diario (sepia). Un tema es solo un juego de
  variables, así que todo lo demás se adapta sin tocarlo.
- **CSS propio por documento**, en su pestaña del editor.

## Trabajar con documentos largos

- **La vista previa sigue al cursor** y marca la página que estás tocando.
- **Aviso de desborde**: las páginas cuyo texto no cabe se rodean de rojo, con el
  recuento en la barra.
- **Revisión antes de imprimir**: una lista con las imágenes borradas en uso, las
  referencias a anclas inexistentes, las páginas desbordadas y los índices vacíos.
- **Historial de versiones** con diff línea a línea antes de restaurar.
- **Buscar y reemplazar** en un documento o en todos.
- **Páginas enfrentadas** y **modo lectura** de una columna para dirigir desde la
  tableta.
- **Bestiario reutilizable**: guardas una ficha y la referencias con `ref:` desde
  cualquier documento, sobrescribiendo solo lo que cambie.

## Imágenes

Se arrastran o se pegan sobre el editor y viven en IndexedDB. Al soltarlas se
reducen —máximo 2200 px de lado, recomprimidas a WebP y solo si sale más
pequeño—: un PNG de 3,1 MB acaba en 50 KB. Al exportar a `.html` viajan
incrustadas.

## Imprenta

Marcas de corte con 3 mm de sangrado (el papel del PDF crece 1,6 cm por eje para
que quepan), numeración por secciones con romanos para los preliminares, y
control de viudas y huérfanas.

## Editor

CodeMirror 6 con resaltado, autocompletado de la sintaxis del proyecto (`{{`,
` ``` `, `brew:` y `{{ref `), corrector ortográfico en español, atajos
(`Cmd+B`, `Cmd+I`, `Cmd+K`, `Cmd+Enter`) y una biblioteca de fragmentos propios.

## Compartir y no perder nada

- **Enlace sin servidor**: el documento va comprimido en el fragmento (`#`) de la
  URL, que el navegador no envía al servidor.
- **Copias de seguridad** en un `.json` con documentos y fragmentos.
- **Aviso cuando el navegador deja de poder guardar**, en vez de fallar callando.
- **Reparación de acentos** al importar archivos mal codificados.

---

## Notas técnicas

**`public/brew.css` es la única fuente de verdad del renderizado.** La app lo
carga con `<link>` y el exportador de HTML hace `fetch` del mismo archivo para
incrustarlo. Va entero dentro de `@layer brew`: en la cascada, lo que no está en
ninguna capa gana a lo que sí lo está sin importar la especificidad, y por eso el
CSS que escribas en la pestaña *Estilo* vence a las reglas base.

**El renderizado es por página y con caché.** Al escribir solo cambia una página;
el resto se reutiliza y el navegador no rehace el layout del documento entero.
Solo las páginas que dependen del documento completo —las que llevan `toc`,
`index` o `ref`— arrastran en su clave la firma de la pasada previa.

**Los diálogos se dibujan en un portal.** Un ancestro con `overflow` distinto de
`visible` recorta a sus hijos posicionados en absoluto, y basta declarar
`overflow-x` para que el eje Y deje de ser visible.

**El desborde se detecta en horizontal.** Una página con altura fija y
`overflow: hidden` no tira el exceso hacia abajo: el multicolumna crea columnas
hacia la derecha y las recorta. `scrollWidth` mayor que `clientWidth` lo delata;
`scrollHeight` no se entera.

## Lo que no está

- **Las fuentes no son las del PHB.** Bookinsanity, Nodesto y compañía no se
  pueden redistribuir. Se usan equivalentes de Google Fonts descargadas en
  compilación y servidas desde tu propio dominio, sin peticiones en ejecución. Si
  tienes las originales, `public/fonts/README.md` explica cómo ponerlas.
- **La hoja de personaje no es la oficial.** Los nombres de características y
  habilidades son términos de reglas publicados en la SRD bajo CC-BY; la maqueta
  es de este proyecto.
- **Las licencias abiertas tipo ORC u OGL se insertan como plantilla**, no como
  texto. Exigen reproducir el aviso palabra por palabra y transcribirlo de
  memoria en algo que vas a publicar sería un problema.
- **El diseño es de escritorio.** En tableta la barra se parte.
- **Renombrar, borrar y reparar acentos** usan los diálogos del navegador.

## Requisitos

Navegador con soporte de `:has()`, `@layer` y máscaras CSS: Chrome, Edge y Safari
recientes, y Firefox 128 o superior.

```bash
npm install
npm run dev
```
