# Arte de Temayin

Biblioteca completada el 10 de octubre de 2026 con el motor integrado `image_gen` y agentes en paralelo, siguiendo el AGENTS.md de Claude. El alcance solicitado es crear arte y poses de animación para las mecánicas.

## Entrega

Abre [galeria.html](galeria.html) para revisar las imágenes y sus recortes. [catalogo.json](catalogo.json) contiene rutas, dimensiones, transparencia, prompts y metadatos. Los PNG fuente están en `nuevos/` y `actualizados/`; los recursos nuevos tienen copias en `public/assets/`.

| Familia | Imágenes |
| --- | ---: |
| Enemigos: cuatro poses por enemigo | 19 |
| Jefes nuevos | 6 |
| Paisajes de los biomas | 18 |
| Toh, Temayina y poses de mecánicas de Temayin | 3 |
| Objetos y mejoras | 1 |
| Mecánicas y efectos | 2 |
| Tren, pirámide, banderas, vegetación, utilería, bloques e historia | 7 |
| Arte existente actualizado | 6 |
| Decorados de arenas (arcada de Izamal y guarida de Púas) | 2 |
| **Total** | **64** |

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

## Verificación

- `python imagenes/build_catalog.py`: reconstruye el catálogo y la galería sin modificar los PNG.
- `python imagenes/validate_catalog.py`: comprueba cobertura, transparencia y recortes visibles dentro de cada imagen.
- `python imagenes/verify_runtime.py`: comprueba la galería, el título y el primer nivel con Chromium. Usa `TEMAYIN_QA_URL` para indicar la dirección del servidor local.
- Resultados y capturas: `verificacion/`.
- `npm test`: 550 pruebas aprobadas en 30 archivos tras integrar los sprites de escenario.
- `npm run build`: compilación aprobada.
