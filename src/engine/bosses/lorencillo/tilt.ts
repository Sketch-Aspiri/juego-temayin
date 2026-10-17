import { moveX } from '../../physics';
import type { World } from '../../World';
import { TILT_ACTIVE, TILT_DRIFT, TILT_REST, TILT_WARN } from './tuning';

/**
 * Inclinación de la cubierta (fase 2). Ciclo: reposo -> aviso (el barco cruje y se
 * ladea, sin efecto) -> deriva (arrastra a quien está apoyado) -> reposo. La dirección
 * se sortea al empezar el aviso, así el jugador sabe hacia dónde correr antes de que
 * actúe. Solo desplaza al jugador: enemigos y jefe no se ven afectados.
 */

export type TiltPhase = 'rest' | 'warn' | 'active';

export interface Tilt {
  phase: TiltPhase;
  dir: 1 | -1;
  /** Tiempo en la fase actual. */
  t: number;
}

export const createTilt = (): Tilt => ({ phase: 'rest', dir: 1, t: 0 });

export function resetTilt(tilt: Tilt): void {
  tilt.phase = 'rest';
  tilt.t = 0;
}

const DURATION: Readonly<Record<TiltPhase, number>> = { rest: TILT_REST, warn: TILT_WARN, active: TILT_ACTIVE };
const NEXT: Readonly<Record<TiltPhase, TiltPhase>> = { rest: 'warn', warn: 'active', active: 'rest' };

export function stepTilt(tilt: Tilt, dt: number, rng: () => number): void {
  tilt.t += dt;
  if (tilt.t < DURATION[tilt.phase]) return;
  tilt.phase = NEXT[tilt.phase];
  tilt.t = 0;
  if (tilt.phase === 'warn') tilt.dir = rng() < 0.5 ? -1 : 1;
}

/** Velocidad de deriva (px/s, con signo); 0 fuera de la fase activa. */
export const tiltDrift = (tilt: Tilt): number => (tilt.phase === 'active' ? tilt.dir * TILT_DRIFT : 0);

/** Inclinación visible entre -1 y 1: crece durante el aviso, se mantiene y cede al terminar. */
export function tiltAmount(tilt: Tilt): number {
  if (tilt.phase === 'rest') return 0;
  const ramp = tilt.phase === 'warn' ? tilt.t / TILT_WARN : 1;
  return tilt.dir * Math.min(1, ramp);
}

/** Arrastra al jugador apoyado, respetando los muros. */
export function applyTilt(world: World, tilt: Tilt, dt: number): void {
  const drift = tiltDrift(tilt);
  const p = world.player;
  if (drift === 0 || !p.onGround) return;
  moveX(p, drift * dt, world.solidAt);
}
