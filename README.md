# Forja de Manuales

Editor Markdown que compone aventuras y suplementos con el aspecto de los
manuales de D&D 5e — como The Homebrewery o DM Bind, pero corriendo entero en tu
máquina. No hay servidor, ni cuentas, ni llamadas a servicios externos: el texto
vive en el `localStorage` de tu navegador y el PDF lo genera el propio navegador.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Qué hace

- **Editor a dos paneles** con resaltado de sintaxis (CodeMirror 6) y vista previa
  en vivo paginada.
- **Páginas reales**: tamaño Carta o A4, dos columnas, pergamino, capitulares,
  cajas de nota, tablas con filas alternas y numeración de página.
- **Fichas de criatura** generadas desde YAML, con modificadores y PX calculados.
- **Portadas e ilustraciones a sangre**, con inyección de CSS sobre cualquier
  elemento — la sintaxis de llave simple de Homebrewery.
- **Índice** con guía de puntos y enlaces a las páginas.
- **Impresión a PDF** con los fondos incluidos (`print-color-adjust: exact`), sin
  herramientas externas.
- **Varios documentos** guardados en el navegador, con importar/exportar `.md` y
  exportar a un `.html` autocontenido.
- **Imágenes locales**: arrástralas o pégalas sobre el editor y quedan en el
  propio navegador, sin depender de ningún servidor.
- **Índice lateral** con salto a la página, y **dos temas** (Manual del Jugador
  y Guía del Dungeon Master).
- **Copias de seguridad** en un solo archivo `.json`, con aviso en cuanto el
  navegador deja de poder guardar.
- **CSS propio por documento**, en su propia pestaña del editor.
- **Adornos**: bordes rasgados, manchas de acuarela e iconos en línea.
- **Reparación de acentos** al importar archivos mal codificados.

## Sintaxis

Además de Markdown estándar (CommonMark + tablas), entiende:

| Sintaxis | Resultado |
| --- | --- |
| `\page` | Empieza una página nueva. |
| `\column` | Manda lo siguiente a la otra columna. |
| `{{note … }}` | Caja verde de nota para el DM. |
| `{{descriptive … }}` | Caja crema para leer en voz alta. |
| `{{quote … }}` | Cita con filete lateral. |
| `{{wide … }}` | Bloque que ocupa las dos columnas. |
| `{{clase,otra … }}` | Cualquier palabra suelta se aplica como clase CSS. |
| `{{width:6cm,color:#922610 … }}` | Cualquier par `clave:valor` se aplica como estilo en línea. |
| `{{#id … }}` | Asigna un `id`. |
| `{{color:#922610 texto}}` | Versión en línea, dentro de un párrafo. |
| `**Alcance** :: 36 metros` | Lista de definición; varias líneas seguidas forman una sola. |
| `___` | Separador ornamental. |
| `{{footnote texto}}` | Pie de página. |
| `{{pageNumber 12}}` | Numera la página a mano y desactiva el número automático de esa página. |
| `:` | Línea en blanco que Markdown no colapsa; cada `:` de más añade otra. |
| ` ```metadata ` | Cabecera de Homebrewery: no se dibuja, y al importar da nombre al documento. |

Los bloques `{{ }}` anidan, así que una ficha puede contener una nota y una nota
puede contener otra caja.

### Estilos inyectados

Una llave **simple** aplica clases y CSS a un elemento ya escrito. Es la vía
para las ilustraciones a página completa, y funciona en cuatro sitios:

| Dónde | Ejemplo | A qué se aplica |
| --- | --- | --- |
| Tras un elemento en línea | `![](fondo.jpg) {cover}` | A la imagen. |
| Tras texto suelto | `# Título {color:#fff}` | Al bloque que contiene la línea. |
| Pegado a un elemento | `**negrita**{color:#922610}` | Al `<strong>`. |
| En una línea suelta | `{width:6cm}` | Al bloque anterior: una nota, una tabla, una ficha. |

Las reglas son las mismas que dentro de `{{ }}`: una palabra suelta es una clase
CSS, `#algo` es un id y todo par `clave:valor` es una declaración de estilo.

Texto entre llaves que no parezca CSS se respeta tal cual, así que `{1d6}` o
`{2d8 + 4}` siguen escribiéndose sin escapar.

### Ilustraciones a sangre

`{cover}` estira la imagen a la página entera, la recorta al formato con
`object-fit: cover` y la coloca por debajo del texto:

```markdown
![portada](portada.jpg) {cover}
```

Funciona igual en Carta y en A4, que es la razón de existir de la clase. Si
copias un brew de Homebrewery verás medidas en píxeles —
`{position:absolute,width:816px,height:1056px}` — que valen **solo** en Carta:
816 × 1056 px es esa página exacta, y en A4 la ilustración se queda corta por
abajo y recortada por un lado. Cambia esas medidas por `{cover}` y deja de
importar el tamaño de papel.

