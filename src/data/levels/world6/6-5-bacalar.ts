import type { LevelDef } from '../../../engine/level/types';
import { barracudas, coati, morays, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

/**
 * Bacalar: laguna de los siete colores (AGENTS.md §4.3, Mundo 6). Nado en agua
 * clara con superficie abierta (el aire nunca falta) y estromatolitos vivos en
 * el lecho: son bloques sólidos que no se pisan. Pisarlos más de un instante
 * resta puntos, nunca vida; se esquivan nadando por encima.
 *
 *   0-35    orilla con bloques y cacao
 *   36-72   laguna A (37 bloques): dos arrecifes de estromatolitos, barracudas y morenas
 *   73-119  embarcadero, punto de control seco (112) con escudo
 *   120-150 laguna B (31 bloques, más honda): cúpulas altas de 3 filas
 *   151-209 tierra firme, erizos, bandera y templo
 */
export const LEVEL_6_5: LevelDef = {
  id: '6-5',
  name: 'Bacalar',
  width: 210,
  theme: 'lagoon',
  checkpoint: 112,
  // TODO(cultura): revisar con especialistas el dato sobre los estromatolitos (edad, nombre maya de Bacalar).
  hint: 'Los estromatolitos de Bacalar los construyen microbios vivos, y algunos tienen miles de años. ¡Nada por encima y no los pises!',
  ops: [
    ['row', 10, 8, '?M?'], ['coins', 14, 9, 4], ['row', 24, 8, 'B?B'],
    // Laguna A.
    ['pit', 36, 72], ['water', 36, 72, 10],
    ...waterBank(35, 10, 1), ...waterBank(73, 10, -1),
    ['bubbles', 44, 13], ['bubbles', 54, 13], ['bubbles', 66, 13],
    ['stromatolite', 46, 13, 6], ['stromatolite', 47, 12, 4],
    ['stromatolite', 58, 13, 7], ['stromatolite', 59, 12, 5],
    ['coins', 40, 10, 5], ['coins', 48, 10, 5], ['coins', 60, 9, 4], ['coins', 66, 10, 4],
    // Embarcadero y punto de control.
    ['row', 80, 8, '?F?'], ['coins', 86, 9, 5], ['row', 96, 8, 'B?B'], ['row', 114, 8, '?M?'], ['coins', 104, 9, 4],
    // Laguna B, más honda.
    ['pit', 120, 150], ['water', 120, 150, 9],
    ...waterBank(119, 9, 1), ...waterBank(151, 9, -1),
    ['bubbles', 126, 13], ['bubbles', 136, 13], ['bubbles', 146, 13],
    ['stromatolite', 127, 13, 7], ['stromatolite', 128, 12, 5], ['stromatolite', 129, 11, 3],
    ['stromatolite', 139, 13, 8], ['stromatolite', 140, 12, 6], ['stromatolite', 141, 11, 4],
    ['coins', 123, 10, 4], ['coins', 128, 8, 5], ['coins', 141, 8, 5], ['coins', 134, 10, 3], ['coins', 146, 10, 3],
    ['row', 158, 8, '?L?'], ['coins', 164, 9, 4], ['row', 178, 8, 'B?B'], ['coins', 184, 9, 4],
    ['flag', 194], ['temple', 199],
    ...barracudas([52, 10], [67, 11], [135, 10], [147, 10]),
    ...morays([36, 11], [72, 11], [121, 11], [150, 11]),
    ...urchin(90, 162, 172), ...coati(100, 186),
  ],
};
