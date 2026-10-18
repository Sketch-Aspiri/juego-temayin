import type { LevelDef } from '../../../engine/level/types';
import { waterBank } from '../waterBanks';

export const BONUS_4: LevelDef = {
  id: '4-extra', name: 'El cenote de luz', width: 120, theme: 'cave', time: 300, checkpoint: 60,
  darkness: { radius: 240, alpha: 0.55 },
  hint: 'El boleto revela un cenote de fantasía. Sigue las luces y respira junto a las burbujas.',
  ops: [
    ['row', 10, 8, '?S?'], ['torch', 14, 9],
    ['pit', 20, 48], ['water', 20, 48, 7], ...waterBank(19, 7, 1), ...waterBank(49, 7, -1),
    ['bubbles', 24, 13], ['bubbles', 35, 13], ['bubbles', 45, 13],
    ['coins', 24, 10, 7], ['coins', 37, 11, 8], ['torch', 54, 9],
    ['row', 64, 8, 'LS'], ['torch', 68, 9],
    ['pit', 74, 94], ['water', 74, 94, 7], ...waterBank(73, 7, 1), ...waterBank(95, 7, -1),
    ['bubbles', 78, 13], ['bubbles', 89, 13], ['coins', 78, 10, 6], ['coins', 86, 11, 7],
    ['torch', 98, 9], ['flag', 104], ['temple', 109],
  ],
};
