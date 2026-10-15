import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { bats, shades, tarantula } from '../helpers';

/**
 * Nuevo Xcán: paradero del Tren Maya en Quintana Roo, junto al límite con Yucatán,
 * en la carretera entre Valladolid y Cancún (AGENTS.md §4.3). Nivel de jefe del
 * Mundo 4: Huay Pek.
 *
 * Referencia narrativa para Toh: «Nuevo Xcán está justo donde
 * Yucatán se vuelve Quintana Roo. En maya, *pek'* quiere decir perro: las abuelas
 * cuentan que de noche, entre la niebla de los caminos, ronda el Huay Pek, un perro
 * de sombra con ojos que brillan. ¡Cuando se le encienden los ojos, es tu momento!»
 * Los relatos de transformación en perro se documentan en «La instrumentalización
 * del way según las escenas de los vasos pintados» (Península, 2009):
 * https://www.scielo.org.mx/scielo.php?pid=S1870-57662009000100002&script=sci_arttext
 * Aquí se adapta como personaje de fantasía familiar, sin juzgar creencias actuales.
 *
 * Recorrido (selva de noche):
 *   0-56     Camino entre la selva: hoyos cortos, rama alta con saraguato,
 *            sombras de Xibalbá y murciélagos; escudo antes de la arena.
 *            Punto de control en 50.
 *   61       Columna que se cierra al entrar en la arena.
 *   62-83    Arena: claro de selva con niebla. Ramas (plat) asimétricas en las filas
 *            8 y 9 y una alta en la fila 6, junto al chile para quemarlo con los ojos
 *            encendidos. En la fase 2 la niebla cubre la arena.
 *   84       Muro de salida (se rompe al vencer al jefe).
 *   85-106   Bandera y templo.
 */
export const LEVEL_4_5: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '4-5',
  name: 'Nuevo Xcán',
  hint: '¡Salta sobre los ladridos! Cuando brillen sus ojos, puedes golpear a Huay Pek.',
  darkness: { radius: 250, alpha: 0.42 },
  width: 107,
  theme: 'jungleNight',
  checkpoint: 50,
  boss: { id: 'huayPek', x: 76, arena: [62, 83] },
  ops: [
    // --- Camino entre la selva ---
    ['row', 8, 8, '?B?'], ['coins', 8, 4, 3],
    ['pit', 18, 21], ['coins', 18, 8, 4],
    ['plat', 26, 6, 4],
    ['row', 33, 8, 'BFB'], ['row', 35, 4, '?'],
    ['pit', 42, 45], ['plat', 43, 9, 2], ['coins', 43, 7, 2],
    ['row', 49, 8, 'B?MB'],
    ['coins', 54, 8, 4],

    // --- Arena del Huay Pek ---
    ['plat', 64, 8, 4], ['plat', 78, 9, 4], ['plat', 72, 6, 2],
    ['row', 65, 5, 'M'], ['row', 71, 2, 'F'],
    ['coins', 64, 7, 4], ['coins', 78, 8, 4],
    ['wall', 84],

    // --- Salida ---
    ['coins', 88, 9, 3],
    ['flag', 92], ['temple', 97],

    // --- Enemigos ---
    ...tarantula(14, 38),
    ['spawn', 'howler', 27, 5],
    ...shades([24, 8], [47, 6]),
    ...bats([16, 6], [40, 5]),
  ],
};
