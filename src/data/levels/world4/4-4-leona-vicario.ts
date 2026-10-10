import type { LevelDef } from '../../../engine/level/types';
import { ants, coati, xtabay } from '../helpers';

/**
 * Leona Vicario: selva chiclera bajo la lluvia. La resina frena sobre suelo firme;
 * los barrancos cuentan con una zona de carrera sin resina. Xtabay es una ceiba
 * encantada de leyenda y deja escapar a quien se mueve o salta.
 */
export const LEVEL_4_4: LevelDef = {
  id: '4-4', name: 'Leona Vicario', width: 224, theme: 'jungle', checkpoint: 112,
  weather: 'rain',
  hint: 'La resina frena tus pasos. ¡Sigue moviéndote junto a las ceibas encantadas!',
  ops: [
    // Primer contacto con el chicle, sin hoyos bajo la resina.
    ['row', 10, 8, '?M?'], ['coins', 17, 9, 4],
    ['resin', 25, 30, 11], ['plat', 26, 8, 4], ['coins', 26, 7, 4],
    ['pit', 37, 41], ['coins', 37, 8, 5],
    ['row', 47, 8, 'BFB'], ['coins', 51, 4, 3],
    // Ceiba encantada: hay espacio para saltar sobre su raíz.
    ['plat', 56, 7, 4], ['coins', 56, 6, 4],
    ['resin', 65, 69, 11], ['coins', 65, 9, 5],
    ['pit', 78, 84], ['plat', 80, 9, 3], ['coins', 80, 7, 3],
    ['stairs', 91, 3, 1], ['stairs', 96, 3, -1], ['row', 103, 8, '?L?'],
    // Punto de control: refugio seco y chile de repuesto.
    ['row', 116, 8, '?F?'], ['plat', 123, 7, 4], ['coins', 123, 6, 4],
    ['resin', 131, 136, 11], ['plat', 132, 8, 4], ['coins', 132, 7, 4],
    ['pit', 145, 149], ['coins', 145, 8, 5],
    ['plat', 154, 7, 4], ['coins', 154, 6, 4], ['row', 165, 8, 'B?MB'],
    // La pasarela final permite evitar el tramo pegajoso.
    ['resin', 173, 179, 11], ['plat', 174, 8, 5], ['coins', 174, 7, 5],
    ['pit', 190, 195], ['plat', 192, 9, 2],
    ['stairs', 201, 3, 1], ['flag', 208], ['temple', 214],
    ...coati(20, 44, 72, 105, 140, 181, 199),
    ...ants(32, 100, 169), ...xtabay(60, 128, 160, 185),
    ['spawn', 'howler', 57, 6], ['spawn', 'howler', 124, 6], ['spawn', 'howler', 155, 6],
  ],
};
