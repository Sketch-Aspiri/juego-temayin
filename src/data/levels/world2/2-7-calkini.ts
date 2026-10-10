import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, nauyaca } from '../helpers';

/**
 * Calkiní: pueblo del Camino Real de Campeche, en el norte del estado, en el límite
 * con Yucatán (AGENTS.md §4.3). Nivel de jefe del Mundo 2: Kaimán Moreleti.
 *
 * Región verificada con la Unidad de Comunicación Social de Campeche:
 * https://ucs.campeche.gob.mx/bienestar-beneficiara-a-familias-del-camino-real/
 *
 * Recorrido:
 *   0-60     Orilla del pantano: vado de agua baja, poza honda con tronco,
 *            chile antes de la arena y escudo (bloque M). Punto de control en 54.
 *   61       Columna que se cierra al entrar en la arena.
 *   62-83    Arena: agua poco profunda (superficie 11.5) sobre el suelo; troncos
 *            (plat) en la fila 9 a ambos lados y uno alto en el centro con chile.
 *            En la fase 2 el agua sube a 10.75: se nada y los troncos son refugio.
 *   84       Muro de salida (se rompe al vencer al jefe).
 *   85-106   Bandera y templo.
 */
export const LEVEL_2_7: LevelDef = {
  id: '2-7',
  name: 'Calkiní',
  hint: 'Calkiní forma parte del Camino Real. ¡Pisa el lomo expuesto de Kaimán!',
  width: 107,
  theme: 'swamp',
  checkpoint: 54,
  boss: { id: 'kaiman', x: 74, arena: [62, 83] },
  ops: [
    // --- Orilla del pantano ---
    ['row', 9, 8, '?B?'], ['coins', 9, 4, 3],
    ['water', 16, 22, 11], ['coins', 16, 9, 3], ['coins', 20, 9, 3],
    ['row', 26, 8, 'BFB'], ['row', 30, 4, '?'],
    ['pit', 34, 37], ['water', 34, 37, 12], ['plat', 35, 9, 2], ['coins', 35, 7, 2],
    ['plat', 41, 9, 3], ['coins', 41, 7, 3],
    ['row', 48, 8, 'B?MB'],
    ['coins', 53, 8, 4],

    // --- Arena del Kaimán ---
    ['water', 62, 83, 11.5],
    ['plat', 64, 9, 3], ['plat', 78, 9, 3], ['plat', 70, 6, 3],
    ['row', 65, 5, 'M'], ['row', 71, 2, 'F'],
    ['coins', 64, 8, 3], ['coins', 78, 8, 3],
    ['wall', 84],

    // --- Salida ---
    ['coins', 88, 9, 3],
    ['flag', 92], ['temple', 97],

    // --- Enemigos ---
    ...nauyaca(24, 45),
    ...blueCrab(13, 52),
    ['spawn', 'howler', 42, 8],
  ],
};
