---
description: Crea un nivel nuevo de principio a fin (diseño, datos, pruebas, QA, revisión)
argument-hint: "<id> <estación> [tema]   p. ej.: 6-1 Tulum cliff"
---

Crea el nivel: $ARGUMENTS

1. Lee `AGENTS.md` §4.3 (fila del nivel: lugar real, tema, mecánica clave, enemigos), §6.1 (DSL) y el nivel hermano más cercano. Comprueba que el id no está publicado (`Grep` en `src/data/`) y que existe el tema; si falta una mecánica, tema o enemigo, dilo y propón crearlo primero (`/nuevo-contenido`).
2. `planificador`: plan del nivel (zonas, qué enseña, enemigos, checkpoint, `hint` de Toh).
3. `disenador-niveles`: crea `src/data/levels/worldN/<id>-<estación>.ts`, regístralo en `WORLDS` y añade pruebas de equilibrio específicas.
4. `/verificar`.
5. En paralelo: `revisor-codigo`, `cazabugs`, `revisor-cultural` (consejo de Toh y topónimo), y `qa-navegador` (recorrido hasta checkpoint y meta).
6. Corrige CRITICAL/HIGH (máx. 2 vueltas), `documentador` actualiza `AGENTS.md`/`README.md` (tabla de niveles, estado implementado) y entrega resumen. No hagas commit sin que se pida.
