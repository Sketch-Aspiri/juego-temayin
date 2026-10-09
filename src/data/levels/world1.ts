import type { LevelDef } from '../../engine/level/types';
import { coati, urchin } from './helpers';

export const LEVEL_1_1: LevelDef = {
  id: '1-1',
  name: 'La Selva',
  width: 205,
  theme: 'jungle',
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

export const LEVEL_1_2: LevelDef = {
  id: '1-2',
  name: 'La Playa',
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

/** Guarida del jefe: la arena va de la columna 50 a la 71, con muros en 49 y 72. */
export const LEVEL_1_3: LevelDef = {
  id: '1-3',
  name: 'La Guarida de Púas',
  width: 95,
  theme: 'lair',
  boss: { id: 'puas', x: 64, arena: [50, 71] },
  ops: [
    ['pit', 18, 20], ['coins', 18, 8, 3], ['row', 10, 8, '?MF'],
    ['pipe', 24, 3], ['row', 30, 8, 'BLB'], ['coins', 30, 4, 3],
    ['stairs', 36, 3, 1], ['coins', 39, 7, 2], ['stairs', 41, 3, -1],
    ['plat', 54, 8, 3], ['plat', 65, 8, 3], ['row', 61, 8, 'M'], ['row', 59, 8, 'F'],
    ['wall', 72],
    ['flag', 80], ['temple', 85],
    ...coati(14, 33),
    ...urchin(28, 45),
  ],
};
