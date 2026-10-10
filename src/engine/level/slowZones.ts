import { SLOW_ZONE_JUMP_FACTOR, SLOW_ZONE_SPEED_FACTOR, T } from '../constants';
import type { Body } from '../types';

/**
 * Zonas que frenan (AGENTS.md §5.5): franjas pegajosas sobre el suelo.
 *  - `resin`: resina de chicle del chicozapote (Mundo 4, Leona Vicario). No arde.
 *  - `sargassum`: sargazo varado (Mundo 5). Las bolas de fuego lo queman.
 * Las produce `buildLevel` a partir de las ops `resin` y `sargassum`; las consumen la
 * física del jugador (`entities/player.ts`) y el `Renderer`. Coordenadas en bloques.
 * Funciones puras: quemar sargazo devuelve una lista nueva, nunca muta la anterior.
 */

export type SlowZoneKind = 'resin' | 'sargassum';

/** Franja que ocupa la fila `y` en las columnas x0..x1 (inclusive); el suelo está en `y + 1`. */
export interface SlowZone {
  readonly kind: SlowZoneKind;
  readonly x0: number;
  readonly x1: number;
  readonly y: number;
}

/** Multiplicadores que aplica una zona al movimiento del jugador. */
export interface SlowFactors {
  readonly speed: number;
  readonly jump: number;
}

export const NORMAL_FACTORS: SlowFactors = { speed: 1, jump: 1 };
export const SLOWED_FACTORS: SlowFactors = { speed: SLOW_ZONE_SPEED_FACTOR, jump: SLOW_ZONE_JUMP_FACTOR };

/** Zona que contiene el punto (px, py) en píxeles, o `null`. */
export function slowZoneAt(zones: readonly SlowZone[], px: number, py: number): SlowZone | null {
  const tx = Math.floor(px / T);
  const ty = Math.floor(py / T);
  for (const z of zones) {
    if (ty === z.y && tx >= z.x0 && tx <= z.x1) return z;
  }
  return null;
}

/**
 * Multiplicadores para un cuerpo: solo frena si está apoyado y con los pies (cualquier
 * esquina inferior) dentro de una zona. En el aire se mueve con normalidad.
 */
export function slowFactorsFor(zones: readonly SlowZone[], body: Body): SlowFactors {
  if (!body.onGround || zones.length === 0) return NORMAL_FACTORS;
  const feet = body.y + body.h - 1;
  const stuck = slowZoneAt(zones, body.x + 1, feet) ?? slowZoneAt(zones, body.x + body.w - 1, feet);
  return stuck ? SLOWED_FACTORS : NORMAL_FACTORS;
}

/**
 * Quema el sargazo de las columnas tx-radius..tx+radius en la fila `ty`: recorta o parte
 * en dos las zonas afectadas. La resina no arde. Devuelve la misma lista si nada cambió.
 */
export function burnSlowZones(zones: readonly SlowZone[], tx: number, ty: number, radius: number): readonly SlowZone[] {
  const b0 = tx - radius;
  const b1 = tx + radius;
  const hits = (z: SlowZone): boolean => z.kind === 'sargassum' && z.y === ty && z.x1 >= b0 && z.x0 <= b1;
  if (!zones.some(hits)) return zones;
  return zones.flatMap((z): SlowZone[] => {
    if (!hits(z)) return [z];
    const pieces: SlowZone[] = [];
    if (z.x0 < b0) pieces.push({ ...z, x1: b0 - 1 });
    if (z.x1 > b1) pieces.push({ ...z, x0: b1 + 1 });
    return pieces;
  });
}
