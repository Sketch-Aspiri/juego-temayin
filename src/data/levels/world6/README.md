# Mundo 6 · Costa Maya y Bacalar

Tulum → Tulum Aeropuerto → Felipe Carrillo Puerto → Limones → Bacalar. Chetumal (`6-6`, jefe Lorencillo, tema `bay`) cierra el mundo: dos canales que se cruzan en barcas (`boat`), punto de control seco en 100 con chile y escudo, y una cubierta de 22 bloques (156-177) con la fila sobre el suelo libre y dos cofas en la fila 8. `TODO(cultura)`: Lorencillo en Chetumal es ficción; su ataque histórico fue en Campeche (1685). Id estable del mundo: `costa-maya-bacalar`. Los ids `6-1` a `6-6` están reservados y no se reutilizan.

La dificultad sube de forma gradual: cada nivel presenta una mecánica en un espacio seguro y la combina después.

| Id | Estación | Tema | Qué enseña o pide | Enemigos | Riesgo de frustración |
|---|---|---|---|---|---|
| 6-1 | Tulum | `cliff` | Térmicas (`wind` con vy < 0) y ráfagas horizontales ≤ 2 bloques/s; ascenso por terrazas (filas 10 → 3) | cangrejo azul, nauyaca, erizo | Medio |
| 6-2 | Tulum Aeropuerto | `jungleTrain` | `autoScroll` de 3 bloques/s; techos de vagón con enganches de 2-3 bloques y cajas de 1-2 bloques | saraguato, coatí, murciélago | Medio-alto |
| 6-3 | Felipe Carrillo Puerto | `jungle` + lluvia | Cenotes pequeños: nado o ramas de ceiba; aire siempre en la superficie | alux, xtabay, hormigas | Bajo |
| 6-4 | Limones | `jungleNight` + `darkness` | Oscuridad guiada por luciérnagas fijas junto a cada borde de hoyo y cada enemigo | tarántula, nauyaca, murciélago | Medio |
| 6-5 | Bacalar | `lagoon` | Nado largo y estromatolitos vivos en el lecho: se esquivan nadando por encima | barracuda, morena, erizo, coatí | Medio |

## Tulum (6-1)

La grieta de las columnas 54-63 mide 10 bloques: un salto en carrera con coyote llega a unos 7,5-8 bloques y no cruza. Dentro de la térmica (`vy = -6`) el mismo salto aterriza en la meseta de enfrente. **Alternativa justa:** tres losas escalonadas por el fondo de la grieta (huecos de 1-2 bloques) llevan al mismo sitio sin térmica; fallar el salto cuesta una vida, no el nivel. Las ráfagas horizontales (`-1,5` de cara y `+2` a favor) nunca superan 2 bloques/s. El ascenso opcional de las columnas 141-153 premia con un corazón de jade.

## Tulum Aeropuerto (6-2)

La cámara avanza sola. Quien se rezaga es arrastrado hacia delante; solo muere aplastado si el borde lo empuja contra un bloque, es decir, si se queda quieto ante una caja de ventilación. Las cajas miden 1-2 bloques y están a ≥ 6 bloques del enganche siguiente; no hay bloques a la altura de la cabeza sobre el techo ni encima de ninguna caja (las pasarelas altas están en la fila 6, fuera del arco del salto). Los coatíes patrullan pasarelas: si se salen, caen al techo, nunca a un enganche. El primer aviso de la primera caja llega a los ~10 s del inicio.

## Felipe Carrillo Puerto (6-3)

Neutral y respetuoso. El consejo de Toh habla solo de naturaleza (cenotes y ceiba, árbol sagrado maya). `TODO(cultura)`: Chan Santa Cruz es un tema histórico sensible; cualquier dato histórico debe revisarse con fuentes y voces mayas antes de incluirse. No hay caricaturas de personas.

## Limones (6-4)

La prueba `world6.test.ts` exige una luciérnaga a ≤ 3 bloques de cada borde de hoyo y de cada enemigo (y del punto de control). El foso largo (140-149) tiene losas de piedra bajo su propia luz.

