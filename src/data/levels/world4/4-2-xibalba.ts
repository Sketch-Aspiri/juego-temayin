import type { LevelDef } from '../../../engine/level/types';
import { bats, coati, urchin } from '../helpers';

export const LEVEL_4_2: LevelDef = {
  id: '4-2',
  name: 'Xibalbá',
  width: 230,
  theme: 'cave',
  time: 360,
  ops: [
    ['pit', 24, 27], ['pit', 55, 66], ['pit', 90, 93], ['pit', 118, 131], ['pit', 160, 163], ['pit', 190, 199],
    ['row', 8, 8, '?M?'], ['coins', 12, 5, 4],
    ['pipe', 17, 3],
    ['plat', 56, 9, 3], ['plat', 61, 7, 3], ['coins', 61, 5, 3],
    ['row', 36, 8, 'BBF?B'], ['row', 38, 4, 'L'],
    ['stairs', 42, 4, 1], ['stairs', 48, 4, -1],
    ['pipe', 74, 2], ['pipe', 81, 4],
    ['row', 100, 8, 'B?B?B'], ['coins', 100, 4, 5],
    ['plat', 119, 9, 2], ['plat', 123, 7, 2], ['plat', 127, 9, 2], ['coins', 123, 5, 2],
    ['pipe', 138, 3], ['pipe', 146, 2],
    ['row', 150, 8, 'MBB'],
    ['plat', 161, 9, 2],
    ['stairs', 170, 6, 1], ['col', 177, 6], ['stairs', 178, 6, -1],
    ['plat', 191, 9, 2], ['plat', 195, 7, 2], ['coins', 195, 5, 2],
    ['row', 204, 8, '?L?'],
    ['flag', 212], ['temple', 217],
    ...coati(14, 33, 40, 70, 96, 108, 142, 156, 168, 206),
    ...urchin(30, 78, 104, 148, 187),
    ...bats([22, 6], [52, 5], [85, 6], [113, 5], [136, 6], [165, 5], [186, 6]),
  ],
};
