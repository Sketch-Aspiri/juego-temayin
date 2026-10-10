import type { LevelDef } from '../../../engine/level/types';
import { bats, coati, urchin } from '../helpers';

export const LEVEL_4_3: LevelDef = {
  id: '4-3',
  name: 'Valladolid',
  width: 190,
  theme: 'cave',
  ops: [
    ['pit', 30, 33], ['pit', 62, 70], ['pit', 100, 104], ['pit', 130, 139],
    ['row', 10, 8, '?B?'], ['coins', 14, 5, 4],
    ['pipe', 22, 2],
    ['row', 36, 8, 'B?BMB'], ['coins', 37, 4, 3],
    ['plat', 63, 9, 3], ['plat', 67, 7, 3], ['coins', 67, 5, 3],
    ['stairs', 44, 4, 1], ['stairs', 50, 4, -1],
    ['row', 78, 8, 'BFB'], ['row', 80, 4, '?'],
    ['pipe', 88, 3],
    ['row', 94, 8, 'BB'],
    ['plat', 101, 9, 2],
    ['row', 112, 8, 'B?LB'], ['coins', 113, 4, 3],
    ['plat', 131, 9, 3], ['plat', 135, 7, 3], ['coins', 135, 5, 3],
    ['stairs', 146, 5, 1], ['stairs', 152, 5, -1],
    ['row', 160, 8, '?M?'],
    ['flag', 172], ['temple', 177],
    ...coati(18, 40, 56, 84, 108, 120, 145, 158),
    ...urchin(26, 74, 116),
    ...bats([20, 7], [48, 6], [92, 6], [125, 7], [150, 5]),
  ],
};
