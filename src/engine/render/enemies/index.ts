import type { Assets } from '../../assets';
import { VW } from '../../constants';
import type { Enemy } from '../../entities/types';
import type { EnemyId } from '../../types';
import type { Ctx } from '../drawUtils';
import { drawAnts } from './ants';
import { drawBarracuda } from './barracuda';
import { drawBat } from './bat';
import { drawBlueCrab } from './blueCrab';
import { drawCoati } from './coati';
import { drawHowler } from './howler';
import { drawNauyaca } from './nauyaca';
import { drawTarantula } from './tarantula';
import type { EnemyDrawFn } from './types';
import { drawUrchin } from './urchin';

export type { EnemyDrawFn } from './types';

/** Registro de dibujos por enemigo: uno por archivo en `render/enemies/<id>.ts`. */
export const ENEMY_SPRITES: Readonly<Record<EnemyId, EnemyDrawFn>> = {
  coati: drawCoati,
  urchin: drawUrchin,
  bat: drawBat,
  howler: drawHowler,
  tarantula: drawTarantula,
  nauyaca: drawNauyaca,
  ants: drawAnts,
  blueCrab: drawBlueCrab,
  barracuda: drawBarracuda,
};

const OFFSCREEN_MARGIN = 60;

export function drawEnemySprite(c: Ctx, assets: Assets, e: Enemy, camX: number): void {
  const x = e.x - camX;
  if (x < -OFFSCREEN_MARGIN || x > VW + OFFSCREEN_MARGIN) return;
  c.save();
  c.translate(x + e.w / 2, e.y + e.h);
  if (e.flip) {
    c.translate(0, -e.h / 2);
    c.scale(1, -1);
    c.translate(0, e.h / 2);
  }
  ENEMY_SPRITES[e.id](c, assets, e);
  c.restore();
}
