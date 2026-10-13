---
paths:
  - "src/store/**"
  - "src/data/worlds.ts"
---

# Progreso guardado (`src/store/`)

- **Nunca romper el progreso de los jugadores** (regla de oro 8). Todo lo que viene de `localStorage` es no confiable: pasa por `sanitizeProgress` / `sanitizeSettings` antes de usarse.
- El store **no muta**: devuelve objetos nuevos (ver `recordCompletion`).
- Clave actual `'temayin:v3'`; la antigua `'temayin:v2'` no se borra. Cambiar la forma de `Progress`/`LevelRecord`/`Settings` o los ids exige: nueva versión si rompe compatibilidad, migración pura en `migrations.ts` y pruebas.
- Campos nuevos son **opcionales con valor por defecto** al sanear (p. ej. `glyphs` = 0): los registros antiguos nunca se descartan.
- `isUnlocked` depende del orden de `ALL_LEVELS`: insertar niveles delante de otros ya completados no puede volver a bloquear al jugador.
- Pruebas obligatorias en `progress.test.ts` / `migrations.test.ts`: migración correcta de cada id, conservación de récords, datos v3 no se re-migran, datos corruptos → `EMPTY_PROGRESS`, nivel migrado sigue desbloqueado.
- Tras cualquier cambio aquí, pasa por `guardian-progreso`.
