import type { BossConfig } from '../level/types';
import type { BossId } from '../types';
import { Puas } from './puas';
import type { Boss, BossFactory } from './types';

/** Registro de jefes. Para añadir uno: implementar `Boss`, añadir su id a `BossId` y registrarlo aquí. */
const FACTORIES: Readonly<Record<BossId, BossFactory>> = {
  puas: (cfg) => new Puas(cfg),
};

export function createBoss(config: BossConfig): Boss {
  return FACTORIES[config.id](config);
}

export type { Boss } from './types';
