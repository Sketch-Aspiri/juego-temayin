import type { LevelDef } from '../../../engine/level/types';

/** Desvío festivo independiente: nunca se inserta en la cadena de la campaña. */
export const HANAL_PIXAN_LEVEL: LevelDef = {
  id: 'especial-hanal-pixan', name: 'Hanal Pixán', theme: 'hanalPixan',
  width: 116, time: 300, checkpoint: 54,
  hint: 'Especial de temporada: sigue el cacao y las luces. Toh te espera a mitad del camino.',
  ops: [
    ['coins', 7, 10, 5], ['row', 12, 9, '?M?'],
    ['plat', 19, 10, 4], ['coins', 19, 9, 4],
    ['spawn', 'coati', 27], ['row', 31, 9, '?F?'],
    ['pit', 37, 40], ['coins', 36, 8, 6],
    ['plat', 45, 10, 4], ['coins', 45, 9, 4],
    ['firefly', 9, 8], ['firefly', 36, 7], ['firefly', 54, 8],
    ['row', 56, 9, 'M?F'], ['coins', 60, 10, 4],
    ['spawn', 'alux', 66], ['plat', 71, 10, 4], ['coins', 71, 9, 4],
    ['spawn', 'bat', 79, 6], ['coins', 79, 9, 5],
    ['pit', 86, 89], ['mover', 86, 10, 3, 2, 0, 4],
    ['coins', 85, 8, 6], ['firefly', 85, 7], ['firefly', 97, 8],
    ['spawn', 'ants', 96], ['coins', 98, 10, 4],
    ['flag', 103], ['temple', 106],
  ],
};
