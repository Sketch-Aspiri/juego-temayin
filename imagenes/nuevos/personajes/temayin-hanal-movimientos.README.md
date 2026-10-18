# Movimientos de Temayin alebrije

Hoja transparente de 16 poses creada con `image_gen` integrado usando el Temayin
alebrije existente como referencia. Prompt completo en
`temayin-hanal-movimientos.prompt.txt`; original sin modificar en
`temayin-hanal-movimientos.png`.

Orden por filas: reposo A/B y carrera A/B; carrera C/D, salto y caída; aterrizaje,
lanzamiento, agarre y balanceo; nado A/B, muerte cómica y victoria.

`python imagenes/import_hanal_motion.py` mide siluetas conectadas sin cortar por
celdas rígidas. Las anclas de pies, manos y centro del nadador y los anchos de
cabeza están calibrados en el importador. Exporta la hoja completa en WebP sin
pérdidas y verifica identidad de píxeles, conservando el alfa original.

Salidas: `public/assets/temporada/hanal-pixan/temayin-movimientos.webp`,
`temayin-movimientos.atlas.json` y `src/data/hanalPixanPlayer.ts`.
La selección de poses vive en `src/engine/render/hanalPlayer.ts`.

`python imagenes/verify_hanal_expansion.py` revisa las 16 poses en ambas
orientaciones; informe y capturas en `imagenes/verificacion/hanal-pixan-ampliado/`.
