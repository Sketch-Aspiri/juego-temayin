import { T } from '../constants';
import { makeTile, type Ctx } from './drawUtils';

type MayaTextureId = 'brick' | 'question' | 'used' | 'pipeTL' | 'pipeTR' | 'pipeBL' | 'pipeBR';
const STONE = '#d4bf8c';
const STONE_LIGHT = '#f3e4b5';
const STONE_SHADOW = '#665d42';
const JADE = '#238374';
const JADE_DARK = '#174e48';

/** Los respaldos comparten la identidad del arte aunque todavía no haya cargado. */
export function createMayaTextures(): Readonly<Record<MayaTextureId, HTMLCanvasElement>> {
  return {
    brick: makeTile(T, drawCrackedStone),
    question: makeTile(T, c => drawCoffer(c, false)),
    used: makeTile(T, c => drawCoffer(c, true)),
    pipeTL: columnTile(true, true), pipeTR: columnTile(true, false),
    pipeBL: columnTile(false, true), pipeBR: columnTile(false, false),
  };
}

function stoneFace(c: Ctx, width = T): void {
  c.fillStyle = STONE_SHADOW; c.fillRect(0, 0, width, T);
  c.fillStyle = STONE; c.fillRect(2, 2, width - 4, T - 4);
  c.fillStyle = STONE_LIGHT; c.fillRect(2, 2, width - 4, 3);
  c.fillStyle = '#b09b6c'; c.fillRect(2, T - 5, width - 4, 3);
}

function drawCoffer(c: Ctx, used: boolean): void {
  stoneFace(c);
  c.fillStyle = used ? '#5c7062' : JADE_DARK; c.fillRect(6, 6, T - 12, T - 12);
  c.fillStyle = used ? '#698271' : JADE; c.fillRect(9, 9, T - 18, T - 18);
  if (used) {
    c.strokeStyle = JADE_DARK; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(17, 13); c.lineTo(21, 20); c.lineTo(18, 27); c.stroke();
    return;
  }
  c.fillStyle = '#a96127'; c.beginPath(); c.ellipse(T / 2, T / 2, 7, 12, 0.5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#ffd477'; c.lineWidth = 2; c.beginPath();
  c.moveTo(23, 11); c.quadraticCurveTo(16, 20, 17, 29); c.stroke();
  c.fillStyle = '#9cf3b6'; c.fillRect(14, 3, 12, 2);
}

function drawCrackedStone(c: Ctx): void {
  stoneFace(c);
  c.strokeStyle = STONE_SHADOW; c.lineWidth = 2; c.beginPath();
  c.moveTo(0, 21); c.lineTo(T, 21); c.moveTo(21, 5); c.lineTo(15, 16);
  c.lineTo(23, 25); c.lineTo(17, T); c.stroke();
  c.fillStyle = JADE; c.fillRect(5, 5, 6, 3); c.fillRect(T - 11, T - 8, 6, 3);
}

function columnTile(cap: boolean, left: boolean): HTMLCanvasElement {
  return makeTile(T, c => {
    c.save(); c.translate(left ? 0 : -T, 0); stoneFace(c, 2 * T);
    c.fillStyle = JADE; c.fillRect(T / 2, 0, 3, T); c.fillRect(T * 1.5 - 3, 0, 3, T);
    if (cap) drawJaguarCornice(c);
    else {
      c.fillStyle = STONE_SHADOW; c.fillRect(0, T / 2, 2 * T, 2);
      c.fillRect(T, 0, 2, T / 2); c.fillRect(T / 2, T / 2, 2, T / 2);
    }
    c.restore();
  });
}

function drawJaguarCornice(c: Ctx): void {
  c.fillStyle = STONE_SHADOW; c.fillRect(0, T - 7, 2 * T, 4);
  c.fillStyle = STONE_LIGHT; c.fillRect(T - 14, 7, 28, 23);
  c.fillStyle = JADE_DARK; c.fillRect(T - 10, 12, 5, 4); c.fillRect(T + 5, 12, 5, 4);
  c.fillStyle = STONE_SHADOW; c.fillRect(T - 3, 20, 6, 4); c.fillRect(T - 7, 26, 14, 2);
}
