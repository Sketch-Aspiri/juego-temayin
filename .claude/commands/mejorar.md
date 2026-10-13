---
description: Bucle multiagente de mejora (planificar → implementar → verificar → revisar → corregir) con límite de iteraciones
argument-hint: "<objetivo> [--iter N]"
---

Objetivo: $ARGUMENTS

Sigue `.claude/rules/bucles-multiagente.md` y `AGENTS.md`. Máximo de iteraciones: el valor de `--iter` si se indica; si no, **3**.

## Preparación
- `git status --short` para conocer el estado inicial. No toques archivos ajenos al objetivo.
- Si el objetivo es ambiguo o toca ids publicados, `STORAGE_KEY` o la forma de `Progress`, **pregunta antes de empezar**.

## Cada iteración
1. **Planificar** (solo la primera iteración, o al cambiar el alcance): lanza `planificador` con el objetivo y los hallazgos pendientes.
2. **Implementar**: reparte las tareas del plan entre `ingeniero-motor` y `disenador-niveles`. En paralelo solo con archivos disjuntos y `isolation: "worktree"`; si no, en serie. Cada tarea con TDD.
3. **Verificar**: ejecuta `/verificar` (tipos, pruebas, build). Si falla, corrige antes de revisar.
4. **Revisar en paralelo** (una sola respuesta): `revisor-codigo` siempre; más `cazabugs`, `guardian-progreso`, `revisor-seguridad`, `revisor-ux`, `revisor-cultural` o `perfilador` según lo tocado. Para jugar en navegador, `qa-navegador`.
5. **Consolidar y decidir**:
   - Cuenta hallazgos CRITICAL/HIGH verificados.
   - Si hay alguno → siguiente iteración con esa lista como objetivo (autor ≠ revisor).
   - Si no hay → pasa al cierre.
6. **Parada**: aplica las condiciones del protocolo (todo APROBADO, máximo de iteraciones, bucle atascado, riesgo de pérdida de progreso).

## Cierre
- `documentador` actualiza `AGENTS.md`/`README.md` si cambió arquitectura, DSL o lista de niveles.
- `/verificar` final y `git status --short` limpio de basura.
- Resumen honesto: qué cambió (archivos), pruebas añadidas, resultado de build/tests, hallazgos MEDIUM/LOW pendientes, qué **no** se verificó (jugabilidad real, dispositivos físicos).
- **No hagas commit** salvo que el usuario lo haya pedido; si lo pide, uno convencional en español por cambio lógico.
