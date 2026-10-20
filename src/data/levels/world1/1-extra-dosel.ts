import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';

/** Desvío de fantasía: el cacao recompensa explorar las ramas y un acertijo de puntos y rayas abre el paso. */
export const BONUS_1: LevelDef = {
  id: '1-extra', name: 'El dosel del jaguar', width: 120, theme: 'jungle', time: 240, checkpoint: 60,
  hint: 'Los mayas contaban con puntos (1) y rayas (5). Salta y toca la piedra que vale lo que dice la estela.',
  ops: [
    ['row', 10, 8, '?M?'], ['plat', 18, 9, 4], ['plat', 25, 6, 5], ['plat', 33, 3, 5],
    ['coins', 18, 8, 4], ['coins', 25, 5, 5], ['coins', 33, 2, 5],
    ['pit', 42, 46], ['plat', 42, 8, 5], ['coins', 42, 7, 5],
    ['coins', 53, 10, 6], ['row', 64, 8, '?L?'],
    ['plat', 72, 9, 4], ['plat', 79, 6, 5], ['plat', 87, 3, 5],
    ['coins', 72, 8, 4], ['coins', 79, 5, 5], ['coins', 87, 2, 5],
    ['coins', 95, 10, 5],
    ...riddle({ id: '1-cuenta', prompt: '#13 = ?', answer: '13', stela: 89, firstStone: 92, stones: ['8', '12', '13', '18'], gate: 100 }),
    ['discovery', 102, 10, 'codice-cuenta'],
    ['flag', 105], ['temple', 110],
  ],
};
