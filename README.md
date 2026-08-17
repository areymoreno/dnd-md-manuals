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
- **Papel, tema y numeración por documento**: un manual en A4 y otro en Carta
  conviven sin pisarse.
- **La vista previa sigue al cursor**: al escribir se acerca a la página que
  estás tocando, y la marca con un filete.
- **Historial de versiones** por documento, automático y a mano.
- **Compartir por enlace** sin servidor: el documento viaja comprimido en el `#`.
- **Búsqueda en todos los documentos** con `⇧⌘F`.
- **Bloques de conjuro y objeto mágico** desde YAML, como las fichas de criatura.
- **Las imágenes se reducen al soltarlas**.

## Sintaxis

Además de Markdown estándar (CommonMark + tablas), entiende:

| Sintaxis | Resultado |
| --- | --- |
| `\page` | Empieza una página nueva. |
| `\column` | Manda lo siguiente a la otra columna. |
| `{{note … }}` | Caja verde de nota para el DM. |
| `{{descriptive … }}` | Caja crema para leer en voz alta. |
| `{{quote … }}` | Cita con filete lateral. |
| `{{wide … }}` | Bloque que cruza todas las columnas de la página. |
| `{{wide,columns-3 … }}` | Bloque con su propio número de columnas (`columns-2` o `columns-3`). |
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

### Cabecera de capítulo

`{{chapter}}` monta la apertura de capítulo de los manuales: la ilustración
sangra por los tres lados, se rasga por arriba y por abajo dejando ver el
pergamino, y el `# título` queda sobre una tira de papel roto.

```markdown
{{chapter,flourish
# Capítulo 1: El Valle de los Reyes

![](brew:9f2c1a7b)
}}

El primer párrafo lleva capitular automática, como tras un encabezado normal.
```

`flourish` añade el rasgo dorado del extremo. Se ajusta con variables, que se
pasan en la propia etiqueta: `--chapter-height` (12,5 cm por defecto),
`--chapter-banner-top`, `--chapter-title-size`, `--chapter-banner-bg` y
`--chapter-banner-tilt`. Sin imagen dentro, la tira se apoya directamente sobre
el pergamino.

El canto roto no es una onda: es un perfil de 380 vértices con deriva lenta,
fibra fina y algún desgarro más hondo cada tanto, en un mosaico de 1040 px que
se repite en horizontal. Una onda regular se reconoce enseguida como un patrón;
esto se lee como papel. La sombra la da `drop-shadow`, no `box-shadow`, porque
solo la primera sigue la silueta de la máscara en vez de dibujar un rectángulo.

Los márgenes negativos que sacan la banda hasta el borde del papel son
exactamente el relleno de la página, así que si cambias `--page-padding` en tu
CSS la cabecera lo sigue sin tocar nada.

### Portadas e índice

- `{{frontCover }}`, `{{partCover }}` y `{{backCover }}` convierten la página en
  portada: una sola columna, a sangre, sin número de página y **sin la textura
  de pergamino** — con ella, cualquier ilustración en `mix-blend-mode: multiply`
  sale amarilleada. El `h1` y el `h2` salen centrados, en blanco si hay
  ilustración de fondo y en el rojo habitual si no la hay.
- `{{frontCover,framed }}` añade la cenefa dorada. Es opcional a propósito:
  casi toda ilustración de portada ya trae la suya y dos marcos se estorban.
- `{{toc,wide,columns-3 … }}` da la portadilla de contenidos a tres columnas,
  con el título cruzando por encima. Con `{{bleed,bottom … }}` debajo, la
  ilustración se pega al pie tocando los tres bordes y **la página se reserva el
  sitio sola**: la misma variable `--bleed-height` fija la altura de la banda y
  el relleno inferior, así que el texto de las columnas se detiene justo encima
  en vez de pasarle por debajo. Hay `short` (8 cm), normal (11 cm) y `tall`
  (14 cm), y también `{{bleed,top }}`.
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

Viven en la pestaña **Imágenes** del editor, junto a Texto y Estilo: insertar
una imagen es escribir en el documento, así que su sitio es el panel donde se
escribe. Pulsar una miniatura la inserta y te devuelve a Texto.

