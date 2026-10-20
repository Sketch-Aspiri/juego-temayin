import type { LevelDef } from '../../../engine/level/types';
import { coati } from '../helpers';

/** Las vagonetas recorren rieles Decauville; los descansos permiten recuperar el salto. */
export const LEVEL_3_2: LevelDef = {
  id: '3-2', name: 'Mérida', width: 178, theme: 'hacienda', time: 340, checkpoint: 87,
  hint: 'Sube a las vagonetas; las ruedas de henequén se esquivan o se queman con fuego.',
  ops: [
    ['discovery', 38, 11, 'merida-fundacion'],
    ['discovery', 117, 11, 'merida-ferrocarriles'],
    ['row', 10, 8, '?BMB'], ['coins', 15, 10, 5],
    ['stairs', 25, 3, 1], ['stairs', 29, 3, -1], ['spawn', 'wheel', 35],
    ['row', 36, 8, 'BFB'],
    // La columna 40 encierra a la rueda 35. La vagoneta va en la fila 11 para que el jinete
    // pase bajo los descansos de la fila 8, y recorre 8 bloques: la cámara no retrocede y un
    // viaje de vuelta más largo empujaría al jinete quieto fuera de la pantalla.
    ['col', 40, 2], ['pit', 43, 58], ['truck', 42, 11, 3, 8, 6],
    ['plat', 48, 8, 2], ['plat', 54, 8, 2], ['coins', 48, 6, 2], ['coins', 54, 6, 2],
    ['plat', 64, 9, 4], ['coins', 64, 7, 4], ['spawn', 'wheel', 72],
    ['row', 79, 8, '?L?'], ['coins', 86, 10, 6],
    // La columna 99 frena a la rueda 97 antes del barranco.
    ['row', 94, 8, 'BFM'], ['spawn', 'wheel', 97], ['col', 99, 2],
    ['pit', 102, 115], ['truck', 100, 10, 3, 8, 6],
    ['plat', 106, 7, 2], ['plat', 112, 7, 2], ['coins', 106, 5, 2], ['coins', 112, 5, 2],
    ['stairs', 123, 3, 1], ['stairs', 127, 3, -1], ['spawn', 'wheel', 136],
    ['row', 141, 8, '?B?M'], ['coins', 150, 10, 6], ['flag', 162], ['temple', 167],
    ...coati(22, 68, 93, 147),
  ],
};
