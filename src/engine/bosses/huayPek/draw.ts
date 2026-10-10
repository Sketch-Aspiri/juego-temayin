import { GROUND, T, TAU, VW } from '../../constants';
import { type AtlasFrame, drawLazyFrame, footFrame } from '../../render/enemies/atlas';
import { outlined, star, type Ctx } from '../../render/drawUtils';
import { drawSpectralDog, type EyeLook } from './drawBody';
import { drawFog } from './fog';
import type { HuayPek, HuayPekState } from './index';
import { DEAD_TIME, FADE_TIME, WARN_TIME, WAVE_H, WAVE_W } from './tuning';

/**
 * Dibujo del Huay Pek con la hoja pintada `bosses/huayPek.webp`
 * (`imagenes/nuevos/jefes/huayPek.atlas.json`, rectángulos reales, mirando a la
 * derecha). Mientras carga se usa el perro procedural de `drawBody.ts`.
 * Orden: cuerpo → niebla → ojos y ondas (brillan a través de la niebla).
 */
const SHEET = 'bosses/huayPek.webp';

/** Cuadro de la hoja con la posición del ojo relativa al anclaje (px de la hoja). */
interface DogFrame {
  readonly f: AtlasFrame;
  readonly eyeX: number;
  readonly eyeY: number;
}
const ART = {
  prowl: { f: footFrame(11, 122, 485, 385), eyeX: 186, eyeY: -79 },
  leap: { f: footFrame(498, 169, 510, 317), eyeX: 172, eyeY: -163 },
  bark: { f: footFrame(1027, 152, 509, 358), eyeX: 106, eyeY: -212 },
  fade: { f: footFrame(43, 569, 460, 387), eyeX: 182, eyeY: -166 },
  dazed: { f: footFrame(539, 567, 479, 382), eyeX: 110, eyeY: -192 },
  rest: { f: footFrame(1033, 673, 476, 290), eyeX: 149, eyeY: -108 },
} as const satisfies Readonly<Record<string, DogFrame>>;
/** ~485 px de largo en la hoja → ~145 px en pantalla (caja de 110 × 80; cola y llamas sobresalen). */
const SHEET_SCALE = 0.3;
const FRAME: Readonly<Record<HuayPekState, DogFrame>> = {
  sleep: ART.rest, intro: ART.prowl, prowl: ART.prowl, growl: ART.prowl, bark: ART.bark,
  crouch: ART.prowl, leap: ART.leap, fade: ART.fade, hidden: ART.fade, warn: ART.fade,
  lunge: ART.leap, vulnerable: ART.dazed, hurt: ART.dazed, rising: ART.bark,
  dead: ART.rest, gone: ART.rest,
};
const EYES: Readonly<Record<HuayPekState, EyeLook>> = {
  sleep: 'closed', intro: 'open', prowl: 'open', growl: 'open', bark: 'open', crouch: 'open',
  leap: 'open', fade: 'closed', hidden: 'closed', warn: 'red', lunge: 'red',
  vulnerable: 'lit', hurt: 'lit', rising: 'open', dead: 'closed', gone: 'closed',
};
const TELEGRAPH: ReadonlySet<HuayPekState> = new Set(['growl', 'crouch', 'warn']);
/** Materialización máxima durante el aviso de reaparición. */
const WARN_ALPHA = 0.55;
const SHAKE_FREQ = 70;
const SHAKE_PX = 3;
const BLINK_FREQ = 14;
const CROUCH_SQUASH = 0.85;
const GLOW_R = 22;
const GLOW_PULSE = 9;
const GLOW_COL: Readonly<Record<'lit' | 'red' | 'open', string>> = {
  lit: '120,255,235',
  red: '255,80,80',
  open: '120,230,220',
};

function bodyAlpha(b: HuayPek): number {
  if (b.st === 'fade') return Math.max(0, 1 - b.t / FADE_TIME);
  if (b.st === 'warn') return Math.min(1, b.t / WARN_TIME[1]) * WARN_ALPHA;
  if (b.st === 'dead') return Math.max(0, Math.min(1, (DEAD_TIME - b.t) * 2));
  return 1;
}

