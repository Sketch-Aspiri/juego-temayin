---
description: Añade un enemigo, jefe, tema visual, power-up u op del DSL siguiendo las guías de AGENTS.md §6
argument-hint: "<enemigo|jefe|tema|powerup|op> <id> [descripción]"
---

Añade: $ARGUMENTS

1. Identifica el tipo y lee su guía en `AGENTS.md`: enemigo §6.3, jefe §6.5, tema §6.4, power-up §6.6, op del DSL §6.1 y §5. Confirma en §4.4–4.7 su descripción de diseño (comportamiento, punto débil, ¿pisable?).
2. `planificador`: lista exacta de archivos a tocar (id en tipos, registro, dibujo, atajo en `helpers.ts`, precarga de arte, `hudKey` si hay dato de HUD) y pruebas.
3. `ingeniero-motor` con TDD: pruebas primero (`World.test.ts` o módulo propio), luego implementación en archivos pequeños; registro tipado completo (TypeScript debe obligar a completar todos los casos).
4. `/verificar`.
5. En paralelo: `revisor-codigo`, `cazabugs`, `revisor-cultural` (si es criatura de leyenda, nombre o texto) y `perfilador` si va en rutas calientes.
6. Corrige CRITICAL/HIGH (máx. 2 vueltas) y `documentador` actualiza estados «Existe/Nuevo» y el árbol de carpetas. No hagas commit sin que se pida.
