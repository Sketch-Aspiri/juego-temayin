import type { Assets } from '../assets';
import type { BossConfig } from '../level/types';
import type { LightSource } from '../render/lighting';
import type { BossId, Rect } from '../types';
import type { World } from '../World';

/** Contrato que debe cumplir cada jefe. Se registra en `bosses/index.ts`. */
export interface Boss extends Rect {
  readonly id: BossId;
  readonly name: string;
  readonly hp: number;
  readonly maxHp: number;
  /** La cámara queda fija sobre la arena. */
  readonly lockCamera: boolean;
  /** Se muestra la barra de vida. */
  readonly hudVisible: boolean;
  /** Está en su presentación (se muestra el cartel). */
  readonly intro: boolean;
  /** Una bola de fuego puede impactarle ahora mismo. */
  readonly hittable: boolean;
  /** Etapa actual de la pelea (1 = inicial) para que el decorado reaccione; opcional. */
  readonly stage?: number;
  /** Escora visible de la cubierta (-1 izquierda … 1 derecha) para el decorado; opcional. */
  readonly lean?: number;
  /**
   * Añade a `out` las luces propias del jefe (ojos, ataques brillantes) cuando el nivel
   * está a oscuras; opcional. Escribe en la lista recibida para no crear arrays por paso.
   */
  lights?(out: LightSource[]): void;
  /** Ayuda respirable dinámica de un aliado; se consulta antes de consumir el oxígeno. */
  providesAir?(body: Rect): boolean;
  update(world: World, dt: number): void;
  onFireball(world: World): void;
  draw(ctx: CanvasRenderingContext2D, assets: Assets, camX: number): void;
}

export type BossFactory = (config: BossConfig) => Boss;
