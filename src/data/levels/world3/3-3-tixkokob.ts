import type { LevelDef } from '../../../engine/level/types';
import { coati } from '../helpers';

/** Hamacas trampolín de Tixkokob: la ruta alta ofrece cacao y la baja permite practicar. */
export const LEVEL_3_3: LevelDef = {
  id: '3-3', name: 'Tixkokob', width: 166, theme: 'hacienda', time: 330, checkpoint: 80,
  hint: 'Cae sobre una hamaca para rebotar alto. Busca el cacao entre los tejados.',
  ops: [
    ['row', 10, 8, '?M?'], ['hammock', 19, 12, 3],
    ['plat', 24, 6, 5], ['coins', 24, 4, 5], ['spawn', 'alux', 34],
    ['hammock', 41, 12, 3], ['plat', 47, 6, 4], ['row', 48, 3, '?L?'],
    ['pit', 56, 60], ['hammock', 53, 12, 3], ['plat', 57, 9, 2], ['coins', 57, 7, 2],
    ['row', 66, 8, 'BFB'], ['spawn', 'alux', 71], ['coins', 76, 10, 5],
    ['hammock', 84, 12, 3], ['plat', 89, 6, 5], ['coins', 89, 4, 5],
    ['spawn', 'alux', 101], ['hammock', 105, 12, 3], ['plat', 111, 6, 4],
    ['coins', 111, 4, 4], ['pit', 119, 123], ['plat', 120, 10, 2],
    ['row', 130, 8, 'B?MB'], ['hammock', 137, 12, 3],
    ['plat', 142, 7, 3], ['coins', 142, 5, 3], ['flag', 150], ['temple', 155],
    ...coati(30, 64, 96, 127),
  ],
};
