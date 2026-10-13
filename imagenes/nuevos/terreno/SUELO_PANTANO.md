# Suelo pintado de pantano y manglar

Arte generado con la herramienta integrada `image_gen` para sustituir los puntos y franjas procedurales del suelo de la captura. Césped verde oliva, raíces, terrones de tierra húmeda y pequeñas piedras, con estilo pintado que acompaña al paisaje.

- [PNG original](suelo-pantano.png), intacto, 1536 × 1024 px, RGB opaco.
- [Prompt completo](suelo-pantano.prompt.txt) y [atlas fuente](suelo-pantano.atlas.json).
- [WebP del juego](../../../public/assets/terreno/suelo-pantano.webp), sin pérdidas y verificado píxel a píxel contra el original.
- [Atlas del juego](../../../public/assets/terreno/suelo-pantano.atlas.json).

El atlas se divide en seis columnas y cuatro filas de 256 × 256 px: seis sprites de superficie y dieciocho de tierra interior. No hay márgenes entre cuadros. Cada sprite ocupa exactamente una baldosa jugable de 40 × 40 px; el dibujo conserva la cuadrícula y sus colisiones.

`MUD_TERRAIN_SPRITES`, en `src/data/terrainSprites.ts`, registra `mudTop` y `mud`. Los temas `swamp` y `mangrove` ya usan esos materiales: El Triunfo (`1-4`), Petenes (`2-4`) y Calkiní (`2-7`) reciben el arte automáticamente. La selección sigue la columna del mundo, nunca la coordenada de pantalla; la tierra continúa desde la superficie de cada montículo y cicla sus filas solo en columnas más profundas. `bakedFrame` cachea cada recorte reducido y `PAINTED_ART` precarga el atlas. El respaldo procedural cubre la carga o un fallo de imagen.

La exportación reproducible usa `python imagenes/import_terrain_art.py RUTA_DEL_PNG_GENERADO`. El importador conserva el PNG, genera el WebP y ambos atlas; rechaza sobreescribir los originales. La herramienta integrada no requiere una clave de API.

Validación: `npm run build` y `npm test`; siete escenas en Chromium con `python imagenes/verify_terrain.py`, opacidad completa, repetición idéntica, dibujo sin mutación, escritorio y móvil. [Vista del suelo implementado](../../verificacion/suelo-pantano/el-triunfo-inicio.png) y [24 sprites a escala](../../verificacion/suelo-pantano/24-sprites-continuos.png).

`python imagenes/verify_world1_water.py` alcanzó checkpoint y bandera en El Triunfo con contacto protegido y colisiones, corrientes y oxígeno activos. `python imagenes/verify_kaiman_visuals.py --label suelo-pantano` completó Calkiní, las tres fases de Kaimán y la salida abierta con contacto protegido y daño asistido únicamente en ventanas válidas. Esta revisión comprueba integración y recorrido; no evalúa dificultad ni puntería.
