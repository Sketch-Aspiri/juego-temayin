import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, jellyfish } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_6: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '5-6', name: 'Akumal', width: 135, theme: 'reef', time: 420, checkpoint: 68,
  hint: 'Nada junto a las tortugas para respirar. Libera a la que esté enredada y sigue su pulso: ¡toca el núcleo abierto! Saltar cerca de una aliada te impulsa.',
  boss: { id: 'sargazo', x: 90, arena: [78, 100] },
  ops: [
    ['discovery', 66, 11, 'akumal-yalku'],
    ['row', 9, 8, 'MSF'], ['coins', 16, 10, 5],
    ['pit', 24, 56], ['water', 24, 56, 7],
    ['turtle', 26, 9, 3, 5, 0.5, 5], ['turtle', 39, 9, 3, 6, 0.5, 6],
    ['bubbles', 28, 13], ['bubbles', 40, 13], ['bubbles', 52, 13],
    ['coins', 30, 8, 4], ['coins', 45, 8, 4], ['row', 60, 8, 'S?M'],
    // Punto de control seco: los poderes se recuperan antes de cada intento.
    ['row', 69, 8, 'MFS'], ['coins', 74, 2, 3],
    // Toda la arena es agua abierta; las únicas ayudas son aliadas móviles y respiraderos.
    ['water', 78, 100, 3], ['bubbles', 83, 11], ['bubbles', 96, 11],
    ['turtle', 81, 8, 2, 3, -0.5, 6], ['turtle', 87, 6, 2, 3, 0.5, 7],
    ['turtle', 94, 9, 2, 3, -0.5, 5.5],
    ['wall', 101], ['flag', 113], ['temple', 118],
    ...blueCrab(20, 63), ...jellyfish([48, 10]),
    ...waterBank(23, 7, 1), ...waterBank(57, 7, -1),
    ...waterBank(77, 3, 1), ...waterBank(101, 3, -1),
  ],
};
