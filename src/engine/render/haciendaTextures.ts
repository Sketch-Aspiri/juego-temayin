import { T } from '../constants';
import { makeTile, type Ctx } from './drawUtils';

/**
 * Texturas del tema `hacienda` (AGENTS.md §4.7): tierra roja del Yucatán
 * (k'ankab) y mampostería encalada de los cascos de hacienda.
 */

const RED_EARTH = '#a8452a';
const RED_EARTH_DARK = '#7f3019';
const RED_EARTH_LIGHT = '#c8673f';
const DRY_GRASS = '#b9a24a';
const DRY_GRASS_DARK = '#8c7a30';
const LIME = '#e9dcc0';
const LIME_SHADOW = '#b9a98a';
const MORTAR = '#8f7f66';

const speckle = (c: Ctx, color: string, pts: ReadonlyArray<readonly [number, number]>): void => {
  c.fillStyle = color;
  for (const [x, y] of pts) c.fillRect(x, y, 4, 3);
};

function redEarth(c: Ctx): void {
  c.fillStyle = RED_EARTH;
  c.fillRect(0, 0, T, T);
  speckle(c, RED_EARTH_DARK, [[6, 8], [24, 4], [30, 22], [10, 28], [20, 16], [33, 34]]);
  speckle(c, RED_EARTH_LIGHT, [[14, 4], [28, 30], [4, 20]]);
}

function redEarthTop(c: Ctx): void {
  redEarth(c);
  c.fillStyle = DRY_GRASS;
  c.fillRect(0, 0, T, 9);
  c.fillStyle = DRY_GRASS_DARK;
  for (let x = 0; x < T; x += 8) {
    c.beginPath();
    c.moveTo(x, 8);
    c.lineTo(x + 4, 14);
    c.lineTo(x + 8, 8);
    c.fill();
  }
}

/** Mampostería: piedras irregulares encaladas con juntas de mortero. */
function masonry(c: Ctx): void {
  c.fillStyle = MORTAR;
  c.fillRect(0, 0, T, T);
  const stones: ReadonlyArray<readonly [number, number, number, number]> = [
    [1, 1, 22, 12], [25, 1, 14, 12],
    [1, 15, 12, 11], [15, 15, 24, 11],
    [1, 28, 18, 11], [21, 28, 18, 11],
  ];
  for (const [x, y, w, h] of stones) {
    c.fillStyle = LIME;
    c.fillRect(x, y, w, h);
    c.fillStyle = LIME_SHADOW;
    c.fillRect(x, y + h - 2, w, 2);
  }
}

export function createHaciendaTextures(): {
  redEarth: HTMLCanvasElement;
  redEarthTop: HTMLCanvasElement;
  masonry: HTMLCanvasElement;
} {
  return { redEarth: makeTile(T, redEarth), redEarthTop: makeTile(T, redEarthTop), masonry: makeTile(T, masonry) };
}
