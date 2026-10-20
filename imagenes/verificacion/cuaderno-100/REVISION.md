# Cuaderno de Toh · Colección de 100 páginas

Revisión del 20 de octubre de 2026.

- 100 páginas y 100 marcas únicas: 78 páginas en los 39 niveles de campaña y 22 en los siete secretos. Cada secreto contiene tres páginas; el último contiene cuatro.
- Las 29 páginas publicadas conservan sus ids y ubicaciones. Las nuevas marcas no cambian la geometría, los enemigos, las recompensas ni las reglas de avance.
- 57 fotografías nuevas, con 78 fotografías en total. Cada una tiene archivo local propio, autor, licencia, procedencia y texto alternativo. Las imágenes de referencia identifican su lugar real y evitan atribuirlas al destino del juego. Se revisaron visualmente las 57 incorporaciones y se sustituyeron las que no correspondían al tema o al pie.
- Las 22 páginas del códice tienen esquemas vectoriales de puntos, rayas, conchas y posiciones. Son ejemplos didácticos, no fotografías de piezas arqueológicas.

## Verificación

- `npm run build`: correcto, incluidos tipos y compilación de producción.
- `npm test`: 141 archivos correctos; 2562 pruebas aprobadas, 7 fallos esperados y 85 omitidas. Incluye el catálogo, coherencia de niveles, recogida de las cien marcas, guardados anteriores con 29 páginas, colección completa, lecturas de secretos y dibujo de numerales.
- `python imagenes/verify_notebook_collection.py`: cien recogidas por contacto, cien lecturas persistidas, contador completo, 78 fotografías decodificadas, 22 esquemas visibles, recarga y ausencia de errores de JavaScript.
- Chromium de escritorio a 1366 × 900 y tamaños táctiles emulados de 390 × 844, 320 × 740 y 844 × 390: lectura, imágenes, cierre y ausencia de desbordamiento horizontal.
- Inspección de capturas de fotografías y numerales tanto en escritorio como en móvil. La colección inicialmente bloqueada conserva los títulos ocultos y muestra 0 / 100.

Las recogidas parten de posiciones de aproximación preparadas y accesos habilitados para QA. No se inyectan descubrimientos: se recogen con entradas de movimiento, física y oxígeno activos, y protección de contacto. Esta revisión no mide dificultad humana ni sustituye una prueba en un teléfono físico.

Evidencia regenerable: [`imagenes/.temp/cuaderno-100/`](../../.temp/cuaderno-100/). El comando acepta `TEMAYIN_QA_URL`; por defecto usa el servidor de desarrollo en `http://127.0.0.1:5196`.
