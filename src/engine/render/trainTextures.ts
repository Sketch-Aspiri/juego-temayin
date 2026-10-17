import { T } from '../constants';
import { makeTile, type Ctx } from './drawUtils';

/**
 * Texturas del tren en marcha (6-2 Tulum Aeropuerto, AGENTS.md §4.3):
 *  - `trainRoof`: chapa del techo del vagón, con costuras y remaches.
 *  - `trainSide`: costado del vagón con franja de color y ventanilla.
 */
export type TrainTexId = 'trainRoof' | 'trainSide';
export type ShipTexId = 'shipDeck' | 'shipHull';

const ROOF = '#8d9aa3';
const ROOF_LIGHT = '#c4ced4';
const ROOF_DARK = '#59646c';
const BODY = '#c8452f';
const BODY_DARK = '#8f2c1e';
const STRIPE = '#f2c14e';
const GLASS = '#7fc8e8';

/** Chapa con una costura central y remaches; la arista clara marca la superficie pisable. */
function roof(c: Ctx): void {
  c.fillStyle = ROOF;
  c.fillRect(0, 0, T, T);
  c.fillStyle = ROOF_LIGHT;
  c.fillRect(0, 0, T, 4);
  c.fillStyle = ROOF_DARK;
  c.fillRect(0, T / 2, T, 2);
  c.fillRect(0, T - 3, T, 3);
  for (const [x, y] of [[5, 10], [T - 8, 10], [5, T - 12], [T - 8, T - 12]]) c.fillRect(x, y, 3, 3);
}

/** Costado rojo con franja dorada y ventanilla. */
function side(c: Ctx): void {
  c.fillStyle = BODY;
  c.fillRect(0, 0, T, T);
  c.fillStyle = BODY_DARK;
  c.fillRect(0, T - 4, T, 4);
  c.fillStyle = STRIPE;
  c.fillRect(0, 4, T, 4);
  c.fillStyle = GLASS;
  c.fillRect(8, 14, T - 16, 14);
  c.fillStyle = BODY_DARK;
  c.fillRect(T / 2 - 1, 14, 2, 14);
}

/** Genera las texturas del tren (requiere DOM). */
export function createTrainTextures(): Readonly<Record<TrainTexId | ShipTexId, HTMLCanvasElement>> {
  return { trainRoof: makeTile(T, roof), trainSide: makeTile(T, side),
    shipDeck: makeTile(T, deck), shipHull: makeTile(T, hull) };
}

/** Respaldo de tablones: el borde claro coincide con la superficie sólida. */
function deck(c: Ctx): void {
  c.fillStyle = '#684021'; c.fillRect(0, 0, T, T);
  c.fillStyle = '#c89752'; c.fillRect(0, 0, T, 3);
  c.fillStyle = '#362615'; c.fillRect(0, T / 2, T, 2);
}

function hull(c: Ctx): void {
  deck(c);
  c.fillStyle = '#432817'; c.fillRect(0, 0, 7, T);
  c.fillStyle = '#c89752'; c.fillRect(0, 8, 7, 3);
}