Al soltarlas se reducen: nada por encima de 2200 px de lado, recomprimido a
WebP, y solo si el resultado sale más pequeño. Un PNG de 3,1 MB acaba en 50 KB.
Importa porque en el `.html` exportado las imágenes van en base64, que engorda
otro 33 %. Los SVG y los GIF se dejan intactos —vectorial el uno, posible
animación el otro—, y el aviso te dice qué se hizo.

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

## El menú Insertar

Está en la barra superior, junto a *Archivo*, repartido en cinco pestañas:

- **PHB** — todo lo del manual: estructura, portadas, cajas, reglas, criaturas,
  adornos e imágenes.
- **Tablas** — tabla normal, ancha, dos en paralelo (`split-table`), con marco y
  la de progresión de clase.
- **Fuentes** — atajos `{{f-body}}`, `{{f-heading}}`, `{{f-display}}`,
  `{{f-sans}}`, `{{f-hand}}`, `{{f-mono}}` y `{{smallcaps}}`. Son las cuatro
  familias del proyecto: si pones las del manual en `public/fonts`, estos
  atajos las cogen sin tocar nada.
- **Licencias** — créditos de ilustración, Creative Commons y MIT.
- **Míos** — selecciona texto en el editor y guárdalo con nombre. Se reutiliza
  en cualquier documento y viaja en la copia de seguridad.

Si insertas algo estando en *Estilo* o *Imágenes*, el editor vuelve solo a
*Texto* y coloca el fragmento allí: los fragmentos son Markdown, no CSS.

Sobre las licencias, un aviso que va en serio: las de Creative Commons y la MIT
van con su texto, porque son cortas y estables. Para las de contenido de fan y
las abiertas tipo ORC u OGL **inserto una plantilla que te dice que pegues el
texto oficial**, no el texto. Esas licencias obligan a reproducir el aviso
palabra por palabra, y transcribirlas de memoria en algo que vas a publicar
sería meterte en un lío por ahorrarte un copiar y pegar.

## Tablas largas

Una tabla que no cabe **continúa en la columna siguiente y repite su cabecera**,
como en los manuales. Antes llevaban `break-inside: avoid` y una tabla larga no
cabía entera en ningún sitio: saltaba de columna dejando huecos y acababa
recortada contra el borde del papel. Si quieres una de una pieza, `{nobreak}`.

## Aviso de desborde

Las páginas tienen altura fija y `overflow: hidden`. Cuando escribes más de lo
que cabe, el multicolumna **no** tira el exceso hacia abajo: crea columnas de
más hacia la derecha, fuera del papel, y las recorta. El texto desaparece de la
pantalla y del PDF sin dejar rastro.

Por eso la vista previa mide cada página —`scrollWidth` mayor que `clientWidth`
lo delata— y rodea de rojo las que se salen, con el recuento en la barra del
editor y un botón para saltar a la primera. Al imprimir el aviso no sale.

## Autocompletado

Se dispara solo con lo que escribes, sin atajos que recordar:

