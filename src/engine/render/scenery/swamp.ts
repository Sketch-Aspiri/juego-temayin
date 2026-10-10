import { jungleScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `swamp`: pantanos y popales de Tabasco pintados; respaldo procedural de selva. */
export const swampScenery: Scenery = paintedScenery('swamp.webp', jungleScenery, { nearTop: 0.66 });
