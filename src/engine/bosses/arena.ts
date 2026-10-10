import { GROUND, T } from '../constants';
import { makeParticle } from '../entities/particles';
import type { Rect } from '../types';
import type { World } from '../World';

/**
 * Utilidades comunes de las arenas de jefe: cerrar la entrada, abrir el muro de
 * salida y repartir el premio. (Púas aún tiene su propia copia; se pueden unificar.)
 */

/** Monedas que suma el jefe al desaparecer. */
const REWARD_COINS = 7;
const REWARD_SPARKS = 30;
const REWARD_COIN_PARTICLES = 8;
const SPARK_COLORS = ['#ffd23f', '#e67e22', '#fff'] as const;

/** Columna de muro a la izquierda de la arena que se cierra al empezar la pelea. */
export const entranceColumn = (a0: number): number => a0 - 1;

/** Cierra la arena detrás del jugador con un muro de piedra. */
export function closeArena(world: World, a0: number): void {
  const x = entranceColumn(a0);
  for (let y = 0; y < GROUND; y++) world.grid[y][x] = 'X';
}

/** Rompe el muro de salida (columna `a1 + 1`) en ladrillos. */
export function openExit(world: World, a1: number): void {
  const wx = a1 + 1;
  for (let y = 0; y < GROUND; y++) {
    if (world.grid[y][wx] !== 'X') continue;
    world.grid[y][wx] = ' ';
    world.particles.push(
      makeParticle('brick', wx * T + 20, y * T + 20, { vx: 80 + Math.random() * 120, vy: -300 - Math.random() * 300 }),
    );
  }
}

/** Chispas y monedas al vencer al jefe. */
export function rewardBurst(world: World, r: Rect): void {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  for (let i = 0; i < REWARD_SPARKS; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 100 + Math.random() * 200;
    const col = SPARK_COLORS[i % SPARK_COLORS.length];
    world.particles.push(makeParticle('spark', cx, cy, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col }));
  }
  for (let i = 0; i < REWARD_COIN_PARTICLES; i++) {
    world.particles.push(makeParticle('coin', r.x + 20 + i * 14, r.y, { vy: -500 - Math.random() * 300 }));
  }
  world.session.coins += REWARD_COINS;
  world.addCoin(cx, r.y);
}
