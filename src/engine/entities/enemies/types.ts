import type { EnemyId } from '../../types';
import type { World } from '../../World';
import type { Enemy } from '../types';

/**
 * Movimiento propio de un enemigo en cada paso de simulación. El contacto con el
 * jugador (pisotón o daño) y el choque entre enemigos son comunes y los resuelve
 * `updateEnemies`; aquí solo se mueve al enemigo y se actualiza su estado.
 */
export type EnemyMove = (e: Enemy, world: World, dt: number) => void;

export interface EnemyDef {
  id: EnemyId;
  w: number;
  h: number;
  /** Se puede eliminar saltándole encima. */
  stompable: boolean;
  /** Ignora la gravedad (voladores). No necesita suelo debajo al aparecer. */
  flying: boolean;
  /** Vive bajo el agua (nadadores). No necesita suelo debajo al aparecer. */
  swimming?: boolean;
  speed: number;
  score: number;
  /** Comportamiento: `walk`, `fly` (en `behaviors.ts`) o uno propio en el archivo del enemigo. */
  move: EnemyMove;
  /**
   * Pisable según su estado actual (p. ej. el cangrejo con las pinzas en alto).
   * Si existe, manda sobre `stompable`.
   */
  canStomp?: (e: Enemy) => boolean;
  /**
   * Reacción propia al pisotón (p. ej. la fila de hormigas pierde un segmento).
   * Por defecto el pisotón llama a `world.killEnemy(e, false)`.
   */
  onStomp?: (e: Enemy, world: World) => void;
  /**
   * Reacción propia al contacto sin pisotón (p. ej. el alux roba cacao en vez de
   * hacer daño). Por defecto el contacto llama a `world.hurt()`.
   */
  onTouch?: (e: Enemy, world: World) => void;
}
