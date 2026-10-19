# AGENTS.md · Temayin - La Aventura del Jaguar

Guía para agentes de IA (y personas) que trabajan en este repositorio. Léela completa antes de tocar código o contenido.
Resume la arquitectura real, las convenciones, la **biblia del juego** (historia, mundos, niveles, enemigos, jefes) y la hoja de ruta.

> Si algo de este documento contradice al código, **el código manda**: corrige el documento en el mismo cambio.

---

## Índice

1. [Propósito y reglas de oro](#1-propósito-y-reglas-de-oro)
2. [Comandos y arquitectura](#2-comandos-y-arquitectura)
3. [Convenciones de código](#3-convenciones-de-código)
4. [Biblia del juego](#4-biblia-del-juego)
5. [Mecánicas nuevas del motor](#5-mecánicas-nuevas-del-motor)
6. [Guía para añadir contenido](#6-guía-para-añadir-contenido)
7. [Migración del contenido actual](#7-migración-del-contenido-actual)
8. [Hoja de ruta por fases](#8-hoja-de-ruta-por-fases)
9. [Respeto cultural](#9-respeto-cultural)
10. [Definición de terminado](#10-definición-de-terminado)

---

## 1. Propósito y reglas de oro

**Temayin - La Aventura del Jaguar** es un juego de plataformas 2D (estilo clásico de desplazamiento lateral) ambientado en la península de Yucatán y en la ruta del **Tren Maya**. El jugador controla a Temayin, un jaguar guardián, que viaja estación por estación para rescatar a Temayina.

### Reglas de oro (no negociables)

1. **Toda la interfaz y el texto del juego van en español** (menús, HUD, carteles, nombres de nivel, mensajes de error visibles, comentarios de código). Los identificadores de código (`EnemyId`, nombres de funciones) pueden ir en inglés o español, pero sé consistente con el archivo que tocas.
2. **El motor (`src/engine/`) es TypeScript puro, sin dependencias de React.** Nada de `import ... from 'react'` dentro de `src/engine/`. El motor debe poder probarse sin DOM (`World` se prueba en `src/engine/World.test.ts`).
3. **React solo se usa para menús, HUD, pausa, progreso y ajustes** (`src/ui/`, `src/store/`). El juego en sí se simula y dibuja en un `<canvas>` desde el motor.
4. **El motor habla con React solo a través de `HudState`** (`src/engine/hud.ts`), que se publica únicamente cuando cambia su `hudKey`. Si añades un dato al HUD, añádelo también a `hudKey` o la interfaz no se enterará.
5. **`npm run build` y `npm test` deben pasar** antes de dar cualquier tarea por terminada.
6. **Todo nivel nuevo debe pasar las pruebas de coherencia** de `src/data/levels.test.ts` (hoyos cruzables, enemigos sobre suelo, meta con suelo, jefe con arena y muro…). Las pruebas recorren `PLAYABLE_LEVELS`: registra cada nivel principal o secreto en `WORLDS.levels` o `WORLDS.bonus`.
7. **El contenido vive en `src/data/`**, no en el motor. El motor define *qué se puede hacer* (DSL, registros); los datos definen *qué hay* en cada nivel.
8. **Nunca romper el progreso guardado** de los jugadores (ver [sección 7](#7-migración-del-contenido-actual)).

---

## 2. Comandos y arquitectura

### Comandos (scripts reales de `package.json`)

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | `tsc --noEmit && vite build` (comprobación de tipos + build de producción en `dist/`) |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run typecheck` | Solo `tsc --noEmit` |
| `npm test` | `vitest run` (todas las pruebas una vez) |
| `npm run test:watch` | Vitest en modo observación |

Pila: React 19, Zustand 5, TypeScript (modo `strict`, `noUnusedLocals`, `noUnusedParameters`), Vite, Vitest.

### Controles

| Acción | Teclado |
|---|---|
| Mover | ← → / A D |
| Saltar | Espacio / ↑ / Z |
| Correr | Shift / X |
| Bola de fuego (con chile) | C / F / J |
| Pausa / Silencio | P o Esc / M |

La tabla muestra las teclas originales. Ajustes permite reasignar movimiento, salto, carrera, fuego/pelota, pausa y silencio; Esc siempre pausa. Los atajos secundarios de una acción se conservan mientras mantenga su tecla original. En móviles hay controles táctiles (`src/ui/components/TouchControls.tsx`): Ajustes permite cambiar tamaño, opacidad y lado del movimiento, con vista previa y restauración de valores originales.

### Árbol de carpetas real

```
temayin_juego/
  index.html
  package.json, tsconfig.json, vite.config.ts
  imagenes/                    Arte fuente (hojas de diseño); NO se sirve
  public/assets/               Sprites usados por el juego (WebP), atlas JSON y familias
                               enemies/, bosses/, personajes/, mecanicas/, proyectiles/, complementos/…
  src/
    main.tsx, App.tsx          Arranque y enrutado de pantallas (según `screen` del store)
    styles.css
    engine/                    MOTOR: TypeScript puro, sin React
      World.ts                 Estado y reglas de un nivel (testeable sin DOM)
      World.test.ts
      Game.ts                  Bucle de tiempo fijo (STEP = 1/120), muertes, fin de nivel
      camera.ts (+ .test)      followCamera, advanceCamera: cámara que solo avanza y `autoScroll` (Mundo 6)
      goal.ts                  Secuencia de meta (bandera, bonus, fuegos artificiales)
      constants.ts             T=40, ROWS=14, GROUND=12, VW=960, VH=560, START_LIVES…
      types.ts                 Rect, Body, EnemyId, BossId, ThemeId, Session
      tiles.ts                 Leyenda de bloques, SOLID_TILES, ITEM_BLOCKS, ItemKind
      physics.ts (+ .test)     moveX / moveY / overlap contra la cuadrícula
      input.ts (+ .test)       Teclado y táctil
      controls.ts (+ .test)    Mapa de teclas, atajos originales y validación sin DOM
      hud.ts                   HudState, BossHud, hudKey
      scoring.ts               Stars, LevelResult, computeStars, coinRatio
      audio.ts, assets.ts      Sonido y carga de imágenes (MANIFEST)
      entities/
        player.ts              createPlayer, updatePlayer, animatePlayer
        enemies/               index.ts (createEnemy, updateEnemies), registry.ts (ENEMIES, isAirborne),
                               types.ts (EnemyDef, EnemyMove), behaviors.ts (walk, fly), <id>.ts por enemigo
        items.ts               createItem, updateItems, collectItem (escudo, vida, chile)
        projectiles.ts         Bolas de fuego del jugador y púas del jefe
        ball.ts, hoops.ts      Pelota de pok ta pok (rebotes, golpes) y aros del juego de pelota (op `hoop`)
        cannons.ts             Cañones de baluarte que avisan y disparan balas rectas (op `cannon`)
        wind.ts (+ .test)      Viento y térmicas (op `wind`): deriva del jugador que no nada
        stromatolites.ts (+ .test) Estromatolitos de Bacalar (op `stromatolite`): penalizan puntos al pisarlos
        particles.ts           Partículas y popups
        types.ts               Player, Enemy, Item, Particle, Popup, Fireball, Quill
      bosses/
        types.ts               Interfaz Boss + BossFactory
        index.ts               Registro FACTORIES: Record<BossId, BossFactory> y createBoss
        puas.ts, puasDraw.ts   Púas el puercoespín (máquina de estados + dibujo)
        kaiman/                Kaimán Moreleti: index (estados), attacks (olas), flood (crecida del agua), draw/drawBody, tuning
        lorencillo/            Lorencillo (Mundo 6): index (estados), choose (ataques), hazards (cañonazos, cangrejos), tilt (cubierta), draw/drawHazards, tuning
        arena.ts               Cerrar arena, abrir muro de salida, premio
      level/
        types.ts               DSL: Op, BossConfig, LevelDef, WorldDef
        build.ts               buildLevel(def) -> BuiltLevel (grid, enemies, flagX, templeX, totalCoins, water, currents)
        zones.ts               WaterZone, CurrentZone, waterAt, currentAt
      render/
        Renderer.ts            Dibuja fondo, agua, bloques, entidades, jefe, partículas
        themes.ts              Registro THEMES: Record<ThemeId, ThemeDef>
        backgrounds.ts         Escenarios (Scenery): jungleScenery, beachScenery, caveScenery
        scenery/               Escenarios nuevos, uno por archivo (river.ts, swamp.ts)
        textures.ts            Texturas procedurales (TexId)
        sprites.ts             drawPlayerSprite, drawItemSprite, proyectiles, partículas
        enemies/               drawEnemySprite + registro ENEMY_SPRITES; <id>.ts por enemigo
        drawUtils.ts
        gameplaySprites.ts     Anclas y dibujo de sprites jugables con caché
        playerMechanics.ts     Poses de agarre, balanceo y lanzamiento
        projectileSprites.ts   Fuego animado, púas y frutos
        cannons.ts             Mecha, fogonazo y balas pintadas con estela de humo
        mayaTiles.ts           Cofres, sillares, columnas y terreno pintado
        mayaTextures.ts        Respaldos de piedra, jade y cacao
        levelSprites.ts        Cañones y tramos de losas frágiles
        wind.ts                Rayas de viento y térmicas, dibujadas solo en las zonas visibles
        fireflies.ts           Luciérnagas (op `firefly`): cuadros de `mecanicas/efectos.webp`
        stromatolites.ts       Estromatolitos de Bacalar (cuadro del atlas de mecánicas, con grietas al dañarse)
        trainTextures.ts       Chapa y costado del vagón (`trainRoof`, `trainSide`) del tema `jungleTrain`
        arenas/                Decorados de arena: ship.ts (cubierta de Lorencillo), akumal.ts, atrium.ts
    data/                      CONTENIDO (aquí se añaden niveles y mundos)
      cinematics.ts            Catálogo, desbloqueos por nivel y precarga de cinemáticas
      puasVictory.ts           Cuatro escenas tras completar Escárcega
      cinematics/              Cuatro escenas por victoria: Kaimán, Huay Chivo, Huay Pek, Sargazo, Lorencillo y Camazotz
      world7Art.ts             Nueve poses históricas de Camazotz y arte nuevo del final
      epilogue.ts              Regreso geográfico por Centenario hasta Escárcega
      bossVictoryArt.ts        Diez poses narrativas de jefes, seis de Temayin y fondos de cubierta/tren
      gameplaySprites.ts       Recortes y anclas del arte de mecánicas existente
      newGameplaySprites.ts    Sprites nuevos (proyectiles, poses de Kaimán, ondas y toldo)
      mayaTileSprites.ts       Cinco sprites nuevos de cofres, sillares y columnas
      terrainSprites.ts        Recortes aislados del atlas de terreno existente
      lorencilloArt.ts        Recortes de las seis poses de Lorencillo (`bosses/lorencillo.atlas.json`)
      worlds.ts                WORLDS, ALL_LEVELS, getLevel, nextLevelId
      levels.test.ts           Pruebas de coherencia de TODOS los niveles
      levels/
        helpers.ts             Atajos coati(...), urchin(...), howler(...), bats([x, fila]...), barracudas([x, fila]...), fireflies([x, y]...)
        world1/                1-1-palenque.ts … 1-6-escarcega.ts (un archivo por nivel)
        world2/                2-1-carrillo-puerto.ts … 2-7-calkini.ts (jefe Kaimán)
        world3/                3-1-maxcanu.ts … 3-5-izamal.ts (jefe Huay Chivo)
        world4/                4-1-chichen-itza.ts … 4-5-nuevo-xcan.ts (jefe Huay Pek)
        world5/                5-1-cancun.ts … 5-6-akumal.ts (jefe Capitán Sargazo)
        world6/                6-1-tulum.ts … 6-6-chetumal.ts (jefe Lorencillo); guía en README.md y pruebas en world6.test.ts
        world7/                7-1-xpujil.ts … 7-4-trono.ts (Camazotz), secreto y guía en README.md
    store/                     Zustand + persistencia
      appStore.ts              useAppStore: screen, progress, settings, run, startLevel, finishLevel…
      progress.ts (+ .test)    Progress, LevelRecord, recordCompletion, isUnlocked, sanitizeProgress
      settings.ts              Settings, DEFAULT_SETTINGS, sanitizeSettings
      migrations.ts (+ .test)  V2_TO_V3_LEVEL_IDS, migrateV2Progress
      persistence.ts           loadSaved / save en localStorage (clave 'temayin:v3'; migra 'temayin:v2')
    ui/
      assetsContext.tsx
      screens/                 TitleScreen, LevelSelect, PeninsulaMap, GameScreen, SettingsScreen, IntroScreen, HistoryScreen
      components/              Hud, BossBanner, Overlays, Stars, TouchControls, CinematicPlayer
      components/map/          Carta de la península: MapChart (atlas SVG y estaciones), mapGestures.ts (cámara: arrastre,
                               zoom, pellizco, rueda, teclas; funciones puras), mapPointerSession.ts (máquina de punteros),
                               mapListeners.ts (eventos nativos no pasivos), useMapGestures.ts y useMapViewport.ts (estado y
                               tamaño), MapZoomControls, MapLandscape, StationMarkers, MapItinerary, MapNavigation,
                               MapCurtain, MapAttribution, mapModel.ts (encuadres y descubrimiento de mundos)
      peninsulaMap.css         Estilos de la carta: atlas con touch-action: none, controles de zoom, itinerario y cortina
```

### Flujo de datos

```
data/worlds.ts (WORLDS) ──> store/appStore.ts (startLevel) ──> ui/screens/GameScreen.tsx
                                                                   │ crea
                                                                   v
                                                        engine/Game.ts ── World.ts ── Renderer.ts ──> <canvas>
                                                                   │ publica HudState (solo si cambia hudKey)
                                                                   v
                                                        ui/components/Hud.tsx, BossBanner.tsx
                                         finishLevel(LevelResult) ──> progress ──> persistence (localStorage)
```

---

## 3. Convenciones de código

| Tema | Regla |
|---|---|
| Tipado | TypeScript **estricto** (ya configurado). Prohibido `any`; usa `unknown` + validación en fronteras (localStorage, datos externos). |
| Datos inmutables | Definiciones de contenido (`LevelDef`, `WorldDef`, registros `ENEMIES`, `THEMES`, `FACTORIES`) son `readonly` / `Readonly<Record<…>>`. El store **nunca muta**: devuelve objetos nuevos (ver `recordCompletion`). |
| Excepción del motor | El estado *en caliente* de la simulación (`World`, entidades, partículas) se muta por rendimiento dentro del bucle de 120 Hz. Esa mutabilidad no debe escapar del motor: React solo recibe `HudState` nuevos. |
| Tamaño de archivos | Archivos pequeños y cohesivos: **200–400 líneas** lo normal, **800 como máximo**. Si un jefe crece, sepáralo como Púas (`puas.ts` lógica + `puasDraw.ts` dibujo). |
| Tamaño de funciones | **Menos de 50 líneas.** Anidación máxima de 4 niveles; usa retornos tempranos. |
| Números mágicos | Usa **constantes con nombre** (`FLY_AMPLITUDE`, `BUMP_TIME`, `TWO_STARS_RATIO`…). Las globales van en `engine/constants.ts`; las locales, arriba del módulo. |
| Registros | Cada tipo de contenido se extiende con un registro tipado por id (`Record<EnemyId, …>`, `Record<BossId, …>`, `Record<ThemeId, …>`). Así TypeScript obliga a completar todos los casos. |
| Comentarios | En español, explicando el *porqué*. Documenta las ops nuevas del DSL en el bloque de `engine/level/types.ts`. |
| Depuración | Sin `console.log` en código entregado. (`assets.ts` usa `console.warn` para imágenes que fallan: es intencional.) |
| Errores | Maneja errores explícitamente; nunca confíes en datos de `localStorage` (usa `sanitize*`). |
| Pruebas | Todo comportamiento nuevo lleva pruebas con Vitest (patrón Organizar-Actuar-Comprobar). Lógica del motor: pruebas sobre `World` sin DOM. Store: pruebas puras en `progress.test.ts`. |
| Commits | Commits convencionales en español: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` (p. ej. `feat: añade nivel 1-2 Boca del Cerro`). Un cambio lógico por commit. |

---

## 4. Biblia del juego

### 4.1 Historia: «Temayin y el Eclipse de Camazotz»

> En lo profundo de la selva de **Palenque** vive **Temayin**, un jaguar guardián de las ruinas. Su novia, **Temayina**, custodia el **Sol de Jade**, la joya que cada mañana hace salir el sol sobre la península.
>
> Una noche, **Camazotz**, el señor murciélago de Xibalbá que aparece en el *Popol Vuh*, desciende sobre Palenque y secuestra a Temayina para robar el Sol de Jade y provocar un **eclipse eterno**. Huye por las vías del **Tren Maya** hacia la cima de la gran pirámide de **Calakmul**, antigua capital del reino **Kaan** (el reino de la Serpiente).
>
> Para frenar a quien lo persiga, Camazotz deja un **lugarteniente** custodiando cada tramo del tren. Temayin sube al Tren Maya y viaja **estación por estación**, guiado por **Toh**, el pájaro reloj (el motmot de la leyenda yucateca), que le da pistas y marca los puntos de control.
>
> En la cima de Calakmul, Temayin derrota a Camazotz, libera a Temayina y el Sol de Jade vuelve a brillar. **Epílogo:** la pareja regresa en tren por **Centenario** hasta **Escárcega**, cerrando el circuito de la península.

**Tono:** aventura luminosa y familiar. Los villanos son figuras de leyenda, no amenazas realistas. El humor es amable.

**Estructura narrativa por nivel:**
- Cartel de entrada: nombre de la estación + una línea de Toh (dato real del lugar o pista de mecánica).
- Checkpoint: Toh se posa en una rama y "marca la hora" (sustituye visualmente al punto de control actual, `LevelDef.checkpoint`).
- Fin de mundo: el lugarteniente cae, el tren avanza en el mapa al siguiente tramo.

### 4.2 Personajes

| Rol | Personaje | Descripción | Estado en el código |
|---|---|---|---|
| Protagonista | **Temayin** | Jaguar guardián de Palenque. Corre, salta, pisa enemigos, lanza fuego con el chile. | Existe. Sprite `public/assets/guepardo.webp` (clave `player` en `assets.ts`), poses de nado, cuerda y lanzamiento en `personajes/jugador-mecanicas.webp`. |
| Protagonista (rescatada) | **Temayina** | Jaguar, guardiana del Sol de Jade. Aparece en la intro, en el clímax y en el epílogo. | Intro, cautiverio, rescate y epílogo implementados; reencuentro en `mundo7/reencuentro.webp`. |
| Aliado | **Toh, el pájaro reloj** | Motmot de cola en forma de péndulo. Da pistas, marca checkpoints, narra el mapa. | Sprite `personajes/toh.webp`, intro y checkpoints implementados. |
| Villano | **Camazotz** | Señor murciélago de Xibalbá (Popol Vuh). Jefe final de 3 fases. | **Existe** (`bosses/camazotz/`, `'camazotz'`; nivel `7-4`), quince PV y desenlace de cuatro escenas. |
| Jefe M1 | **Púas el puercoespín** | Embiste, rueda y dispara púas. | **Existe** (`bosses/puas.ts`, `BossId` `'puas'`). |
| Jefe M2 | **Kaimán Moreleti** | Cocodrilo de pantano (*Crocodylus moreletii*). | **Existe** (`bosses/kaiman/`, `BossId` `'kaiman'`; nivel 2-7). |
| Jefe M3 | **Huay Chivo** | Brujo-cabra del folclor yucateco. | **Existe** (`bosses/huayChivo/`, `'huayChivo'`; nivel 3-5). |
| Jefe M4 | **Huay Pek** | Perro espectral de la leyenda. | **Existe** (`bosses/huayPek/`, `'huayPek'`; nivel 4-5). |
| Jefe M5 | **Capitán Sargazo** | Monstruo de sargazo; mensaje ecológico. | **Existe** (`bosses/sargazo/`, `'sargazo'`; nivel 5-6). |
| Jefe M6 | **Lorencillo** | Pirata barracuda inspirado en el pirata histórico que atacó Campeche (1685). | **Existe** (`bosses/lorencillo/`, `BossId` `'lorencillo'`; nivel 6-6). Dos fases, ocho acciones nuevas y revisión en Chromium; recorrido con contacto protegido y pisotones asistidos. |

### 4.3 Mundos y niveles

**Principios:**
- **7 mundos = 7 tramos reales del Tren Maya.** Cada estación o paradero es un nivel.
- **El último nivel de cada mundo es el nivel del jefe** (lleva `boss` en su `LevelDef` y el `id` del jefe en `BossId`).
- Los ids siguen el formato `"<mundo>-<n>"` (`'1-1'`, `'4-3'`…), únicos en toda la campaña.
- Las fuentes difieren en el número de paradas: la lista oficial habla de **34 paradas (20 estaciones + 14 paraderos)** y listas más completas llegan a **38**. **El juego usa la lista amplia (38 paradas)**. Escárcega aparece como cierre del Mundo 1 y como punto de partida del Mundo 2 (se cuenta una sola vez como nivel). A las 38 paradas se suma el nivel final **Trono de Camazotz**, que no es una parada: **39 niveles jugables** en total, más un nivel extra por mundo desbloqueable con el boleto (sección 4.6).

**Leyenda de tipos de nivel:** `jungla`, `acuático` (requiere nado, sección 5.1), `subterráneo` (oscuridad, 5.3), `ciudad`, `hacienda`, `costa`, `ruinas`, `tren` (vagones móviles, 5.4), `jefe`.

**Leyenda de enemigos:** los ids entre `código` ya existen en `EnemyId`; el resto son propuestos (sección 4.5).

#### Mundo 1 · Selva de Palenque (Tramo Palenque–Escárcega)

Tema principal: `jungle` (existe). Paleta verde intensa, ceibas, ruinas cubiertas de vegetación, ríos.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 1-1 | Palenque | Ciudad maya en la selva de Chiapas: Templo de las Inscripciones, Palacio, cascadas | `jungle`, mañana | jungla / ruinas | Tutorial: correr, saltar, bloques `?`, primer chile | `coati`, saraguato |
| 1-2 | Boca del Cerro | Cañón donde el río Usumacinta sale de la sierra | `river` (nuevo), cañón | acuático | Introducción al nado y al oxígeno; corrientes suaves | barracuda joven, `urchin`, cangrejo azul |
| 1-3 | Tenosique | Pueblo ribereño del Usumacinta, puerta de la selva | `jungle`, tarde | jungla | Plataformas sobre lianas; hormigas en fila | `coati`, hormigas arrieras, tarántula |
| 1-4 | El Triunfo | Pantanos y popales de Tabasco | `swamp` (nuevo) | jungla / pantano | Plataformas que se hunden; zonas de agua poco profunda | nauyaca, cangrejo azul, saraguato |
| 1-5 | Candelaria | Río Candelaria y sus rápidos | `river` | acuático | Corrientes fuertes que empujan; troncos flotantes | barracuda joven, `urchin`, nauyaca |
| 1-6 | Escárcega | Cruce ferroviario en la selva de Campeche | `lair` (existe) | jefe | Arena cerrada con `wall` | **Jefe: Púas el puercoespín** (`'puas'`, existe) |

#### Mundo 2 · Golfo de Campeche (Tramo Escárcega–Calkiní)

Temas: `jungle`, `ruins` (nuevo), `fortress` (nuevo), `mangrove` (nuevo). Piedra caliza, murallas coloniales, manglar y golfo.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 2-1 | Carrillo Puerto | Paradero rural en la selva baja campechana | `jungle` | jungla / tren | Primer nivel con vagones de tren móviles; el primero cruza un barranco sin agua: solo se pasa subiendo al vagón | `coati`, saraguato, tarántula, nauyaca |
| 2-2 | Edzná | Zona arqueológica, Edificio de los Cinco Pisos | `ruins` | ruinas | Escaleras de pirámide (`stairs`), plataformas que caen | tarántula, nauyaca, sombras de Xibalbá (menor) |
| 2-3 | San Francisco de Campeche | Ciudad amurallada, baluartes y puertas de Mar y de Tierra | `fortress` | ciudad | Cañones de baluarte como plataformas, muros con troneras | piratas cangrejo, cangrejo azul |
| 2-4 | Petenes | Reserva de la Biosfera Los Petenes: manglares e islas de selva | `mangrove` | acuático | Nado entre raíces de mangle; corrientes de marea | morena, cangrejo azul, `urchin` |
| 2-5 | Tenabo | Pueblo agrícola del Camino Real | `hacienda` | hacienda | Carretas y sacos como plataformas | ruedas de henequén, `coati` |
| 2-6 | Hecelchakán | Pueblo del Camino Real, museo arqueológico | `ruins`, atardecer | ruinas / ciudad | Estelas que se derrumban; primeras cuerdas de henequén | aluxes, tarántula, sombras de Xibalbá |
| 2-7 | Calkiní | Pueblo del Camino Real, límite con Yucatán | `swamp` | jefe | Arena pantanosa con agua poco profunda | **Jefe: Kaimán Moreleti** (`'kaiman'`) |

#### Mundo 3 · Yucatán de las haciendas (Tramo Calkiní–Izamal)

Temas: `cave`, `hacienda` (nuevo), `yellowCity` (nuevo). Henequenales, cascos de hacienda, cuevas y la ciudad amarilla.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 3-1 | Maxcanú | Grutas de Calcehtok, una de las cavernas más grandes de Yucatán | `cave` (existe) | subterráneo | Oscuridad con radio de luz; estalactitas | `bat`, estalactita, escorpión ciego |
| 3-2 | Mérida | Capital yucateca; haciendas henequeneras de los alrededores | `hacienda` | hacienda / ciudad | Desfibradoras con ruedas; vagonetas (truck) sobre rieles Decauville | ruedas de henequén, vagones de truck |
| 3-3 | Tixkokob | Pueblo famoso por sus hamacas | `hacienda` | hacienda | **Hamacas como trampolines** (rebote alto) | aluxes, `coati` |
| 3-4 | Teya | Antigua hacienda junto a Mérida | `hacienda`, noche | hacienda | Cuerdas de henequén para columpiarse | ruedas de henequén, aluxes |
| 3-5 | Izamal | «La ciudad amarilla»: convento de San Antonio y pirámide Kinich Kak Moo | `yellowCity` | jefe | Arena en el atrio con arcos amarillos | **Jefe: Huay Chivo** (`'huayChivo'`) |

#### Mundo 4 · Cenotes y Xibalbá (Tramo Izamal–Nuevo Xcán)

Temas: `ruins`, `cave`, `xibalba` (nuevo), `jungle`. Cenotes azules, inframundo maya, selva chiclera.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 4-1 | Chichén Itzá | El Castillo (Kukulcán) y el Gran Juego de Pelota | `ruins` | ruinas | Aros del juego de pelota como objetivos de la pelota de pok ta pok | tarántula, nauyaca, sombras de Xibalbá |
| 4-2 | Xibalbá | Entrada ficticia al inframundo en el entorno de Chichén Itzá; el mapa no la presenta como estación vigente | `xibalba` | subterráneo + acuático | Oscuridad + nado: cuevas inundadas | sombras de Xibalbá, ajolote fantasma, `bat` |
| 4-3 | Valladolid | Ciudad colonial con el cenote Zací en pleno centro | `cave` | acuático / subterráneo | Descenso al cenote; bolsas de aire | ajolote fantasma, `bat`, `urchin` |
| 4-4 | Leona Vicario | Pueblo chiclero entre chicozapotes | `jungle`, lluvia | jungla | Resina de chicle pegajosa que frena (variante de zona lenta); árboles de chicozapote | saraguato, hormigas arrieras, Xtabay (trampa) |
| 4-5 | Nuevo Xcán | Paradero en el límite Yucatán–Quintana Roo | `jungleNight`, noche | jefe | Arena con niebla y oscuridad parcial | **Jefe: Huay Pek** (`'huayPek'`) |

#### Mundo 5 · Riviera Maya (Tramo Cancún–Akumal)

Temas: `beach` (existe), `reef` (existe), `cave`. Mar caribe turquesa, arrecife, ríos subterráneos.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 5-1 | Cancún | Zona hotelera y laguna Nichupté | `beach` | costa / ciudad | Toldos y palapas como plataformas; vagones del tren | cangrejo azul, `urchin`, piratas cangrejo |
| 5-2 | Puerto Morelos | Arrecife de Puerto Morelos (parte del Sistema Arrecifal Mesoamericano) | `reef` | acuático (submarino) | Nivel casi entero bajo el agua; snorkel de caracol | pez león, medusa, morena |
| 5-3 | Playa del Carmen | Quinta Avenida y playa | `beach` | costa | Plataformas de madera, oleaje; zonas de sargazo | `urchin`, cangrejo azul, `coati` |
| 5-4 | Xcaret | Ríos subterráneos y caletas | `cave` | subterráneo + acuático | Corrientes en ríos subterráneos; oscuridad parcial | ajolote fantasma, `bat`, morena |
| 5-5 | Puerto Aventuras | Marina y caletas | `beach`, atardecer | costa | Barcos que se mecen; muelles | barracuda, piratas cangrejo, medusa |
| 5-6 | Akumal | «Lugar de tortugas»: bahía con tortugas marinas | `reef` | jefe | Arena submarina; las tortugas sirven de plataformas | **Jefe: Capitán Sargazo** (`'sargazo'`) |

#### Mundo 6 · Costa Maya y Bacalar (Tramo Tulum–Chetumal)

Temas (todos existen en `ThemeId`): `cliff`, `lagoon`, `jungle`, `jungleNight`, `jungleTrain` y `bay` (arena de Chetumal). Acantilados, laguna de siete colores, frontera sur.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 6-1 | Tulum | Ciudad amurallada sobre el acantilado frente al Caribe | `cliff` | ruinas / costa | Saltos verticales en el acantilado; térmicas (`wind`) y ráfagas de viento | cangrejo azul, nauyaca, `urchin` |
| 6-2 | Tulum Aeropuerto | Estación moderna en la selva | `jungleTrain`, `autoScroll` 3 bloques/s | tren | Persecución sobre el techo del tren en marcha: la cámara avanza sola y quien se queda quieto ante una caja muere aplastado | saraguato, `coati`, `bat` |
| 6-3 | Felipe Carrillo Puerto | Antigua Chan Santa Cruz, corazón de la zona maya | `jungle`, lluvia | jungla | Cenotes pequeños; árboles de ceiba | aluxes, Xtabay, hormigas arrieras |
| 6-4 | Limones | Paradero en la selva del sur de Quintana Roo | `jungleNight` + `darkness`, noche | jungla | Oscuridad con luciérnagas (`firefly`) como luz y marcas de peligro | tarántula, `bat`, nauyaca |
| 6-5 | Bacalar | Laguna de los siete colores, estromatolitos, canal de los piratas | `lagoon` | acuático | Nado; **estromatolitos frágiles: no se pisan** (pisarlos más de 0,25 s resta 500 puntos; nunca quita vida) | barracuda, morena, `urchin`, `coati` |
| 6-6 | Chetumal | Capital de Quintana Roo, bahía de Chetumal | `bay` | jefe | Barcas (`boat`) en dos canales; arena sobre la cubierta de un barco pirata | **Jefe: Lorencillo** (`'lorencillo'`) |

#### Mundo 7 · Calakmul (Tramo Chetumal–Escárcega)

Temas implementados: `rioBec`, `batCave`, `deepJungle`, `throne` y `calakmulDawn` (amanecer tras la victoria). Cuatro niveles principales, más `7-extra` con boleto.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 7-1 | Xpujil | Ruinas de estilo Río Bec con torres falsas | `rioBec` | ruinas | Torres ornamentales al fondo; camino de columnas, saltos y losas frágiles | tarántula, nauyaca, sombras de Xibalbá |
| 7-2 | Conhuas | Cerca de la «boca de los murciélagos» (Volcán de los Murciélagos), donde millones salen al atardecer | `batCave` | subterráneo | Oleadas de murciélagos; oscuridad | `bat` (enjambres), escorpión ciego, estalactita |
| 7-3 | Calakmul | Reserva de la Biosfera; gran ciudad Kaan en la selva | `deepJungle`, noche | jungla | Selva nocturna con radio de luz; ascenso a la pirámide | todas las sombras de Xibalbá, saraguato, Xtabay |
| 7-4 | Trono de Camazotz | Cima de la gran pirámide de Calakmul (nivel ficticio) | `throne` | jefe final | 3 fases (ver 4.4) | **Jefe final: Camazotz** (`'camazotz'`) → rescate de Temayina |

**Epílogo** (escena, no nivel jugable): el tren regresa por **Centenario** hasta **Escárcega**; la cámara recorre el mapa iluminándose estación por estación. Créditos.

> Nota para agentes: otras paradas reales (p. ej. Nicolás Bravo, Chetumal Aeropuerto, Cancún Aeropuerto) pueden usarse como **niveles extra** del boleto (4.6) sin alterar la numeración principal.

### 4.4 Jefes

Todos implementan la interfaz `Boss` (`src/engine/bosses/types.ts`): `hp`, `maxHp`, `lockCamera`, `hudVisible`, `intro`, `hittable`, `update(world, dt)`, `onFireball(world)`, `draw(ctx, assets, camX)`. El patrón de Púas es la referencia: **máquina de estados** con estados no golpeables, ventana de vulnerabilidad (`dazed`) donde se le puede pisar, y daño por bolas de fuego en `onFireball`.

| Jefe | Arena | Patrones de ataque | Punto débil | Fases | Recompensa |
|---|---|---|---|---|---|
| **Púas** (M1, existe) | Guarida en la selva, muros a ambos lados | Embestida, rodar como bola, lluvia de púas | Pisarlo mientras está mareado; bolas de fuego | 1 (6 PV) | Pasaje al Mundo 2 |
| **Kaimán Moreleti** (M2, existe) | Pantano con agua poco profunda y troncos | Se sumerge y emerge bajo el jugador; coletazo que lanza olas; mordida en carrera; escupe lodo en arco; golpea el mangle y caen propágulos | Lomo expuesto tras emerger (pisotón); fuego cuando abre las fauces (mordida o escupitajo) | 3 (8 PV): a 5 PV el agua sube y flotan troncos a la deriva; a 2 PV frenesí bajo la tormenta | Snorkel de caracol (primer uso libre) + glifo |
| **Huay Chivo** (M3) | Atrio de Izamal con arcos intactos y antorchas reencendibles | Embestida, teletransporte con ojos (señuelo sin ojos en fase 3), pisotón con ondas, fuegos fatuos y cornada corta | Solo `dazed`: pisotón o dos bolas de fuego = 1 PV; máximo uno por ventana | 3 (8 PV): anochece a 5 PV; noche cerrada a 2 PV y doble embestida | Premio de cacao y apertura del siguiente tramo; mejora de cuerda pendiente |
| **Huay Pek** (M4) | Claro en la selva con niebla | Ladra ondas de choque que viajan por el suelo (saltarlas); desaparece en la niebla y reaparece detrás | Ojos brillantes: solo es golpeable cuando están encendidos | 2: la niebla cubre la arena y solo se ve con radio de luz | Pelota de pok ta pok |
| **Capitán Sargazo** (M5) | Bahía de Akumal completamente acuática, sin bloques de refugio | Salvas dirigidas, cortinas con hueco, embestidas, remolinos, lluvia de semillas y enredos de tortugas | Rescatar una tortuga envía un pulso que abre el núcleo: tocarlo nadando o dos impactos de fuego/pelota = 1 PV; máximo uno por ventana | 4 (12 PV), transiciones a 9, 6 y 3 PV; ataques más rápidos y nuevos patrones | Premio y mensaje ecológico; las tortugas nunca reciben daño. Boleto pendiente |
| **Lorencillo** (M6, existe) | Cubierta pintada con jarcias en la bahía de Chetumal (`render/arenas/ship.ts`); muro en 178 | Estocada con sable-aleta y aviso de 0,8/0,65 s; cañonazos en arco con marcas en cubierta o cofas (2/3); trepa al mástil y lanza hasta 2 cangrejos desde su altura real | Espalda expuesta tras la última estocada: pisotón o dos impactos de fuego/pelota en la misma apertura = 1 PV, máximo uno por ventana. La pelota no devuelve balas | 2 (8 PV): a 4 PV, rugido seguro (`rally`), doble estocada con un aviso por carrera, salva durante el mástil y cubierta inclinada | Premio (`rewardBurst`) y apertura del muro de salida |
| **Camazotz** (M7, final, existe) | Arena ficticia en Calakmul bajo el eclipse | Picada, enjambre, viento, fragmentos, rayo y seis ecos | Solo expuesto: pisotón o dos disparos, máximo un PV por ventana | **3**, quince PV; transiciones a diez y cinco | Rescate de Temayina + epílogo |

#### Camazotz, el jefe final (3 fases)

| Fase | Nombre | Arena | Ataques | Cómo dañarlo | Transición |
|---|---|---|---|---|---|
| 1 | **Señor de la Noche** | Plataforma superior ficticia bajo el eclipse | Dos picadas, tres desde 12 PV, con aviso de 0,85 s cada una; enjambres por oleadas y viento con ondas | Tras la picada final se expone durante 2,5 s: pisotón o dos disparos | A diez PV desciende el suelo un bloque hasta la cámara |
| 2 | **Cámara de Xibalbá** | Cámara ficticia oscura con cuatro antorchas; un brasero a la izquierda repone fuego perdido | Fragmentos que caen con marca luminosa; Camazotz permanece iluminado | Encender las cuatro antorchas con proyectiles reales abre una ventana. Se apagan después de cada herida o ventana agotada | A cinco PV se restaura el suelo y se vuelve a la cima con protección durante la transición |
| 3 | **El Eclipse** | Cima con el Sol de Jade y Temayina en su jaula de sombra | Rayo horizontal avisado, bloqueado por pilares sólidos (saltar o refugiarse detrás); seis ecos sucesivos de los lugartenientes | Recoger tres luces y resistir dos ecos por apertura. Pisotón o dos disparos cuando queda expuesto | Al vencerlo, amanecer persistente, premio, muro abierto y meta; luego rescate y epílogo |

Implementado en `src/engine/bosses/camazotz/`: `index.ts` (estados), `attacks.ts` (combos), `phases.ts`, `hazards.ts`, `draw.ts` y `tuning.ts`. `Boss.objective` se publica en `BossHud` y `hudKey`; `Boss.backdrop` permite cambiar el tema de toda la pantalla y conservar el amanecer hasta la bandera. `Boss.floor` ajusta el recorte del decorado durante el descenso. La arena no destruye monumentos reales ni añade una acción de agacharse.

### 4.5 Enemigos por bioma

Estado: **Existe** = id en `EnemyId` y en `ENEMIES`; **Nuevo** = id propuesto. Los comportamientos actuales del motor son: caminar y rebotar en paredes (`flying: false`), o volar ondulando (`flying: true`, `FLY_AMPLITUDE`). Los nuevos comportamientos requieren extender `EnemyDef` (ver sección 6.3).

#### Jungla

| Enemigo | Id propuesto | Estado | Comportamiento | ¿Pisable? |
|---|---|---|---|---|
| Coatí | `coati` | **Existe** | Camina y da la vuelta al chocar | Sí |
| Mono saraguato | `howler` | Nuevo | Se queda en ramas altas y lanza frutos en parábola; grita antes de lanzar | Sí (al bajar) |
| Tarántula | `tarantula` | Nuevo | Baja colgando de un hilo cuando el jugador pasa debajo | Sí |
| Nauyaca | `nauyaca` | Nuevo | Emboscada: oculta en la hierba, se lanza en corto al acercarse el jugador | Solo enroscada (no mientras se yergue o se lanza); el fuego siempre |
| Hormigas arrieras | `ants` | Nuevo | Fila de hormigas que avanza en línea; cada una es pequeña | Sí (una a una) |

#### Agua y costa

| Enemigo | Id propuesto | Estado | Comportamiento | ¿Pisable? |
|---|---|---|---|---|
| Erizo de mar | `urchin` | **Existe** | Camina; púas: no se puede pisar | No |
| Cangrejo azul | `blueCrab` | Nuevo | Camina de lado; levanta pinzas (no pisable mientras las alza) | A ratos |
| Pez león (invasor) | `lionfish` | **Existe** | Nada despacio; espinas venenosas. Derrotarlo da puntos extra; el consejo de entrada de Toh explica que es invasor | No (fuego/pelota) |
| Medusa | `jellyfish` | **Existe** | Sube y baja en vertical bajo el agua | No |
| Barracuda | `barracuda` | Nuevo | Patrulla y embiste en línea recta al ver al jugador | Sí (por arriba) |
| Morena | `moray` | **Existe** | Sale de una grieta (se asoma como aviso, muerde y se esconde); solo el fuego la vence cuando está fuera | No |

#### Subterráneo

| Enemigo | Id propuesto | Estado | Comportamiento | ¿Pisable? |
|---|---|---|---|---|
| Murciélago | `bat` | **Existe** | Vuela ondulando (`flying: true`) | Sí |
| Estalactita | `stalactite` | **Existe** | Cae cuando el jugador pasa debajo; se rompe al tocar el suelo | No |
| Escorpión ciego | `scorpion` | **Existe** | Camina; reacciona a sonidos (salto cercano) acelerando | Sí |
| Ajolote fantasma | `axolotl` | **Existe** (criatura de fantasía) | Translúcido; aparece y desaparece en el agua de cenote | Sí (cuando es visible) |

#### Folclor (tratados como seres de leyenda)

| Enemigo | Id propuesto | Estado | Comportamiento | ¿Pisable? |
|---|---|---|---|---|
| Aluxes | `alux` | **Existe** | Traviesos: roban hasta 5 de cacao al tocarte (no quitan vida, gancho `EnemyDef.onTouch`) y huyen; pisados devuelven el doble | Sí |
| Sombras de Xibalbá | `shade` | **Existe** | Flotan hacia el jugador; fuego y núcleo iluminado de los halos las disuelven | No (solo luz/fuego) |
| Xtabay | `xtabay` | **Existe** | Ceiba encantada fija: atrae a quien queda quieto; moverse o saltar libera; el fuego cierra sus flores | No |

#### Ciudad y hacienda

| Enemigo | Id propuesto | Estado | Comportamiento | ¿Pisable? |
|---|---|---|---|---|
| Piratas cangrejo | `pirateCrab` | **Existe** | Cangrejos con pañuelo pirata; se agachan como aviso y saltan (las monedas falsas aún no) | Sí |
| Rueda de henequén | `wheel` | **Existe** | Avanza dando botes, baja escalones y rebota en las paredes | No (saltarla o fuego) |
| Vagón de truck | `truck` | Nuevo | Vagoneta sobre rieles que avanza en línea; se puede usar como plataforma | No (se monta encima) |

### 4.6 Objetos y power-ups

| Objeto | Efecto | Estado en el código | Implementación |
|---|---|---|---|
| **Granos de cacao** (monedas) | Puntos y moneda para bendiciones | **Existe** (tile `o`, bloque `?`, bolsa persistente) | `Session.coins` contiene el saldo del motor; `Wallet.cacao` lo guarda entre niveles. No se convierte automáticamente en vidas. El HUD muestra «CACAO». |
| **Chile habanero** | Bolas de fuego | **Existe** (bloque `F`, `ItemKind` `'fire'`, `player.fire`) | Renombrar visualmente a «habanero» si se desea; lógica intacta. |
| **Corazón de jade** | Vida extra | **Existe** como bloque `L` → `ItemKind` `'life'` (popup `1UP`) | Cambiar sprite en `drawItemSprite`. |
| Escudo | Absorbe un golpe | **Existe** (bloque `M`, `'shield'`) | Mantener; puede representarse como un escudo de jade o chimalli. |
| **Snorkel de caracol** | Oxígeno infinito temporal bajo el agua | **Existe** | `ItemKind` `'snorkel'`, bloque `S`, `SNORKEL_TIME` = 15 s (solo descuenta bajo el agua). |
| **Pelota de pok ta pok** | Proyectil que rebota en paredes y suelo; activa aros | **Existe** | Bloque `P`, `ItemKind` `'ball'`, `player.ball` (se pierde al morir), `world.balls`, `entities/ball.ts`, dibujo en `render/ball.ts` (cuadro `ball` del atlas de objetos). La tecla de disparo lanza la pelota con **prioridad sobre el chile**: máx. `BALL_MAX_ACTIVE` = 1 en el aire; con ella volando, la tecla lanza fuego. Rebota `BALL_MAX_BOUNCES` = 5 veces (bote desde el suelo ≈ 3,4 bloques: alcanza aros en la fila 8; la fila 7 pide lanzar saltando). Derriba enemigos salvo `shade` (solo luz/fuego) y daña al jefe vulnerable. |
| **Cuerda de henequén** | Gancho / columpio | Nuevo | Depende de 5.6. Puede ser habilidad permanente tras el jefe del M3 en lugar de objeto. |
| **Glifos mayas** (coleccionable) | 3 ocultos por nivel | Nuevo | Ver abajo. |
| **Boleto del Tren Maya** (coleccionable) | 1 oculto por mundo; desbloquea un nivel extra | **Existe** en los siete mundos jugables | Op `ticket`, guardado inmediato y nivel `bonus`. Ver abajo. |

**Glifos integrados con las estrellas.** Hoy `computeStars(coinRatio, deaths)` (`src/engine/scoring.ts`) da 1 estrella por completar y 2–3 según monedas sin morir. Propuesta:
- Añadir `glyphs: number` (0–3) a `LevelResult` y a `LevelRecord` (`store/progress.ts`), conservando el máximo como con `bestScore`.
- Mantener las estrellas actuales y mostrar los glifos aparte en la ficha de nivel; o bien redefinir: ★1 completar, ★2 sin morir + ≥60 % cacao, ★3 los 3 glifos. Elegir una opción y cubrirla con pruebas en `progress.test.ts`.
- `sanitizeProgress` debe aceptar registros antiguos **sin** `glyphs` (valor 0 por defecto); nunca descartarlos.
- Nueva op del DSL `['glyph', x, y]` y tile no sólido (p. ej. `g`) recogido como las monedas sueltas en `World.collectLooseCoins`.

**Boletos y niveles extra (implementados).**
- Op `['ticket', x, y]` (uno por mundo) y campo `tickets: readonly string[]` (ids de mundo) en `Progress`.
- Campo opcional `bonus?: LevelDef` en `WorldDef`. Los niveles extra **no** forman parte de la cadena lineal `ALL_LEVELS` (para no alterar `isUnlocked` ni `nextLevelId`); se desbloquean con `hasTicket(progress, worldId)`. `BONUS_LEVELS` enumera los secretos y `PLAYABLE_LEVELS` reúne campaña y secretos para búsqueda, saneamiento y pruebas de coherencia. `nextLevelId` devuelve `null` para un secreto; al terminar se vuelve al selector sin anunciar el fin de la aventura.

- `entities/tickets.ts` resuelve contacto sin DOM; `render/tickets.ts` reutiliza el cuadro `ticket` de `objetos/objetos.webp` con respaldo procedural. No suma cacao ni cambia estrellas. `HudState.ticket` participa en `hudKey`; `Game` lo conserva al reaparecer.
- `GameScreen` entrega al motor el boleto ya guardado. `syncTicket(run, collected)` deriva el mundo del nivel anfitrión, ignora partidas antiguas y guarda inmediatamente, sin esperar la bandera. Morir, perder todas las vidas, salir y recargar conservan el boleto; borrar progreso lo elimina.
- `sanitizeProgress` acepta v2 migrada y v3 sin `tickets` (lista vacía), filtra ids de mundo desconocidos y duplicados y conserva récords de secretos. `recordCompletion` conserva los boletos. No se renumeran niveles ni se cambia `temayin:v3`.
- El selector oculta el nombre del destino hasta encontrar el boleto y muestra una tarjeta por mundo; los secretos son desvíos de fantasía con cacao y corazones de jade, sin jefe obligatorio.

| Mundo | Boleto escondido (nivel, columna/fila) | Nivel secreto | Mecánica |
|---|---|---|---|
| 1 | Tenosique (`1-3`, 66/1) | `1-extra` · El dosel del jaguar | Ramas y plataformas altas |
| 2 | Edzná (`2-2`, 45/2) | `2-extra` · La cámara de jade | Escombro que se derrumba |
| 3 | Tixkokob (`3-3`, 50/1) | `3-extra` · El patio de las hamacas | Rebotes sobre tejados |
| 4 | Valladolid (`4-3`, 51/4) | `4-extra` · El cenote de luz | Nado, luces y burbujas |
| 5 | Xcaret (`5-4`, 55/3) | `5-extra` · La caleta de las tortugas | Nado y tortugas protegidas |
| 6 | Limones (`6-4`, 72/4) | `6-extra` · El vagón del tesoro | Cajas y saltos sobre el tren |
| 7 | Calakmul (`7-3`, 154/4) | `7-extra` · El santuario del Sol de Jade | Camino alto opcional y santuario con luces |

- Cada secreto vive en su archivo `data/levels/worldN/N-extra-*.ts`, con checkpoint y meta. Los siete mundos tienen boleto y `WorldDef.bonus`.
- Cobertura: `data/bonus.test.ts`, `data/levels.test.ts`, `engine/entities/tickets.test.ts`, `engine/Game.test.ts`, `store/tickets.test.ts` y `ui/screens/LevelSelect.test.tsx`. `python imagenes/verify_tickets.py` revisa seis recogidas desde plataformas/agua preparadas, persistencia tras muerte y recarga, acceso por los botones reales y seis recorridos completos desde inicio a checkpoint y meta con colisiones y oxígeno activos. Los niveles anfitriones se preparan con protección de contacto; no se mide dificultad humana. Capturas e informe en `imagenes/.temp/boletos/`.

### 4.7 Temas visuales (`ThemeId`)

Los temas implementados figuran en `ThemeId` (`src/engine/types.ts`) y en `THEMES` (`src/engine/render/themes.ts`). Además de los escenarios base de `render/backgrounds.ts`, sus variantes viven en `render/scenery/`; `lair` reutiliza la selva con cielo morado y `tint`.

| ThemeId | Estado | Mundos | Cielo / ambiente | Suelo / plataformas | Extras |
|---|---|---|---|---|---|
| `jungle` | **Existe** | 1, 2, 4, 6 | Azul de día | `grass` / `dirt` / `stone` | — |
| `beach` | **Existe** | 5 | Azul claro, sol | `sandTop` / `sand` / `wood`, agua en hoyos | — |
| `lair` | **Existe** | 1 (jefe) | Atardecer morado | Como `jungle` + `tint` | — |
| `cave` | **Existe** | 3, 4, 5 | Oscuro verdoso, sin sol | `rockTop` / `rock` / `crystal`, agua | — |
| `river` | Nuevo | 1 | Cañón con paredes de roca | Roca + arena de río | Agua navegable (5.1), corrientes |
| `swamp` | Nuevo | 1, 2 | Verde grisáceo, bruma | Lodo / madera | Agua poco profunda |
| `ruins` / `ruinsDusk` | **Existe** | 2, 4, 7 | Cielo claro, pirámides al fondo | Piedra caliza tallada | Estucos rojos y glifos de fondo |
| `fortress` | **Existe** (fosos secos, sin `water`) | 2 | Golfo al fondo | Sillar de muralla / madera de barco | Baluartes, cañones |
| `mangrove` | **Existe** | 2 | Cielo húmedo | Raíces de mangle | Agua salobre |
| `hacienda` | **Existe** | 2, 3 | Atardecer cálido | Mampostería / tierra roja | Pencas de henequén, chimeneas |
| `yellowCity` | **Existe** | 3 | Azul intenso | Muros amarillos y blancos | Arcos del convento |
| `xibalba` | **Existe** | 4 | Negro y rojo | Roca volcánica / hueso | `LevelDef.darkness`, niebla |
| `jungleNight` | **Existe** | 4 | Selva bajo velo azul | Hierba y piedra | Oscuridad parcial y arena de Huay Pek |
| `reef` | **Existe** | 5 | Bajo el agua (azul profundo) | Coral / arena | Todo el nivel es agua (5.1) |
| `cliff` | **Existe** | 6 | Caribe turquesa | `limestoneTop` / `limestone` / `carved` | Viento (`wind`) |
| `bay` | **Existe** | 6 (jefe 6-6) | Bahía pintada al atardecer | `shipDeck` / `shipHull` / `shipDeck`, agua de bahía | Jarcias pintadas y cubierta en `render/arenas/ship.ts`, con respaldo procedural |
| `jungleTrain` | **Existe** | 6 (6-2) | Selva de día que corre junto al tren | `trainRoof` / `trainSide` / `trainRoof` | `motion` (`TRAIN_SCENERY_SPEED` = 240 en `themes.ts`) y `LevelDef.autoScroll` en el nivel |
| `lagoon` | **Existe** | 6 | Degradado de los 7 azules de Bacalar | `sandTop` / `sand` / `wood`, agua clara | Agua navegable; estromatolitos (op `stromatolite`) |
| `rioBec` | **Existe** | 7 | Xpujil con tres torres ornamentales | Caliza / piedra tallada | Fondo pintado propio |
| `batCave` | **Existe** | 7 | Cueva pintada | Roca | `LevelDef.darkness`, luciérnagas |
| `deepJungle` | **Existe** | 7 | Selva nocturna | Hierba / piedra | Oscuridad y luces |
| `throne` | **Existe** | 7 | Eclipse (sol negro con corona) | Caliza / piedra tallada | Arena ficticia con pilares |
| `calakmulDawn` | **Existe** | 7, victoria | Amanecer sobre la selva | Caliza / piedra tallada | `Boss.backdrop` conserva el tema hasta la meta |

---

## 5. Mecánicas nuevas del motor

Principio general: **cada mecánica en su propio módulo del motor**, expuesta al nivel mediante **ops nuevas del DSL** (documentadas en el comentario de `engine/level/types.ts`), traducidas por `buildLevel` a la cuadrícula o a una lista de zonas/objetos en `BuiltLevel`, y actualizadas desde `World.update`. Nada de esto toca React salvo lo que se publique en `HudState`.

### 5.1 Nado y oxígeno

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/entities/swim.ts` (física de nado), llamada desde `updatePlayer` en `entities/player.ts` cuando el jugador está en agua. |
| DSL | `['water', x0, x1, superficie]`: agua desde la fila `superficie` hasta el fondo en las columnas `x0..x1`. Alternativa: `LevelDef.water?: { surface: number }` para niveles enteramente submarinos (`reef`). |
| Datos | `BuiltLevel.water: readonly WaterZone[]` o un tile no sólido `~` en la cuadrícula (añadir a la leyenda de `tiles.ts`, sin meterlo en `SOLID_TILES`). |
| Física | Gravedad reducida, velocidad terminal baja, "saltar" = brazada hacia arriba. Constantes con nombre (`SWIM_GRAVITY`, `SWIM_STROKE`, `MAX_SINK_SPEED`). |
| Oxígeno | `Player.oxygen` (segundos) y `OXYGEN_MAX` en `constants.ts`. Se recarga en la superficie o en burbujas (`['bubbles', x, y]`). Al llegar a 0 → `world.die()`. El snorkel (`ItemKind 'snorkel'`) congela el consumo durante N segundos. |
| HUD | `HudState.oxygen: number | null` (null fuera del agua) + incluirlo en `hudKey` (redondeado para no publicar cada fotograma) + barra en `ui/components/Hud.tsx`. |
| Render | `Renderer.drawWater` ya pinta agua en hoyos para temas con `water`; ampliarlo para zonas de agua con superficie variable. |
| Pruebas | `World.test.ts`: el jugador se hunde más lento en agua; muere al agotar oxígeno; el snorkel detiene el contador. **`levels.test.ts`**: los hoyos cubiertos de agua navegable no deben contar como "hoyo imposible" (ajustar la regla). |

**Estado: implementado** (`entities/swim.ts`, `render/water.ts`, op `['bubbles', x, y]`). Valores en `constants.ts` (T = 40 px):

| Constante | Valor | Para diseñar niveles |
|---|---|---|
| `OXYGEN_MAX` | 10 s | Tramos sin aire ≤ 15 bloques, o añadir `bubbles`. Recarga completa en ~1,7 s. |
| `SWIM_MAX_SPEED` | 180 px/s | 4,5 bloques/s: una corriente > 4 bloques/s no se puede remontar. |
| `SWIM_STROKE` | 320 px/s | ~2 bloques por brazada; ~3 brazadas desde 5 filas de profundidad. |
| `SWIM_EXIT_JUMP` | 760 px/s | Orillas a 1 bloque sobre la superficie (máximo seguro 2). |
| `MAX_SINK_SPEED` / `SWIM_GRAVITY` | 120 px/s / 600 px/s² | |

El fondo del nivel actúa como suelo mientras se nada: un hoyo lleno de agua no mata. Solo se respira con la cabeza fuera del agua en aire libre (bajo una cornisa a ras de superficie no).

### 5.2 Corrientes

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/level/zones.ts` (tipos y consulta `zoneAt(x, y)`), aplicadas en `swim.ts`/`player.ts`. |
| DSL | `['current', x0, x1, y0, y1, vx, vy]` (velocidades en bloques/s). |
| Efecto | Suma `vx, vy` al movimiento del jugador (y opcionalmente de enemigos e ítems) dentro de la zona. |
| Render | Partículas tipo `'dust'` o una nueva `'bubble'` (añadir a `ParticleKind`) que fluyen en la dirección de la corriente. |
| Pruebas | Un jugador quieto dentro de la zona se desplaza en la dirección de la corriente. |

### 5.3 Oscuridad con radio de luz

| Aspecto | Detalle |
|---|---|
| Dónde | Campo `dark?: { radius: number; alpha: number }` en `ThemeDef` (`render/themes.ts`), u override por nivel `LevelDef.darkness?`. Dibujo en `src/engine/render/lighting.ts`. |
| Render | Tras dibujar entidades en `Renderer`, pintar una capa negra con agujeros radiales (canvas fuera de pantalla + `globalCompositeOperation = 'destination-out'`) alrededor de: jugador, bolas de fuego, antorchas, cristales (`platform: 'crystal'`), luciérnagas. |
| Lógica | Solo visual; no afecta a la simulación salvo para enemigos que dependen de luz (`shade` se disuelve dentro del radio). Exponer `world.lightSources()` como función pura para poder probarla. |
| Rendimiento | Reutilizar el canvas de la máscara; no crear gradientes nuevos en cada fotograma si no cambian. |

### 5.4 Vagones / plataformas de tren móviles

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/entities/platforms.ts` (`MovingPlatform`, `createPlatform`, `updatePlatforms`). Nuevo array `world.platforms`. |
| DSL | `['train', x, y, vagones, velocidad, recorrido]` (vagones de tren) y `['mover', x, y, largo, dx, dy, periodo]` (genérica). |
| Colisión | `physics.ts` trabaja contra la cuadrícula (`SolidFn`). Las plataformas móviles se resuelven en un **paso aparte** después de `updatePlayer`: si el jugador cae sobre la parte superior, se le apoya (`onGround = true`) y se le arrastra con el desplazamiento de la plataforma. |
| Cámara | Resuelta con `LevelDef.autoScroll` (sección 5.12). `camX` sigue sin retroceder. |
| Pruebas | El jugador sobre un vagón se desplaza con él; no atraviesa el vagón desde arriba. Ajustar `levels.test.ts` para considerar las plataformas móviles al validar hoyos anchos. |

**Estado: implementado** (`entities/platforms.ts`, `render/platforms.ts`, pruebas en `entities/platforms.test.ts`). Plataformas de un solo sentido: se atraviesan desde abajo y por los lados (no hay que meter un vagón donde el jugador camina, mejor empezarlo sobre el hoyo). Vagón = `CAR_TILES` (5) bloques × 2 de alto; el tren para `TRAIN_STOP_TIME` (1,2 s) en cada extremo; el tiempo de cada plataforma corre desde que se acerca a la cámara. Como la cámara no retrocede, conviene que los recorridos hacia la izquierda sean ≤ 8 bloques. `levels.test.ts` acepta un hoyo ancho sin bloques si el recorrido (`platformReach`) de las plataformas deja tramos sin cubrir ≤ `MAX_PLAIN_PIT`.

### 5.5 Zonas de sargazo que frenan

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/level/zones.ts` (mismo sistema que corrientes). |
| DSL | `['sargassum', x0, x1, y]` (franja de algas). También sirve para la resina de chicle de 4-4. |
| Efecto | Multiplicador de velocidad horizontal y de salto (`SARGASSUM_SPEED_FACTOR`, p. ej. 0.5). Las bolas de fuego queman el sargazo (lo eliminan de la zona). |
| Mensaje | Primer contacto: popup/línea de Toh sobre la llegada masiva de sargazo al Caribe. |

### 5.6 Columpio de henequén

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/entities/ropes.ts` (`Rope` con ancla y largo; péndulo). |
| DSL | `['rope', x, y, largo]` (ancla en el bloque `x, y`). |
| Estado del jugador | Nuevo estado `swinging` en `Player` (y anim nueva en `AnimName` si hace falta). Se engancha al tocar la cuerda en el aire; izquierda/derecha bombean; saltar suelta conservando la velocidad tangencial. |
| Pruebas | Soltar en el punto más bajo da velocidad horizontal; el jugador no queda enganchado tras soltar. |

### 5.7 Mapa de la península como selector de niveles

| Aspecto | Detalle |
|---|---|
| Dónde | UI de React: `src/ui/screens/PeninsulaMap.tsx` (+ componentes en `src/ui/components/map/`), montado por `LevelSelect.tsx`. Estilos en `src/ui/peninsulaMap.css`. |
| Datos | `src/data/stations.ts`: registro inmutable de latitud, longitud, nombre y tipo de destino por id; `projectPosition` calcula coordenadas normalizadas (0..1). **No** meter coordenadas en `LevelDef` (es un dato de UI). Prueba: todo id de `ALL_LEVELS` tiene estación. |
| Dibujo | SVG simplificado de la península (Chiapas/Tabasco, Campeche, Yucatán, Quintana Roo) con la vía; estaciones como botones accesibles (`<button>` con `aria-label`). |
| Tren | El tren se coloca en la última estación desbloqueada (`isUnlocked`). Las transiciones de posición respetan `prefers-reduced-motion`; al volver desde una partida el selector se monta directamente en el nuevo destino. |
| Store | Añadir `'map'` a `Screen` en `appStore.ts` o reutilizar `'levels'`. La lógica de desbloqueo sigue en `store/progress.ts`. |

**Estado: implementado.** `LevelSelect.tsx` monta `PeninsulaMap.tsx`: carta SVG con costa y fronteras reales de Natural Earth 1:10m, proyección equirectangular a 20° N y norte arriba. `data/peninsulaGeography.ts` se regenera con `python imagenes/import_peninsula_map.py`. Las estaciones utilizan coordenadas WGS84 de OpenStreetMap; Teya, Petenes y destinos turísticos conservan su referencia local, y Xibalbá se identifica como escenario ficticio. Fuentes y precisiones en `src/data/MAPA.md`.

- Puntos iluminados para niveles disponibles, apagados para bloqueados y marcas de completado. Las guías de rótulo separan destinos cercanos sin mover su ancla geográfica. El itinerario lateral permite seleccionar todos los puntos con teclado o toque y solo inicia niveles disponibles.
- Los mundos sin ninguna estación disponible quedan cubiertos por nubes; completar el jefe anterior despeja el siguiente. Récords migrados y boletos descubren su propio mundo sin abrir los intermedios. Chetumal abre Xpujil y despeja el Mundo 7; la campaña completa tiene 39 destinos.
- Vista general, acercamiento por tramo, siete pestañas de mundo, bolsa de cacao, estrellas, secretos con boleto y especial Hanal Pixán. La línea muestra el orden de la aventura, no el trazado ferroviario. Sin cambios al esquema de guardado ni a los ids.
- El mapa ocupa todo el visor, con controles flotantes e itinerario desplegable. `fitMapView` adapta la cámara a escritorio, teléfono y panel lateral sin deformar las posiciones. Letras, números de estación, estrellas y cacao tienen tamaños ampliados. Chichén Itzá se identifica como zona arqueológica real; solo Xibalbá es un escenario de fantasía.
- `MapCurtain.tsx` cubre todo el visor con dos bancos de nubes: entrada de 1,5 s y cierre de 0,9 s antes de volver al título o iniciar un nivel. Las duraciones se comparten con CSS y la interfaz permanece `inert` durante la transición. `prefers-reduced-motion` oculta la cortina y cambia de pantalla inmediatamente.
- **Pan y zoom.** La cámara parte del encuadre de `fitMapView` (`data-map-camera="encuadre"`) y pasa a `libre` con el primer gesto. `mapGestures.ts` contiene las operaciones puras; `mapPointerSession.ts` decide si un puntero es toque, arrastre o pellizco; `mapListeners.ts` registra los eventos nativos no pasivos del atlas y `useMapGestures.ts` publica la cámara como máximo una vez por fotograma.
  - **Arrastre** con ratón o tacto. Hasta `TAP_SLOP_PX` (8 px) el gesto sigue siendo un toque; al superarlo se aplica todo el desplazamiento desde el origen. El clic que sigue a un arrastre o pellizco se suprime (ventana de 50 ms) para no seleccionar la estación bajo el dedo.
  - **Rueda** (`WHEEL_ZOOM_RATE` = 0,002; paso acotado entre 1/`WHEEL_MAX_STEP` y `WHEEL_MAX_STEP` = 2; líneas y páginas se convierten a píxeles). Con Ctrl, el pellizco de trackpad se amplifica (`CTRL_WHEEL_BOOST` = 10).
  - **Pellizco** de dos dedos: la razón de distancias es el zoom y el punto medio arrastra la vista. Al levantar un dedo, el otro sigue arrastrando sin salto.
  - Rueda y pellizco hacen zoom **centrado en el punto del gesto**. Los botones y el teclado lo centran en la parte visible del mapa, descontando el panel lateral (`zoomAnchor`).
  - **Botones** (`MapZoomControls.tsx`): Acercar (+, paso `BUTTON_ZOOM_STEP` = 1,5), Alejar (−) y Reencuadrar (⟲). Son hermanos del atlas, no hijos, para que pulsarlos no inicie un arrastre. Usan `aria-disabled` en lugar de `disabled` para conservar el foco en los topes; sus `title` son «Acercar», «Alejar» y «Volver al encuadre». Reencuadrar solo se habilita con cámara libre. Conviven con el conmutador «+ Acercar al tramo» / «− Ver península» de la barra superior, que cambia la vista y no hace zoom. Con el itinerario abierto en pantallas de 600 px o menos (`panelCoversZoom`), los botones no se montan.
  - **Teclado** con el foco en el atlas (no en una estación ni en un botón): flechas desplazan 80 px (`KEY_PAN_STEP_PX`), + y = acercan, − y _ alejan, 0 reencuadra. Las combinaciones con Alt, Ctrl o Meta se ignoran. La ayuda de teclas solo aparece con el foco.
  - **Límites** (`zoomLimits`, `clampCamera`): el acercamiento llega a `MAX_ZOOM_IN` = 8 veces el encuadre de la península completa, también en vista de tramo; el alejamiento llega a `MAX_ZOOM_OUT` = 1,25 veces el encuadre más holgado (con el panel abierto). El centro no sale de la caja de la península, incluso tras arrastres extremos. Al cambiar el tamaño de la ventana la cámara libre se vuelve a acotar.
  - **Reencuadre**: cambiar de pestaña de mundo, de vista o pulsar 0 descarta la cámara libre y vuelve al encuadre base (`frameKey`). Tocar una estación o abrir el itinerario no reencuadra.
  - **Estilo**: `.atlas` tiene `touch-action: none` (el navegador no hace scroll ni zoom sobre la carta); el itinerario mantiene `pan-y`.
- Pruebas: `data/stations.test.ts`, `ui/components/map/mapModel.test.ts` (encuadres y descubrimiento), `mapGestures.test.ts` (conversiones, topes, zoom en ancla, pellizco, rueda, teclas), `mapPointerSession.test.ts` (umbral de toque, supresión de clic, pellizco), `MapChart.test.tsx` (región enfocable, instrucciones, panel que tapa los controles), `MapZoomControls.test.tsx` (`aria-disabled`, títulos) y `ui/screens/LevelSelect.test.tsx`. `mapListeners.ts` y `useMapGestures.ts` no tienen prueba unitaria propia: los cubre el verificador.
- Revisión: `python imagenes/verify_peninsula_map.py` revisa progreso inicial, fin de Mundo 1, récord migrado, campaña descubierta, siete secretos, zoom, escritorio y móvil. `python imagenes/verify_map_gestures.py` revisa en Chromium el arrastre frente al clic, la rueda, los botones y su estado, los topes, el teclado, el reencuadre y, en un contexto móvil con CDP táctil, el arrastre y el pellizco. Ambos preparan perfiles de QA sin modificar las reglas del juego. Capturas e informes en `imagenes/verificacion/mapa-peninsula/` (gestos en `gestos/`). La verificación es en Chromium emulado: **no se ha probado en un móvil físico y no se ha medido rendimiento**.

### 5.8 Encuentros con Ek Chuah y bolsa de cacao

- `LevelDef.offering?: OfferingConfig` activa el encuentro previo al nivel. `data/offerings.ts` contiene deidad, diálogos, precios y catálogo de bendiciones: fuego (30), escudo (20) y vida (50). Hay 18 encuentros, de dos a tres por mundo: M1 (`1-3`, `1-5`, `1-6`), M2 (`2-3`, `2-5`, `2-7`), M3 (`3-3`, `3-5`), M4 (`4-2`, `4-5`), M5 (`5-2`, `5-4`, `5-6`), M6 (`6-2`, `6-4`, `6-6`) y M7 (`7-3`, `7-4`).
- `data/objectSprites.ts` reúne los recortes compartidos del atlas de objetos; `render/props.ts` los usa en el juego y `data/offerings.ts` en la tienda. `ui/components/BlessingCard.tsx` muestra chile, escudo y corazón de jade mediante `SpriteFrame`, con selector de cantidad, precio total y contador de vidas pagadas.
- `OfferingScreen` es una pantalla React de ofertas accesibles por teclado y toque. `OfferingScene` presenta el mundo inmóvil; no llama a `World.update`, por lo que no corren tiempo, enemigos ni oxígeno. `render/offering.ts` dibuja altar, deidad y partículas en el canvas. Ek Chuah tiene la misma altura visible que el sprite de reposo de Temayin y ambos apoyan en el mismo suelo; el altar queda a un lado. El movimiento reducido congela el tiempo visual. Continuar o Escape permite empezar sin comprar; volver al mapa conserva las compras pendientes.
- `store/wallet.ts` define `Wallet = { cacao, pending }`: saldo entero seguro no negativo y bendiciones pagadas por id de nivel. `sanitizeWallet` acepta guardados antiguos sin bolsa, descarta valores inválidos y conserva únicamente ofertas existentes: elimina duplicados de fuego y escudo y mantiene cada vida pagada, sin cambiar el esquema del guardado. Se guarda junto a progreso y ajustes bajo la misma clave `temayin:v3`; v2 sigue migrándose y conserva su clave original.
- `buyBlessing` valida pantalla, oferta, fondos y existencias, descuenta y guarda atómicamente la bendición pendiente. Fuego y escudo admiten una unidad por encuentro. Las vidas se pueden comprar repetidamente o en lotes de 1 a `MAX_BLESSING_QUANTITY` (99), limitados por el cacao disponible; cada lote se cobra y guarda completo. `continueOffering` consume las pendientes del nivel y entrega `Run.initialBlessings`; las de otros niveles se conservan. Cerrar el juego durante el encuentro no pierde lo pagado. Tras continuar, las bendiciones ya están consumidas: recargar la partida no las devuelve.
- `Game` aplica `applyBlessings` una sola vez al mundo inicial. Fuego y escudo siguen las reglas de daño existentes; morir crea un jugador sin esas bendiciones. Cada vida extra pagada se suma a la sesión y se arrastra al continuar. Reaparecer en un checkpoint no abre la tienda; reiniciar desde el menú sí abre un encuentro nuevo.
- `GameScreen` entrega una copia de `Run.session` al motor. `HudState.coins` (ya incluido en `hudKey`) sincroniza el saldo mediante `syncCacao`, que ignora publicaciones de partidas antiguas y no sustituye `Run`. `Game.stop` publica el último HUD. Cada cambio de saldo se guarda, incluidos premios de jefes y robos/devoluciones de aluxes. Morir, perder todas las vidas o volver al mapa conserva el saldo. Rejugar permite reunir más cacao. `coinsCollected` sigue siendo local al mundo para calcular estrellas; compras y saldo anterior no lo inflan.
- El selector muestra la bolsa, todos los textos visibles usan «cacao» y borrar progreso vacía saldo y pendientes. Un guardado anterior comienza con cero cacao porque no registraba saldos históricos.
- La representación de Ek Chuah y el intercambio de poderes son ficción de la aventura. Su relación con cacao y comerciantes se documenta en el [boletín del INAH](https://www.inah.gob.mx/images/boletines/2024/753/Boletin%20753.pdf). El sprite final usa el estilo de caricatura de Temayin y Toh: `public/assets/personajes/ek-chuah-caricatura.webp`; PNG y prompt de `image_gen` en `imagenes/nuevos/personajes/ek-chuah-caricatura.*`.
- `node imagenes/verify_offering_products.mjs` revisa los 16 encuentros, sprites, compra de varias vidas, recarga, entrega al motor y controles táctiles en Chromium. Capturas e informe en `imagenes/.temp/ofrendas-productos/`. Admite `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para usar un Chromium instalado y `TEMAYIN_QA_URL` para cambiar el servidor.
- Cobertura: `store/wallet.test.ts`, `store/offerings.test.ts`, `engine/blessings.test.ts`, `engine/Game.test.ts`, `engine/render/offering.test.ts` y `ui/screens/OfferingScreen.test.tsx`. `python imagenes/verify_offerings.py` revisa compras, doble clic, fondos insuficientes, recarga, poderes, checkpoint, fin de partida, resultados, los encuentros originales, igualdad de altura visible, rotación y controles táctiles en Chromium. `verify_offering_routes.py` reutiliza los controladores de recorridos existentes con contacto protegido y daño al jefe asistido en ventanas válidas; en Tenosique prepara las posiciones de salida de los saltos y en Kaimán mantiene al jugador sobre un tronco durante el combate. Colisiones, oxígeno, checkpoint y meta siguen activos. Capturas e informes en `imagenes/verificacion/ofrendas/`; no evalúan dificultad ni puntería.

---

### 5.9 Viento y térmicas (Mundo 6)

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/entities/wind.ts` (`windDrift`, llamada desde `entities/player.ts`); dibujo en `src/engine/render/wind.ts`. Zonas en `BuiltLevel.winds`. |
| DSL | `['wind', x0, x1, y0, y1, vx, vy]`: rectángulo de bloques (inclusive); `vx`, `vy` en bloques/s. |
| Efecto | Desplaza solo al jugador que no nada. `vx` actúa siempre; `vy` solo en el aire, así una térmica con `vy < 0` alarga el salto y no despega a quien está en el suelo. |
| Límites | \|vx\| ≤ `WIND_MAX_VX` (3 bloques/s, `constants.ts`). Las ráfagas de 6-1 no superan 2 bloques/s. |
| Pruebas | `entities/wind.test.ts`; `src/engine/World6.test.ts` (salto con y sin térmica en 6-1). |

### 5.10 Luciérnagas (Mundo 6)

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/render/fireflies.ts` (cuadros `firefly1`-`firefly4` de `mecanicas/efectos.webp`); la luz la resuelve `src/engine/render/lighting.ts`. |
| DSL | `['firefly', x, y]` en el bloque `(x, y)`; atajo `fireflies([x, y]...)` en `helpers.ts`. Va a `BuiltLevel.fireflies`. |
| Efecto | Solo alumbran si el nivel tiene `darkness` (radio `FIREFLY_RADIUS` = 70 px). Sin oscuridad son decoración. |
| Pruebas | `data/levels/world6/world6.test.ts`: una luciérnaga a 3 bloques o menos de cada borde de hoyo y de cada enemigo de 6-4. |

### 5.11 Estromatolitos (Mundo 6)

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/entities/stromatolites.ts` (lógica); `src/engine/render/stromatolites.ts` (dibujo). Bloques sólidos `E` en la cuadrícula (`SOLID_TILES`). |
| DSL | `['stromatolite', x, y, largo]`. Va a `BuiltLevel.stromatolites`. |
| Efecto | Apoyarse más de `STROMATOLITE_GRACE` (0,25 s) lo daña una sola vez: −`STROMATOLITE_PENALTY` (500) puntos, sin bajar de 0 y sin quitar vida. Aviso visual y sonoro; el tramo dañado queda con velo. |
| Pruebas | `entities/stromatolites.test.ts`; `src/engine/World6.test.ts` (cruce a nado de 6-5 sin dañar ningún tramo; pisar resta puntos y no vida); `data/levels/world6/world6.test.ts` (siempre hay suelo o lecho debajo). |

### 5.12 Cámara automática (`autoScroll`)

| Aspecto | Detalle |
|---|---|
| Dónde | `src/engine/camera.ts` (`advanceCamera`, `followCamera`). Campo `LevelDef.autoScroll` (bloques/s) en `engine/level/types.ts`. |
| Efecto | La cámara avanza al menos a esa velocidad aunque el jugador se quede atrás, y lo arrastra por el borde izquierdo. Se detiene con la cámara bloqueada por un jefe y en el borde derecho del nivel. Si el arrastre empuja al jugador contra un bloque sólido, muere aplastado. |
| Uso | 6-2 Tulum Aeropuerto, `autoScroll: 3`, con techos de vagón (`render/trainTextures.ts`). |
| Pruebas | `camera.test.ts`; `src/engine/World6.test.ts` (ritmo del `autoScroll`, recorrido con checkpoint y meta, aplastamiento). |

## 6. Guía para añadir contenido

### 6.1 Nuevo nivel

1. Crea `src/data/levels/worldN/<id>-<estación>.ts` (un archivo por nivel, p. ej. `world1/1-2-boca-del-cerro.ts`).
2. Define un `LevelDef` exportado como `LEVEL_N_M`:
   ```ts
   export const LEVEL_1_2: LevelDef = {
     id: '1-2',
     name: 'Boca del Cerro',
     width: 200,          // bloques
     theme: 'jungle',     // ThemeId existente
     time: 300,           // opcional (DEFAULT_LEVEL_TIME = 300)
     checkpoint: 100,     // opcional (por defecto width/2)
     ops: [ /* ... */ ],
   };
   ```
3. Ops reales del DSL (`src/engine/level/types.ts`), coordenadas en bloques, 14 filas (`ROWS`), suelo en la fila 12 (`GROUND`):

   | Op | Forma | Notas |
   |---|---|---|
   | `pit` | `['pit', x0, x1]` | Hoyo sin suelo entre columnas `x0..x1` (inclusive). Más de 6 bloques (`MAX_PLAIN_PIT`) exige plataformas encima. |
   | `row` | `['row', x, y, 'B?BMB']` | Un carácter por bloque; `' '` = vacío. Leyenda en `tiles.ts`: `B` ladrillo, `?` moneda, `M` escudo, `L` vida, `F` chile, `P` pelota de pok ta pok, `X` piedra, `o` moneda suelta. |
   | `plat` | `['plat', x, y, largo]` | Plataforma de piedra (`X`). |
   | `coins` | `['coins', x, y, cantidad]` | Fila de monedas sueltas (`o`). |
   | `pipe` | `['pipe', x, alto]` | Columna tallada de 2 bloques de ancho. Se conserva el nombre histórico del DSL. |
   | `stairs` | `['stairs', x, n, dir]` | `dir` 1 sube, -1 baja. |
   | `col` | `['col', x, alto]` | Columna de piedra. |
   | `wall` | `['wall', x]` | Muro de arriba abajo (cierre de arena de jefe). |
   | `flag` / `temple` | `['flag', x]`, `['temple', x]` | Meta del nivel (la bandera necesita suelo). |
   | `spawn` | `['spawn', enemigo, x, y?]` | `y` por defecto: sobre el suelo. |
   | `water` | `['water', x0, x1, superficie]` | Agua en columnas `x0..x1` desde la fila `superficie` hasta el fondo. No toca la cuadrícula: va a `BuiltLevel.water` (`level/zones.ts`). |
   | `current` | `['current', x0, x1, y0, y1, vx, vy]` | Corriente en el rectángulo de bloques (inclusive); `vx, vy` en bloques/s. Va a `BuiltLevel.currents`. |
   | `train` | `['train', x, y, vagones, velocidad, recorrido]` | Tren con el techo en la fila `y`; va y vuelve `recorrido` bloques (negativo = izquierda) a `velocidad` bloques/s. Va a `BuiltLevel.platforms`. |
   | `mover` | `['mover', x, y, largo, dx, dy, periodo]` | Plataforma de `largo` bloques que oscila hasta (x+dx, y+dy) y vuelve en `periodo` s. Va a `BuiltLevel.platforms`. |
   | `crumble` | `['crumble', x, y, largo]` | Escombro sólido (`D`) que tiembla al pisarlo, cae y reaparece a los 4 s si el hueco está libre (`entities/crumble.ts`). Nunca en la fila del suelo. |
   | `cannon` | `['cannon', x, y, dir]` | Cañón de baluarte de 2 bloques sólidos: culata `K` y boca `>` (dir 1) o `<` (dir -1). Se pisa como plataforma. Con la boca en pantalla dispara (`entities/cannons.ts`): espera 1 s al aparecer, la mecha chispea 0,7 s de aviso y sale una bala recta a 5,5 bloques/s, a la altura de su fila, hasta chocar con un bloque; recarga 2,7 s. La bala se salta o se pisa (rebote, +100); quien está de pie sobre un cañón de la misma fila queda por encima. Va a `BuiltLevel.cannons`. |
   | `hoop` | `['hoop', x, y]` | Aro de piedra del juego de pelota en el bloque (x, y), no sólido (`entities/hoops.ts`). Al pasar la pelota (bloque `P`) por su centro se enciende una vez: +2000 puntos y 5 granos de cacao (incluidos en `totalCoins`). Va a `BuiltLevel.hoops`. |
   | `wind` | `['wind', x0, x1, y0, y1, vx, vy]` | Zona de viento o térmica en el rectángulo de bloques (inclusive), en bloques/s. Solo empuja a quien no nada; `vy` solo actúa en el aire (`entities/wind.ts`). Va a `BuiltLevel.winds`. |
   | `firefly` | `['firefly', x, y]` | Luciérnaga en el bloque (x, y). Solo alumbra si el nivel tiene `darkness` (`render/fireflies.ts`). Va a `BuiltLevel.fireflies`. |
   | `stromatolite` | `['stromatolite', x, y, largo]` | Tramo de estromatolito: bloques sólidos `E` sobre suelo o lecho. Apoyarse más de 0,25 s resta 500 puntos, sin quitar vida (`entities/stromatolites.ts`). Va a `BuiltLevel.stromatolites`. |

   Campo de `LevelDef` (no es op): `autoScroll` (bloques/s) hace avanzar la cámara sola; ver 5.12. Las demás ops de agua, resina, hamacas, cuerdas, antorchas, vagonetas, barcas y tortugas están documentadas en `engine/level/types.ts`.

   Atajos en `src/data/levels/helpers.ts`: `...coati(22, 32)`, `...urchin(26, 58)`, `...bats([20, 7], [48, 6])`, `...fireflies([29, 9])`. Añade un atajo por cada enemigo nuevo.
4. Registra el nivel en el mundo correspondiente de `WORLDS` (`src/data/worlds.ts`). El orden del array define el desbloqueo lineal (`isUnlocked`) y `nextLevelId`.
5. Ejecuta `npm test`: `levels.test.ts` valida cuadrícula, meta con suelo, inicio y checkpoint con suelo, hoyos cruzables, enemigos fuera de bloques y con suelo (salvo voladores), jefe con arena y muro, y que haya monedas (`totalCoins > 0`).
6. Juega el nivel en `npm run dev` de principio a fin.

### 6.2 Nuevo mundo

1. Crea `src/data/levels/worldN/` con un archivo por `LevelDef`.
2. Añade un `WorldDef` a `WORLDS`: `{ id: 'golfo', number: 2, name: 'Golfo de Campeche', levels: [...] }`. El `id` del mundo debe ser estable (se usará para boletos).
3. El último nivel lleva `boss`.
4. Añade sus estaciones a `src/data/stations.ts` cuando exista el mapa (5.7).

### 6.3 Nuevo enemigo

1. Añade el id a `EnemyId` en `src/engine/types.ts`.
2. Crea `src/engine/entities/enemies/<id>.ts` con su `EnemyDef` (`w`, `h`, `stompable`, `flying`, `swimming?`, `speed`, `score`, `move`) y regístralo en `ENEMIES` (`enemies/registry.ts`).
3. `move: EnemyMove` (`(enemy, world, dt) => void`) es su comportamiento: `walk` o `fly` de `enemies/behaviors.ts`, o una función propia en su mismo archivo. **No amplíes el bucle de `updateEnemies` con más `if`**. `Enemy.state` y `Enemy.timer` quedan libres para máquinas de estados propias.
4. Dibújalo en `src/engine/render/enemies/<id>.ts` (`EnemyDrawFn`, coordenadas locales con origen en el centro de la base) y regístralo en `ENEMY_SPRITES` (`render/enemies/index.ts`). Si usa imagen, añádela a `public/assets/`, a la interfaz `Assets` y al `MANIFEST` de `src/engine/assets.ts` (el arte fuente va en `imagenes/`).
5. Añade un atajo en `src/data/levels/helpers.ts`.
6. `levels.test.ts` exige suelo bajo cada enemigo salvo si `isAirborne(id)` (`flying` o `swimming`).
7. Pruebas en `World.test.ts` del comportamiento nuevo.

### 6.4 Nuevo tema visual

1. Añade el id a `ThemeId` (`src/engine/types.ts`).
2. Escribe su `Scenery` en `src/engine/render/backgrounds.ts` (`(c, cam, now) => void`, con parallax a partir de `cam`). Si el archivo crece mucho, crea `render/backgrounds/<tema>.ts`.
3. Si necesita texturas nuevas, añade su `TexId` y su generación en `src/engine/render/textures.ts`.
4. Regístralo en `THEMES` (`src/engine/render/themes.ts`): `sky`, `tint?`, `sun`, `scenery`, `groundTop`, `groundBody`, `platform`, `water?`.
5. Verifícalo visualmente en el navegador con un nivel que lo use.

### 6.5 Nuevo jefe

1. Añade el id a `BossId` (`src/engine/types.ts`).
2. Implementa la interfaz `Boss` (`src/engine/bosses/types.ts`) en `src/engine/bosses/<id>.ts` + `<id>Draw.ts` (o carpeta propia si tiene fases). Usa `puas.ts` como plantilla: estados con nombre, conjunto `NON_HITTABLE`, `intro` para el cartel (`BossBanner.tsx`), `lockCamera` durante la pelea.
3. Regístralo en `FACTORIES` de `src/engine/bosses/index.ts`.
4. En el último `LevelDef` del mundo: `boss: { id: '<id>', x, arena: [a0, a1] }` y `['wall', a1 + 1]` (la prueba exige muro en `a1 + 1`).
5. El HUD muestra su vida a través de `HudState.boss` (`BossHud`): no hace falta tocar React.
6. Pruebas: el jefe recibe daño solo cuando `hittable`; muere al llegar a 0 PV; la cámara se desbloquea al terminar.

### 6.6 Nuevo power-up

1. Añade el tipo a `ItemKind` (`src/engine/tiles.ts`) y un carácter de bloque nuevo a `ITEM_BLOCKS` y a `SOLID_TILES` (y a la leyenda del comentario).
2. Define si se mueve al salir en `createItem` (`still`) y su efecto en `collectItem` (`src/engine/entities/items.ts`).
3. Estado del jugador en `Player` (`entities/types.ts`) si dura en el tiempo; constante con nombre para la duración.
4. Dibujo en `drawItemSprite` (`render/sprites.ts`); textura del bloque en `render/textures.ts` (`FIXED_TEXTURE`).
5. Publica el estado en `HudState` + `hudKey` y muéstralo en `Hud.tsx` (como `shield` y `fire`).
6. Pruebas en `World.test.ts`.

---

## 7. Migración del contenido actual

### 7.1 Reubicación de niveles

| Nivel actual | Nombre actual | Tema | Nuevo id | Nueva estación | Notas |
|---|---|---|---|---|---|
| `1-1` | La Selva | `jungle` | `1-1` | Palenque | Mismo id. Renombrar y añadir ruinas de fondo. |
| `1-3` | La Guarida de Púas | `lair` | `1-6` | Escárcega | Jefe Púas sin cambios. |
| `1-2` | La Playa | `beach` | `5-3` | Playa del Carmen | Mundo 5 · Riviera Maya. |
| `2-1` | El Cenote Escondido | `cave` | `4-3` | Valladolid (cenote Zací) | Mundo 4. |
| `2-2` | Ríos Subterráneos | `cave` | `4-2` | Xibalbá | Mundo 4. Alternativa: `5-4` Xcaret (ríos subterráneos), si se prefiere. |

### 7.2 Cómo se guarda hoy el progreso (hechos del código)

- **Hecho:** la reubicación de 7.1 y la migración de 7.3 ya están aplicadas (clave `'temayin:v3'`, `store/migrations.ts`, `isUnlocked` con récord propio). Lo que sigue describe la v2 como referencia.
- `src/store/persistence.ts` guardaba `{ progress, settings }` en `localStorage` bajo la clave **`'temayin:v2'`**.
- `Progress = { levels: Record<levelId, LevelRecord> }` (`src/store/progress.ts`); `LevelRecord = { bestScore, stars, completions }`.
- `sanitizeProgress` **descarta cualquier id que no exista en `PLAYABLE_LEVELS`** (campaña y secretos). Si se cambia el id de un nivel sin migrar, el récord del jugador se pierde en silencio en la siguiente carga y se sobreescribe al guardar.
- `isUnlocked(progress, id)` desbloquea un nivel solo si **el nivel inmediatamente anterior en `ALL_LEVELS`** está completado. Insertar niveles nuevos delante de otros ya completados vuelve a bloquear el avance del jugador.
- Los ids antiguos chocan con los nuevos: `'1-3'` pasa de «Guarida de Púas» a «Tenosique», `'2-1'`/`'2-2'` pasan a Carrillo Puerto/Edzná. **Por eso no basta con un mapa de ids aplicado en cada carga**: hay que distinguir datos viejos de nuevos.

### 7.3 Guía concreta de migración

1. **Versionar el guardado.** Cambiar `STORAGE_KEY` a `'temayin:v3'` y conservar `LEGACY_KEY = 'temayin:v2'`.
2. **Migración pura y probada** en `src/store/migrations.ts`:
   ```ts
   /** Ids de la v2 (campaña de 5 niveles) -> ids de la v3 (Tren Maya). */
   export const V2_TO_V3_LEVEL_IDS: Readonly<Record<string, string>> = {
     '1-1': '1-1', // La Selva -> Palenque
     '1-3': '1-6', // Guarida de Púas -> Escárcega
     '1-2': '5-3', // La Playa -> Playa del Carmen
     '2-1': '4-3', // Cenote Escondido -> Valladolid
     '2-2': '4-2', // Ríos Subterráneos -> Xibalbá
   };
   export function migrateV2Progress(raw: unknown): unknown { /* renombra claves de raw.levels sin mutar */ }
   ```
   Se aplica **antes** de `sanitizeProgress` y **solo** a datos leídos de `'temayin:v2'`.
3. **`loadSaved`**: si existe `'temayin:v3'`, cargarlo normal. Si no, leer `'temayin:v2'`, migrar, sanear y guardar inmediatamente en `'temayin:v3'`. No borrar la clave v2 (permite volver atrás); los ajustes (`settings`) se copian tal cual.
4. **Desbloqueo tras la migración.** Un jugador que tenía todo completado tendrá récords en 1-1, 1-6, 4-2, 4-3 y 5-3, pero no en los niveles intermedios nuevos. Opciones (elegir una y probarla):
   - (Recomendada) Ampliar `isUnlocked`: un nivel está disponible si es el primero, si el anterior está completado **o si ya tiene récord propio**. Así los niveles migrados siguen jugables y el jugador continúa la cadena desde 1-2.
   - Alternativa: desbloqueo por mundo (completar el jefe del mundo N abre el mundo N+1).
5. **Pruebas obligatorias** en `src/store/progress.test.ts` (o `migrations.test.ts`): cada id v2 se migra al id v3 correcto; los récords se conservan; datos v3 nunca se re-migran; datos corruptos siguen produciendo `EMPTY_PROGRESS`; un nivel migrado sigue desbloqueado.
6. **Regla futura:** una vez publicado un id de nivel, **no se reutiliza para otro lugar**. Cualquier renumeración requiere una nueva versión de guardado y su migración.

---

## 8. Hoja de ruta por fases

Cada fase termina con build y pruebas en verde, revisión visual y un commit convencional por cambio lógico.

| Fase | Objetivo | Entregables |
|---|---|---|
| **0 · Reubicar y mapa** | Reorganizar la campaña al formato Tren Maya sin contenido nuevo jugable | `WORLDS` con 7 mundos (nombres reales), niveles actuales en sus nuevos ids (7.1), migración `v2 → v3` con pruebas (7.3), `isUnlocked` ampliado, `src/data/stations.ts`, `PeninsulaMap.tsx` con el tren, monedas dibujadas como cacao, textos de historia (intro con Toh). Mundos sin niveles todavía: ocultarlos en el mapa o marcarlos «Próximamente» (la prueba exige `levels.length > 0` para los mundos registrados en `WORLDS`). |
| **1 · Agua y nado** | Motor acuático | `swim.ts`, oxígeno en `Player` y `HudState`, op `water`, corrientes (`zones.ts`), snorkel, temas `river`, enemigos `barracuda`, `blueCrab`, `jellyfish`, `moray`; ajuste de `levels.test.ts` para agua. |
| **2 · Mundo 1 completo** | Selva de Palenque | Niveles 1-2 a 1-5 (Boca del Cerro, Tenosique, El Triunfo, Candelaria), tema `swamp`, enemigos `howler`, `tarantula`, `nauyaca`, `ants`. Púas ya en 1-6. |
| **3 · Mundo 2** | Golfo de Campeche | Plataformas móviles / vagones (`platforms.ts`), temas `ruins`, `fortress`, `mangrove`, `pirateCrab`, jefe Kaimán Moreleti. |
| **4 · Mundo 3** | Yucatán de las haciendas | Oscuridad con radio de luz (`lighting.ts`), cuerdas de henequén (`ropes.ts`), hamacas trampolín, temas `hacienda`, `yellowCity`, `alux`, `wheel`, `truck`, `stalactite`, `scorpion`, jefe Huay Chivo. |
| **5 · Mundo 4** | Cenotes y Xibalbá | Combinación oscuridad + agua, tema `xibalba`, `shade`, `axolotl`, `xtabay`, pelota de pok ta pok, jefe Huay Pek. Reubicar 2-1/2-2 si no se hizo en la fase 0. |
| **6 · Mundo 5** | Riviera Maya | Zonas de sargazo, tema `reef`, `lionfish`, nivel submarino completo, jefe Capitán Sargazo. |
| **7 · Mundo 6** | Costa Maya y Bacalar | Temas `cliff`, `lagoon`, `bay`, `jungleTrain`; tren en marcha (6-2, `autoScroll`); viento y térmicas; luciérnagas; estromatolitos; Lorencillo (8 PV, 2 fases). Arte completado y recorridos en Chromium hasta checkpoint y meta; combate con asistencia, sin medir dificultad humana (ver §10). |
| **8 · Coleccionables** | Glifos y boletos | Boletos implementados: op `ticket`, `Progress.tickets`, siete secretos y saneamiento retrocompatible. Pendientes: glifos. |
| **9 · Final** | Calakmul, Camazotz y epílogo | **Implementado:** niveles 7-1 a 7-4 y secreto, temas propios, Camazotz de tres fases, rescate de Temayina, epílogo en tren (Centenario → Escárcega) y créditos. Ver guía y revisión del Mundo 7. |

---

## 9. Respeto cultural

- **Lugares reales con nombres reales.** Escribe bien los topónimos (con acentos: Escárcega, Hecelchakán, Calkiní, Maxcanú, Chichén Itzá) y describe cada lugar con datos verificables en la línea de Toh.
- **Sin caricaturizar a las comunidades actuales.** Los pueblos mayas son culturas vivas: nada de estereotipos de vestimenta, habla o costumbres. Los habitantes, si aparecen, son personajes dignos (p. ej. un maquinista del tren, artesanas de hamacas en Tixkokob).
- **Deidades y leyendas como figuras de leyenda.** Camazotz, el Huay Chivo, el Huay Pek, la Xtabay, los aluxes y el pájaro Toh se presentan como personajes de relatos tradicionales y del *Popol Vuh*, sin burla y sin presentar creencias religiosas actuales como "malvadas". Los aluxes son traviesos, no malignos.
- **Ruinas y sitios arqueológicos** se muestran con respeto: el jugador nunca destruye monumentos; los bloques rompibles son de escombro o de ladrillo, no estelas ni glifos.
- **Fauna endémica real preferida** sobre animales genéricos: jaguar, coatí, saraguato, motmot (Toh), cocodrilo de Morelet, nauyaca, cangrejo azul, ajolote/peces de cenote, tortugas de Akumal, murciélagos de Calakmul.
- **Mensajes ecológicos** breves y positivos, no sermones:
  - Sargazo: problema real del Caribe; quemarlo en el juego es fantasía, el mensaje habla de cuidar el mar.
  - Pez león: especie invasora; derrotarlo da puntos extra y Toh explica por qué.
  - Cenotes: agua dulce frágil; no se ensucian, el jugador recoge basura opcional como bonificación.
  - Estromatolitos de Bacalar: seres vivos milenarios; pisarlos penaliza.
  - Tortugas: no se dañan nunca; ayudarlas recompensa.
- **Personajes históricos**: Lorencillo (Laurens de Graaf) es un pirata histórico; se presenta como villano de aventura, sin glorificar la violencia.
- En caso de duda sobre un término o representación, deja un comentario `// TODO(cultura): revisar ...` y señálalo en el resumen del cambio en lugar de inventar.

---

## 10. Definición de terminado

### Mundo 7 · Calakmul implementado

- Revisión del combate final: 15 PV, cinco por fase, aperturas de 2,5 / 2,25 / 2 s. Combos de dos/tres picadas, dos oleadas de enjambre, viento con ondas, lluvia triple y orbes dirigidos. Luces elevadas que exigen salto, seis ecos reforzados y dos/tres rayos alternos, cada uno con aviso de 0,85 s y límite exacto en el pilar. `data/camazotzArt.ts` registra ocho poses nuevas y cuatro efectos; originales y prompts en `imagenes/nuevos/mundo7/camazotz-v2-prompts.json`. Exportación sin pérdidas: `imagenes/import_camazotz_art.py`. Pruebas de dificultad en `bosses/camazotz/difficulty.test.ts`; revisión completa en `imagenes/verify_camazotz_combat.py`, con contacto protegido, entradas reales y sin daño automático al jefe.

- `data/levels/world7/` registra Xpujil, Conhuas, Calakmul, Trono de Camazotz y el santuario secreto. Guía de diseño, mecánicas y fuentes en su `README.md`. Campaña de 39 niveles, siete boletos y siete secretos. Chetumal continúa a `7-1`; `7-4` termina la aventura. Los guardados anteriores no se renumeran ni pierden récords.
- `bosses/camazotz/` implementa quince PV, transiciones a diez y cinco, ventanas de un PV, fuego recuperable, antorchas reales, tres luces, seis ecos y rayo detenido por pilares sólidos. El checkpoint reinicia el combate completo. Toda la fase 2 y su descenso pertenecen a una arena ficticia.
- `data/world7Art.ts` integra nueve poses existentes y cinco PNG nuevos: atlas de seis efectos, brasero, abrazo de la pareja, Xpujil Río Bec y Calakmul al amanecer. Generados con `image_gen` integrado; prompts y originales en `imagenes/nuevos/mundo7/PROMPTS.md`. `imagenes/import_world7_art.py` reproduce WebP sin pérdidas y verifica igualdad RGBA. La generación no sustituye recursos históricos.
- `data/cinematics/camazotzVictory.ts`, `data/epilogue.ts` y `ui/components/EpilogueMap.tsx` cierran el rescate en cuatro escenas, con regreso geográfico por Centenario hasta Escárcega y créditos. El catálogo y la galería lo incorporan sin cambios de persistencia.
- `World7.test.ts`, `bosses/camazotz/camazotz.test.ts` y `store/world7Progress.test.ts` cubren recorridos desde inicio/checkpoint, boleto, progreso anterior y las tres fases completas. Las pruebas generales incluyen todos los niveles nuevos.
- `python imagenes/verify_world7.py` recorre los cinco niveles, captura fases, boleto y desenlace en escritorio y móvil. Usa contacto protegido y entradas físicas reales; el salto del boleto parte de una plataforma preparada. No mide dificultad humana. Capturas e informe en `imagenes/verificacion/mundo7/REVISION.md`. La revisión del selector cubre también los siete tramos y 39 puntos.

### Archivo de Historia y cinemáticas de victoria

- El botón «Historia» abre `ui/screens/HistoryScreen.tsx`: muestra el prólogo, siete victorias y el especial de temporada, con los requisitos de cada capítulo. El prólogo está disponible desde el principio; cada jefe jugable tiene una victoria de cuatro escenas. Púas usa `data/puasVictory.ts`; Kaimán, Huay Chivo, Huay Pek, Sargazo, Lorencillo y Camazotz usan un archivo por jefe en `data/cinematics/`. La galería permite volver a verlas y regresar a la tarjeta seleccionada, con teclado o controles táctiles.
- `data/cinematics.ts` registra `CinematicDef` por `CinematicId`: título, capítulo, portada, escenas y `afterLevel` opcional. Para añadir una cinemática futura se incorpora su id y su entrada al registro. El menú, la precarga `CINEMATIC_FILES` y el disparador `cinematicAfterLevel` la incorporan automáticamente. Las escenas reutilizan los tipos de `data/intro.ts` y sus composiciones verticales.
- `store/cinematics.ts` deriva el desbloqueo de `Progress.levels[afterLevel].completions > 0`. Los guardados v3 desbloquean automáticamente los capítulos de los jefes ya completados (`1-6`, `2-7`, `3-5`, `4-5`, `5-6`, `6-6`, `7-4`); los v2 migrados conservan el de Púas. No se modifica el esquema de persistencia ni se otorgan recompensas al reproducirlas desde Historia. Borrar el progreso vuelve a bloquear los capítulos de victoria.
- `ui/components/CinematicPlayer.tsx` comparte el reproductor entre prólogo, galería y fin de nivel: texto progresivo, avance automático/manual, salto de escena, salida con Escape y respeto del movimiento reducido. `IntroScreen` conserva la entrada automática antes de Palenque. El tren permanece visible también con movimiento reducido.
- `GameScreen` guarda la finalización antes de reproducir la cinemática asociada al nivel. Durante ella pausa el motor y deja inerte el juego; al terminar u omitirla muestra los resultados ya obtenidos. No remonta la partida, no duplica la finalización y conserva la sesión al continuar al siguiente nivel. Se reproduce tras alcanzar la meta de cualquiera de los siete niveles de jefe. Chetumal continúa a Xpujil; `7-4` cierra la aventura con rescate, reencuentro, mapa iluminado y créditos. `EpilogueMap.tsx` reutiliza la geografía y anima el regreso; movimiento reducido muestra el trayecto completo con el tren en Escárcega.
- `data/bossVictoryArt.ts` registra diez poses nuevas de jefes (derrota y despedida), seis de Temayin (celebración, agradecimiento, escucha, marcha, nado y sentado) y dos fondos (cubierta e interior del tren). Generados con `image_gen` integrado, sin sustituir los sprites del combate. Originales PNG, prompts y atlas: `imagenes/nuevos/cinematicas/`; WebP sin pérdidas: `public/assets/cinematicas/`. `imagenes/import_cinematic_art.py` localiza el pasillo transparente entre poses, mide alfa ≥ 8, conserva todas las siluetas y comprueba identidad de píxeles. La tortuga de Akumal reutiliza su pose de nado con `isolated: true` para excluir restos de otra pose. El eclipse de Calakmul está en el fondo y no se duplica con otro efecto.
- `intro-stage--chapter` separa escenario y texto en móviles apaisados de hasta 500 px de altura (`ui/portrait.css`). Las composiciones verticales siguen en los datos y usan el diseño vertical existente. La pose sentada utiliza el nuevo interior del tren.
- La portada del capítulo de Púas muestra su retrato `jefe_grande.webp`. Su despedida hacia Campeche usa el interior del tren y la pose sentada de Temayin, con los mismos encuadres de viaje que los demás capítulos.
- `python imagenes/verify_boss_cinematics.py` comprueba las veinte escenas nuevas a 1280×900, 390×844 y 844×390, dieciséis recortes alfa y exportación sin pérdidas, bloqueo inicial, foco, avance automático/manual, rotación, omisión y Escape. Prepara la bandera de cada uno de los cinco niveles para probar el disparador real de `Game`, la pausa, los resultados, la finalización única y la sesión conservada; no recorre los combates ni mide dificultad. Capturas e informe en `imagenes/.temp/cinematicas-jefes/`; resumen en `imagenes/verificacion/cinematicas-jefes/REVISION.md`.
- Pruebas: `data/cinematics.test.ts`, `store/cinematics.test.ts`, `ui/screens/HistoryScreen.test.tsx` y el flujo de introducción existente. `python imagenes/verify_cinematics.py` verifica partidas nuevas, v3 y v2, reproducción repetida, foco, omisión, rotación, movimiento reducido y avance automático en escritorio y móvil. Recorre Escárcega hasta checkpoint y meta, con contacto protegido y fuego asistido en ventanas válidas, y comprueba los resultados y la sesión al pasar a `2-1`. Capturas e informe en `imagenes/.temp/cinematicas/`; no evalúa dificultad ni puntería.

### Especial de temporada · Hanal Pixán

- `data/levels/seasonal/hanal-pixan.ts` define `especial-hanal-pixan` (364 bloques, 480 s, checkpoint 180, meta 346). Combina flores, dos hamacas con tejados de premio, columpio, tren sobre barranco seco, descanso, cenote con aire frecuente, dos aros de pelota opcionales y puentes de luces. Se conservan el id, los récords, el acceso libre y la continuación a Palenque. `ALL_LEVELS` conserva la cadena de campaña.
- `CinematicDef.beforeLevel` y `cinematicBeforeLevel` permiten cinemáticas previas. `GameScreen` espera a que terminen o se omitan antes de crear el motor: no corren tiempo ni enemigos. La cinemática `hanal-pixan` tiene tres escenas, está disponible en Historia y se repite al entrar o reiniciar el especial. No modifica `introSeen`. Si se continúa a Palenque por primera vez, `playIntro(next, carry)` y `introCarry` mantienen puntos y vidas durante el prólogo; el cacao se sigue tomando de la bolsa persistida.
- `data/hanalPixanArt.ts` conserva las ocho ilustraciones originales y precarga el nuevo atlas. `render/hanalPlayer.ts` selecciona 16 recortes: dos de reposo, cuatro de carrera, salto, caída, aterrizaje, lanzamiento, agarre, balanceo, dos de nado, muerte y victoria. Respeta pausa, invulnerabilidad, poderes y colisiones. `data/hanalPixanPlayer.ts` calibra el tamaño de la cabeza, pies, manos y centro del nadador. Si falta el atlas, se dibuja el jugador original.
- El atlas transparente se generó con `image_gen` integrado a partir del Temayin alebrije existente. PNG, prompt y guía en `imagenes/nuevos/personajes/temayin-hanal-movimientos.*`. `python imagenes/import_hanal_motion.py` mide las 16 siluetas, exporta WebP sin pérdidas y verifica igualdad de píxeles; produce `public/assets/temporada/hanal-pixan/temayin-movimientos.webp`, su atlas JSON y los datos TypeScript. El renderer aísla las siluetas en caché para excluir poses vecinas. Enemigos, Toh, Temayina y luciérnagas mantienen su arte alebrije.
- El texto explica la memoria de los seres queridos y distingue la fantasía de alebrijes de la tradición. Referencia cultural: [Gobierno de Yucatán · Janal Pixan](https://yucatan.gob.mx/?p=janal_pixan). No se presenta la fusión artística como una reconstrucción histórica.
- Cobertura: `data/hanalPixan.test.ts`, `store/seasonal.test.ts`, `render/hanalPixan.test.ts`, `render/hanalPlayer.test.ts`, `engine/HanalPixan.test.ts` y coherencia de `PLAYABLE_LEVELS`. Se prueba el recorrido desde inicio/checkpoint, los dos tejados de las hamacas y canastas reales en ambos aros. `engine/testing/hanalRoute.ts` comparte solo las entradas guionizadas con los verificadores: protege del contacto sin alterar posiciones, colisiones ni oxígeno.
- `python imagenes/verify_hanal_expansion.py` revisa 16 poses en ambas orientaciones, recorrido hasta checkpoint/meta, guardado y móvil vertical/horizontal. Capturas e informe en `imagenes/verificacion/hanal-pixan-ampliado/`. El anterior `node imagenes/verify_hanal_pixan.mjs` reutiliza el controlador y conserva la revisión de cinemática y continuación a Palenque. Los recorridos no miden dificultad humana; admiten `TEMAYIN_QA_URL`.

### Nota de versión del menú principal

- La portada de Hanal Pixán utiliza `public/assets/portada/temayin-alebrije.webp` y `palenque-hanal-pixan.webp`. `TitleScreen` compone imágenes y menú sin un bucle de canvas; `ui/title.css` contiene encuadres, paleta de jade/ámbar y luciérnagas CSS que se detienen con movimiento reducido. «Cómo jugar» despliega `ControlsHelp`; se conservan navegación, récord y `VersionNote`. Original del personaje y prompt: `imagenes/alebrijes-dia-de-muertos/`; fondo, prompt y guía: `imagenes/nuevos/portada-hanal-pixan/`. `node imagenes/import_title_hanal_art.mjs` exporta WebP y verifica alfa y color visible del personaje. `node imagenes/verify_title_hanal.mjs` comprueba cinco tamaños, navegación y teclado; capturas en `imagenes/verificacion/portada-hanal-pixan/`. La ofrenda en Palenque es una composición de fantasía, con referencias culturales documentadas en la guía del arte.

- La portada utiliza las fuentes locales Lilita One y Bree Serif, originales sin modificar y con licencias OFL en `public/assets/fonts/`. El título usa dos capas decorativas de texto para relieve, oro y contorno verde; ambas son `aria-hidden` y el `h1` conserva `aria-label="Temayin"`. No genera imágenes del texto ni depende de servicios externos de fuentes. `verify_version_note.py` comprueba también la carga real de ambas fuentes, el nombre accesible del título y su anchura en cuatro tamaños, incluido un móvil de 360 px.

- `scripts/buildInfo.ts` lee el hash, asunto y cuerpo del último commit al iniciar Vite o compilar. `vite.config.ts` incluye el resultado mediante `__BUILD_INFO__`, tipado en `src/buildInfo.d.ts` y expuesto por `src/data/buildInfo.ts`; los metadatos permanecen ligados al archivo publicado. Las variables opcionales `TEMAYIN_BUILD_COMMIT`, `TEMAYIN_BUILD_SUMMARY` y `TEMAYIN_BUILD_CHANGES` permiten compilar fuentes sin `.git`; un hash inválido o ausente muestra información no disponible, sin inventar una revisión. Los mensajes de commit destinados a publicación deben describir los cambios en español; el cuerpo puede detallar cada cambio en una línea.
- `ui/components/VersionNote.tsx` muestra la revisión y el resumen bajo los controles del título, con detalles accesibles si hay notas adicionales. Distingue «Versión desplegada» en producción y «Versión local» en desarrollo; no consulta Git desde el navegador. El título permite desplazamiento vertical cuando el contenido supera la pantalla. Pruebas de metadatos y presentación: `data/buildInfo.test.ts` y `ui/components/VersionNote.test.tsx`. `imagenes/verify_version_note.py --expected-commit SHA_COMPLETO --production` revisa el build servido por `npm run preview -- --port 5198`, tres tamaños, detalles y acceso al selector; resultados en `imagenes/.temp/nota-version/`.

### Pantalla de carga

- `ui/screens/LoadingScreen.tsx` reemplaza el spinner por una escena del tren pintado existente (`SPRITES.train`): vías y selva se desplazan con CSS y los vagones tienen balanceo suave. Los avisos de carga son estables y accesibles; `prefers-reduced-motion` detiene las animaciones. Se conservan la carga real y la transición inmediata al título, sin demoras artificiales. `imagenes/verify_loading.py` retiene un recurso solo en QA y comprueba escritorio, móvil, scroll táctil en pantalla baja, ciclo de paisaje y movimiento reducido; capturas en `imagenes/verificacion/carga/`.

### Recortes y proporciones de personajes

- `data/playerSprites.ts` registra las 36 poses reales de `guepardo.webp`, con anclas de pies y escala uniforme en cada recorte. `data/playerScale.ts` calibra las poses por el ancho de la cabeza: referencia de 56 px, incluyendo la hoja de mecánicas, y ajuste propio de 48 px para el perfil de carrera. Así el cuerpo no crece respecto al reposo; las otras poses mantienen su escala. La altura total varía al estirar o recoger las piernas: igualar todas las alturas agrandaba el nado horizontal y empequeñecía el salto. `render/sprites.ts` conserva los recortes completos, sus proporciones y el apoyo de los pies. Las colisiones y la simulación no cambian. `imagenes/verify_player_run.py` compara los siete cuadros de reposo y carrera en ambas orientaciones, conserva el apoyo y revisa salto/nado sin modificar la simulación; capturas y mediciones en `imagenes/.temp/temayin-carrera/`.
- Las seis poses de nado, cuerda y pelota están en `data/gameplaySprites.ts`. `render/playerMechanics.ts` comparte `drawPlayerPose` con `playerSwim.ts` y utiliza la calibración anatómica de `data/playerScale.ts`, con el nado centrado en el cuerpo, las manos sobre la punta de la cuerda y los pies apoyados al lanzar. `playerPoses.test.ts` verifica ambas orientaciones, las anclas, el tamaño de la cabeza entre brazadas, el respaldo al faltar el atlas y el tamaño del fuego y la muerte.
- `data/tohSprites.ts` reúne las seis poses completas y el apoyo de sus patas para la historia y los checkpoints. `render/spriteMask.ts` aísla la silueta principal a resolución original; `artCache.bakedFrame(..., true)` la escala y guarda en caché. El aislamiento se utiliza también en palapas, banderas, la embestida de Kaimán y los recortes inferiores de Sargazo; se conservan los originales. Los efectos que contienen varias piezas intencionales mantienen sus recortes completos.
- `SpriteRef.isolated` permite que `SpriteFrame` use el mismo recorte alfa en la historia mediante una imagen de canvas en caché. Toh y Camazotz dejan de arrastrar partes de otra pose. `public/assets/complementos/bloques.webp`, antes vacío, se restauró sin pérdidas desde su PNG existente.
- `imagenes/audit_sprite_crops.py` mide recortes sin editar imágenes y puede regenerar únicamente los datos TypeScript del jugador con `--write-player`, conservando la calibración de `playerScale.ts`. `imagenes/verify_sprite_crops.py` comprueba seis siluetas de Toh sin perder píxeles de su cuerpo, 36 poses del jugador con cabeza y apoyo coherentes, además de nado, agarre, balanceo y pelota en ambas orientaciones. Mide el dibujo real en canvas y permite alturas distintas por postura. Captura las seis poses de mecánicas en Boca del Cerro, Teya y Chichén Itzá sin modificar la simulación, además de salto y caída en Palenque; revisa historia en escritorio y móvil y recorre Palenque hasta checkpoint y meta con contacto protegido. Resultados por defecto en `imagenes/verificacion/recortes/` (carpeta configurable con `--output`). Pruebas sin DOM: `spriteMask.test.ts`, `playerSprites.test.ts` y `playerPoses.test.ts`.

### Transiciones suaves del agua

- El Triunfo (`1-4`) permite recuperarse al caer bajo la pasarela: el agua llega a la fila 10, las orillas tienen peldaños y el último tramo deja espacio para emerger. El saraguato conserva una plataforma firme en la columna 175. En Candelaria (`1-5`), el agua del túnel termina en 143 contra una pared maciza en 144 que llega a la fila 6. Se sale por el hueco superior de las columnas 141–143 y se salta sobre la pared; hay burbujas al pie del hueco. `engine/World1Water.test.ts` comprueba las 22 columnas bajo la pasarela, cinco posiciones de salida del túnel y el cierre lateral con colisiones, cámara, corrientes y oxígeno activos. `python imagenes/verify_world1_water.py` revisa las salidas y recorre ambos niveles hasta el checkpoint y la bandera en Chromium con protección de contacto; capturas y resultados en `imagenes/verificacion/mundo1-agua/`.

- Las zonas navegables terminan junto a bloques macizos desde la superficie hasta el fondo, o continúan en otra zona de agua. `data/levels/waterBanks.ts` genera orillas con suelo del bioma y peldaños de un máximo de dos bloques hacia tierra. Se corrigieron trece niveles; Campeche ya tenía sus límites cerrados. `levels.test.ts` valida todos los bordes laterales de la campaña para impedir nuevos cortes de agua en el aire.
- `WaterSurfaceRenderer` recorta el líquido contra los bloques sólidos de la cuadrícula. Los zócalos de suelo de las arenas de Kaimán y Sargazo sobreviven a `openExit`, que elimina únicamente el muro de piedra `X`; contienen el agua también tras la crecida y la derrota del jefe. `engine/WaterBanks.test.ts` comprueba esas salidas, los checkpoints secos y el muelle accesible de Playa del Carmen.
- Puerto Morelos conserva su superficie en la fila 3 y su checkpoint 98: los poderes dejan espacio para subir los peldaños aun después de usar sus bloques (escudo en 99,6; snorkel en 100,4; chile en 101,2 y chile inicial en 11,6), y la bandera pasa de 183 a 187 para quedar en suelo llano. Playa del Carmen eleva el muelle 50–54, coloca su coatí en 52,9 y sube los bloques de 95–96 a la fila 6 para permitir saltar hacia la siguiente orilla. En Candelaria y Valladolid se ajustan los enemigos al nuevo suelo. Los ids y la persistencia se conservan.
- En Candelaria, los bloques de 89–90 se elevan a las filas 5 y 3; en Xibalbá, el snorkel de 108 y el bloque de 109 pasan a las filas 6 y 3. Dejan espacio sobre los peldaños de entrada al túnel; pruebas de movimiento real comprueban el salto desde la orilla seca al agua.
- Los verificadores de recorridos distinguen las orillas de los techos submarinos y usan la posición del nadador para buscar la zona de agua al salir. La revisión de arenas salta el zócalo al finalizar y comprueba que desapareció el muro `X`, sin exigir que desaparezca también el suelo.

- `render/waterSurface.ts` dibuja el agua navegable en un lienzo reutilizado: mezcla lateral de 32 px dentro de cada orilla, entrada gradual de color en los primeros 48 px de profundidad, reflejo difuso y espuma fina. El enmascarado se aplica únicamente a ese lienzo; no borra terreno ni entidades ni extiende la zona nadable.
- `waterRenderSpans` une zonas contiguas de la misma altura y resuelve solapes usando la superficie más alta. Conserva superficies fraccionarias, incluidas las de la crecida de Kaimán. Las zonas de `BuiltLevel.water`, las reglas de nado y el oxígeno permanecen intactos; las orillas se añaden como terreno sólido en los datos de nivel.
- `Renderer` omite la antigua franja decorativa a altura fija cuando hay agua navegable; los temas con agua solo decorativa conservan un fondo con degradado. Así desaparece el segundo corte horizontal opaco.
- `render/waterSurface.test.ts` comprueba unión, solapes, pozas estrechas y cobertura de todos los niveles sin DOM. `python imagenes/verify_water_transitions.py` revisa los quince niveles con agua navegable o decorativa en Chromium y verifica continuidad de alfa, ausencia de costuras, conservación del terreno seco y de la simulación. Capturas y resultados: `imagenes/verificacion/agua-suave/`.

### Sprites de las mecánicas jugables

- `data/gameplaySprites.ts` registra los recortes y anclas de barcos, tortugas, palapas, cañones, losas frágiles, aros, cuerdas, troncos, resina, sargazo y poses de agarre, balanceo y lanzamiento. `data/newGameplaySprites.ts` registra siete imágenes nuevas de `image_gen`: púa, zapote, fuego fatuo, bola de sargazo, ola de agua, onda espectral y toldo. Los PNG originales y prompts están en `imagenes/nuevos/proyectiles/` y `imagenes/nuevos/complementos/toldo.*`; los WebP sin pérdidas y atlas se sirven desde `public/assets/`.
- `render/gameplaySprites.ts` comparte caché de recorte y escalado, con respaldo procedural al faltar una imagen. El fuego usa los cuatro cuadros de `mecanicas/efectos.webp`; los ataques de Kaimán, Huay Chivo, Huay Pek y Sargazo usan los sprites pintados. Los cañones conservan sus dos bloques sólidos; las losas frágiles se recortan por tramo, conservando su temblor y caída. Barcos y tortugas mantienen su superficie de apoyo y la inmersión protegida.
- Las poses de cuerda anclan las manos en el extremo del péndulo; el recorte de lanzamiento excluye la pelota ilustrada para evitar un segundo proyectil visual. La física, los ids de nivel, el HUD y la persistencia no cambian. El Mundo 7 integra el arte histórico de Camazotz, sus fondos y la jaula, además de cinco recursos nuevos documentados en su guía de arte.
- Pruebas: `data/gameplaySprites.test.ts` verifica archivos, recortes, anclas, prompts y precarga; `render/gameplaySprites.test.ts` verifica posición, orientación, respaldo y ausencia de mutación. `python imagenes/verify_gameplay_sprites.py` revisa siete recursos y dieciséis escenas en Chromium, con capturas en `imagenes/verificacion/sprites-jugables/`. Las escenas de ataques se preparan para inspección visual; los recorridos y combates asistidos se verifican aparte con `verify_world3.py`, `verify_world4.py`, `verify_world5.py` y `verify_bosses.py`.

### Controles móviles

- `Settings.keyBindings` y `Settings.touchAppearance` guardan la personalización bajo `temayin:v3`. `sanitizeSettings` amplía los guardados antiguos con valores originales, valida las teclas y recupera un mapa jugable ante conflictos; acota tamaño a 80–120 % y opacidad a 40–100 %. No cambia progreso, cacao ni ids de nivel.
- `KeyboardSettings` captura una tecla por acción, detecta conflictos también con atajos secundarios y permite cancelar con Esc o Tab y restaurar el mapa. `engine/controls.ts` resuelve las acciones sin React; `Input.setBindings` limpia las entradas al cambiar el mapa. `App` sincroniza el mapa con la entrada; `GameScreen` usa las mismas asignaciones para pausa y silencio, sin repetirlas al mantener una tecla. `ControlsHelp` muestra las teclas vigentes en la portada.
- `TouchSettings` y `TouchControls` comparten `TouchButtonGroups` y las variables de `ui/customControls.css`. Tamaño, opacidad y distribución se aplican a la vista previa y al mando, con blancos de al menos 44 px y sin solapamientos al girar. Cambiar la apariencia no remonta el motor ni modifica la entrada multitáctil. Cada grupo mantiene el orden de sus botones al cambiar de lado.
- Cobertura: `engine/controls.test.ts`, `engine/input.test.ts`, `store/settings.test.ts` y las pruebas existentes de entrada táctil y migración. `node imagenes/verify_custom_controls.mjs` revisa reasignación, conflictos, cancelación, recarga, acciones reales del motor, pausa y silencio, restauración y tres dedos en Chromium; comprueba tamaños mínimo/máximo y ambos lados en 320, 360, 390 y 844 px. Admite `TEMAYIN_QA_URL` y `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; resultados en `imagenes/.temp/controles-personalizados/`.

- `ui/usePortrait.ts` adapta la presentación al girar un dispositivo de hasta 900 px de ancho, sin reiniciar `Game` ni la cinemática. En vertical, `ui/portrait.css` distribuye HUD, área jugable y mando en tres filas con alturas dinámicas y márgenes seguros; los menús ocupan toda la pantalla. Oxígeno y poderes tienen espacio propio.
- El lienzo vertical mide 480 × 560 px lógicos. `render/viewport.ts` sigue al jugador con un recorte de la vista original de 960 px; `Renderer` aplica únicamente una transformación de dibujo. Arenas cerradas y secuencia de meta conservan el encuadre completo. No se modifica `World.camX`, la activación de enemigos, la física ni el progreso. Pruebas sin DOM: `render/viewport.test.ts`.
- La cinemática separa escenario y narración en vertical. `IntroActor.portrait` define composiciones propias en `data/intro.ts`; `intro-cast` limita la altura para mantener los personajes completos también en teléfonos largos. Los botones «Continuar» y «Mostrar texto» admiten toque, y los controles respetan áreas seguras y movimiento reducido.
- `python imagenes/verify_portrait.py --browser all` revisa cuatro tamaños verticales y uno horizontal en Chromium y WebKit: las seis escenas, rotación sin reinicio, HUD con oxígeno y todos los poderes, presentación de Púas, pausa y meta. `--motion no-preference` revisa las animaciones y el botón «Mostrar texto»; `--only-width 390` limita la revisión a un tamaño. Chromium usa tres dedos reales; en WebKit la combinación de movimiento/salto/fuego usa teclado y correr/pausa usan toque. El recorrido de Palenque hasta checkpoint y meta tiene protección de contacto; no evalúa dificultad. Capturas e informe en `imagenes/.temp/vertical/` (configurable con `--output`).
- `ui/components/preventTouchZoom.ts` instala listeners nativos no pasivos en el mando para cancelar `touchstart/move/end`, gestos de Safari y doble clic. Las acciones siguen entrando por Pointer Events; los listeners se retiran al desmontar el mando. La protección se limita al mando y no cancela los clics de los menús. `imagenes/verify_touch_zoom.py` comprueba 12 saltos rápidos, escala constante y pausa táctil en Chromium y WebKit con emulación móvil; no sustituye una prueba en un teléfono físico.
- `Input.press/release` admiten un identificador de fuente: cada tecla o dedo conserva su pulsación hasta soltarla, sin cancelar otras fuentes de la misma acción. `reset` limpia las fuentes y los flancos de salto/fuego.
- `ui/components/touchInput.ts` gestiona dedos independientes y deslizamiento entre botones. Correr es un interruptor táctil; no requiere un tercer dedo sostenido. `TouchControls` refleja el estado activo, captura cada puntero y limpia sus entradas al desmontarse, perder foco o esconderse la página.
- Los botones usan una distribución adaptable sin solapamientos, blancos táctiles de al menos 44 px y márgenes para las áreas seguras del dispositivo. `imagenes/verify_touch.py` prueba tres tamaños con eventos táctiles de Chromium: carrera, tres dedos, salto y disparo simultáneos, deslizamiento, cancelación y pausa. Para comprobar el disparo concede el chile en la prueba; las capturas y resultados están en `imagenes/verificacion/movil/`.

### Expresiones de Temayin en la historia

- `data/temayinExpressions.ts` registra seis sprites transparentes (alegre, cariñoso, sorprendido, preocupado, decidido y atento), uno por escena de `data/intro.ts`. `INTRO_FILES` precarga todos los recursos. Los PNG originales, prompts y atlas están en `imagenes/nuevos/personajes/temayin-*`; los WebP sin pérdidas se sirven desde `public/assets/personajes/`.
- `data/intro.test.ts` comprueba que cada escena usa una expresión distinta y la precarga. `imagenes/verify_story.py` revisa las seis escenas y el regreso al título en escritorio y móvil horizontal; las capturas están en `imagenes/verificacion/historia/`.

### Presentaciones y escenarios de jefes

- Los decorados pintados se registran en `data/scenerySprites.ts` (ruta, recorte y ancla); `render/scenerySprites.ts` los dibuja con `bakedFrame`, sin React ni cambios a la simulación. `bossArena.ts` utiliza arcada de Izamal, guarida de Púas, mangles, ceibas y lianas, conservando el respaldo procedural. Los originales y prompts nuevos están en `imagenes/nuevos/escenarios/`, y los WebP sin pérdidas se sirven desde `public/assets/escenarios/`.
- Las antorchas usan `complementos/utileria.webp`, salvo las del atrio de Izamal, que tienen versiones encendida/apagada en `proyectiles/huayChivo-efectos.webp`. El dibujo sigue `World.torches`, estado inicializado desde `level.lights`, con la mecha anclada a la fuente y halo al encenderse. Las plataformas horizontales de las arenas de Kaimán y Huay Pek usan troncos de `mecanicas.webp`; sus bloques sólidos y sus cajas de colisión permanecen intactos. `PAINTED_ART` precarga los decorados y la vegetación.
- `render/scenerySprites.test.ts` cubre anclaje de llama, ausencia de mutación, selección de plataformas y respaldo sin atlas. `imagenes/verify_bosses.py` revisa las cuatro arenas en Chromium con combate asistido.

- `BossHud.id` es un `BossId` y participa en `hudKey`, junto al nombre. `data/bossPresentation.ts` define retrato (recorte SVG del atlas existente), consejo, nombre de arena y paleta por jefe; `BossBanner` usa ese registro. El cartel de nivel se oculta mientras hay HUD de jefe para evitar superposiciones al reintentar.
- `render/bossArena.ts` dibuja un decorado por `BossId` detrás de bloques y entidades, anclado a `LevelDef.boss.arena`. Los decorados son visuales: guarida rocosa, pantano con raíces y juncos, atrio amarillo y claro con luna y luciérnagas. La arcada de Huay Chivo se dibuja aquí, separada del cuerpo del jefe.
- `swamp` usa suelo de lodo; `yellowCity` usa pavimento de mampostería; `jungleNight` usa el fondo pintado `deepJungle.webp` y plataformas de madera. Huay Pek tiene ramas asimétricas en las filas 8, 9 y 6; los ids y el guardado se conservan.
- Pruebas de la publicación del HUD, retratos, consejos y barra de vida: `ui/components/BossBanner.test.tsx`.

### Estado implementado del Mundo 4

- Los cinco niveles `4-1` a `4-5` están en `WORLDS`, entre Izamal y Playa del Carmen. Se conservan los ids publicados `4-2` y `4-3` y sus récords guardados.
- `4-1` incorpora pelota de pok ta pok (bloque `P`, `Player.ball`, misma tecla de disparo) y `['hoop', x, y]`: cada aro otorga una vez 2000 puntos y cinco granos de cacao, incluidos en `totalCoins`. `HudState.ball` participa en `hudKey`.
- `4-2` combina oscuridad, antorchas, agua, corrientes y bolsas de aire. `4-3` desciende al cenote y se cruza a nado; `data/levels/caves.ts` reúne techos, roca y túneles. Los ajolotes fantasma son criaturas de fantasía, no una afirmación sobre la fauna real de Yucatán.
- `4-4` usa `['resin', x0, x1, y]`, Xtabay y `LevelDef.weather: 'rain'`. Las zonas pegajosas no son bloques y requieren suelo firme en `y+1`. La op compartida `sargassum` se reserva para costa; el fuego la elimina sin quemar la resina.
- `4-5` incorpora Huay Pek, seis PV, ondas saltables y ojos encendidos como ventana de daño. La fase 2 reutiliza `render/lighting.ts` con radio 170; conserva niebla ambiental y restaura la oscuridad del nivel al abrir el muro. La representación es una adaptación familiar de relatos de transformación en perro ([Península, 2009](https://www.scielo.org.mx/scielo.php?pid=S1870-57662009000100002&script=sci_arttext)).
- Las sombras se disuelven dentro del núcleo iluminado de los halos. El ajolote solo es tangible al hacerse visible, también frente a la pelota; Xtabay permanece como trampa fija resistente a ella. Todos los niveles tienen `hint` de Toh.
- Cobertura de integración: `src/engine/World4.test.ts`; revisión de recorridos en Chromium: `imagenes/verify_world4.py`.

### Estado implementado del Mundo 5

- Mundo 5 registra Cancún (`5-1`), Puerto Morelos (`5-2`), Playa del Carmen (`5-3`), Xcaret (`5-4`), Puerto Aventuras (`5-5`) y Akumal (`5-6`), en ese orden. La cadena continúa desde Nuevo Xcán; el id publicado `5-3`, su récord y su acceso se conservan.
- Cancún reutiliza `beach`, con fosos secos que se cruzan sobre el tren y la plataforma móvil. No tiene agua navegable ni respiraderos; los muelles del segundo foso impiden saltarlo de una sola vez. `LevelDef.decorativeWater: false` oculta el agua decorativa del tema, conservando el paisaje costero. `data/beachProps.ts` coloca toldos y palapas sobre plataformas; `render/beachProps.ts` dibuja sus decorados sin alterar las colisiones.
- Puerto Morelos utiliza el tema `reef`, con el fondo existente `backgrounds/reef.webp` y respaldo procedural en `scenery/reef.ts`. Más del 70 % del recorrido está cubierto de agua; un islote seco aloja el checkpoint. Hay burbujas cada doce bloques como máximo y bloques `S` antes y después del checkpoint.
- `lionfish` patrulla lentamente, no es pisable y vale 600 puntos; `jellyfish` oscila verticalmente entre los límites del agua y los bloques, y tampoco es pisable. Ambos se derrotan con fuego o pelota. Sus atlas WebP existentes se precargan en `PAINTED_ART`. El consejo de Toh presenta al pez león como especie invasora.
- Playa del Carmen conserva su id y sus obstáculos principales; incorpora agua navegable, sargazo quemable, pasarelas y checkpoint seco en la columna 94.
- Xcaret combina oscuridad, antorchas, corrientes, túneles con bolsas de aire y burbujas separadas por un máximo de doce bloques. Los ajolotes fantasma siguen siendo criaturas de fantasía.
- Puerto Aventuras incorpora `['boat', x, y, largo, dx, dy, periodo]`. Akumal incorpora `['turtle', x, y, largo, dx, dy, periodo]`. Ambas ops reutilizan la física de `mover`; las tortugas son plataformas protegidas, sin salud ni contacto dañino. Las tres aliadas dentro de la arena de Akumal tienen poses de nado, enredo, aire e impulso (`MovingPlatform.turtleState`). Permanecer 0,6 s cerca de una enredada o darle dos disparos de fuego deshace el enredo; los proyectiles nunca dañan a las tortugas. Las libres recargan aire en un radio de 82 px y dan un impulso al dar una brazada cerca. `Boss.providesAir` es una consulta opcional que se resuelve antes de consumir el último oxígeno.
- Capitán Sargazo (`bosses/sargazo/`) tiene doce PV y cuatro fases a 9, 6 y 3 PV. El selector determinista evita repeticiones y fuerza un rescate después de dos ataques normales. Fase 1: salvas y cortinas con hueco fijo; fase 2: añade embestida horizontal y remolino; fase 3: lluvia de semillas; fase 4: frenesí con mayor velocidad y cadencia. El enredo mantiene la presión con proyectiles avisados hasta el rescate; el pulso de la tortuga limpia los peligros y abre el núcleo durante 5–4,4 s. Tocarlo desde cualquier dirección nadando, o acertar dos veces con fuego/pelota, quita un PV como máximo por apertura. El recorrido se puede completar sin poderes. Arena 78–100 con agua desde fila 3, sin refugios sólidos interiores; checkpoint seco 68, respiraderos 83/96, salida 101 y tiempo 420 s. Al vencerlo libera las aliadas, abre el muro y muestra un mensaje ecológico. El boleto de este mundo está en una bolsa de aire de Xcaret y abre la caleta secreta de las tortugas; se guarda en `Progress.tickets` bajo la misma clave v3.
- `data/sargazoArt.ts` registra ocho poses nuevas del Capitán, cuatro de tortugas, cuatro efectos y el fondo submarino; los atlas se precargan en `PAINTED_ART`. `render/sargazoSprites.ts`, `render/arenas/akumal.ts` y `bosses/sargazo/drawHazards.ts` dibujan el encuentro con respaldo procedural. PNG y prompts originales están en `imagenes/nuevos/`; WebP sin pérdidas y atlas en `public/assets/`. `imagenes/import_sargazo_art.py` reproduce la exportación y verifica identidad de píxeles. `imagenes/verify_sargazo_visuals.py` verifica escenas, móvil táctil y victoria desde checkpoint con contacto protegido, aire real y sin daño asistido al jefe.
- Cobertura: `src/engine/World5.test.ts`, `src/engine/World5Completion.test.ts` y las pruebas compartidas de coherencia; recorrido en Chromium: `imagenes/verify_world5.py` (contacto protegido, oxígeno y colisiones activos; daño al jefe asistido solo en ventanas válidas, sin evaluar dificultad ni puntería).

### Estado implementado del Mundo 6

- El Mundo 6 · Costa Maya y Bacalar (`costa-maya-bacalar`, número 6) registra 6-1 Tulum, 6-2 Tulum Aeropuerto, 6-3 Felipe Carrillo Puerto, 6-4 Limones, 6-5 Bacalar y 6-6 Chetumal, en ese orden, a continuación de Akumal (5-6). Guía de diseño y riesgos de frustración: `src/data/levels/world6/README.md`.
- Mecánicas por nivel:
  - **6-1 Tulum** (`cliff`): térmicas (`wind`, `vy = -6`) sobre la grieta 54-63, con una alternativa de tres losas; ráfagas horizontales de hasta 2 bloques/s; corazón de jade en la subida opcional. Punto de control en 108.
  - **6-2 Tulum Aeropuerto** (`jungleTrain`): `autoScroll: 3`, techos de vagón (`trainRoof`, `trainSide`) con huecos de 2-3 bloques y cajas de ventilación de 1-2 bloques. Punto de control en 96.
  - **6-3 Felipe Carrillo Puerto** (`jungle`, lluvia): tres cenotes con superficie en la fila 10 (`water`), ramas de ceiba y burbujas. Punto de control seco en 104.
  - **6-4 Limones** (`jungleNight`): `darkness` de radio 190 y opacidad 0,82; luciérnagas junto a cada borde de hoyo y cada enemigo. Punto de control en 108.
  - **6-5 Bacalar** (`lagoon`): lagunas de 37 y 31 bloques con superficie en las filas 10 y 9; estromatolitos (`stromatolite`) en el lecho. Punto de control en 112.
  - **6-6 Chetumal** (`bay`): dos canales cruzados en barcas (`boat`), corriente (`current`) en 118-138, punto de control seco en 100 con bloques de chile y escudo cerca, arena de Lorencillo en 156-177 y muro en 178. Encuentro con Ek Chuah antes del jefe.
- **Lorencillo** (`src/engine/bosses/lorencillo/`, `BossId` `'lorencillo'`): 8 PV (`LORENCILLO_HP`). A 4 PV, `rally` limpia peligros y anuncia la fase 2 durante 1,4 s. La segunda fase encadena dos estocadas a 560 px/s, cada una con aviso de 0,65 s, añade cañoneo durante el mástil y deriva de cubierta. Fase 1: una estocada a 460 px/s y aviso de 0,8 s. Estados: `sleep`, `intro`, `idle`, `advance`, `warn`, `lunge`, `exposed`, `cannon`, `mast`, `hurt`, `rally`, `dead`, `gone`. Solo `exposed` admite daño, durante 2,2/1,9 s: pisotón o dos impactos en la misma ventana, máximo un PV por apertura. Se reinicia el contador al caducar. El sable extendido tiene contacto propio. Los cañonazos marcan la superficie real de cubierta o cofa y mantienen un pasillo entre marcas incluso junto a las bordas. El mástil se alinea con el decorado y los cangrejos salen de su altura real, con impulso; máximo dos vivos. El selector no repite y fuerza estocada tras dos ataques sin apertura. Se pausa la deriva en apertura y recuperación. La muerte retira peligros, da premio y abre el muro.
- Arte del Mundo 6: `data/world6Art.ts`, `data/lorencilloArt.ts` y `terrainSprites.ts` registran ocho acciones nuevas, bahía al atardecer, jarcias y dieciséis variantes de vagón/cubierta/casco. Se mantienen preparación y derrota del atlas histórico. Anclas en aletas, escala común, aislamiento de siluetas y respaldo procedural. Bala y humo reutilizan el arte existente. Originales y prompts de `image_gen` integrado: `imagenes/nuevos/jefes/lorencillo-acciones.*`, `escenarios/jarcia-lorencillo.*`, `escenarios/bahia-chetumal.*`, `terreno/vagon-costa-maya.*`. `imagenes/import_world6_art.py` verifica exportación WebP sin pérdidas píxel a píxel y genera metadatos. Cobertura: `data/world6Art.test.ts`, `bosses/lorencillo/difficulty.test.ts` y las pruebas existentes.
- Equilibrio: `src/data/levels/balance.test.ts` aplica las reglas de equilibrio a los Mundos 1, 2, 3 y 6 (`BALANCED_WORLDS = [1, 2, 3, 6]`). Los Mundos 4 y 5 tienen pendiente un `TODO(equilibrio)` en ese mismo archivo.
- Límites conocidos: la pelota no devuelve las balas de cañón de Lorencillo (no implementado). Quedan `TODO(cultura)` abiertos en 6-1, 6-3, 6-5 y 6-6, en `src/engine/entities/stromatolites.ts` y en `src/data/bossPresentation.ts`.
- Pruebas: `src/data/levels/world6/world6.test.ts` (datos de los seis niveles), `src/engine/World6.test.ts` (recorrido guionizado de 6-2 a la velocidad del `autoScroll`; salto con y sin térmica en 6-1; cruce a nado de las lagunas de 6-5), `src/engine/entities/wind.test.ts`, `src/engine/entities/stromatolites.test.ts`, `src/engine/camera.test.ts`, `src/engine/render/themes.test.ts`, `src/engine/bosses/lorencillo/*.test.ts` (ataques, daño, fases, cubierta y victoria guionizada en 6-6 en `completion.test.ts`) y `src/ui/components/BossBanner.test.tsx` (presentación de Lorencillo).
- Verificación: `imagenes/verify_world6.py` recorre los seis niveles hasta checkpoint y meta, con contacto protegido, oxígeno y colisiones activos y pisotones asistidos solo dentro de `exposed`. `imagenes/verify_lorencillo_visuals.py` captura veinte escenas preparadas de poses, fases y orientaciones, más móvil horizontal y vertical con cinco botones táctiles. Los recorridos no miden dificultad humana ni puntería. Evidencia y prompts en `imagenes/verificacion/mundo6/REVISION.md`; capturas e informes en esa carpeta y su subcarpeta `lorencillo/`.

### Ajustes del Mundo 2

- Equilibrio de los Mundos 1 y 2: la dificultad sube de forma gradual dentro de cada mundo y culmina en su jefe. Mundo 1: 1-1 es el tutorial (una vida extra), 1-2 enseña a nadar con escudo al reaparecer y una vida escondida, 1-3 presenta las hormigas de una en una, 1-5 no embosca a la salida del agua y en 1-6 ningún enemigo se cuela en la arena de Púas. Mundo 2: 2-1 presenta el tren sobre un barranco sin agua (el vagón es la única forma de cruzar y fallar el salto cuesta una vida); 2-2 practica el escombro sin sombras antes de combinarlos; 2-6 combina escombro y sombras como prueba previa al jefe. Todos los niveles de ambos mundos tienen consejo de Toh (`LevelDef.hint`). Reglas, comprobadas con el motor en `data/levels/balance.test.ts`:
  - Ningún enemigo cae solo al vacío antes de cruzarse con el jugador, a 2,5, 4 y 7 bloques/s y con varias semillas del azar de `createEnemy`. Los caminantes (coatí, ruedas, cangrejos) no miran el suelo: no van en islas entre hoyos ni con un hoyo cerca a su espalda.
  - Ningún enemigo de suelo nace a 2 bloques o menos de un aterrizaje (el otro lado de un hoyo o la orilla por la que se sale del agua); la nauyaca, no más cerca que su alcance de aviso (`NOTICE_RANGE`, 3,2 bloques).
  - Ningún enemigo entra en la arena del jefe antes de que despierte.
  - Si quedan sombras tras el punto de control, hay un bloque `F` al alcance al reaparecer (el chile se pierde al morir).
  - Las carretas que se relevan sobre un barranco miden al menos 3 bloques y comparten periodo.
- Los cañones de Campeche disparan (`entities/cannons.ts`, dibujo en `render/cannons.ts`: mecha que chispea y fogonazo procedurales, bala de hierro y humo pintados). La bala gira centrada en su colisión de 22 px y el humo se orienta detrás del vuelo; ambos conservan respaldo procedural. Sprites y atlas en `public/assets/proyectiles/bala-canon.*` y `humo-canon.*`; PNG y prompts originales en `imagenes/nuevos/proyectiles/`. En el primer foso, la bala del cañón 78 alcanza a quien espera sobre el cañón 84; en el paseo de ronda, los cañones 149 y 155 cruzan fuego sobre el hueco del cangrejo pirata (se salta de cañón a cañón por encima). Cobertura: `entities/cannons.test.ts`, `render/cannons.test.ts` y `2-3-campeche.test.ts` (cacao entre cañones que disparan y espera segura sobre ellos); revisión en navegador con `python imagenes/verify_cannon_sprites.py`.

- Kaimán Moreleti (`bosses/kaiman/`): ocho PV y tres fases. `choose.ts` sortea el siguiente ataque entre los de su fase con pesos por distancia (cerca: mordida y coletazo; lejos: emboscada y lodo), nunca repite el anterior y fuerza la emboscada tras `MAX_ATTACKS_WITHOUT_DIVE` ataques para garantizar el pisotón. El azar es determinista (`makeRng`). `hazards.ts` añade el escupitajo de lodo (fauces abiertas: el fuego daña) y el golpe al mangle, que deja caer propágulos con sombra de aviso y huecos mínimos de `PROPAGULE_GAP`. Fase 2: crecida y dos troncos `mover` a la deriva entre los fijos. Fase 3: más velocidad, dos olas delanteras, emboscada doble, tormenta (`drawHazards.ts`) y nubarrones en el decorado. `Boss.stage` (opcional) permite que `render/bossArena.ts` reaccione a la fase; el pantano añade heno, nenúfares sobre la superficie real del agua y garzas que huyen al despertar el jefe. Cobertura: `kaiman.test.ts` y `choose.test.ts`.

- Arte del combate de Kaimán: `data/newGameplaySprites.ts` registra lodo, propágulo, pose de escupitajo y pose de golpe al mangle sin ola incorporada. Los originales de `image_gen` y sus prompts se conservan en `imagenes/nuevos/proyectiles/` y `imagenes/nuevos/jefes/`; `imagenes/import_kaiman_art.py` mide recortes por alfa y crea los WebP sin pérdidas en `public/assets/`. Los avisos distinguen mordida, ola, lodo, mangle y emboscada; el propágulo muestra carril discontinuo y anillo sobre la superficie real, y el lomo expuesto indica el pisotón. La ola se dibuja con el tamaño de su colisión, el heno cuelga del dosel y el cielo recupera la calma tras la derrota. `draw.test.ts` verifica anclas, avisos, respaldo y ausencia de mutación. `python imagenes/verify_kaiman_visuals.py` captura la presentación y ocho escenas de ataque, una vista horizontal pequeña y el recorrido completo de Calkiní con checkpoint y salida; el contacto y el daño al jefe están asistidos, sin evaluar dificultad ni puntería. Resultados en `imagenes/verificacion/kaiman/final/`.
- `data/kaimanArt.ts` comparte el recorte de reposo y la pequeña región de la pose vecina que invade ese rectángulo. El motor la excluye con un clip de regla par-impar; `BossPresentation.cutout` aplica el mismo recorte al retrato SVG. La silueta y el atlas original se conservan.

- Los siete niveles muestran consejos de Toh mediante `LevelDef.hint`.
- La morena utiliza `enemies/moray.webp`, anclada por la cabeza y recortada contra la grieta en las cuatro orientaciones. Conserva las reglas de contacto y el respaldo procedural.
- Calkiní pertenece al Camino Real, como confirma la [Unidad de Comunicación Social de Campeche](https://ucs.campeche.gob.mx/bienestar-beneficiara-a-familias-del-camino-real/).
- El arte de Huay Chivo y la vagoneta usa WebP; los originales PNG se conservan en `imagenes/`.

### Estado implementado del Mundo 3

- Los cinco niveles `3-1` a `3-5` están en `src/data/levels/world3/` y registrados en `WORLDS`, entre Calkiní y Chichén Itzá. Mundo estable: `yucatan-haciendas`.
- `hacienda` se comparte con Mundo 2; `yellowCity` utiliza el panorama de Izamal. Maxcanú y Teya usan `LevelDef.darkness` y consejos de Toh mediante `LevelDef.hint`.
- Ops nuevas: `['hammock', x, y, largo]`, `['rope', x, y, largo]`, `['torch', x, y]`, `['truck', x, y, largo, dx, periodo]`. Coordenadas y largos en bloques; período en segundos. `buildLevel` devuelve `hammocks`, `ropes` y `lights`; las vagonetas reutilizan `PlatformSpec` de Mundo 2 con `appearance: 'truck'`.
- `entities/hammocks.ts` resuelve el rebote de una sola cara. `entities/ropes.ts` resuelve el péndulo, agarre, bombeo y liberación con salto; `Player.swinging` y `ropeCooldown` son estado temporal, sin cambios al guardado.
- `render/lighting.ts` reutiliza una máscara y halos por radio. `World.lightSources()` expone jugador, fuego, antorchas y cristales sin DOM.
- Enemigos nuevos: `stalactite` (avisa, cae, se fragmenta) y `scorpion` (acelera con saltos cercanos). Se reutilizan los aluxes y ruedas del Mundo 2.
- Jefe `huayChivo`: ocho PV, tres fases a 8/5/2 PV y azar determinista. `choose.ts` pondera por distancia, no repite y fuerza embestida/teletransporte tras dos ataques sin ventana. `states/charge.ts` y `states/blink.ts` separan las carreras y el teletransporte. Los avisos sonoros y visuales duran al menos 0,6 s; raspar y girar son inofensivos. La cornada corta llega en fase 2 (80 px de alcance, 0,6 s de aviso). En fase 3 hay dos ondas por lado separadas 330 px y doble carrera; el segundo choque siempre deja 1,8 s de aturdimiento alcanzable desde el refugio cercano. Solo `dazed` admite daño: pisotón o dos bolas = un PV, máximo uno por ventana.
- `World.torches` contiene estado propio de la partida, separado de `level.lights`. El rugido de `nightfall` apaga solo las antorchas del atrio y una bola que alcanza la mecha las reenciende. Son opcionales: un recorrido con entradas guionizadas y pisotones reales gana con ambas apagadas. El chile de 58,9 se puede recoger tras reaparecer en 56. Se conservan refugios 65/81, sus chiles y el muro en 86.
- Arte de Huay Chivo: `data/huayChivoArt.ts` registra las ocho acciones nuevas, escala fija, anclas entre pezuñas y ojos calibrados por pose; el dibujo utiliza aislamiento de silueta y respaldo procedural. PNG, prompts y atlas originales en `imagenes/nuevos/jefes/huayChivo-acciones.*`, `proyectiles/huayChivo-efectos.*` y `escenarios/arcada-izamal-noche.*`. `imagenes/import_huay_chivo_art.py` mide alfa ≥ 8 y verifica WebP sin pérdidas píxel a píxel. Se reutiliza el fuego fatuo existente; humo de tres cuadros, ondas y restos de estuco tienen sprites propios. Los restos son decorativos y jamás dañan ni destruyen monumentos.
- `render/arenas/atrium.ts` muestra arcada amarilla/nocturna, volumen escalonado de Kinich Kak Moo en parallax, estrellas, luna y sombras; no crea gradientes por fotograma. Al llegar a cero PV amanece y se retira la oscuridad; después se abre la salida y aparece el premio. Máscara, halos y buffers de luces del renderer se reutilizan. Las consultas públicas de luces mantienen instantáneas independientes.
- Cobertura: `huayChivo/*.test.ts`, `data/huayChivoArt.test.ts`, `render/bossArena.test.ts`, `render/lighting.test.ts` y `World3.test.ts`. `imagenes/verify_huay_chivo_visuals.py` captura ataques por fase, antorchas, amanecer, móvil táctil horizontal/vertical y recorrido completo con checkpoint y meta. Escenas preparadas; recorrido con contacto protegido y fuego asistido solo en `dazed`, sin evaluar dificultad ni puntería. Resultados en `imagenes/verificacion/huay-chivo/`.
- Los registros antiguos y los ids publicados se conservan. Cobertura específica: `src/engine/World3.test.ts`.

### Arte de cofres y columnas

- El suelo de pantanos y manglares usa `terreno/suelo-pantano.webp`: seis cuadros de pasto con raíces y dieciocho de tierra interior, de 256 × 256 px, dibujados a 40 × 40 px. `data/terrainSprites.ts` registra el atlas opaco; `mayaTiles.ts` selecciona columna por posición del mundo y fila por profundidad desde cada superficie, también en montículos y orillas. Los cuadros se cachean sin aislar siluetas y se precargan desde `PAINTED_ART`. Se conservan geometría, física, ids y guardado. PNG original de `image_gen`, atlas, prompt y guía en `imagenes/nuevos/terreno/`; exportación WebP sin pérdidas verificada píxel a píxel mediante `imagenes/import_terrain_art.py`. Pruebas de cobertura y selección: `data/terrainSprites.test.ts`, `data/gameplaySprites.test.ts` y `render/mayaTiles.test.ts`. `python imagenes/verify_terrain.py` captura El Triunfo, Petenes y Calkiní, verifica opacidad, repetición y ausencia de mutación; resultados en `imagenes/verificacion/suelo-pantano/`. El recorrido de El Triunfo y el combate de Kaimán se revisan con los verificadores existentes, con asistencia de contacto y daño al jefe.

- Los bloques `?`, `M`, `L`, `F`, `S` y `P` comparten un cofre de jade con sello de cacao y cierre luminoso; `U` muestra su versión vacía, con el sello ausente y sin luz. `B` se dibuja como sillar agrietado. Los caracteres y la lógica de premios se conservan; el consejo de Palenque habla de cofres de jade.
- La op histórica `pipe` conserva las baldosas sólidas `p/q/l/r`, ahora con remate de jaguar y cuerpo de columna modular. Cada mitad dibuja 40 × 40 px, también en los extremos de la cámara, sin depender de que la otra mitad esté visible. El arte se ajusta a los 80 px de ancho y a la altura de cada tramo.
- `data/mayaTileSprites.ts` registra cinco sprites transparentes generados con `image_gen`. PNG, atlas y prompts: `imagenes/nuevos/complementos/`; WebP sin pérdidas: `public/assets/complementos/`. `data/terrainSprites.ts` conecta césped, tierra, caliza, arena, roca, madera y cristal del atlas existente `bloques.webp`, con aislamiento de siluetas y fondo bajo las esquinas para mantener suelo continuo. Los temas conservan sus propias texturas cuando no hay sprite equivalente.
- `render/mayaTiles.ts` dibuja el arte y `render/mayaTextures.ts` mantiene respaldos del mismo estilo. Pruebas: `render/mayaTiles.test.ts` y `data/gameplaySprites.test.ts`. `python imagenes/verify_maya_tiles.py` comprueba un premio real, columnas de distintas alturas, escritorio y móvil, un recorrido de Palenque con checkpoint y meta, y escenas de costa y cueva. El contacto está protegido durante el recorrido; las colisiones y los hoyos están activos. Resultados en `imagenes/verificacion/arte-maya/`.

Una tarea está terminada solo si se cumple **todo** lo siguiente:

- [ ] `npm run build` pasa (sin errores de tipos ni de Vite).
- [ ] `npm test` pasa por completo, incluidas las **pruebas de coherencia de niveles** (`src/data/levels.test.ts`) para cada nivel nuevo o modificado.
- [ ] Hay pruebas nuevas para el comportamiento nuevo (motor en `World.test.ts`/módulos propios; store en `progress.test.ts`; migraciones con casos v2 → v3).
- [ ] **Revisión visual en el navegador** (`npm run dev`): el nivel se juega de principio a fin, se alcanza el checkpoint y la meta, el jefe (si lo hay) se puede vencer, y el HUD muestra los datos nuevos. Probar también con controles táctiles si se tocó la entrada.
- [ ] El progreso guardado existente sigue cargando (si se tocaron ids, `LevelRecord` o `Progress`).
- [ ] Sin `console.log` ni código de depuración; sin archivos basura (p. ej. volcados `*.stackdump`).
- [ ] Texto visible en español y revisado según la sección 9.
- [ ] Archivos y funciones dentro de los límites de tamaño; sin números mágicos.
- [ ] Este `AGENTS.md` (y el `README.md`, sección «Contenido actual») actualizados si cambió la arquitectura, el DSL o la lista de niveles.
- [ ] Commit(s) convencionales en español.
