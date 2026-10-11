import { T, VW } from '../constants';
import { drawTruck } from './haciendaProps';
import { drawCoastalPlatform } from './coastalPlatforms';
import { CAR_TILES, MOVER_H, platformReach, TRAIN_CAR_H, type MovingPlatform, type TrainSpec } from '../entities/platforms';
import { bakedFrame, type Frame } from './artCache';
import { roundRect, type Ctx } from './drawUtils';

/**
 * Dibujo de las plataformas móviles (AGENTS.md §5.4).
 *
 * Los vagones usan el arte pintado `complementos/tren.webp` (1774×887): locomotora
 * con cara de jaguar arriba a la izquierda y vagón de pasajeros arriba a la derecha.
 * Mientras carga (o si falla) se dibuja un vagón procedural con los mismos colores.
 * Bajo el recorrido del tren se tiende una vía (sobre los hoyos hace de puente).
 */

const TRAIN_FILE = 'complementos/tren.webp';
/** Rectángulos medidos por cajas de alfa (alfa > 64). La locomotora mira a la izquierda. */
const LOCO_FRAME: Frame = [22, 104, 808, 337];
const CAR_FRAME: Frame = [906, 120, 856, 322];

const CAR_W = CAR_TILES * T;
/** Escala de horneado: el ancho del recorte pasa a ser el de un vagón. */
const LOCO_SCALE = CAR_W / LOCO_FRAME[2];
const CAR_SCALE = CAR_W / CAR_FRAME[2];
/** Píxeles que el techo pintado sobresale por encima de la superficie de apoyo. */
const ROOF_OVERHANG = 4;
const OFFSCREEN_MARGIN = 40;

const RAIL_COLOR = '#5b5f66';
const RAIL_SHINE = '#b9bec6';
const SLEEPER_COLOR = '#6b4423';
const SLEEPER_STEP = 20;
const SLEEPER_W = 10;

/** Colores del Tren Maya (crema, verde y guinda) para el respaldo procedural. */
const TRAIN_CREAM = '#f1e6c8';
const TRAIN_GREEN = '#127a5f';
const TRAIN_MAROON = '#7a1f2e';
const TRAIN_WINDOW = '#1d2b3a';

const PLANK_DARK = '#5a3415';
const PLANK_LIGHT = '#c48a50';
const PLANK_SHINE = '#e0b07a';
const ROPE_COLOR = '#d9c27a';

const visible = (x: number, w: number): boolean => x + w > -OFFSCREEN_MARGIN && x < VW + OFFSCREEN_MARGIN;

/** Vía bajo todo el recorrido del tren (rieles + durmientes). */
function drawTrack(c: Ctx, spec: TrainSpec, camX: number): void {
  const { x0, x1 } = platformReach(spec);
  const left = x0 * T - camX;
  const width = (x1 - x0 + 1) * T;
  if (!visible(left, width)) return;
  const railY = spec.y * T + TRAIN_CAR_H;
  c.fillStyle = SLEEPER_COLOR;
  for (let x = 0; x < width; x += SLEEPER_STEP) c.fillRect(left + x, railY + 2, SLEEPER_W, 8);
  c.fillStyle = RAIL_COLOR;
  c.fillRect(left, railY, width, 4);
  c.fillStyle = RAIL_SHINE;
  c.fillRect(left, railY, width, 1);
}

/** Vagón procedural de respaldo (mientras carga el arte). */
function drawCarFallback(c: Ctx, x: number, y: number, loco: boolean): void {
  const w = CAR_W;
  const h = TRAIN_CAR_H - 10;
  c.fillStyle = TRAIN_CREAM;
  roundRect(c, x + 2, y, w - 4, h, loco ? 14 : 6);
  c.fill();
  c.fillStyle = TRAIN_MAROON;
  c.fillRect(x + 4, y, w - 8, 8);
  c.fillStyle = TRAIN_GREEN;
  c.fillRect(x + 2, y + h - 22, w - 4, 14);
  c.fillStyle = TRAIN_WINDOW;
  for (let i = 0; i < 4; i++) c.fillRect(x + 22 + i * 42, y + 16, 28, 18);
  c.fillStyle = '#222';
  for (const wx of [30, 60, w - 60, w - 30]) {
    c.beginPath();
    c.arc(x + wx, y + h + 3, 8, 0, Math.PI * 2);
    c.fill();
  }
}

function drawCar(c: Ctx, x: number, y: number, loco: boolean, flip: boolean): void {
  const art = loco ? bakedFrame(TRAIN_FILE, LOCO_FRAME, LOCO_SCALE) : bakedFrame(TRAIN_FILE, CAR_FRAME, CAR_SCALE);
  if (!art) return drawCarFallback(c, x, y, loco);
  const top = y - ROOF_OVERHANG;
  const h = TRAIN_CAR_H + ROOF_OVERHANG;
  if (!flip) return void c.drawImage(art, x, top, CAR_W, h);
  c.save();
  c.translate(x + CAR_W, top);
  c.scale(-1, 1);
  c.drawImage(art, 0, 0, CAR_W, h);
  c.restore();
}

/** Tren: la locomotora va en el extremo hacia el que arranca y mira hacia allí. */
function drawTrain(c: Ctx, m: MovingPlatform, spec: TrainSpec, camX: number): void {
  const x = Math.round(m.x - camX);
  if (!visible(x, m.w)) return;
  const forward = spec.range >= 0;
  for (let i = 0; i < spec.cars; i++) {
    const loco = forward ? i === spec.cars - 1 : i === 0;
    // El arte de la locomotora mira a la izquierda: se voltea si el tren arranca hacia la derecha.
    drawCar(c, x + i * CAR_W, m.y, loco, loco && forward);
  }
}

/** Plataforma genérica: tablón de madera atado con fibra de henequén. */
function drawMover(c: Ctx, m: MovingPlatform, camX: number): void {
  if (m.spec.kind === 'mover' && m.spec.appearance === 'truck') return drawTruck(c, m, camX);
  if (m.spec.kind === 'mover' && (m.spec.appearance === 'boat' || m.spec.appearance === 'turtle')) return drawCoastalPlatform(c, m, camX);
  const x = Math.round(m.x - camX);
  if (!visible(x, m.w)) return;
  const y = Math.round(m.y);
  c.fillStyle = PLANK_DARK;
  roundRect(c, x, y, m.w, MOVER_H, 4);
  c.fill();
  c.fillStyle = PLANK_LIGHT;
  c.fillRect(x + 2, y + 2, m.w - 4, MOVER_H - 6);
  c.fillStyle = PLANK_SHINE;
  c.fillRect(x + 2, y + 2, m.w - 4, 2);
  c.fillStyle = PLANK_DARK;
  for (let k = T; k < m.w; k += T) c.fillRect(x + k - 1, y + 2, 2, MOVER_H - 6);
  c.fillStyle = ROPE_COLOR;
  for (const rx of [x + 8, x + m.w - 14]) c.fillRect(rx, y, 6, MOVER_H);
}

/** Dibuja vías, vagones y plataformas genéricas. */
export function drawPlatforms(c: Ctx, platforms: readonly MovingPlatform[], camX: number): void {
  for (const m of platforms) if (m.spec.kind === 'train') drawTrack(c, m.spec, camX);
  for (const m of platforms) {
    if (m.spec.kind === 'train') drawTrain(c, m, m.spec, camX);
    else drawMover(c, m, camX);
  }
}
