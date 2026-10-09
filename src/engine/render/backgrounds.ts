import { TAU, VH, VW } from '../constants';
import { cloud, hash, layer, palm, tree, type Ctx } from './drawUtils';

export type Scenery = (c: Ctx, cam: number, now: number) => void;

const wrap = (v: number, period: number): number => ((v % period) + period) % period;

/** Selva: montañas, nubes, colinas y árboles con parallax. */
export const jungleScenery: Scenery = (c, cam) => {
  layer(c, cam * 0.15, 330, 120, '#7fb6a4', 0.004, 1);
  for (let i = 0; i < 12; i++) {
    const cx = wrap(i * 380 + hash(i) * 200 - cam * 0.25, VW + 600) - 200;
    cloud(c, cx, 50 + hash(i + 9) * 140, 0.7 + hash(i + 3) * 0.6);
  }
  layer(c, cam * 0.35, 400, 90, '#3d9a5a', 0.007, 2);
  for (let i = -1; i < 14; i++) {
    const seg = 160;
    const off = cam * 0.5;
    const n = Math.floor(off / seg) + i;
    tree(c, n * seg - off + hash(n) * 80, 450, 0.7 + hash(n + 5) * 0.5);
  }
  layer(c, cam * 0.6, 455, 40, '#2c7a44', 0.012, 3);
};

/** Playa: mar con olas, isla lejana y palmeras. */
export const beachScenery: Scenery = (c, cam, now) => {
  const t = now / 1000;
  for (let i = 0; i < 10; i++) {
    const cx = wrap(i * 420 + hash(i) * 200 - cam * 0.2, VW + 600) - 200;
    cloud(c, cx, 40 + hash(i + 9) * 110, 0.6 + hash(i + 3) * 0.5);
  }
  const ix = wrap(700 - cam * 0.08, VW + 500) - 250;
  c.fillStyle = '#5f9e8a';
  c.beginPath();
  c.ellipse(ix, 300, 160, 34, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = '#8fb3a3';
  c.beginPath();
  c.moveTo(ix - 40, 272);
  c.lineTo(ix, 240);
  c.lineTo(ix + 40, 272);
  c.fill();

  const sea = c.createLinearGradient(0, 300, 0, VH);
  sea.addColorStop(0, '#1e9fd6');
  sea.addColorStop(0.5, '#22c3c9');
  sea.addColorStop(1, '#5fe0d0');
  c.fillStyle = sea;
  c.fillRect(0, 300, VW, VH - 300);
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = 2;
  for (let r = 0; r < 6; r++) {
    const y = 315 + r * 22;
    const off = cam * (0.1 + r * 0.05);
    for (let i = -1; i < 9; i++) {
      const x = wrap(i * 130 + hash(r * 9 + i) * 80 - off + Math.sin(t + r) * 10, VW + 130) - 65;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 15, y - 5, x + 30, y);
      c.stroke();
    }
  }
  layer(c, cam * 0.5, 440, 30, '#f2d79b', 0.006, 4);
  for (let i = -1; i < 10; i++) {
    const seg = 240;
    const off = cam * 0.5;
    const n = Math.floor(off / seg) + i;
    if (hash(n + 11) < 0.35) continue;
    palm(c, n * seg - off + hash(n) * 120, 455, 0.8 + hash(n + 5) * 0.4, hash(n + 2) < 0.5 ? -1 : 1);
  }
};

function crystalCluster(c: Ctx, x: number, y: number, s: number, hue: number, pulse: number): void {
  const glow = c.createRadialGradient(x, y - 30 * s, 2, x, y - 30 * s, 70 * s);
  glow.addColorStop(0, `hsla(${hue},90%,70%,${0.35 + pulse * 0.2})`);
  glow.addColorStop(1, `hsla(${hue},90%,70%,0)`);
  c.fillStyle = glow;
  c.fillRect(x - 80 * s, y - 100 * s, 160 * s, 120 * s);
  for (const [dx, h, w] of [[-14, 46, 9], [0, 66, 11], [14, 38, 8]] as const) {
    c.fillStyle = `hsl(${hue},70%,${55 + pulse * 10}%)`;
    c.beginPath();
    c.moveTo(x + (dx - w) * s, y);
    c.lineTo(x + dx * s, y - h * s);
    c.lineTo(x + (dx + w) * s, y);
    c.fill();
    c.fillStyle = `hsl(${hue},80%,82%)`;
    c.beginPath();
    c.moveTo(x + dx * s, y - h * s);
    c.lineTo(x + (dx + w) * s, y);
    c.lineTo(x + (dx + 2) * s, y);
    c.fill();
  }
}

function stalactites(c: Ctx, off: number, seg: number, minLen: number, varLen: number, color: string): void {
  c.fillStyle = color;
  for (let i = -1; i < VW / seg + 2; i++) {
    const n = Math.floor(off / seg) + i;
    const x = n * seg - off + hash(n) * seg * 0.5;
    const len = minLen + hash(n + 3) * varLen;
    c.beginPath();
    c.moveTo(x - 16, -2);
    c.lineTo(x + 16, -2);
    c.lineTo(x + 3 * (hash(n + 8) - 0.5), len);
    c.fill();
  }
}

/** Cenote: cueva con estalactitas, haces de luz y cristales brillantes. */
export const caveScenery: Scenery = (c, cam, now) => {
  const t = now / 1000;
  layer(c, cam * 0.12, 380, 130, '#1a3a4a', 0.004, 2);

  // Haces de luz que entran por la abertura del cenote.
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * 340 - cam * 0.2, VW + 400) - 200;
    const g = c.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, 'rgba(190,255,245,.22)');
    g.addColorStop(1, 'rgba(190,255,245,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + 70, 0);
    c.lineTo(x + 190, VH);
    c.lineTo(x + 40, VH);
    c.fill();
  }

  stalactites(c, cam * 0.3, 110, 50, 90, '#10303b');
  layer(c, cam * 0.35, 430, 80, '#12313c', 0.007, 4);
  for (let i = -1; i < 6; i++) {
    const seg = 330;
    const off = cam * 0.5;
    const n = Math.floor(off / seg) + i;
    if (hash(n + 21) < 0.3) continue;
    const pulse = (Math.sin(t * 1.6 + n) + 1) / 2;
    crystalCluster(c, n * seg - off + hash(n) * 150, 462, 0.8 + hash(n + 5) * 0.5, hash(n + 4) < 0.5 ? 175 : 205, pulse);
  }
  layer(c, cam * 0.6, 475, 40, '#0c2229', 0.012, 3);
  stalactites(c, cam * 0.55, 150, 30, 60, '#0a1d24');

  // Motas de polvo flotando.
  c.fillStyle = 'rgba(200,255,240,.5)';
  for (let i = 0; i < 18; i++) {
    const px = wrap(hash(i) * VW - cam * 0.3 + Math.sin(t + i) * 12, VW);
    const py = wrap(hash(i + 40) * VH + t * 8 * (1 + hash(i + 2)), VH);
    c.beginPath();
    c.arc(px, py, 1.5, 0, TAU);
    c.fill();
  }
};
