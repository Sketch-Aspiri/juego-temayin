import { GROUND, T, TAU } from '../../constants';
import { type Ctx, star } from '../../render/drawUtils';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';
import { drawChivoEffect } from '../../render/chivoEffects';
import type { HuayChivo } from './index';
import { type ChivoWave, type Wisp } from './hazards';
import { HORN_HEIGHT, HORN_REACH, STUCCO_LIFE, WAVE_H, WAVE_W, WISP_FADE, WISP_LIFE, WISP_SPAWN_TIME } from './tuning';

/**
 * Dibujo procedural de los peligros y avisos del Huay Chivo: fuegos fatuos, ondas del
 * pisotón, aviso del teletransporte, sombra del salto, estrellas del aturdimiento,
 * polvo del raspado y ojos. Solo lee el estado: nunca lo modifica. Sin gradientes por
 * fotograma: rellenos planos con transparencia.
 */

const FLOOR = GROUND * T;
const WISP_W = 22;
const WISP_H = 38;
const WISP_CORE = 7;
const WISP_HALO = 13;
const WISP_PULSE = 10;
/** Opacidad mientras nace (todavía inofensivo). */
const WISP_SPAWN_ALPHA = 0.45;
const WAVE_CREST = 1.8;
const WAVE_DUST = 3;
const SMOKE_PUFFS = 5;
const SMOKE_RISE = 26;
const SMOKE_SPEED = 3;
const SMOKE_RX = 22;
const SMOKE_RY = 14;
const EYE_GAP = 7;
const EYE_R = 3.5;
const EYE_GLOW_R = 7;
const EYE_OFFSETS = [-EYE_GAP, EYE_GAP] as const;
const SHADOW_RX = 46;
const SHADOW_RY = 9;
const SHADOW_MIN = 0.35;
const STAR_COUNT = 3;
const STAR_RX = 26;
const STAR_RY = 8;
const STAR_SPIN = 6;
const STAR_SIZE = 7;
const DUST_PUFFS = 3;
const DUST_SPEED = 9;
const DUST_R = 9;
const CALL_RING = 52;
const CALL_PULSE = 8;
const SMOKE_FRAMES = ['smoke0', 'smoke1', 'smoke2'] as const;
const SMOKE_FRAME_TIME = 0.22;
const STUCCO_WIDTH = 10;
const STUCCO_HEIGHT = 14;

/** Colores de los ojos: rojo para la embestida, verde al invocar fuegos fatuos. */
export const EYE_RED = '#ff3b2f';
export const EYE_GREEN = '#7dffa6';

const wispAlpha = (w: Wisp): number => {
  if (w.age < WISP_SPAWN_TIME) return WISP_SPAWN_ALPHA;
  const left = WISP_LIFE - w.age;
  return left < WISP_FADE ? Math.max(0, left / WISP_FADE) : 1;
};

export function drawWisps(c: Ctx, wisps: readonly Wisp[], camX: number): void {
  for (const w of wisps) {
    c.save();
    c.globalAlpha = wispAlpha(w);
    if (!drawNewGameplaySprite(c, 'wisp', w.x - camX, w.y, WISP_W, WISP_H)) {
      const pulse = Math.sin(w.age * WISP_PULSE);
      c.fillStyle = 'rgba(81,216,129,.35)';
      c.beginPath(); c.arc(w.x - camX, w.y, WISP_HALO + pulse, 0, TAU); c.fill();
      c.fillStyle = '#c4ffcf';
      c.beginPath(); c.arc(w.x - camX, w.y, WISP_CORE + pulse / 2, 0, TAU); c.fill();
    }
    c.restore();
  }
}

/** Ondas de polvo dorado a ras de suelo, del tamaño de su colisión. */
export function drawWaves(c: Ctx, waves: readonly ChivoWave[], camX: number): void {
  for (const w of waves) {
    if (w.delay > 0) continue;
    const x = w.x - WAVE_W / 2 - camX;
    if (drawChivoEffect(c, 'wave', x, FLOOR - WAVE_H, WAVE_W, WAVE_H)) continue;
    c.fillStyle = 'rgba(233,196,106,.85)';
    c.beginPath(); c.moveTo(x, FLOOR);
    c.quadraticCurveTo(x + WAVE_W / 2, FLOOR - WAVE_H * WAVE_CREST, x + WAVE_W, FLOOR); c.fill();
    c.fillStyle = 'rgba(255,240,190,.7)';
    for (let i = 0; i < WAVE_DUST; i++) {
      c.beginPath(); c.arc(x + (i + 0.5) * (WAVE_W / WAVE_DUST), FLOOR - WAVE_H / 3 - i * 3, 3, 0, TAU); c.fill();
    }
  }
}

/** Ojos brillantes con un halo plano. */
export function drawEyes(c: Ctx, x: number, y: number, color: string): void {
  c.fillStyle = color === EYE_GREEN ? 'rgba(125,255,166,.3)' : 'rgba(255,59,47,.3)';
  for (const dx of EYE_OFFSETS) {
    c.beginPath(); c.arc(x + dx, y, EYE_GLOW_R, 0, TAU); c.fill();
  }
  c.fillStyle = color;
  for (const dx of EYE_OFFSETS) {
    c.beginPath(); c.arc(x + dx, y, EYE_R, 0, TAU); c.fill();
  }
}

