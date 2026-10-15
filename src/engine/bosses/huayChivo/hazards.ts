import { GROUND, T, TAU } from '../../constants';
import type { Rect } from '../../types';
import type { World } from '../../World';
import {
  ARCH_FRACTIONS, BLINK_MIN_DIST, byPhase, type ChivoPhase, GRAVITY, LEAP_JUMP, LEAP_MAX_DX, MAX_FALL,
  ORBIT_RADIUS, ORBIT_SPEED, ORBIT_TIME, SCORE_WISP, STOMP_WAVE_PAIRS, WAVE_GAP, WAVE_H, WAVE_SPEED, WAVE_W,
  WISP_COUNT, WISP_FADE, WISP_LIFE, WISP_SIZE, WISP_SPAWN_TIME, WISP_SPEED, WISP_STEER,
} from './tuning';

/**
 * Peligros del Huay Chivo: destino del teletransporte, física del salto, ondas del
 * pisotón y fuegos fatuos. Son del jefe (no del `World`): él los mueve y los dibuja.
 * Las listas se compactan en sitio para no crear arrays en cada paso de 120 Hz.
 */

/** Onda de choque a ras de suelo; se esquiva saltándola. */
export interface ChivoWave {
  x: number;
  readonly dir: 1 | -1;
  readonly speed: number;
  /** Segundos que espera antes de salir (la segunda de cada lado sale con retraso). */
  delay: number;
  t: number;
}

/** Fuego fatuo: nace inofensivo, orbita el punto de invocación y luego persigue. */
export interface Wisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  angle: number;
  /** Centro de la órbita (px). */
  readonly ox: number;
  readonly oy: number;
  readonly speed: number;
  readonly orbit: number;
}

/** Cuerpo que salta (el jefe): basta con posición y velocidad. */
export interface LeapBody { x: number; y: number; vx: number; vy: number }

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
/** Colisión escalar reutilizable: los peligros no crean rectángulos a 120 Hz. */
const touches = (p: Rect, x: number, y: number, w: number, h: number): boolean =>
  p.x < x + w && p.x + p.w > x && p.y < y + h && p.y + p.h > y;

/** Centro (px) del arco `i` de la arena. */
export const archCenter = (left: number, right: number, i: number): number => left + (right - left) * ARCH_FRACTIONS[i];

/**
 * Borde izquierdo (px) del jefe al aparecer: un arco cuyo centro dista al menos
 * `BLINK_MIN_DIST` del jugador. Los arcos extremos distan más de dos veces esa
 * distancia, así que siempre hay al menos uno válido.
 */
export function blinkTarget(playerX: number, left: number, right: number, w: number, rng: () => number): number {
  let valid = 0;
  for (let i = 0; i < ARCH_FRACTIONS.length; i++) if (Math.abs(archCenter(left, right, i) - playerX) >= BLINK_MIN_DIST) valid++;
  let pick = Math.min(valid - 1, Math.floor(rng() * valid));
  let center = archCenter(left, right, 0);
  for (let i = 0; i < ARCH_FRACTIONS.length; i++) {
    const c = archCenter(left, right, i);
    if (Math.abs(c - playerX) < BLINK_MIN_DIST) continue;
    center = c;
    if (pick-- === 0) break;
  }
  return clamp(center - w / 2, left, right - w);
}

/** Borde izquierdo donde caerá el salto: sobre el jugador, sin pasar de `LEAP_MAX_DX` ni salir de la arena. */
export function leapTarget(fromX: number, playerX: number, w: number, left: number, right: number): number {
  const wanted = clamp(playerX - w / 2, fromX - LEAP_MAX_DX, fromX + LEAP_MAX_DX);
  return clamp(wanted, left, right - w);
}

/** Velocidad horizontal para caer, tras un impulso de `LEAP_JUMP`, sobre `targetX`. */
export function leapVx(fromX: number, targetX: number): number {
  return (targetX - fromX) / ((2 * LEAP_JUMP) / GRAVITY);
}

/** Integra un paso del salto; devuelve `true` al tocar el suelo (`floorY` es el borde superior en reposo). */
export function stepLeapBody(b: LeapBody, dt: number, floorY: number): boolean {
  b.vy = Math.min(b.vy + GRAVITY * dt, MAX_FALL);
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.vy <= 0 || b.y < floorY) return false;
  b.y = floorY;
  b.vy = 0;
  return true;
}

export const waveRect = (w: ChivoWave): Rect => ({ x: w.x - WAVE_W / 2, y: GROUND * T - WAVE_H, w: WAVE_W, h: WAVE_H });

/** Añade a `out` las parejas de ondas del pisotón en `x`: una a cada lado por pareja. */
export function stompWaves(out: ChivoWave[], x: number, phase: ChivoPhase): void {
  const speed = byPhase(WAVE_SPEED, phase);
  const pairs = byPhase(STOMP_WAVE_PAIRS, phase);
  for (let i = 0; i < pairs; i++) {
    const delay = (i * WAVE_GAP) / speed;
    out.push({ x, dir: -1, speed, delay, t: 0 }, { x, dir: 1, speed, delay, t: 0 });
  }
}

