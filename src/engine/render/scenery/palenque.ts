import { jungleScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `palenque`: templos de Palenque entre la selva y la bruma (ruins.png). */
export const palenqueScenery: Scenery = paintedScenery('ruins.png', jungleScenery, { nearTop: 0.68 });
