import type { LevelDef } from '../../../engine/level/types';
import { coati } from '../helpers';

export const LEVEL_1_1: LevelDef = {
  id: '1-1',
  name: 'Palenque',
  width: 205,
  theme: 'palenque',
  ops: [
    ['pit', 50, 52], ['pit', 95, 97], ['pit', 138, 141],
    ['row', 15, 8, '?'], ['row', 19, 8, 'B?BMB'], ['row', 21, 4, 'L'],
    ['pipe', 28, 2], ['pipe', 37, 3], ['pipe', 46, 4],
    ['coins', 49, 7, 5],
    ['pipe', 57, 3],
    ['row', 64, 8, 'BFB'], ['row', 67, 4, 'BBBBBBBB'], ['coins', 68, 3, 6],
    ['row', 78, 4, 'BBB?'], ['row', 81, 8, 'M'],
    ['row', 87, 8, 'BB'], ['coins', 94, 8, 4],
    ['row', 101, 8, '?'], ['row', 104, 8, '?'], ['row', 104, 4, 'M'], ['row', 107, 8, '?'],
    ['row', 113, 8, 'B'], ['row', 116, 4, 'BBB'], ['row', 123, 4, 'B?LB'], ['row', 124, 8, 'BB'],
    ['stairs', 132, 4, 1], ['coins', 137, 6, 5], ['stairs', 142, 4, -1],
    ['pipe', 150, 2], ['row', 155, 8, 'BB?B'], ['pipe', 163, 2],
    ['stairs', 168, 8, 1], ['col', 176, 8],
    ['flag', 185], ['temple', 190],
    ...coati(22, 32, 41, 43, 62, 64, 72, 75, 84, 86, 105, 110, 112, 120, 122, 127, 147, 155, 158, 160),
  ],
};
