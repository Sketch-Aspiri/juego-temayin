# Inventario de arte — Temayin

Coordinación de generación de imágenes, 9 de octubre de 2026.

## Actualización de imágenes existentes

| Recurso | Archivo del juego | Contrato actual |
| --- | --- | --- |
| Protagonista | `public/assets/guepardo.png` | 1360 × 800; 8 columnas × 5 filas; celdas de 170 × 160; correr, saltar, caer, reposo, victoria |
| Coatí | `public/assets/coati.png` | 1260 × 160; celdas de 140 × 80; 8 fotogramas de movimiento y 7 de derrota consumidos |
| Erizo | `public/assets/erizo.png` | 810 × 240; 9 columnas × 3 filas; celdas de 90 × 80 |
| Púas | `public/assets/jefe.png` | 1200 × 190; 5 poses de 240 × 190: reposo, caminar, correr, bola, derrota |
| Retrato de Púas | `public/assets/jefe_grande.png` | Retrato independiente para interfaz |
| Ilustración de título | `public/assets/jaguar_titulo.png` | Ilustración independiente para interfaz |

Los originales se conservan en `imagenes/originales/`. Las propuestas y sus prompts se guardan en `imagenes/actualizados/`. Una propuesta solo sustituye un recurso del juego después de verificar su compatibilidad; generar una imagen no significa haberla integrado.

## Pendiente del AGENTS.md de Claude

La creación de recursos faltantes y la definición de mecánicas esperan el archivo terminado en la raíz del proyecto, conforme a la solicitud del usuario.

Inventario del código previo a esas instrucciones:

- El murciélago ya tiene comportamiento, pero se dibuja con Canvas y carece de hoja raster.
- Los escenarios de selva, playa, guarida y cenote se dibujan con Canvas.
- Las monedas, vida, chile, escudo, fuego y púas se dibujan con Canvas.
- La bandera y la pirámide de meta se dibujan con Canvas; la bandera desciende durante la secuencia final.
- Los bloques, plataformas, tubos y superficies utilizan texturas procedurales.
- No se encontró un tren ni su comportamiento implementado.
- Hay cinco niveles repartidos entre dos mundos. El lienzo lógico mide 960 × 560 y cada bloque 40 × 40.

Este inventario no presupone cuáles serán las nuevas mecánicas. El AGENTS.md terminado determinará sus requisitos y la lista definitiva de recursos.

## Verificación inicial

- `npm test`: 68 pruebas aprobadas en 5 archivos.
- `npm run build`: compilación aprobada.

Estas comprobaciones corresponden al estado anterior a la sustitución de imágenes.
