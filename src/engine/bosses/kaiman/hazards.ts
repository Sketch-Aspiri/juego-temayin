import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import { overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import { splash, surfaceY } from './attacks';
import {
  byPhase, type KaimanPhase,
  MUD_GRAVITY, MUD_LAUNCH_STEP, MUD_LAUNCH_UP, MUD_SIZE, MUD_SPREAD,
  PROPAGULE_FALL, PROPAGULE_GAP, PROPAGULE_H, PROPAGULE_STAGGER, PROPAGULE_STUCK, PROPAGULE_W,
  PROPAGULE_WARN, PROPAGULES, SPIT_BALLS,
} from './tuning';

/**
 * Ataques nuevos del Kaimán: bolas de lodo escupidas en arco y propágulos del mangle
 * rojo (semillas alargadas que caen como dardos y se clavan en el lodo) que se
 * desprenden cuando el jefe golpea las raíces con la cola. Como las olas, son del
 * jefe: él las mueve y las dibuja. Funciones sin DOM.
 */

export interface MudBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
}

export interface Propagule {
  /** Centro horizontal (px). */
  readonly x: number;
  /** Punta inferior (px); empieza por encima de la pantalla. */
  y: number;
  /** Segundos de aviso que faltan antes de caer. */
  wait: number;
  /** Tiempo clavado en el lodo (`null` mientras cae o avisa). */
  stuck: number | null;
  /** Altura (px) donde se clava: la superficie del agua o el suelo. */
  readonly floor: number;
}

/** Pseudoaleatorio determinista (mulberry32): las pruebas y repeticiones son reproducibles. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bolas de lodo desde la boca (`x`, `y`) hacia `targetX`: cada una cae a una fracción
 * distinta de la distancia (antes, encima y detrás del jugador) con arcos diferentes.
 */
export function spitMud(x: number, y: number, targetX: number, phase: KaimanPhase): MudBall[] {
  const n = byPhase(SPIT_BALLS, phase);
  const dist = targetX - x;
  const floor = GROUND * T;
  return Array.from({ length: n }, (_, i) => {
    const k = n === 1 ? 1 : 1 - MUD_SPREAD + (2 * MUD_SPREAD * i) / (n - 1);
    const vy = -(MUD_LAUNCH_UP + i * MUD_LAUNCH_STEP);
    const h = floor - y;
    const flight = (-vy + Math.sqrt(vy * vy + 2 * MUD_GRAVITY * h)) / MUD_GRAVITY;
    return { x, y, vx: (dist * k) / flight, vy, t: 0 };
  });
}

export const mudRect = (b: MudBall): Rect => ({ x: b.x - MUD_SIZE / 2, y: b.y - MUD_SIZE / 2, w: MUD_SIZE, h: MUD_SIZE });

/** Avanza el lodo; hiere al jugador que toca una bola; se deshace al tocar agua o suelo. */
export function stepMud(world: World, balls: readonly MudBall[], dt: number, left: number, right: number): MudBall[] {
  const out: MudBall[] = [];
  for (const b of balls) {
    b.t += dt;
    b.vy += MUD_GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < left || b.x > right) continue;
    if (b.vy > 0 && b.y >= surfaceY(world, b.x)) {
      mudSplat(world, b.x, surfaceY(world, b.x));
      continue;
    }
    if (world.phase === 'play' && overlap(world.player, mudRect(b))) {
      world.hurt();
      mudSplat(world, b.x, b.y);
      continue;
    }
    out.push(b);
  }
  return out;
}

function mudSplat(world: World, x: number, y: number): void {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.1 + 0.8 * Math.random());
    const s = 90 + Math.random() * 120;
    world.particles.push(makeParticle('spark', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: i % 2 ? '#5a4326' : '#8a6a3c' }));
  }
}

/**
 * Columnas (px, centro) donde caerán los propágulos: el primero sobre el jugador y el
 * resto repartidos por la arena, siempre separados `PROPAGULE_GAP` para dejar huecos.
 */
export function propaguleColumns(playerX: number, left: number, right: number, n: number, rng: () => number): number[] {
  const margin = T / 2;
  const clamp = (x: number): number => Math.max(left + margin, Math.min(right - margin, x));
  const xs = [clamp(playerX)];
  for (let tries = 0; xs.length < n && tries < n * 30; tries++) {
    const x = clamp(left + margin + rng() * (right - left - 2 * margin));
    if (xs.every((o) => Math.abs(o - x) >= PROPAGULE_GAP)) xs.push(x);
  }
  return xs;
}

export function dropPropagules(world: World, left: number, right: number, phase: KaimanPhase, rng: () => number): Propagule[] {
  const p = world.player;
  const n = byPhase(PROPAGULES, phase);
  const warn = byPhase(PROPAGULE_WARN, phase);
  return propaguleColumns(p.x + p.w / 2, left, right, n, rng).map((x, i) => ({
    x, y: -PROPAGULE_H, wait: warn + i * PROPAGULE_STAGGER, stuck: null, floor: surfaceY(world, x),
  }));
}

export const propaguleRect = (s: Propagule): Rect => ({ x: s.x - PROPAGULE_W / 2, y: s.y - PROPAGULE_H, w: PROPAGULE_W, h: PROPAGULE_H });

/** Avisa, cae y se clava. Solo hiere mientras cae. */
export function stepPropagules(world: World, seeds: readonly Propagule[], dt: number): Propagule[] {
  const out: Propagule[] = [];
  for (const s of seeds) {
    if (s.wait > 0) {
      s.wait -= dt;
      out.push(s);
      continue;
    }
    if (s.stuck !== null) {
      s.stuck += dt;
      if (s.stuck < PROPAGULE_STUCK) out.push(s);
      continue;
    }
    s.y += PROPAGULE_FALL * dt;
    if (s.y >= s.floor + PROPAGULE_H / 3) {
      s.y = s.floor + PROPAGULE_H / 3;
      s.stuck = 0;
      splash(world, s.x, s.floor);
    } else if (world.phase === 'play' && overlap(world.player, propaguleRect(s))) {
      world.hurt();
    }
    out.push(s);
  }
  return out;
}
