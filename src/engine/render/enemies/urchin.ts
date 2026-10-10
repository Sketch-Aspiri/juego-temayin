import { isReady } from '../../assets';
import type { EnemyDrawFn } from './types';

const SCALE = 0.72;
const CELL_W = 90;
const CELL_H = 80;

/** Erizo del Caribe (hoja `erizo.png`: fila 0 camina, fila 2 muere). */
export const drawUrchin: EnemyDrawFn = (c, assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  const row = e.dead ? 2 : 0;
  const fr = e.dead ? Math.min(2, Math.floor(e.dead * 8)) : Math.floor(e.t * 10) % 9;
  if (!isReady(assets.urchin)) return;
  c.drawImage(assets.urchin, fr * CELL_W, row * CELL_H, CELL_W, CELL_H, -45 * SCALE, -79 * SCALE, CELL_W * SCALE, CELL_H * SCALE);
};
