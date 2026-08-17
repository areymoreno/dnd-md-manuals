export interface Snippet {
  label: string;
  hint?: string;
  /** `$0` marca dónde queda el cursor tras insertar (se elimina del texto). */
  text: string;
}

export type SnippetTab = "phb" | "tablas" | "fuentes" | "licencias";

export interface SnippetGroup {
  label: string;
  tab?: SnippetTab;
  items: Snippet[];
}

export const SNIPPET_TABS: { id: SnippetTab; label: string }[] = [
  { id: "phb", label: "PHB" },
  { id: "tablas", label: "Tablas" },
  { id: "fuentes", label: "Fuentes" },
  { id: "licencias", label: "Licencias" },
];


export const CURSOR_TOKEN = "$0";

export const SNIPPET_GROUPS: SnippetGroup[] = [
  {
    label: "Estructura",
    tab: "phb",
    items: [
      { label: "Salto de página", hint: "\\page", text: "\n\\page\n\n$0" },
      { label: "Salto de columna", hint: "\\column", text: "\n\\column\n\n$0" },
      {
        label: "Bloque a doble columna",
        hint: "{{wide}}",
        text: "{{wide\n$0\n}}\n",
      },
      {
        label: "Encabezado de capítulo",
        hint: "# + capitular",
        text: "# $0Título del capítulo\n\nEl primer párrafo lleva capitular automática.\n",
      },
      { label: "Separador ornamental", hint: "___", text: "\n___\n\n$0" },
      {
        label: "Pie de página",
        hint: "{{footnote}}",
        text: "{{footnote $0Parte 1 · El Valle de los Reyes}}\n",
      },
      {
        label: "Número de página manual",
        hint: "{{pageNumber}}",
        text: "{{pageNumber $01}}\n",
      },
      {
        label: "Línea en blanco",
        hint: ":",
        text: ":\n$0",
      },
    ],
  },
  {
    label: "Portadas e índice",
    tab: "phb",
    items: [
      {
        label: "Cabecera de capítulo",
        hint: "{{chapter}}",
        text: `{{chapter,flourish
# $0Capítulo 1: El Valle de los Reyes

![](https://ejemplo.com/ilustracion.jpg)
}}

El primer párrafo lleva capitular automática, como tras un encabezado.
`,
      },
      {
        label: "Cabecera de capítulo más alta",
        hint: "--chapter-height",
        text: `{{chapter,--chapter-height:16cm,--chapter-banner-top:2.5cm
# $0Capítulo 2: La Cripta

![](https://ejemplo.com/ilustracion.jpg)
}}
`,
      },
      {
        label: "Portada con ilustración a sangre",
        hint: "{{frontCover}}",
        text: `{{frontCover }}

![portada]($0https://ejemplo.com/portada.jpg) {cover}

# Título del manual

## Un suplemento para la 5ª edición

{{footnote Una frase de gancho para la contraportada.}}
`,
      },
      {
        label: "Portada con cenefa dorada",
        hint: "{{frontCover,framed}}",
        text: `{{frontCover,framed }}

![portada]($0https://ejemplo.com/portada.jpg) {cover}

# Título del manual
`,
      },
      {
        label: "Portadilla de parte",
        hint: "{{partCover}}",
        text: `{{partCover }}

![ilustración]($0https://ejemplo.com/parte.jpg) {cover}

# Primera parte

## El Valle de los Reyes
`,
      },
      {
        label: "Imagen de fondo a página completa",
        hint: "{cover}",
        text: "![fondo]($0https://ejemplo.com/fondo.jpg) {cover}\n",
      },
      {
        label: "Contraportada",
        hint: "{{backCover}}",
        text: `{{backCover }}

![contraportada]($0https://ejemplo.com/contra.jpg) {cover}
`,
      },
      {
        label: "Índice automático",
        hint: "```toc",
        text: `\`\`\`toc
title: $0Contenidos
columns: 3
levels: 3
\`\`\`
`,
      },
      {
        label: "Índice alfabético automático",
        hint: "```index",
        text: `\`\`\`index
title: $0Índice alfabético
columns: 3
\`\`\`
`,
      },
      {
        label: "Marcar término para el índice",
        hint: "{{ix}}",
        text: "{{ix $0hechicero}}",
      },
      {
        label: "Referencia a otra página",
        hint: "{{ref}} + {{#ancla}}",
        text: "véase la página {{ref $0cripta}}",
      },
      {
        label: "Ancla para referenciar",
        hint: "{{#ancla}}",
        text: "# {{#$0cripta}}La Cripta del Rey\n",
      },
      {
        label: "Portadilla de índice a tres columnas",
        hint: "{{toc,wide,columns-3}}",
        text: `{{toc,wide,columns-3
# Contenidos

- ### [{{ $0Prefacio}}{{ 4}}](#p4)
- ### [{{ Cap. 1: El Valle de los Reyes}}{{ 5}}](#p5)
  - #### [{{ Los primeros días}}{{ 5}}](#p5)
    - [{{ Un rumor en la posada}}{{ 6}}](#p6)
- ### [{{ Apéndice A: Monstruos}}{{ 20}}](#p20)
}}

{{bleed,bottom
![](https://ejemplo.com/ilustracion.jpg)
{{artist Ilustración de Alguien}}
}}
`,
      },
      {
        label: "Ilustración a sangre al pie",
        hint: "{{bleed,bottom}}",
        text: `{{bleed,bottom
![]($0https://ejemplo.com/ilustracion.jpg)
}}
`,
      },
      {
        label: "Índice con guías de puntos",
        hint: "{{toc,wide}}",
        text: `{{toc,wide
# Tabla de Contenidos

- ### [{{ $0Capítulo 1: El Valle}}{{ 3}}](#p3)
  - #### [{{ Los primeros días}}{{ 3}}](#p3)
    - [{{ Un rumor en la posada}}{{ 4}}](#p4)
- ### [{{ Capítulo 2: La Cripta}}{{ 7}}](#p7)
}}
`,
      },
    ],
  },
  {
    label: "Cajas",
    tab: "phb",
    items: [
      {
        label: "Nota (verde)",
        hint: "{{note}}",
        text: "{{note\n##### $0Título de la nota\nTexto de la nota.\n}}\n",
      },
      {
        label: "Texto para leer en voz alta",
        hint: "{{descriptive}}",
        text: "{{descriptive\n##### $0Al abrir la puerta\nEl aire huele a azufre y polvo antiguo.\n}}\n",
      },
      {
        label: "Cita",
        hint: "{{quote}}",
        text: "{{quote\n$0«Nunca confíes en un mago con prisa.»\n\n— Anónimo\n}}\n",
      },
      {
        label: "Bloque con estilo libre",
        hint: "{{clase,css}}",
        text: "{{$0mi-clase,width:6cm,background:#f0e6d2\nContenido\n}}\n",
      },
      {
        label: "Inyectar estilo al bloque anterior",
        hint: "{width:6cm}",
        text: "{$0width:6cm,float:right,margin-left:0.3cm}\n",
      },
    ],
  },
  {
    label: "Reglas",
    tab: "phb",
    items: [
      {
        label: "Lista de definición",
        hint: "término :: valor",
        text: "**Tiempo de lanzamiento** :: 1 acción\n**Alcance** :: 36 metros\n**Componentes** :: V, S, M (una pizca de azufre)\n**Duración** :: Instantánea\n$0",
      },
      {
        label: "Tabla",
        hint: "| d6 | ... |",
        text: "| d6 | Resultado |\n|:--:|:----------|\n| 1  | $0Nada ocurre |\n| 2  | Un ruido lejano |\n| 3  | Cae polvo del techo |\n",
      },
      {
        label: "Conjuro",
        hint: "```spell",
        text: `\`\`\`spell
name: $0Bola de Fuego
level: 3
school: Evocación
casting_time: 1 acción
range: 45 metros
components: V, S, M (una bolita de guano de murciélago y azufre)
duration: Instantánea
classes: Mago, Hechicero
description: |
  Un destello brillante sale despedido de tu dedo índice hasta un punto que
  elijas dentro del alcance y estalla en una llamarada. Cada criatura en una
  esfera de 6 m de radio centrada en ese punto debe hacer una tirada de
  salvación de Destreza CD 15.
higher_levels: El daño aumenta en 1d6 por cada nivel por encima del 3.
\`\`\`
`,
      },
      {
        label: "Objeto mágico",
        hint: "```item",
        text: `\`\`\`item
name: $0Espada Solar
type: Arma (espada larga)
rarity: muy rara
attunement: true
description: |
  Esta espada arde con luz solar cuando la empuñas. Emite luz brillante en un
  radio de 4,5 m y luz tenue otros 4,5 m más.
\`\`\`
`,
      },
      {
        label: "Conjuro escrito a mano",
        text: "#### $0Bola de Fuego\n*Evocación de nivel 3*\n\n**Tiempo de lanzamiento** :: 1 acción\n**Alcance** :: 45 metros\n**Componentes** :: V, S, M (una bolita de guano de murciélago y azufre)\n**Duración** :: Instantánea\n\nUn destello brillante sale despedido de tu dedo índice hasta un punto que elijas dentro del alcance y estalla en una llamarada.\n",
      },
      {
        label: "Objeto mágico escrito a mano",
        text: "#### $0Espada Solar\n*Arma (espada larga), muy rara (requiere sintonización)*\n\nEsta espada arde con luz solar cuando la empuñas.\n",
      },
    ],
  },
  {
    label: "Personajes",
    tab: "phb",
    items: [
      {
        label: "Hoja de personaje (2024)",
        hint: "```sheet",
        text: `\`\`\`sheet
edition: 2024
name: $0
class:
level: 1
species:
background:
size: Mediano
player:
stats: [10, 10, 10, 10, 10, 10]
saves: []
skills: []
expertise: []
ac:
speed: 9 m
hp:
hit_dice:
attacks:
  - name:
    bonus:
    damage:
    notes:
proficiencies:
languages:
equipment: |
coins:
features: |
armor_training:
weapon_mastery:
traits: |
feats:
\`\`\`
`,
      },
      {
        label: "Hoja de personaje (2014)",
        hint: "edition: 2014",
        text: `\`\`\`sheet
edition: 2014
name: $0
class:
level: 1
species:
background:
alignment:
player:
stats: [10, 10, 10, 10, 10, 10]
saves: []
skills: []
ac:
speed: 9 m
hp:
hit_dice:
attacks:
  - name:
    bonus:
    damage:
    notes:
proficiencies:
languages:
equipment: |
coins:
features: |
personality:
ideals:
bonds:
flaws:
\`\`\`
`,
      },
      {
        label: "Hoja rellenada de ejemplo",
        text: `\`\`\`sheet
edition: 2024
name: $0Vandra Piedrahonda
class: Guerrera
level: 6
species: Enana de las colinas
background: Soldado
stats: [17, 14, 16, 10, 12, 8]
saves: [fue, con]
skills: [atletismo, intimidacion, percepcion, supervivencia]
expertise: [atletismo]
ac: 18
speed: 7,5 m
hp: 52
hit_dice: 6d10
attacks:
  - name: Hacha a dos manos
    bonus: "+7"
    damage: 1d12 + 4 cortante
    notes: Pesada, a dos manos
\`\`\`
`,
      },
    ],
  },
  {
    label: "Criaturas",
    tab: "phb",
    items: [
      {
        label: "Bloque de estadísticas",
        hint: "```statblock",
        text: `\`\`\`statblock
name: $0Bandido
size: Mediano
type: humanoide
alignment: cualquier alineamiento no legal
ac: 12 (armadura de cuero)
hp: 11 (2d8 + 2)
speed: 9 m
stats: [11, 12, 12, 10, 10, 10]
senses: Percepción pasiva 10
languages: Común
cr: 1/8
actions:
  - name: Cimitarra
    desc: "*Ataque con arma cuerpo a cuerpo:* +3 al ataque, alcance 1,5 m, un objetivo. *Impacto:* 4 (1d6 + 1) de daño cortante."
  - name: Ballesta ligera
    desc: "*Ataque con arma a distancia:* +3 al ataque, alcance 24/96 m, un objetivo. *Impacto:* 5 (1d8 + 1) de daño perforante."
\`\`\`
`,
      },
      {
        label: "Estadísticas anchas (2 columnas)",
        hint: "wide: true",
        text: `\`\`\`statblock
wide: true
name: $0Dragón Rojo Adulto
size: Enorme
type: dragón
alignment: caótico malvado
ac: 19 (armadura natural)
hp: 256 (19d12 + 133)
speed: 12 m, escalar 12 m, volar 24 m
stats: [27, 10, 25, 16, 15, 19]
saves: DES +6, CON +13, SAB +8, CAR +11
skills: Percepción +13, Engaño +11, Sigilo +6
immunities: fuego
senses: visión ciega 18 m, visión en la oscuridad 36 m, Percepción pasiva 23
languages: Común, Dracónico
cr: 17
pb: "+6"
traits:
  - name: Resistencia Legendaria (3/día)
    desc: Si el dragón falla una tirada de salvación, puede elegir tener éxito en su lugar.
actions:
  - name: Multiataque
    desc: "El dragón usa su Presencia Aterradora y luego hace tres ataques: uno con la mordedura y dos con las garras."
  - name: Aliento de Fuego (Recarga 5-6)
    desc: "El dragón exhala fuego en un cono de 18 m. Cada criatura en el área debe hacer una tirada de salvación de Destreza CD 21, sufriendo 63 (18d6) de daño por fuego si falla, o la mitad si tiene éxito."
legendary_intro: El dragón puede realizar 3 acciones legendarias por ronda.
legendary:
  - name: Detectar
    desc: El dragón hace una prueba de Sabiduría (Percepción).
  - name: Ataque con la Cola
    desc: El dragón hace un ataque con la cola.
\`\`\`
`,
      },
      {
        label: "Plantilla vacía",
        text: `\`\`\`statblock
name: $0
size: Mediano
type: humanoide
alignment: neutral
ac:
hp:
speed: 9 m
stats: [10, 10, 10, 10, 10, 10]
senses: Percepción pasiva 10
languages: Común
cr:
traits:
  - name:
    desc:
actions:
  - name:
    desc:
\`\`\`
`,
      },
    ],
  },
  {
    label: "Adornos",
    tab: "phb",
    items: [
      {
        label: "Imagen de bordes rasgados",
        hint: "{torn}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {torn,width:100%}\n",
      },
      {
        label: "Imagen rasgada solo por abajo",
        hint: "{torn-bottom}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {torn-bottom,width:100%}\n",
      },
      {
        label: "Imagen con borde de pincel",
        hint: "{brush}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {brush,width:100%}\n",
      },
      {
        label: "Imagen con borde muy comido",
        hint: "{brush-rough}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {brush-rough,width:100%}\n",
      },
      {
        label: "Ilustración sangrando por el lado",
        hint: "{brush,position:absolute}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {brush,position:absolute,right:-1cm,top:4cm,width:9.5cm,height:17cm}\n",
      },
      {
        label: "Tarjeta / memorando",
        hint: "{{memo}}",
        text: `{{memo,pinned
$0Nuestra Vía Integrada de Éxito del Becario es un sistema robusto y sin
parangón para un crecimiento fiable año tras año.

—Omin Dran
}}
`,
      },
      {
        label: "Mapa con cuadrícula",
        hint: "{{map,grid}}",
        text: `{{map,grid,--grid-size:1cm
![]($0https://ejemplo.com/mapa.jpg)
{{scale 1 casilla = 1,5 m}}
}}
`,
      },
      {
        label: "Mapa con hexágonos",
        hint: "{{map,hexgrid}}",
        text: `{{map,hexgrid,--grid-size:1.2cm
![]($0https://ejemplo.com/mapa.jpg)
}}
`,
      },
      {
        label: "Mancha de acuarela",
        hint: "{{watercolor}}",
        text: "{{watercolor,wc-rojo,top:3cm,left:1cm$0 }}\n",
      },
      {
        label: "Icono en línea",
        hint: "{{icon-d20}}",
        text: "{{icon-d20$0}} ",
      },
      {
        label: "Encabezado con icono",
        text: "### {{icon-espada}} $0Combate\n",
      },
    ],
  },
  {
    label: "Imágenes",
    tab: "phb",
    items: [
      {
        label: "Imagen simple",
        text: "![$0descripción](https://ejemplo.com/imagen.jpg)\n",
      },
      {
        label: "Imagen con marco y crédito",
        text: "{{frame-image\n![$0](https://ejemplo.com/imagen.jpg)\n}}\n{{artist Ilustración de Alguien}}\n",
      },
      {
        label: "Imagen ajustada a la columna",
        hint: "{width:100%}",
        text: "![$0](https://ejemplo.com/imagen.jpg) {width:100%}\n",
      },
      {
        label: "Imagen flotante a la derecha",
        text: "![$0](https://ejemplo.com/imagen.jpg) {float:right,width:4cm,margin:0 0 0.3cm 0.3cm}\n",
      },
    ],
  },
  {
    label: "Tablas",
    tab: "tablas",
    items: [
      {
        label: "Tabla",
        hint: "| d6 | … |",
        text: "| d6 | Resultado |\n|:--:|:----------|\n| 1  | $0Nada ocurre |\n| 2  | Un ruido lejano |\n",
      },
      {
        label: "Tabla ancha",
        hint: "{{wide}}",
        text: "{{wide\n##### $0Título de la tabla\n| Nivel | Bono | Rasgos |\n|:-----:|:----:|:-------|\n| 1 | +2 | Rasgo inicial |\n| 2 | +2 | Otro rasgo |\n}}\n",
      },
      {
        label: "Dos tablas en paralelo",
        hint: "{{split-table}}",
        text: "{{split-table\n| d6 | $0Día |\n|:--:|:----|\n| 1  | Lluvia |\n| 2  | Niebla |\n\n| d6 | Noche |\n|:--:|:------|\n| 1  | Despejado |\n| 2  | Tormenta |\n}}\n",
      },
      {
        label: "Tabla con marco",
        hint: "{{framed-table}}",
        text: "{{framed-table\n##### $0Objetos de la mochila\n| d4 | Objeto |\n|:--:|:-------|\n| 1  | Cuerda de 15 m |\n| 2  | Yesquero |\n}}\n",
      },
      {
        label: "Tabla de progresión de clase",
        hint: "{{class-table}}",
        text: `{{wide,class-table
##### El $0Buscador
| Nivel | Bono de competencia | Rasgos | Trucos | 1.º | 2.º |
|:-----:|:-------------------:|:-------|:------:|:---:|:---:|
| 1.º | +2 | Sentido del tesoro | 2 | 2 | — |
| 2.º | +2 | Instinto de saqueo | 2 | 3 | — |
| 3.º | +2 | Especialidad | 2 | 4 | 2 |
| 4.º | +2 | Mejora de característica | 3 | 4 | 3 |
}}
`,
      },
    ],
  },
  {
    label: "Familias",
    tab: "fuentes",
    items: [
      {
        label: "Texto (EB Garamond)",
        hint: "{{f-body}}",
        text: "{{f-body $0texto}}",
      },
      {
        label: "Titulares (Cinzel)",
        hint: "{{f-heading}}",
        text: "{{f-heading $0texto}}",
      },
      {
        label: "Capitulares (Cinzel Decorative)",
        hint: "{{f-display}}",
        text: "{{f-display $0texto}}",
      },
      {
        label: "Fichas y notas (Alegreya Sans)",
        hint: "{{f-sans}}",
        text: "{{f-sans $0texto}}",
      },
      {
        label: "Manuscrita (tarjetas)",
        hint: "{{f-hand}}",
        text: "{{f-hand $0texto}}",
      },
      {
        label: "Monoespaciada",
        hint: "{{f-mono}}",
        text: "{{f-mono $0texto}}",
      },
      {
        label: "Versalitas",
        hint: "{{smallcaps}}",
        text: "{{smallcaps $0texto}}",
      },
      {
        label: "Cualquier otra fuente",
        hint: "font-family",
        text: '{{font-family:$0Georgia texto}}',
      },
      {
        label: "Cambiar la fuente de todo el documento",
        hint: "pestaña Estilo",
        text: "/* Esto va en la pestaña Estilo, no aquí */\n:scope { --font-brew-body: $0\"Mi Fuente\"; }\n",
      },
    ],
  },
  {
    label: "Avisos",
    tab: "licencias",
    items: [
      {
        label: "Créditos de ilustración",
        hint: "{{artist}}",
        text: "{{artist Ilustración de $0Alguien}}\n",
      },
      {
        label: "Creative Commons BY 4.0",
        text: "{{license\n##### Licencia\n$0«Título de la obra» de Tu Nombre está bajo licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es).\n}}\n",
      },
      {
        label: "Creative Commons BY-NC-SA 4.0",
        text: "{{license\n##### Licencia\n$0«Título de la obra» de Tu Nombre está bajo licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).\n}}\n",
      },
      {
        label: "Licencia MIT (para código o herramientas)",
        text: `{{license
##### Licencia MIT
Copyright (c) $0AÑO NOMBRE

Por la presente se concede permiso, sin cargo, a cualquier persona que obtenga
una copia de este software y los archivos de documentación asociados, para
utilizarlos sin restricción, incluyendo sin limitación los derechos de uso,
copia, modificación, fusión, publicación, distribución, sublicencia y/o venta.

EL SOFTWARE SE PROPORCIONA «TAL CUAL», SIN GARANTÍA DE NINGÚN TIPO.
}}
`,
      },
      {
        label: "Contenido de fan (plantilla)",
        hint: "revisa el texto oficial",
        text: `{{license
##### Aviso
$0Este es contenido no oficial. Sustituye este párrafo por el texto exacto de la
política de contenido de fan del titular de los derechos: no lo transcribas de
memoria, cópialo de su web.
}}
`,
      },
      {
        label: "Aviso de licencia abierta (plantilla)",
        hint: "pega el texto oficial",
        text: `{{license
##### Aviso de licencia
$0Pega aquí el texto íntegro de la licencia abierta que uses (ORC, OGL u otra),
copiado de la fuente oficial. Estas licencias exigen reproducir el aviso
palabra por palabra, así que no vale un resumen.
}}
`,
      },
    ],
  },
];
