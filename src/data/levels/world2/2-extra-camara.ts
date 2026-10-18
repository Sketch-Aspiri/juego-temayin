import type { LevelDef } from '../../../engine/level/types';

/** Cámara ficticia: solo el escombro se derrumba, nunca los monumentos. */
export const BONUS_2: LevelDef = {
  id: '2-extra', name: 'La cámara de jade', width: 120, theme: 'ruins', time: 240, checkpoint: 60,
  hint: 'El boleto te trajo a una cámara secreta. Cruza el escombro antes de que caiga.',
  ops: [
    ['row', 10, 8, '?M?'], ['stairs', 18, 4, 1], ['coins', 21, 6, 4],
    ['pit', 28, 39], ['crumble', 28, 9, 4], ['crumble', 33, 9, 3], ['plat', 38, 9, 2],
    ['coins', 28, 7, 4], ['coins', 33, 7, 3], ['coins', 38, 7, 2],
    ['plat', 46, 8, 5], ['coins', 46, 7, 5], ['row', 64, 8, '?L?'],
    ['pit', 72, 83], ['plat', 72, 9, 3], ['crumble', 76, 9, 4], ['plat', 82, 9, 2],
    ['coins', 72, 7, 3], ['coins', 76, 7, 4], ['coins', 82, 7, 2],
    ['stairs', 90, 4, 1], ['coins', 93, 6, 4], ['flag', 102], ['temple', 107],
  ],
};
