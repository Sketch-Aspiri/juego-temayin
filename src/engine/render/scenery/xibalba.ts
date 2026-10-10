import { VH, VW } from '../../constants';
import type { Scenery } from '../backgrounds';
import { hash, layer, type Ctx } from '../drawUtils';
import { paintedScenery } from './painted';

/**
 * Escenario `xibalba` (AGENTS.md §4.7): el inframundo del Popol Vuh como caverna
 * negra y roja, con cascadas de brasa, columnas de roca y bancos de niebla.
 * El fondo pintado (`xibalba.webp`) manda; esto es el respaldo procedural.
 */

const wrap = (v: number, period: number): number => ((v % period) + period) % period;

const FAR_ROCK = '#2a1214';
const MID_ROCK = '#1c0c0e';
const NEAR_ROCK = '#120809';
const GLOW_TOP = 'rgba(255,110,50,.55)';
const GLOW_BOTTOM = 'rgba(255,110,50,0)';
const FALL_COLOR = 'rgba(255,120,60,.7)';
const MIST = 'rgba(150,110,120,.16)';
/** Separación de las cascadas de brasa del fondo (px de pantalla). */
const FALL_SPACING = 300;
const FALL_W = 10;
const MIST_BANDS = 3;
const MIST_SPEED = 12;

/** Resplandor rojo en el horizonte de la caverna. */
function glow(c: Ctx): void {
  const g = c.createLinearGradient(0, VH * 0.35, 0, VH * 0.75);
  g.addColorStop(0, GLOW_BOTTOM);
  g.addColorStop(0.5, GLOW_TOP);
  g.addColorStop(1, GLOW_BOTTOM);
  c.fillStyle = g;
  c.fillRect(0, VH * 0.35, VW, VH * 0.4);
}

/** Hilos verticales de brasa que caen de los riscos lejanos. */
function embers(c: Ctx, cam: number): void {
  c.fillStyle = FALL_COLOR;
  for (let i = -1; i < 5; i++) {
    const off = cam * 0.2;
    const n = Math.floor(off / FALL_SPACING) + i;
    if (hash(n + 7) < 0.4) continue;
    const x = n * FALL_SPACING - off + hash(n) * 120;
    c.fillRect(x, 120 + hash(n + 2) * 80, FALL_W * (0.5 + hash(n + 3)), 260);
  }
}

/** Niebla que se arrastra despacio a ras de suelo. */
function mist(c: Ctx, cam: number, t: number): void {
  c.fillStyle = MIST;
  for (let i = 0; i < MIST_BANDS; i++) {
    const x = wrap(i * 420 - cam * 0.4 + t * MIST_SPEED, VW + 600) - 300;
    c.beginPath();
    c.ellipse(x, 430 + i * 30, 320, 34, 0, 0, Math.PI * 2);
    c.fill();
  }
}

const xibalbaProcedural: Scenery = (c, cam, now) => {
  glow(c);
  layer(c, cam * 0.1, 360, 150, FAR_ROCK, 0.005, 5);
  embers(c, cam);
  layer(c, cam * 0.3, 430, 110, MID_ROCK, 0.008, 7);
  mist(c, cam, now / 1000);
  layer(c, cam * 0.55, 480, 50, NEAR_ROCK, 0.012, 9);
};

/** Escenario `xibalba` con el fondo pintado y el procedural de respaldo. */
export const xibalbaScenery: Scenery = paintedScenery('xibalba.webp', xibalbaProcedural, { nearTop: 0.7 });
