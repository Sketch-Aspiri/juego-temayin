import { TAU, VH, VW } from '../../constants';
import type { Ctx } from '../../render/drawUtils';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';
import { type MudBall, type Propagule } from './hazards';
import { MUD_SIZE, PROPAGULE_H, PROPAGULE_STUCK, PROPAGULE_W } from './tuning';

/**
 * Sprites de lodo y propágulos, con respaldo procedural y avisos visibles sobre
 * el pantano. La tormenta del frenesí solo lee el estado; no lo modifica.
 */

const MUD_DARK = '#4a3720';
const MUD_LIGHT = '#8a6a3c';
const STEM_DARK = '#4b5a23';
const STEM_LIGHT = '#8fa03c';
const STEM_TIP = '#7a3f28';
const WARNING_TOP = 160;
const WARNING_LINE = '#ffe6a3';
const WARNING_DASH: readonly number[] = [4, 8];
const SEED_MARGIN = 40;

const RAIN_DROPS = 90;
const RAIN_SPEED = 900;
const RAIN_LEN = 22;
const RAIN_SLANT = 7;
const STORM_TINT = 'rgba(18,28,48,.14)';
/** Periodo (s) entre relámpagos y su duración: destellos suaves y espaciados. */
const FLASH_PERIOD = 4.3;
const FLASH_TIME = 0.16;
const FLASH_ALPHA = 0.22;

/** Bola de lodo con grumos que giran. */
export function drawMud(c: Ctx, balls: readonly MudBall[], camX: number): void {
  for (const b of balls) {
    const x = b.x - camX;
    if (x < -MUD_SIZE || x > VW + MUD_SIZE) continue;
    const r = MUD_SIZE / 2;
    c.save();
    // La estela queda detrás del sprite, sin ampliar su silueta de contacto.
    c.fillStyle = 'rgba(90,67,38,.6)';
    c.beginPath(); c.arc(x - b.vx * 0.03, b.y - b.vy * 0.03, r * 0.45, 0, TAU); c.fill();
    c.translate(x, b.y);
    c.rotate(b.t * 8);
    if (drawNewGameplaySprite(c, 'mud', 0, 0, MUD_SIZE, MUD_SIZE)) {
      c.restore();
      continue;
    }
    c.fillStyle = MUD_DARK;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.fillStyle = MUD_LIGHT;
    for (let i = 0; i < 3; i++) {
      const a = (i * TAU) / 3;
      c.beginPath(); c.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.32, 0, TAU); c.fill();
    }
    c.restore();
  }
}

/** Carril y anillo de aviso: siguen siendo legibles con agua alta y sobre troncos. */
function drawWarning(c: Ctx, x: number, floor: number, wait: number, clock: number): void {
  const k = Math.max(0, Math.min(1, 1 - wait));
  const alpha = c.globalAlpha;
  c.save();
  c.strokeStyle = WARNING_LINE;
  c.lineWidth = 2;
  c.globalAlpha *= 0.35 + k * 0.35;
  c.setLineDash([...WARNING_DASH]);
  c.beginPath(); c.moveTo(x, WARNING_TOP + PROPAGULE_H); c.lineTo(x, floor - 8); c.stroke();
  c.setLineDash([]);
  c.globalAlpha = alpha;
  c.fillStyle = 'rgba(35,31,17,.65)';
  c.beginPath(); c.ellipse(x, floor, 12 + 10 * k, 5 + 2 * k, 0, 0, TAU); c.fill(); c.stroke();
  const shake = Math.sin(clock * 40) * 3 * k;
  drawSeed(c, x + shake, WARNING_TOP + PROPAGULE_H);
  c.beginPath(); c.moveTo(x - 7, WARNING_TOP + PROPAGULE_H + 6);
  c.lineTo(x, WARNING_TOP + PROPAGULE_H + 13); c.lineTo(x + 7, WARNING_TOP + PROPAGULE_H + 6); c.stroke();
  c.restore();
}

/** Propágulo del mangle rojo: tallo verde alargado con la punta parda hacia abajo. */
function drawSeed(c: Ctx, x: number, tipY: number): void {
  if (drawNewGameplaySprite(c, 'propagule', x, tipY, PROPAGULE_W, PROPAGULE_H)) return;
  const top = tipY - PROPAGULE_H;
  const w = PROPAGULE_W / 2;
  c.fillStyle = STEM_DARK;
  c.beginPath();
  c.moveTo(x - w, top + 6); c.lineTo(x + w, top + 6); c.lineTo(x + w * 0.6, tipY - 8); c.lineTo(x, tipY); c.lineTo(x - w * 0.6, tipY - 8);
  c.closePath(); c.fill();
  c.fillStyle = STEM_LIGHT;
  c.fillRect(x - 2, top + 8, 3, PROPAGULE_H - 20);
  c.fillStyle = STEM_TIP;
  c.beginPath(); c.moveTo(x - w * 0.6, tipY - 8); c.lineTo(x + w * 0.6, tipY - 8); c.lineTo(x, tipY); c.closePath(); c.fill();
  c.fillStyle = '#c9a23a';
  c.beginPath(); c.ellipse(x, top + 4, w + 2, 5, 0, 0, TAU); c.fill();
}

export function drawPropagules(c: Ctx, seeds: readonly Propagule[], camX: number, clock: number): void {
  for (const s of seeds) {
    const x = s.x - camX;
    if (x < -SEED_MARGIN || x > VW + SEED_MARGIN) continue;
    if (s.wait > 0) {
      drawWarning(c, x, s.floor, s.wait, clock);
      continue;
    }
    c.save();
    if (s.stuck !== null) c.globalAlpha *= Math.max(0, 1 - s.stuck / PROPAGULE_STUCK);
    drawSeed(c, x, s.y);
    c.restore();
  }
}

/** Aura roja palpitante del frenesí. */
export function drawFrenzyAura(c: Ctx, x: number, y: number, clock: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(clock * 7);
  const g = c.createRadialGradient(x, y, 10, x, y, 130);
  g.addColorStop(0, `rgba(255,70,50,${0.18 + 0.14 * pulse})`);
  g.addColorStop(1, 'rgba(255,70,50,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(x, y, 130, 70, 0, 0, TAU); c.fill();
}

/** Cielo de tormenta: velo oscuro, lluvia inclinada y relámpagos suaves. */
export function drawStorm(c: Ctx, clock: number, strength: number): void {
  if (strength <= 0) return;
  c.save();
  c.globalAlpha = strength;
  c.fillStyle = STORM_TINT;
  c.fillRect(0, 0, VW, VH);
  const f = clock % FLASH_PERIOD;
  if (f < FLASH_TIME) {
    c.fillStyle = `rgba(235,240,255,${FLASH_ALPHA * (1 - f / FLASH_TIME)})`;
    c.fillRect(0, 0, VW, VH);
  }
  c.strokeStyle = 'rgba(200,220,235,.45)';
  c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i < RAIN_DROPS; i++) {
    const y = (i * 131 + clock * RAIN_SPEED) % (VH + RAIN_LEN);
    const x = ((i * 173 - y * 0.3) % VW + VW) % VW;
    c.moveTo(x, y); c.lineTo(x - RAIN_SLANT, y + RAIN_LEN);
  }
  c.stroke();
  c.restore();
}
