import { GROUND, T, TAU } from '../../constants';
import type { World } from '../../World';
import type { Ctx } from '../drawUtils';
import { bakedFrame } from '../artCache';
import { BAY_ART, SHIP_RIGGING } from '../../../data/world6Art';
import { drawScenerySprite } from '../scenerySprites';

/**
 * Cubierta de Lorencillo detrás de bloques y entidades: bahía, velas y jarcias pintadas,
 * con barriles y cañones de utilería. El respaldo procedural cubre recursos ausentes.
 * El decorado se escora sobre su base según la deriva real; no crea gradientes por fotograma.
 */

const FLOOR = GROUND * T;
const HORIZON = 8 * T;
const MAST_TOP = 60;
const MAST_WIDTH = 14;
const SAIL_DEPTH = 26;
/** Posiciones (fracción del ancho) de los mástiles; el primero es el mayor. */
const MASTS: readonly (readonly [number, number])[] = [[0.5, MAST_TOP], [0.86, MAST_TOP + 70]];
const BARRELS: readonly number[] = [0.06, 0.94];
const CANNONS: readonly number[] = [0.16, 0.84];
const BARREL_WIDTH = 60;
const CANNON_WIDTH = 96;
/** Escora máxima (rad) cuando el barco se ladea del todo y balanceo suave en calma. */
const LEAN_ANGLE = 0.1;
const SWAY_PERIOD = 1800;
const CALM_SWAY = 0.006;
const WAVE_COUNT = 9;
/** Cuánto se extienden cielo, mar y mástiles más allá de lo visible para que al girar no queden cuñas. */
const OVERSCAN = FLOOR;
const RAIL_WIDTH = 10;
const RAIL_COLOR = '#4d3820';
const RAIL_LIGHT = '#8a5a2e';

/** Ángulo del decorado: la escora real de la cubierta (fase 2) o un vaivén casi imperceptible. */
export function shipAngle(lean: number, now: number): number {
  return lean * LEAN_ANGLE + CALM_SWAY * Math.sin(now / SWAY_PERIOD);
}

/** Gira alrededor de la base (x, FLOOR): los pies del objeto siguen en la cubierta y solo la parte alta se ladea. */
function leaning(c: Ctx, x: number, angle: number, draw: () => void): void {
  c.save();
  c.translate(x, FLOOR);
  c.rotate(angle);
  c.translate(-x, -FLOOR);
  draw();
  c.restore();
}

/** Mar y cielo; el conjunto gira alrededor del centro de la arena y sobra por todos lados. */
function drawHorizon(c: Ctx, width: number, now: number, stage: number, angle: number): void {
  leaning(c, width / 2, angle, () => {
    c.fillStyle = stage > 1 ? '#6f9fc0' : '#8fd0ea';
    c.fillRect(-width, -OVERSCAN, width * 3, OVERSCAN + HORIZON);
    c.fillStyle = stage > 1 ? '#1a5470' : '#2689a8';
    c.fillRect(-width, HORIZON, width * 3, FLOOR - HORIZON + OVERSCAN);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
    for (let i = 0; i < WAVE_COUNT; i++) {
      const x = (i + 0.5) * width / WAVE_COUNT + Math.sin(now / 900 + i) * 8;
      c.beginPath(); c.ellipse(x, HORIZON + 20 + (i % 3) * 22, 26, 4, 0, Math.PI, TAU); c.stroke();
    }
  });
}

function drawPaintedSea(c: Ctx, width: number, stage: number, angle: number): void {
  const art = bakedFrame(BAY_ART.file, BAY_ART.frame, (width + OVERSCAN) / BAY_ART.frame[2]);
  if (art) leaning(c, width / 2, angle, () => c.drawImage(art, -OVERSCAN / 2, FLOOR - art.height));
  if (stage > 1) {
    c.fillStyle = 'rgba(16,27,63,.28)'; c.fillRect(0, 0, width, FLOOR);
  }
}

