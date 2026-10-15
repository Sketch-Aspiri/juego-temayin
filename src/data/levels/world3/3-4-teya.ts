import type { LevelDef } from '../../../engine/level/types';

/** Hacienda nocturna: columpios accesibles desde plataformas, sin saltos a ciegas obligatorios. */
export const LEVEL_3_4: LevelDef = {
  id: '3-4', name: 'Teya', width: 206, theme: 'hacienda', time: 350, checkpoint: 86,
  darkness: { radius: 180, alpha: 0.85 },
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
    ['row', 135, 8, 'BFM?'],
    // Prueba final: la cuerda cruza un barranco ancho; quien no se agarra cae en la red de
    // escombro de la fila 11 y salta a la orilla (151) antes de que se hunda.
    ['plat', 140, 9, 3], ['pit', 143, 150], ['rope', 146, 3, 6], ['crumble', 147, 11, 2],
    ['coins', 145, 7, 4], ['torch', 152, 10], ['spawn', 'scorpion', 158],
    // Viga con farol: la estalactita cuelga de ella y se ve mientras tiembla.
    ['row', 161, 1, 'BBBB'], ['torch', 162, 2], ['spawn', 'stalactite', 163, 2],
    ['stairs', 167, 3, 1], ['plat', 170, 9, 4],
    ['stairs', 174, 3, -1], ['spawn', 'wheel', 171, 8], ['coins', 170, 7, 4],
    ['row', 180, 8, '?B?'], ['torch', 185, 10], ['flag', 190], ['temple', 195],
  ],
};
