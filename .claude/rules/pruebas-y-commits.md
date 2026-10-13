# Pruebas, verificación y commits

## Pruebas
- Todo comportamiento nuevo lleva pruebas Vitest con patrón Organizar-Actuar-Comprobar y nombres descriptivos ("devuelve … cuando …").
- Primero la prueba en rojo, luego el mínimo código en verde, luego refactor. No se debilita ni borra una prueba para que pase: se corrige el código (salvo que la prueba sea errónea y se justifique).
- Motor: pruebas sobre `World` sin DOM. Store: pruebas puras. Niveles: la coherencia de `levels.test.ts` es obligatoria y recorre `ALL_LEVELS` sola.
- Sin archivos de prueba temporales en el repo (`*.tmp.test.ts`, `zz_*`): lo desechable va al scratchpad.

## Terminado significa (resumen de AGENTS.md §10)
1. `npm run build` y `npm test` en verde.
2. Pruebas nuevas para el comportamiento nuevo.
3. Revisión visual en navegador (`qa-navegador`), declarando sus límites (contacto protegido, daño asistido).
4. Progreso guardado intacto si se tocó `store`, ids o `Progress`.
5. Sin `console.log`, sin basura, texto en español, límites de tamaño respetados.
6. `AGENTS.md` y `README.md` actualizados si cambió arquitectura, DSL o lista de niveles.

## Commits
- Convencionales en español: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` (p. ej. `feat: añade nivel 1-2 Boca del Cerro`). Un cambio lógico por commit.
- No hagas commit ni push sin que la persona lo pida. Antes de commitear: `git diff` y `git status --short`; solo añade archivos de la tarea (`git add <rutas>`, no `git add -A`).
- Antes de cualquier commit pasa por `revisor-codigo`; si tocó entrada de usuario, persistencia o dependencias, también por `revisor-seguridad`.