## Bacalar (6-5)

Los estromatolitos (`stromatolite`) son bloques sólidos `E` en el lecho: dañarlos (apoyarse más de 0,25 s) resta 500 puntos, nunca vida. Siempre quedan ≥ 2 bloques de agua sobre su cima y a > 2 bloques de cualquier orilla. Las lagunas (37 y 31 bloques) tienen superficie abierta y burbujas. `TODO(cultura)`: revisar con especialistas el dato sobre los estromatolitos (seres vivos milenarios) y el aviso «¡Cuidado, estromatolito vivo!».

## Chetumal y Lorencillo (6-6)

La cubierta conserva suelo continuo, dos cofas en la fila 8 y el muro en 178. La bahía al atardecer, velas, jarcias, cubierta y casco tienen arte pintado propio; el tren de 6-2 comparte el nuevo atlas de materiales. No cambia ninguna colisión ni ningún id de nivel por el cambio de arte.

Lorencillo tiene ocho PV y dos fases:

| Fase | Vida | Presión y respuesta |
|---|---|---|
| 1 | 8–5 PV | Estocada a 460 px/s, aviso de 0,8 s; dos cañonazos con marcas separadas; trepa al mástil y lanza hasta dos cangrejos desde su altura real. |
| 2 | 4–1 PV | Rugido de transición seguro de 1,4 s; doble estocada a 560 px/s, cada una con 0,65 s de aviso; tres cañonazos y salva durante el mástil; cubierta que avisa antes de arrastrar. |

Solo la espalda expuesta tras la última estocada recibe daño: pisotón o dos impactos de fuego/pelota en la **misma** apertura, un PV como máximo. Ventanas de 2,2/1,9 s. El selector fuerza una estocada después de dos ataques sin apertura. El sable tiene alcance de contacto propio. Los cañones apuntan también a las cofas: permiten refugiarse temporalmente, pero quedarse inmóvil encima no anula el combate. Las marcas quedan fijas al avisar y dejan al menos un bloque entre sus áreas de impacto. Durante apertura y recuperación se pausa la deriva, para permitir el contraataque. La transición limpia peligros; la muerte retira cangrejos y abre la salida.

Ocho acciones nuevas de Lorencillo, más preparación y derrota del atlas anterior, con escala común y anclas sobre las aletas. Ascenso, orden de cañón, lanzamiento y rugido tienen poses propias. Se reutilizan bala y humo de cañón pintados. PNG, prompts completos y atlas: `imagenes/nuevos/`; exportador reproducible: `imagenes/import_world6_art.py`. Recursos de ejecución en `public/assets/`, registrados en `src/data/world6Art.ts` y `lorencilloArt.ts`.

## Pruebas

`world6.test.ts` (datos: luciérnagas, enganches, cajas, cenotes, estromatolitos), `src/engine/World6.test.ts` (recorrido guionizado de 6-2 a la velocidad del `autoScroll` hasta checkpoint y meta; salto con y sin térmica en 6-1; cruce a nado de las dos lagunas de 6-5 sin dañar ningún tramo) y `data/levels/balance.test.ts` (equilibrio de los mundos 1, 2, 3 y 6). Los pilotos automáticos aíslan el recorrido (enemigos desactivados o contacto protegido): no miden dificultad ni puntería.

`bosses/lorencillo/difficulty.test.ts` comprueba doble estocada, avisos, transición, sable, impactos en cofas, separación junto a los bordes y caducidad de impactos de fuego. `data/world6Art.test.ts` valida recortes, anclas, escala, atlas y precarga. `python imagenes/verify_world6.py --sin-servidor` recorre los seis niveles hasta checkpoint y meta; `python imagenes/verify_lorencillo_visuals.py` captura acciones, ambas orientaciones, ambas fases y móvil horizontal/vertical. Requieren Vite en 5197. Evidencia y límites de asistencia en `imagenes/verificacion/mundo6/REVISION.md`.
