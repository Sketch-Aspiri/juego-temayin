import { T, VW } from '../constants';
import { moveX } from '../physics';
import type { Rect } from '../types';
import type { World } from '../World';

/**
 * Plataformas móviles (AGENTS.md §5.4): vagones del Tren Maya y plataformas genéricas.
 *
 * Son plataformas de un solo sentido: se atraviesan desde abajo y por los lados,
 * pero el jugador que cae encima se apoya en ellas y es arrastrado. No forman parte
 * de la cuadrícula: la colisión se resuelve en un paso aparte alrededor de
 * `updatePlayer` (`carryRider` antes y `landOnPlatforms` después).
 *
 * Su posición es una función pura del tiempo propio de la plataforma (`t`), que solo
 * corre cuando la plataforma ya está cerca de la cámara: así el diseño del nivel es
 * predecible (el tren arranca su ciclo al aparecer en pantalla).
 */

/** Vagón de tren (op `train`): `cars` vagones en fila que van y vuelven `range` bloques. */
export interface TrainSpec {
  readonly kind: 'train';
  /** Columna y fila (bloques) de la esquina superior izquierda: el techo es la superficie. */
  readonly x: number;
  readonly y: number;
  readonly cars: number;
  /** Velocidad en bloques/s. */
  readonly speed: number;
  /** Recorrido en bloques (negativo = empieza hacia la izquierda). */
  readonly range: number;
}

/** Plataforma genérica (op `mover`): oscila suavemente entre su origen y (x+dx, y+dy). */
export interface MoverSpec {
  /** Aspecto de vagoneta henequenera; la física sigue siendo la de una plataforma móvil. */
  readonly appearance?: 'truck' | 'boat' | 'turtle';
  readonly kind: 'mover';
  readonly x: number;
  readonly y: number;
  /** Largo en bloques. */
  readonly length: number;
  /** Desplazamiento máximo en bloques. */
  readonly dx: number;
  readonly dy: number;
  /** Segundos de un ciclo completo de ida y vuelta. */
  readonly period: number;
}

export type PlatformSpec = TrainSpec | MoverSpec;

export interface MovingPlatform extends Rect {
  readonly spec: PlatformSpec;
  /** Posición en el paso anterior (px), para arrastrar al jinete. */
  prevX: number;
  prevY: number;
  /** Tiempo propio (s); solo avanza cuando la plataforma está activa. */
  t: number;
  active: boolean;
  /** El jugador está apoyado encima. */
  rider: boolean;
  /** Tortuga protegida que se sumerge durante un ataque; vuelve sin recibir daño. */
  submerged?: boolean;
}

/** Bloques de ancho de cada vagón. */
export const CAR_TILES = 5;
/** Alto (px) de un vagón: del techo a los rieles. */
export const TRAIN_CAR_H = 2 * T;
/** Segundos que el tren se detiene en cada extremo de su recorrido (la «estación»). */
export const TRAIN_STOP_TIME = 1.2;
/** Grosor (px) de una plataforma genérica. */
export const MOVER_H = T / 2;
/** Margen (px) para activar la plataforma antes de que entre en pantalla. */
const ACTIVATION_MARGIN = 2 * T;
/** Margen (px) por encima del techo que todavía cuenta como «venía desde arriba». */
const LAND_EPS = 4;
/** Píxeles de los bordes de la plataforma donde los pies ya no se apoyan. */
const FOOT_INSET = 4;

/** Ancho en bloques de la plataforma. */
export const platformTiles = (s: PlatformSpec): number => (s.kind === 'train' ? s.cars * CAR_TILES : s.length);

