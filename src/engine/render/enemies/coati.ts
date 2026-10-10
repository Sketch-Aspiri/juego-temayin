import { isReady } from '../../assets';
import type { EnemyDrawFn } from './types';

const SCALE = 0.78;
const CELL_W = 140;
const CELL_H = 80;

/** Coatí guardián (hoja `coati.png`: fila 0 camina, fila 1 muere). */
export const drawCoati: EnemyDrawFn = (c, assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  const row = e.dead ? 1 : 0;
  const fr = e.dead ? Math.min(6, Math.floor(e.dead * 14)) : Math.floor(e.t * 12) % 8;
  if (!isReady(assets.coati)) return;
  c.drawImage(assets.coati, fr * CELL_W, row * CELL_H, CELL_W, CELL_H, -70 * SCALE, -79 * SCALE, CELL_W * SCALE, CELL_H * SCALE);
};
