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

En móviles aparecen controles táctiles (configurables en Ajustes).

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

- Mundo 1 · Selva y Costa: 1-1 La Selva, 1-2 La Playa, 1-3 La Guarida de Púas (jefe).
- Mundo 2 · Cenotes: 2-1 El Cenote Escondido, 2-2 Ríos Subterráneos (tema de cueva y murciélagos nuevos).
- Estrellas por nivel (completar, no morir + monedas), nivel desbloqueable, mejor puntuación guardada.

El arte fuente está en `imagenes/`; los sprites usados por el juego en `public/assets/`. La versión original en un único `index.html` queda en el historial de git.