`{cover,contain}` encaja la imagen entera sin recortarla.

### Portadas e índice

- `{{frontCover }}`, `{{partCover }}` y `{{backCover }}` convierten la página en
  portada: una sola columna, a sangre, sin número de página y **sin la textura
  de pergamino** — con ella, cualquier ilustración en `mix-blend-mode: multiply`
  sale amarilleada. El `h1` y el `h2` salen centrados, en blanco si hay
  ilustración de fondo y en el rojo habitual si no la hay.
- `{{frontCover,framed }}` añade la cenefa dorada. Es opcional a propósito:
  casi toda ilustración de portada ya trae la suya y dos marcos se estorban.
- `{{toc,wide … }}` es el índice. Cada página lleva un `id` (`p1`, `p2`, …), así
  que los enlaces con la forma `[{{ Nombre}}{{ 12}}](#p12)` salen con guía de
  puntos y el número pegado al margen.

### Fichas de criatura

Un bloque de código con el lenguaje `statblock` se interpreta como YAML:

````markdown
```statblock
name: Esqueleto Anónimo
size: Mediano
type: no muerto
alignment: legal malvado
ac: 13 (restos de armadura)
hp: 13 (2d8 + 4)
speed: 9 m
stats: [10, 14, 15, 6, 8, 5]
immunities: veneno
senses: visión en la oscuridad 18 m, Percepción pasiva 9
languages: entiende Común pero no puede hablar
cr: 1/4
traits:
  - name: Sin Nombre
    desc: Es inmune a cualquier efecto que requiera conocer su nombre.
actions:
  - name: Espada Corta
    desc: "*Ataque con arma cuerpo a cuerpo:* +4 al ataque, alcance 1,5 m. *Impacto:* 5 (1d6 + 2) perforante."
```
````

- Los modificadores de característica y los PX del valor de desafío se calculan
  solos.
- `wide: true` da una ficha a lo ancho, con su contenido a dos columnas.
- `frame: false` quita el marco dorado.
- Secciones admitidas: `traits`, `actions`, `bonus_actions`, `reactions`,
  `legendary` (+ `legendary_intro`), `mythic`, `lair` y `description`.
- Los campos `desc` admiten Markdown en línea.
- Las etiquetas salen en español; `lang: en` las pone en inglés y `labels:`
  permite sobrescribir cualquiera.

## Imágenes locales

Arrastra una imagen sobre el editor, pégala con `Cmd+V` o añádela desde la
pestaña *Imágenes* de la barra lateral. Se guarda en IndexedDB —no en
`localStorage`, que es mucho más pequeño— y en el documento queda una referencia:

```markdown
![retrato del rey](brew:9f2c1a7b)
```

Funciona con todo lo demás: `![](brew:9f2c1a7b) {cover}` te da una portada a
sangre. Al exportar a `.html` las imágenes viajan incrustadas dentro del
archivo, así que el resultado se abre en cualquier sitio. Si borras una imagen
que un documento seguía usando, en la vista previa aparece un recuadro rojo en
su lugar en vez de desaparecer en silencio.

## No perder el trabajo

Todo vive en este navegador, así que hay dos cosas que conviene saber:

- El límite de `localStorage` es de unos **4,9 millones de caracteres** (medido
  en Chrome; el navegador cuenta caracteres, no bytes, así que las tildes no
  ocupan de más). La barra al pie de la barra lateral te dice cuánto llevas.
- Cuando ese límite se alcanza, **el guardado falla**. En vez de callarlo, sale
  una banda roja fija arriba avisando de que lo que escribas ya no se está
  guardando, con un botón para descargar la copia en el momento.

*Archivo → Copia de seguridad…* baja todos los documentos en un `.json`, y
*Restaurar copia…* los vuelve a meter. La restauración **nunca pisa** lo que ya
tengas: si un documento restaurado coincide en id con uno actual, entra
duplicado con el sufijo «(restaurado)».

## Estilo propio

La pestaña **Estilo** del editor guarda un CSS por documento. Dentro de la app
va envuelto en `@scope (.brew)`, así que puede tocar cualquier cosa del
documento pero no puede romper la interfaz; en el `.html` exportado viaja
incrustado y sin acotar.

```css
:scope            { --parchment: #f6efe0; }
.page h1          { font-family: Georgia, serif; }
.page .note       { --note-bg: #e8e0f0; }
.page .statblock  { --statblock-accent: #1d4e6b; }
```

Ahí `:scope` es la página. Casi todo el diseño se cambia tocando variables, sin
pelearse con selectores.

