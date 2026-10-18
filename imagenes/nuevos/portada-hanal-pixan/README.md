# Portada de Hanal Pixán

El menú principal reúne el Temayin alebrije de [la colección original](../../alebrijes-dia-de-muertos/README.md) y un nuevo fondo nocturno de Palenque: templos entre la selva, ofrenda iluminada, flores, camino de pétalos y Tren Maya al fondo. Ambos recursos se generaron con `image_gen` integrado. El fondo original está en [fondo.png](fondo.png) y su prompt exacto en [fondo.prompt.txt](fondo.prompt.txt); el prompt del personaje se conserva en el catálogo de alebrijes.

Es una composición de fantasía solicitada para el juego. La ofrenda toma como referencias el recuerdo de los seres queridos, la comida, la mesa, las flores y las velas descritos por la [Secretaría de Cultura](https://www.gob.mx/cultura/prensa/comparten-la-tradicion-de-la-ofrenda-hanal-pixan-en-altar-maya-en-el-museo-nacional-de-culturas-populares) y [Agricultura](https://www.gob.mx/agricultura/dgsiap/es/articulos/hanal-pixan-una-celebracion-entre-vivos-y-muertos-que-comienza-en-octubre). La ubicación en Palenque y la combinación con el alebrije son una interpretación artística, no una reconstrucción de una ceremonia local.

`node imagenes/import_title_hanal_art.mjs` exporta los recursos a `public/assets/portada/`: fondo WebP de calidad 90 y personaje WebP sin pérdidas, con alfa y colores visibles verificados frente al original. El personaje original se conserva sin cambios. Metadatos y tamaños en [exportacion.json](exportacion.json).

`src/ui/screens/TitleScreen.tsx` compone el menú y `src/ui/title.css` define encuadres de escritorio y móvil, contraste, botones y luciérnagas. Las animaciones se detienen con movimiento reducido. «Cómo jugar» permite consultar las teclas configuradas; se conservan Jugar, Historia, Ajustes, récord y nota de versión.

Revisión visual y de navegación: `node imagenes/verify_title_hanal.mjs`, con Vite en 5196 o `TEMAYIN_QA_URL`. Si Playwright no dispone de navegador, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` admite un navegador Chromium instalado. Se verificó con Edge en modo sin interfaz en cinco tamaños: 1440×900, 1920×1080, 390×844, 360×640 y 844×390. Capturas e informe en [la carpeta de revisión](../../verificacion/portada-hanal-pixan/).
