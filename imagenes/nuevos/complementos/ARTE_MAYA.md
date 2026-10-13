# Cofres y columnas de Temayin

Cinco sprites generados con la herramienta integrada `image_gen`, con fondo transparente. Los PNG se conservan intactos; el juego usa WebP sin pérdidas y recortes registrados en `src/data/mayaTileSprites.ts`.

| Pieza | Original | Prompt final | Recurso del juego |
|---|---|---|---|
| Cofre de jade con cacao | [cofre-cacao.png](cofre-cacao.png) | [cofre-cacao.prompt.txt](cofre-cacao.prompt.txt) | `public/assets/complementos/cofre-cacao.webp` |
| Cofre vacío | [cofre-vacio.png](cofre-vacio.png) | [cofre-vacio.prompt.txt](cofre-vacio.prompt.txt) | `public/assets/complementos/cofre-vacio.webp` |
| Sillar rompible | [sillar-fragil.png](sillar-fragil.png) | [sillar-fragil.prompt.txt](sillar-fragil.prompt.txt) | `public/assets/complementos/sillar-fragil.webp` |
| Remate con jaguar | [estela-remate.png](estela-remate.png) | [estela-remate.prompt.txt](estela-remate.prompt.txt) | `public/assets/complementos/estela-remate.webp` |
| Cuerpo de columna | [estela-cuerpo.png](estela-cuerpo.png) | [estela-cuerpo.prompt.txt](estela-cuerpo.prompt.txt) | `public/assets/complementos/estela-cuerpo.webp` |

Los cofres y sillares ocupan 40 × 40 px. El remate y cada tramo de columna ocupan 80 × 40 px, divididos en dos mitades contiguas: así se conserva el ancho visible incluso cuando una mitad queda fuera de cámara. Las columnas pueden medir dos, tres, cuatro o más bloques de alto. El cofre vacío conserva su marco, pierde el sello de cacao y apaga la luz. Los relieves son ornamentos de fantasía inspirados en jaguar, piedra y jade; no se presentan como glifos históricos.

El terreno de tierra, césped, caliza, arena, roca, madera y cristal reutiliza el atlas existente `public/assets/complementos/bloques.webp`, con siluetas aisladas y fondo sólido bajo sus esquinas. Datos en `src/data/terrainSprites.ts`. Las texturas de los otros biomas mantienen sus registros.

Verificación: `python imagenes/verify_maya_tiles.py`. Revisa un golpe real desde abajo que entrega cacao, los estados activo y vacío, las uniones de columnas, escritorio y móvil, el recorrido asistido de Palenque hasta el checkpoint y la meta, y escenas de costa y cueva. El recorrido protege el daño de contacto y mantiene la física y los hoyos. Capturas e informe: `imagenes/verificacion/arte-maya/`.
