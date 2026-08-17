"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface Row {
  syntax: string;
  result: string;
}

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Estructura de página",
    rows: [
      { syntax: "\\page", result: "Empieza una página nueva." },
      { syntax: "\\column", result: "Manda lo siguiente a la otra columna." },
      {
        syntax: "{{wide … }}",
        result: "Bloque que cruza todas las columnas de la página.",
      },
      {
        syntax: "{{wide,columns-3 … }}",
        result:
          "Bloque con su propio número de columnas. Va junto a «wide»: sin cruzar la página, las columnas quedarían dentro de una sola y saldrían larguísimas.",
      },
      { syntax: "___", result: "Separador horizontal ornamental." },
      { syntax: "{{footnote texto}}", result: "Pie de página." },
      {
        syntax: "{{pageNumber 12}}",
        result:
          "Numera la página a mano; desactiva el número automático en esa página.",
      },
      {
        syntax: ":",
        result:
          "Una línea en blanco que Markdown no colapsa. Cada «:» de más añade otra.",
      },
      {
        syntax: "```metadata",
        result:
          "Cabecera de Homebrewery: no se dibuja, y al importar da nombre al documento.",
      },
    ],
  },
  {
    title: "Estilos inyectados",
    rows: [
      {
        syntax: "![](brew:9f2c1a7b)",
        result:
          "Imagen guardada en el navegador. Arrastra o pega una sobre el editor y la referencia se escribe sola.",
      },
      {
        syntax: "![](fondo.jpg) {cover}",
        result:
          "Ilustración a sangre: cubre la página entera, sea Carta o A4, y se queda por debajo del texto. Añade {cover,contain} para encajarla sin recortar.",
      },
      {
        syntax: "![](x.jpg) {float:right,width:4cm}",
        result:
          "Llave simple tras un elemento: le aplica clases y CSS. Cualquier propiedad vale.",
      },
      {
        syntax: "# Título {color:#fff}",
        result: "Si va tras texto suelto, se aplica al bloque que lo contiene.",
      },
      {
        syntax: "**negrita**{color:#922610}",
        result: "Tras un elemento en línea, se aplica a ese elemento.",
      },
      {
        syntax: "{width:6cm}",
        result:
          "En una línea suelta, se aplica al bloque anterior (una nota, una tabla, una ficha).",
      },
      {
        syntax: "{{frontCover }} · {{partCover }} · {{backCover }}",
        result:
          "Convierte la página en portada: una sola columna, a sangre, sin número y sin textura de pergamino, para que la ilustración salga con sus colores.",
      },
      {
        syntax: "{{frontCover,framed }}",
        result:
          "Añade la cenefa dorada. Va aparte porque casi toda ilustración de portada ya trae la suya.",
      },
      {
        syntax: "{{chapter … }}",
        result:
          "Apertura de capítulo: la ilustración sangra por los tres lados y se rasga arriba y abajo, y el H1 va sobre una tira de papel roto. El párrafo siguiente lleva capitular.",
      },
      {
        syntax: "{{chapter,flourish,--chapter-height:16cm … }}",
        result:
          "«flourish» añade el rasgo dorado. Se ajusta con --chapter-height, --chapter-banner-top, --chapter-title-size y --chapter-banner-bg.",
      },
      {
        syntax: "{{bleed,bottom … }}",
        result:
          "Ilustración pegada al pie de la página, tocando los tres bordes. La página se reserva el sitio sola. También {{bleed,top }}, y los tamaños short y tall.",
      },
      {
        syntax: "{{toc,wide,columns-3 … }}",
        result:
          "Índice a tres columnas, con el título cruzando por encima. Es la portadilla de contenidos de los manuales.",
      },
      {
        syntax: "{{toc,wide … }}",
        result:
          "Índice. Con enlaces del tipo [{{ Nombre}}{{ 12}}](#p12) sale la guía de puntos; cada página tiene id p1, p2…",
      },
    ],
  },
  {
    title: "Bloques con llaves",
    rows: [
      {
        syntax: "{{note … }}",
        result: "Caja verde de nota para el director de juego.",
      },
      {
        syntax: "{{descriptive … }}",
        result: "Caja crema para texto que se lee en voz alta.",
      },
      { syntax: "{{quote … }}", result: "Cita con filete lateral." },
      {
        syntax: "{{clase,otra … }}",
        result: "Cualquier palabra suelta se convierte en clase CSS.",
      },
      {
        syntax: "{{width:6cm,color:#922610 … }}",
        result: "Todo par clave:valor se aplica como estilo en línea.",
      },
      { syntax: "{{#id … }}", result: "Asigna un id al bloque." },
      {
        syntax: "{{color:#922610 texto}}",
        result: "Versión en línea, dentro de un párrafo.",
      },
    ],
  },
  {
    title: "Contenido de reglas",
    rows: [
      {
        syntax: "**Alcance** :: 36 metros",
        result: "Lista de definición (varias líneas seguidas forman una sola).",
      },
      { syntax: "| a | b |", result: "Tabla con filas alternas coloreadas." },
      {
        syntax: "# Título",
        result: "El párrafo siguiente lleva capitular automática.",
      },
      { syntax: "> cita", result: "Se renderiza como caja de nota." },
    ],
  },
  {
    title: "Adornos y estilo propio",
    rows: [
      {
        syntax: "![](x.jpg) {torn}",
        result:
          "Bordes rasgados. También por lados sueltos: {torn-top}, {torn-bottom}, {torn-left}, {torn-right}.",
      },
      {
        syntax: "![](x.jpg) {brush}",
        result:
          "Borde de pincel: recorte irregular a mano alzada por los cuatro lados. {brush-rough} lo deja más comido. Distinto de {torn}, que es papel rasgado y ondulado.",
      },
      {
        syntax: "{{memo … }}",
        result:
          "Cuartilla ladeada con una cita. Si el último párrafo empieza por raya, se maqueta como firma. {{memo,pinned }} la saca al margen; --memo-rotate cambia el ángulo.",
      },
      {
        syntax: "{{watercolor,wc-verde,top:3cm,left:1cm }}",
        result:
          "Mancha de acuarela detrás del texto. Colores: wc-rojo, wc-verde, wc-azul, wc-morado, wc-ocre, wc-tinta.",
      },
      {
        syntax: "{{icon-d20}}",
        result:
          "Icono en línea que toma el color del texto. Hay d4, d6, d20, espada, escudo, calavera, pocion, pergamino, corazon, llama, luna y huella.",
      },
      {
        syntax: "Pestaña «Estilo» del editor",
        result:
          "CSS propio de cada documento. Dentro de la app va acotado a la página, así que no puede romper el editor; en el .html exportado viaja incrustado.",
      },
      {
        syntax: "Desplegable de la paleta",
        result:
          "Cinco temas por documento: Manual del Jugador, Guía del Dungeon Master, Limpio, Grimorio (oscuro) y Diario (sepia).",
      },
      {
        syntax: ":scope { --parchment: #f6efe0; }",
        result:
          "En ese CSS, :scope es la página. Casi todo el diseño se cambia tocando variables: --parchment, --accent, --note-bg, --statblock-accent…",
      },
    ],
  },
  {
    title: "Índices y referencias",
    rows: [
      {
        syntax: "```toc",
        result:
          "Índice de contenidos que se construye solo, con los números de página reales. Opciones: title, columns (2 o 3) y levels (1 a 3).",
      },
      {
        syntax: "```index",
        result:
          "Índice alfabético del final, agrupado por inicial y a tres columnas.",
      },
      {
        syntax: "{{ix hechicero}}",
        result:
          "Escribe «hechicero» y lo apunta en el índice alfabético con su página. {{ix,hidden término}} solo lo apunta, sin escribirlo.",
      },
      {
        syntax: "{{#cripta}} … {{ref cripta}}",
        result:
          "Ancla y referencia: la segunda escribe el número de página donde está la primera, y se recalcula sola al mover contenido.",
      },
      {
        syntax: "{{map,grid,--grid-size:1cm … }}",
        result:
          "Cuadrícula sobre un mapa, en medidas de página. También hexgrid, y --grid-color, --grid-line y --grid-opacity.",
      },
    ],
  },
  {
    title: "Bloques de estadísticas",
    rows: [
      {
        syntax: "```statblock",
        result: "Bloque YAML que genera una ficha de criatura completa.",
      },
      {
        syntax: "wide: true",
        result: "Ficha ancha a dos columnas dentro del bloque.",
      },
      {
        syntax: "stats: [27, 10, 25, 16, 15, 19]",
        result: "Los modificadores se calculan solos.",
      },
      {
        syntax: "cr: 17",
        result: "La PX correspondiente se añade automáticamente.",
      },
      {
        syntax: "```sheet",
        result:
          "Hoja de personaje a página completa. `edition: 2024` o `2014`. Los modificadores, el bono de competencia y las habilidades se calculan solos; lo que dejes vacío queda como recuadro para rellenar a mano.",
      },
      {
        syntax: "saves / skills / expertise",
        result:
          "Listas con lo que tengas: [fue, con] y [atletismo, sigilo]. La pericia suma el bono dos veces y se marca con un punto anillado.",
      },
      {
        syntax: "```spell",
        result:
          "Conjuro desde YAML: name, level, school, casting_time, range, components, duration, classes, description, higher_levels.",
      },
      {
        syntax: "```item",
        result:
          "Objeto mágico: name, type, rarity, attunement, description. `attunement: true` escribe «requiere sintonización».",
      },
      {
        syntax: "traits / actions / bonus_actions / reactions / legendary / lair",
        result: "Listas de entradas con name y desc (admiten Markdown).",
      },
    ],
  },
];

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl border border-[var(--chrome-border)] bg-[#191512] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-[var(--chrome-border)] bg-[#191512] px-5 py-3.5">
          <h2 className="text-lg font-semibold text-[var(--chrome-accent)]">
            Referencia de sintaxis
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--chrome-muted)] transition hover:bg-[var(--chrome-border)] hover:text-[var(--chrome-text)]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 px-5 py-4">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-[var(--chrome-muted)] uppercase">
                {section.title}
              </h3>
              <dl className="divide-y divide-[var(--chrome-border)]">
                {section.rows.map((row) => (
                  <div
                    key={row.syntax}
                    className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-4"
                  >
                    <dt className="font-mono text-[13px] text-[var(--chrome-accent)]">
                      {row.syntax}
                    </dt>
                    <dd className="text-sm text-[var(--chrome-text)]/85">
                      {row.result}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-widest text-[var(--chrome-muted)] uppercase">
              Impresión a PDF
            </h3>
            <p className="text-sm text-[var(--chrome-text)]/85">
              Usa <span className="font-mono">Imprimir</span> y, en el diálogo del
              navegador, elige «Guardar como PDF», activa{" "}
              <em>Gráficos de fondo</em> y pon los márgenes en{" "}
              <em>Ninguno</em>. El tamaño de página del PDF sigue al que tengas
              seleccionado en la barra superior.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
