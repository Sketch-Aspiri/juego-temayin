import { T } from '../constants';
import type { Rect } from '../types';
import type { World } from '../World';

export interface Hammock extends Rect { readonly bounce: number }
export const HAMMOCK_BOUNCE = 1100;

/** Hamaca de una sola cara: solo rebota al caer, nunca al atravesarla desde abajo. */
export function bounceHammocks(world: World, previousFeet: number): void {
  const p = world.player;
  if (p.vy < 0 || p.swimming) return;
  for (const h of world.level.hammocks) {
    if (p.x + p.w <= h.x || p.x >= h.x + h.w) continue;
    if (previousFeet > h.y + 2 || p.y + p.h < h.y) continue;
    p.y = h.y - p.h;
    p.vy = -h.bounce;
    p.onGround = false;
    p.coyote = 0;
    p.strokeT = 0.3; // Conserva el impulso de la hamaca aunque se suelte salto.
    world.audio.play('jump');
    return;
  }
}

export const createHammock = (x: number, y: number, length: number): Hammock =>
  ({ x: x * T, y: y * T, w: length * T, h: 12, bounce: HAMMOCK_BOUNCE });
