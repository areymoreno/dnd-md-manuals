export interface Snippet {
  label: string;
  hint?: string;
  /** `$0` marca dónde queda el cursor tras insertar (se elimina del texto). */
  text: string;
}

export interface SnippetGroup {
  label: string;
  items: Snippet[];
}

export const CURSOR_TOKEN = "$0";

export const SNIPPET_GROUPS: SnippetGroup[] = [
  {
    label: "Estructura",
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
    items: [
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
        text: "#### $0Bola de Fuego\n*Evocación de nivel 3*\n\n**Tiempo de lanzamiento** :: 1 acción\n**Alcance** :: 45 metros\n**Componentes** :: V, S, M (una bolita de guano de murciélago y azufre)\n**Duración** :: Instantánea\n\nUn destello brillante sale despedido de tu dedo índice hasta un punto que elijas dentro del alcance y estalla en una llamarada.\n",
      },
      {
        label: "Objeto mágico",
        text: "#### $0Espada Solar\n*Arma (espada larga), muy rara (requiere sintonización)*\n\nEsta espada arde con luz solar cuando la empuñas.\n",
      },
    ],
  },
  {
    label: "Criaturas",
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
];
