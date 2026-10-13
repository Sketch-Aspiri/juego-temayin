import type { LevelDef, Op } from '../../../engine/level/types';
import { barracudas, nauyaca, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

/** Túnel submarino: techo de roca en la fila 7, con una salida abierta al final. */
const TUNNEL_X0 = 97;
const TUNNEL_X1 = 143;
/** Fila del techo del túnel (también es la superficie del agua). */
const TUNNEL_CEIL = 7;
/** Hueco de tres bloques para emerger antes de saltar sobre la pared sólida. */
const EXIT_OPENING_X = 141;
const EXIT_WALL_X = TUNNEL_X1 + 1;
const EXIT_WALL_TOP = TUNNEL_CEIL - 1;
/** Columna izquierda de cada bolsa de aire (2 columnas de ancho). */
const AIR_POCKETS = [107, 120, 132] as const;

const inPocket = (x: number): boolean => AIR_POCKETS.some((p) => x === p || x === p + 1);

/** Techo con bolsas de aire cerradas y una abertura final hacia el exterior. */
const tunnelCeiling = (): Op => {
  const blocks = Array.from({ length: TUNNEL_X1 - TUNNEL_X0 + 1 }, (_, i) => {
    const x = TUNNEL_X0 + i;
    return inPocket(x) || x >= EXIT_OPENING_X ? ' ' : 'X';
  });
  return ['row', TUNNEL_X0, TUNNEL_CEIL, blocks.join('')];
};

/** Bolsa de aire cerrada (2×2) sobre el hueco del techo: se respira sin poder salir del túnel. */
const airPocket = (x: number): Op[] => [
  ['row', x - 1, TUNNEL_CEIL - 3, 'XXXX'],
  ['row', x - 1, TUNNEL_CEIL - 2, 'X  X'],
  ['row', x - 1, TUNNEL_CEIL - 1, 'X  X'],
];

/** Muro de roca de la fila 0 a la `y1` (inclusive) en la columna x. */
const rockWall = (x: number, y1: number): Op[] =>
  Array.from({ length: y1 + 1 }, (_, y) => ['row', x, y, 'X'] as const);

/**
 * Candelaria: río Candelaria y sus rápidos (AGENTS.md §4.3). El nivel acuático más
 * difícil del Mundo 1 antes del jefe.
 *
 *   0-45     Orilla: bloques `?`, pozas pequeñas, una nauyaca emboscada en la hierba.
 *  46-79     Rápidos: tres tramos de río con troncos (plataformas) y corrientes que
 *            empujan a la derecha (3 → 4 → 4.5 bloques/s); barracudas saltando. Una
 *            nauyaca guarda la orilla del último rápido, a 4 bloques de donde se sale
 *            del anterior: fuera de su alcance de aviso al pisar tierra.
 *  80-91     Orilla de descanso con el punto de control de Toh (columna 84).
 *  92-143    Túnel submarino: se bucea bajo un muro de roca; corrientes que llevan
 *            hacia erizos, contracorriente con barracuda, 3 bolsas de aire y un
 *            respiradero de burbujas (OXYGEN_MAX = 10 s; tramos de ~11 bloques).
 *            Premio oculto: monedas y un `?` sobre el techo del túnel (se vuelve
 *            desde la abertura de salida).
 * 141-160    Salida superior: hueco de luz antes de una pared sólida, poza y troncos
 *            altos con un corazón de jade.
 * 161-199    Recta final hasta la bandera y el templo.
 */
export const LEVEL_1_5: LevelDef = {
  id: '1-5',
  name: 'Candelaria',
  hint: 'Los rápidos te arrastran: en el túnel, respira en las bolsas de aire.',
  width: 200,
  theme: 'river',
  checkpoint: 84,
  ops: [
    // --- Orilla ---
    ['row', 10, 8, '?'], ['row', 14, 8, 'B?B?B'], ['row', 16, 4, '?'],
    ['coins', 20, 7, 3],
    ['col', 26, 2],
    ['pit', 30, 32], ['water', 30, 32, 11], ['current', 30, 32, 11, 13, 2, 0], ['coins', 30, 8, 3],
    ['col', 37, 3], ['row', 40, 8, 'BFB'],

    // --- Rápidos con troncos ---
    ['pit', 46, 52], ['water', 46, 52, 11], ['current', 46, 52, 11, 13, 3, 0],
    ['plat', 49, 10, 2], ['coins', 47, 7, 5],
    ['row', 54, 8, '?B?'],
    ['pit', 57, 64], ['water', 57, 64, 11], ['current', 57, 64, 11, 13, 4, 0],
    ['plat', 59, 10, 2], ['plat', 62, 9, 2], ['coins', 62, 6, 2],
    ['row', 66, 8, 'B?B'],
    ['pit', 70, 79], ['water', 70, 79, 11], ['current', 70, 79, 11, 13, 4.5, 0],
    ['plat', 72, 10, 2], ['plat', 75, 8, 2], ['plat', 78, 10, 2],
    ['coins', 74, 3, 4],

    // --- Orilla del punto de control ---
    // Deja espacio para saltar por la escalera que contiene la entrada del túnel.
    ['row', 86, 8, 'B?M'], ['row', 89, 5, '?'], ['row', 90, 3, 'B'], ['coins', 87, 4, 3],

    // --- Túnel submarino ---
    ['water', 92, TUNNEL_X1, TUNNEL_CEIL],
    ['current', 92, 95, TUNNEL_CEIL, 9, 0, 2], // remolino que ayuda a bucear
    ...rockWall(96, TUNNEL_CEIL - 1),
    tunnelCeiling(),
    ...AIR_POCKETS.flatMap(airPocket),
    ['current', 97, 106, 8, 11, 3, 0], // empuja hacia el erizo de la 104
    ['coins', 98, 9, 4],
    ['current', 109, 119, 8, 11, -2.5, 0], // contracorriente
    ['coins', 111, 10, 6], ['bubbles', 116, 11], // respiradero en el tramo más lento
    ['current', 122, 131, 8, 11, 4, 0], // corriente fuerte sobre dos erizos
    ['coins', 124, 8, 7],
    ['coins', 135, 10, 4],
    // Premio oculto sobre el techo del túnel.
    ['coins', 135, 6, 5], ['row', 137, 3, '?'],

    // La pared cierra el agua; el hueco superior deja emerger y saltar por encima.
    ['coins', EXIT_OPENING_X, 5, 3], ['bubbles', 142, 11],
    // --- Poza de la cascada ---
    ['water', 146, 151, 9], ['current', 146, 148, 9, 11, 0, 3], // la cascada hunde
    ['current', 149, 151, 9, 11, 1.5, 0], // y luego arrastra hacia la salida
    ['plat', 147, 6, 2], ['plat', 150, 4, 2], ['row', 151, 1, 'L'],
    ['stairs', 152, 4, 1], ['stairs', 156, 4, -1],

    // --- Recta final ---
    ['row', 165, 8, 'B?B'], ['coins', 168, 7, 4],
    ['stairs', 172, 5, 1],
    ['flag', 182], ['temple', 188],

    ...nauyaca(22, 166), ['spawn', 'nauyaca', 69, 10],
    ...urchin(42, 104, 126, 129),
    ...barracudas([50, 12], [61, 12], [76, 12], [114, 9], [137, 10]),
    ...waterBank(29, 11, 1), ...waterBank(33, 11, -1),
    ...waterBank(45, 11, 1), ...waterBank(53, 11, -1),
    ...waterBank(56, 11, 1), ...waterBank(65, 11, -1),
    ...waterBank(69, 11, 1), ...waterBank(80, 11, -1),
    ...waterBank(91, 7, 1), ...waterBank(EXIT_WALL_X, EXIT_WALL_TOP, -1), ...waterBank(152, 9, -1),
  ],
};
