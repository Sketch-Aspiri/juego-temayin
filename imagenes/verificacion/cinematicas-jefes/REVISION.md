# Cinemáticas de los jefes · revisión

Se añadieron cinco capítulos de cuatro escenas: Kaimán Moreleti, Huay Chivo, Huay Pek, Capitán Sargazo y Lorencillo. Se reproducen al alcanzar la meta de sus niveles y se pueden repetir desde Historia. El prólogo y la victoria de Púas se conservan. Camazotz aparece como anticipo; su combate final sigue pendiente del Mundo 7.

El arte nuevo contiene diez poses de jefes, seis de Temayin y dos fondos completos. Se creó con `image_gen` integrado, usando los personajes existentes como referencia. Originales, prompts y atlas: `imagenes/nuevos/cinematicas/`; archivos utilizados: `public/assets/cinematicas/`. No se reemplazó el arte del combate.

## Validación

- `npm run build`: correcto. Vite conserva el aviso de tamaño del paquete principal superior a 500 kB.
- `npm test`: 102 archivos correctos; 1691 pruebas aprobadas, 7 fallos esperados y 85 omitidas.
- `python imagenes/import_cinematic_art.py`: WebP idénticos a sus PNG, transparencia conservada y recortes por alfa.
- `python imagenes/verify_boss_cinematics.py`: veinte escenas nuevas a 1280×900, 390×844 y 844×390; sin errores de JavaScript ni recursos HTTP fallidos. Comprueba conservación de todos los píxeles con alfa ≥ 8 en las dieciséis poses, desbloqueo por progreso, repetición sin recompensas, foco, toque/teclado, avance automático, rotación, omisión y Escape. Incluye la victoria de Púas desde un guardado v2 migrado en móvil horizontal.
- Los cinco finales se prepararon en la bandera, con el jefe ya vencido, para ejecutar la transición real de `Game` y `GameScreen`. Se comprobó que la cinemática oculta los resultados y pausa la sesión; terminarla u omitirla muestra los resultados sin duplicar la finalización. Los cuatro niveles con continuación conservaron 12345 puntos, 37 de cacao y 4 vidas. Chetumal volvió correctamente al selector. Esta prueba no recorre ni evalúa los combates.

Se revisaron las capturas: todas las poses caben en vertical; en móviles horizontales se separó la narración del escenario para evitar que tape los cuerpos. Se aisló la silueta de la tortuga de Akumal para excluir un fragmento vecino y se retiró el eclipse adicional sobre el fondo de Calakmul. La pose sentada de Temayin se apoya en el banco del nuevo interior del tren.

Capturas individuales e informe completo en `imagenes/.temp/cinematicas-jefes/`. La [vista previa](resumen.jpg) reúne una escena por jefe, la nueva pose sentada de Temayin y dos vistas móviles. `resultados.json` conserva el informe de los cinco finales y los tres formatos; `guardado-v2.json` conserva la regresión de Púas.

En Windows, si PowerShell bloquea `npm.ps1`, los comandos equivalentes son `npm.cmd run build` y `npm.cmd test`. Los verificadores requieren Pillow, Playwright y Chromium.
