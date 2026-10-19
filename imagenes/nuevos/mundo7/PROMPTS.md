# Arte del Mundo 7

Generado con `image_gen` integrado para esta implementación. Los PNG originales se copian del directorio de imágenes de Codex y se conservan sin modificar. `python imagenes/import_world7_art.py` exporta WebP sin pérdidas (`lossless=True`, `exact=True`) y comprueba igualdad de todos los píxeles RGBA. No se elimina ni reconstruye el alfa generado.

| Original | Recurso del juego | Uso |
|---|---|---|
| [efectos-camazotz.png](efectos-camazotz.png) | `public/assets/mundo7/efectos-camazotz.webp` y atlas JSON | Seis efectos transparentes: proyectil, fragmento, luz, viento, onda y Sol de Jade |
| [reencuentro.png](reencuentro.png) | `public/assets/mundo7/reencuentro.webp` | Temayin y Temayina abrazados, escena final |
| [xpujil-rio-bec.png](xpujil-rio-bec.png) | `public/assets/backgrounds/rioBec.webp` | Fondo nuevo de Xpujil |
| [calakmul-amanecer.png](calakmul-amanecer.png) | `public/assets/mundo7/calakmul-amanecer.webp` | Amanecer tras derrotar al jefe y reencuentro |
| [brasero-jade.png](brasero-jade.png) | `public/assets/mundo7/brasero-jade.webp` y atlas JSON | Recuperación del poder de fuego en la cámara |

Los recortes viven también en `src/data/world7Art.ts`. El brasero ocupa el rectángulo `[256,24,752,1128]`; su PNG completo permanece intacto. Los efectos conservan sus partículas separadas: no se aíslan por componente conexo. Los tamaños y rangos de alfa están en [exportacion.json](exportacion.json).

## Prompts y referencias

Especificaciones de las generaciones, con las referencias que se proporcionaron. No se generan glifos con significado atribuido ni se sustituyen los sprites existentes de combate.

### Efectos de Camazotz

Referencia de estilo: `public/assets/bosses/camazotz.webp`, inspeccionada previamente.

> Create a production sprite sheet of six isolated painterly 2D fantasy game effects for Temayin, matching the supplied Camazotz reference: bold dark outlines, rich violet, jade and warm gold, readable silhouettes. Transparent RGBA background. Arrange in a clearly separated 3 by 2 grid with generous transparent gutters. Top row: horizontal violet and gold magical bolt; vertical violet falling shard; small jade and gold collectible light mote. Bottom row: turquoise and gold wing gust; violet and gold ground shockwave; fully charged jade sun medallion with golden rays. Each effect complete, no overlapping cells. No characters, scenery, lettering, labels, checkerboard or opaque backdrop. Preserve glows on transparent alpha.

### Reencuentro

Referencias de identidad: `public/assets/guepardo.webp` y `public/assets/personajes/temayina.webp`, inspeccionadas previamente.

> One complete isolated sprite of Temayin and Temayina hugging happily after their reunion. Preserve the two supplied character identities: Temayin is the shorter golden spotted jaguar wearing his short green shirt; Temayina is slightly taller, wearing her teal tunic and golden belt. Both joyful, warm affectionate family adventure tone. Full bodies, tails and feet visible, no cropped anatomy. Painterly 2D platform game art with bold dark outlines matching the references. Centered composition with transparent margins. Transparent RGBA background, no scenery, cage, text or floor plane.

### Xpujil · Río Bec

> Wide painterly background for a family side-scrolling 2D game set in the real Xpujil archaeological site in Campeche. Depict the characteristic low Río Bec palace with three tall ornamental towers and false steep stairways, intact limestone architecture emerging from lush tropical forest. Warm late afternoon, turquoise blue sky, rich foliage and distant depth. Match the colorful hand-painted outlined adventure game style. Keep the foreground clear for composited gameplay. No characters, text, floating gameplay platforms or destroyed monuments. Do not depict Chichén Itzá or Aztec architecture. Landscape composition.

Referencia cultural contrastada con [INAH · Xpuhil](https://lugares.inah.gob.mx/es/node/4364). Es una ilustración del lugar, no una restitución arqueológica medida.

### Calakmul · Amanecer

> Wide landscape background for the happy ending of a painterly family 2D platform game. Real Calakmul in Campeche: a broad stepped limestone Maya pyramid rising above a vast rainforest canopy. Golden dawn sunlight, turquoise sky, soft clouds and morning mist over the jungle, hopeful luminous mood after the eclipse ends. Rich hand-painted game scenery with clear shapes. Room to composite characters in front. No eclipse, dark sun, characters, lettering, cage or foreground gameplay platforms. Architecture inspired by Calakmul, not Chichén Itzá.

### Brasero de jade

> Use case: stylized-concept. Asset type: one isolated transparent sprite for the painterly family 2D platform game Temayin. Primary request: a small magical fire brazier, front side-scroller view, complete from flame tips to base. Squat jade-green carved limestone pedestal with a wide shallow gold-rimmed stone bowl holding a vivid orange/gold flame with a turquoise heart, friendly Maya-inspired geometric ornament, thick dark brown outlines and painted shaded texture. The pedestal has a solid broad footing, not legs, about as tall as it is wide. Flame makes upper half, stone lower half. Readable at 60 pixels tall, centered composition, full object visible with generous transparent margins. It is a fantasy power refill shrine, no religious figure. No characters, no text, no symbols resembling letters, no scene, no floor plane, no cast ground shadow, no checkerboard. Actual transparent RGBA background; preserve flame glow on transparent alpha.

## Arte reutilizado

Las nueve poses de `bosses/camazotz.webp` se recortan y aíslan para no arrastrar partes vecinas. `backgrounds/batCave.webp`, `deepJungle.webp` y `throne.webp` aportan los escenarios existentes. Temayina, jaula de sombra, tren y Toh conservan su arte original. Los ecos muestran retratos de los seis jefes y proyectiles del atlas nuevo; cada uno tiene lógica de peligro propia.
