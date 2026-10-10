import { T } from '../constants';
import type { World } from '../World';
import { makeParticle } from './particles';

/**
 * Aros del juego de pelota (op `['hoop', x, y]`, AGENTS.md §4.3 · 4-1 Chichén Itzá).
 * Como en el Gran Juego de Pelota, el aro de piedra está empotrado en lo alto del
 * muro de la cancha. No es sólido: la pelota de pok ta pok lo atraviesa.
 *
 * Recompensa: al pasar la pelota por el centro, el aro se ilumina (una sola vez),
 * suma HOOP_SCORE puntos y suelta HOOP_COINS granos de cacao que se cuentan al
 * instante. Esos granos forman parte de `BuiltLevel.totalCoins`, así que encestar
 * en los aros ayuda a conseguir las estrellas por cacao.
 */
export interface HoopSpec {
  /** Columna del bloque que ocupa el aro. */
  x: number;
  /** Fila del bloque que ocupa el aro. */
  y: number;
}

export interface Hoop {
  tx: number;
  ty: number;
  /** El aro ya recibió la pelota. */
  lit: boolean;
  /** Segundos desde que se iluminó (para el destello del dibujo). */
  litT: number;
}

/** Granos de cacao que suelta un aro al encestar. */
export const HOOP_COINS = 5;
/** Puntos por encestar en un aro. */
export const HOOP_SCORE = 2000;
/** Distancia máxima (px) entre el centro de la pelota y el del aro para que cuente. */
export const HOOP_CATCH_RADIUS = 16;
/** Velocidad (px/s) con la que saltan los granos de cacao del aro. */
const HOOP_COIN_SPEED = 520;
/** Separación (px) entre los granos del abanico. */
const HOOP_COIN_SPREAD = 14;
/** Chispas doradas al encestar. */
const HOOP_SPARKS = 12;
const HOOP_SPARK_SPEED = 150;

export function createHoops(specs: readonly HoopSpec[]): Hoop[] {
  return specs.map((s) => ({ tx: s.x, ty: s.y, lit: false, litT: 0 }));
}

/** Centro del aro en píxeles. */
export function hoopCenter(h: Hoop): { x: number; y: number } {
  return { x: h.tx * T + T / 2, y: h.ty * T + T / 2 };
}

/** Aro todavía apagado cuyo centro está a menos de HOOP_CATCH_RADIUS de (x, y). */
export function hoopAt(hoops: readonly Hoop[], x: number, y: number): Hoop | null {
  for (const h of hoops) {
    if (h.lit) continue;
    const c = hoopCenter(h);
    if (Math.hypot(c.x - x, c.y - y) < HOOP_CATCH_RADIUS) return h;
  }
  return null;
}

/** Ilumina el aro y entrega su recompensa (puntos + cacao). */
export function scoreHoop(world: World, h: Hoop): void {
  if (h.lit) return;
  h.lit = true;
  h.litT = 0;
  const c = hoopCenter(h);
  world.addScore(HOOP_SCORE, c.x, c.y - T);
  world.audio.play('power');
  for (let i = 0; i < HOOP_COINS; i++) {
    // Abanico de granos sobre el aro (la partícula 'coin' solo se mueve en vertical).
    const offset = i - (HOOP_COINS - 1) / 2;
    world.particles.push(
      makeParticle('coin', c.x + offset * HOOP_COIN_SPREAD, c.y, { vy: -HOOP_COIN_SPEED + Math.abs(offset) * HOOP_COIN_SPREAD }),
    );
    world.addCoin(c.x, c.y);
  }
  for (let i = 0; i < HOOP_SPARKS; i++) {
    const a = (i / HOOP_SPARKS) * Math.PI * 2;
    world.particles.push(
      makeParticle('spark', c.x, c.y, { vx: Math.cos(a) * HOOP_SPARK_SPEED, vy: Math.sin(a) * HOOP_SPARK_SPEED, col: '#ffd23f' }),
    );
  }
}

/** Avanza el temporizador del destello de los aros encendidos. */
export function updateHoops(hoops: readonly Hoop[], dt: number): void {
  for (const h of hoops) if (h.lit) h.litT += dt;
}
