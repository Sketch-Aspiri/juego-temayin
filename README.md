# Temayin - La Aventura del Jaguar

Juego de plataformas 2D con **React + TypeScript + Canvas**. React gestiona menús, HUD, pausa, progreso y ajustes; un motor de juego independiente (sin dependencias de React) simula y dibuja el nivel en un `<canvas>`.

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción en dist/
npm test           # pruebas (vitest)
```

## Controles

| Acción | Teclado |
|---|---|
| Mover | ← → / A D |
| Saltar | Espacio / ↑ / Z |
| Correr | Shift / X |
| Bola de fuego (con chile) | C / F / J |
| Pausa / Silencio | P o Esc / M |

En móviles aparecen controles táctiles (configurables en Ajustes). **Correr** se activa o desactiva con un toque; no hay que mantenerlo pulsado. Se pueden combinar dirección, salto y fuego con varios dedos y deslizar entre botones sin levantar el dedo. El mando cancela los gestos de zoom para que los saltos rápidos no amplíen la pantalla. Al pausar o salir se liberan los controles.

## Arquitectura

```
src/
  engine/            Motor (TypeScript puro, sin React)
    World.ts         Estado y reglas de un nivel (testeable sin DOM)
    Game.ts          Bucle de tiempo fijo, muertes, fin de nivel
    entities/        jugador, enemigos (registro), objetos, proyectiles
    bosses/          interfaz Boss + registro + Púas
    level/           DSL de niveles y constructor de mapas
    render/          Renderer, texturas, fondos, temas, sprites
  data/              Contenido: niveles y mundos (aquí se añade contenido)
  store/             Zustand: progreso, ajustes, persistencia (localStorage)
  ui/                Pantallas y componentes React
