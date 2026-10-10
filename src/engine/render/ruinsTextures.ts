import { T } from '../constants';
import { makeTile, type Ctx } from './drawUtils';

/**
 * Texturas del tema `ruins` (AGENTS.md §4.7): piedra caliza tallada de Edzná y
 * Hecelchakán, y el escombro de estuco de las plataformas que se derrumban.
 * El escombro es de relleno y estuco roto, nunca estelas ni glifos (§9).
 */

const LIME = '#d8cba8';
const LIME_SHADE = '#b9a67c';
const LIME_DARK = '#8c7a55';
const LIME_LIGHT = '#efe5c8';
const MOSS = '#5f8a3a';
const MOSS_LIGHT = '#8fbf5a';
const STUCCO_RED = '#b5543c';
const RUBBLE = '#a8987a';
const RUBBLE_DARK = '#6e6048';
/** Alto de la junta entre sillares (px). */
const JOINT = 2;
/** Alto de la franja de musgo en la cara superior del suelo (px). */
const MOSS_H = 7;

/** Sillares de caliza en dos hiladas desfasadas, con juntas y bordes iluminados. */
function ashlar(c: Ctx): void {
  c.fillStyle = LIME;
  c.fillRect(0, 0, T, T);
  c.fillStyle = LIME_DARK;
  c.fillRect(0, T / 2 - JOINT / 2, T, JOINT);
  c.fillRect(0, T - JOINT, T, JOINT);
  c.fillRect(T / 2, 0, JOINT, T / 2);
  c.fillRect(T / 4, T / 2, JOINT, T / 2);
  c.fillStyle = LIME_LIGHT;
  c.fillRect(0, 0, T, JOINT);
  c.fillRect(0, T / 2 + JOINT / 2, T, JOINT);
  c.fillStyle = LIME_SHADE;
  for (const [x, y] of [[6, 8], [28, 12], [12, 27], [33, 31], [22, 6]]) c.fillRect(x, y, 3, 2);
}

/** Suelo: sillares con musgo en la cara superior. */
function limestoneTop(c: Ctx): void {
  ashlar(c);
  c.fillStyle = MOSS;
  c.fillRect(0, 0, T, MOSS_H);
  c.fillStyle = MOSS_LIGHT;
  c.fillRect(0, 0, T, 2);
  c.fillStyle = MOSS;
  for (let x = 0; x < T; x += 8) {
    c.beginPath();
    c.moveTo(x, MOSS_H - 1);
    c.lineTo(x + 4, MOSS_H + 4);
    c.lineTo(x + 8, MOSS_H - 1);
    c.fill();
  }
}

/** Plataforma: bloque tallado con moldura y franja de estuco rojo (decoración arquitectónica). */
function carved(c: Ctx): void {
  c.fillStyle = LIME_DARK;
  c.fillRect(0, 0, T, T);
  c.fillStyle = LIME;
  c.fillRect(2, 2, T - 4, T - 4);
  c.fillStyle = LIME_LIGHT;
  c.fillRect(2, 2, T - 4, 4);
  c.fillStyle = STUCCO_RED;
  c.fillRect(2, T / 2 - 3, T - 4, 6);
  c.fillStyle = LIME_SHADE;
  // Moldura escalonada simple (no es un glifo).
  for (let i = 0; i < 4; i++) c.fillRect(4 + i * 9, T - 12 + (i % 2) * 3, 6, 3);
  c.fillStyle = 'rgba(0,0,0,.18)';
  c.fillRect(2, T - 5, T - 4, 3);
}

/** Escombro: relleno de piedras sueltas y estuco agrietado (se derrumba al pisarlo). */
function rubble(c: Ctx): void {
  c.fillStyle = RUBBLE_DARK;
  c.fillRect(0, 0, T, T);
  const stones: ReadonlyArray<readonly [number, number, number, number]> = [
    [1, 1, 16, 12], [18, 2, 20, 10], [2, 14, 12, 11], [15, 13, 13, 12], [29, 13, 10, 12], [1, 26, 18, 13], [20, 26, 19, 13],
  ];
  for (const [x, y, w, h] of stones) {
    c.fillStyle = RUBBLE;
    c.fillRect(x, y, w, h);
    c.fillStyle = LIME_LIGHT;
    c.fillRect(x, y, w, 2);
  }
  c.strokeStyle = RUBBLE_DARK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(6, 3);
  c.lineTo(10, 9);
  c.lineTo(8, 12);
  c.moveTo(30, 28);
  c.lineTo(26, 34);
  c.stroke();
}

export type RuinsTexId = 'limestone' | 'limestoneTop' | 'carved' | 'rubble';

/** Genera las texturas del tema `ruins` (requiere DOM). */
export function createRuinsTextures(): Readonly<Record<RuinsTexId, HTMLCanvasElement>> {
  return {
    limestone: makeTile(T, ashlar),
    limestoneTop: makeTile(T, limestoneTop),
    carved: makeTile(T, carved),
    rubble: makeTile(T, rubble),
  };
}