/** Avanza las ondas, hiere al jugador que toca una y descarta las que salen de la arena. */
export function stepWaves(world: World, waves: ChivoWave[], dt: number, left: number, right: number): void {
  let n = 0;
  for (const w of waves) {
    if (w.delay > 0) w.delay -= dt;
    else {
      w.x += w.dir * w.speed * dt;
      w.t += dt;
      if (w.x < left || w.x > right) continue;
      if (world.phase === 'play' && touches(world.player, w.x - WAVE_W / 2, GROUND * T - WAVE_H, WAVE_W, WAVE_H)) world.hurt();
    }
    waves[n++] = w;
  }
  waves.length = n;
}

/** Añade `WISP_COUNT` fuegos fatuos repartidos en círculo alrededor de (cx, cy). */
export function callWisps(out: Wisp[], cx: number, cy: number, phase: ChivoPhase): void {
  const count = byPhase(WISP_COUNT, phase);
  const speed = byPhase(WISP_SPEED, phase);
  const orbit = byPhase(ORBIT_TIME, phase);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU;
    out.push({
      x: cx + Math.cos(angle) * ORBIT_RADIUS, y: cy + Math.sin(angle) * ORBIT_RADIUS,
      vx: 0, vy: 0, age: 0, angle, ox: cx, oy: cy, speed, orbit,
    });
  }
}

export const wispRect = (w: Wisp): Rect => ({ x: w.x - WISP_SIZE / 2, y: w.y - WISP_SIZE / 2, w: WISP_SIZE, h: WISP_SIZE });

/** Solo dañan entre el nacimiento y el desvanecimiento final. */
export const wispHarmful = (w: Wisp): boolean => w.age >= WISP_SPAWN_TIME && w.age < WISP_LIFE - WISP_FADE;

/** Persecución con giro limitado: la velocidad cambia como mucho `WISP_STEER` px/s². */
function chase(w: Wisp, tx: number, ty: number, dt: number): void {
  const dx = tx - w.x;
  const dy = ty - w.y;
  const d = Math.hypot(dx, dy) || 1;
  let ax = (dx / d) * w.speed - w.vx;
  let ay = (dy / d) * w.speed - w.vy;
  const a = Math.hypot(ax, ay);
  const maxDv = WISP_STEER * dt;
  if (a > maxDv) { ax *= maxDv / a; ay *= maxDv / a; }
  w.vx += ax;
  w.vy += ay;
  const v = Math.hypot(w.vx, w.vy);
  if (v > w.speed) { w.vx *= w.speed / v; w.vy *= w.speed / v; }
  w.x += w.vx * dt;
  w.y += w.vy * dt;
}

function moveWisp(world: World, w: Wisp, dt: number): void {
  w.age += dt;
  if (w.age < w.orbit) {
    w.angle += ORBIT_SPEED * dt;
    w.x = w.ox + Math.cos(w.angle) * ORBIT_RADIUS;
    w.y = w.oy + Math.sin(w.angle) * ORBIT_RADIUS;
    return;
  }
  const p = world.player;
  chase(w, p.x + p.w / 2, p.y + p.h / 2, dt);
}

/** Una bola de fuego del jugador apaga el fuego fatuo; devuelve si hubo impacto. */
function quench(world: World, w: Wisp): boolean {
  for (const f of world.fireballs) {
    if (f.gone || Math.abs(f.x - w.x) >= WISP_SIZE / 2 + 8 || Math.abs(f.y - w.y) >= WISP_SIZE / 2 + 8) continue;
    f.gone = true;
    world.addScore(SCORE_WISP, w.x, w.y);
    world.audio.play('fire');
    return true;
  }
  return false;
}

/** Quita en sitio las bolas de fuego gastadas (el jefe se actualiza antes que ellas). */
function dropSpentFireballs(world: World): void {
  const list = world.fireballs;
  let n = 0;
  for (const f of list) if (!f.gone) list[n++] = f;
  list.length = n;
}

/** Mueve, apaga y caduca los fuegos fatuos; hiere al jugador que toca uno activo. */
export function stepWisps(world: World, wisps: Wisp[], dt: number): void {
  let n = 0;
  let quenched = false;
  for (const w of wisps) {
    moveWisp(world, w, dt);
    if (w.age >= WISP_LIFE) continue;
    if (quench(world, w)) { quenched = true; continue; }
    if (wispHarmful(w) && world.phase === 'play' && touches(world.player, w.x - WISP_SIZE / 2, w.y - WISP_SIZE / 2, WISP_SIZE, WISP_SIZE)) {
      world.hurt();
      continue;
    }
    wisps[n++] = w;
  }
  wisps.length = n;
  if (quenched) dropSpentFireballs(world);
}
