import type { LevelDef } from '../../../engine/level/types';

export const BONUS_6: LevelDef = {
  id: '6-extra', name: 'El vagón del tesoro', width: 120, theme: 'jungleTrain', time: 240, checkpoint: 60,
  decorativeWater: false,
  hint: 'Tu boleto abre el vagón del tesoro. Explora las cajas y busca el cacao sobre el tren.',
  ops: [
    ['row', 10, 8, '?M?'], ['col', 20, 2], ['col', 21, 2], ['coins', 20, 8, 4],
    ['plat', 28, 8, 5], ['coins', 28, 7, 5],
    ['pit', 38, 42], ['coins', 38, 8, 5], ['plat', 48, 8, 5], ['coins', 48, 7, 5],
    ['row', 64, 8, '?L?'], ['col', 73, 2], ['col', 74, 2], ['coins', 73, 8, 4],
    ['plat', 81, 8, 5], ['coins', 81, 7, 5], ['pit', 91, 95], ['coins', 91, 8, 5],
    ['flag', 104], ['temple', 109],
  ],
};
