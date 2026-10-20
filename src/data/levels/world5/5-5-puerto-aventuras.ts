import type { LevelDef } from '../../../engine/level/types';
import { barracudas, blueCrab, jellyfish, pirateCrab } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_5: LevelDef = {
  id: '5-5', name: 'Puerto Aventuras', width: 205, theme: 'beach', checkpoint: 98, time: 340,
  hint: '¡De muelle en muelle! Los barcos se mecen: espera a que se acerquen para subir. Si caes al agua, busca las burbujas.',
  ops: [
    ['discovery', 61, 8, 'aventuras-chunyaxche'],
    ['discovery', 113, 8, 'aventuras-coba'],
    ['row', 10, 8, 'MFP'], ['plat', 21, 9, 4], ['coins', 21, 8, 4],
    ['pit', 30, 61], ['water', 30, 61, 10],
    ['plat', 30, 9, 3], ['boat', 34, 9, 5, 8, 0.6, 5],
    ['boat', 48, 9, 5, 7, 0.5, 6], ['plat', 60, 9, 3],
    ['bubbles', 38, 13], ['bubbles', 50, 13], ['bubbles', 60, 13],
    ['coins', 38, 7, 5], ['coins', 53, 7, 4],
    ['sargassum', 69, 75, 11], ['plat', 69, 9, 4], ['coins', 69, 8, 4],
    ['row', 82, 8, 'S?L'], ['row', 100, 8, 'MFP'],
    ['pit', 112, 157], ['water', 112, 157, 10],
    ['plat', 112, 9, 3], ['boat', 116, 9, 5, 9, 0.7, 5],
    ['boat', 134, 9, 5, 9, 0.5, 6], ['plat', 156, 9, 3],
    ['bubbles', 116, 13], ['bubbles', 128, 13], ['bubbles', 140, 13], ['bubbles', 152, 13],
    ['current', 120, 149, 10, 13, 0.7, 0],
    ['coins', 120, 7, 5], ['coins', 140, 7, 5], ['coins', 164, 10, 5],
    ['sargassum', 171, 176, 11], ['plat', 171, 9, 4],
    ['flag', 183], ['temple', 188],
    ...blueCrab(18, 66, 163), ...pirateCrab(26, 79, 107, 179),
    ...barracudas([43, 12], [126, 12]), ...jellyfish([54, 11], [146, 11]),
    ...waterBank(29, 10, 1), ...waterBank(62, 10, -1),
    ...waterBank(111, 10, 1), ...waterBank(158, 10, -1),
  ],
};
