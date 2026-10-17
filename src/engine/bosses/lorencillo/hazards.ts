import { GROUND, T } from '../../constants';
import { createEnemy } from '../../entities/enemies';
import type { Enemy } from '../../entities/types';
import type { Rect } from '../../types';
import type { World } from '../../World';
import {
  byPhase, CANNON_SHELLS, CANNON_WARN, CRAB_OFFSET_TILES, CRAB_THROW_LIFT, CRAB_THROW_SPEED, type LorenPhase, MAX_CRABS, SHELL_APEX, SHELL_BURST_LIFE,
  SHELL_FLIGHT, SHELL_GAP, SHELL_RADIUS, SHELL_SPREAD,
} from './tuning';

/**
 * Peligros de Lorencillo: cañonazos en arco con marca de caída y piratas cangrejo del
 * mástil. Son del jefe (no del `World`): él los mueve y los dibuja. Las listas se
 * compactan en sitio para no crear arrays en cada paso de 120 Hz.
 */

const FLOOR = GROUND * T;
/** Altura (px) de la boca de los cañones del barco, de donde salen las balas. */
export const CANNON_MOUTH_Y = FLOOR - 70;
const BURST_HEIGHT = SHELL_RADIUS * 1.5;
const MAX_SALVO_PLACEMENTS = 6;

/** Bala en arco. La marca de caída `x` existe desde el principio; vuela tras `warn`. */
export interface Shell {
  /** Centro (px) de la caída: lo que muestra la marca. */
  readonly x: number;
  readonly fromX: number;
  /** Superficie real de impacto: cubierta o cofa, fijada al aparecer la marca. */
  readonly impactY: number;
  /** Segundos de aviso antes de que salga la bala (>= `CANNON_WARN`). */
  readonly warn: number;
  t: number;
  /** 0 = en camino; >0 = tiempo desde que explotó. */
  burst: number;
}

export type Crab = Enemy;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const touches = (p: Rect, x: number, y: number, w: number, h: number): boolean =>
  p.x < x + w && p.x + p.w > x && p.y < y + h && p.y + p.h > y;

/** Salva: la primera bala cae sobre el jugador, las demás repartidas a los lados. */
export function fireSalvo(
  shells: Shell[], fromX: number, playerX: number, left: number, right: number, phase: LorenPhase, rng: () => number,
  world?: World,
): void {
  const lo = left + SHELL_RADIUS;
  const hi = right - SHELL_RADIUS;
  const first = clamp(playerX, lo, hi);
  for (let i = 0; i < byPhase(CANNON_SHELLS, phase); i++) {
    const side = i % 2 ? 1 : -1;
    let x = i === 0 ? first : clamp(first + side * SHELL_SPREAD * Math.ceil(i / 2) * (0.8 + 0.4 * rng()), lo, hi);
    // No agrupa marcas contra una borda: conserva un pasillo entre impactos.
    for (let attempt = 1; shells.some(s => Math.abs(s.x - x) < SHELL_RADIUS * 2 + T) && attempt <= MAX_SALVO_PLACEMENTS; attempt++) {
      const direction = attempt % 2 ? 1 : -1;
      x = clamp(first + direction * SHELL_SPREAD * Math.ceil(attempt / 2), lo, hi);
    }
    const impactY = world ? landingSurface(world, x) : FLOOR;
    shells.push({ x, fromX, impactY, warn: CANNON_WARN + i * SHELL_GAP, t: 0, burst: 0 });
  }
}

/** Las cofas de la arena empiezan en la fila 8; no se apunta a cofres suspendidos. */
export function landingSurface(world: World, x: number): number {
  for (let row = GROUND - 4; row < GROUND; row++) {
    if (world.solid(Math.floor(x / T), row)) return row * T;
  }
  return FLOOR;
}

/** Avance 0..1 del vuelo; negativo mientras dura el aviso. */
export const shellProgress = (s: Shell): number => (s.t - s.warn) / SHELL_FLIGHT;
export const shellX = (s: Shell, u: number): number => s.fromX + (s.x - s.fromX) * u;
/** Parábola: sube `SHELL_APEX` por encima de la línea recta entre boca y suelo. */
export const shellY = (u: number, impactY = FLOOR): number => CANNON_MOUTH_Y + (impactY - CANNON_MOUTH_Y) * u - 4 * SHELL_APEX * u * (1 - u);
/** Solo hiere al explotar: durante el aviso y el vuelo es inofensiva. */
export const shellHarmful = (s: Shell): boolean => s.burst > 0;

export function stepShells(world: World, shells: Shell[], dt: number): void {
  let n = 0;
  for (const s of shells) {
    s.t += dt;
    if (s.burst === 0 && shellProgress(s) >= 1) {
      s.burst = dt;
      world.shake = Math.max(world.shake, SHELL_BURST_LIFE);
      world.audio.play('brk');
    } else if (s.burst > 0) s.burst += dt;
    if (shellHarmful(s) && touches(world.player, s.x - SHELL_RADIUS, s.impactY - BURST_HEIGHT, SHELL_RADIUS * 2, BURST_HEIGHT)) world.hurt();
    if (s.burst < SHELL_BURST_LIFE) shells[n++] = s;
  }
  shells.length = n;
}

const isAlive = (e: Crab): boolean => e.alive && e.dead === 0;
export const crabsAlive = (crabs: readonly Crab[]): number => crabs.reduce((n, e) => n + (isAlive(e) ? 1 : 0), 0);

/** Lanza un pirata cangrejo desde el mástil hacia `side`; falso si ya hay `MAX_CRABS` vivos. */
export function throwCrab(
  world: World, crabs: Crab[], fromX: number, side: 1 | -1, arena: readonly [number, number],
  fromY = FLOOR,
): boolean {
  let n = 0;
  for (const e of crabs) if (isAlive(e)) crabs[n++] = e;
  crabs.length = n;
  if (n >= MAX_CRABS) return false;
  // Dentro de la arena: ni sobre el muro de salida (arena[1] + 1) ni tras el de entrada.
  const minTx = arena[0] + 1;
  const maxTx = arena[1] - 1;
  const origin = Math.floor(fromX / T);
  const target = origin + side * CRAB_OFFSET_TILES;
  // Si el destino se sale, se lanza hacia el centro en vez de contra el muro.
  const dir: 1 | -1 = target < minTx ? 1 : target > maxTx ? -1 : side;
  const tx = clamp(origin + dir * CRAB_OFFSET_TILES, minTx, maxTx);
  const crab = createEnemy({ id: 'pirateCrab', tx, ty: GROUND - 1 });
  crab.active = true;
  crab.y = fromY - crab.h;
  crab.onGround = false;
  crab.vy = -CRAB_THROW_LIFT;
  crab.vx = CRAB_THROW_SPEED * dir;
  world.enemies.push(crab);
  crabs.push(crab);
  return true;
}

/** Al morir el jefe sus cangrejos desaparecen con él. */
export function clearCrabs(crabs: Crab[]): void {
  for (const e of crabs) e.alive = false;
  crabs.length = 0;
}
