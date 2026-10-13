---
description: Revisión multiagente en paralelo del diff actual (código, bugs, seguridad, UX, cultura según lo tocado)
argument-hint: "[rango git o ruta opcional]"
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

Objetivo de la revisión: $ARGUMENTS (si está vacío, el diff actual).

Cambios en el árbol de trabajo:
!`git status --short`
!`git diff --stat`

## Pasos
1. Decide qué revisores hacen falta según lo que cambió (lee `.claude/rules/bucles-multiagente.md`):
   - Siempre: `revisor-codigo`.
   - Si cambió `src/engine/` o `src/data/levels/`: `cazabugs`.
   - Si cambió `src/store/`, `worlds.ts`, ids o dependencias: `guardian-progreso` y `revisor-seguridad`.
   - Si cambió `src/ui/`, HUD, textos o controles: `revisor-ux`.
   - Si hay texto visible, Toh, personajes, jefes o arte nuevos: `revisor-cultural`.
   - Si se tocó bucle, render, atlas o carga: `perfilador`.
2. Lánzalos **todos en paralelo en una sola respuesta** (son de solo lectura salvo pruebas del `cazabugs`/`guardian-progreso`). Dale a cada uno el rango o archivos a revisar.
3. Consolida: une hallazgos duplicados, descarta los que no se puedan verificar en el código, ordénalos por gravedad.
4. Entrega una tabla `gravedad · ruta:línea · problema · arreglo · quién lo detectó` y un veredicto global (el peor de los veredictos).
5. No corrijas nada en esta pasada. Pregunta si quieres que lance `/mejorar` para arreglar los CRITICAL/HIGH.
