import type { LevelDef } from '../../../engine/level/types';

/** Hacienda nocturna: columpios accesibles desde plataformas, sin saltos a ciegas obligatorios. */
export const LEVEL_3_4: LevelDef = {
  id: '3-4', name: 'Teya', width: 174, theme: 'hacienda', time: 350, checkpoint: 86,
  darkness: { radius: 195, alpha: 0.8 },
  hint: 'Toca el extremo de la cuerda en el aire. Usa ← → y pulsa salto para soltarla.',
  ops: [
    ['torch', 8, 10], ['row', 11, 8, '?M?'], ['plat', 19, 9, 4],
    ['rope', 26, 3, 6], ['pit', 24, 28], ['plat', 25, 10, 2], ['coins', 29, 8, 4],
    ['spawn', 'alux', 36], ['torch', 39, 10], ['row', 43, 8, 'BFB'],
    ['spawn', 'wheel', 51], ['plat', 57, 9, 3], ['rope', 64, 3, 6],
    ['pit', 62, 66], ['plat', 63, 10, 2], ['coins', 66, 7, 5],
    ['torch', 75, 10], ['row', 81, 8, '?L?'],
    ['torch', 87, 10], ['coins', 89, 10, 4], ['spawn', 'alux', 98],
    ['plat', 104, 9, 4], ['rope', 111, 3, 6], ['pit', 109, 113], ['plat', 110, 10, 2],
    ['coins', 114, 7, 4], ['torch', 122, 10], ['spawn', 'wheel', 129],
    ['row', 135, 8, 'BFM?'], ['rope', 143, 3, 6], ['coins', 145, 8, 4],
    ['torch', 153, 10], ['flag', 158], ['temple', 163],
  ],
};
