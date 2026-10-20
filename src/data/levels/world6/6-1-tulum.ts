import type { LevelDef } from '../../../engine/level/types';
import { mesa } from '../caves';
import { blueCrab, nauyaca, urchin } from '../helpers';

/**
 * Tulum: ciudad amurallada sobre el acantilado frente al Caribe (AGENTS.md §4.3, Mundo 6).
 * Introduce el viento: térmicas (`wind` con vy < 0) que alargan el salto y ráfagas
 * horizontales suaves (≤ 2 bloques/s).
 *
 *   0-23    llanura de entrada, bloques y primer cangrejo azul
 *   24-43   ascenso por terrazas de roca (filas 10 → 4) hasta la cima (fila 3)
 *   44-53   descenso por terrazas hasta la meseta de la grieta
 *   54-63   la grieta: 10 columnas. Por arriba solo se salta dentro de la térmica
 *           (sin ella el salto en carrera no llega). Alternativa justa: tres losas
 *           escalonadas por el fondo de la grieta, con saltos de 1-2 bloques
 *   64-74   meseta de llegada y descenso por terrazas
 *   82-95   foso corto con viento de cara (-1,5 bloques/s): el salto sigue siendo cómodo
 *   108     punto de control seco, con chile de repuesto al alcance
 *   124-136 foso de 6 bloques con viento a favor (+2 bloques/s)
 *   140-155 ascenso opcional por losas con térmica: premio de cacao y corazón de jade
 *   156-209 último tramo llano, bandera y templo
 */
export const LEVEL_6_1: LevelDef = {
  id: '6-1',
  name: 'Tulum',
  width: 210,
  theme: 'cliff',
  checkpoint: 108,
  // TODO(cultura): confirmar con fuentes del INAH la redacción sobre Tulum (muralla, acantilado, nombre maya Zamá).
  hint: 'Tulum, la ciudad amurallada, vigila el Caribe desde su acantilado. Salta dentro de las térmicas para llegar más lejos.',
  ops: [
    ['discovery', 52, 8, 'tulum-muralla'],
    ['discovery', 122, 11, 'tulum-castillo'],
    // Llanura de entrada.
    ['row', 9, 8, '?M?'], ['coins', 14, 9, 5],
    // Terrazas de ascenso hasta la cima (fila 3) y descenso a la meseta de la grieta.
    ...mesa(24, 4, 10), ...mesa(28, 4, 8), ...mesa(32, 4, 6), ...mesa(36, 8, 4),
    ...mesa(44, 3, 6), ...mesa(47, 3, 8), ...mesa(50, 4, 9),
    ['coins', 25, 8, 2], ['coins', 29, 6, 2], ['coins', 33, 4, 2], ['coins', 37, 2, 6], ['coins', 51, 7, 3],
    // La grieta: térmica arriba, losas escalonadas abajo.
    ['pit', 54, 63],
    ['wind', 54, 63, 0, 11, 0, -6],
    ['plat', 55, 11, 2], ['plat', 58, 11, 2], ['plat', 62, 10, 2],
    ['coins', 55, 10, 2], ['coins', 58, 10, 2], ['coins', 62, 9, 2], ['coins', 56, 2, 6],
    // Meseta de llegada y descenso.
    ...mesa(64, 8, 9), ['row', 66, 5, '?'], ...mesa(72, 3, 10),
    ['coins', 65, 7, 4], ['coins', 73, 8, 2],
    // Foso con viento de cara.
    ['pit', 86, 90], ['wind', 82, 95, 0, 11, -1.5, 0], ['coins', 86, 9, 5],
    // Punto de control seco con chile de repuesto.
    ['row', 104, 8, '?M?'], ['row', 112, 8, '?F?'], ['coins', 116, 9, 4],
    // Foso con viento a favor.
    ['pit', 128, 133], ['wind', 124, 136, 0, 11, 2, 0], ['coins', 128, 9, 6],
    // Ascenso opcional con térmica.
    ['plat', 141, 9, 3], ['plat', 145, 6, 3], ['plat', 149, 3, 3],
    ['wind', 145, 153, 0, 11, 0, -4], ['coins', 141, 8, 3], ['coins', 145, 5, 3], ['row', 150, 0, 'L'],
    ['row', 162, 8, 'B?B'], ['coins', 168, 9, 5],
    ['flag', 190], ['temple', 196],
    ...blueCrab(20, 114, 160),
    ...urchin(100, 145, 172),
    ...nauyaca(118, 182), ['spawn', 'nauyaca', 69, 8],
  ],
};
