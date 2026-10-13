---
description: Auditoría de UX/UI y accesibilidad (HUD, menús, mapa, controles táctiles, textos) con evidencias
argument-hint: "[pantalla o componente opcional]"
---

Audita la experiencia de usuario de: $ARGUMENTS (si está vacío, todas las pantallas: título, selección/mapa, juego, pausa, ajustes, resultados).

1. En paralelo:
   - `revisor-ux`: legibilidad del HUD, controles, flujo de pantallas, accesibilidad, texto en español.
   - `qa-navegador`: ejecuta `verify_touch.py`, `verify_touch_zoom.py` y `verify_story.py`, revisa capturas en escritorio y móvil horizontal.
   - `revisor-cultural`: textos visibles, tono y topónimos.
2. Consolida en tabla: `pantalla · problema · a quién afecta · mejora · esfuerzo (bajo/medio/alto)`.
3. Destaca las 3 mejoras de mayor impacto y pregunta si ejecutar `/mejorar` con ellas como objetivo.
