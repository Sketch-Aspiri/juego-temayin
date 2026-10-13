---
paths:
  - "src/ui/**"
  - "src/App.tsx"
  - "src/styles.css"
---

# Interfaz (`src/ui/`, React)

- React solo para menús, HUD, pausa, progreso y ajustes. El juego se simula y dibuja en el `<canvas>` desde el motor; la UI no lee entidades, solo `HudState`.
- Todo texto visible en **español** natural y amable (tono de aventura familiar). Topónimos con acentos.
- Semántica: `<button>` para acciones (nunca `div` clicable), `aria-label` en botones de icono y en las estaciones del mapa, foco visible, orden de tabulación lógico.
- Contraste mínimo AA (4.5:1 texto, 3:1 iconos); no depender solo del color; respeta `prefers-reduced-motion` (tren del mapa, parpadeos).
- Táctil: blancos ≥ 44 px, sin solapes, márgenes de área segura, multitáctil con fuentes independientes; la protección anti-zoom se limita al mando (`preventTouchZoom.ts`) y no rompe los menús.
- Props con `interface`/`type` nombrados; sin `React.FC`; sin `any`; selectores de Zustand estables (no devuelvas objetos nuevos en cada llamada).
- Componentes pequeños (< 200 líneas típicas). Sin `console.log`.
- Cambios de UI → pruebas de componente con Vitest cuando haya lógica (ver `BossBanner.test.tsx`) y revisión de `revisor-ux`; si se toca la entrada, `qa-navegador` ejecuta `verify_touch.py`.
