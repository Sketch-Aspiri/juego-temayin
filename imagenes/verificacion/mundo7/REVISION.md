# Revisión del Mundo 7

Verificación sobre la aplicación real en Chromium mediante `python imagenes/verify_world7.py` y `python imagenes/verify_peninsula_map.py`, con Vite en `http://127.0.0.1:5199`.

## Recorridos

| Nivel | Checkpoint y meta | Muertes con protección | Tiempo simulado |
|---|---|---|---|
| Xpujil | Sí | 0 | 22,87 s |
| Conhuas | Sí | 0 | 24,07 s |
| Calakmul | Sí | 0 | 26,35 s |
| Santuario secreto | Sí | 0 | 17,67 s |
| Trono de Camazotz | Sí; doce PV, tres fases, seis ecos y muro abierto | 0 | 124,99 s |

El controlador usa entradas reales de movimiento, salto y fuego, con física, colisiones, peligros y reloj activos. Protege del contacto para verificar continuidad; no teletransporta al jugador durante los recorridos ni aplica daño directo al jefe. El caso del boleto parte de una plataforma alta preparada y lo recoge con un salto físico, comprobando el guardado inmediato y la tarjeta de acceso al secreto. Estos tiempos no son una estimación de duración ni dificultad para una persona.

Se capturan inicio, checkpoint y meta de cada nivel; anuncio, aviso de picada, ventana vulnerable, descenso, antorchas, rayo, los seis ecos, amanecer y salida del jefe. La cámara oscura conserva visible a Camazotz, el brasero y las luces; el fondo de amanecer permanece hasta la bandera.

## Pantallas y progreso

- Combate en 1280×900, 390×844 y 844×390. Las arenas conservan su encuadre completo en vertical; HUD de objetivo y controles táctiles visibles.
- Las cuatro escenas finales se revisan en los tres tamaños: liberación, abrazo, mapa de regreso y agradecimiento. La finalización de `7-4` se registra una sola vez.
- Movimiento reducido muestra el trayecto de epílogo completo y el tren al final. El selector mantiene los siete tramos, sus nubes y el boleto del nuevo mundo.
- El mapa completo muestra 39 puntos disponibles y ninguna nube. Los perfiles nuevos y los récords aislados mantienen sus bloqueos.
- No se detectan errores de página ni recursos con respuesta HTTP de error en el recorrido del Mundo 7. [Informe automatizado](informe.json).

## Comprobaciones del proyecto

`npm run build` y `npm test` pasan: 120 archivos, 2025 pruebas aprobadas, 7 fallos esperados y 85 omitidas. La compilación mantiene el aviso de Vite sobre el tamaño del paquete principal.

Las pruebas nuevas verifican continuación desde `6-6`, checkpoint y reaparición, boleto, condiciones de daño, recuperación del fuego, luces, seis ecos y protección real de pilares ante el rayo y el viento. El guardado sigue usando `temayin:v3`; no se modifican ids ni récords anteriores.

Los cinco PNG generados se exportan sin pérdidas y conservan su alfa; el importador comprueba igualdad RGBA. [Arte y prompts](../../nuevos/mundo7/PROMPTS.md).
