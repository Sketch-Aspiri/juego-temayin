import { ARCH_FRACTIONS } from '../../bosses/huayChivo/tuning';
import { GROUND, T, TAU } from '../../constants';
import type { World } from '../../World';
import type { Ctx } from '../drawUtils';
import { drawScenerySprite } from '../scenerySprites';

/**
 * Atrio amarillo del convento de Izamal, arena del Huay Chivo. La pelea transcurre
 * mientras cae la noche: el cielo de la arena sigue la etapa del jefe (`Boss.stage`):
 *  1. resplandor de atardecer;
 *  2. velo azul y primeras estrellas;
 *  3. noche cerrada, luna y los vanos de los arcos en sombra.
 * Los arcos procedurales usan `ARCH_FRACTIONS`, los mismos puntos del teletransporte.
 * Rellenos planos: sin gradientes nuevos por fotograma.
 */

const FLOOR = GROUND * T;
const ARCH_RADIUS = 60;
const ARCADE_WIDTH_RATIO = 0.9;
const ARCADE_HEIGHT = 240;
const SIDES = [-1, 1] as const;
const CORNICE = 45;
const STAR_COUNT: Readonly<Record<number, number>> = { 1: 0, 2: 6, 3: 16 };
const STAR_FIELD = 200;
const TWINKLE = 900;
const MOON_X = 0.78;
const MOON_Y = 70;
const MOON_R = 24;
const ARCADE_VERTICAL_SCALE = 0.67;
const PYRAMID_STEPS = 5;
const PYRAMID_PARALLAX = 0.08;
/** Tinte del cielo y color de los vanos por etapa. */
const SKY: readonly string[] = ['rgba(255,150,70,.22)', 'rgba(40,62,130,.32)', 'rgba(8,14,38,.55)'];
const DAWN_SKY = 'rgba(255,232,174,.3)';
const VAULT: readonly string[] = ['#463e36', '#2f3040', '#121521'];
/** Velo nocturno sobre la arcada pintada (la fase 1 no lo necesita). */
const NIGHT_VEIL: readonly string[] = ['', 'rgba(30,45,100,.18)', 'rgba(6,10,30,.42)'];

const stageOf = (world: World): number => {
  const boss = world.boss;
  return boss && boss.hp <= 0 ? 0 : Math.max(1, Math.min(3, boss?.stage ?? 1));
};

function drawSky(c: Ctx, width: number, now: number, stage: number): void {
  c.fillStyle = stage === 0 ? DAWN_SKY : SKY[stage - 1];
  c.fillRect(0, 0, width, FLOOR);
  if (stage <= 1) {
    // Resplandor bajo del sol que se pone detrás del convento.
    c.fillStyle = 'rgba(255,196,96,.35)';
    c.beginPath(); c.ellipse(width / 2, FLOOR - ARCADE_HEIGHT, width * 0.45, 70, 0, Math.PI, TAU); c.fill();
    return;
  }
  c.fillStyle = '#fff6d8';
  const stars = STAR_COUNT[stage];
  for (let i = 0; i < stars; i++) {
    const x = ((i * 137) % 97) / 97 * width;
    const y = 12 + ((i * 59) % 89) / 89 * STAR_FIELD;
    c.globalAlpha = 0.55 + 0.45 * Math.sin(now / TWINKLE + i);
    c.fillRect(x, y, 2, 2);
  }
  c.globalAlpha = 1;
  if (stage < 3) return;
  c.fillStyle = '#f4f0d8';
  c.beginPath(); c.arc(width * MOON_X, MOON_Y, MOON_R, 0, TAU); c.fill();
  c.fillStyle = SKY[2];
  c.beginPath(); c.arc(width * MOON_X + MOON_R / 2, MOON_Y - 4, MOON_R * 0.85, 0, TAU); c.fill();
}

