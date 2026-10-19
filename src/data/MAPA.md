# Cartografía del selector

El mapa utiliza coordenadas WGS84, norte arriba y proyección equirectangular con paralelo de referencia 20° N. Comparte límites y proyección para costa, fronteras, estaciones, guías y nubes. Los puntos no se desplazan para acomodar el orden de los niveles; únicamente algunos rótulos tienen una guía hasta su posición real.

La línea une los 39 destinos en el orden de la campaña. No es una representación del trazado de las vías. Los siete secretos son escenarios de fantasía y aparecen en la ficha del mundo, sin asignarles coordenadas inventadas. Calakmul es el séptimo mundo jugable: sus nubes se despejan al completar Chetumal, siguiendo las mismas reglas de progreso que los demás mundos.

## Costa y fronteras

[Natural Earth, países a escala 1:10m](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson), en [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). Se recortan México, Belice, Guatemala y Honduras a la extensión del mapa y se simplifican únicamente segmentos inferiores a 0,65 unidades de dibujo. La costa mantiene lagunas e islas; no es un dibujo manual de la península.

Regeneración: `python imagenes/import_peninsula_map.py`. Se conserva cartografía adicional alrededor de la península (incluidas Cuba y Centroamérica) para llenar el visor al cambiar su proporción sin cortar artificialmente la tierra. El resultado está incluido en `peninsulaGeography.ts`, por lo que el juego funciona sin llamadas a servicios cartográficos.

## Estaciones

Coordenadas de [OpenStreetMap](https://www.openstreetmap.org), consultadas el 19 de octubre de 2026 mediante Overpass. © colaboradores de OpenStreetMap, [ODbL 1.0](https://www.openstreetmap.org/copyright). Los datos derivados se distribuyen bajo ODbL; los identificadores `osmWay` de `stations.ts` permiten consultar cada edificio en `https://www.openstreetmap.org/way/IDENTIFICADOR`. Las posiciones de polígonos corresponden al centro de su caja geográfica, con precisión suficiente para la escala del selector. No representan una puerta de entrada concreta.

Consulta reproducible: `[out:json][timeout:40];nwr[railway=station](17,-93,22,-86);out center tags;` en [Overpass](https://overpass.private.coffee/).

Las posiciones se contrastaron con la capa pública [Estaciones de SEMARNAT](https://geomaticasig1.semarnat.gob.mx/arcgis/rest/services/PenYucV2/Tren_Maya_F/MapServer/0). Esta capa contiene ubicaciones de proyecto y algunas columnas de latitud/longitud distintas de su geometría; se priorizaron los edificios cartografiados de OSM. La [Gran Guía del INAH](https://inah.gob.mx/data/trenmaya/guia/web/gran_guia_tren_maya.pdf) permite reconocer el recorrido regional.

Mérida se ancla a la estación Teya-Mérida; Cancún y Chetumal a sus estaciones del aeropuerto, no a los centros urbanos. Carrillo Puerto de Campeche y Felipe Carrillo Puerto de Quintana Roo tienen posiciones diferentes. Las etiquetas de estados son referencias regionales, sin inventar límites estatales.

## Destinos del juego que no equivalen a estaciones actuales

| Nivel | Referencia y precisión |
|---|---|
| Petenes | Punto regional en el sector costero de Los Petenes, al oeste de Tenabo; no afirma localizar un edificio ferroviario. El nombre del juego conserva un paradero de los planes originales. |
| Teya | Hacienda San Ildefonso Teya, junto a Mérida: 20°56′04″ N, 89°31′26″ O. No es el municipio de Teya ni una segunda estación Teya-Mérida. [Referencia de la hacienda](https://en.wikipedia.org/wiki/Hacienda_San_Ildefonso_Teya). |
| Xibalbá | Entrada ficticia al inframundo, anclada al entorno arqueológico de Chichén Itzá. No se presenta como paradero operativo ni como una ubicación verificable del inframundo. |
| Xcaret | Localidad/caleta de Polé: 20°34′41″ N, 87°07′09″ O. [SECTUR, Riviera Maya](https://www.sectur.gob.mx/wp-content/uploads/2015/02/PDF-Riviera-Maya.pdf). |
| Puerto Aventuras | Localidad: 20,5067 N, −87,2301 O; punto regional de la población, no edificio ferroviario. [OSM, localidad](https://www.openstreetmap.org/node/6209307874). |
| Akumal | Bahía/localidad: 20°24′00″ N, 87°19′16″ O. [SECTUR, Riviera Maya](https://www.sectur.gob.mx/wp-content/uploads/2015/02/PDF-Riviera-Maya.pdf). |
| Conhuas | Referencia regional de la localidad (18,535 N, −89,923 O), en el entorno de Balam Kú. No representa un edificio ferroviario ni afirma ser una estación operativa. |
| Trono de Camazotz | Escenario ficticio en el entorno arqueológico de Calakmul (18,105 N, −89,810 O). La estación real de Calakmul se sitúa al norte y corresponde a `7-3`, con su propio ancla de OSM. |

Estos matices conservan los nombres e ids publicados de la aventura sin atribuir precisión inexistente a escenarios regionales o ficticios. `stations.test.ts` exige cobertura de todos los niveles principales, posiciones dentro de la extensión y referencias distintas para los edificios ferroviarios.

El epílogo reutiliza esta cartografía y las posiciones de la campaña. El regreso narrativo pasa por Centenario (18,655836 N, −90,285856 O) hasta Escárcega. Sus segmentos son una guía del relato, sin pretender describir la geometría exacta de la vía.
