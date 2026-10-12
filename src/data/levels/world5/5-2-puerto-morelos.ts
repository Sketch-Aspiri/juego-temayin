import type { LevelDef } from '../../../engine/level/types';
import { jellyfish, lionfish, morays } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_2: LevelDef = {
  id: '5-2', name: 'Puerto Morelos', width: 205, theme: 'reef',
  checkpoint: 98, time: 360,
  hint: 'Usa el snorkel de caracol y detente en las burbujas para recuperar oxígeno. ¡Cuidemos el arrecife del pez león invasor!',
  ops: [
    // Preparación en tierra; cada respiradero queda a doce bloques del siguiente.
    ['row', 9, 8, 'MS'], ['row', 11, 6, 'F'], ['pit', 16, 92], ['water', 16, 92, 3],
    ['bubbles', 20, 11], ['bubbles', 32, 11], ['bubbles', 44, 11],
    ['bubbles', 56, 11], ['bubbles', 68, 11], ['bubbles', 80, 11], ['bubbles', 90, 11],
    ['current', 24, 41, 5, 11, 0.8, 0],
    ['plat', 29, 12, 4], ['plat', 47, 11, 3], ['plat', 65, 12, 4],
    ['coins', 22, 8, 5], ['coins', 38, 6, 5], ['coins', 54, 9, 5],
    ['row', 59, 7, 'S'], ['coins', 74, 6, 5], ['coins', 85, 9, 4],
    // Islote seco para reaparecer con oxígeno completo y otro snorkel disponible.
    ['row', 99, 7, 'M'], ['row', 100, 5, 'S'], ['row', 101, 3, 'F'],
    ['pit', 104, 180], ['water', 104, 180, 3],
    ['bubbles', 108, 11], ['bubbles', 120, 11], ['bubbles', 132, 11],
    ['bubbles', 144, 11], ['bubbles', 156, 11], ['bubbles', 168, 11], ['bubbles', 178, 11],
    ['current', 114, 129, 5, 11, -0.6, 0], ['current', 148, 170, 5, 11, 1, 0],
    ['plat', 117, 12, 4], ['plat', 136, 11, 3], ['plat', 155, 12, 4],
    ['coins', 110, 8, 5], ['coins', 125, 6, 5], ['row', 141, 7, 'S'],
    ['coins', 145, 9, 5], ['coins', 160, 6, 5], ['coins', 174, 8, 4],
    ['flag', 187], ['temple', 188],
    ...lionfish([35, 8], [72, 7], [124, 8], [163, 7]),
    ...jellyfish([43, 6], [83, 7], [130, 6], [171, 7]),
    ...morays([30, 11], [48, 10], [118, 11], [137, 10]),
    ...waterBank(15, 3, 1), ...waterBank(93, 3, -1),
    ...waterBank(103, 3, 1), ...waterBank(181, 3, -1),
  ],
};