`public/brew.css` va entero dentro de `@layer brew`. Eso no es decorativo: en la
cascada, **lo que no está en ninguna capa gana a lo que sí lo está, sin importar
la especificidad**. Sin eso, un `.page h1 { color: … }` escrito por ti perdería
contra el `.brew .page h1 { … }` del archivo base, que es más específico — y la
pestaña de estilos no serviría de nada.

## Adornos

| Sintaxis | Resultado |
| --- | --- |
| `![](x.jpg) {torn}` | Bordes rasgados. También `{torn-top}`, `{torn-bottom}`, `{torn-left}`, `{torn-right}`. |
| `{{watercolor,wc-verde,top:3cm,left:1cm }}` | Mancha de acuarela detrás del texto. |
| `{{icon-d20}}` | Icono en línea, del color del texto que lo rodea. |

Colores de acuarela: `wc-rojo`, `wc-verde`, `wc-azul`, `wc-morado`, `wc-ocre`,
`wc-tinta`. Iconos: `d4`, `d6`, `d20`, `espada`, `escudo`, `calavera`, `pocion`,
`pergamino`, `corazon`, `llama`, `luna`, `huella`. Todo son máscaras SVG
incrustadas en el CSS — ni fuentes de iconos ni peticiones a nadie.

## Acentos rotos

Al importar un `.md` pasan dos cosas distintas y se tratan aparte:

- **El archivo no es UTF-8** (viene en Windows-1252 o Latin-1). Se detecta con
  certeza, porque los bytes no son UTF-8 válido, y se lee con la codificación
  buena sin preguntar nada.
- **El archivo es UTF-8 válido pero el texto ya venía estropeado**: alguien leyó
  UTF-8 como Latin-1 y lo volvió a guardar, y donde había «é» pone «Ã©». Aquí no
  hay nada que decodificar, hay que sustituir secuencias — así que se avisa,
  se dice cuántas son y se pregunta antes de tocar nada.

La sustitución solo cubre los pares inequívocos. Cuando el daño original perdió
bytes no hay vuelta atrás: «CAPÃTULO» pudo ser Á o Í, porque ninguno de los dos
segundos bytes existe en Windows-1252 y los dos se cayeron por igual. Esos
restos se cuentan y se dejan intactos para que los repases a mano.

También está en *Archivo → Reparar acentos…* para el documento abierto.

## Temas

Dos, elegibles en la barra superior: **PHB** (Manual del Jugador, el de por
defecto) y **DMG** (Guía del Dungeon Master, papel más frío y tinta marrón). Al
importar un brew de Homebrewery se lee el campo `theme` de su bloque
`metadata` y se aplica el que corresponda.

## Imprimir a PDF

Botón **PDF** → «Guardar como PDF» en el diálogo del navegador, con los márgenes
en *Ninguno*. El tamaño del PDF sigue al que tengas elegido en la barra superior.
Chrome imprime los fondos sin tocar nada; Firefox necesita marcar *Imprimir
fondos*.

## Cómo está montado

```
public/brew.css              Estilos de página. Fuente única: la app lo carga con
                             <link> y el exportador de HTML lo incrusta tal cual.
src/lib/markdown/
  index.ts                   Instancia de markdown-it + partido en páginas.
  curly.ts                   Bloques y spans {{ }} anidables.
  injection.ts               Estilos de llave simple {…} sobre el elemento previo.
  deflist.ts                 Listas de definición con ::.
  breaks.ts                  \column y los espaciadores «:».
  statblock.ts               Fichas de criatura desde YAML.
  metadata.ts                Cabecera ```metadata de Homebrewery.
  images.ts                  Resuelve las referencias brew:<id>.
  outline.ts                 Encabezados y su página, para el índice lateral.
src/lib/images.ts            Almacén de imágenes en IndexedDB.
src/lib/encoding.ts          Detección de codificación y reparación de acentos.
src/lib/customCss.ts         Acotado del CSS propio de cada documento.
src/lib/storage.ts           Documentos, ajustes, cuota y copias de seguridad.
src/components/BrewApp.tsx   Interfaz principal (cliente).
src/components/Preview.tsx   Vista previa; cada página memoizada por separado.
src/components/Sidebar.tsx   Documentos, índice e imágenes.
```

Cada página se renderiza y se memoiza por separado, con el Markdown de esa
página como clave: al escribir solo se rehace la página que estás tocando. En un
documento de 200 páginas eso baja de ~160 ms a ~18 ms por pulsación.

El renderizado ocurre en el navegador, con `html: true` en markdown-it: puedes
meter HTML y `<style>` propios en tus documentos. Es tu máquina y tu texto, pero
por lo mismo no pegues Markdown de origen desconocido.

Las fuentes y cómo sustituirlas por las del PHB: [`public/fonts/README.md`](public/fonts/README.md).
