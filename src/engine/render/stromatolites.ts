import { T, VW } from '../constants';
import type { Stromatolite } from '../entities/stromatolites';
import type { World } from '../World';
import { drawGameplaySprite } from './gameplaySprites';
import type { Ctx } from './drawUtils';

/**
 * Estromatolitos de Bacalar: el cuadro «estromatolito» del atlas de mecánicas, en piezas de
 * dos bloques para no deformarlo, con un velo rojizo y grietas cuando el tramo ya está dañado.
 * Sin imagen, cúpulas procedurales de tono claro. Solo dibuja; no muta el tramo.
 */

const PIECE_TILES = 2;
const DAMAGE_VEIL = 'rgba(150, 40, 40, 0.42)';
const CRACK_COLOR = 'rgba(60, 20, 20, 0.7)';
const FALLBACK_FILL = '#c9bfa0';
const FALLBACK_SHADE = '#8f8466';
const CRACK_INSET = 0.3;

function drawPiece(c: Ctx, x: number, y: number, tiles: number): void {
  const w = tiles * T;
  if (drawGameplaySprite(c, 'stromatolite', x, y, w, T)) return;
  c.fillStyle = FALLBACK_SHADE;
  c.fillRect(x, y + T * 0.5, w, T * 0.5);
  c.fillStyle = FALLBACK_FILL;
  c.beginPath();
  c.ellipse(x + w / 2, y + T * 0.6, w / 2, T * 0.5, 0, Math.PI, 0);
  c.fill();
}

function drawDamage(c: Ctx, x: number, y: number, w: number): void {
  c.fillStyle = DAMAGE_VEIL;
  c.fillRect(x, y, w, T);
  c.strokeStyle = CRACK_COLOR;
  c.lineWidth = 2;
  c.beginPath();
  for (let cx = x + T / 2; cx < x + w; cx += T) {
    c.moveTo(cx - T * CRACK_INSET, y + 2);
    c.lineTo(cx, y + T / 2);
    c.lineTo(cx - T * CRACK_INSET * 0.4, y + T - 2);
  }
  c.stroke();
}

function drawSpan(c: Ctx, s: Stromatolite, camX: number): void {
  const x = s.x * T - camX;
  const y = s.y * T;
  if (x + s.len * T < 0 || x > VW) return;
  for (let i = 0; i < s.len; i += PIECE_TILES) {
    drawPiece(c, x + i * T, y, Math.min(PIECE_TILES, s.len - i));
  }
  if (s.damaged) drawDamage(c, x, y, s.len * T);
}

export function drawStromatolites(c: Ctx, world: World): void {
  for (const s of world.stromatolites) drawSpan(c, s, world.camX);
}
