# Revisión del Mundo 4

`python imagenes/verify_world4.py` recorre los cinco niveles en Chromium contra el servidor de revisión en `127.0.0.1:5197`, iniciado con `npm run dev -- --config imagenes/qa-vite.config.ts --host 127.0.0.1 --port 5197 --strictPort`.

Usa controles reales de movimiento, salto y disparo, con ocho pasos de simulación por actualización. Protege al jugador del daño de contacto y concede pelota en 4-1 y chile en 4-5 para revisar sus mecánicas. No cambia las colisiones, el oxígeno ni las posiciones del jugador o los enemigos. Es una revisión asistida de recorridos y renderizado, no una medición de dificultad.

Los cinco recorridos llegan a la meta y al punto de control. Chichén Itzá registra un enceste; Xibalbá y Valladolid respiran en cuatro bolsas de aire cada uno; Huay Pek entra en su segunda fase y termina con cero PV. `recorridos.json` conserva los resultados y la lista vacía de errores de página y recursos.

Las capturas muestran la entrada y meta de cada nivel, el primer enceste y la segunda fase del jefe. Las pruebas de Vitest cubren también recogida de poderes, recompensas, zonas pegajosas, enemigos, fases del jefe, progreso y coherencia de niveles: 544 pruebas pasan, junto con el build de producción.
