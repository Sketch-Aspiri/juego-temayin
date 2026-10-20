import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { bats } from '../helpers';

export const LEVEL_7_4: LevelDef = {
  id: '7-4', name: 'Trono de Camazotz', theme: 'throne', width: 156, time: 720, checkpoint: 56,
  offering: EK_CHUAH_OFFERING,
  hint: 'Esquiva la picada y pisa a Camazotz al aterrizar. En la cámara, enciende cuatro antorchas con fuego; el brasero de la entrada te lo devuelve. Al final, reúne tres luces y protégete con los pilares.',
  boss: { id: 'camazotz', x: 103, arena: [90, 112] },
  ops: [
    ['discovery', 19, 11, 'trono-toh-real'],
    ['row', 10, 8, '?MF'], ['coins', 18, 9, 5], ['pit', 26, 30], ['coins', 26, 8, 5],
    ['plat', 36, 9, 4], ['pit', 43, 47], ['coins', 43, 8, 5],
    ['row', 60, 8, 'MF?'], ['coins', 67, 9, 5], ['row', 80, 8, 'MF?'],
    ...bats([22, 7], [51, 7]),
    ['col', 93, 2], ['col', 94, 2], ['col', 109, 2], ['col', 110, 2],
    ['torch', 96, 12], ['torch', 100, 12], ['torch', 104, 12], ['torch', 108, 12],
    ['coins', 97, 9, 4], ['coins', 104, 9, 4], ['wall', 113],
    ['flag', 123], ['temple', 132],
  ],
};
