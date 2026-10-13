---
description: Ejecuta las comprobaciones de terminado (tipos, pruebas, build) y resume el resultado
allowed-tools: Bash(npm run typecheck:*), Bash(npm test:*), Bash(npm run build:*), Bash(git status:*)
---

Verifica el estado del proyecto. Ejecuta en este orden y no continúes si una falla sin explicarlo:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `git status --short` y señala archivos basura (`*.tmp.test.ts`, `zz_*`, `*.stackdump`).

Informa: qué pasó, qué falló (con el error exacto y el archivo), y qué falta de la definición de terminado de `AGENTS.md` §10 que estos comandos no cubren (revisión visual, progreso guardado, documentación). Si todo está verde dilo en una línea; no adornes.
