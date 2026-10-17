import { T, VH, VW } from '../constants';
import type { CurrentZone } from '../level/zones';
import type { World } from '../World';
import { hash, type Ctx } from './drawUtils';

/**
 * Rayas de viento y térmicas (op `wind`). Cada raya es un trazo suave que se dibuja
 * desde un lienzo pequeño reutilizado (se crea una sola vez) y recorre la zona en la
 * dirección del viento; solo se pintan las zonas visibles y no se muta el estado.
 */

const STREAK_W = 96;
const STREAK_H = 14;
const STREAK_ALPHA = 0.9;
/** Una raya por cada tantos bloques cuadrados de la zona, con tope para no recargar el dibujo. */
const TILES_PER_STREAK = 3;
const MAX_STREAKS = 24;
/** Ciclos por segundo mínimos para que una zona con viento flojo siga viéndose viva. */
const MIN_SPEED = 1.5;
/** Contorno azul oscuro bajo el trazo blanco: sin él las rayas se pierden sobre las espumas y las nubes. */
const OUTLINE = 'rgba(18,70,120,0.75)';
const CORE = '#ffffff';
const THERMAL_CORE = '#fff2a8';
const CHEVRON_SIZE = 36;
const STROKE_OUTLINE = 6;
const STROKE_CORE = 3;

let streakCanvas: HTMLCanvasElement | null = null;
let chevronCanvas: HTMLCanvasElement | null = null;

function spriteCanvas(w: number, h: number): { canvas: HTMLCanvasElement; c: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  return c ? { canvas, c } : null;
}

/** Trazo con contorno y punta de flecha hacia +x (la dirección del viento tras rotar). */
function drawStroke(c: CanvasRenderingContext2D, path: () => void, color: string): void {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const [width, style] of [[STROKE_OUTLINE, OUTLINE], [STROKE_CORE, color]] as const) {
    c.strokeStyle = style;
    c.lineWidth = width;
    c.beginPath();
    path();
    c.stroke();
  }
}

/** Raya larga con flecha en la punta; se rota hacia donde sopla el viento. */
function streakSprite(): HTMLCanvasElement | null {
  if (streakCanvas) return streakCanvas;
  const made = spriteCanvas(STREAK_W, STREAK_H);
  if (!made) return null;
  const { canvas, c } = made;
  const mid = STREAK_H / 2;
  const tip = STREAK_W - STROKE_OUTLINE;
  drawStroke(c, () => {
    c.moveTo(STROKE_OUTLINE, mid); c.lineTo(tip, mid);
    c.moveTo(tip - 10, mid - 4); c.lineTo(tip, mid); c.lineTo(tip - 10, mid + 4);
  }, CORE);
  streakCanvas = canvas;
  return canvas;
}

/** Chevrón de térmica: apunta hacia +x y, rotado, hacia arriba; así no se confunde con la lluvia. */
function chevronSprite(): HTMLCanvasElement | null {
  if (chevronCanvas) return chevronCanvas;
  const made = spriteCanvas(CHEVRON_SIZE, CHEVRON_SIZE);
  if (!made) return null;
  const { canvas, c } = made;
  const mid = CHEVRON_SIZE / 2;
  const tip = CHEVRON_SIZE - STROKE_OUTLINE;
  drawStroke(c, () => {
    c.moveTo(STROKE_OUTLINE + 4, mid - 12); c.lineTo(tip, mid); c.lineTo(STROKE_OUTLINE + 4, mid + 12);
  }, THERMAL_CORE);
  chevronCanvas = canvas;
  return canvas;
}

/** Corriente ascendente o descendente: el eje dominante es vertical. */
export const isThermal = (z: Pick<CurrentZone, 'vx' | 'vy'>): boolean => Math.abs(z.vy) > Math.abs(z.vx);

function drawZone(c: Ctx, streak: HTMLCanvasElement, chevron: HTMLCanvasElement, z: CurrentZone, index: number, camX: number, now: number): void {
  const x = z.x0 * T - camX;
  const w = (z.x1 - z.x0 + 1) * T;
  const y = z.y0 * T;
  const h = (z.y1 - z.y0 + 1) * T;
  if (x + w < 0 || x > VW || y > VH) return;
  const speed = Math.hypot(z.vx, z.vy);
  if (speed === 0) return;
  const sprite = isThermal(z) ? chevron : streak;
  const angle = Math.atan2(z.vy, z.vx);
  const count = Math.min(MAX_STREAKS, Math.max(1, Math.round(((z.x1 - z.x0 + 1) * (z.y1 - z.y0 + 1)) / TILES_PER_STREAK)));
  const phaseSpeed = Math.max(speed, MIN_SPEED) * T;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.globalAlpha = STREAK_ALPHA;
  for (let i = 0; i < count; i++) {
    const seed = index * 100 + i;
    const along = (hash(seed) * (w + h) + (now / 1000) * phaseSpeed) % (w + h);
    const px = z.vx === 0 ? x + hash(seed + 7) * w : x + (z.vx > 0 ? along % w : w - (along % w));
    const py = z.vy === 0 ? y + hash(seed + 3) * h : y + (z.vy > 0 ? along % h : h - (along % h));
    c.translate(px, py);
    c.rotate(angle);
    c.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    c.rotate(-angle);
    c.translate(-px, -py);
  }
  c.restore();
}

/** Dibuja las rayas de todas las zonas de viento visibles. */
export function drawWind(c: Ctx, world: World, now: number): void {
  if (!world.level.winds.length) return;
  const streak = streakSprite();
  const chevron = chevronSprite();
  if (!streak || !chevron) return;
  world.level.winds.forEach((z, i) => drawZone(c, streak, chevron, z, i, world.camX, now));
}
