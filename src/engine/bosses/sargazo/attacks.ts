import { GROUND, T } from '../../constants';
import { overlap } from '../../physics';
import type { World } from '../../World';

export interface AlgaeBall { x: number; y: number; vx: number; vy: number; t: number }
const BALL_SIZE = 24;
const GRAVITY = 420;
const LAUNCH_SPEED = 210;
const LAUNCH_UP = 220;
const LIFE = 5;
const SPEED_STEP = 35;
const ARC_STEP = 55;

/** Las algas frenan, sin dañar a las tortugas ni acumular franjas infinitas. */
export function coverFloor(world: World, x: number, left: number, right: number): void {
  const tx = Math.floor(x / T);
  const x0 = Math.max(left, tx - 1), x1 = Math.min(right, tx + 1);
  if (x0 > x1) return;
  if (world.slowZones.some(z => z.kind === 'sargassum' && tx >= z.x0 && tx <= z.x1)) return;
  world.slowZones = [...world.slowZones, { kind: 'sargassum', x0, x1, y: GROUND - 1 }];
}

export function throwAlgae(x: number, y: number, target: number, layer: number): AlgaeBall[] {
  const dir = target < x ? -1 : 1;
  return Array.from({ length: layer }, (_, i) => ({
    x, y, vx: dir * (LAUNCH_SPEED + i * SPEED_STEP), vy: -LAUNCH_UP - i * ARC_STEP, t: 0,
  }));
}

export function stepAlgae(world: World, balls: AlgaeBall[], dt: number, left: number, right: number): AlgaeBall[] {
  return balls.filter(b => {
    b.t += dt; b.vy += GRAVITY * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < left * T || b.x > (right + 1) * T || b.t > LIFE) return false;
    if (b.y >= GROUND * T - BALL_SIZE / 2) {
      coverFloor(world, b.x, left, right); return false;
    }
    if (overlap(world.player, { x: b.x - BALL_SIZE / 2, y: b.y - BALL_SIZE / 2, w: BALL_SIZE, h: BALL_SIZE })) {
      coverFloor(world, world.player.x, left, right); return false;
    }
    return true;
  });
}
