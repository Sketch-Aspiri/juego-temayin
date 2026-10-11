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
6. **Todo nivel nuevo debe pasar las pruebas de coherencia** de `src/data/levels.test.ts` (hoyos cruzables, enemigos sobre suelo, meta con suelo, jefe con arena y muro…). Esas pruebas recorren `ALL_LEVELS` automáticamente: basta con registrar el nivel en `WORLDS` para que se validen.
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

En móviles hay controles táctiles (`src/ui/components/TouchControls.tsx`, configurables en Ajustes).

### Árbol de carpetas real

```
temayin_juego/
  index.html
  package.json, tsconfig.json, vite.config.ts
  imagenes/                    Arte fuente (hojas de diseño); NO se sirve
  public/assets/               Sprites usados por el juego (coati.png, erizo.png, guepardo.png,
                               jaguar_titulo.png, jefe.png, jefe_grande.png)
  src/
    main.tsx, App.tsx          Arranque y enrutado de pantallas (según `screen` del store)
    styles.css
    engine/                    MOTOR: TypeScript puro, sin React
      World.ts                 Estado y reglas de un nivel (testeable sin DOM)
      World.test.ts
      Game.ts                  Bucle de tiempo fijo (STEP = 1/120), muertes, fin de nivel
      constants.ts             T=40, ROWS=14, GROUND=12, VW=960, VH=560, START_LIVES, COINS_PER_LIFE…
      types.ts                 Rect, Body, EnemyId, BossId, ThemeId, Session
      tiles.ts                 Leyenda de bloques, SOLID_TILES, ITEM_BLOCKS, ItemKind
      physics.ts (+ .test)     moveX / moveY / overlap contra la cuadrícula
      input.ts (+ .test)       Teclado y táctil
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
        particles.ts           Partículas y popups
        types.ts               Player, Enemy, Item, Particle, Popup, Fireball, Quill
      bosses/
        types.ts               Interfaz Boss + BossFactory
        index.ts               Registro FACTORIES: Record<BossId, BossFactory> y createBoss
        puas.ts, puasDraw.ts   Púas el puercoespín (máquina de estados + dibujo)
        kaiman/                Kaimán Moreleti: index (estados), attacks (olas), flood (crecida del agua), draw/drawBody, tuning
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
    data/                      CONTENIDO (aquí se añaden niveles y mundos)
      worlds.ts                WORLDS, ALL_LEVELS, getLevel, nextLevelId
      levels.test.ts           Pruebas de coherencia de TODOS los niveles
      levels/
        helpers.ts             Atajos coati(...), urchin(...), howler(...), bats([x, fila]...), barracudas([x, fila]...)
        world1/                1-1-palenque.ts … 1-6-escarcega.ts (un archivo por nivel)
        world2/                2-1-carrillo-puerto.ts … 2-7-calkini.ts (jefe Kaimán)
        world3/                3-1-maxcanu.ts … 3-5-izamal.ts (jefe Huay Chivo)
        world4/                4-1-chichen-itza.ts … 4-5-nuevo-xcan.ts (jefe Huay Pek)
        world5/                5-3-playa-del-carmen.ts
    store/                     Zustand + persistencia
      appStore.ts              useAppStore: screen, progress, settings, run, startLevel, finishLevel…
      progress.ts (+ .test)    Progress, LevelRecord, recordCompletion, isUnlocked, sanitizeProgress
      settings.ts              Settings, DEFAULT_SETTINGS, sanitizeSettings
      migrations.ts (+ .test)  V2_TO_V3_LEVEL_IDS, migrateV2Progress
      persistence.ts           loadSaved / save en localStorage (clave 'temayin:v3'; migra 'temayin:v2')
    ui/
      assetsContext.tsx
      screens/                 TitleScreen, LevelSelect, GameScreen, SettingsScreen
      components/              Hud, BossBanner, Overlays, Stars, TouchControls
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
| Protagonista | **Temayin** | Jaguar guardián de Palenque. Corre, salta, pisa enemigos, lanza fuego con el chile. | Existe. Sprite `public/assets/guepardo.png` (clave `player` en `assets.ts`). |
| Protagonista (rescatada) | **Temayina** | Jaguar, guardiana del Sol de Jade. Aparece en la intro, en el clímax y en el epílogo. | Por crear (sprite + escenas). |
| Aliado | **Toh, el pájaro reloj** | Motmot de cola en forma de péndulo. Da pistas, marca checkpoints, narra el mapa. | Por crear (dibujo procedural en `render/sprites.ts` o sprite nuevo). |
| Villano | **Camazotz** | Señor murciélago de Xibalbá (Popol Vuh). Jefe final de 3 fases. | Por crear (`BossId` `'camazotz'`). |
| Jefe M1 | **Púas el puercoespín** | Embiste, rueda y dispara púas. | **Existe** (`bosses/puas.ts`, `BossId` `'puas'`). |
| Jefe M2 | **Kaimán Moreleti** | Cocodrilo de pantano (*Crocodylus moreletii*). | **Existe** (`bosses/kaiman/`, `BossId` `'kaiman'`; nivel 2-7). |
| Jefe M3 | **Huay Chivo** | Brujo-cabra del folclor yucateco. | **Existe** (`bosses/huayChivo/`, `'huayChivo'`; nivel 3-5). |
| Jefe M4 | **Huay Pek** | Perro espectral de la leyenda. | **Existe** (`bosses/huayPek/`, `'huayPek'`; nivel 4-5). |
| Jefe M5 | **Capitán Sargazo** | Monstruo de sargazo; mensaje ecológico. | Por crear (`'sargazo'`). |
| Jefe M6 | **Lorencillo** | Pirata barracuda inspirado en el pirata histórico que atacó Campeche (1685). | Por crear (`'lorencillo'`). |

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
| 2-1 | Carrillo Puerto | Paradero rural en la selva baja campechana | `jungle` | jungla / tren | Primer nivel con vagones de tren móviles | `coati`, saraguato, vagones de truck |
| 2-2 | Edzná | Zona arqueológica, Edificio de los Cinco Pisos | `ruins` | ruinas | Escaleras de pirámide (`stairs`), plataformas que caen | tarántula, nauyaca, sombras de Xibalbá (menor) |
| 2-3 | San Francisco de Campeche | Ciudad amurallada, baluartes y puertas de Mar y de Tierra | `fortress` | ciudad | Cañones de baluarte como plataformas, muros con troneras | piratas cangrejo, cangrejo azul |
| 2-4 | Petenes | Reserva de la Biosfera Los Petenes: manglares e islas de selva | `mangrove` | acuático | Nado entre raíces de mangle; corrientes de marea | morena, cangrejo azul, `urchin` |
| 2-5 | Tenabo | Pueblo agrícola del Camino Real | `hacienda` | hacienda | Carretas y sacos como plataformas | ruedas de henequén, `coati` |
| 2-6 | Hecelchakán | Pueblo del Camino Real, museo arqueológico | `ruins`, atardecer | ruinas / ciudad | Estelas que se derrumban; primeras cuerdas de henequén | aluxes, tarántula |
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
| 4-2 | Xibalbá | Paradero real cercano a Chichén Itzá; en el juego, entrada al inframundo | `xibalba` | subterráneo + acuático | Oscuridad + nado: cuevas inundadas | sombras de Xibalbá, ajolote fantasma, `bat` |
| 4-3 | Valladolid | Ciudad colonial con el cenote Zací en pleno centro | `cave` | acuático / subterráneo | Descenso al cenote; bolsas de aire | ajolote fantasma, `bat`, `urchin` |
| 4-4 | Leona Vicario | Pueblo chiclero entre chicozapotes | `jungle`, lluvia | jungla | Resina de chicle pegajosa que frena (variante de zona lenta); árboles de chicozapote | saraguato, hormigas arrieras, Xtabay (trampa) |
| 4-5 | Nuevo Xcán | Paradero en el límite Yucatán–Quintana Roo | `jungleNight`, noche | jefe | Arena con niebla y oscuridad parcial | **Jefe: Huay Pek** (`'huayPek'`) |

#### Mundo 5 · Riviera Maya (Tramo Cancún–Akumal)

Temas: `beach` (existe), `reef` (nuevo), `cave`. Mar caribe turquesa, arrecife, ríos subterráneos.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 5-1 | Cancún | Zona hotelera y laguna Nichupté | `beach` | costa / ciudad | Toldos y palapas como plataformas; vagones del tren | cangrejo azul, `urchin`, piratas cangrejo |
| 5-2 | Puerto Morelos | Arrecife de Puerto Morelos (parte del Sistema Arrecifal Mesoamericano) | `reef` | acuático (submarino) | Nivel casi entero bajo el agua; snorkel de caracol | pez león, medusa, morena |
| 5-3 | Playa del Carmen | Quinta Avenida y playa | `beach` | costa | Plataformas de madera, oleaje; zonas de sargazo | `urchin`, cangrejo azul, `coati` |
| 5-4 | Xcaret | Ríos subterráneos y caletas | `cave` | subterráneo + acuático | Corrientes en ríos subterráneos; oscuridad parcial | ajolote fantasma, `bat`, morena |
| 5-5 | Puerto Aventuras | Marina y caletas | `beach`, atardecer | costa | Barcos que se mecen; muelles | barracuda, piratas cangrejo, medusa |
| 5-6 | Akumal | «Lugar de tortugas»: bahía con tortugas marinas | `reef` | jefe | Arena submarina; las tortugas sirven de plataformas | **Jefe: Capitán Sargazo** (`'sargazo'`) |

#### Mundo 6 · Costa Maya y Bacalar (Tramo Tulum–Chetumal)

Temas: `cliff` (nuevo), `lagoon` (nuevo), `jungle`, `fortress`. Acantilados, laguna de siete colores, frontera sur.

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 6-1 | Tulum | Ciudad amurallada sobre el acantilado frente al Caribe | `cliff` | ruinas / costa | Saltos verticales en el acantilado; viento | cangrejo azul, nauyaca, `urchin` |
| 6-2 | Tulum Aeropuerto | Estación moderna en la selva | `jungle` | tren | Persecución sobre el techo del tren en marcha | vagones de truck, saraguato, `coati` |
| 6-3 | Felipe Carrillo Puerto | Antigua Chan Santa Cruz, corazón de la zona maya | `jungle`, lluvia | jungla | Cenotes pequeños; árboles de ceiba | aluxes, Xtabay, hormigas arrieras |
| 6-4 | Limones | Paradero en la selva del sur de Quintana Roo | `jungle`, noche | jungla | Oscuridad con luciérnagas como luz | tarántula, `bat`, nauyaca |
| 6-5 | Bacalar | Laguna de los siete colores, estromatolitos, canal de los piratas | `lagoon` | acuático | Nado; **estromatolitos frágiles: no se pisan** (perder puntos o vida si se dañan) | barracuda, morena, `urchin` |
| 6-6 | Chetumal | Capital de Quintana Roo, bahía de Chetumal | `fortress` (bahía) | jefe | Arena sobre un barco pirata | **Jefe: Lorencillo** (`'lorencillo'`) |

#### Mundo 7 · Calakmul (Tramo Chetumal–Escárcega)

Temas: `ruins` (estilo Río Bec), `batCave` (nuevo, variante de `cave`), `deepJungle` (nuevo), `throne` (nuevo).

| Id | Estación | Lugar real | Tema / ambiente | Tipo | Mecánica clave | Enemigos |
|---|---|---|---|---|---|---|
| 7-1 | Xpujil | Ruinas de estilo Río Bec con torres falsas | `ruins` | ruinas | Torres con escalinatas falsas (no se pueden subir: hay que buscar el camino) | tarántula, nauyaca, sombras de Xibalbá |
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
| **Kaimán Moreleti** (M2) | Pantano con agua poco profunda y troncos | Se sumerge y emerge bajo el jugador; coletazo que lanza olas; mordida en carrera | Lomo expuesto tras emerger (pisotón); fuego cuando abre las fauces | 2: a mitad de vida, el agua sube y los troncos se mueven | Snorkel de caracol (primer uso libre) + glifo |
| **Huay Chivo** (M3) | Atrio amarillo de Izamal con arcos | Se teletransporta entre arcos; embiste con cuernos; invoca fuegos fatuos lentos | Pisarlo cuando choca contra un arco y queda aturdido | 2: de noche (oscuridad parcial) se vuelve más rápido | Cuerda de henequén (mejora) |
| **Huay Pek** (M4) | Claro en la selva con niebla | Ladra ondas de choque que viajan por el suelo (saltarlas); desaparece en la niebla y reaparece detrás | Ojos brillantes: solo es golpeable cuando están encendidos | 2: la niebla cubre la arena y solo se ve con radio de luz | Pelota de pok ta pok |
| **Capitán Sargazo** (M5) | Bahía de Akumal, mitad agua | Lanza bolas de sargazo que frenan; ola de algas que cubre el suelo; esconde tortugas | Núcleo de basura plástica visible al abrirse; fuego quema el sargazo | 3 capas de sargazo que se van quemando | Mensaje ecológico (Toh explica el sargazo) + boleto si no se dañó ninguna tortuga |
| **Lorencillo** (M6) | Cubierta de un barco pirata en la bahía de Chetumal | Estocadas con sable-aleta; cañonazos en arco; salta al mástil y lanza piratas cangrejo | Espalda tras una estocada fallida; cañones que se pueden devolver con la pelota | 2: el barco se inclina y la cubierta se mueve | Llave del tramo final |
| **Camazotz** (M7, final) | Cima de la pirámide de Calakmul bajo el eclipse | Ver fases | Ver fases | **3** | Rescate de Temayina + epílogo |

#### Camazotz, el jefe final (3 fases)

| Fase | Nombre | Arena | Ataques | Cómo dañarlo | Transición |
|---|---|---|---|---|---|
| 1 | **Señor de la Noche** | Plataforma superior del templo, oscuridad parcial | Vuela en arcos y se lanza en picada; invoca enjambres de `bat`; ráfagas de viento de alas que empujan | Pisarlo cuando aterriza tras la picada; bolas de fuego | A 2/3 de vida rompe el suelo: caída a la cámara interior |
| 2 | **Cámara de Xibalbá** | Interior de la pirámide, oscuridad total con radio de luz; antorchas que se encienden con fuego | Se esconde en la oscuridad; ojos rojos delatan su posición; lluvia de estalactitas; sombras de Xibalbá | Encender las 4 antorchas con fuego lo deja expuesto y aturdido | A 1/3 de vida escapa a la cima |
| 3 | **El Eclipse** | Cima con el Sol de Jade y Temayina atrapada en una jaula de sombra | Rayo de eclipse que barre la arena (saltar o agacharse tras pilares); invoca a ecos de los 6 lugartenientes (un ataque de cada uno) | El Sol de Jade se carga al recoger 3 rayos de luz; cuando brilla, Camazotz queda cegado y se le puede pisar | Al vencerlo el eclipse termina, la jaula se rompe: escena de rescate |

Implementación sugerida: `src/engine/bosses/camazotz/` con `index.ts` (clase), `phases.ts`, `attacks.ts`, `draw.ts` para respetar el límite de 400 líneas por archivo.

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
| Pez león (invasor) | `lionfish` | Nuevo | Nada despacio; espinas venenosas. Derrotarlo da puntos extra y un mensaje de Toh sobre especie invasora | No (fuego/pelota) |
| Medusa | `jellyfish` | Nuevo | Sube y baja en vertical bajo el agua | No |
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
| **Granos de cacao** (monedas) | Puntos; **100 = vida extra** | **Existe** como moneda (tile `o`, bloque `?`, `COINS_PER_LIFE = 100`) | Solo cambiar el dibujo a grano de cacao (`drawCoin` en `render/drawUtils.ts` y partícula `coin`) y los textos de la UI ("MONEDAS" → "CACAO"). |
| **Chile habanero** | Bolas de fuego | **Existe** (bloque `F`, `ItemKind` `'fire'`, `player.fire`) | Renombrar visualmente a «habanero» si se desea; lógica intacta. |
| **Corazón de jade** | Vida extra | **Existe** como bloque `L` → `ItemKind` `'life'` (popup `1UP`) | Cambiar sprite en `drawItemSprite`. |
| Escudo | Absorbe un golpe | **Existe** (bloque `M`, `'shield'`) | Mantener; puede representarse como un escudo de jade o chimalli. |
| **Snorkel de caracol** | Oxígeno infinito temporal bajo el agua | **Existe** | `ItemKind` `'snorkel'`, bloque `S`, `SNORKEL_TIME` = 15 s (solo descuenta bajo el agua). |
| **Pelota de pok ta pok** | Proyectil que rebota en paredes y suelo; activa aros | **Existe** | Bloque `P`, `ItemKind` `'ball'`, `player.ball` (se pierde al morir), `world.balls`, `entities/ball.ts`, dibujo en `render/ball.ts` (cuadro `ball` del atlas de objetos). La tecla de disparo lanza la pelota con **prioridad sobre el chile**: máx. `BALL_MAX_ACTIVE` = 1 en el aire; con ella volando, la tecla lanza fuego. Rebota `BALL_MAX_BOUNCES` = 5 veces (bote desde el suelo ≈ 3,4 bloques: alcanza aros en la fila 8; la fila 7 pide lanzar saltando). Derriba enemigos salvo `shade` (solo luz/fuego) y daña al jefe vulnerable. |
| **Cuerda de henequén** | Gancho / columpio | Nuevo | Depende de 5.6. Puede ser habilidad permanente tras el jefe del M3 en lugar de objeto. |
| **Glifos mayas** (coleccionable) | 3 ocultos por nivel | Nuevo | Ver abajo. |
| **Boleto del Tren Maya** (coleccionable) | 1 oculto por mundo; desbloquea un nivel extra | Nuevo | Ver abajo. |

**Glifos integrados con las estrellas.** Hoy `computeStars(coinRatio, deaths)` (`src/engine/scoring.ts`) da 1 estrella por completar y 2–3 según monedas sin morir. Propuesta:
- Añadir `glyphs: number` (0–3) a `LevelResult` y a `LevelRecord` (`store/progress.ts`), conservando el máximo como con `bestScore`.
- Mantener las estrellas actuales y mostrar los glifos aparte en la ficha de nivel; o bien redefinir: ★1 completar, ★2 sin morir + ≥60 % cacao, ★3 los 3 glifos. Elegir una opción y cubrirla con pruebas en `progress.test.ts`.
- `sanitizeProgress` debe aceptar registros antiguos **sin** `glyphs` (valor 0 por defecto); nunca descartarlos.
- Nueva op del DSL `['glyph', x, y]` y tile no sólido (p. ej. `g`) recogido como las monedas sueltas en `World.collectLooseCoins`.

**Boletos y niveles extra.**
- Op `['ticket', x, y]` (uno por mundo) y campo `tickets: readonly string[]` (ids de mundo) en `Progress`.
- Campo opcional `bonus?: LevelDef` en `WorldDef`. Los niveles extra **no** forman parte de la cadena lineal `ALL_LEVELS` (para no alterar `isUnlocked` ni `nextLevelId`); se desbloquean con `hasTicket(progress, worldId)`. Deben pasar igualmente las pruebas de coherencia: ampliar `levels.test.ts` para recorrer `ALL_LEVELS` + extras.

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
| `fortress` | **Existe** (fosos secos, sin `water`) | 2, 6 | Golfo al fondo | Sillar de muralla / madera de barco | Baluartes, cañones |
| `mangrove` | **Existe** | 2 | Cielo húmedo | Raíces de mangle | Agua salobre |
| `hacienda` | **Existe** | 2, 3 | Atardecer cálido | Mampostería / tierra roja | Pencas de henequén, chimeneas |
| `yellowCity` | **Existe** | 3 | Azul intenso | Muros amarillos y blancos | Arcos del convento |
| `xibalba` | **Existe** | 4 | Negro y rojo | Roca volcánica / hueso | `LevelDef.darkness`, niebla |
| `jungleNight` | **Existe** | 4 | Selva bajo velo azul | Hierba y piedra | Oscuridad parcial y arena de Huay Pek |
| `reef` | Nuevo | 5 | Bajo el agua (azul profundo) | Coral / arena | Todo el nivel es agua (5.1) |
| `cliff` | Nuevo | 6 | Caribe turquesa | Roca de acantilado | Viento |
| `lagoon` | Nuevo | 6 | Degradado de los 7 azules de Bacalar | Arena blanca / estromatolitos | Agua clara |
| `batCave` | Nuevo | 7 | Atardecer naranja → cueva | `rock` | `dark`, enjambres de fondo |
| `deepJungle` | Nuevo | 7 | Noche estrellada | `grass` oscuro | `dark` |
| `throne` | Nuevo | 7 | Eclipse (sol negro con corona) | Piedra de pirámide | `tint` rojo, `dark` en fase 2 |

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
| Cámara | En niveles de tren en marcha (6-2) la cámara puede seguir al tren; recordar que hoy la cámara solo avanza (`camX` nunca retrocede). |
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
| Dónde | UI de React: `src/ui/screens/PeninsulaMap.tsx` (+ componentes en `src/ui/components/map/`). Sustituye o complementa a `LevelSelect.tsx`. |
| Datos | `src/data/stations.ts`: `Readonly<Record<string, { x: number; y: number; label: string }>>` con coordenadas normalizadas (0..1) por id de nivel. **No** meter coordenadas en `LevelDef` (es un dato de UI). Prueba: todo id de `ALL_LEVELS` tiene estación. |
| Dibujo | SVG simplificado de la península (Chiapas/Tabasco, Campeche, Yucatán, Quintana Roo) con la vía; estaciones como botones accesibles (`<button>` con `aria-label`). |
| Tren | El tren se coloca en la última estación desbloqueada (`isUnlocked`) y se anima hasta la siguiente al completar un nivel (transición CSS/SVG; respetar `prefers-reduced-motion`). |
| Store | Añadir `'map'` a `Screen` en `appStore.ts` o reutilizar `'levels'`. La lógica de desbloqueo sigue en `store/progress.ts`. |

---

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
   | `pipe` | `['pipe', x, alto]` | Tubo de 2 columnas. |
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
   | `cannon` | `['cannon', x, y, dir]` | Cañón de baluarte de 2 bloques sólidos: culata `K` y boca `>` (dir 1) o `<` (dir -1). Se pisa como plataforma. |
   | `hoop` | `['hoop', x, y]` | Aro de piedra del juego de pelota en el bloque (x, y), no sólido (`entities/hoops.ts`). Al pasar la pelota (bloque `P`) por su centro se enciende una vez: +2000 puntos y 5 granos de cacao (incluidos en `totalCoins`). Va a `BuiltLevel.hoops`. |

   Atajos en `src/data/levels/helpers.ts`: `...coati(22, 32)`, `...urchin(26, 58)`, `...bats([20, 7], [48, 6])`. Añade un atajo por cada enemigo nuevo.
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
- `sanitizeProgress` **descarta cualquier id que no exista en `ALL_LEVELS`**. Si se cambia el id de un nivel sin migrar, el récord del jugador se pierde en silencio en la siguiente carga y se sobreescribe al guardar.
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
| **7 · Mundo 6** | Costa Maya y Bacalar | Temas `cliff`, `lagoon`, nivel sobre el tren en marcha (6-2), estromatolitos protegidos, jefe Lorencillo. |
| **8 · Coleccionables** | Glifos y boletos | Ops `glyph`/`ticket`, `LevelRecord.glyphs`, `Progress.tickets`, niveles extra por mundo, saneamiento retrocompatible. (Puede adelantarse si conviene.) |
| **9 · Final** | Calakmul, Camazotz y epílogo | Temas `batCave`, `deepJungle`, `throne`, niveles 7-1 a 7-3, jefe final de 3 fases, escena de rescate de Temayina, epílogo en tren (Centenario → Escárcega), créditos. |

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

### Controles móviles

- `ui/components/preventTouchZoom.ts` instala listeners nativos no pasivos en el mando para cancelar `touchstart/move/end`, gestos de Safari y doble clic. Las acciones siguen entrando por Pointer Events; los listeners se retiran al desmontar el mando. La protección se limita al mando y no cancela los clics de los menús. `imagenes/verify_touch_zoom.py` comprueba 12 saltos rápidos, escala constante y pausa táctil en Chromium y WebKit con emulación móvil; no sustituye una prueba en un teléfono físico.
- `Input.press/release` admiten un identificador de fuente: cada tecla o dedo conserva su pulsación hasta soltarla, sin cancelar otras fuentes de la misma acción. `reset` limpia las fuentes y los flancos de salto/fuego.
- `ui/components/touchInput.ts` gestiona dedos independientes y deslizamiento entre botones. Correr es un interruptor táctil; no requiere un tercer dedo sostenido. `TouchControls` refleja el estado activo, captura cada puntero y limpia sus entradas al desmontarse, perder foco o esconderse la página.
- Los botones usan una distribución adaptable sin solapamientos, blancos táctiles de al menos 44 px y márgenes para las áreas seguras del dispositivo. `imagenes/verify_touch.py` prueba tres tamaños con eventos táctiles de Chromium: carrera, tres dedos, salto y disparo simultáneos, deslizamiento, cancelación y pausa. Para comprobar el disparo concede el chile en la prueba; las capturas y resultados están en `imagenes/verificacion/movil/`.

### Expresiones de Temayin en la historia

- `data/temayinExpressions.ts` registra seis sprites transparentes (alegre, cariñoso, sorprendido, preocupado, decidido y atento), uno por escena de `data/intro.ts`. `INTRO_FILES` precarga todos los recursos. Los PNG originales, prompts y atlas están en `imagenes/nuevos/personajes/temayin-*`; los WebP sin pérdidas se sirven desde `public/assets/personajes/`.
- `data/intro.test.ts` comprueba que cada escena usa una expresión distinta y la precarga. `imagenes/verify_story.py` revisa las seis escenas y el regreso al título en escritorio y móvil horizontal; las capturas están en `imagenes/verificacion/historia/`.

### Presentaciones y escenarios de jefes

- Los decorados pintados se registran en `data/scenerySprites.ts` (ruta, recorte y ancla); `render/scenerySprites.ts` los dibuja con `bakedFrame`, sin React ni cambios a la simulación. `bossArena.ts` utiliza arcada de Izamal, guarida de Púas, mangles, ceibas y lianas, conservando el respaldo procedural. Los originales y prompts nuevos están en `imagenes/nuevos/escenarios/`, y los WebP sin pérdidas se sirven desde `public/assets/escenarios/`.
- Las antorchas de todos los niveles usan el recorte de `complementos/utileria.webp`, anclado por la llama a `level.lights`, con halo que parpadea. Las plataformas horizontales de las arenas de Kaimán y Huay Pek usan troncos de `mecanicas.webp`; sus bloques sólidos y sus cajas de colisión permanecen intactos. `PAINTED_ART` precarga los decorados y la vegetación.
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

### Ajustes del Mundo 2

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
- Jefe `huayChivo`: carpeta `bosses/huayChivo/`, seis PV, vulnerable tras chocar contra los bordes del atrio; segunda fase con oscuridad y más velocidad. Los arcos son escénicos. Abre el muro y el siguiente tramo al vencerlo.
- Los registros antiguos y los ids publicados se conservan. Cobertura específica: `src/engine/World3.test.ts`.

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
