import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, pirateCrab, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_1: LevelDef = {
  id: '5-1', name: 'Cancún', width: 205, theme: 'beach',
  checkpoint: 96, time: 320,
  decorativeWater: false,
  hint: '¡Sube al tren para cruzar el primer foso! En el segundo, espera la plataforma móvil y salta sobre ella.',
  ops: [
    ['discovery', 50, 11, 'cancun-san-miguelito'],
    ['discovery', 131, 11, 'cancun-nichupte'],
    // Primer paseo: plataformas escalonadas como toldos sobre la arena.
    ['row', 10, 8, '?MF'], ['plat', 20, 9, 4], ['plat', 26, 7, 4],
    ['coins', 20, 8, 4], ['coins', 26, 6, 4],
    ['pit', 34, 38], ['plat', 35, 9, 3], ['coins', 35, 8, 3],
    ['plat', 44, 9, 4], ['plat', 50, 7, 4], ['row', 56, 8, 'B?B'],
    // Foso seco: hay que viajar sobre el tren; caer debajo pierde una vida.
    ['pit', 64, 87],
    ['train', 64, 9, 2, 2.4, 14], ['coins', 69, 7, 6],
    ['plat', 86, 9, 3],
    // Descanso y punto de control libre de enemigos antes del segundo muelle.
    ['row', 99, 8, 'M?F'], ['coins', 106, 10, 5],
    // Los muelles dejan un salto demasiado largo para cruzar sin la plataforma móvil.
    ['pit', 116, 128],
    ['plat', 116, 9, 2], ['mover', 120, 9, 4, 4, 0, 4], ['plat', 129, 9, 2],
    ['coins', 122, 7, 4], ['plat', 138, 9, 4], ['plat', 145, 7, 4],
    ['coins', 145, 6, 4], ['row', 154, 8, '?LB'],
    ['pit', 162, 166], ['plat', 163, 9, 3], ['coins', 163, 8, 3],
    ['flag', 183], ['temple', 188],
    ...blueCrab(17, 42, 59, 111, 135, 173),
    ...pirateCrab(31, 54, 151), ...urchin(47, 108, 158),
    ...waterBank(63, 10, 1), ...waterBank(88, 10, -1),
    ...waterBank(115, 10, 1), ...waterBank(129, 10, -1),
  ],
};
