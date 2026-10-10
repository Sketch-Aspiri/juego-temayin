import type { BossConfig } from '../level/types';
import type { BossId } from '../types';
import { Kaiman } from './kaiman';
import { HuayChivo } from './huayChivo';
import { HuayPek } from './huayPek';
import { Puas } from './puas';
import type { Boss, BossFactory } from './types';

/** Registro de jefes. Para añadir uno: implementar `Boss`, añadir su id a `BossId` y registrarlo aquí. */
const FACTORIES: Readonly<Record<BossId, BossFactory>> = {
  puas: (cfg) => new Puas(cfg),
  kaiman: (cfg) => new Kaiman(cfg),
  huayChivo: (cfg) => new HuayChivo(cfg),
  huayPek: (cfg) => new HuayPek(cfg),
};

export function createBoss(config: BossConfig): Boss {
  return FACTORIES[config.id](config);
}

export type { Boss } from './types';
