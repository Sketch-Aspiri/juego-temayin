import type { LevelDef } from '../../../engine/level/types';
import { bats } from '../helpers';

/** Ruta de grutas: luces de referencia, estalactitas con aviso y refugios sin enemigos. */
export const LEVEL_3_1: LevelDef = {
  id: '3-1', name: 'Maxcanú', width: 170, theme: 'cave', time: 330, checkpoint: 82,
  darkness: { radius: 165, alpha: 0.88 },
  hint: 'Los cristales iluminan el camino. Si una estalactita tiembla, ¡apártate!',
  ops: [
    ['row', 10, 8, '?BM?'], ['coins', 14, 10, 5], ['torch', 8, 10],
    ['plat', 22, 9, 4], ['coins', 22, 7, 4], ['spawn', 'scorpion', 32],
    ['spawn', 'stalactite', 36, 3], ['coins', 39, 10, 3],
    ['pit', 45, 48], ['plat', 46, 10, 2], ['coins', 46, 8, 2],
    ['row', 55, 8, 'BFB?'], ['torch', 60, 10], ['spawn', 'scorpion', 66],
    ['spawn', 'stalactite', 72, 2], ['plat', 75, 9, 4], ['coins', 75, 7, 4],
    // El checkpoint queda en terreno continuo e iluminado.
    ['torch', 83, 10], ['row', 86, 8, '?M?'], ['coins', 90, 10, 4],
    ['pit', 98, 101], ['plat', 99, 10, 2], ['coins', 98, 7, 4],
    ['spawn', 'stalactite', 109, 3], ['spawn', 'scorpion', 115],
    ['plat', 120, 9, 5], ['coins', 120, 7, 5], ['torch', 124, 8],
    ['spawn', 'stalactite', 131, 2], ['row', 137, 8, 'B?LB'],
    ['coins', 144, 10, 5], ['torch', 147, 10], ['flag', 154], ['temple', 159],
    ...bats([28, 6], [57, 5], [106, 6], [134, 6]),
  ],
};
