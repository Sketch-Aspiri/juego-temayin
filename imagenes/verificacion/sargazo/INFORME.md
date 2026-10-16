# Verificación de Capitán Sargazo · 16 de octubre de 2026

La arena de Akumal es completamente acuática y carece de bloques de refugio interiores. El encuentro tiene 12 PV, cuatro fases y seis patrones: salva, cortina, embestida, remolino, lluvia y enredo. Las tortugas permiten respirar, impulsarse y abrir el núcleo mediante rescates.

## Comprobaciones

- `npm run build`: correcto. Vite avisa del tamaño del paquete principal (505,98 kB; 166,05 kB gzip).
- `npm test`: 86 archivos aprobados; 1284 pruebas aprobadas, 7 fallos esperados y 62 omitidas.
- Revisión independiente del código: aprobada, sin hallazgos pendientes. Se corrigió la colisión de cortinas por encima de la superficie; hay regresión. También se comprueban el centro del remolino, el límite de proyectiles y el texto vertical.
- Chromium, desde checkpoint: victoria en 146,58 s simulados, 12 rescates, cuatro fases y los seis ataques observados. Oxígeno mínimo 8,35/10, sin fuego ni pelota, tortugas intactas y salida abierta. Cero errores de página o recursos.
- Chromium, desde inicio del nivel: checkpoint alcanzado y victoria, 12 rescates, cuatro fases, salida abierta; oxígeno mínimo 8,29/10. El informe de Mundo 5 conserva los resultados anteriores de los demás niveles.
- Móvil táctil 844 × 390 y 390 × 844: seis controles visibles, oxígeno y HUD visibles, sin desbordamiento. Se amplió el texto de ayuda dentro del encuadre vertical. QA independiente aprobó las fuentes finales y el núcleo centrado (`qa-nucleo-vertical.png`).
- Arte nuevo: originales y prompts conservados; WebP sin pérdidas comprobado píxel a píxel. Las capturas muestran jefe, tortugas y efectos sin restos de sprites vecinos.

## Límites y reproducción

Los recorridos protegen el daño al jugador. Usan entradas reales de movimiento, rescates por proximidad, colisiones y oxígeno; no alteran PV, fases ni vulnerabilidad del jefe ni aplican daño asistido. Las escenas de catálogo sí fijan estados para inspeccionar cada pose y aviso. La dificultad sin protección necesita valoración humana. La revisión móvil comprueba presentación y controles visibles, sin interacción táctil manual.

Con Vite en el puerto 5197:

```powershell
python imagenes/verify_sargazo_visuals.py
python imagenes/verify_world5.py 5-6
```

`informe.json` conserva métricas y catálogo. `movil-horizontal.png`, `movil-vertical.png`, `fase4-net-attack.png` y `fase1-exposed.png` muestran las vistas principales. `qa-semillas-activas.png` documenta proyectiles ya descendiendo en la revisión independiente.

Los ids, el orden de niveles, el esquema y la clave del guardado no cambian.
