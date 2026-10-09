import { TAU, VH, VW } from '../constants';

export type Ctx = CanvasRenderingContext2D;

export function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

/** Texto con contorno oscuro. */
export function outlined(c: Ctx, txt: string, x: number, y: number, col: string, lw = 4): void {
  c.lineJoin = 'round';
  c.strokeStyle = '#1a1a1a';
  c.lineWidth = lw;
  c.strokeText(txt, x, y);
  c.fillStyle = col;
  c.fillText(txt, x, y);
}

export function star(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#ffe14d';
  c.strokeStyle = '#7a4d00';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.stroke();
}

export function drawCoin(c: Ctx, x: number, y: number, phase: number): void {
  const w = Math.abs(Math.cos(phase)) * 11 + 2;
  c.fillStyle = '#a86b00';
  c.beginPath();
  c.ellipse(x, y, w + 2, 15, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#ffd23f';
  c.beginPath();
  c.ellipse(x, y, w, 13, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#fff3b0';
  c.fillRect(x - w * 0.3, y - 8, Math.max(1, w * 0.3), 16);
}

export function drawShield(c: Ctx, x: number, y: number, s = 1): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = '#7a4d00';
  c.beginPath();
  c.moveTo(-16, -16);
  c.lineTo(16, -16);
  c.lineTo(16, 2);
  c.quadraticCurveTo(14, 14, 0, 19);
  c.quadraticCurveTo(-14, 14, -16, 2);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffc928';
  c.beginPath();
  c.moveTo(-13, -13);
  c.lineTo(13, -13);
  c.lineTo(13, 1);
  c.quadraticCurveTo(11, 11, 0, 15);
  c.quadraticCurveTo(-11, 11, -13, 1);
  c.closePath();
  c.fill();
  c.strokeStyle = '#7a4d00';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 10);
  c.lineTo(0, -9);
  for (let i = 0; i < 3; i++) {
    c.moveTo(0, 5 - i * 5);
    c.lineTo(-6, -1 - i * 5);
    c.moveTo(0, 5 - i * 5);
    c.lineTo(6, -1 - i * 5);
  }
  c.stroke();
  c.restore();
}

export function drawLife(c: Ctx, x: number, y: number): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#7a0f1f';
  c.beginPath();
  c.moveTo(0, 16);
  c.bezierCurveTo(-24, 0, -16, -20, 0, -8);
  c.bezierCurveTo(16, -20, 24, 0, 0, 16);
  c.fill();
  c.fillStyle = '#ff3b5c';
  c.beginPath();
  c.moveTo(0, 12);
  c.bezierCurveTo(-19, 0, -13, -15, 0, -5);
  c.bezierCurveTo(13, -15, 19, 0, 0, 12);
  c.fill();
  c.fillStyle = '#ffd0d8';
  c.beginPath();
  c.ellipse(-7, -6, 4, 3, -0.6, 0, TAU);
  c.fill();
  c.font = 'bold 11px "Trebuchet MS", sans-serif';
  c.textAlign = 'center';
  outlined(c, '1UP', 0, 3, '#fff', 3);
  c.restore();
}

export function drawChili(c: Ctx, x: number, y: number, s = 1, now = performance.now()): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(-0.5);
  const fl = Math.sin(now / 90) * 2;
  c.fillStyle = 'rgba(255,150,40,.35)';
  c.beginPath();
  c.arc(0, 0, 20 + fl, 0, TAU);
  c.fill();
  c.fillStyle = '#7a0d0d';
  c.beginPath();
  c.moveTo(-6, -12);
  c.quadraticCurveTo(14, -10, 8, 8);
  c.quadraticCurveTo(2, 18, -10, 17);
  c.quadraticCurveTo(0, 8, -8, -4);
  c.closePath();
  c.fill();
  c.fillStyle = '#e8261c';
  c.beginPath();
  c.moveTo(-5, -10);
  c.quadraticCurveTo(11, -8, 6, 7);
  c.quadraticCurveTo(1, 15, -7, 15);
  c.quadraticCurveTo(-2, 7, -7, -3);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.6)';
  c.beginPath();
  c.ellipse(1, -4, 2, 5, 0.3, 0, TAU);
  c.fill();
  c.fillStyle = '#2e8b2e';
  c.fillRect(-9, -15, 8, 6);
  c.strokeStyle = '#2e8b2e';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-5, -14);
  c.quadraticCurveTo(-4, -22, 2, -22);
  c.stroke();
  c.restore();
}

/** Capa de colinas con parallax. */
export function layer(c: Ctx, off: number, base: number, amp: number, col: string, freq: number, seed: number): void {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, VH);
  for (let x = 0; x <= VW; x += 10) {
    const wx = x + off;
    const y = base - amp * (0.5 + 0.3 * Math.sin(wx * freq + seed) + 0.2 * Math.sin(wx * freq * 2.7 + seed * 3));
    c.lineTo(x, y);
  }
  c.lineTo(VW, VH);
  c.fill();
}

export function cloud(c: Ctx, x: number, y: number, s: number): void {
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(x, y, 22 * s, 0, TAU);
  c.arc(x + 26 * s, y - 12 * s, 28 * s, 0, TAU);
  c.arc(x + 56 * s, y, 22 * s, 0, TAU);
  c.fill();
  c.fillRect(x, y, 56 * s, 22 * s);
}

export function tree(c: Ctx, x: number, y: number, s: number): void {
  c.fillStyle = '#5b3a1e';
  c.fillRect(x - 5 * s, y - 70 * s, 10 * s, 75 * s);
  c.fillStyle = '#23703c';
  c.beginPath();
  c.arc(x, y - 80 * s, 34 * s, 0, TAU);
  c.arc(x - 26 * s, y - 62 * s, 24 * s, 0, TAU);
  c.arc(x + 26 * s, y - 62 * s, 24 * s, 0, TAU);
  c.fill();
  c.fillStyle = '#2f8a4b';
  c.beginPath();
  c.arc(x - 8 * s, y - 88 * s, 18 * s, 0, TAU);
  c.fill();
}

export function palm(c: Ctx, x: number, y: number, s: number, lean: number): void {
  c.strokeStyle = '#8a5a2b';
  c.lineWidth = 9 * s;
  c.lineCap = 'round';
  const tx = x + lean * 30 * s;
  const ty = y - 130 * s;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + lean * 4 * s, y - 70 * s, tx, ty);
  c.stroke();
  c.strokeStyle = '#6b4220';
  c.lineWidth = 2;
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    const px = x + (tx - x) * t * t;
    const py = y + (ty - y) * t;
    c.beginPath();
    c.moveTo(px - 4 * s, py);
    c.lineTo(px + 4 * s, py + 2);
    c.stroke();
  }
  c.fillStyle = '#2e9a3e';
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.55;
    const len = 60 * s;
    const ex = tx + Math.cos(a) * len * 1.3;
    const ey = ty + Math.sin(a) * len * 0.6 + 25 * s;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo((tx + ex) / 2, ty - 25 * s, ex, ey);
    c.quadraticCurveTo((tx + ex) / 2, ty - 8 * s, tx, ty);
    c.fill();
  }
  c.fillStyle = '#6b4220';
  for (const d of [-6, 5, 0]) {
    c.beginPath();
    c.arc(tx + d * s, ty + 6 * s, 5 * s, 0, TAU);
    c.fill();
  }
}

/** Crea una textura de un bloque dibujando en un lienzo fuera de pantalla. */
export function makeTile(size: number, draw: (c: Ctx) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d') as Ctx);
  return canvas;
}