/** Mástil con vela cuadra curvada; la jarcia sale de su punta, que se desplaza al escorar. */
function drawMast(c: Ctx, x: number, top: number, width: number, now: number, angle: number): void {
  leaning(c, x, angle, () => {
    c.fillStyle = '#6b4a2b';
    c.fillRect(x - MAST_WIDTH / 2, top, MAST_WIDTH, FLOOR - top + OVERSCAN / 4);
    const bulge = Math.sin(now / 1400 + x) * 6;
    c.fillStyle = '#f2e6c8';
    c.beginPath();
    c.moveTo(x - 80, top + 20); c.lineTo(x + 80, top + 20);
    c.quadraticCurveTo(x + 90 + bulge, top + 20 + SAIL_DEPTH * 3, x + 70, top + 150);
    c.lineTo(x - 70, top + 150);
    c.quadraticCurveTo(x - 90 - bulge, top + 20 + SAIL_DEPTH * 3, x - 80, top + 20);
    c.fill();
  });
  const reach = FLOOR - top - 4;
  const tipX = x + Math.sin(angle) * reach, tipY = FLOOR - Math.cos(angle) * reach;
  c.strokeStyle = '#4d3820'; c.lineWidth = 2;
  for (const edge of [0, width]) {
    c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(edge, FLOOR); c.stroke();
  }
}

/** Borda de popa en cada extremo: el decorado acaba en el casco, no en un corte seco contra la playa. */
function drawRails(c: Ctx, width: number): void {
  for (const x of [0, width - RAIL_WIDTH]) {
    c.fillStyle = RAIL_COLOR; c.fillRect(x, 0, RAIL_WIDTH, FLOOR);
    c.fillStyle = RAIL_LIGHT; c.fillRect(x + (x ? 0 : RAIL_WIDTH - 4), 0, 4, FLOOR);
  }
}

function drawBarrelProp(c: Ctx, x: number): void {
  if (drawScenerySprite(c, 'barrel', x, FLOOR, BARREL_WIDTH)) return;
  c.fillStyle = '#8a5a2e'; c.fillRect(x - 22, FLOOR - 50, 44, 50);
  c.fillStyle = '#4d3820'; c.fillRect(x - 22, FLOOR - 36, 44, 5); c.fillRect(x - 22, FLOOR - 14, 44, 5);
}

function drawCannonShape(c: Ctx, x: number, facing: number): void {
  c.save();
  c.translate(x, 0);
  c.scale(facing, 1);
  if (!drawScenerySprite(c, 'cannon', 0, FLOOR, CANNON_WIDTH)) {
    c.fillStyle = '#2f3138'; c.fillRect(-38, FLOOR - 34, 76, 22);
    c.fillStyle = '#6b4a2b'; c.beginPath(); c.arc(-20, FLOOR - 10, 12, 0, TAU); c.fill();
  }
  c.restore();
}

export function drawShip(c: Ctx, width: number, now: number, world: World): void {
  const alive = world.boss !== null && world.boss.hp > 0;
  const stage = alive ? world.boss?.stage ?? 1 : 1;
  const angle = shipAngle(alive ? world.boss?.lean ?? 0 : 0, now);
  drawHorizon(c, width, now, stage, angle);
  drawPaintedSea(c, width, stage, angle);
  const rigging = bakedFrame(SHIP_RIGGING.file, SHIP_RIGGING.frame, width / SHIP_RIGGING.frame[2]);
  if (rigging) leaning(c, width * SHIP_RIGGING.mast, angle, () => c.drawImage(rigging, 0, FLOOR - rigging.height));
  else for (const [fx, top] of MASTS) drawMast(c, width * fx, top, width, now, angle);
  BARRELS.forEach((fx) => leaning(c, width * fx, angle, () => drawBarrelProp(c, width * fx)));
  CANNONS.forEach((fx, i) => leaning(c, width * fx, angle, () => drawCannonShape(c, width * fx, i ? -1 : 1)));
  drawRails(c, width);
}
