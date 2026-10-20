import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { bats, fireflies, nauyaca, tarantula } from '../helpers';

/**
 * Limones: paradero en la selva del sur de Quintana Roo, de noche
 * (AGENTS.md §4.3, Mundo 6). La oscuridad solo deja ver un círculo alrededor
 * de Temayin; las luciérnagas son luces fijas que marcan el camino.
 * Regla de diseño (comprobada en `world6.test.ts`): hay una luciérnaga a 3
 * bloques o menos de cada borde de hoyo y de cada enemigo, para que nada
 * castigue sin haberse podido ver.
 *
 *   0-57    selva a oscuras: dos fosos cortos y primeras tarántulas
 *   58-91   foso de 6 bloques y nauyaca avisada por su luciérnaga
 *   92-117  punto de control (108) con chile de repuesto
 *   118-149 foso de 6 y foso largo de 10 con dos losas bajas (se cruza caminando o corriendo)
 *   150-209 murciélagos entre luciérnagas, último foso, bandera y templo
 */
export const LEVEL_6_4: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '6-4',
  name: 'Limones',
  width: 216,
  theme: 'jungleNight',
  checkpoint: 108,
  darkness: { radius: 190, alpha: 0.82 },
  hint: 'Las luciérnagas marcan los bordes y los peligros. Si ves una luz quieta, ¡hay algo cerca!',
  ops: [
    ['discovery', 55, 11, 'limones-caobas'],
    ['discovery', 80, 11, 'limones-chacchoben'],
    ['row', 12, 8, '?M?'], ['coins', 16, 9, 4],
    // Fosos con luciérnagas en sus bordes.
    ['pit', 30, 34], ['pit', 58, 63], ['pit', 86, 91], ['pit', 118, 123], ['pit', 140, 149], ['pit', 176, 180],
    ['coins', 30, 8, 5], ['coins', 58, 8, 6], ['coins', 86, 8, 6], ['coins', 118, 8, 6], ['coins', 176, 8, 5],
    // Foso largo: dos losas bajas (fila 10, a 2 bloques del suelo) que no estorban el arco de un salto
    // normal, caminando o corriendo; caminando se aterriza en la primera y corriendo en la segunda.
    ['plat', 142, 10, 3], ['plat', 146, 10, 3], ['coins', 142, 9, 3], ['coins', 146, 9, 3],
    ['row', 48, 8, 'B?B'], ['row', 70, 8, '?L?'], ['coins', 76, 9, 4],
    ['ticket', 72, 4], ['firefly', 73, 4], // El brillo invita a subir sobre el cofre.
    // Punto de control.
    ['row', 100, 8, '?M?'], ['row', 112, 8, '?F?'],
    ['row', 128, 8, 'B?B'], ['coins', 134, 9, 4],
    ['row', 158, 8, '?B?'], ['coins', 168, 9, 4], ['row', 188, 8, '?M?'],
    ['flag', 202], ['temple', 207],
    // Luciérnagas: bordes de hoyo (a ambos lados), mitad de los fosos largos y punto de control.
    ...fireflies([29, 9], [35, 9], [57, 9], [64, 9], [85, 9], [92, 9], [117, 9], [124, 9],
      [139, 9], [143, 8], [147, 8], [150, 9], [175, 9], [181, 9], [108, 9]),
    // Luciérnagas junto a cada enemigo.
    ...fireflies([44, 9], [100, 9], [114, 8], [132, 9], [158, 9], [166, 9], [188, 9],
      [26, 5], [70, 4], [95, 5], [128, 4], [164, 5], [186, 4]),
    ...tarantula(44, 100, 132, 166), ...nauyaca(114, 158, 188),
    ...bats([26, 6], [70, 5], [95, 6], [128, 5], [164, 6], [186, 5]),
  ],
};
