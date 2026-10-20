# Fichas de viaje de Toh

Las 39 fichas de la campaña se consultan al seleccionar un destino en el mapa. El panel muestra la fotografía real y su crédito, un dato destacado de Toh, una descripción y dos datos adicionales desplegables. El botón Jugar permanece fijo mientras se lee. El itinerario y el secreto del tramo aparecen después de la ficha.

## Contenido y fuentes

`world1.ts` a `world7.ts` guardan el contenido editorial inmutable. `index.ts` reúne el catálogo por los ids publicados de `ALL_LEVELS`. No se incluyen secretos ni el especial de temporada, ni se modifica el motor o el guardado.

La fuente cultural es la [Gran Guía Tren Maya del INAH, edición 2023](https://www.trenmaya.gob.mx/images/granguiainah.pdf). El texto del juego es una redacción propia de sus datos, no una reproducción de los párrafos, las fotografías ni los mapas del PDF. Se evitan horarios, precios, servicios vigentes y datos de operación ferroviaria que requieren otra actualización.

Cada descripción y cada dato incluyen `GuideReference`: sección, intervalo de páginas impresas y página del archivo PDF. Esta edición tiene páginas dobles; por ejemplo, las impresas 22–23 están en la página 13 del archivo. `guide` calcula la correspondencia; `guideUrl` construye el enlace con `#page=`. La ficha muestra la numeración impresa y el nombre accesible del enlace incluye ambas numeraciones y la sección.

| Archivo | Destinos | Secciones principales de la guía (páginas impresas) |
|---|---|---|
| `world1.ts` | Palenque–Escárcega | Palenque (22–25), Pomoná y Usumacinta (34–37), Moral-Reforma y Wanha’ (42–45), Candelaria (46–47), Escárcega (52–53) |
| `world2.ts` | Carrillo Puerto–Calkiní | Champotón (54–55), Edzná (60–61), Campeche (68–69), Petenes (74–75), Tenabo (76–77), Hecelchakán (82–83), Calkiní (84–85) |
| `world3.ts` | Maxcanú–Izamal | Maxcanú (90–91), Mérida (106–115), Tixkokob (120–123), Izamal (128–129) |
| `world4.ts` | Chichén Itzá–Nuevo Xcán | Chichén Itzá (136–139), Valladolid (148–149), Nuevo Xcan (152–153), Leona Vicario (155) |
| `world5.ts` | Cancún–Akumal | Cancún (160–163), Puerto Morelos (172–173), Playa del Carmen (178–179), mapa y contexto costero de Tulum (184–195) |
| `world6.ts` | Tulum–Chetumal | Tulum (186–193), Felipe Carrillo Puerto (200–201), Limones-Chacchoben (204–205), Bacalar (210–212), Chetumal (218–222) |
| `world7.ts` | Xpujil–Trono de Camazotz | Xpujil (232–237), Calakmul, reserva y Balamkú (238–241) |

## Alcance geográfico y ficción

`relation` explica cómo se relaciona el contenido con el destino del juego; `STATIONS.kind` sigue indicando si el punto cartográfico es una estación, un lugar o ficción. No son clasificaciones equivalentes.

- `direct`: información del lugar o sus atractivos, con el nombre de cada atractivo explícito. No implica que la estación esté dentro de la ciudad arqueológica.
- `regional`: Teya, Xcaret, Puerto Aventuras, Akumal, Tulum Aeropuerto y Conhuas usan contexto regional de la guía. La nota visible aclara los límites. Los datos no atribuyen a una localidad los monumentos de otra.
- `fiction`: Xibalbá y el Trono de Camazotz conservan una descripción narrativa con `source: 'game'`. Sus datos culturales describen Chichén Itzá o Calakmul y tienen fuentes independientes. La fotografía muestra un lugar real de referencia, identificado como tal.

Carrillo Puerto-Champotón, Campeche, y Felipe Carrillo Puerto, Quintana Roo, tienen fichas distintas. Mérida, Cancún y Chetumal conservan sus referencias ferroviarias. Los puntos regionales y ficticios no se presentan como estaciones operativas.

## Fotografías

`photos.ts` tipa el catálogo, y `photoManifest.ts` se genera desde [`imagenes/fotos-estaciones/sources.json`](../../../imagenes/fotos-estaciones/sources.json). Los 39 WebP están en `public/assets/estaciones/`. Cada imagen tiene texto alternativo, leyenda, autor, enlace de procedencia, licencia y alcance (`place` o `surroundings`). Las fotos de los dos escenarios ficticios identifican expresamente el entorno real.

Las imágenes se sirven con `assetUrl`, respetando la ruta base de Vite. Solo se monta la foto del destino seleccionado: no se precarga toda la colección ni se consulta un servicio externo durante la lectura. Un fallo de imagen muestra un aviso y mantiene la ficha y el enlace al original. Las fichas y fotos están incluidas en el build; el arranque web sin red sigue dependiendo de que el sitio esté disponible o en caché, sin añadir un modo PWA.

## Interacción y accesibilidad

`StationInfoCard` presenta contenido y fuentes; `StationPhoto` maneja la imagen y su respaldo. `MapItinerary` conserva las reglas de desbloqueo, los récords y los boletos. Seleccionar desde la lista mueve el foco al título y vuelve al inicio del panel; los marcadores conservan su foco y la cámara libre. Cambiar de destino cierra los datos desplegados. Escape y Cerrar devuelven el foco al botón Estaciones.

Una región de estado anuncia solo el nombre seleccionado. El texto largo no se anuncia completo en cada selección. El panel tiene desplazamiento propio y deja fijos el cierre y la salida. No incorpora animaciones nuevas.

## Verificación

- `npm test -- src/data/stationInfo src/ui/components/map/StationInfoCard.test.tsx`: cobertura completa, tres datos por destino, referencias, ficción, secretos, bloqueos, fotos locales y créditos.
- `python imagenes/verify_station_info.py`: revisión real en Chromium de las 39 fichas, fotografías, foco, expansión, Escape, lectura de bloqueadas, guardado intacto, récord aislado, errores de imagen, lectura con servicios externos bloqueados y entrada a Tulum. Comprueba toque y salida fija en 390×844, 320×740 y 844×390. Usa un perfil aislado y estados de QA; no altera los datos de un navegador personal.
- Evidencia generada en `imagenes/.temp/fichas-estaciones/revision/`; no sustituye una revisión en un teléfono físico.

Para ampliar o corregir una ficha, modifica su archivo de mundo y conserva la referencia por afirmación. Las fotos se cambian en el catálogo de procedencias y se reimportan; no edites el manifiesto generado a mano.
