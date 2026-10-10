import { T, TAU } from '../constants';
import { makeTile, roundRect, type Ctx } from './drawUtils';

/**
 * Texturas del Mundo 2 · Golfo de Campeche (AGENTS.md §4.7):
 *  - `fortress`: sillar de las murallas de Campeche (la madera de barco va en la cureña del cañón).
 *  - `mangrove`: lodo del manglar de Los Petenes y raíces de mangle rojo.
 *  - Cañón de baluarte (op `cannon`): culata sobre cureña y boca hacia cada lado.
 */
export type GulfTexId =
  | 'sillar' | 'sillarTop'
  | 'mud' | 'mudTop' | 'mangroveRoot'
  | 'cannonBreech' | 'cannonMuzzleR' | 'cannonMuzzleL';

/** Alto de cada hilada de sillares (dos por bloque). */
const COURSE = T / 2;
const SILLAR = '#d9c79c';
const SILLAR_DARK = '#a8946a';
const SILLAR_LIGHT = '#f1e4c2';
const MORTAR = '#8a7651';
const MUD = '#5b4630';
const MUD_DARK = '#3f2f1f';
const ROOT = '#7a4b2c';
const ROOT_DARK = '#4a2c18';
const IRON = '#2e3236';
const IRON_LIGHT = '#6b7378';
const IRON_DARK = '#15181b';

/** Sillares (piedra caliza tallada) en hiladas trabadas. */
function sillarBlocks(c: Ctx): void {
  c.fillStyle = MORTAR;
  c.fillRect(0, 0, T, T);
  for (let row = 0; row < 2; row++) {
    const y = row * COURSE;
    const offset = row % 2 ? T / 2 : 0;
    for (let x = -T / 2 + offset; x < T; x += T / 2 + T / 4) {
      c.fillStyle = SILLAR;
      c.fillRect(x + 1, y + 1, T / 2 + T / 4 - 2, COURSE - 2);
      c.fillStyle = SILLAR_LIGHT;
      c.fillRect(x + 1, y + 1, T / 2 + T / 4 - 2, 2);
      c.fillStyle = SILLAR_DARK;
      c.fillRect(x + 1, y + COURSE - 3, T / 2 + T / 4 - 2, 2);
    }
  }
  c.fillStyle = SILLAR_DARK;
  for (const [x, y] of [[7, 8], [26, 5], [14, 28], [33, 31]]) c.fillRect(x, y, 2, 2);
}

function mudBody(c: Ctx): void {
  c.fillStyle = MUD;
  c.fillRect(0, 0, T, T);
  c.fillStyle = MUD_DARK;
  for (const [x, y, r] of [[8, 10, 4], [28, 6, 3], [30, 26, 5], [12, 30, 3], [22, 18, 2]]) {
    c.beginPath();
    c.ellipse(x, y, r + 2, r, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = '#e9e2d0'; // conchita en el lodo
  c.fillRect(18, 34, 3, 2);
}

/** Lodo con una franja de pasto salado y raicillas de mangle encima. */
function mudTop(c: Ctx): void {
  mudBody(c);
  c.fillStyle = '#6f8a3a';
  c.fillRect(0, 0, T, 9);
  c.fillStyle = '#4f6a28';
  for (let x = 0; x < T; x += 6) c.fillRect(x, 8, 3, 4);
  c.fillStyle = '#a6c46a';
  c.fillRect(0, 0, T, 2);
  c.strokeStyle = ROOT;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(4, 12);
  c.quadraticCurveTo(10, 4, 16, 12);
  c.moveTo(24, 12);
  c.quadraticCurveTo(30, 2, 36, 12);
  c.stroke();
}

/** Maraña de raíces zancudas de mangle rojo (plataformas del manglar). */
function mangroveRoot(c: Ctx): void {
  c.fillStyle = ROOT_DARK;
  c.fillRect(0, 0, T, T);
  c.lineCap = 'round';
  const arches: ReadonlyArray<readonly [number, number, number]> = [[0, 20, 6], [14, 34, 2], [26, 44, 8], [-6, 12, 22]];
  for (const [x0, x1, top] of arches) {
    c.strokeStyle = ROOT_DARK;
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(x0, T);
    c.quadraticCurveTo((x0 + x1) / 2, top - 6, x1, T);
    c.stroke();
    c.strokeStyle = ROOT;
    c.lineWidth = 4;
    c.stroke();
  }
  c.fillStyle = '#4c7a2a';
  roundRect(c, 0, 0, T, 7, 3);
  c.fill();
  c.fillStyle = '#78a844';
  for (const x of [4, 15, 27, 35]) {
    c.beginPath();
    c.ellipse(x, 3, 4, 2, 0.3, 0, TAU);
    c.fill();
  }
}

/** Culata del cañón sobre su cureña de madera (mitad trasera del cañón). */
function cannonBreech(c: Ctx): void {
  c.fillStyle = '#6b4424';
  c.fillRect(2, 22, T - 4, 12);
  c.fillStyle = '#8c5e37';
  c.fillRect(2, 22, T - 4, 3);
  for (const x of [11, 29]) {
    c.fillStyle = IRON_DARK;
    c.beginPath();
    c.arc(x, 33, 7, 0, TAU);
    c.fill();
    c.fillStyle = '#7b5130';
    c.beginPath();
    c.arc(x, 33, 5, 0, TAU);
    c.fill();
    c.fillStyle = IRON_DARK;
    c.fillRect(x - 1, 32, 2, 2);
  }
  c.fillStyle = IRON;
  roundRect(c, 4, 4, T - 4, 20, 9);
  c.fill();
  c.fillStyle = IRON_LIGHT;
  c.fillRect(8, 7, T - 10, 3);
}

/** Boca del cañón mirando a la derecha (dir 1) o a la izquierda (dir -1). */
function cannonMuzzle(dir: 1 | -1): HTMLCanvasElement {
  return makeTile(T, (c) => {
    if (dir < 0) {
      c.translate(T, 0);
      c.scale(-1, 1);
    }
    c.fillStyle = IRON;
    c.fillRect(0, 6, T - 6, 16);
    c.fillStyle = IRON_LIGHT;
    c.fillRect(0, 8, T - 6, 3);
    c.fillStyle = IRON_DARK;
    c.fillRect(14, 5, 3, 18);
    c.fillStyle = IRON;
    roundRect(c, T - 9, 2, 9, 24, 3);
    c.fill();
    c.fillStyle = IRON_DARK;
    c.beginPath();
    c.ellipse(T - 3, 14, 2.5, 6, 0, 0, TAU);
    c.fill();
  });
}

/** Genera las texturas del Golfo de Campeche (requiere DOM). */
export function createGulfTextures(): Readonly<Record<GulfTexId, HTMLCanvasElement>> {
  return {
    sillar: makeTile(T, sillarBlocks),
    sillarTop: makeTile(T, (c) => {
      sillarBlocks(c);
      c.fillStyle = SILLAR_LIGHT;
      c.fillRect(0, 0, T, 5);
      c.fillStyle = MORTAR;
      c.fillRect(0, 5, T, 1);
    }),
    mud: makeTile(T, mudBody),
    mudTop: makeTile(T, mudTop),
    mangroveRoot: makeTile(T, mangroveRoot),
    cannonBreech: makeTile(T, cannonBreech),
    cannonMuzzleR: cannonMuzzle(1),
    cannonMuzzleL: cannonMuzzle(-1),
  };
}
