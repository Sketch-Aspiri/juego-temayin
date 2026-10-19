import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { bats, fireflies, xtabay } from '../helpers';

export const LEVEL_7_3: LevelDef = {
  id: '7-3', name: 'Calakmul', theme: 'deepJungle', width: 216, time: 420, checkpoint: 104,
  offering: EK_CHUAH_OFFERING, darkness: { radius: 190, alpha: 0.74 },
  hint: 'Calakmul fue una gran ciudad del reino Kaan y hoy protege una selva extraordinaria. Sigue las luces hacia la cima; el boleto brilla sobre el sendero alto.',
  ops: [
    ['row', 10, 8, '?MF'], ['coins', 19, 9, 5], ['pit', 32, 36], ['coins', 32, 8, 5],
    ['plat', 44, 9, 5], ['coins', 44, 8, 5], ['rope', 58, 2, 6],
    ['pit', 72, 77], ['coins', 72, 8, 5], ['torch', 89, 10], ['row', 109, 8, 'MF?'],
    ['pit', 123, 128], ['coins', 123, 8, 5], ['plat', 140, 10, 4], ['plat', 145, 8, 4],
    // El sendero inferior permite continuar si se falla el salto opcional al boleto.
    ['pit', 150, 155], ['plat', 150, 10, 6], ['plat', 150, 6, 7], ['ticket', 154, 4], ['coins', 150, 5, 4],
    ['plat', 159, 8, 4], ['plat', 165, 10, 4], ['coins', 166, 9, 3],
    ['row', 178, 8, 'MF?'], ['torch', 188, 10],
    ['spawn', 'shade', 64, 7], ['spawn', 'shade', 117, 7], ['spawn', 'shade', 174, 7],
    ['spawn', 'howler', 48, 8], ...xtabay(95), ...bats([138, 6]),
    ...fireflies([31, 9], [37, 9], [71, 9], [78, 9], [122, 9], [129, 9], [149, 9], [156, 9]),
    ['flag', 199], ['temple', 204],
  ],
};
