import type { World } from './World';

export type BlessingId = 'fire' | 'shield' | 'life';

export interface OfferingConfig {
  readonly deity: 'ekChuah';
  readonly offers: readonly BlessingId[];
}

/** Se entregan una sola vez al entrar: las reapariciones usan las reglas normales. */
export function applyBlessings(world: World, blessings: readonly BlessingId[]): void {
  for (const blessing of new Set(blessings)) {
    if (blessing === 'life') world.session.lives++;
    else world.player[blessing] = true;
  }
}
