import { TAU, VH, VW } from '../../constants';
import type { Scenery } from '../backgrounds';
import { hash, layer, type Ctx } from '../drawUtils';
import { paintedScenery } from './painted';

/**
 * Escenario `hacienda` (AGENTS.md §4.7): atardecer cálido sobre los henequenales
 * de Campeche y Yucatán, con el casco de una hacienda (arcos encalados y la
 * chimenea de la casa de máquinas) y una albarrada de piedra en primer plano.
 * Procedural mientras no exista `public/assets/backgrounds/hacienda.webp`.
 */

const SUN_X = 0.72 * VW;
const SUN_Y = 250;
const SUN_R = 46;
const HILLS = '#b0624a';
const CASCO_WALL = '#e6c79a';
const CASCO_SHADE = '#b88f68';
const CASCO_ARCH = '#7a4a34';
const CHIMNEY = '#8a4a32';
const FIELD = '#9a6a3a';
const AGAVE_FAR = '#5f8a74';
const AGAVE_NEAR = '#4f7d66';
const AGAVE_EDGE = '#8fb8a0';
const ALBARRADA = '#9c8d78';
const ALBARRADA_DARK = '#776a58';
/** Fondo de las barrancas bajo el camino: así los hoyos se leen como caída. */
const RAVINE_TOP = '#5a2a18';
const RAVINE_BOTTOM = '#1e0d08';
const FIELD_TOP = 380;
const ALBARRADA_Y = 470;

/** Separación (px) entre cascos de hacienda en la capa lejana. */
const CASCO_SPACING = 900;
const CASCO_W = 260;
const CASCO_BASE = 360;

const wrap = (v: number, period: number): number => ((v % period) + period) % period;

function drawSun(c: Ctx): void {
  c.fillStyle = 'rgba(255,214,140,.35)';
  c.beginPath();
  c.arc(SUN_X, SUN_Y, SUN_R * 1.7, 0, TAU);
  c.fill();
  c.fillStyle = '#ffd98a';
  c.beginPath();
  c.arc(SUN_X, SUN_Y, SUN_R, 0, TAU);
  c.fill();
}

/** Casco de hacienda: fachada con arcos y chimenea de ladrillo. */
function drawCasco(c: Ctx, x: number): void {
  const top = CASCO_BASE - 70;
  c.fillStyle = CHIMNEY;
  c.fillRect(x + CASCO_W - 50, CASCO_BASE - 170, 22, 170);
  c.fillRect(x + CASCO_W - 54, CASCO_BASE - 176, 30, 10);
  c.fillStyle = CASCO_WALL;
  c.fillRect(x, top, CASCO_W, 70);
  // Remate curvo (espadaña) al centro de la fachada.
  c.beginPath();
  c.moveTo(x + CASCO_W / 2 - 50, top);
  c.quadraticCurveTo(x + CASCO_W / 2, top - 50, x + CASCO_W / 2 + 50, top);
  c.fill();
  c.fillStyle = CASCO_SHADE;
  c.fillRect(x, top, CASCO_W, 6);
  c.fillStyle = CASCO_ARCH;
  for (let i = 0; i < 5; i++) {
    const ax = x + 22 + i * 46;
    c.fillRect(ax, top + 30, 26, 40);
    c.beginPath();
    c.arc(ax + 13, top + 30, 13, Math.PI, 0);
    c.fill();
  }
}

/** Penca de henequén: roseta de hojas largas y rígidas. */
function drawAgave(c: Ctx, x: number, y: number, s: number, col: string): void {
  c.fillStyle = col;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.32;
    const len = 34 * s;
    c.beginPath();
    c.moveTo(x - 3 * s, y);
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.lineTo(x + 3 * s, y);
    c.fill();
  }
  c.fillStyle = AGAVE_EDGE;
  c.fillRect(x - 1, y - 18 * s, 2, 14 * s);
}

/** Hileras de henequén con parallax. */
function drawField(c: Ctx, cam: number, factor: number, y: number, s: number, col: string): void {
  const seg = 70 * s;
  const off = cam * factor;
  const n0 = Math.floor(off / seg) - 1;
  for (let n = n0; n < n0 + VW / seg + 3; n++) drawAgave(c, n * seg - off + hash(n) * 20, y, s, col);
}

/** Albarrada: muro bajo de piedra seca típico del campo yucateco. */
function drawAlbarrada(c: Ctx, cam: number): void {
  const y = ALBARRADA_Y;
  c.fillStyle = ALBARRADA_DARK;
  c.fillRect(0, y, VW, 20);
  const off = cam * 0.7;
  c.fillStyle = ALBARRADA;
  for (let n = Math.floor(off / 26) - 1; n < Math.floor(off / 26) + VW / 26 + 2; n++) {
    const sx = n * 26 - off;
    c.beginPath();
    c.ellipse(sx, y + 4 + hash(n) * 6, 13, 8, 0, 0, TAU);
    c.fill();
  }
}

/** Escenario procedural de la hacienda henequenera. */
export const haciendaProcedural: Scenery = (c, cam) => {
  drawSun(c);
  layer(c, cam * 0.1, 360, 70, HILLS, 0.004, 4);
  const off = cam * 0.2;
  for (let n = Math.floor(off / CASCO_SPACING) - 1; n <= Math.floor(off / CASCO_SPACING) + 2; n++) {
    drawCasco(c, n * CASCO_SPACING - off + wrap(hash(n) * 300, 300));
  }
  c.fillStyle = FIELD;
  c.fillRect(0, FIELD_TOP, VW, ALBARRADA_Y - FIELD_TOP);
  const ravine = c.createLinearGradient(0, ALBARRADA_Y, 0, VH);
  ravine.addColorStop(0, RAVINE_TOP);
  ravine.addColorStop(1, RAVINE_BOTTOM);
  c.fillStyle = ravine;
  c.fillRect(0, ALBARRADA_Y, VW, VH - ALBARRADA_Y);
  drawField(c, cam, 0.35, 410, 0.9, AGAVE_FAR);
  drawField(c, cam, 0.45, 455, 1.3, AGAVE_NEAR);
  drawAlbarrada(c, cam);
};

/** Fondo pintado `hacienda.webp` si existe; si no (o mientras carga), el procedural. */
export const haciendaScenery: Scenery = paintedScenery('hacienda.webp', haciendaProcedural, { nearTop: 0.66 });
