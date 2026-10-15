import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, jellyfish } from '../helpers';
import { waterBank } from '../waterBanks';

export const LEVEL_5_6: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '5-6', name: 'Akumal', width: 135, theme: 'reef', time: 420, checkpoint: 68,
  hint: 'Las tortugas son aliadas: puedes apoyarte en su caparazón y nunca reciben daño. Esquiva las algas y golpea el núcleo del Capitán cuando se abra. ¡Cuidemos el mar!',
  boss: { id: 'sargazo', x: 90, arena: [78, 100] },
  ops: [
    ['row', 9, 8, 'MSF'], ['coins', 16, 10, 5],
    ['pit', 24, 56], ['water', 24, 56, 7],
    ['turtle', 26, 9, 3, 5, 0.5, 5], ['turtle', 39, 9, 3, 6, 0.5, 6],
    ['bubbles', 28, 13], ['bubbles', 40, 13], ['bubbles', 52, 13],
    ['coins', 30, 8, 4], ['coins', 45, 8, 4], ['row', 60, 8, 'S?M'],
    // Punto de control seco: los poderes se recuperan antes de cada intento.
    ['row', 70, 8, 'MFS'], ['coins', 74, 10, 3],
    // Suelo firme para el sargazo; media arena bajo el agua y media al aire libre.
    ['water', 89, 100, 7], ['bubbles', 90, 11], ['bubbles', 98, 11],
    ['turtle', 89, 9, 3, 2, 0.5, 5], ['turtle', 96, 9, 3, 0, 0.5, 6],
    ['plat', 81, 9, 3], ['coins', 81, 8, 3],
    ['wall', 101], ['flag', 113], ['temple', 118],
    ...blueCrab(20, 63), ...jellyfish([48, 10]),
    ...waterBank(23, 7, 1), ...waterBank(57, 7, -1),
    ...waterBank(88, 7, 1), ...waterBank(101, 7, -1),
  ],
};
