import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';
import { waterBank } from '../waterBanks';

export const BONUS_5: LevelDef = {
  id: '5-extra', name: 'La caleta de las tortugas', width: 132, theme: 'reef', time: 300, checkpoint: 60,
  hint: 'Nada entre las tortugas: nunca reciben daño. En la orilla, lee el numeral de abajo hacia arriba: abajo van las unidades y arriba las veintenas.',
  ops: [
    ['row', 10, 8, '?S?'], ['pit', 20, 48], ['water', 20, 48, 6],
    ...waterBank(19, 6, 1), ...waterBank(49, 6, -1),
    ['turtle', 25, 7, 3, 5, 0.3, 6], ['turtle', 38, 8, 3, 4, -0.3, 7],
    ['bubbles', 24, 13], ['bubbles', 35, 13], ['bubbles', 45, 13],
    ['coins', 23, 10, 8], ['coins', 36, 11, 9], ['row', 64, 8, 'LS'],
    ['pit', 74, 94], ['water', 74, 94, 6], ...waterBank(73, 6, 1), ...waterBank(95, 6, -1),
    ['turtle', 78, 7, 3, 8, 0.2, 7], ['bubbles', 78, 13], ['bubbles', 89, 13],
    ['coins', 77, 10, 7], ['coins', 86, 11, 7],
    ...riddle({ id: '5-posicion', prompt: '1/3 = ?', answer: '#23', stela: 100, firstStone: 102, stones: ['#4', '#23', '#60', '#13'], gate: 110 }),
    ['discovery', 112, 10, 'codice-posicion'],
    ['flag', 115], ['temple', 120],
  ],
};
