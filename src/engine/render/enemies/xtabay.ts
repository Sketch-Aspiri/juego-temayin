import { TAU } from '../../constants';
import { SPINE_REACH, XTABAY_STATE } from '../../entities/enemies/xtabay';
import type { Enemy } from '../../entities/types';
import { bakedFrame } from '../artCache';
import type { Ctx } from '../drawUtils';
import type { AtlasFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/**
 * Xtabay: ceiba en flor (figura de leyenda, sin rasgos humanos). Cuadros reales de
 * `enemies/xtabay.webp` (`imagenes/nuevos/enemigos/xtabay.atlas.json`): reposo, flores
 * luminosas, raíz extendida y raíz replegada. Anclaje en la base del tronco; la raíz
 * del arte crece hacia la derecha, así que se voltea si el jugador está a la izquierda.
 */
const FILE = 'enemies/xtabay.webp';
const FRAMES = {
  rest: { x: 134, y: 176, w: 356, h: 358, ax: 300, ay: 534 },
  glow: { x: 761, y: 175, w: 357, h: 359, ax: 925, ay: 534 },
  strike: { x: 109, y: 771, w: 512, h: 342, ax: 265, ay: 1113 },
  retract: { x: 757, y: 771, w: 354, h: 342, ax: 915, ay: 1113 },
} as const satisfies Record<string, AtlasFrame>;
/** ~358 px de alto en la hoja → ~82 px en pantalla; la raíz extendida mide ~SPINE_REACH. */
const SCALE = 0.23;

/** Flores de la copa (coordenadas locales ya escaladas) para el brillo y los capullos. */
const FLOWERS: readonly (readonly [number, number])[] = [
  [-22, -58],
  [-2, -68],
  [11, -49],
  [25, -56],
];
const GLOW = 'rgba(255, 244, 190, 0.35)';
const GLOW_SPEED = 5;
const BUD_LEAF = '#2f7a3a';
const BUD_TIP = '#e9f2d0';

const BARK = '#6f7a58';
const BARK_DARK = '#3f4a30';
const CROWN = ['#1f7a4a', '#2f9a5a', '#4fb86a'] as const;
const PETAL = '#fff6e0';
const THORN = '#e0c48a';

/** Copia el cuadro horneado (se hornea una vez por escala); false mientras carga. */
function drawFrame(c: Ctx, f: AtlasFrame): boolean {
  const img = bakedFrame(FILE, [f.x, f.y, f.w, f.h], SCALE);
  if (!img) return false;
  c.drawImage(img, Math.round((f.x - f.ax) * SCALE), Math.round((f.y - f.ay) * SCALE));
  return true;
}

/** Halo que late sobre las flores mientras atrae al jugador. */
function drawGlow(c: Ctx, t: number): void {
  const r = 9 + Math.sin(t * GLOW_SPEED) * 2;
  c.fillStyle = GLOW;
  for (const [x, y] of FLOWERS) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }
}

/** Flores cerradas (tras una bola de fuego): capullos verdes sobre cada flor. */
function drawBuds(c: Ctx): void {
  for (const [x, y] of FLOWERS) {
    c.fillStyle = BUD_LEAF;
    c.beginPath();
    c.ellipse(x, y, 6, 8, 0, 0, TAU);
    c.fill();
    c.fillStyle = BUD_TIP;
    c.beginPath();
    c.ellipse(x, y - 6, 2, 3, 0, 0, TAU);
    c.fill();
  }
}

/** Raíz con espinas a ras de suelo, de largo `len` hacia la derecha. */
function drawRoot(c: Ctx, len: number): void {
  c.strokeStyle = BARK_DARK;
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, -4);
  c.quadraticCurveTo(len * 0.5, -10, len, -6);
  c.stroke();
  c.fillStyle = THORN;
  for (let x = 14; x < len; x += 14) {
    c.beginPath();
    c.moveTo(x - 3, -9);
    c.lineTo(x, -18);
    c.lineTo(x + 3, -9);
    c.fill();
  }
}

/** Ceiba procedural: respaldo mientras la imagen no ha cargado. */
function drawFallback(c: Ctx, e: Enemy): void {
  c.fillStyle = BARK;
  c.beginPath();
  c.moveTo(-20, 0);
  c.quadraticCurveTo(-6, -14, -7, -44);
  c.lineTo(7, -44);
  c.quadraticCurveTo(6, -14, 20, 0);
  c.fill();
  CROWN.forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(-14 + i * 14, -58 - (i % 2) * 8, 22, 16, 0, 0, TAU);
    c.fill();
  });
  if (e.state === XTABAY_STATE.closed) return drawBuds(c);
  c.fillStyle = PETAL;
  for (const [x, y] of FLOWERS) {
    c.beginPath();
    c.arc(x, y, 4, 0, TAU);
    c.fill();
  }
  if (e.state === XTABAY_STATE.strike) drawRoot(c, SPINE_REACH);
}

function pickFrame(e: Enemy): AtlasFrame {
  switch (e.state) {
    case XTABAY_STATE.lure:
      return FRAMES.glow;
    case XTABAY_STATE.strike:
      return FRAMES.strike;
    case XTABAY_STATE.retract:
      return FRAMES.retract;
    default:
      return FRAMES.rest;
  }
}

export const drawXtabay: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (!drawFrame(c, pickFrame(e))) {
    drawFallback(c, e);
    return;
  }
  if (e.state === XTABAY_STATE.lure) drawGlow(c, e.t);
  else if (e.state === XTABAY_STATE.closed) drawBuds(c);
};
