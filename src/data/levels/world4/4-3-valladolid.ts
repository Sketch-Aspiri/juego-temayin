import type { LevelDef } from '../../../engine/level/types';
import { cavernCeiling, floodedTunnel, mesa, rockBlock } from '../caves';
import { axolotls, bats, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_4_3: LevelDef = {
  id: '4-3',
  name: 'Valladolid',
  width: 216,
  theme: 'cave',
  time: 360,
  checkpoint: 99,
  darkness: { radius: 230, alpha: 0.5 },
  hint: 'Busca las bolsas de aire sobre el agua para recuperar el oxígeno.',
  ops: [
    // Plaza de entrada y terrazas de descenso al cenote Zací.
    ['row', 9, 8, '?M?'], ['coins', 14, 5, 4],
    ['stairs', 18, 4, 1], ...mesa(22, 4, 8),
    ['coins', 22, 7, 4], ['torch', 24, 6],
    // Primera galería: el pilar exige bucear; las bolsas permiten respirar.
    ['water', 28, 86, 5], ...cavernCeiling(35, 80, 2),
    ['coins', 30, 7, 3], ['coins', 33, 10, 4],
    ...rockBlock(39, 1, 2, 4), ...floodedTunnel(40, 79, 5, [50, 66]),
    ['coins', 43, 9, 4], ['coins', 54, 10, 4], ['coins', 70, 9, 4],
    ['bubbles', 58, 11], ['current', 40, 48, 6, 11, 1, 0],
    ['ticket', 51, 4], // Dentro de una bolsa de aire: hay que subir a explorarla.
    ...mesa(83, 4, 7), ['coins', 83, 6, 4], ['torch', 85, 5],
    // Isla seca: punto de control y nuevo snorkel al reaparecer.
    ['row', 91, 8, '?F?'], ['row', 102, 8, '?S?'],
    ['coins', 95, 10, 3], ['torch', 99, 9],
    // Segunda galería: tres refugios de aire y corriente remontable.
    ['water', 114, 170, 6], ...cavernCeiling(119, 165, 2),
    ...rockBlock(123, 1, 2, 5), ...floodedTunnel(124, 164, 6, [132, 145, 157]),
    ['coins', 116, 10, 3], ['coins', 126, 9, 4], ['coins', 138, 10, 4],
    ['coins', 149, 9, 4], ['bubbles', 141, 11],
    ['current', 148, 155, 7, 11, -1.5, 0],
    ...mesa(167, 4, 8), ['torch', 169, 6],
    // Ascenso a la luz y un último salto corto.
    ['stairs', 174, 4, 1], ['coins', 177, 6, 3], ['stairs', 180, 4, -1],
    ['row', 187, 8, '?L?'], ['pit', 192, 195], ['coins', 192, 8, 4],
    ['flag', 200], ['temple', 205],
    // Criaturas de fantasía: no se presentan como fauna real del cenote.
    ...axolotls([46, 9], [61, 10], [73, 9], [128, 10], [150, 9], [161, 10]),
    ...bats([16, 6], [96, 6], [109, 5], [179, 4], [190, 6]),
    ['spawn', 'urchin', 89, 8], ...urchin(184),
    ...waterBank(27, 5, 1), ...waterBank(87, 5, -1),
    ...waterBank(113, 6, 1), ...waterBank(171, 6, -1),
  ],
};
