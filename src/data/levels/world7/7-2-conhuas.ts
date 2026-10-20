import type { LevelDef } from '../../../engine/level/types';
import { bats, fireflies } from '../helpers';

export const LEVEL_7_2: LevelDef = {
  id: '7-2', name: 'Conhuas', theme: 'batCave', width: 200, time: 380, checkpoint: 100,
  darkness: { radius: 195, alpha: 0.82 }, decorativeWater: false,
  hint: 'Cerca de Conhuas está el Volcán de los Murciélagos. Los reales ayudan a la selva; estos guardianes de sombra son fantasía. Las luces marcan el camino.',
  ops: [
    ['discovery', 52, 11, 'conhuas-espiral'],
    ['discovery', 121, 11, 'conhuas-balamku'],
    ['row', 10, 8, '?MF'], ['coins', 18, 9, 5], ['pit', 30, 34], ['coins', 30, 8, 5],
    ['plat', 43, 9, 5], ['torch', 46, 8], ['coins', 43, 8, 5],
    ['spawn', 'stalactite', 55, 3], ['spawn', 'scorpion', 63], ['pit', 73, 78],
    ['plat', 85, 9, 5], ['coins', 85, 8, 5], ['row', 104, 8, 'MF?'], ['torch', 108, 10],
    ['coins', 112, 9, 5], ['pit', 123, 127], ['spawn', 'stalactite', 135, 3],
    ['plat', 142, 9, 5], ['coins', 142, 8, 5], ['spawn', 'scorpion', 150],
    ['pit', 160, 165], ['coins', 160, 8, 5],
    ...bats([24, 7], [41, 6], [49, 8], [87, 6], [95, 7], [117, 7], [143, 6], [156, 7], [174, 6]),
    ...fireflies([29, 9], [35, 9], [72, 9], [79, 9], [122, 9], [128, 9], [159, 9], [166, 9]),
    ['flag', 183], ['temple', 188],
  ],
};
