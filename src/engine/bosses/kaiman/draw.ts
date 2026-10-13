import { GROUND, T, TAU, VW } from '../../constants';
import { type AtlasFrame, drawLazyFrame, footFrame } from '../../render/enemies/atlas';
import { outlined, star, type Ctx } from '../../render/drawUtils';
import type { Kaiman, KaimanState } from './index';
import { drawCrocodile, drawEyesAtSurface } from './drawBody';
import { DEAD_TIME, DIVE_TIME, ENRAGE_TIME, KAIMAN_H, RISE_TIME, WAVE_H, WAVE_W } from './tuning';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';
import { NEW_GAMEPLAY_SPRITES } from '../../../data/newGameplaySprites';
import { KAIMAN_REST_FRAME, KAIMAN_REST_NEIGHBOR } from '../../../data/kaimanArt';
import { drawFrenzyAura, drawMud, drawPropagules, drawStorm } from './drawHazards';

/**
 * Dibujo del Kaimán Moreleti con la hoja pintada `bosses/kaiman.webp`
 * (`imagenes/nuevos/jefes/kaiman.atlas.json`, rectángulos reales, mirando a la
 * derecha). Mientras carga se usa el dibujo procedural.
 */
const KAIMAN_SHEET = 'bosses/kaiman.webp';
const ART = {
  rest: footFrame(...KAIMAN_REST_FRAME),
  charge: footFrame(522, 207, 520, 253),
  tail: footFrame(1056, 111, 470, 381),
  dive: footFrame(13, 616, 495, 308),
  exposed: footFrame(524, 648, 490, 278),
  dead: footFrame(1038, 656, 491, 270),
} as const satisfies Readonly<Record<string, AtlasFrame>>;
/** ~517 px de largo en la hoja → ~200 px en pantalla (caja de 170 × 62; cola y hocico sobresalen). */
const SHEET_SCALE = 0.38;
const ATTACK_POSE_WIDTH = 200;
/** La pose estirada tiene más cola: mantiene el tamaño del hocico y del torso. */
const SPIT_POSE_WIDTH = 240;
const SPIT_RECOIL_TIME = 0.3;
const SPIT_RECOIL_PX = 7;
const SLAM_SWING_TIME = 0.35;
const SLAM_SWING_ANGLE = 0.08;
const STATUS_GAP = 26;
const SHEET_FRAME: Readonly<Partial<Record<KaimanState, AtlasFrame>>> = {
  intro: ART.rest, walk: ART.rest, hurt: ART.rest, rising: ART.charge, enrage: ART.charge,
  gape: ART.charge, bite: ART.charge, pant: ART.charge, spitPrep: ART.charge, spit: ART.charge,
  tailPrep: ART.tail, tail: ART.tail, slamPrep: ART.tail, slam: ART.tail,
  dive: ART.dive, emerge: ART.exposed, exposed: ART.exposed,
  dead: ART.dead,
};

const TELEGRAPH: ReadonlySet<KaimanState> = new Set(['gape', 'tailPrep', 'spitPrep', 'slamPrep', 'rising', 'enrage']);
const ALERT: Readonly<Partial<Record<KaimanState, string>>> = {
  gape: '¡MORDIDA!', tailPrep: '¡OLA!', spitPrep: '¡LODO!', slamPrep: '¡MANGLE!', warn: '¡APÁRTATE!',
};
const SHAKE_FREQ = 70;
const SHAKE_PX = 4;
const BLINK_FREQ = 14;
const RIPPLES = 3;
const RIPPLE_CYCLE = 0.9;
const WARN_BUBBLES = 7;

/** Sprite de la hoja si está activada y cargada; si no, `false` para usar el respaldo. */
function drawSheet(c: Ctx, b: Kaiman): boolean {
  if (b.st === 'spitPrep' || b.st === 'spit') return drawNewGameplaySprite(c, 'kaimanSpit', 0, 0, SPIT_POSE_WIDTH);
  if (b.st === 'slamPrep' || b.st === 'slam') return drawNewGameplaySprite(c, 'kaimanSlam', 0, 0, ATTACK_POSE_WIDTH);
  const fr = SHEET_FRAME[b.st];
  if (!fr) return false;
  c.save();
  if (fr === ART.rest) {
    const [x, y, w, h] = KAIMAN_REST_NEIGHBOR;
    c.beginPath(); c.rect(-VW, -VW, 2 * VW, 2 * VW);
    c.rect((x - fr.ax) * SHEET_SCALE, (y - fr.ay) * SHEET_SCALE, w * SHEET_SCALE, h * SHEET_SCALE);
    c.clip('evenodd');
  }
  const painted = drawLazyFrame(c, KAIMAN_SHEET, fr, SHEET_SCALE);
  c.restore();
  return painted;
}

