import { jungleScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `palenque`: templos de Palenque entre la selva y la bruma (ruins.webp). */
export const palenqueScenery: Scenery = paintedScenery('ruins.webp', jungleScenery, { nearTop: 0.68 });
