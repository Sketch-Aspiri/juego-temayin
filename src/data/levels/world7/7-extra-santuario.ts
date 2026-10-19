import type { LevelDef } from '../../../engine/level/types';

export const BONUS_7: LevelDef = {
  id: '7-extra', name: 'El santuario del Sol de Jade', theme: 'batCave', width: 136, time: 300, checkpoint: 66,
  darkness: { radius: 190, alpha: 0.64 }, decorativeWater: false,
  hint: 'Tu boleto abre un santuario de fantasía. Las antorchas y el cacao dibujan el sendero del Sol de Jade.',
  ops: [
    ['row', 10, 8, '?M?'], ['torch', 16, 10], ['plat', 22, 9, 5], ['coins', 22, 8, 5],
    ['pit', 34, 38], ['coins', 34, 8, 5], ['plat', 44, 9, 4], ['plat', 50, 7, 5], ['coins', 50, 6, 5],
    ['torch', 59, 10], ['row', 70, 8, '?L?'], ['pit', 82, 87], ['coins', 82, 8, 6],
    ['plat', 94, 9, 4], ['plat', 100, 7, 5], ['coins', 100, 6, 5], ['torch', 111, 10],
    ['flag', 119], ['temple', 124],
  ],
};