/** Los avisos quedan por encima de la silueta pintada, que sobresale de la caja física. */
function poseTop(b: Kaiman): number {
  const pose = b.st === 'spitPrep' || b.st === 'spit' ? NEW_GAMEPLAY_SPRITES.kaimanSpit
    : b.st === 'slamPrep' || b.st === 'slam' ? NEW_GAMEPLAY_SPRITES.kaimanSlam : null;
  const width = pose === NEW_GAMEPLAY_SPRITES.kaimanSpit ? SPIT_POSE_WIDTH : ATTACK_POSE_WIDTH;
  const height = pose ? pose.frame[3] * width / pose.frame[2]
    : (SHEET_FRAME[b.st]?.h ?? KAIMAN_H / SHEET_SCALE) * SHEET_SCALE;
  return b.y + b.h - height;
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
  if (drawNewGameplaySprite(c, 'waterWave', 0, GROUND * T, r.w, r.h)) {
    c.restore();
    return;
  }
  c.fillStyle = 'rgba(64,170,170,.85)';
  c.strokeStyle = '#e8fff6';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-r.w / 2, GROUND * T);
  c.quadraticCurveTo(-r.w / 4, top, r.w / 4, top);
  c.quadraticCurveTo(r.w / 4 + 3, top + 14, r.w / 8, top + 10);
  c.quadraticCurveTo(r.w * 0.4, GROUND * T - 8, r.w / 2, GROUND * T);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

function drawStatusFx(c: Ctx, b: Kaiman, x: number): void {
  c.save();
  if (b.st === 'exposed') {
    const y = poseTop(b);
    for (let i = 0; i < 3; i++) {
      const a = b.t * 5 + i * 2.1;
      star(c, x + Math.cos(a) * 50, y - 8 + Math.sin(a) * 10, 9);
    }
    c.font = 'bold 17px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    outlined(c, '¡PISA EL LOMO!', x, y - STATUS_GAP, '#ffe29a', 4);
    c.strokeStyle = '#ffe29a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 6, y - 14); c.lineTo(x, y - 7); c.lineTo(x + 6, y - 14); c.stroke();
  }
  const alert = ALERT[b.st];
  if (alert) {
    c.font = 'bold 19px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    const y = b.st === 'warn' ? b.surfY - 68 : poseTop(b) - STATUS_GAP;
    outlined(c, alert, x, y, b.st === 'slamPrep' ? '#ffe29a' : '#ffba91', 5);
  }
  c.restore();
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
  if (b.st === 'spit') c.translate(-Math.sin(Math.min(1, b.t / SPIT_RECOIL_TIME) * Math.PI) * SPIT_RECOIL_PX, 0);
  if (b.st === 'slam') c.rotate(-Math.sin(Math.min(1, b.t / SLAM_SWING_TIME) * Math.PI) * SLAM_SWING_ANGLE);
  if (!drawSheet(c, b)) {
    const roarTime = b.st === 'enrage' ? ENRAGE_TIME : RISE_TIME;
    const roar = b.st === 'rising' || b.st === 'enrage' ? Math.min(1, b.t / (roarTime / 4)) : 0;
    drawCrocodile(c, b.st, b.clock, b.t, roar);
  }
  c.restore();
}

export function drawKaiman(c: Ctx, b: Kaiman, camX: number): void {
  if (b.phase === 3 && b.st !== 'gone') drawStorm(c, b.clock, b.st === 'dead' ? Math.max(0, 1 - b.t / DEAD_TIME) : 1);
  for (const w of b.waves) if (!w.wait || w.wait <= 0) drawWave(c, w.x - camX, w.dir, w.t);
  drawPropagules(c, b.propagules, camX, b.clock);
  drawMud(c, b.mud, camX);
  if (b.st === 'gone') return;
  const x = b.x + b.w / 2 - camX;
  if (x < -300 || x > VW + 300) return;
  if (b.underwater) {
    if (b.st === 'submerged') drawEyesAtSurface(c, x, b.surfY, b.face, b.clock);
    drawRipples(c, x, b.surfY, b.clock, b.st === 'warn');
  } else {
    if (b.phase === 3 && b.st !== 'dead') drawFrenzyAura(c, x, b.y + b.h / 2, b.clock);
    drawBody(c, b, x);
  }
  drawStatusFx(c, b, x);
}
