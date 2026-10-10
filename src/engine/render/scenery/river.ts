import { jungleScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `river`: cañón del Usumacinta (Boca del Cerro) pintado; respaldo procedural de selva. */
export const riverScenery: Scenery = paintedScenery('river.png', jungleScenery, { nearTop: 0.7 });
