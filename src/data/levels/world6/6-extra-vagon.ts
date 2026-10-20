import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';

export const BONUS_6: LevelDef = {
  id: '6-extra', name: 'El vagón del tesoro', width: 128, theme: 'jungleTrain', time: 240, checkpoint: 60,
  decorativeWater: false,
  hint: 'Un uinal del calendario maya son 20 días. Los numerales apilados cuentan veintenas: ¿cuántos días suma el de la estela?',
  ops: [
    ['row', 10, 8, '?M?'], ['col', 20, 2], ['col', 21, 2], ['coins', 20, 8, 4],
    ['plat', 28, 8, 5], ['coins', 28, 7, 5],
    ['pit', 38, 42], ['coins', 38, 8, 5], ['plat', 48, 8, 5], ['coins', 48, 7, 5],
    ['row', 64, 8, '?L?'], ['col', 73, 2], ['col', 74, 2], ['coins', 73, 8, 4],
    ['plat', 81, 8, 5], ['coins', 81, 7, 5], ['pit', 91, 95], ['coins', 91, 8, 5],
    ...riddle({ id: '6-uinal', prompt: '2/0 = ?', answer: '#40', stela: 98, firstStone: 100, stones: ['#2', '#22', '#40', '#400'], gate: 108 }),
    ['discovery', 110, 10, 'codice-uinal'],
    ['flag', 113], ['temple', 118],
  ],
};
