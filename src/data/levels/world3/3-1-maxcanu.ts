import type { LevelDef, Op } from '../../../engine/level/types';
import { cavernCeiling } from '../caves';
import { bats } from '../helpers';

/**
 * Estalactita colgada de un saliente del techo con un cristal encima: el cristal
 * (luz propia del tema `cave`) la deja a la vista mientras tiembla, aunque el halo
 * del jugador no llegue tan arriba. `row` es la fila de la estalactita.
 */
const hangingStalactite = (x: number, row: number): Op[] => [
  ...cavernCeiling(x - 1, x + 1, row - 1),
  ['row', x - 1, row - 1, 'GXG'],
  ['spawn', 'stalactite', x, row],
];

/** Ruta de grutas: luces de referencia, estalactitas con aviso y refugios sin enemigos. */
export const LEVEL_3_1: LevelDef = {
  id: '3-1', name: 'Maxcanú', width: 170, theme: 'cave', time: 330, checkpoint: 82,
  darkness: { radius: 200, alpha: 0.8 },
  // Los hoyos de la gruta son secos y matan: no se pinta agua que sugiera nado.
  decorativeWater: false,
  hint: 'Los cristales iluminan el camino. Si una estalactita tiembla, ¡apártate!',
  ops: [
    ['discovery', 42, 11, 'maxcanu-formaciones'],
    ['discovery', 103, 11, 'maxcanu-murcielagos'],
    ['row', 10, 8, '?BM?'], ['coins', 14, 10, 5], ['torch', 8, 10],
    ['plat', 22, 9, 4], ['coins', 22, 7, 4], ['spawn', 'scorpion', 32],
    ...hangingStalactite(36, 3), ['coins', 39, 10, 3],
    ['pit', 45, 48], ['plat', 46, 10, 2], ['coins', 46, 8, 2],
    ['row', 55, 8, 'BFB?'], ['torch', 60, 10], ['spawn', 'scorpion', 66],
    ...hangingStalactite(72, 2), ['plat', 75, 9, 4], ['coins', 75, 7, 4],
    // El checkpoint queda en terreno continuo e iluminado.
    ['torch', 83, 10], ['row', 86, 8, '?M?'], ['coins', 90, 10, 4],
    ['pit', 98, 101], ['plat', 99, 10, 2], ['coins', 98, 7, 4],
    ...hangingStalactite(109, 3), ['spawn', 'scorpion', 115],
    ['plat', 120, 9, 5], ['coins', 120, 7, 5], ['torch', 124, 8],
    ...hangingStalactite(131, 2), ['row', 137, 8, 'B?LB'],
    ['coins', 144, 10, 5], ['torch', 147, 10], ['flag', 154], ['temple', 159],
    // El primer murciélago llega solo, cuando ya se practicó la estalactita.
    ...bats([57, 5], [106, 6], [134, 6]),
  ],
};
