# Arte de Temayin

Biblioteca completada el 10 de octubre de 2026 con el motor integrado `image_gen` y agentes en paralelo, siguiendo el AGENTS.md de Claude. El alcance solicitado es crear arte y poses de animación para las mecánicas.

## Entrega

Abre [galeria.html](galeria.html) para revisar las imágenes y sus recortes. [catalogo.json](catalogo.json) contiene rutas, dimensiones, transparencia, prompts y metadatos. Los PNG fuente están en `nuevos/` y `actualizados/`; los recursos nuevos tienen copias en `public/assets/`.

| Familia | Imágenes |
| --- | ---: |
| Enemigos: cuatro poses por enemigo | 19 |
| Jefes nuevos | 6 |
| Paisajes de los biomas | 18 |
| Toh, Temayina, poses de mecánicas y seis expresiones de Temayin | 9 |
| Objetos y mejoras | 1 |
| Mecánicas y efectos | 2 |
| Tren, pirámide, banderas, vegetación, utilería, bloques e historia | 7 |
| Arte existente actualizado | 6 |
| Decorados de arenas (arcada de Izamal y guarida de Púas) | 2 |
| Proyectiles y ondas (púa, zapote, fuego fatuo, bola de sargazo, ola de agua y onda espectral) | 6 |
| Toldo de Cancún | 1 |
| **Total** | **77** |

Los originales se conservan en `originales/`. Los prompts están junto a cada PNG o en `actualizados/prompts/`. Las variantes descartadas se conservan fuera del catálogo final.

## Uso de los atlas

Las hojas generadas tienen distribuciones irregulares. Usa los rectángulos de sus archivos `.atlas.json`, una escala constante por animación y un ancla adecuada al dibujarlas. Las hojas actualizadas del jugador, coatí, erizo y Púas requieren adaptar sus recortes antes de sustituir las cuadrículas originales del motor.

Los PNG de sprites tienen transparencia real. El color RGB que pueda existir detrás de píxeles de alfa cero no aparece al dibujarlos. Algunos efectos, cuerdas y proyectiles están incluidos en los recortes; ciertos rectángulos se aproximan o solapan por su extensión. Las ruedas y el truck tienen variantes ilustradas de giro, sin representar ángulos exactos. Los fondos son panoramas opacos y no garantizan repetición sin costuras.

El jugador actualizado conserva un halo naranja tenue de baja opacidad. La prueba adicional de limpieza no se promovió porque no mejoró el resultado. Los archivos de cada familia documentan sus observaciones particulares.

Este catálogo entrega los recursos visuales para integrar las mecánicas, enemigos y escenas en el juego.

## Decorados integrados de las arenas

La arcada de tres vanos de Izamal y la guarida rocosa de Púas se generaron con el motor integrado `image_gen`. Los PNG originales, prompts finales y recortes están en `nuevos/escenarios/`; las copias WebP sin pérdidas y atlas se sirven desde `public/assets/escenarios/`. Se conserva la transparencia original.

Las antorchas se toman del atlas `utileria`, las ceibas, lianas y mangles de `vegetacion`, y los troncos de `mecanicas`. `src/data/scenerySprites.ts` define los recortes y anclas; `render/scenerySprites.ts` reutiliza la caché de escalado. La llama de la antorcha coincide con su fuente de luz y lleva un halo que parpadea. Los troncos cubren las cajas sólidas existentes sin alterar las colisiones. El motor mantiene sus respaldos procedurales si un sprite no carga.

`python imagenes/verify_bosses.py` revisa los cuatro anuncios y arenas y completa los combates con protección y fuego asistido en ventanas válidas; no mide dificultad ni puntería.

## Expresiones de la historia

Las seis variantes de Temayin se generaron con `image_gen` integrado tomando `jaguar_titulo.webp` como referencia de identidad. Conservan su ropa verde, medallón, manchas y estilo de ilustración. Cada PNG original tiene su prompt y atlas en `nuevos/personajes/temayin-*.{png,prompt.txt,atlas.json}`; las copias WebP sin pérdidas se sirven desde `public/assets/personajes/`.

`src/data/temayinExpressions.ts` registra los recortes. `intro.ts` usa alegría en Palenque, cariño junto al Sol de Jade, sorpresa al aparecer Camazotz, preocupación durante el secuestro, decisión ante la huida en tren y atención al escuchar a Toh. Las seis imágenes se precargan con `INTRO_FILES`.

`python imagenes/verify_story.py` recorre la historia desde el botón «Historia», verifica las imágenes y el regreso al título, y guarda las seis escenas en escritorio y móvil horizontal en `verificacion/historia/`.

## Verificación

- Los siete sprites incorporados el 11 de octubre de 2026 se generaron con `image_gen` integrado. Los prompts finales y atlas están junto a sus originales en `nuevos/proyectiles/` y `nuevos/complementos/toldo.*`. Las copias de servicio son WebP sin pérdidas. `data/gameplaySprites.ts` y `data/newGameplaySprites.ts` documentan recortes y anclas para las mecánicas actuales; no cambian cajas de colisión ni guardados.
- `python imagenes/verify_gameplay_sprites.py`: revisa las imágenes nuevas y dieciséis escenas preparadas en Chromium, incluidos agarre de cuerda, lanzamiento, centro del aro, losas, cañones, palapas, toldos, zonas lentas, barcos, tortugas y ataques de jefes. Comprueba que el render conserva la simulación. Resultados en `verificacion/sprites-jugables/`; no mide dificultad ni puntería.

- `python imagenes/build_catalog.py`: reconstruye el catálogo y la galería sin modificar los PNG.
- `python imagenes/validate_catalog.py`: comprueba cobertura, transparencia y recortes visibles dentro de cada imagen.
- `python imagenes/verify_runtime.py`: comprueba la galería, el título y el primer nivel con Chromium. Usa `TEMAYIN_QA_URL` para indicar la dirección del servidor local.
- Resultados y capturas: `verificacion/`.
- `npm test`: 689 pruebas en 37 archivos con cobertura de los sprites jugables.
- `npm run build`: compilación aprobada.