/** Cuerpo (sprite o procedural) con el temblor, el parpadeo y la transparencia. */
function drawBody(c: Ctx, b: HuayPek, x: number): void {
  if (b.st === 'hidden') return;
  if (b.st === 'hurt' && Math.floor(b.t * BLINK_FREQ) % 2 === 0) return;
  c.save();
  c.globalAlpha = bodyAlpha(b);
  c.translate(x, b.y + b.h);
  if (TELEGRAPH.has(b.st)) c.translate(Math.sin(b.t * SHAKE_FREQ) * SHAKE_PX, 0);
  if (b.face < 0) c.scale(-1, 1);
  if (b.st === 'crouch') c.scale(1, CROUCH_SQUASH);
  if (!drawLazyFrame(c, SHEET, FRAME[b.st].f, SHEET_SCALE)) {
    const open = b.st === 'bark' || b.st === 'rising' ? 1 : 0;
    drawSpectralDog(c, b.clock, EYES[b.st], b.st === 'crouch' ? 1 : 0, open);
  }
  c.restore();
}

/** Brillo de los ojos encima de la niebla: turquesa al encenderse, rojo como aviso. */
function drawEyeGlow(c: Ctx, b: HuayPek, x: number): void {
  const look = EYES[b.st];
  if (look === 'closed') return;
  // Sin niebla, los ojos normales no necesitan halo; con niebla delatan al perro.
  if (look === 'open' && b.fog <= 0) return;
  const fr = FRAME[b.st];
  const ex = x + b.face * fr.eyeX * SHEET_SCALE;
  const ey = b.y + b.h + fr.eyeY * SHEET_SCALE;
  const r = GLOW_R + (look === 'lit' ? Math.sin(b.clock * GLOW_PULSE) * 4 : 0);
  const g = c.createRadialGradient(ex, ey, 0, ex, ey, r);
  g.addColorStop(0, `rgba(${GLOW_COL[look]},.95)`);
  g.addColorStop(1, `rgba(${GLOW_COL[look]},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(ex, ey, r, 0, TAU);
  c.fill();
}

/** Onda de choque del ladrido: arcos turquesa que recorren el suelo. */
function drawWave(c: Ctx, x: number, dir: 1 | -1, t: number): void {
  const base = GROUND * T;
  c.save();
  c.translate(x, base);
  c.scale(dir, 1);
  c.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    c.strokeStyle = `rgba(140,250,240,${(0.95 - i * 0.25).toFixed(2)})`;
    c.beginPath();
    c.ellipse(-i * 8, 0, WAVE_W / 2 + i * 4, WAVE_H - i * 6 + Math.sin(t * 20) * 2, 0, -Math.PI / 2, 0);
    c.stroke();
  }
  c.restore();
}

function drawStatusFx(c: Ctx, b: HuayPek, x: number): void {
  if (b.st === 'vulnerable') {
    for (let i = 0; i < 3; i++) {
      const a = b.t * 5 + i * 2.1;
      star(c, x + Math.cos(a) * 40, b.y - 30 + Math.sin(a) * 8, 8);
    }
  }
  if (TELEGRAPH.has(b.st)) {
    c.font = 'bold 40px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    outlined(c, '!', x, b.y - 40, '#ff5e5b', 6);
  }
}

export function drawHuayPek(c: Ctx, b: HuayPek, camX: number): void {
  if (b.st === 'gone') return;
  const x = b.x + b.w / 2 - camX;
  if (b.st === 'sleep' && (x < -300 || x > VW + 300)) return;
  drawBody(c, b, x);
  if (b.st !== 'sleep') {
    drawFog(c, {
      x0: b.left - T - camX,
      x1: b.right + T - camX,
      lightX: b.lightX - camX,
      lightY: b.lightY,
      fog: b.fog,
      clock: b.clock,
    });
  }
  drawEyeGlow(c, b, x);
  for (const w of b.waves) drawWave(c, w.x - camX, w.dir, w.t);
  drawStatusFx(c, b, x);
}
