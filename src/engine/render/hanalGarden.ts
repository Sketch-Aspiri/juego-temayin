import { GROUND, T, TAU, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';

const CLUSTER_STEP = 72;
const CANDLE_INTERVAL = 5;
const PETALS = 9;
const LEAF_COLORS = ['#176158', '#32816a', '#61a577'] as const;
const PETAL_COLORS = ['#dd6c20', '#f8a62c', '#ffcf57'] as const;

/** Solo decora suelo continuo: nada flota sobre barrancos ni tapa su borde. */
export function gardenSurface(world: World, x: number): number | null {
  const tx = Math.floor(x / T);
  if (!world.solid(tx, GROUND) || !world.solid(tx - 1, GROUND) || !world.solid(tx + 1, GROUND)) return null;
  let row = GROUND;
  while (row > 0 && world.solid(tx, row - 1)) row--;
  return row * T;
}

export function drawHanalGarden(c: Ctx, world: World): void {
  const start = Math.max(0, Math.floor(world.camX / CLUSTER_STEP));
  // El tiempo de simulación congela el follaje y las llamas cuando se pausa.
  const time = world.phaseT;
  for (let i = start; i * CLUSTER_STEP < world.camX + VW + T; i++) {
    const wx = i * CLUSTER_STEP + 18, y = gardenSurface(world, wx);
    if (y === null) continue;
    c.save(); c.translate(wx - world.camX, y);
    const sway = Math.sin(time * 1.4 + i * 2.3) * 0.025;
    if (i % 3 !== 1) drawLeaves(c, i, sway);
    drawFlowerCluster(c, i);
    if (i % CANDLE_INTERVAL === 2) drawCandle(c, 16, -2, time, i);
    c.restore();
  }
}

/** Hojas lanceoladas con nervio claro; pequeñas para conservar la lectura del salto. */
function drawLeaves(c: Ctx, seed: number, sway: number): void {
  c.save(); c.rotate(sway);
  for (let j = 0; j < 5; j++) {
    const angle = -1.05 + j * 0.49, length = 18 + (seed + j * 7) % 17;
    c.save(); c.rotate(angle); c.fillStyle = LEAF_COLORS[j % LEAF_COLORS.length];
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(-13, -length * 0.45, -6, -length * 0.85, 0, -length);
    c.bezierCurveTo(8, -length * 0.65, 9, -length * 0.2, 0, 0); c.fill();
    c.strokeStyle = '#a5c48888'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-1, -length / 2, 0, -length + 3); c.stroke();
    c.restore();
  }
  c.restore();
}

function drawFlowerCluster(c: Ctx, seed: number): void {
  c.fillStyle = '#102f28aa'; c.beginPath(); c.ellipse(0, -1, 24, 4, 0, 0, TAU); c.fill();
  for (let j = 0; j < 3; j++) {
    const x = j * 12 - 12, y = -5 - (seed + j * 3) % 8;
    drawFlower(c, x, y, 0.7 + ((seed + j) % 3) * 0.16);
  }
  // Pétalos sueltos espaciados, sin formar una franja que oculte las plataformas.
  c.fillStyle = '#e9a238';
  for (let j = 0; j < 3; j++) {
    c.beginPath(); c.ellipse(27 + j * 7, -2, 2.5, 1.2, j, 0, TAU); c.fill();
  }
}

function drawFlower(c: Ctx, x: number, y: number, size: number): void {
  c.save(); c.translate(x, y); c.scale(size, size);
  c.fillStyle = '#8c431d'; c.beginPath(); c.ellipse(0, 2, 10, 7, 0, 0, TAU); c.fill();
  for (let ring = 0; ring < 2; ring++) {
    c.fillStyle = PETAL_COLORS[ring];
    for (let k = 0; k < PETALS; k++) {
      const a = k * TAU / PETALS + ring * 0.3, radius = ring ? 3 : 6;
      c.beginPath(); c.ellipse(Math.cos(a) * radius, Math.sin(a) * radius * 0.7,
        ring ? 3 : 4.5, ring ? 2 : 3, a, 0, TAU); c.fill();
    }
  }
  c.fillStyle = PETAL_COLORS[2]; c.beginPath(); c.ellipse(-1, -1, 3, 2, 0, 0, TAU); c.fill();
  c.restore();
}

function drawCandle(c: Ctx, x: number, y: number, time: number, seed: number): void {
  c.save(); c.translate(x, y);
  const height = 22 + seed % 3 * 4, flicker = Math.sin(time * 4 + seed) * 1.2;
  const glow = c.createRadialGradient(0, -height - 6, 2, 0, -height - 6, 42);
  glow.addColorStop(0, '#ffd58950'); glow.addColorStop(0.5, '#efab3918'); glow.addColorStop(1, '#efab3900');
  c.fillStyle = glow; c.fillRect(-42, -height - 48, 84, 84);
  c.fillStyle = '#623927'; c.beginPath(); c.ellipse(0, 0, 12, 4, 0, 0, TAU); c.fill();
  c.fillStyle = '#ba7951'; c.beginPath(); c.ellipse(0, -2, 11, 3, 0, 0, TAU); c.fill();
  const wax = c.createLinearGradient(-5, 0, 5, 0);
  wax.addColorStop(0, '#b9a37e'); wax.addColorStop(0.4, '#fff0c9'); wax.addColorStop(1, '#dec698');
  c.fillStyle = wax; c.fillRect(-5, -height, 10, height - 2);
  c.fillStyle = '#fff3d3'; c.beginPath(); c.ellipse(0, -height, 5, 2, 0, 0, TAU); c.fill();
  c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = '#fff0c9';
  c.beginPath(); c.moveTo(-3, -height); c.lineTo(-3, -height + 8); c.moveTo(3, -height); c.lineTo(3, -height + 5); c.stroke();
  c.strokeStyle = '#493322'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -height); c.lineTo(0, -height - 4); c.stroke();
  c.fillStyle = '#f8b441'; c.beginPath(); c.moveTo(0, -height - 2);
  c.bezierCurveTo(-6, -height - 5, -2, -height - 10, flicker, -height - 14);
  c.bezierCurveTo(2, -height - 9, 6, -height - 5, 0, -height - 2); c.fill();
  c.fillStyle = '#fff5ce'; c.beginPath(); c.ellipse(0, -height - 5, 1.8, 3.3, 0, 0, TAU); c.fill();
  c.restore();
}
