---
description: Sincroniza AGENTS.md y README.md con el código real tras un cambio
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*)
---

Lanza `documentador` con este contexto:

!`git log --oneline -8`
!`git status --short`

Debe contrastar `AGENTS.md` y la sección «Contenido actual» de `README.md` con el código (árbol de carpetas, ops del DSL, niveles, enemigos, jefes, estados «Existe/Nuevo», hoja de ruta, estado implementado), corregir lo obsoleto con cambios mínimos y reportar qué secciones tocó y qué quedó dudoso. El código manda sobre el documento. No hagas commit salvo que se pida (`docs: …`).
