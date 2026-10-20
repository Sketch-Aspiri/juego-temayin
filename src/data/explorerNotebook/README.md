# Cuaderno de explorador de Toh

Piloto de nueve páginas: tres en Palenque (`1-1`), tres en San Francisco de Campeche (`2-3`) y tres en Bacalar (`6-5`). Se abre desde título, mapa, pausa y resumen de nuevos descubrimientos al completar un nivel.

## Contenido y fuentes

`index.ts` guarda definiciones inmutables: id estable, nivel, lugar, categoría, título, texto, invitación de Toh y referencias. Cada texto principal tiene menos de 55 palabras. Las categorías reutilizan `FactCategory`; el piloto incluye Naturaleza, Historia y Arquitectura.

Las referencias conservan sección y páginas de la Gran Guía Tren Maya del INAH (2023), utilizada por `stationInfo`. El Palacio incluye la [descripción del INAH](https://www.inah.gob.mx/foto-del-dia/el-palacio-de-palenque-lugar-de-la-elite-maya) y las puertas el [catálogo de Campeche del INAH](https://lugares.inah.gob.mx/es/node/4832?page=%2C%2C%2C1%2C0%2C0%2C0).

Los estromatolitos se explican como estructuras minerales construidas por comunidades de microbios, cuya superficie viva debe cuidarse. Fuente: [Tarjeta de Reporte de laguna Bacalar (2021), sección Estromatolitos, páginas impresas 10–11, página 5 del PDF](https://sedeturqroo.gob.mx/pmts2030/documentos/marco_normativo/TARJETA-DE-REPORTE-DE-LAGUNA-BACALAR-DIGITAL-2021.pdf#page=5). No se atribuye una edad concreta a todos los ejemplares.

Las fotos locales de `STATION_PHOTOS` conservan texto alternativo, autor, procedencia y licencia. La leyenda identifica el entorno y aclara que no representa necesariamente la especie o detalle descrito. La lectura no consulta servicios externos; los enlaces de ampliación requieren conexión. No se añade un modo sin conexión al arranque ni se incluyen grabaciones de audio.

## Marcas y guardado

`['discovery', columna, fila, id]` añade una marca de pluma no sólida, centrada en su bloque. `buildLevel` genera `BuiltLevel.discoveries`; `entities/discoveries.ts` registra el contacto solo durante `play`. No modifica terreno, puntos, cacao, boletos ni estrellas. Una marca registrada permanece con una palomita y no vuelve a avisar.

| Página | Nivel | Columna/fila |
|---|---|---|
| El Palacio de Palenque | 1-1 | 10/11 |
| Los monos saraguatos | 1-1 | 90/11 |
| Las orquídeas de la selva | 1-1 | 130/11 |
| La ciudad amurallada | 2-3 | 25/11 |
| Los baluartes | 2-3 | 111/11 |
| Las puertas de la ciudad | 2-3 | 174/11 |
| Una laguna de agua dulce | 6-5 | 32/11 |
| Los estromatolitos | 6-5 | 60/10 |
| El Fuerte de San Felipe | 6-5 | 154/11 |

`World` limita los ids a marcas del nivel y `Game` los conserva al reaparecer. `HudState.discoveries` publica una copia completa y participa en `hudKey`, sin perder recogidas entre publicaciones. `GameScreen` entrega el progreso inicial y llama a `syncDiscoveries(run, ids)`; el store ignora partidas antiguas e ids ajenos al nivel. Solo escribe si hay páginas nuevas. El aviso tiene cola, se oculta en pausa/resultados y no captura entradas.

`Progress.discoveries` guarda páginas encontradas y `readDiscoveries` las abiertas. `sanitizeNotebook` filtra ids desconocidos, duplicados y lecturas de páginas no encontradas. Los guardados v3 anteriores y v2 migrados comienzan con listas vacías, conservando récords, estrellas, boletos, bolsa y ajustes. Se mantiene `temayin:v3`; no se infieren descubrimientos de victorias históricas. Borrar progreso vacía también la colección.

## Lectura e interacción

El diseño utiliza una textura nueva de pergamino con grecas en jade/terracota, enmarcada por nueve zonas para conservar espacio limpio de lectura. Una ilustración nueva de Toh aparece completa en portada y como retrato en encabezado y consejos; si falla, se recupera su sprite original. Arte generado con `image_gen` integrado, PNG originales, prompts y exportación WebP sin pérdidas en [la guía de arte](../../../imagenes/nuevos/cuaderno-toh/README.md). Es una interpretación de aventura, sin presentar adornos como escritura maya auténtica. Los recursos se registran en `art.ts` y se sirven respetando la ruta base de Vite.

`NotebookButton` monta un diálogo nativo modal compartido. No cambia `Screen` ni desmonta `GameScreen`: cerrar devuelve a pausa/resultados y únicamente Continuar reanuda la simulación. El índice filtra por lugar y categoría, explica combinaciones vacías y oculta el título de las páginas pendientes. Abrir el índice no marca páginas leídas; seleccionarlas sí.

El diálogo tiene nombre accesible, foco contenido con Tab/Mayús+Tab, cierre con Escape y restauración del foco al origen. Las teclas del cuaderno no llegan al juego. En escritorio, índice y lectura se desplazan por separado; en móvil, la selección lleva a la lectura en una columna con cierre siempre visible. Utiliza fuentes locales y no añade animaciones.

## Ampliación y verificación

1. Añade una entrada con id estable y fuentes verificadas. Nunca reutilices ids publicados.
2. Coloca su op en el nivel correspondiente, en una zona accesible que permita observar sin dañar fauna o patrimonio. El nivel debe estar en `PLAYABLE_LEVELS`.
3. Si necesita otra fotografía, usa el catálogo de procedencias y conserva créditos/licencias. Revisa contenido cultural sensible con especialistas o hablantes.
4. Amplía las pruebas de catálogo, recogidas y recorridos; actualiza el número esperado del piloto.

Pruebas en `explorerNotebook.test.ts`, `store/explorerNotebook.test.ts`, `engine/entities/discoveries.test.ts`, `engine/Game.test.ts` y `ui/components/notebook/ExplorerNotebook.test.tsx`: saneamiento, guardados anteriores, publicaciones antiguas, duplicados, muerte, HUD, créditos y aproximación a las nueve marcas con física real.

`python imagenes/verify_explorer_notebook.py` usa un perfil aislado de Chromium. Evidencia regenerable en `imagenes/.temp/cuaderno-explorador/`; `TEMAYIN_QA_URL` cambia el servidor (por defecto 5196). Las recogidas parten de aproximaciones preparadas y no inyectan descubrimientos. `imagenes/explorer_notebook_routes.js` prepara entradas mediante simulaciones de la física en copias del mundo. La protección de contacto conserva colisiones y oxígeno; no mide dificultad humana ni sustituye un móvil físico.
