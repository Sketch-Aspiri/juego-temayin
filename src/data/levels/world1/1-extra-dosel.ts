import type { LevelDef } from '../../../engine/level/types';

/** Desvío de fantasía: el cacao recompensa explorar las ramas. */
export const BONUS_1: LevelDef = {
  id: '1-extra', name: 'El dosel del jaguar', width: 120, theme: 'jungle', time: 240, checkpoint: 60,
  hint: '¡Tu boleto abre este desvío! Sube por las ramas para encontrar el tesoro del dosel.',
  ops: [
    ['row', 10, 8, '?M?'], ['plat', 18, 9, 4], ['plat', 25, 6, 5], ['plat', 33, 3, 5],
    ['coins', 18, 8, 4], ['coins', 25, 5, 5], ['coins', 33, 2, 5],
    ['pit', 42, 46], ['plat', 42, 8, 5], ['coins', 42, 7, 5],
    ['coins', 53, 10, 6], ['row', 64, 8, '?L?'],
    ['plat', 72, 9, 4], ['plat', 79, 6, 5], ['plat', 87, 3, 5],
    ['coins', 72, 8, 4], ['coins', 79, 5, 5], ['coins', 87, 2, 5],
    ['coins', 95, 10, 5], ['flag', 102], ['temple', 107],
  ],
};
