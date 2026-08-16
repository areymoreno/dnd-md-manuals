export const SAMPLE_BREW = `# La Cripta del Rey Sin Nombre
Bajo las colinas de Vallecano duerme algo que nunca estuvo vivo del todo. Los
aldeanos hablan de luces verdes entre las lápidas y de un tañido de campana que
nadie sabe de dónde viene. Esta aventura está pensada para tres o cinco
personajes de nivel 3.

## Trasfondo
Hace trescientos años, el señor de estas tierras mandó borrar su propio nombre de
todos los registros del reino. Creía que un nombre es una correa: quien lo
conoce, te sujeta. Murió sin que nadie pudiera llamarlo, y por eso nadie pudo
darle sepultura como es debido.

{{descriptive
##### Al bajar el último escalón
El aire se vuelve espeso y frío. Vuestras antorchas se encogen hasta ser dos
puntos de brasa naranja, y en la penumbra distinguís una sala circular de piedra
negra. En el centro, un sarcófago abierto. Vacío.
}}

### Ganchos de aventura
Cualquiera de estos rumores puede llevar al grupo hasta la cripta.

| d4 | Rumor |
|:--:|:------|
| 1  | Una niña del pueblo camina dormida hacia las colinas cada noche. |
| 2  | El precio de la sal se ha triplicado; las caravanas evitan el valle. |
| 3  | Un cazador jura haber visto su propia cara en un espejo de agua. |
| 4  | El párroco ha dejado de decir misa y no explica por qué. |

{{note
##### Consejo para el DM
Si el grupo se separa en la cripta, no lo castigues de inmediato. Deja que la
sensación de aislamiento haga el trabajo durante una escena entera antes de que
aparezca la primera amenaza.
}}

\\column

## Zona 1. El Atrio de las Lápidas
Doce lápidas rodean la sala, todas con el nombre borrado a cincel. Una prueba de
Inteligencia (Historia) CD 13 revela que el patrón de las marcas corresponde a un
rito de olvido, no a un acto de vandalismo.

___

**Puertas selladas** :: Se abren solo si las doce lápidas están tumbadas.
**Trampa** :: Dardos de aguja (CD 14 para detectar, CD 13 para desarmar).
**Tesoro** :: 40 po en monedas antiguas y un anillo de plata sin inscripción.

Si los personajes pronuncian en voz alta cualquier nombre propio dentro de la
sala, la temperatura baja de golpe y los esqueletos se levantan.

\`\`\`statblock
name: Esqueleto Anónimo
size: Mediano
type: no muerto
alignment: legal malvado
ac: 13 (restos de armadura)
hp: 13 (2d8 + 4)
speed: 9 m
stats: [10, 14, 15, 6, 8, 5]
vulnerabilities: contundente
immunities: veneno
condition_immunities: envenenado, exhausto
senses: visión en la oscuridad 18 m, Percepción pasiva 9
languages: entiende Común pero no puede hablar
cr: 1/4
traits:
  - name: Sin Nombre
    desc: El esqueleto es inmune a cualquier efecto que requiera conocer el nombre de la criatura.
actions:
  - name: Espada Corta
    desc: "*Ataque con arma cuerpo a cuerpo:* +4 al ataque, alcance 1,5 m, un objetivo. *Impacto:* 5 (1d6 + 2) de daño perforante."
\`\`\`

\\page

## Zona 2. El Salón del Eco
Una galería larga donde cada palabra vuelve repetida tres veces. La tercera
repetición no siempre dice lo mismo que dijiste.

{{note
##### El Eco Mentiroso
La tercera vez que se repite una frase, tira 1d6. Con un 6, el eco sustituye una
palabra por otra que revela un secreto del personaje que habló. El jugador elige
cuál, pero debe ser cierto.
}}

### Enfrentamiento final
El rey no tiene cuerpo: habita el silencio entre las palabras. Solo puede ser
dañado mientras alguien esté hablando en voz alta, lo que obliga al grupo a
narrar sus acciones sin parar.

\`\`\`statblock
wide: true
name: El Rey Sin Nombre
size: Mediano
type: no muerto
subtype: espectro
alignment: neutral malvado
ac: 15
hp: 82 (11d8 + 33)
speed: 0 m, volar 12 m (levitar)
stats: [8, 18, 16, 17, 15, 20]
saves: SAB +5, CAR +8
skills: Perspicacia +5, Sigilo +7
resistances: ácido, fuego, relámpago, trueno; contundente, cortante y perforante de ataques no mágicos
immunities: necrótico, veneno, frío
condition_immunities: agarrado, paralizado, petrificado, envenenado, derribado, apresado
senses: visión en la oscuridad 18 m, Percepción pasiva 12
languages: todos los que conoció en vida
cr: 6
pb: "+3"
traits:
  - name: Existencia Silenciosa
    desc: Mientras ninguna criatura esté hablando en voz alta a menos de 18 m, el rey es inmune a todo el daño.
  - name: Movimiento Incorpóreo
    desc: El rey puede moverse a través de criaturas y objetos como si fueran terreno difícil. Recibe 5 (1d10) de daño de fuerza si termina su turno dentro de un objeto.
actions:
  - name: Multiataque
    desc: El rey hace dos ataques de Toque del Olvido.
  - name: Toque del Olvido
    desc: "*Ataque de conjuro cuerpo a cuerpo:* +8 al ataque, alcance 1,5 m, un objetivo. *Impacto:* 17 (4d6 + 3) de daño necrótico, y el objetivo debe superar una tirada de salvación de Carisma CD 16 o olvidar su propio nombre durante 1 minuto."
  - name: Robar el Nombre (Recarga 5-6)
    desc: "El rey elige una criatura que pueda ver a 9 m. Debe superar una tirada de salvación de Carisma CD 16 o quedar incapacitada hasta el final de su siguiente turno mientras busca en su memoria algo que ya no está."
legendary_intro: "El rey puede realizar 2 acciones legendarias por ronda, al final del turno de otra criatura."
legendary:
  - name: Susurro
    desc: El rey susurra el nombre verdadero de una criatura. Esta sufre 5 (1d10) de daño psíquico.
  - name: Deslizarse
    desc: El rey se mueve hasta la mitad de su velocidad sin provocar ataques de oportunidad.
\`\`\`

### Recompensas
Si el grupo derrota al rey pronunciando su nombre —grabado en el reverso del
anillo de plata de la Zona 1—, el espectro se deshace en polvo azul y deja atrás
una **Corona de Ecos**.

{{descriptive
##### Corona de Ecos
*Objeto maravilloso, raro (requiere sintonización)*

Mientras llevas esta corona puedes lanzar *mensaje* a voluntad. Una vez por
descanso largo, puedes repetir en voz alta la última frase que hayas oído: quien
la dijo debe superar una tirada de salvación de Sabiduría CD 15 o quedar aturdido
hasta el final de su siguiente turno.
}}

{{footnote La Cripta del Rey Sin Nombre — Aventura de nivel 3}}
`;
