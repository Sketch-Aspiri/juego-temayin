# Revisión de Cancún y Puerto Morelos

Recorridos en Chromium con el motor real, movimiento mediante `Input` y protección contra daño de contacto. No se añaden poderes; el oxígeno, las corrientes, los bloques y las plataformas siguen activos. Esta revisión comprueba el recorrido, no la dificultad del combate sin asistencia.

Ambos niveles alcanzan el checkpoint y la meta. Puerto Morelos se recorre a media profundidad usando respiraderos; el mínimo de oxígeno observado queda registrado en `recorridos.json`. No hubo errores de página ni solicitudes fallidas.

Las capturas `inicio`, `mecanica` y `recorrido` muestran la entrada, una sección jugable y la meta. Las pruebas de `World5.test.ts` comprueban por separado daño de contacto, fuego, pelota, movimiento de enemigos, oxígeno, reaparición y conservación del récord de Playa del Carmen.

Para repetir con Vite disponible en el puerto 5197:

```powershell
npm run dev -- --host 127.0.0.1 --port 5197
python imagenes/verify_world5.py
```
