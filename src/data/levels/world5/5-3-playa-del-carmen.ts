import type { LevelDef } from '../../../engine/level/types';
import { coati, urchin } from '../helpers';

export const LEVEL_5_3: LevelDef = {
  id: '5-3',
  name: 'Playa del Carmen',
  width: 215,
  theme: 'beach',
  ops: [
    ['pit', 20, 22], ['pit', 40, 49], ['pit', 70, 73], ['pit', 98, 111], ['pit', 140, 143], ['pit', 160, 164],
    ['row', 12, 8, '?MF'], ['coins', 20, 8, 3],
    ['plat', 41, 9, 3], ['plat', 46, 7, 3], ['coins', 46, 5, 3],
    ['pipe', 30, 3], ['pipe', 55, 4], ['row', 60, 8, 'BLB?B'], ['row', 62, 4, 'M'],
    ['stairs', 66, 3, 1], ['stairs', 74, 3, -1],
    ['row', 82, 8, 'BBBBBB'], ['row', 82, 4, 'F?'], ['coins', 82, 7, 0],
    ['plat', 99, 9, 2], ['plat', 103, 7, 2], ['plat', 107, 9, 2], ['coins', 103, 5, 2],
    ['pipe', 115, 2], ['pipe', 122, 3], ['pipe', 129, 4],
    ['stairs', 136, 4, 1], ['stairs', 144, 4, -1],
    ['row', 150, 8, '?BLB?'], ['plat', 161, 9, 3],
    ['stairs', 175, 8, 1], ['col', 183, 8],
    ['flag', 193], ['temple', 198],
    ...coati(16, 35, 52, 63, 79, 88, 90, 125, 133, 152, 154, 171),
    ...urchin(26, 58, 85, 118, 148, 168),
  ],
};
