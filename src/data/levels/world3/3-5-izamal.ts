import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';

/** Arena del atrio amarillo: los arcos son decorado, jamás monumentos destructibles. */
export const LEVEL_3_5: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '3-5', name: 'Izamal', width: 116, theme: 'yellowCity', time: 380, checkpoint: 56,
  hint: 'Esquiva la embestida del Huay Chivo. Cuando choque y vea estrellas, ¡písalo!',
  boss: { id: 'huayChivo', x: 75, arena: [63, 85] },
  ops: [
    ['row', 10, 8, '?BM?'], ['coins', 15, 10, 5], ['spawn', 'alux', 24],
    ['stairs', 29, 3, 1], ['stairs', 33, 3, -1], ['coins', 29, 6, 6],
    ['row', 43, 8, 'BFB'], ['coins', 49, 10, 5], ['row', 57, 8, 'M'],
    // Plataformas de refugio: no impiden que el jefe alcance las paredes.
    ['plat', 65, 9, 3], ['plat', 81, 9, 3], ['row', 66, 5, 'F'],
    ['coins', 65, 8, 3], ['coins', 81, 8, 3], ['torch', 65, 10], ['torch', 83, 10],
    ['wall', 86], ['coins', 91, 10, 5], ['flag', 100], ['temple', 105],
  ],
};