/**
 * Aviso del teletransporte en el arco de destino: columna de humo dorado que crece y
 * dos ojos brillantes a la altura de la cabeza. `cx` en px de mundo.
 */
export function drawBlinkWarning(c: Ctx, cx: number, eyeRise: number, t: number, camX: number, eyes = true, eyeOffset = 0): void {
  c.save();
  c.translate(cx - camX, FLOOR);
  const frame = SMOKE_FRAMES[Math.floor(t / SMOKE_FRAME_TIME) % SMOKE_FRAMES.length];
  const painted = drawChivoEffect(c, frame, -54, -140, 108, 140);
  for (let i = 0; !painted && i < SMOKE_PUFFS; i++) {
    const y = -((i * SMOKE_RISE + t * SMOKE_RISE * SMOKE_SPEED) % (SMOKE_PUFFS * SMOKE_RISE));
    c.fillStyle = i % 2 ? 'rgba(255,214,110,.4)' : 'rgba(240,190,80,.3)';
    c.beginPath(); c.ellipse(Math.sin(t * SMOKE_SPEED + i) * 6, y, SMOKE_RX, SMOKE_RY, 0, 0, TAU); c.fill();
  }
  if (eyes) drawEyes(c, eyeOffset, -eyeRise, EYE_RED);
  c.restore();
}

/** Se ven caer restos sueltos, siempre decorativos: no se desprenden bloques del monumento. */
export function drawStucco(c: Ctx, pieces: HuayChivo['stucco'], camX: number): void {
  for (const p of pieces) {
    c.save(); c.globalAlpha = 1 - p.t / STUCCO_LIFE;
    if (!drawChivoEffect(c, 'stucco', p.x - camX, p.y, STUCCO_WIDTH, STUCCO_HEIGHT)) {
      c.fillStyle = '#f4dfa6'; c.fillRect(p.x - camX, p.y, STUCCO_WIDTH, STUCCO_HEIGHT);
    }
    c.restore();
  }
}

/** El arco punteado avisa el alcance exacto, siempre delante de la orientación fijada. */
export function drawHornCue(c: Ctx, b: HuayChivo, camX: number): void {
  const edge = b.x + (b.face > 0 ? b.w : 0) - camX;
  c.strokeStyle = b.st === 'rear' ? '#ffe79d' : '#7dffa6'; c.lineWidth = 3;
  c.setLineDash(b.st === 'rear' ? HORN_DASH : SOLID_LINE);
  c.beginPath(); c.moveTo(edge, FLOOR - HORN_HEIGHT);
  c.quadraticCurveTo(edge + b.face * HORN_REACH, FLOOR - HORN_HEIGHT, edge + b.face * HORN_REACH, FLOOR - 4);
  c.stroke(); c.setLineDash(SOLID_LINE);
}
const HORN_DASH = [6, 5];
const SOLID_LINE: number[] = [];

/** Sombra en el punto de aterrizaje: crece a medida que el jefe baja (`k` de 0 a 1). */
export function drawLeapShadow(c: Ctx, cx: number, k: number, camX: number): void {
  const s = SHADOW_MIN + (1 - SHADOW_MIN) * Math.max(0, Math.min(1, k));
  c.fillStyle = `rgba(30,18,10,${0.2 + 0.35 * s})`;
  c.beginPath(); c.ellipse(cx - camX, FLOOR, SHADOW_RX * s, SHADOW_RY * s, 0, 0, TAU); c.fill();
}

/** Tres estrellas que giran sobre la cabeza mientras está aturdido. */
export function drawDazedStars(c: Ctx, cx: number, y: number, clock: number): void {
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = clock * STAR_SPIN + (i * TAU) / STAR_COUNT;
    star(c, cx + Math.cos(a) * STAR_RX, y + Math.sin(a) * STAR_RY, STAR_SIZE);
  }
}

/** Polvo que levanta al raspar el suelo con la pezuña antes de embestir. */
export function drawPawDust(c: Ctx, x: number, face: number, t: number): void {
  for (let i = 0; i < DUST_PUFFS; i++) {
    const k = (t * DUST_SPEED / DUST_PUFFS + i / DUST_PUFFS) % 1;
    c.fillStyle = `rgba(214,180,120,${0.6 * (1 - k)})`;
    c.beginPath(); c.arc(x - face * k * 30, FLOOR - 4 - k * 18, DUST_R * (0.5 + k), 0, TAU); c.fill();
  }
}

/** Anillo verde que late mientras invoca los fuegos fatuos. */
export function drawCallGlow(c: Ctx, cx: number, cy: number, t: number): void {
  c.strokeStyle = 'rgba(125,255,166,.55)';
  c.lineWidth = 3;
  c.beginPath(); c.arc(cx, cy, CALL_RING + Math.sin(t * CALL_PULSE) * 4, 0, TAU); c.stroke();
}
