import type { LevelDef } from '../../../engine/level/types';
import { coati, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_3: LevelDef = {
  id: '5-3',
  name: 'Playa del Carmen',
  width: 215,
  theme: 'beach',
  checkpoint: 94,
  hint: 'Salta por las pasarelas para evitar el sargazo que frena tus pasos. El fuego lo elimina solo en esta aventura: en la vida real, cuidamos la playa y el mar.',
  ops: [
    ['pit', 20, 22], ['pit', 40, 49], ['pit', 70, 73], ['pit', 98, 111], ['pit', 140, 143], ['pit', 160, 164],
    ['row', 12, 8, '?MF'], ['coins', 20, 8, 3],
    ['water', 40, 49, 10], ['water', 98, 111, 10],
    ['water', 20, 22, 10], ['water', 70, 73, 10], ['water', 140, 143, 10], ['water', 160, 164, 10],
    ['bubbles', 44, 13], ['bubbles', 104, 13],
    ['sargassum', 34, 38, 11], ['sargassum', 86, 91, 11], ['sargassum', 153, 158, 11],
    ['plat', 34, 9, 3], ['plat', 87, 6, 3], ['row', 95, 6, 'MF'],
    ['plat', 41, 9, 3], ['plat', 46, 7, 3], ['coins', 46, 5, 3],
    ['pipe', 30, 3], ['pipe', 55, 4], ['row', 60, 8, 'BLB?B'], ['row', 62, 4, 'M'],
    ['stairs', 66, 3, 1], ['stairs', 74, 3, -1],
    ['row', 82, 8, 'BBBBBB'], ['row', 82, 4, 'F?'], ['coins', 82, 7, 0],
    ['plat', 99, 9, 2], ['plat', 103, 7, 2], ['plat', 107, 9, 2], ['coins', 103, 5, 2],
    ['pipe', 115, 2], ['pipe', 122, 3], ['pipe', 129, 3],
    ['stairs', 136, 4, 1], ['stairs', 144, 4, -1],
    ['row', 150, 8, '?BLB?'], ['plat', 161, 9, 3],
    ['stairs', 175, 4, 1], ['col', 179, 4],
    ['flag', 193], ['temple', 198],
    ...coati(16, 35, 63, 79, 88, 90, 125, 133, 152, 154, 171), ['spawn', 'coati', 52, 9],
    ...urchin(26, 58, 85, 118, 148, 168),
    ...waterBank(19, 10, 1), ...waterBank(23, 10, -1),
    ...waterBank(39, 10, 1), ...waterBank(50, 10, -1),
    ...waterBank(69, 10, 1), ...waterBank(97, 10, 1), ...waterBank(112, 10, -1),
    ...waterBank(159, 10, 1), ...waterBank(165, 10, -1),
    // El muelle mantiene la altura de la orilla hasta el tubo: el siguiente salto mide dos bloques.
    ['row', 50, 10, 'GGGGG'], ['row', 50, 11, 'GGGGG'],
  ],
};
