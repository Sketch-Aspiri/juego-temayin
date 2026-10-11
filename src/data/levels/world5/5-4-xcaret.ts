import type { LevelDef, Op } from '../../../engine/level/types';
import { cavernCeiling, floodedTunnel } from '../caves';
import { axolotls, bats, morays } from '../helpers';

/** Cierra el espacio sobre el túnel, dejando únicamente sus bolsas de aire. */
function tunnelRoof(x0: number, x1: number, pockets: readonly number[]): Op[] {
  const rock = Array.from({ length: x1 - x0 + 1 }, (_, i) =>
    pockets.some(p => x0 + i === p || x0 + i === p + 1) ? ' ' : 'G').join('');
  return [['row', x0, 2, 'G'.repeat(x1 - x0 + 1)], ['row', x0, 3, rock], ['row', x0, 4, rock]];
}

export const LEVEL_5_4: LevelDef = {
  id: '5-4', name: 'Xcaret', width: 205, theme: 'cave', time: 360, checkpoint: 98,
  darkness: { radius: 220, alpha: 0.78 },
  hint: 'Sigue las antorchas por el río subterráneo. Las burbujas y las bolsas de aire te permiten respirar; nada contra las corrientes con calma.',
  ops: [
    ['row', 9, 8, 'MSF'], ['torch', 13, 9], ...cavernCeiling(5, 92, 2),
    ['pit', 18, 90], ['water', 18, 90, 5],
    ...floodedTunnel(28, 77, 5, [38, 54, 70]),
    ...tunnelRoof(28, 77, [38, 54, 70]),
    ['current', 22, 43, 6, 13, 0.8, 0], ['current', 58, 77, 6, 13, -0.6, 0],
    ['bubbles', 22, 13], ['bubbles', 34, 13], ['bubbles', 46, 13],
    ['bubbles', 58, 13], ['bubbles', 70, 13], ['bubbles', 82, 13], ['bubbles', 89, 13],
    ['plat', 32, 12, 3], ['plat', 61, 12, 3],
    ['coins', 24, 9, 5], ['coins', 43, 8, 5], ['row', 51, 8, 'S'], ['coins', 72, 9, 5],
    ['torch', 93, 9], ['row', 99, 8, 'MSF'], ['torch', 103, 9],
    ...cavernCeiling(104, 177, 2), ['pit', 108, 177], ['water', 108, 177, 5],
    ...floodedTunnel(118, 165, 5, [126, 142, 158]),
    ...tunnelRoof(118, 165, [126, 142, 158]),
    ['current', 113, 135, 6, 13, 1, 0], ['current', 149, 165, 6, 13, -0.7, 0],
    ['bubbles', 112, 13], ['bubbles', 124, 13], ['bubbles', 136, 13],
    ['bubbles', 148, 13], ['bubbles', 160, 13], ['bubbles', 172, 13],
    ['plat', 130, 12, 3], ['plat', 154, 12, 3], ['row', 145, 8, 'S'],
    ['coins', 114, 9, 5], ['coins', 133, 8, 5], ['coins', 162, 9, 5],
    ['torch', 180, 9], ['flag', 183], ['temple', 188],
    ...bats([16, 3], [95, 4], [181, 4]),
    ...axolotls([48, 9], [79, 10], [138, 9], [169, 10]),
    ...morays([33, 11], [62, 11], [131, 11], [155, 11]),
  ],
};
