# Revisión del mapa de la península

Selector a pantalla completa con costa y fronteras de Natural Earth, posiciones WGS84 y niveles derivados del progreso existente. Chichén Itzá se identifica como zona arqueológica real; Xibalbá se presenta como escenario de fantasía independiente. Los destinos turísticos tienen referencias locales documentadas en `src/data/MAPA.md`.

## Comprobaciones

- `npm run build`: correcto.
- `npm test`: 117 archivos correctos, 1906 pruebas aprobadas, 7 fallos esperados y 85 omitidas ya contempladas por la suite.
- `python imagenes/verify_peninsula_map.py`: correcto, sin errores de JavaScript en Chromium.
- Partida nueva: únicamente Palenque iluminado; cinco mundos jugables y Calakmul bajo nubes. Un nivel bloqueado se puede consultar y no se puede iniciar.
- Completar Escárcega descubre Mundo 2; los mundos siguientes permanecen cubiertos. Un récord aislado de Playa del Carmen conserva su acceso sin abrir los mundos intermedios.
- Campaña descubierta: 35 estaciones iluminadas, seis secretos accesibles con sus boletos y Calakmul todavía pendiente.
- Acercamiento a los seis tramos, entrada real al prólogo de Palenque y al secreto del Mundo 6.
- Visor de 1440×1080, móviles de 390×844 y 320×740 y horizontal de 844×390: mapa ocupa el visor completo, sin desborde horizontal. Estrellas de al menos 28 px y cacao de al menos 19 px.
- Selección por teclado y toques emulados de Chromium; entrada a Playa del Carmen desde el punto geográfico.
- Cortina de nubes con fotogramas de apertura, posición intermedia y cierre completo. La interfaz permanece inerte durante la transición. El movimiento reducido omite la cortina y permite cambiar inmediatamente de pantalla.

Los perfiles de progreso se preparan únicamente en el navegador de QA. No se modifica el guardado de una sesión real ni la lógica de desbloqueo. Esta tarea cambia el selector, no los niveles ni la física; la revisión no recorre ni evalúa los combates.

## Capturas

- `inicial.png`, `mundo2-descubierto.png`, `campana-descubierta.png`: estados de progreso.
- `tramo-1.png` a `tramo-6.png`: acercamientos e itinerario desplegable.
- `movil-*.png` e `itinerario-*.png`: tamaño completo y controles flotantes.
- `nubes-apertura-cubierta.png`, `nubes-abriendo.png`, `nubes-mapa-revelado.png`, `nubes-cerrando.png` y `nubes-cierre-completo.png`: fotogramas de la cortina, con tiempos de animación preparados para permitir la inspección.
- `informe.json`: resultado de las comprobaciones automatizadas.
