import { T } from '../constants';
import { currentAt } from '../level/zones';
import type { World } from '../World';
import type { Player } from './types';

/**
 * Viento y térmicas (op `wind`). Se suma a la deriva del jugador en `moveAndCollide`,
 * igual que las corrientes del agua, pero solo cuando NO nada: el agua ya tiene las suyas.
 */

/**
 * Desplazamiento (px) que el viento aplica al jugador en este paso. La parte vertical solo
 * actúa en el aire: en el suelo una térmica no debe despegar al jugador sin saltar, y así
 * tampoco se le empuja contra el piso.
 */
export function windDrift(world: World, p: Player, dt: number): readonly [number, number] {
  if (p.swimming) return [0, 0];
  const zone = currentAt(world.level.winds, p.x + p.w / 2, p.y + p.h / 2);
  if (!zone) return [0, 0];
  return [zone.vx * T * dt, p.onGround ? 0 : zone.vy * T * dt];
}
