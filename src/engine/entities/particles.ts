import { ROWS, T } from '../constants';
import type { Particle, ParticleKind, Popup } from './types';

export const POPUP_LIFETIME = 0.9;
const SPARK_LIFETIME = 1.2;

export function makeParticle(kind: ParticleKind, x: number, y: number, extra: Partial<Particle> = {}): Particle {
  return { kind, x, y, vx: 0, vy: 0, t: 0, rot: 0, col: '#fff', gone: false, ...extra };
}

/** Avanza las partículas y devuelve solo las que siguen vivas. */
export function stepParticles(list: Particle[], dt: number): Particle[] {
  for (const q of list) {
    q.t += dt;
    switch (q.kind) {
      case 'coin':
        q.vy += 1800 * dt;
        q.y += q.vy * dt;
        if (q.t > 0.55) q.gone = true;
        break;
      case 'brick':
        q.vy += 1800 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.rot += dt * 10;
        if (q.y > ROWS * T + 50) q.gone = true;
        break;
      case 'spark':
        q.vy += 120 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 0.98;
        q.vy *= 0.98;
        if (q.t > SPARK_LIFETIME) q.gone = true;
        break;
      case 'dust':
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.t > 0.5) q.gone = true;
        break;
    }
  }
  return list.filter((q) => !q.gone);
}

export function stepPopups(list: Popup[], dt: number): Popup[] {
  for (const u of list) u.t += dt;
  return list.filter((u) => u.t < POPUP_LIFETIME);
}

export { SPARK_LIFETIME };
