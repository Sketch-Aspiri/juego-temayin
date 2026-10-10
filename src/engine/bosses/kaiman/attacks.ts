import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import { waterColumn } from '../../level/zones';
import { overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import { byPhase, WAVE_H, WAVE_SPEED, WAVE_W } from './tuning';

/**
 * Ataques a distancia del Kaimán: la ola del coletazo y la posición de emersión.
 * Las olas son del jefe (no del `World`): las mueve y dibuja él mismo.
 */

/** Ola que viaja por el suelo (o el agua) de la arena. */
export interface TailWave {
  x: number;
  readonly dir: 1 | -1;
  readonly speed: number;
  t: number;
}

const SPLASH_PARTICLES = 10;

/** Altura (px) de la superficie en la columna de `px`: el agua si la hay, si no el suelo. */
export function surfaceY(world: World, px: number): number {
  const z = waterColumn(world.level.water, Math.floor(px / T));
  const ground = GROUND * T;
  return z ? Math.min(ground, z.surface * T) : ground;
}

export const waveRect = (w: TailWave): Rect => ({ x: w.x - WAVE_W / 2, y: GROUND * T - WAVE_H, w: WAVE_W, h: WAVE_H });

/** Olas que lanza un coletazo desde `x`: hacia el jugador; en la fase 2, también hacia atrás. */
export function tailWaves(x: number, face: 1 | -1, phase2: boolean): TailWave[] {
  const speed = byPhase(WAVE_SPEED, phase2);
  const front: TailWave = { x, dir: face, speed, t: 0 };
  return phase2 ? [front, { x, dir: face === 1 ? -1 : 1, speed, t: 0 }] : [front];
}

/**
 * Avanza las olas, hiere al jugador que toca una y devuelve las que siguen dentro de
 * la arena (`left`..`right` en px).
 */
export function stepWaves(world: World, waves: readonly TailWave[], dt: number, left: number, right: number): TailWave[] {
  const out: TailWave[] = [];
  for (const w of waves) {
    w.x += w.dir * w.speed * dt;
    w.t += dt;
    if (w.x < left || w.x > right) continue;
    if (world.phase === 'play' && overlap(world.player, waveRect(w))) world.hurt();
    out.push(w);
  }
  return out;
}

/** Columna (px, borde izquierdo) donde emergerá el jefe: centrado bajo el jugador, dentro de la arena. */
export function emergeX(world: World, width: number, left: number, right: number): number {
  const p = world.player;
  const x = p.x + p.w / 2 - width / 2;
  return Math.max(left, Math.min(right - width, x));
}

/** Salpicadura de agua y lodo en (x, y). */
export function splash(world: World, x: number, y: number): void {
  for (let i = 0; i < SPLASH_PARTICLES; i++) {
    const a = -Math.PI * (0.15 + (0.7 * i) / (SPLASH_PARTICLES - 1));
    const s = 180 + Math.random() * 160;
    const col = i % 2 ? '#9fb88a' : '#d8f0e0';
    world.particles.push(makeParticle('spark', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col }));
  }
}