| Escribes | Te ofrece |
| --- | --- |
| `{{` | Los bloques y clases: note, chapter, bleed, map, icon-… |
| ` ``` ` | statblock, spell, item, sheet, toc, index, metadata |
| `brew:` | Tus imágenes guardadas, con su nombre |
| `{{ref ` | Las anclas que existen en el documento |

## Bestiario

Pon el cursor dentro de un bloque `statblock`, *Insertar → Bestiario → Guardar
la ficha del cursor*, y queda disponible en todos tus documentos:

````markdown
```statblock
ref: esqueleto-anonimo
name: Esqueleto Veterano
hp: 45 (7d8 + 14)
```
````

Lo que escribas junto al `ref:` **sobrescribe** la ficha guardada, que es como
se hace una variante sin duplicar el YAML entero. Se guarda el YAML, no el HTML,
así que una ficha vieja se sigue beneficiando de las mejoras del renderizador.

## Modo lectura e imprenta

El cuarto botón de vista es **modo lectura**: una columna, cuerpo grande y sin
cortes de página, para dirigir desde la tableta. Maquetar a dos columnas es
precioso para imprimir e incómodo para leer en la mesa. Al imprimir vuelve solo
a dos columnas y su cuerpo normal.

En el desplegable del papel están además:

- **Marcas de corte y sangrado** de 3 mm: ocho marcas, dos por esquina, y el
  papel del PDF crece 1,6 cm por eje para que quepan. Comprobado: una Carta
  sale como una hoja de 23,18 × 29,52 cm con sus marcas dentro.
- **Numeración por secciones**: romanos para los preliminares y «empezar a
  numerar en…» para que el cuerpo arranque otra vez en 1, como en los libros.

Y las viudas y huérfanas están controladas (`orphans`/`widows`), así que no
quedan líneas sueltas al pie de columna.

## Hoja de personaje

````markdown
```sheet
edition: 2024
name: Vandra Piedrahonda
class: Guerrera
level: 6
stats: [17, 14, 16, 10, 12, 8]
saves: [fue, con]
skills: [atletismo, intimidacion, percepcion]
expertise: [atletismo]
ac: 18
hp: 52
```
````

Ocupa la página entera a tres columnas, con el mismo lenguaje visual que las
fichas de criatura: papel crema sobre el pergamino, marco dorado, divisores
rojos y titulares en versalitas. Los recuadros de característica llevan la
puntuación en un disco montado sobre el borde, y los de combate un icono
—escudo, d20, huella, corazón—. Al ser todo variables, la hoja se adapta sola a
los cinco temas, incluido el oscuro.

**Los números se calculan solos**:
modificadores, bono de competencia por nivel, salvaciones y las dieciocho
habilidades con su característica. La pericia suma el bono dos veces y se marca
con un punto anillado. Lo que dejes vacío sale como recuadro con su filete, para
rellenarlo a mano o imprimirlo en blanco.

`edition: 2024` y `edition: 2014` no son la misma hoja con otro marco: la de
2024 pone las salvaciones dentro de los recuadros de característica y cambia
personalidad, ideales, vínculos y defectos por rasgos de clase, rasgos de
especie, dotes, entrenamiento con armaduras y maestría con armas. La de 2014
mantiene el panel de salvaciones aparte y los cuatro recuadros de trasfondo.

**Qué es y qué no es.** Los nombres de características y habilidades son
términos de reglas, publicados en la SRD bajo CC-BY, y se pueden usar. La
maqueta es de este proyecto: no es un calco de la hoja oficial, que sí es obra
de su editorial. Si quieres la de ellos, descárgala de su web; esto es una hoja
con los mismos campos y el aspecto del resto de tus documentos.

## Índices que se escriben solos

En un manual largo, teclear el número de página de cada entrada del índice es el
trabajo más ingrato: mueves un párrafo del capítulo 2 y quedan mal todos los de
ahí en adelante, sin forma de saber cuáles.

Como los saltos de página los pones tú con `\page`, la paginación es
determinista y se puede calcular antes de dibujar nada. Una pasada previa
recorre el documento, apunta en qué página cae cada encabezado, cada ancla y
cada término marcado, y con eso se montan tres cosas:

````markdown
```toc
title: Contenidos
columns: 3
levels: 3
```
````

- **`` ```toc ``**: índice de contenidos con números reales, siempre al día.
- **`` ```index ``**: índice alfabético del final. Marca los términos por el
  texto con `{{ix hechicero}}` —que escribe la palabra *y* la apunta— o con
  `{{ix,hidden término}}` si solo quieres apuntarla.
- **`{{ref cripta}}`**: escribe el número de la página donde esté
  `{{#cripta}}`. Si el ancla no existe sale `??` en rojo, para que se vea.

Las páginas que dependen del documento entero llevan una firma de esa pasada en
la clave de su caché; las demás no. Si no, cambiar un encabezado obligaría a
recomponer las 224 páginas en cada tecla.

## Mapas

```markdown
{{map,grid,--grid-size:1cm
![](brew:9f2c1a7b)
{{scale 1 casilla = 1,5 m}}
}}
```

Cuadrícula o hexágonos (`hexgrid`) sobre la ilustración. El paso va en medidas
de página, así que 1 cm de rejilla es 1 cm impreso. Se ajusta con
`--grid-size`, `--grid-color`, `--grid-line` y `--grid-opacity`.

## Páginas enfrentadas

El botón del libro abierto pone la vista previa a pliego: la primera página
suelta a la derecha y el resto por parejas, con sombra de lomo. Los manuales se
diseñan así, y una apertura de capítulo no se lee igual en la izquierda que en
la derecha. Al imprimir, cada hoja vuelve a ir suelta.

## Columnas

La página va a **dos columnas** por defecto, como el Manual del Jugador. En el
desplegable del tamaño de papel se cambia a **tres**, que es lo que usan los
manuales para índices y apéndices; con tres columnas el cuerpo y los encabezados
bajan un punto para que quepan las palabras sin partirse. Es una propiedad del
documento, así que cada manual guarda la suya.

Un bloque suelto puede llevar la contraria a la página con `columns-2` o
`columns-3`, pero **hay que combinarlo con `wide`**:

```markdown
{{wide,columns-3
…
}}
```

Sin `wide` el bloque se queda dentro de una columna de la página y sus
subcolumnas salen tan estrechas que no valen para nada.

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
| `{nobreak}` | Impide que una tabla o un bloque se parta entre columnas. |
| `![](x.jpg) {torn}` | Papel rasgado: canto ondulado. También `{torn-top}`, `{torn-bottom}`, `{torn-left}`, `{torn-right}`. |
| `![](x.jpg) {brush}` | Borde de pincel: recorte irregular a mano alzada por los cuatro lados. `{brush-rough}` lo deja más comido. |
| `{{memo … }}` | Cuartilla ladeada con una cita y su firma. `{{memo,pinned }}` la saca al margen. |
| `{{watercolor,wc-verde,top:3cm,left:1cm }}` | Mancha de acuarela detrás del texto. |
| `{{icon-d20}}` | Icono en línea, del color del texto que lo rodea. |

Los dos bordes no son lo mismo y se notan: `{torn}` imita papel rasgado, con
canto ondulado y suave; `{brush}` imita un recorte pintado, con astillas finas e
irregulares. Para una ilustración que sangre por el lado de la página, combínalo
con posición: `{brush,position:absolute,right:-1cm,top:4cm,width:9.5cm,height:17cm}`.

En `{{memo}}`, el último párrafo se maqueta como firma si empieza por raya. El
ángulo se cambia con `--memo-rotate` y el color con `--memo-bg`. La tipografía
sale del stack `--font-brew-hand`, que por defecto es la del texto en cursiva:
si tienes una fuente manuscrita, defínela ahí y la tarjeta la usa.

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

## Historial de versiones

Cada documento guarda copias con fecha en IndexedDB, en la pestaña *Versiones*
de la barra lateral. Se toma una automática cada pocos minutos mientras
escribes —solo si el texto ha cambiado— y se conservan las 15 últimas. Las que
pidas tú desde *Archivo → Guardar versión* no se borran nunca.

Al restaurar, el texto de ese momento se guarda antes como versión, así que
restaurar también se puede deshacer.

Es la red que faltaba: deshacer solo vive en la sesión, y al recargar la página
lo escrito hace media hora ya no tenía vuelta atrás.

## Compartir por enlace

*Archivo → Copiar enlace para compartir* mete el documento comprimido en el
fragmento (`#`) de la URL. Ese fragmento **el navegador no lo envía al
servidor**: el texto solo llega a quien abra el enlace.

Un documento de 750 caracteres da un enlace de unos 280. Por encima de 8.000
caracteres avisa, porque muchos navegadores y aplicaciones de mensajería cortan
las URL largas — para un manual entero es mejor exportar el `.html`.

Las imágenes no viajan en el enlace: son blobs de IndexedDB y dispararían el
tamaño. Un documento con imágenes propias se comparte exportando el `.html`,
que sí las lleva incrustadas.

## Buscar y reemplazar

`⇧⌘F` busca en el documento abierto o, marcando «en todos», en todos a la vez;
agrupa por documento y al pulsar un resultado abre ese documento con el cursor
en la línea. El `⌘F` de siempre sigue buscando dentro del editor.

El reemplazo no usa expresiones regulares y no distingue mayúsculas, igual que
la búsqueda: **lo que ves en la lista es exactamente lo que se cambia**. Antes de
aplicarlo se guarda una versión, porque un reemplazo masivo mal hecho es de las
pocas cosas que no se arreglan con `Cmd+Z`.

## Revisión antes de imprimir

El botón del portapapeles reúne en una lista todo lo que va a fallar: imágenes
borradas que el documento sigue usando, `{{ref}}` a anclas que no existen,
`ref:` a criaturas que no están en el bestiario, páginas desbordadas e índices
sin nada que listar. Cada aviso salta a su línea o a su página.

Cada una de esas cosas ya se ve por separado —recuadro rojo, `??`, filete—, pero
en doscientas páginas no las encuentras todas a ojo.

## Comparar versiones

Al pulsar una versión guardada ya no se restaura a ciegas: se abre el diff línea
a línea contra el texto actual, con el recuento de añadidas y quitadas, y el
botón de restaurar dentro. Restaurar sigue guardando antes lo que había.

Para no bloquear el navegador con documentos grandes, el diff recorta primero el
principio y el final comunes —que en una edición normal son casi todo— y solo
compara el resto; si aun así es enorme, informa del tamaño en vez de intentarlo.

## Atajos y corrector

`Cmd+B` negrita, `Cmd+I` cursiva, `Cmd+K` enlace y `Cmd+Enter` salto de página.
Envolver alterna: si lo seleccionado ya está entre las marcas, se quitan.

El corrector ortográfico del navegador está activo (el documento ya declara
`lang="es"`). Marcará como faltas la sintaxis del proyecto —`{{note`, `brew:`—,
así que se apaga desde el desplegable del papel.

## Seguir al cursor

Con el botón de la cadena en la barra superior, la vista previa se acerca sola a
la página donde tienes el cursor y la rodea con un filete dorado. Solo se mueve
cuando **cambias de página**: si siguiera cada tecla, el scroll pelearía contigo
y no se podría leer. El pie del editor te dice en cuál estás.

Se apaga con el mismo botón cuando quieras leer una página mientras escribes en
otra.

## Ajustes del documento y del escritorio

Están separados a propósito:

| Van con el documento | Van con el escritorio |
| --- | --- |
| Tamaño de papel (Carta / A4) | Vista (editor, dividida, previa) |
| Columnas de la página (2 o 3) | |
| Tema (PHB / DMG) | Zoom y ancho de los paneles |
| Números de página | Seguir al cursor |
| CSS propio | |

Son propiedades de la obra, no de cómo la miras: un manual en A4 y otro en Carta
conviven sin pisarse, y duplicar un documento se lleva todo consigo. Si ya tenías
elegido A4 o el tema DMG cuando eran globales, se trasladan a tus documentos la
primera vez que abres esta versión.

## Temas

Cinco, elegidos por documento en el desplegable de la paleta:

| Tema | Para qué |
| --- | --- |
| **Manual del Jugador** | El de siempre: pergamino cálido y titulares rojos. |
| **Guía del Dungeon Master** | Papel algo más frío y titulares marrones. |
| **Limpio** | Papel blanco sin textura. Borradores, apéndices largos y gastar menos tinta al imprimir. |
| **Grimorio** | Tomo oscuro, tinta hueso y oro. |
| **Diario** | Papel sepia con pauta tenue y tinta parda, en la tipográfica manuscrita. |

Un tema **solo redefine variables**: color de papel, manchas, grano, tinta y
cajas. Ninguna regla nueva, así que fichas, portadas, cabeceras de capítulo y
adornos se adaptan solos sin tocarlos.

Para que eso funcionase hubo que sacar la textura del pergamino a variables
—`--page-stains`, `--page-grain`, `--page-blend`—: antes estaba escrita a fuego
en `.page` y ningún tema podía cambiarla.

El tema oscuro necesita además cuatro reglas extra, porque las cajas heredaban
la tinta clara sobre fondos que en ese tema ya son oscuros. Es la excepción que
confirma la regla: si haces un tema claro, con las variables te basta.

### El tuyo

En la pestaña **Estilo**, redefiniendo variables sobre `:scope`:

```css
:scope {
  --parchment: #e8eef2;
  --accent: #1d4e6b;
  --note-bg: #dbe7ef;
  --statblock-accent: #1d4e6b;
}
```


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
src/lib/db.ts                Apertura única de IndexedDB (imágenes y versiones).
src/lib/snapshots.ts         Historial de versiones.
src/lib/share.ts             Enlace comprimido en el fragmento de la URL.
src/lib/markdown/blocks.ts   Bloques de conjuro y objeto mágico.
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
