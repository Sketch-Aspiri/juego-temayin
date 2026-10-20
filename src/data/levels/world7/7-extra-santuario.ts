import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';

export const BONUS_7: LevelDef = {
  id: '7-extra', name: 'El santuario del Sol de Jade', theme: 'batCave', width: 160, time: 360, checkpoint: 66,
  darkness: { radius: 190, alpha: 0.64 }, decorativeWater: false,
  hint: 'Dos puertas de jade guardan el santuario. Un numeral sobre una concha vale veinte veces más: 1 sobre la concha es 20. El Tzolk\'in suma 13 números por 20 nombres; el Haab, 18 meses de 20 días y 5 días más.',
  ops: [
    ['discovery', 31, 11, 'codice-combinaciones'],
    ['discovery', 78, 11, 'codice-wayeb'],
    ['row', 10, 8, '?M?'], ['torch', 16, 10], ['plat', 22, 9, 5], ['coins', 22, 8, 5],
    ['pit', 34, 38], ['coins', 34, 8, 5], ['plat', 44, 9, 4], ['plat', 50, 7, 5], ['coins', 50, 6, 5],
    ['torch', 59, 10], ['row', 70, 8, '?L?'], ['pit', 82, 87], ['coins', 82, 8, 6],
    ['plat', 94, 9, 4], ['plat', 100, 7, 5], ['coins', 100, 6, 5], ['torch', 111, 10],
    ['torch', 107, 9], ['torch', 120, 9], ['torch', 132, 9],
    ...riddle({ id: '7-tzolkin', prompt: '13 × 1/0 = ?', answer: '13/0', stela: 107, firstStone: 109, stones: ['1/13', '1/6', '18/0', '13/0'], gate: 117 }),
    ['discovery', 119, 10, 'codice-tzolkin'],
    ...riddle({ id: '7-haab', prompt: '18 × 1/0 + 5 = ?', answer: '18/5', stela: 124, firstStone: 126, stones: ['18/5', '18/0', '19/0', '13/5'], gate: 134 }),
    ['discovery', 136, 10, 'codice-haab'],
    ['flag', 140], ['temple', 145],
  ],
};
