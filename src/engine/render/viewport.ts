import { VH, VW } from '../constants';
import type { World } from '../World';

/** Ancho del encuadre vertical; la simulación conserva su ventana original. */
export const PORTRAIT_VIEW_WIDTH = 480;
const PLAYER_FOCUS = 0.4;

export interface RenderViewport {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/** Acerca la vista al jugador; arenas y meta se muestran completas para conservar sus avisos. */
export function renderViewport(world: World, width: number): RenderViewport {
  if (width >= VW) return { scale: 1, offsetX: 0, offsetY: 0 };
  if (world.boss?.lockCamera || world.phase === 'flag' || world.phase === 'done') {
    const scale = width / VW;
    return { scale, offsetX: 0, offsetY: (VH - VH * scale) / 2 };
  }
  const focus = world.player.x + world.player.w / 2 - world.camX;
  const offsetX = Math.max(0, Math.min(VW - width, focus - width * PLAYER_FOCUS));
  return { scale: 1, offsetX, offsetY: 0 };
}
