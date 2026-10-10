import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import { overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import { BARK_WAVES, BEHIND_DIST, byPhase, GRAVITY, LEAP_JUMP, WAVE_GAP, WAVE_H, WAVE_SPEED, WAVE_W } from './tuning';

/**
 * Ataques del Huay Pek: las ondas de choque del ladrido, el punto de reaparición a
 * la espalda del jugador y la velocidad del salto. Las ondas son del jefe (no del
 * `World`): las mueve y dibuja él mismo.
 */

/** Onda de choque que viaja a ras de suelo; se esquiva saltándola. */
export interface ShockWave {
  x: number;
  readonly dir: 1 | -1;
  readonly speed: number;
  t: number;
}

const MIST_PARTICLES = 12;
const MIST_COLORS = ['#7fe6e0', '#3fa7c9', '#d8fff8'] as const;

export const waveRect = (w: ShockWave): Rect => ({ x: w.x - WAVE_W / 2, y: GROUND * T - WAVE_H, w: WAVE_W, h: WAVE_H });

/**
 * Ondas de un ladrido desde `x` hacia `dir`. En la fase 2 salen dos seguidas
 * (la segunda empieza `WAVE_GAP` px por detrás): hay que saltar dos veces.
 */
export function barkWaves(x: number, dir: 1 | -1, phase2: boolean): ShockWave[] {
  const speed = byPhase(WAVE_SPEED, phase2);
  const n = byPhase(BARK_WAVES, phase2);
  return Array.from({ length: n }, (_, i) => ({ x: x - dir * i * WAVE_GAP, dir, speed, t: 0 }));
}

/**
 * Avanza las ondas, hiere al jugador que toca una y devuelve las que siguen dentro
 * de la arena (`left`..`right` en px). Las que aún no han entrado (fase 2) esperan.
 */
export function stepShockWaves(world: World, waves: readonly ShockWave[], dt: number, left: number, right: number): ShockWave[] {
  const out: ShockWave[] = [];
  for (const w of waves) {
    w.x += w.dir * w.speed * dt;
    w.t += dt;
    const ahead = w.dir === 1 ? w.x > right : w.x < left;
    if (ahead) continue;
    const inside = w.x >= left && w.x <= right;
    if (inside && world.phase === 'play' && overlap(world.player, waveRect(w))) world.hurt();
    out.push(w);
  }
  return out;
}

/**
 * Borde izquierdo (px) donde reaparece: a la espalda del jugador (según hacia dónde
 * mira). Si ahí no cabe en la arena, aparece delante.
 */
export function behindPlayerX(world: World, width: number, left: number, right: number): number {
  const p = world.player;
  const cx = p.x + p.w / 2;
  const fits = (c: number): boolean => c - width / 2 >= left && c + width / 2 <= right;
  const back = cx - p.face * BEHIND_DIST;
  const center = fits(back) ? back : cx + p.face * BEHIND_DIST;
  return Math.max(left, Math.min(right - width, center - width / 2));
}

/** Velocidad horizontal para caer, tras un salto de `LEAP_JUMP`, sobre `targetX`. */
export function leapVx(fromX: number, targetX: number): number {
  const airTime = (2 * LEAP_JUMP) / GRAVITY;
  return (targetX - fromX) / airTime;
}

/** Remolino de niebla espectral en (x, y): al desvanecerse y al reaparecer. */
export function mistBurst(world: World, x: number, y: number): void {
  for (let i = 0; i < MIST_PARTICLES; i++) {
    const a = (i / MIST_PARTICLES) * Math.PI * 2;
    const s = 60 + Math.random() * 120;
    const col = MIST_COLORS[i % MIST_COLORS.length];
    world.particles.push(makeParticle('spark', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, col }));
  }
}
