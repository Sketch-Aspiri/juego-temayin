import { GROUND, T, TAU, VW } from '../constants';
import type { Ball } from '../entities/ball';
import { hoopCenter, type Hoop } from '../entities/hoops';
import type { Ctx } from './drawUtils';
import { drawRubberBall, objectSprite } from './props';
import { drawGameplaySprite } from './gameplaySprites';

/** Altura en pantalla de la pelota en vuelo (algo mayor que su caja de colisión). */
const BALL_DRAW_SIZE = 24;
/** Radios del aro de piedra (px). */
const HOOP_OUTER = 26;
const HOOP_INNER = 13;
/** Muesca tallada en el canto del aro. */
const HOOP_NOTCHES = 12;
/** Ancho del paño de muro que sostiene el aro (px). */
const WALL_W = 2 * T;
/** Segundos que dura el destello al encender el aro. */
const LIT_FLASH_TIME = 0.8;

const STONE = '#c9b892';
const STONE_DARK = '#8a7a5a';
const STONE_LINE = 'rgba(70,55,35,.45)';
const WALL_FILL = 'rgba(120,104,78,.55)';
const GLOW = '#ffd23f';

/** Pelotas de hule en vuelo, girando. */
export function drawBalls(c: Ctx, balls: readonly Ball[], camX: number): void {
  const img = objectSprite('ball', BALL_DRAW_SIZE);
  for (const b of balls) {
    const x = b.x + b.w / 2 - camX;
    const y = b.y + b.h / 2;
    c.save();
    c.translate(x, y);
    c.rotate(b.spin);
    if (img) c.drawImage(img, -img.width / 2, -img.height / 2);
    else drawRubberBall(c, 0, 0, BALL_DRAW_SIZE / 2);
    c.restore();
  }
}

/**
 * Aros del juego de pelota: paño de muro de la cancha (decorado, no sólido) y aro de
 * piedra tallada con su perforación. Solo muescas en el canto: sin glifos.
 */
export function drawHoops(c: Ctx, hoops: readonly Hoop[], camX: number, now: number): void {
  for (const h of hoops) {
    const { x, y } = hoopCenter(h);
    const sx = x - camX;
    if (sx < -WALL_W || sx > VW + WALL_W) continue;
    drawWallPanel(c, sx, y);
    drawRing(c, sx, y, h, now);
  }
}

/** Paño de muro detrás del aro, desde un bloque sobre el aro hasta el suelo. */
function drawWallPanel(c: Ctx, sx: number, cy: number): void {
  const top = cy - T * 1.5;
  const bottom = GROUND * T;
  c.fillStyle = WALL_FILL;
  c.fillRect(sx - WALL_W / 2, top, WALL_W, bottom - top);
  c.strokeStyle = STONE_LINE;
  c.lineWidth = 1;
  for (let yy = top + T / 2; yy < bottom; yy += T / 2) {
    c.beginPath();
    c.moveTo(sx - WALL_W / 2, yy);
    c.lineTo(sx + WALL_W / 2, yy);
    c.stroke();
  }
}

function drawRing(c: Ctx, sx: number, cy: number, h: Hoop, now: number): void {
  if (h.lit) {
    const pulse = 0.35 + Math.sin(now / 200) * 0.1 + Math.max(0, 1 - h.litT / LIT_FLASH_TIME) * 0.5;
    c.fillStyle = `rgba(255,210,63,${pulse})`;
    c.beginPath();
    c.arc(sx, cy, HOOP_OUTER + 10, 0, TAU);
    c.fill();
  }
  if (drawGameplaySprite(c, 'hoop', sx, cy, HOOP_OUTER * 2)) return;
  // Anillo con perforación (regla evenodd: el centro queda vacío).
  c.beginPath();
  c.arc(sx, cy, HOOP_OUTER, 0, TAU);
  c.moveTo(sx + HOOP_INNER, cy);
  c.arc(sx, cy, HOOP_INNER, 0, TAU, true);
  c.fillStyle = STONE;
  c.fill('evenodd');
  c.lineWidth = 3;
  c.strokeStyle = h.lit ? GLOW : STONE_DARK;
  c.stroke();
  c.strokeStyle = STONE_LINE;
  c.lineWidth = 2;
  for (let i = 0; i < HOOP_NOTCHES; i++) {
    const a = (i / HOOP_NOTCHES) * TAU;
    c.beginPath();
    c.moveTo(sx + Math.cos(a) * (HOOP_INNER + 3), cy + Math.sin(a) * (HOOP_INNER + 3));
    c.lineTo(sx + Math.cos(a) * (HOOP_OUTER - 3), cy + Math.sin(a) * (HOOP_OUTER - 3));
    c.stroke();
  }
}