```

El motor publica a React un `HudState` solo cuando cambia, por lo que la interfaz no se re-renderiza en cada fotograma.

## Cómo ampliar el juego

**Nuevo nivel:** crea un `LevelDef` en `src/data/levels/` y añádelo a un mundo en `src/data/worlds.ts`. El selector, el desbloqueo, las estrellas y el guardado funcionan solos. Las operaciones del DSL (`pit`, `row`, `plat`, `coins`, `pipe`, `stairs`, `col`, `wall`, `flag`, `temple`, `spawn`) están documentadas en `engine/level/types.ts`. `npm test` valida que cada nivel sea coherente (hoyos cruzables, enemigos sobre suelo, meta alcanzable...).

**Nuevo mundo:** añade un objeto a `WORLDS`.

**Nuevo enemigo:** añade su id en `engine/types.ts`, su definición en `ENEMIES` (`entities/enemies.ts`) y su dibujo en `render/sprites.ts`.

**Nuevo tema visual:** añade su id en `ThemeId`, su escenario en `render/backgrounds.ts` y regístralo en `render/themes.ts`.

**Nuevo jefe:** implementa la interfaz `Boss` (`bosses/types.ts`), añade su id a `BossId` y regístralo en `bosses/index.ts`.

## Contenido actual

- El suelo de El Triunfo, Petenes y Calkiní incorpora 24 sprites pintados de pasto, raíces y tierra húmeda. Las variantes continúan entre bloques y conservan su posición al avanzar la cámara. [Arte original, atlas y prompt](imagenes/nuevos/terreno/SUELO_PANTANO.md); recurso WebP sin pérdidas en `public/assets/terreno/suelo-pantano.webp`. Verificación de continuidad, escritorio, móvil y orillas: `python imagenes/verify_terrain.py`; capturas en `imagenes/verificacion/suelo-pantano/`.

- Los premios son cofres de jade con un sello de cacao que desaparece al vaciarse; las antiguas tuberías se representan como columnas talladas con remates de jaguar. Los ladrillos rompibles son sillares de piedra agrietada. Cinco sprites transparentes creados con `image_gen`, con atlas y respaldos del mismo estilo; [originales, recursos y prompts](imagenes/nuevos/complementos/ARTE_MAYA.md). El terreno de selva, costa y cueva utiliza los sprites pintados del atlas existente, con recortes aislados. El tutorial de Toh explica los cofres. Revisión en escritorio y móvil, premio real y recorrido de Palenque: `python imagenes/verify_maya_tiles.py`; capturas en `imagenes/verificacion/arte-maya/`.

- Los recortes de Toh, Camazotz, palapas, banderas y Kaimán aíslan sus siluetas para evitar fragmentos de poses vecinas. Temayin tiene 82 px de altura visible tanto en reposo como en carrera y celebración, con los pies anclados al suelo; salto y caída conservan sus poses. Datos en `src/data/playerSprites.ts` y `src/data/tohSprites.ts`. Verificación de sprites e historia, con recorrido de Palenque: `python imagenes/verify_sprite_crops.py`; capturas y mediciones en `imagenes/verificacion/recortes/`.

- El agua termina contra orillas sólidas o continúa en otra zona de agua; nunca acaba junto a espacio vacío. Los bloques del bioma contienen cada poza y los peldaños permiten entrar y salir. El líquido se recorta contra el terreno; las arenas conservan su orilla al abrir la salida. Se mantienen los degradados, reflejos y espuma fina. Las reglas de nado, el oxígeno, los ids y los guardados se conservan. `levels.test.ts` comprueba los límites de toda la campaña y `python imagenes/verify_water_transitions.py` revisa los quince niveles con agua navegable o decorativa en Chromium.

- Las mecánicas actuales tienen sprites pintados: barcos, tortugas, aros, cuerdas, troncos, losas frágiles, cañones, palapas, toldos, resina y sargazo. Temayin muestra poses de agarre, balanceo y lanzamiento; el fuego tiene cuatro cuadros animados. Se crearon siete recursos transparentes para los proyectiles y ondas de los enemigos y jefes, y para los toldos de Cancún. Se conservan las colisiones, el progreso y los respaldos procedurales.

- Las balas de los cañones de Campeche usan hierro pintado con giro y una estela de humo orientada detrás del disparo; el diámetro visible es el de su colisión (22 px). Generadas con la herramienta integrada `image_gen`: `public/assets/proyectiles/bala-canon.webp` y `public/assets/proyectiles/humo-canon.webp`, con atlas JSON. PNG originales y prompts en `imagenes/nuevos/proyectiles/bala-canon.*` y `humo-canon.*`. `python imagenes/verify_cannon_sprites.py` revisa disparos reales en ambas direcciones, escritorio y móvil, y un recorrido asistido de Campeche; capturas en `imagenes/verificacion/canones/`.

- Los cinco jefes jugables tienen retrato, consejo y paleta propios en su anuncio. Sus arenas muestran la guarida rocosa de Púas, el pantano con raíces de Kaimán, el atrio con arcadas amarillas de Huay Chivo, el claro nocturno de Huay Pek y la bahía de Akumal de Capitán Sargazo.
- Los decorados de las arenas usan sprites pintados: arcada de Izamal, guarida de Púas, mangles, ceibas y lianas. Las antorchas de los mundos 3 y 4 usan su sprite con halo de luz; las plataformas de Kaimán y Huay Pek se muestran como troncos sobre sus colisiones existentes.

- Mundo 1 · Selva de Palenque: 1-1 Palenque, 1-2 Boca del Cerro, 1-3 Tenosique, 1-4 El Triunfo, 1-5 Candelaria, 1-6 Escárcega (jefe Púas).
- Mundo 2 · Golfo de Campeche: 2-1 Carrillo Puerto (vagones de tren móviles), 2-2 Edzná (escombro que se derrumba), 2-3 San Francisco de Campeche (baluartes y cañones que disparan), 2-4 Petenes (manglar acuático), 2-5 Tenabo (hacienda, carretas móviles, ruedas de henequén), 2-6 Hecelchakán (ruinas al atardecer, aluxes) y 2-7 Calkiní (Kaimán Moreleti: ocho PV y tres fases; mordida, olas, escupitajo de lodo y emboscada; crecida con troncos a la deriva y caída de propágulos, seguida de frenesí bajo la tormenta).
- Kaimán tiene sprites propios para el escupitajo y el golpe al mangle, lodo y propágulos pintados, avisos distintos por ataque y una indicación sobre el lomo vulnerable. La lluvia conserva el contraste y el cielo se despeja al vencerlo. Recursos generados con `image_gen`: `public/assets/proyectiles/lodo.webp`, `public/assets/proyectiles/propagulo-mangle.webp`, `public/assets/bosses/kaiman-escupitajo.webp` y `public/assets/bosses/kaiman-mangle.webp`; PNG originales, atlas y prompts correspondientes en `imagenes/nuevos/proyectiles/` y `imagenes/nuevos/jefes/`. Revisión en Chromium: `python imagenes/verify_kaiman_visuals.py`, con capturas de la presentación, ocho escenas de ataque y recorrido asistido hasta la meta en `imagenes/verificacion/kaiman/final/`.
- Mundo 3 · Yucatán de las haciendas: 3-1 Maxcanú (grutas iluminadas y estalactitas), 3-2 Mérida (vagonetas Decauville), 3-3 Tixkokob (hamacas trampolín), 3-4 Teya (columpios de henequén y oscuridad) y 3-5 Izamal (jefe Huay Chivo: teletransporte, embestidas y fuegos fatuos; segunda fase nocturna).
- Mundo 4 · Cenotes y Xibalbá: 4-1 Chichén Itzá (pelota de pok ta pok y aros), 4-2 Xibalbá (oscuridad, antorchas y cuevas inundadas), 4-3 Valladolid (cenote, bolsas de aire y ajolotes fantasma), 4-4 Leona Vicario (resina de chicle, Xtabay y lluvia) y 4-5 Nuevo Xcán (Huay Pek: ladridos, desapariciones y segunda fase con oscuridad).
- Mundo 5 · Riviera Maya: 5-1 Cancún (toldos, palapas y dos fosos secos que requieren el tren y la plataforma móvil, sin ruta a nado), 5-2 Puerto Morelos (arrecife submarino, snorkel, corrientes, burbujas, peces león y medusas), 5-3 Playa del Carmen (pasarelas y sargazo quemable), 5-4 Xcaret (cuevas inundadas, bolsas de aire y oscuridad), 5-5 Puerto Aventuras (barcos que se mecen) y 5-6 Akumal (tortugas protegidas y jefe Capitán Sargazo). El jefe pierde tres capas, lanza algas, crea olas saltables y solo recibe golpes con el núcleo expuesto. Puerto Morelos tiene un checkpoint seco y respiraderos separados por un máximo de doce bloques. Los récords publicados de 5-3 conservan su acceso.
- Cinemática de introducción con la historia (`src/data/intro.ts`): se muestra al empezar 1-1 por primera vez y desde el botón «Historia» del título. Temayin tiene seis expresiones ilustradas: alegre, cariñosa, sorprendida, preocupada, decidida y atenta, una para cada escena.
- Nado, oxígeno, corrientes, burbujas y snorkel (niveles acuáticos).
- Enemigos del Mundo 1: saraguato, tarántula, nauyaca, hormigas arrieras, cangrejo azul y barracuda.
- Los siete niveles del Mundo 2 muestran consejos de Toh. La morena pintada sale de grietas en cuatro direcciones, recortada contra la roca; los sprites de morena, vagoneta y Huay Chivo se sirven en WebP.
- El guardado antiguo (`temayin:v2`) se migra automáticamente a `temayin:v3`.
- Estrellas por nivel (completar, no morir + monedas), nivel desbloqueable, mejor puntuación guardada.

El arte fuente está en `imagenes/`; los sprites usados por el juego en `public/assets/`. La versión original en un único `index.html` queda en el historial de git.

La biblioteca de arte incluye 77 imágenes de enemigos, jefes, personajes, paisajes, objetos, complementos, proyectiles y decorados de arenas. Consulta [la galería](imagenes/galeria.html), [el catálogo](imagenes/catalogo.json) y [las instrucciones de arte](imagenes/PLAN_ARTE.md) para revisar los PNG, los prompts y los recortes. `python imagenes/verify_gameplay_sprites.py` comprueba su integración con el servidor Vite en el puerto 5197. Los sprites de Lorencillo y Camazotz ya existen; sus combates y los mundos 6 y 7 siguen pendientes de la hoja de ruta.
