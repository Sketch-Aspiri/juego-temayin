import type { Assets } from '../../assets';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';

/**
 * Dibuja un enemigo en coordenadas locales: el origen está en el centro de la base
 * de su caja (x + w/2, y + h) y ya se aplicó el volteo de muerte (`flip`).
 * Cada dibujo decide hacia dónde mira según `e.vx`.
 */
export type EnemyDrawFn = (c: Ctx, assets: Assets, e: Enemy) => void;
