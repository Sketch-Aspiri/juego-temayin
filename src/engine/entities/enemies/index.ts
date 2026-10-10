import { ROWS, T, VW } from '../constants';
import type { EnemySpawn } from '../level/build';
import { moveX, moveY, overlap } from '../physics';
import type { EnemyId } from '../types';
import type { World } from '../World';
import type { Enemy } from './types';

export interface EnemyDef {
  id: EnemyId;
  w: number;
  h: number;
  /** Se puede eliminar saltándole encima. */
  stompable: boolean;
  /** Ignora la gravedad y ondula en el aire. */
  flying: boolean;
  speed: number;
  score: number;
}

/**
 * Registro de enemigos. Para añadir uno nuevo: declarar aquí su definición,
 * añadir su id a `EnemyId` y dibujarlo en `render/sprites.ts`.
 */
export const ENEMIES: Readonly<Record<EnemyId, EnemyDef>> = {
  coati: { id: 'coati', w: 36, h: 34, stompable: true, flying: false, speed: 60, score: 200 },
  urchin: { id: 'urchin', w: 36, h: 34, stompable: false, flying: false, speed: 60, score: 200 },
  bat: { id: 'bat', w: 34, h: 26, stompable: true, flying: true, speed: 75, score: 300 },
};

const FLY_AMPLITUDE = 28;

export function createEnemy(spawn: EnemySpawn): Enemy {
  const def = ENEMIES[spawn.id];
  const y = def.flying ? spawn.ty * T : spawn.ty * T + (T - def.h);
  return {
    id: spawn.id,
    x: spawn.tx * T + 2,
    y,
    baseY: y,
    w: def.w,
    h: def.h,
    vx: -def.speed,
    vy: 0,
    onGround: false,
    dead: 0,
    flip: false,
    alive: true,
    active: false,
    t: Math.random() * 10,
  };
}

export function updateEnemies(world: World, dt: number): void {
  const p = world.player;
  for (const e of world.enemies) {
    if (!e.alive) continue;
    if (!e.active) {
      if (e.x < world.camX + VW + 60) e.active = true;
      else continue;
    }
    e.t += dt;

    if (e.dead) {
      e.dead += dt;
      if (e.flip) {
        e.vy += 1800 * dt;
        e.y += e.vy * dt;
        e.x += e.vx * dt;
        if (e.y > ROWS * T + 100) e.alive = false;
      } else if (e.dead > 0.5) e.alive = false;
      continue;
    }

    const def = ENEMIES[e.id];
    if (def.flying) {
      if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
      e.y = e.baseY + Math.sin(e.t * 3) * FLY_AMPLITUDE;
    } else {
      e.vy = Math.min(e.vy + 2000 * dt, 900);
      if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
      moveY(e, e.vy * dt, world.solidAt);
    }

    for (const o of world.enemies) {
      if (o !== e && o.alive && !o.dead && o.active && overlap(e, o) && e.x < o.x === e.vx > 0) e.vx = -e.vx;
    }
    if (e.y > ROWS * T + 50 || e.x < world.camX - 200) {
      e.alive = false;
      continue;
    }

    if (overlap(p, e)) {
      const stomp = p.vy > 0 && p.y + p.h - e.y < 22;
      if (stomp && def.stompable) {
        world.killEnemy(e, false);
        p.vy = world.input.held.jump ? -820 : -500;
      } else world.hurt();
    }
  }
}
