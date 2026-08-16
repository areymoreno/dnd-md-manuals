# Fuentes

Por defecto el editor usa cuatro fuentes de Google Fonts descargadas en tiempo de
compilación y servidas desde tu propio dominio (`next/font`), así que **no se
hace ninguna petición a Google cuando usas la app**:

| Papel en la página        | Fuente por defecto | Variable CSS           |
| ------------------------- | ------------------ | ---------------------- |
| Texto corrido             | EB Garamond        | `--font-brew-body`     |
| Títulos y encabezados     | Cinzel             | `--font-brew-heading`  |
| Fichas de criatura, notas | Alegreya Sans      | `--font-brew-sans`     |
| Capitulares               | Cinzel Decorative  | `--font-brew-display`  |

## Usar las fuentes originales del PHB

Las fuentes que imitan al manual (Bookinsanity, Mr Eaves Small Caps, Scaly Sans,
Solbera Imitation, Nodesto Caps Condensed) no se distribuyen con este proyecto
por licencia. Si ya las tienes:

1. Copia los `.woff2` en esta carpeta (`public/fonts/`).
2. Crea `public/fonts.css` con las declaraciones y redefine las variables:

```css
@font-face {
  font-family: "Bookinsanity";
  src: url("/fonts/Bookinsanity.woff2") format("woff2");
  font-display: swap;
}
/* …una por cada fuente… */

.brew {
  --font-brew-body: "Bookinsanity";
  --font-brew-heading: "Nodesto Caps Condensed";
  --font-brew-sans: "Scaly Sans";
  --font-brew-display: "Solbera Imitation";
}
```

3. Añade `<link rel="stylesheet" href="/fonts.css" />` justo debajo del de
   `/brew.css` en `src/app/layout.tsx`.

Las variables se leen en `public/brew.css` con un valor de reserva, así que si
falta alguna fuente el documento sigue componiéndose con la equivalente de
Google Fonts.
