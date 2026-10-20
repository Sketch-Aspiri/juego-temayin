import { T } from '../constants';
import { overlap } from '../physics';
import type { Rect } from '../types';
import type { World } from '../World';

export interface Discovery extends Readonly<Rect> { readonly id: string }
const MARK_SIZE = 32;

export function createDiscovery(tx: number, ty: number, id: string): Discovery {
  return { id, x: (tx + 0.5) * T - MARK_SIZE / 2, y: (ty + 0.5) * T - MARK_SIZE / 2, w: MARK_SIZE, h: MARK_SIZE };
}

/** Registrar una observación no consume el objeto ni modifica las estrellas o el terreno. */
export function collectDiscoveries(world: World): void {
  if (world.phase !== 'play') return;
  for (const mark of world.level.discoveries) {
    if (world.discoveries.includes(mark.id) || !overlap(world.player, mark)) continue;
    world.discoveries = [...world.discoveries, mark.id];
    world.audio.play('power');
  }
}
