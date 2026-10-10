import { VH, VW } from '../../constants';
import { cloud, hash, layer, tree, type Ctx } from '../drawUtils';
import type { Scenery } from '../backgrounds';
import { paintedScenery } from './painted';

/** Separación entre pirámides del fondo (px) y su parallax. */
const PYRAMID_SPACING = 520;
const PYRAMID_PARALLAX = 0.2;
const PYRAMID_BASE_Y = 420;
/** Cuerpos escalonados de cada pirámide (como el Edificio de los Cinco Pisos). */
const PYRAMID_TIERS = 5;
const TIER_H = 26;
const TREE_SPACING = 170;

const wrap = (v: number, period: number): number => ((v % period) + period) % period;

/** Pirámide escalonada en silueta con escalinata central y templo en la cima. */
function pyramid(c: Ctx, x: number, s: number): void {
  c.fillStyle = '#b8ab8a';
  for (let i = 0; i < PYRAMID_TIERS; i++) {
    const w = (220 - i * 36) * s;
    c.fillRect(x - w / 2, PYRAMID_BASE_Y - (i + 1) * TIER_H * s, w, TIER_H * s);
  }
  const top = PYRAMID_BASE_Y - PYRAMID_TIERS * TIER_H * s;
  c.fillRect(x - 24 * s, top - 30 * s, 48 * s, 30 * s);
  c.fillStyle = '#9a8c6c';
  c.fillRect(x - 14 * s, top, 28 * s, PYRAMID_TIERS * TIER_H * s);
  c.fillStyle = '#5d523c';
  c.fillRect(x - 7 * s, top - 20 * s, 14 * s, 20 * s);
}

/** Respaldo procedural del tema `ruins`: pirámides de caliza entre la selva baja. */
export const ruinsFallback: Scenery = (c, cam) => {
  for (let i = 0; i < 8; i++) {
    const cx = wrap(i * 400 + hash(i) * 200 - cam * 0.1, VW + 600) - 200;
    cloud(c, cx, 40 + hash(i + 4) * 120, 0.6 + hash(i + 2) * 0.5);
  }
  const off = cam * PYRAMID_PARALLAX;
  for (let i = -1; i < Math.ceil(VW / PYRAMID_SPACING) + 2; i++) {
    const n = Math.floor(off / PYRAMID_SPACING) + i;
    pyramid(c, n * PYRAMID_SPACING - off + hash(n) * 160, 0.7 + hash(n + 7) * 0.4);
  }
  layer(c, cam * 0.35, 430, 50, '#5c8a4a', 0.008, 4);
  for (let i = -1; i < Math.ceil(VW / TREE_SPACING) + 2; i++) {
    const toff = cam * 0.5;
    const n = Math.floor(toff / TREE_SPACING) + i;
    tree(c, n * TREE_SPACING - toff + hash(n) * 70, 470, 0.5 + hash(n + 3) * 0.4);
  }
  c.fillStyle = '#3f6e38';
  c.fillRect(0, 468, VW, VH - 468);
};

/** Escenario `ruins`: zona arqueológica (Edzná, Hecelchakán) pintada en ruins.webp. */
export const ruinsScenery: Scenery = paintedScenery('ruins.webp', ruinsFallback, { nearTop: 0.68 });
