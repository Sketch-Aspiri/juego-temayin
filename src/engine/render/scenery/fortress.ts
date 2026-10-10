import { beachScenery, type Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Escenario `fortress`: murallas y baluartes de Campeche frente al golfo; respaldo procedural de costa. */
export const fortressScenery: Scenery = paintedScenery('fortress.webp', beachScenery, { nearTop: 0.68 });