function drawProceduralArcade(c: Ctx, width: number, stage: number): void {
  const top = FLOOR - ARCADE_HEIGHT;
  c.fillStyle = '#b78425'; c.fillRect(0, top - CORNICE, width, CORNICE);
  c.fillStyle = '#ffe6a0'; c.fillRect(0, top - CORNICE - 5, width, 8);
  c.fillStyle = stage >= 2 ? '#b7a36e' : '#e4b644';
  c.fillRect(0, top, width, ARCADE_HEIGHT);
  for (const fraction of ARCH_FRACTIONS) {
    const x = width * fraction;
    c.fillStyle = VAULT[Math.max(0, stage - 1)];
    c.beginPath(); c.moveTo(x - ARCH_RADIUS, FLOOR);
    c.lineTo(x - ARCH_RADIUS, top + ARCH_RADIUS);
    c.arc(x, top + ARCH_RADIUS, ARCH_RADIUS, Math.PI, 0);
    c.lineTo(x + ARCH_RADIUS, FLOOR); c.fill();
    c.strokeStyle = '#fff0bb'; c.lineWidth = 10; c.stroke();
    c.fillStyle = '#f7d47d';
    for (const side of SIDES) c.fillRect(x + side * (ARCH_RADIUS + 9) - 8, top + ARCH_RADIUS, 16, FLOOR - top - ARCH_RADIUS);
  }
  c.fillStyle = '#fae7b6'; c.fillRect(0, FLOOR - 14, width, 14);
}

/** Volumen ancho y escalonado de Kinich Kak Moo, en un plano más lejano que el atrio. */
function drawPyramid(c: Ctx, width: number, world: World, stage: number): void {
  const center = width * 0.42 - (world.camX * PYRAMID_PARALLAX) % 80;
  c.fillStyle = stage >= 2 ? '#43556b' : '#ad9771';
  for (let i = 0; i < PYRAMID_STEPS; i++) {
    const w = 400 - i * 58;
    c.fillRect(center - w / 2, 240 - i * 22, w, 24);
  }
}

/** Sombras escénicas alargadas: no alteran el pavimento ni la geometría jugable. */
function drawArchShadows(c: Ctx, width: number, stage: number): void {
  c.fillStyle = stage >= 2 ? 'rgba(7,14,32,.35)' : 'rgba(69,42,15,.16)';
  for (const f of ARCH_FRACTIONS) {
    const x = width * f;
    c.beginPath(); c.moveTo(x - 50, FLOOR - 18); c.lineTo(x + 50, FLOOR - 18);
    c.lineTo(x + 110, FLOOR); c.lineTo(x - 20, FLOOR); c.fill();
  }
}

function drawPaintedArcade(c: Ctx, width: number, stage: number): boolean {
  c.save(); c.translate(0, FLOOR); c.scale(1, ARCADE_VERTICAL_SCALE);
  const id = stage === 3 ? 'arcadeNight' : 'arcade';
  const painted = drawScenerySprite(c, id, width / 2, 0, width * ARCADE_WIDTH_RATIO);
  if (painted && stage === 2) {
    c.globalAlpha = 0.5;
    drawScenerySprite(c, 'arcadeNight', width / 2, 0, width * ARCADE_WIDTH_RATIO);
  }
  c.restore();
  return painted;
}

export function drawAtrium(c: Ctx, width: number, now: number, world: World): void {
  const stage = stageOf(world);
  drawSky(c, width, now, stage);
  drawPyramid(c, width, world, stage);
  // El zócalo tapa el margen transparente bajo los vanos y asienta la arcada sobre el pavimento.
  c.fillStyle = '#493c2e';
  c.fillRect(width * (1 - ARCADE_WIDTH_RATIO) / 2, FLOOR - T, width * ARCADE_WIDTH_RATIO, T);
  if (!drawPaintedArcade(c, width, stage)) {
    drawProceduralArcade(c, width, stage);
  }
  if (stage >= 2) {
    c.fillStyle = NIGHT_VEIL[stage - 1];
    c.fillRect(0, FLOOR - ARCADE_HEIGHT - CORNICE, width, ARCADE_HEIGHT + CORNICE);
  }
  drawArchShadows(c, width, stage);
}
