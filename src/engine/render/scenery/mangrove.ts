import { jungleScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `mangrove`: manglares y petenes de Campeche pintados; respaldo procedural de selva. */
export const mangroveScenery: Scenery = paintedScenery('mangrove.webp', jungleScenery, { nearTop: 0.68 });
