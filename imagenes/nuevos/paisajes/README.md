# Paisajes de Temayin

18 panoramas PNG opacos, uno por tema de la sección 4.7 de `AGENTS.md`.
Arte creado con el generador de imágenes integrado; los prompts completos están en
los archivos `<id>.prompt.txt`. `catalogo.json` registra dimensiones reales, tamaño,
hash SHA-256 y rutas fuente/runtime.

Los PNG originales están en esta carpeta; sus copias están en
`public/assets/backgrounds/`. Se conservaron los WebP existentes.

Cada panorama se compone de planos de profundidad y una franja inferior de
contraste moderado para superponer el juego. Son fondos ilustrados, sin interfaz
ni sprites de personajes. La repetición horizontal sin costura no está verificada;
para desplazamiento continuo, revisar las uniones antes de usarlos como teselas.

Temas incluidos: `jungle`, `beach`, `lair`, `cave`, `river`, `swamp`, `ruins`,
`fortress`, `mangrove`, `hacienda`, `yellowCity`, `xibalba`, `reef`, `cliff`,
`lagoon`, `batCave`, `deepJungle` y `throne`.

El lote añade arte y sus copias de distribución. Su conexión a los temas del
motor se administra por separado.
