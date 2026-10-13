import { ROWS, T, VW } from '../../constants';
import type { EnemySpawn } from '../../level/build';
import { overlap } from '../../physics';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { ENEMIES, isTangible } from './registry';

export { ENEMIES, isAirborne, isTangible } from './registry';
export type { EnemyDef, EnemyMove } from './types';

const DEAD_FALL_GRAVITY = 1800;
const DEAD_FADE_TIME = 0.5;
const ACTIVATION_MARGIN = 60;
/** Margen (px) entre los pies del jugador y el lomo de lo que pisa para contar como pisotón. */
export const STOMP_TOLERANCE = 22;
/** Rebote tras un pisotón con el salto pulsado / sin pulsar (px/s). */
export const STOMP_BOUNCE_HELD = -820;
export const STOMP_BOUNCE = -500;

export function createEnemy(spawn: EnemySpawn): Enemy {
  const def = ENEMIES[spawn.id];
  const airborne = def.flying || !!def.swimming;
  const y = airborne ? spawn.ty * T : spawn.ty * T + (T - def.h);
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
    state: 0,
    timer: 0,
  };
}

/** Animación de muerte: cae girado (`flip`) o desaparece tras un instante. */
function updateDying(e: Enemy, dt: number): void {
  e.dead += dt;
  if (e.flip) {
    e.vy += DEAD_FALL_GRAVITY * dt;
    e.y += e.vy * dt;
    e.x += e.vx * dt;
    if (e.y > ROWS * T + 100) e.alive = false;
  } else if (e.dead > DEAD_FADE_TIME) e.alive = false;
}

/** Contacto con el jugador: pisotón si cae desde arriba sobre un enemigo pisable; si no, daño. */
function touchPlayer(world: World, e: Enemy): void {
  const p = world.player;
  if (!overlap(p, e) || !isTangible(e)) return;
  const def = ENEMIES[e.id];
  const feetOnTop = p.y + p.h - e.y < STOMP_TOLERANCE;
  // Acaba de rebotar sobre un enemigo que sobrevive al pisotón (fila de hormigas): sin daño.
  if (p.vy < 0 && feetOnTop) return;
  const stompable = def.canStomp ? def.canStomp(e) : def.stompable;
  if (p.vy > 0 && feetOnTop && stompable) {
    if (def.onStomp) def.onStomp(e, world);
    else world.killEnemy(e, false);
    p.vy = world.input.held.jump ? STOMP_BOUNCE_HELD : STOMP_BOUNCE;
  } else if (def.onTouch) def.onTouch(e, world);
  else world.hurt();
}

export function updateEnemies(world: World, dt: number): void {
  for (const e of world.enemies) {
    if (!e.alive) continue;
    if (!e.active) {
      if (e.x < world.camX + VW + ACTIVATION_MARGIN) e.active = true;
      else continue;
    }
    e.t += dt;

    if (e.dead) {
      updateDying(e, dt);
      continue;
    }

    ENEMIES[e.id].move(e, world, dt);
    // Una sombra disuelta por la luz no puede herir en el mismo paso.
    if (e.dead || !e.alive) continue;

    for (const o of world.enemies) {
      if (o !== e && o.alive && !o.dead && o.active && overlap(e, o) && e.x < o.x === e.vx > 0) e.vx = -e.vx;
    }
    if (e.y > ROWS * T + 50 || e.x < world.camX - 200) {
      e.alive = false;
      continue;
    }
    touchPlayer(world, e);
  }
}