/** Fracción 0..1 del recorrido del tren en el instante `t` (con paradas en los extremos). */
export function trainProgress(t: number, range: number, speed: number): number {
  if (range === 0 || speed <= 0) return 0;
  const travel = Math.abs(range) / speed;
  const cycle = 2 * (travel + TRAIN_STOP_TIME);
  const s = ((t % cycle) + cycle) % cycle;
  if (s < TRAIN_STOP_TIME) return 0;
  if (s < TRAIN_STOP_TIME + travel) return (s - TRAIN_STOP_TIME) / travel;
  if (s < 2 * TRAIN_STOP_TIME + travel) return 1;
  return 1 - (s - 2 * TRAIN_STOP_TIME - travel) / travel;
}

/** Fracción 0..1 de una plataforma genérica: vaivén suave (coseno) de periodo `period`. */
export function moverProgress(t: number, period: number): number {
  if (period <= 0) return 0;
  return (1 - Math.cos((2 * Math.PI * t) / period)) / 2;
}

/** Desplazamiento (px) respecto al origen en el instante `t`. */
export function platformOffset(s: PlatformSpec, t: number): readonly [number, number] {
  if (s.kind === 'train') return [trainProgress(t, s.range, s.speed) * s.range * T, 0];
  const k = moverProgress(t, s.period);
  return [k * s.dx * T, k * s.dy * T];
}

/** Columnas (inclusive) que la superficie de la plataforma puede ocupar en su recorrido. */
export function platformReach(s: PlatformSpec): { x0: number; x1: number } {
  const dx = s.kind === 'train' ? s.range : s.dx;
  return { x0: s.x + Math.min(0, dx), x1: s.x + platformTiles(s) - 1 + Math.max(0, dx) };
}

export function createPlatform(spec: PlatformSpec): MovingPlatform {
  const x = spec.x * T;
  const y = spec.y * T;
  const h = spec.kind === 'train' ? TRAIN_CAR_H : MOVER_H;
  return { spec, x, y, w: platformTiles(spec) * T, h, prevX: x, prevY: y, t: 0, active: false, rider: false };
}

/** Avanza todas las plataformas activas (las que ya están cerca de la cámara). */
export function updatePlatforms(platforms: readonly MovingPlatform[], camX: number, dt: number): void {
  for (const m of platforms) {
    m.prevX = m.x;
    m.prevY = m.y;
    if (!m.active) {
      if (platformReach(m.spec).x0 * T < camX + VW + ACTIVATION_MARGIN) m.active = true;
      else continue;
    }
    m.t += dt;
    const [ox, oy] = platformOffset(m.spec, m.t);
    m.x = m.spec.x * T + ox;
    m.y = m.spec.y * T + oy;
  }
}

/**
 * Antes de `updatePlayer`: arrastra al jugador con la plataforma sobre la que estaba
 * apoyado. Devuelve la altura de sus pies (px) para que `landOnPlatforms` sepa si
 * venía desde arriba.
 */
export function carryRider(world: World): number {
  const p = world.player;
  for (const m of world.platforms) {
    if (!m.rider || m.submerged) { m.rider = false; continue; }
    m.rider = false;
    moveX(p, m.x - m.prevX, world.solidAt);
    p.y = m.y - p.h;
  }
  return p.y + p.h;
}

const standsOn = (world: World, m: MovingPlatform): boolean => {
  const p = world.player;
  return p.x + p.w > m.x + FOOT_INSET && p.x < m.x + m.w - FOOT_INSET;
};

/**
 * Después de `updatePlayer`: si el jugador cae (o está quieto) y sus pies cruzan
 * el techo de una plataforma viniendo desde arriba, lo apoya en ella.
 */
export function landOnPlatforms(world: World, prevFeet: number): void {
  const p = world.player;
  if (p.vy < 0) return;
  const feet = p.y + p.h;
  for (const m of world.platforms) {
    if (m.submerged) continue;
    // Si la plataforma sube, el techo puede haber alcanzado los pies durante este paso.
    const rise = Math.max(0, m.prevY - m.y);
    if (!standsOn(world, m) || prevFeet > m.y + LAND_EPS + rise || feet < m.y) continue;
    p.y = m.y - p.h;
    p.vy = 0;
    p.onGround = true;
    m.rider = true;
    return;
  }
}
