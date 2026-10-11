import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, pirateCrab, urchin } from '../helpers';

export const LEVEL_5_1: LevelDef = {
  id: '5-1', name: 'Cancún', width: 205, theme: 'beach',
  checkpoint: 96, time: 320,
  hint: '¡Rumbo al Caribe! Salta por las plataformas de madera y sube al techo del tren para cruzar la laguna.',
  ops: [
    // Primer paseo: plataformas escalonadas como toldos sobre la arena.
    ['row', 10, 8, '?MF'], ['plat', 20, 9, 4], ['plat', 26, 7, 4],
    ['coins', 20, 8, 4], ['coins', 26, 6, 4],
    ['pit', 34, 38], ['plat', 35, 9, 3], ['coins', 35, 8, 3],
    ['plat', 44, 9, 4], ['plat', 50, 7, 4], ['row', 56, 8, 'B?B'],
    // El tren permite cruzar en seco; el agua ofrece una segunda ruta segura.
    ['pit', 64, 87], ['water', 64, 87, 10],
    ['train', 64, 9, 2, 2.4, 14], ['coins', 69, 7, 6],
    ['bubbles', 76, 13], ['plat', 86, 9, 3],
    // Descanso y punto de control libre de enemigos antes del segundo muelle.
    ['row', 99, 8, 'M?F'], ['coins', 106, 10, 5],
    ['pit', 116, 128], ['water', 116, 128, 10],
    ['plat', 116, 9, 3], ['mover', 120, 9, 4, 4, 0, 4], ['plat', 127, 9, 3],
    ['coins', 122, 7, 4], ['plat', 138, 9, 4], ['plat', 145, 7, 4],
    ['coins', 145, 6, 4], ['row', 154, 8, '?LB'],
    ['pit', 162, 166], ['plat', 163, 9, 3], ['coins', 163, 8, 3],
    ['flag', 183], ['temple', 188],
    ...blueCrab(17, 42, 59, 111, 135, 173),
    ...pirateCrab(31, 54, 151), ...urchin(47, 108, 158),
  ],
};
