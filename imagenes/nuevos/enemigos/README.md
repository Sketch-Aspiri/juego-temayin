# Sprites de enemigos

19 hojas PNG con cuatro poses cada una: 76 fotogramas. Generadas con la herramienta integrada `image_gen`; los prompts finales están junto a cada hoja. Todas usan RGBA de 1254 × 1254 y fondo transparente real.

Los archivos `*.atlas.json` contienen los rectángulos reales de cada pose, sus estados y notas de revisión visual. Algunas poses exceden los cuadrantes nominales: usar los recortes indicados, normalizar escala y ancla antes de animarlas. El fondo generado puede tener alfa residual de 1–8; la inspección considera alfa > 8 para distinguir la silueta. No se han alterado los PNG generados.

`validar_atlas.py` recalcula los atlas de las 16 hojas completadas en esta tanda a partir de los componentes de alfa; necesita Pillow y NumPy. Los atlas de murciélago, saraguato y tarántula conservan los recortes revisados en la tanda anterior. El script no escribe imágenes.

Las hojas están copiadas en `public/assets/enemies/`, junto con todos los atlas. Murciélago, saraguato y tarántula conservan su WebP público existente. Las demás tienen copia PNG. Estos recursos permiten integrar el arte cuando corresponda; no añaden comportamientos al motor.

Notas: las rotaciones de la rueda son aproximadas. La vagoneta alterna ruedas en cruz y diagonal, con poses 1/3 y 2/4 similares. Barracuda y pirata cangrejo incluyen la estela del ataque en la pose final. La estalactita fragmentada conserva sus fragmentos dentro de un único recorte. Las leyendas se representan como criaturas fantásticas; el ajolote es fantástico, sin afirmar distribución biológica real.

`variantes/` conserva las primeras versiones del ajolote y de la Xtabay. Las versiones finales tienen más margen y menos efectos para facilitar los recortes.
