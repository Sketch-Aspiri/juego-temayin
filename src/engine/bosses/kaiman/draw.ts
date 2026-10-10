import { GROUND, T, TAU, VW } from '../../constants';
import { lazyImage } from '../../render/artCache';
import { outlined, star, type Ctx } from '../../render/drawUtils';
import type { Kaiman, KaimanState } from './index';
import { drawCrocodile, drawEyesAtSurface } from './drawBody';
import { DEAD_TIME, DIVE_TIME, KAIMAN_H, RISE_TIME, WAVE_H, WAVE_W } from './tuning';

/**
 * Dibujo del Kaimán Moreleti. Procedural por defecto; preparado para la hoja de
 * sprites de `imagenes/nuevos/jefes/kaiman.prompt.txt` (3 columnas × 2 filas:
 * alerta, carrera con fauces abiertas, coletazo / preparándose para sumergirse,
 * lomo expuesto, derrotado). Para activarla, exporta la hoja a
 * `public/assets/jefes/kaiman.webp` y pon aquí su ruta: si no carga, se usa el
 * dibujo procedural.
 */
export const KAIMAN_SHEET: string | null = null;
const SHEET_COLS = 3;
const SHEET_ROWS = 2;
/** Ancho en pantalla de un fotograma de la hoja (px). */
const SPRITE_W = 260;
const SHEET_FRAME: Readonly<Partial<Record<KaimanState, number>>> = {
  intro: 0, walk: 0, hurt: 0, rising: 1,
  gape: 1, bite: 1, pant: 1,
  tailPrep: 2, tail: 2,
  dive: 3, emerge: 4, exposed: 4,
  dead: 5,
};

const TELEGRAPH: ReadonlySet<KaimanState> = new Set(['gape', 'tailPrep', 'rising']);
const SHAKE_FREQ = 70;
const SHAKE_PX = 4;
const BLINK_FREQ = 14;
const RIPPLES = 3;
const RIPPLE_CYCLE = 0.9;
const WARN_BUBBLES = 7;

/** Sprite de la hoja si está activada y cargada; si no, `false` para usar el respaldo. */
function drawSheet(c: Ctx, b: Kaiman): boolean {
  if (!KAIMAN_SHEET) return false;
  const img = lazyImage(KAIMAN_SHEET);
  const fr = SHEET_FRAME[b.st];
  if (!img || fr === undefined) return false;
  const cw = img.naturalWidth / SHEET_COLS;
  const ch = img.naturalHeight / SHEET_ROWS;
  const scale = SPRITE_W / cw;
  const sx = (fr % SHEET_COLS) * cw;
  const sy = Math.floor(fr / SHEET_COLS) * ch;
  // Celdas con ~12 % de margen: el suelo del personaje queda al 88 % de la celda.
  c.drawImage(img, sx, sy, cw, ch, (-cw * scale) / 2, -ch * scale * 0.88, cw * scale, ch * scale);
  return true;
}

/** Ondas concéntricas en la superficie y burbujas que delatan al cocodrilo sumergido. */
function drawRipples(c: Ctx, x: number, y: number, t: number, warn: boolean): void {
  c.strokeStyle = warn ? 'rgba(255,240,200,.9)' : 'rgba(220,250,230,.7)';
  c.lineWidth = 2;
  for (let i = 0; i < RIPPLES; i++) {
    const k = ((t / RIPPLE_CYCLE + i / RIPPLES) % 1 + 1) % 1;
    c.globalAlpha = 1 - k;
    c.beginPath();
    c.ellipse(x, y, 20 + k * (warn ? 90 : 60), 4 + k * 8, 0, 0, TAU);
    c.stroke();
  }
  c.globalAlpha = 1;
  if (!warn) return;
  c.strokeStyle = 'rgba(235,255,245,.95)';
  for (let i = 0; i < WARN_BUBBLES; i++) {
    const rise = ((t * 2.2 + i / WARN_BUBBLES) % 1) * 46;
    c.beginPath();
    c.arc(x - 60 + i * 20 + Math.sin(t * 9 + i) * 4, y - rise, 3 + (i % 3), 0, TAU);
    c.stroke();
  }
}

/** Ola del coletazo: cresta de agua turquesa con espuma. */
function drawWave(c: Ctx, x: number, dir: 1 | -1, t: number): void {
  const r = { w: WAVE_W, h: WAVE_H };
  const top = GROUND * T - r.h + Math.sin(t * 18) * 2;
  c.save();
  c.translate(x, 0);
  c.scale(dir, 1);
  c.fillStyle = 'rgba(64,170,170,.85)';
  c.strokeStyle = '#e8fff6';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-r.w, GROUND * T);
  c.quadraticCurveTo(-r.w / 2, top - 6, r.w / 2, top);
  c.quadraticCurveTo(r.w / 2 + 6, top + 14, r.w / 4, top + 10);
  c.quadraticCurveTo(r.w * 0.8, GROUND * T - 8, r.w, GROUND * T);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

function drawStatusFx(c: Ctx, b: Kaiman, x: number): void {
  if (b.st === 'exposed') {
    for (let i = 0; i < 3; i++) {
      const a = b.t * 5 + i * 2.1;
      star(c, x + Math.cos(a) * 50, b.y - 22 + Math.sin(a) * 10, 9);
    }
  }
  if (b.st === 'gape' || b.st === 'tailPrep' || b.st === 'warn') {
    c.font = 'bold 40px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    const y = b.st === 'warn' ? b.surfY - 60 : b.y - 30;
    outlined(c, '!', x, y, '#ff5e5b', 6);
  }
}

/** Cuerpo del cocodrilo (sprite o procedural) con el temblor, el parpadeo y la inmersión. */
function drawBody(c: Ctx, b: Kaiman, x: number): void {
  if (b.st === 'hurt' && Math.floor(b.t * BLINK_FREQ) % 2 === 0) return;
  c.save();
  c.translate(x, b.y + b.h);
  if (TELEGRAPH.has(b.st)) c.translate(Math.sin(b.t * SHAKE_FREQ) * SHAKE_PX, 0);
  if (b.st === 'dive') {
    // Se hunde en el lodo: solo se ve lo que queda por encima de la superficie.
    const sink = Math.min(1, b.t / DIVE_TIME) * KAIMAN_H;
    const cut = b.surfY - (b.y + b.h);
    c.beginPath();
    c.rect(-VW, -VW, 2 * VW, VW + cut);
    c.clip();
    c.translate(0, sink);
  }
  if (b.st === 'dead') c.globalAlpha = Math.max(0, Math.min(1, (DEAD_TIME - b.t) * 2));
  if (b.face < 0) c.scale(-1, 1);
  if (b.st === 'emerge') c.rotate(-0.18);
  if (!drawSheet(c, b)) {
    const roar = b.st === 'rising' ? Math.min(1, b.t / (RISE_TIME / 4)) : 0;
    drawCrocodile(c, b.st, b.clock, b.t, roar);
  }
  c.restore();
}

export function drawKaiman(c: Ctx, b: Kaiman, camX: number): void {
  for (const w of b.waves) drawWave(c, w.x - camX, w.dir, w.t);
  if (b.st === 'gone') return;
  const x = b.x + b.w / 2 - camX;
  if (x < -300 || x > VW + 300) return;
  if (b.underwater) {
    if (b.st === 'submerged') drawEyesAtSurface(c, x, b.surfY, b.face, b.clock);
    drawRipples(c, x, b.surfY, b.clock, b.st === 'warn');
  } else drawBody(c, b, x);
  drawStatusFx(c, b, x);
}
