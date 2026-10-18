import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { bats } from '../helpers';

/**
 * Tulum Aeropuerto: estación moderna en la selva (AGENTS.md §4.3, Mundo 6).
 * Persecución sobre el techo del tren en marcha: la cámara avanza sola
 * (`autoScroll`) y el suelo son techos de vagón separados por huecos de
 * enganche de 2 a 3 bloques. Quien se rezaga es arrastrado hacia delante;
 * solo un bloque sólido delante de él lo aplasta, así que ninguna pieza del
 * nivel cierra el paso por completo: las cajas de ventilación miden 1-2 bloques
 * y se saltan, y las señales altas quedan en la fila 8 (nunca a la altura del cuerpo).
 *
 *   0-19    vagón 1, llano: se aprende a seguir el ritmo
 *   20-86   huecos de 2 bloques y primeras cajas de ventilación
 *   88-108  vagón con el punto de control (96) y bloques de poder
 *   109-176 huecos de 2-3 bloques, señales altas con saraguatos y murciélagos
 *   177-249 tramo final: huecos de 3 bloques, bandera y templo
 */
export const LEVEL_6_2: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '6-2',
  name: 'Tulum Aeropuerto',
  width: 250,
  theme: 'jungleTrain',
  autoScroll: 3,
  checkpoint: 96,
  hint: 'El tren no espera: sigue su ritmo y salta los enganches entre vagones. ¡Las señales altas dan cacao!',
  ops: [
    // Huecos de enganche entre vagones (2-3 bloques).
    ['pit', 20, 21], ['pit', 41, 43], ['pit', 63, 64], ['pit', 85, 87], ['pit', 109, 110],
    ['pit', 131, 133], ['pit', 154, 155], ['pit', 177, 179], ['pit', 201, 203], ['pit', 224, 226],
    // Las cajas de ventilación están al menos 9-10 bloques antes del siguiente enganche: un salto en carrera
    // (~8,4 bloques) que las salve aterriza siempre en el techo, no en el hueco.
    // Las pasarelas de los vagones 2 y 4 están en la fila 4 (el cuerpo llega a la fila ~5,5 como máximo en el
    // salto más alto), así que nunca recortan el arco sobre una caja; las demás quedan lejos de cajas y huecos.
    // Vagón 1: llano, con cacao y un bloque de poder.
    ['row', 10, 8, '?M?'], ['coins', 14, 9, 4],
    // Vagón 2: pasarela con coatí y primera caja de ventilación.
    ['coins', 23, 9, 3], ['plat', 28, 4, 5], ['col', 31, 1], ['coins', 30, 8, 3],
    // Vagón 3: caja doble.
    ['coins', 45, 9, 3], ['col', 53, 2], ['coins', 52, 7, 3],
    // Vagón 4: bloques de poder, pasarela y caja.
    ['row', 66, 8, '?F?'], ['plat', 70, 4, 5], ['col', 75, 1], ['coins', 74, 8, 3],
    // Vagón 5 con punto de control.
    ['row', 98, 8, '?L?'], ['coins', 103, 9, 4],
    // Vagón 6: rama alta con saraguato y caja doble.
    ['coins', 112, 9, 2], ['plat', 113, 6, 5], ['col', 122, 2], ['coins', 121, 7, 3],
    // Vagón 7.
    ['col', 141, 1], ['coins', 140, 8, 3], ['plat', 146, 6, 3],
    // Vagón 8: pasarela con coatí y bloques.
    ['plat', 163, 6, 5], ['row', 170, 8, '?M?'],
    // Vagón 9.
    ['col', 187, 1], ['coins', 186, 8, 3], ['plat', 192, 6, 4],
    // Vagón 10 y último vagón.
    ['plat', 210, 6, 5], ['row', 217, 8, '?F?'], ['coins', 223, 8, 4], ['coins', 230, 9, 4], ['coins', 238, 9, 3],
    ['flag', 236], ['temple', 241],
    // Los coatíes patrullan las pasarelas: si se salen, caen al techo del vagón, nunca al enganche.
    ['spawn', 'coati', 30, 3], ['spawn', 'coati', 72, 3], ['spawn', 'coati', 165, 5], ['spawn', 'coati', 212, 5],
    ['spawn', 'howler', 115, 5], ['spawn', 'howler', 147, 5], ['spawn', 'howler', 193, 5],
    ...bats([48, 5], [100, 6], [137, 5], [183, 5], [207, 5]),
  ],
};
