import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { coati, urchin } from '../helpers';

/**
 * Escárcega, guarida de Púas (jefe del Mundo 1): la arena va de la columna 50 a la 71,
 * con muros en 49 y 72. Los enemigos de la llegada quedan encerrados entre obstáculos
 * (tubo, escalinatas) para que ninguno se cuele en la arena antes de cerrarse.
 */
export const LEVEL_1_6: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '1-6',
  name: 'Escárcega',
  hint: 'El chile también daña a Púas, salvo cuando rueda como bola.',
  width: 95,
  theme: 'lair',
  boss: { id: 'puas', x: 64, arena: [50, 71] },
  ops: [
    ['pit', 18, 20], ['coins', 18, 8, 3], ['row', 10, 8, '?MF'],
    ['pipe', 24, 3], ['row', 30, 8, 'BLB'], ['coins', 30, 4, 3],
    ['stairs', 36, 3, 1], ['coins', 39, 7, 2], ['stairs', 41, 3, -1],
    ['plat', 54, 8, 3], ['plat', 65, 8, 3], ['row', 61, 8, 'M'], ['row', 59, 8, 'F'],
    ['wall', 72],
    ['flag', 80], ['temple', 85],
    ...coati(14, 33),
    ...urchin(28, 40),
  ],
};
