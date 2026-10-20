import type { LevelDef } from '../../../engine/level/types';
import { nauyaca, tarantulas } from '../helpers';

export const LEVEL_7_1: LevelDef = {
  id: '7-1', name: 'Xpujil', theme: 'rioBec', width: 188, time: 360, checkpoint: 88,
  hint: 'Las tres torres de Xpuhil pertenecen al estilo Río Bec. Sus escalinatas son decorativas: sigue los senderos y las plataformas junto a ellas.',
  ops: [
    ['discovery', 102, 11, 'xpujil-tres-torres'],
    ['row', 10, 8, '?MF'], ['coins', 18, 9, 5], ['stairs', 22, 3, 1],
    ['pit', 32, 36], ['coins', 32, 8, 5], ['plat', 42, 9, 5], ['coins', 42, 8, 5],
    ['col', 54, 2], ['col', 55, 2], ['coins', 54, 8, 4], ['pit', 68, 72],
    ['plat', 77, 9, 4], ['row', 91, 8, 'MF?'], ['coins', 98, 9, 5],
    ['pit', 112, 116], ['plat', 122, 9, 4], ['plat', 128, 7, 5], ['coins', 128, 6, 5],
    ['crumble', 138, 9, 4], ['pit', 145, 150], ['plat', 155, 9, 5], ['coins', 155, 8, 5],
    ['spawn', 'shade', 104, 7], ...nauyaca(62, 135), ...tarantulas([45, 8], [125, 8]),
    ['flag', 171], ['temple', 176],
  ],
};
