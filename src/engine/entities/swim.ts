import {
  MAX_SINK_SPEED,
  OXYGEN_MAX,
  OXYGEN_REFILL_RATE,
  ROWS,
  STROKE_FX_TIME,
  SWIM_ACCEL,
  SWIM_DRAG,
  SWIM_ENTRY_BRAKE,
  SWIM_EXIT_JUMP,
  SWIM_GRAVITY,
  SWIM_HEAD_DEPTH,
  SWIM_MAX_SPEED,
  SWIM_STROKE,
  T,
} from '../constants';
import { bubbleStream, currentAt, waterAt, waterColumn, type WaterZone } from '../level/zones';
import { overlap } from '../physics';
import type { Rect } from '../types';
import type { World } from '../World';
import { ENEMIES } from './enemies';
import type { Enemy, Player } from './types';

/**
 * Física de nado, oxígeno y corrientes (AGENTS.md §5.1 y §5.2).
 * El jugador "nada" cuando el centro de su cuerpo está dentro de una zona de agua;
 * respira cuando la cabeza está por encima de la superficie o dentro de una
 * columna de burbujas.
 */

const centerX = (r: Rect): number => r.x + r.w / 2;

/** El centro del cuerpo está bajo el agua. */
export const isSwimming = (zones: readonly WaterZone[], r: Rect): boolean =>
  waterAt(zones, centerX(r), r.y + r.h / 2) !== null;

/** La cabeza está bajo el agua (no puede respirar). */
export const headUnderwater = (zones: readonly WaterZone[], r: Rect): boolean =>
  waterAt(zones, centerX(r), r.y + SWIM_HEAD_DEPTH) !== null;

const feetInWater = (zones: readonly WaterZone[], r: Rect): boolean =>
  waterAt(zones, centerX(r), r.y + r.h - 1) !== null;

/** Desplazamiento (px) que la corriente aplica al jugador en este paso. */
export function currentDrift(world: World, p: Player, dt: number): readonly [number, number] {
  const cur = currentAt(world.level.currents, centerX(p), p.y + p.h / 2);
  return cur ? [cur.vx * T * dt, cur.vy * T * dt] : [0, 0];
}

function stroke(world: World, vy: number): void {
  const p = world.player;
  p.vy = vy;
  p.jumpBuf = 0;
  p.strokeT = STROKE_FX_TIME;
  world.audio.play('jump');
}

/**
 * Salto para salir del agua: solo con los pies en el agua y la cabeza fuera.
 * Consume el salto almacenado. Devuelve true si saltó.
 */
export function trySurfaceLeap(world: World): boolean {
  const p = world.player;
  const zones = world.level.water;
  if (p.jumpBuf <= 0 || !feetInWater(zones, p) || headUnderwater(zones, p)) return false;
  stroke(world, -SWIM_EXIT_JUMP);
  return true;
}

/** Control horizontal en el agua: aceleración suave y frenado del agua. */
function swimHorizontal(world: World, dt: number): void {
  const p = world.player;
  const held = world.input.held;
  const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  if (dir) {
    p.vx += dir * SWIM_ACCEL * dt;
    p.face = dir > 0 ? 1 : -1;
  }
  // El agua frena hacia 0 sin dirección, o hacia SWIM_MAX_SPEED si se entra corriendo.
  const excess = Math.abs(p.vx) - (dir ? SWIM_MAX_SPEED : 0);
  if (excess > 0) {
    const brake = (SWIM_DRAG + (dir ? SWIM_ACCEL : 0)) * dt;
    p.vx -= Math.sign(p.vx) * Math.min(excess, brake);
  }
}

/** Un paso de nado: brazadas, gravedad reducida y velocidad de hundimiento limitada. */
export function swimStep(world: World, dt: number): void {
  const p = world.player;
  swimHorizontal(world, dt);
  if (!trySurfaceLeap(world) && p.jumpBuf > 0) stroke(world, -SWIM_STROKE);
  if (p.vy > MAX_SINK_SPEED) p.vy = Math.max(MAX_SINK_SPEED, p.vy - SWIM_ENTRY_BRAKE * dt);
  else p.vy = Math.min(p.vy + SWIM_GRAVITY * dt, MAX_SINK_SPEED);
  p.coyote = 0;
}

/** El fondo del nivel hace de lecho marino para quien nada (los hoyos con agua no matan). */
export function clampSeabed(p: Player): void {
  const floor = ROWS * T;
  if (p.y + p.h > floor) {
    p.y = floor - p.h;
    p.vy = Math.min(p.vy, 0);
  }
}

function inBubbles(world: World, r: Rect): boolean {
  return world.level.bubbles.some((v) => overlap(r, bubbleStream(v, world.level.water)));
}

/** Consume oxígeno con la cabeza bajo el agua; lo recarga al respirar. Sin oxígeno, muere. */
export function updateOxygen(world: World, dt: number): void {
  const p = world.player;
  const under = headUnderwater(world.level.water, p);
  if (!under || inBubbles(world, p) || world.boss?.providesAir?.(p)) {
    p.oxygen = Math.min(OXYGEN_MAX, p.oxygen + OXYGEN_REFILL_RATE * dt);
    return;
  }
  if (p.snorkel > 0) {
    p.snorkel = Math.max(0, p.snorkel - dt);
    return;
  }
  p.oxygen = Math.max(0, p.oxygen - dt);
  if (p.oxygen <= 0) world.die();
}

/** Posición x de cada enemigo nadador antes de moverse (para `confineSwimmers`). */
export function swimmerPositions(enemies: readonly Enemy[]): Map<Enemy, number> {
  const out = new Map<Enemy, number>();
  for (const e of enemies) if (ENEMIES[e.id].swimming && e.alive && !e.dead) out.set(e, e.x);
  return out;
}

/**
 * Los enemigos nadadores no salen del agua: si su centro abandona la columna de agua
 * vuelven atrás y giran; en vertical quedan entre la superficie y el fondo.
 */
export function confineSwimmers(world: World, before: ReadonlyMap<Enemy, number>): void {
  const zones = world.level.water;
  for (const [e, prevX] of before) {
    if (!e.alive || e.dead) continue;
    const zone = waterColumn(zones, Math.floor(centerX(e) / T));
    if (!zone) {
      if (waterColumn(zones, Math.floor((prevX + e.w / 2) / T))) {
        e.x = prevX;
        e.vx = -e.vx;
      }
      continue;
    }
    e.y = Math.max(zone.surface * T, Math.min(e.y, ROWS * T - e.h));
  }
}
