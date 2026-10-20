import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';
import { waterBank } from '../waterBanks';

export const BONUS_4: LevelDef = {
  id: '4-extra', name: 'El cenote de luz', width: 132, theme: 'cave', time: 300, checkpoint: 60,
  darkness: { radius: 240, alpha: 0.55 },
  hint: 'Respira junto a las burbujas. Los mayas contaban de veinte en veinte y la concha vale cero: ¿cuánto falta para veinte?',
  ops: [
    ['discovery', 15, 11, 'codice-cero-suma'],
    ['discovery', 69, 11, 'codice-completar-veinte'],
    ['row', 10, 8, '?S?'], ['torch', 14, 9],
    ['pit', 20, 48], ['water', 20, 48, 7], ...waterBank(19, 7, 1), ...waterBank(49, 7, -1),
    ['bubbles', 24, 13], ['bubbles', 35, 13], ['bubbles', 45, 13],
    ['coins', 24, 10, 7], ['coins', 37, 11, 8], ['torch', 54, 9],
    ['row', 64, 8, 'LS'], ['torch', 68, 9],
    ['pit', 74, 94], ['water', 74, 94, 7], ...waterBank(73, 7, 1), ...waterBank(95, 7, -1),
    ['bubbles', 78, 13], ['bubbles', 89, 13], ['coins', 78, 10, 6], ['coins', 86, 11, 7],
    ['torch', 98, 9], ['torch', 101, 9], ['torch', 107, 9],
    ...riddle({ id: '4-cero', prompt: '14 + ? = #20', answer: '6', stela: 100, firstStone: 102, stones: ['0', '5', '7', '6'], gate: 110 }),
    ['discovery', 112, 10, 'codice-cero'],
    ['flag', 115], ['temple', 120],
  ],
};
