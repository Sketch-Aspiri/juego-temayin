import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { barracudas, blueCrab, jellyfish, pirateCrab, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

/**
 * Chetumal: capital de Quintana Roo, a orillas de la bahía (AGENTS.md §4.3). Nivel de
 * jefe del Mundo 6: Lorencillo, pirata de aventura en la cubierta de su barco.
 *
 *   0-31     malecón con cacao, cangrejos y primeros poderes
 *   32-63    primer canal (32 bloques): islote central y una barca por tramo; aprender a esperar la barca
 *   64-110   muelle seco, erizo y cangrejos; punto de control en 100 con chile y escudo
 *   112-141  segundo canal con corriente suave, barracudas y medusa: la misma idea, con presión
 *   142-155  embarcadero sin enemigos para recuperar poderes antes del barco
 *   156-177  cubierta del barco (22 bloques): la fila de encima del suelo queda libre
 *            (los cangrejos del mástil aparecen ahí) y dos cofas en la fila 8 sirven de
 *            refugio cuando el barco se inclina (fase 2, a 4 PV)
 *   178      muro de salida (se abre al vencer a Lorencillo)
 *   179-201  bandera y templo
 */
export const LEVEL_6_6: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '6-6',
  name: 'Chetumal',
  width: 202,
  theme: 'bay',
  time: 400,
  checkpoint: 100,
  // TODO(cultura): revisar. Lorencillo (Laurens de Graaf) es un pirata histórico; su ataque de 1685 fue contra
  // Campeche, no contra Chetumal. Aquí es ficción de aventura y el consejo lo aclara sin glorificar la violencia.
  hint: 'Chetumal se asoma a su bahía. Lorencillo existió, pero en el juego es un pirata de cuento: ¡cuando falle su estocada, pisa su espalda!',
  boss: { id: 'lorencillo', x: 170, arena: [156, 177] },
  ops: [
    // --- Malecón ---
    ['row', 9, 8, '?M?'], ['coins', 14, 9, 4], ['row', 26, 8, 'B?B'],
    // --- Primer canal: dos barcas se relevan ---
    ['pit', 32, 63], ['water', 32, 63, 10],
    // Un islote fijo parte el canal en dos tramos; cada barca hace su propio vaivén entre dos muelles,
    // así que su ritmo no depende de cuándo se active la otra (con el desfase de caminar o de correr).
    ['plat', 32, 9, 3], ['boat', 36, 9, 5, 6, 0.6, 5], ['plat', 47, 9, 4], ['boat', 52, 9, 5, 5, 0.5, 5], ['plat', 62, 9, 3],
    ['bubbles', 40, 13], ['bubbles', 52, 13], ['bubbles', 61, 13],
    ['coins', 38, 7, 5], ['coins', 53, 7, 4],
    // --- Muelle y punto de control ---
    ['row', 70, 8, '?B?'], ['coins', 84, 9, 4], ['row', 92, 8, 'B?B'],
    ['row', 103, 8, 'MF?'], ['coins', 107, 9, 3],
    // --- Segundo canal: corriente suave y más fauna ---
    ['pit', 112, 141], ['water', 112, 141, 10],
    ['plat', 112, 9, 3], ['boat', 116, 9, 5, 5, 0.7, 5], ['plat', 126, 9, 4], ['boat', 131, 9, 5, 4, 0.5, 6], ['plat', 140, 9, 3],
    ['current', 118, 138, 10, 13, 0.7, 0],
    ['bubbles', 120, 13], ['bubbles', 130, 13], ['bubbles', 138, 13],
    ['coins', 120, 7, 5], ['coins', 133, 7, 4],
    // --- Embarcadero previo al barco: poderes por si se perdieron ---
    ['row', 146, 8, 'MF?'], ['coins', 149, 9, 3],
    // --- Cubierta: suelo despejado y dos cofas de refugio ---
    ['plat', 160, 8, 4], ['plat', 171, 8, 4],
    ['row', 161, 5, 'M'], ['row', 172, 5, 'F'],
    ['coins', 160, 7, 4], ['coins', 171, 7, 4],
    ['wall', 178],
    // --- Salida ---
    ['coins', 183, 9, 3],
    ['flag', 186], ['temple', 191],
    // --- Enemigos (ninguno cerca de un aterrizaje ni dentro de la cubierta) ---
    ...blueCrab(14, 90), ...pirateCrab(22, 78), ...urchin(96),
    ...barracudas([124, 12], [134, 12]), ...jellyfish([128, 11]),
    ...waterBank(31, 10, 1), ...waterBank(64, 10, -1),
    ...waterBank(111, 10, 1), ...waterBank(142, 10, -1),
  ],
};
