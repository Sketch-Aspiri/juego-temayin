import type { Assets } from '../assets';
import type { BossConfig } from '../level/types';
import type { Rect } from '../types';
import type { World } from '../World';

/** Contrato que debe cumplir cada jefe. Se registra en `bosses/index.ts`. */
export interface Boss extends Rect {
  readonly id: string;
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
  update(world: World, dt: number): void;
  onFireball(world: World): void;
  draw(ctx: CanvasRenderingContext2D, assets: Assets, camX: number): void;
}

export type BossFactory = (config: BossConfig) => Boss;
