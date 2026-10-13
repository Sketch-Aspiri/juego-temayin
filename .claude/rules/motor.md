---
paths:
  - "src/engine/**"
---

# Motor (`src/engine/`)

- TypeScript puro: **ni React ni DOM** salvo `render/` (canvas). `World` debe poder probarse sin navegador.
- El motor se comunica con React solo mediante `HudState` (`hud.ts`); todo campo nuevo entra también en `hudKey` (redondeado si cambia por fotograma).
- Mutación permitida únicamente en el estado caliente de la simulación (World, entidades, partículas). Nunca debe escapar al store: React recibe objetos `HudState` nuevos.
- Tiempo fijo `STEP = 1/120`: ninguna regla depende del framerate; el orden de actualización debe ser determinista. Usa el RNG sembrado (`makeRng`) donde las pruebas lo requieran; `Math.random` solo en efectos puramente visuales.
- Nuevo contenido = nueva entrada en su registro tipado (`ENEMIES`, `ENEMY_SPRITES`, `FACTORIES`, `THEMES`). No añadas `if` por tipo en `updateEnemies`; el comportamiento va en `EnemyDef.move`.
- Constantes con nombre; las globales en `constants.ts` (`T = 40`, `ROWS`, `GROUND`…). Sin números mágicos.
- Rutas calientes (bucle, colisiones, dibujo por fotograma): sin arrays, closures ni gradientes nuevos por paso; reutiliza lienzos y cachés (`artCache`, máscaras).
- Funciones < 50 líneas, anidación ≤ 4, archivos ≤ 400 líneas (800 máx.). Un jefe que crece se divide como `puas.ts` + `puasDraw.ts`.
- Comportamiento nuevo → prueba en `World.test.ts` o módulo propio (patrón Organizar-Actuar-Comprobar).
- Documenta las ops nuevas del DSL en el comentario de `level/types.ts`.
