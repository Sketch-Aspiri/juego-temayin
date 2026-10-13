import { T, VW } from '../constants';
import { overlap } from '../physics';
import type { World } from '../World';
import { STOMP_BOUNCE, STOMP_BOUNCE_HELD, STOMP_TOLERANCE } from './enemies';
import { makeParticle } from './particles';

/**
 * Cañones de baluarte que disparan (op `['cannon', x, y, dir]`, 2-3 Campeche).
 * Sus dos bloques siguen siendo sólidos y se pisan como plataforma; además, mientras
 * la boca está en pantalla, el cañón repite un ciclo predecible:
 *
 *   espera (CANNON_FIRST_DELAY al aparecer, CANNON_RELOAD_TIME tras cada disparo)
 *   → aviso: la mecha chispea (CANNON_WARN_TIME)
 *   → disparo: una bala de hierro sale por la boca en línea recta.
 *
 * La bala vuela a CANNONBALL_SPEED (más despacio que el jugador corriendo) a la altura
 * del cañón, hasta chocar con un bloque. Quien está de pie sobre un cañón de la misma
 * fila queda por encima de su trayectoria. Se salta, o se pisa para destruirla.
 */
export interface CannonSpec {
  /** Columna del primer bloque del cañón (culata si apunta a la derecha, boca si a la izquierda). */
  readonly x: number;
  /** Fila del cañón. */
  readonly y: number;
  /** Hacia dónde apunta la boca. */
  readonly dir: 1 | -1;
}

export type CannonState = 'idle' | 'warn';

export interface Cannon extends CannonSpec {
  state: CannonState;
  /** Segundos que faltan para pasar al siguiente estado. */
  timer: number;
  /** Segundos desde el último disparo (para el fogonazo del dibujo). */
  sinceShot: number;
}

export interface Cannonball {
  x: number;
  y: number;
  vx: number;
  /** Segundos de vuelo. */
  t: number;
  gone: boolean;
}

/** Espera desde que la boca entra en pantalla hasta el primer aviso. */
export const CANNON_FIRST_DELAY = 1;
/** Aviso visible (mecha encendida) antes de cada disparo. */
export const CANNON_WARN_TIME = 0.7;
/** Recarga tras cada disparo; con el aviso, un disparo cada 3,4 s. */
export const CANNON_RELOAD_TIME = 2.7;
/** Velocidad de la bala (px/s): 5,5 bloques/s, más lenta que la carrera (400). */
export const CANNONBALL_SPEED = 220;
export const CANNONBALL_RADIUS = 11;
/** Vuelo máximo antes de desaparecer aunque no choque con nada. */
const CANNONBALL_MAX_TIME = 6;
/** Margen (px) fuera de la cámara en el que la bala aún existe. */
const OFFSCREEN_MARGIN = 2 * T;
export const CANNONBALL_SCORE = 100;
const BURST_SPARKS = 8;
const BURST_SPEED = 140;
const SMOKE_PUFFS = 4;
const SMOKE_SPEED = 60;

export function createCannons(specs: readonly CannonSpec[]): Cannon[] {
  return specs.map((s) => ({ ...s, state: 'idle', timer: CANNON_FIRST_DELAY, sinceShot: Infinity }));
}

/** Borde exterior de la boca (px), por donde sale la bala. */
export function muzzleX(c: CannonSpec): number {
  return c.dir > 0 ? (c.x + 2) * T : c.x * T;
}

/** Centro de la culata, donde arde la mecha (px). */
export function fuseX(c: CannonSpec): number {
  return (c.dir > 0 ? c.x : c.x + 1) * T + T / 2;
}

const rowCenter = (c: CannonSpec): number => (c.y + 0.5) * T;

const onScreen = (world: World, c: Cannon): boolean => {
  const x = muzzleX(c);
  return x > world.camX && x < world.camX + VW;
};

function fire(world: World, c: Cannon): void {
  const x = muzzleX(c) + c.dir * CANNONBALL_RADIUS;
  const y = rowCenter(c);
  world.cannonballs.push({ x, y, vx: c.dir * CANNONBALL_SPEED, t: 0, gone: false });
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    world.particles.push(
      makeParticle('dust', muzzleX(c), y, { vx: c.dir * SMOKE_SPEED * (1 + i / 2), vy: -SMOKE_SPEED * (i / SMOKE_PUFFS), col: '#d9d2c3' }),
    );
  }
  world.audio.play('brk');
  c.sinceShot = 0;
}

function stepCannon(world: World, c: Cannon, dt: number): void {
  c.sinceShot += dt;
  if (!onScreen(world, c)) {
    c.state = 'idle';
    c.timer = CANNON_FIRST_DELAY;
    return;
  }
  c.timer -= dt;
  if (c.timer > 0) return;
  if (c.state === 'idle') {
    c.state = 'warn';
    c.timer = CANNON_WARN_TIME;
    world.audio.play('tick');
    return;
  }
  fire(world, c);
  c.state = 'idle';
  c.timer = CANNON_RELOAD_TIME;
}

function burst(world: World, b: Cannonball): void {
  b.gone = true;
  for (let i = 0; i < BURST_SPARKS; i++) {
    const a = (i / BURST_SPARKS) * Math.PI * 2;
    world.particles.push(
      makeParticle('spark', b.x, b.y, { vx: Math.cos(a) * BURST_SPEED, vy: Math.sin(a) * BURST_SPEED, col: i % 2 ? '#9a8f80' : '#ffb347' }),
    );
  }
}

/** Contacto con el jugador: pisotón si cae encima; si no, daño. */
function touchPlayer(world: World, b: Cannonball): void {
  const p = world.player;
  if (world.phase !== 'play') return;
  const box = { x: b.x - CANNONBALL_RADIUS, y: b.y - CANNONBALL_RADIUS, w: 2 * CANNONBALL_RADIUS, h: 2 * CANNONBALL_RADIUS };
  if (!overlap(p, box)) return;
  burst(world, b);
  if (p.vy > 0 && p.y + p.h - box.y < STOMP_TOLERANCE) {
    p.vy = world.input.held.jump ? STOMP_BOUNCE_HELD : STOMP_BOUNCE;
    world.addScore(CANNONBALL_SCORE, b.x, b.y);
    world.audio.play('stomp');
  } else world.hurt();
}

function stepBall(world: World, b: Cannonball, dt: number): void {
  b.t += dt;
  b.x += b.vx * dt;
  const lead = b.x + Math.sign(b.vx) * CANNONBALL_RADIUS;
  const away = b.x < world.camX - OFFSCREEN_MARGIN || b.x > world.camX + VW + OFFSCREEN_MARGIN;
  if (away || b.t > CANNONBALL_MAX_TIME) {
    b.gone = true;
    return;
  }
  if (world.solid(Math.floor(lead / T), Math.floor(b.y / T))) {
    burst(world, b);
    world.audio.play('bump');
    return;
  }
  touchPlayer(world, b);
}

/** Avanza los cañones y sus balas; las balas que chocan o salen de cámara desaparecen. */
export function updateCannons(world: World, dt: number): void {
  for (const c of world.cannons) stepCannon(world, c, dt);
  for (const b of world.cannonballs) stepBall(world, b, dt);
  world.cannonballs = world.cannonballs.filter((b) => !b.gone);
}
