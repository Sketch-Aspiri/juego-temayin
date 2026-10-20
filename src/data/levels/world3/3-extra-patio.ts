import type { LevelDef } from '../../../engine/level/types';
import { riddle } from '../riddles';

export const BONUS_3: LevelDef = {
  id: '3-extra', name: 'El patio de las hamacas', width: 128, theme: 'hacienda', time: 240, checkpoint: 60,
  hint: 'Rebota en las hamacas. Al final, mira cuánto crece cada número de la estela: la serie sigue el mismo paso.',
  ops: [
    ['discovery', 29, 11, 'codice-quince'],
    ['discovery', 71, 11, 'codice-paso-serie'],
    ['row', 10, 8, '?M?'], ['hammock', 18, 12, 4], ['plat', 25, 6, 5], ['coins', 25, 4, 5],
    ['hammock', 37, 12, 4], ['plat', 44, 6, 5], ['coins', 44, 4, 5],
    ['coins', 53, 10, 6], ['row', 64, 8, '?L?'],
    ['hammock', 72, 12, 4], ['plat', 79, 6, 5], ['coins', 79, 4, 5],
    ['hammock', 87, 12, 4], ['plat', 94, 6, 5], ['coins', 94, 4, 5],
    ...riddle({ id: '3-serie', prompt: '3 8 13 ?', answer: '18', stela: 100, firstStone: 102, stones: ['19', '18', '16'], gate: 108 }),
    ['discovery', 110, 10, 'codice-serie'],
    ['flag', 113], ['temple', 118],
  ],
};
