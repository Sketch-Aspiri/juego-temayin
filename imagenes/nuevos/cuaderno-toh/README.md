# Arte del cuaderno de Toh

Dos imágenes creadas con la herramienta integrada `image_gen` para la interfaz del Cuaderno de explorador. Los prompts completos se conservan en [prompts.json](prompts.json).

- `pergamino.png`: hoja frontal de papel cálido con fibras, bordes gastados y grecas geométricas en jade y terracota. Es una interpretación de fantasía para el videojuego, no una reproducción de un códice ni escritura maya auténtica. No contiene glifos con significado inventado.
- `toh-guia.png`: ilustración de Toh posado en una rama, con transparencia real. Referencia de identidad: `imagenes/nuevos/personajes/toh.png`. Conserva la máscara negra, el pecho anaranjado, las alas jade/turquesa y las dos plumas de cola con puntas de raqueta. No sustituye el atlas de animaciones ni se presenta como una fotografía científica.

Los originales PNG se conservan aquí. `python imagenes/import_notebook_art.py` exporta los WebP a `public/assets/cuaderno/pergamino.webp` (1536×1024) y `public/assets/cuaderno/toh-guia.webp` (1254×1254). La conversión es sin pérdidas y el importador comprueba igualdad RGBA, incluidas las zonas transparentes del retrato.

`src/data/explorerNotebook/art.ts` registra los recursos de interfaz. El pergamino se aplica con `border-image` de nueve zonas: sus grecas quedan en el marco y la textura central sostiene el texto sin cruzar la decoración. El retrato se reutiliza en portada, encabezado y consejos mediante `NotebookToh`, que recurre al sprite original si falla la imagen nueva. Las URL respetan la ruta base de Vite y las imágenes no se incorporan a la precarga del motor.

Revisión: `python imagenes/verify_explorer_notebook.py`. Comprueba escritorio y móvil, carga del retrato, ausencia de fotos de destinos bloqueados, respaldo ante fallo del arte, navegación y conservación de la pausa/progreso. Evidencia regenerable en `imagenes/.temp/cuaderno-explorador/`.

Para revisar específicamente el arte compilado, ejecuta `npm run build`, sirve `npm run preview -- --port 5195` y lanza `python imagenes/verify_notebook_art.py`. `TEMAYIN_NOTEBOOK_ART_URL` permite cambiar esa URL. Las capturas de escritorio y tres tamaños móviles se guardan en `imagenes/.temp/cuaderno-pergamino/`. Esta revisión usa estados de colección preparados, comprueba la decodificación de la textura desde su URL real y detecta respuestas HTTP fallidas de los recursos nuevos; no modifica un perfil personal ni afirma que las páginas se hayan recogido jugando.
