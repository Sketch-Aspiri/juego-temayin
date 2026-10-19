import type { LevelDef } from '../../../engine/level/types';

export const BONUS_3: LevelDef = {
  id: '3-extra', name: 'El patio de las hamacas', width: 120, theme: 'hacienda', time: 240, checkpoint: 60,
  hint: '¡Un patio secreto! Déjate caer en las hamacas y busca cacao sobre los tejados.',
  ops: [
    ['row', 10, 8, '?M?'], ['hammock', 18, 12, 4], ['plat', 25, 6, 5], ['coins', 25, 4, 5],
    ['hammock', 37, 12, 4], ['plat', 44, 6, 5], ['coins', 44, 4, 5],
    ['coins', 53, 10, 6], ['row', 64, 8, '?L?'],
    ['hammock', 72, 12, 4], ['plat', 79, 6, 5], ['coins', 79, 4, 5],
    ['hammock', 87, 12, 4], ['plat', 94, 6, 5], ['coins', 94, 4, 5],
    ['flag', 104], ['temple', 109],
  ],
};
