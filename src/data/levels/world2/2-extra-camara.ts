import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';

/** Cámara ficticia: solo el escombro se derrumba, nunca los monumentos; la puerta de jade pide una suma. */
export const BONUS_2: LevelDef = {
  id: '2-extra', name: 'La cámara de jade', width: 128, theme: 'ruins', time: 240, checkpoint: 60,
  hint: 'Cruza el escombro antes de que caiga. Al final, suma con rayas y puntos para abrir la puerta de jade.',
  ops: [
    ['row', 10, 8, '?M?'], ['stairs', 18, 4, 1], ['coins', 21, 6, 4],
    ['pit', 28, 39], ['crumble', 28, 9, 4], ['crumble', 33, 9, 3], ['plat', 38, 9, 2],
    ['coins', 28, 7, 4], ['coins', 33, 7, 3], ['coins', 38, 7, 2],
    ['plat', 46, 8, 5], ['coins', 46, 7, 5], ['row', 64, 8, '?L?'],
    ['pit', 72, 83], ['plat', 72, 9, 3], ['crumble', 76, 9, 4], ['plat', 82, 9, 2],
    ['coins', 72, 7, 3], ['coins', 76, 7, 4], ['coins', 82, 7, 2],
    ['stairs', 90, 4, 1], ['coins', 93, 6, 4],
    ...riddle({ id: '2-suma', prompt: '9 + 8 = ?', answer: '17', stela: 96, firstStone: 98, stones: ['17', '16', '19', '15'], gate: 106 }),
    ['flag', 110], ['temple', 114],
  ],
};
