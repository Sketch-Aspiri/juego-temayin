# Fotografías de las estaciones y destinos

Las 39 fotografías proceden de Wikimedia Commons. Se eligieron imágenes de los lugares reales o de un atractivo cercano identificado en la leyenda; ninguna es una ilustración generada. En Xibalbá se muestra el Cenote Sagrado de Chichén Itzá y en el Trono de Camazotz, una vista de la selva desde Calakmul. Ambas se presentan como referencias reales para escenarios ficticios.

[`sources.json`](sources.json) conserva por imagen el nombre original, URL del archivo y de la página de procedencia, autor, licencia, enlace a la licencia, fecha de consulta y cambios técnicos. La ficha muestra autor, procedencia y licencia. Cada fotografía conserva su licencia individual (CC BY, CC BY-SA, CC0 o dominio público); la licencia del código no sustituye la del material fotográfico.

La única transformación de los archivos es la corrección de orientación EXIF, reducción a un máximo de 800 píxeles y conversión a WebP con calidad 78. La interfaz ajusta el encuadre al espacio disponible; no se añaden ni se sustituyen elementos del paisaje. El aviso de adaptación está en el crédito de la ficha. Las fotografías de la guía del INAH no se han extraído para redistribuirlas.

## Reproducir la importación

```powershell
python imagenes/import_station_photos.py
```

Requiere Python con Pillow y curl. Descarga las versiones indicadas en el catálogo y conserva una caché en `imagenes/.temp/fichas-estaciones/originales/`, identificada por el id y la URL original para evitar reutilizar una foto anterior al cambiar la selección. El programa exporta `public/assets/estaciones/<id>.webp` y `src/data/stationInfo/photoManifest.ts`.

Para regenerar desde la caché sin descargar:

```powershell
python imagenes/import_station_photos.py --offline
```

Las fuentes y créditos se conservan en el repositorio; los originales descargados y las capturas de revisión quedan en la carpeta temporal ignorada. Al incorporar otra foto, verifica el contenido, la atribución y los términos en su página original antes de editar el catálogo.
