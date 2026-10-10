import { T } from '../constants';
import { makeTile, type Ctx } from './drawUtils';

/**
 * Texturas del tema `xibalba` (AGENTS.md §4.7): roca volcánica negra con vetas de
 * brasa y losas pálidas de piedra caliza gastada, color hueso, como las calzadas
 * del inframundo del Popol Vuh. Prefijo `xib` para no chocar con otros temas.
 */

const BASALT = '#1f1719';
const BASALT_LIGHT = '#3a2a2c';
const BASALT_DARK = '#110c0d';
const EMBER = '#d8462a';
const EMBER_GLOW = '#ff9a4a';
const ASH = '#5a4648';
const BONE = '#d9ccb0';
const BONE_SHADE = '#a8987a';
const BONE_DARK = '#6e5f4a';
const BONE_LIGHT = '#f2e8d2';
/** Alto de la costra de ceniza en la cara superior del suelo (px). */
const ASH_H = 6;

type Pts = ReadonlyArray<readonly [number, number, number, number]>;

/** Facetas de basalto: polígonos oscuros con un borde de luz. */
const FACETS: Pts = [[2, 3, 16, 14], [20, 2, 18, 12], [3, 20, 12, 17], [17, 17, 21, 10], [18, 30, 20, 9]];

/** Basalto con facetas y una veta de brasa que lo atraviesa. */
function basalt(c: Ctx): void {
  c.fillStyle = BASALT;
  c.fillRect(0, 0, T, T);
  for (const [x, y, w, h] of FACETS) {
    c.fillStyle = BASALT_LIGHT;
    c.fillRect(x, y, w, 2);
    c.fillStyle = BASALT_DARK;
    c.fillRect(x, y + h - 2, w, 2);
  }
  c.strokeStyle = EMBER;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, 24);
  c.lineTo(9, 21);
  c.lineTo(15, 27);
  c.lineTo(26, 25);
  c.lineTo(T, 30);
  c.stroke();
  c.fillStyle = EMBER_GLOW;
  c.fillRect(14, 26, 2, 2);
}

/** Suelo: basalto con costra de ceniza y brasas sueltas en la superficie. */
function basaltTop(c: Ctx): void {
  basalt(c);
  c.fillStyle = ASH;
  c.fillRect(0, 0, T, ASH_H);
  c.fillStyle = BASALT_LIGHT;
  c.fillRect(0, ASH_H, T, 2);
  c.fillStyle = EMBER;
  for (const x of [5, 19, 31]) c.fillRect(x, 1, 3, 2);
  c.fillStyle = EMBER_GLOW;
  c.fillRect(20, 1, 1, 1);
}

/** Plataforma: losa pálida de caliza gastada (color hueso), con grietas finas. */
function boneSlab(c: Ctx): void {
  c.fillStyle = BONE_DARK;
  c.fillRect(0, 0, T, T);
  c.fillStyle = BONE;
  c.fillRect(2, 2, T - 4, T - 6);
  c.fillStyle = BONE_LIGHT;
  c.fillRect(2, 2, T - 4, 3);
  c.fillStyle = BONE_SHADE;
  for (const [x, y] of [[7, 12], [26, 9], [14, 24], [30, 22]]) c.fillRect(x, y, 4, 2);
  c.strokeStyle = BONE_DARK;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(22, 5);
  c.lineTo(19, 14);
  c.lineTo(23, 20);
  c.stroke();
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.fillRect(2, T - 6, T - 4, 2);
}

export type XibalbaTexId = 'xibRock' | 'xibRockTop' | 'xibBone';

/** Genera las texturas del tema `xibalba` (requiere DOM). */
export function createXibalbaTextures(): Readonly<Record<XibalbaTexId, HTMLCanvasElement>> {
  return {
    xibRock: makeTile(T, basalt),
    xibRockTop: makeTile(T, basaltTop),
    xibBone: makeTile(T, boneSlab),
  };
}
