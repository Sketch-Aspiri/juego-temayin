import { T, TAU, VW } from '../constants';
import { ropeTip } from '../entities/ropes';
import type { MovingPlatform } from '../entities/platforms';
import type { World } from '../World';
import { bakedFrame, type Frame } from './artCache';
import type { Ctx } from './drawUtils';

const HAMMOCK: Frame = [27, 88, 605, 223];
const TRUCK: Frame = [36, 181, 580, 408];

export function drawHaciendaProps(c: Ctx, world: World, now: number): void {
  for (const h of world.level.hammocks) {
    const x = h.x - world.camX;
    if (x + h.w < 0 || x > VW) continue;
    c.strokeStyle = '#ae854b'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x, h.y + 20); c.lineTo(x, h.y - 30);
    c.moveTo(x + h.w, h.y + 20); c.lineTo(x + h.w, h.y - 30); c.stroke();
    const art = bakedFrame('mecanicas/mecanicas.webp', HAMMOCK, h.w / HAMMOCK[2]);
    if (art) c.drawImage(art, x, h.y - art.height * 0.75);
    else { c.fillStyle = '#de9d56'; c.fillRect(x, h.y, h.w, 10); }
  }
  c.strokeStyle = '#e6cd8e'; c.lineWidth = 4;
  for (const r of world.ropes) {
    const [x, y] = ropeTip(r);
    if (r.x - world.camX < -r.length || r.x - world.camX > VW + r.length) continue;
    c.beginPath(); c.moveTo(r.x - world.camX, r.y); c.lineTo(x - world.camX, y); c.stroke();
    c.fillStyle = '#a77738'; c.fillRect(r.x - world.camX - 14, r.y - 5, 28, 10);
    c.beginPath(); c.arc(x - world.camX, y, 7, 0, TAU); c.stroke();
  }
  for (const l of world.level.lights) {
    c.fillStyle = '#835b35'; c.fillRect(l.x - world.camX - 4, l.y, 8, 24);
    c.fillStyle = '#ffcd5c'; c.beginPath();
    c.ellipse(l.x - world.camX, l.y - 6, 6, 12 + Math.sin(now / 90), 0, 0, TAU); c.fill();
  }
}

/** Vagoneta Decauville sobre los rieles: comparte la colisión y el movimiento de un mover. */
export function drawTruck(c: Ctx, m: MovingPlatform, camX: number): void {
  const x = m.x - camX;
  const art = bakedFrame('enemies/truck.webp', TRUCK, m.w / TRUCK[2]);
  c.strokeStyle = '#726c66'; c.lineWidth = 3;
  const spec = m.spec;
  if (spec.kind !== 'mover') return;
  const start = spec.x * T - camX;
  const width = (spec.length + Math.abs(spec.dx)) * T;
  const y = m.y + (art?.height ?? 50);
  c.beginPath(); c.moveTo(start, y); c.lineTo(start + width, y); c.stroke();
  if (art) c.drawImage(art, x, m.y - 2);
  else { c.fillStyle = '#a8824b'; c.fillRect(x, m.y, m.w, 30); }
}

export function drawTohHint(c: Ctx, world: World): void {
  if (!world.def.hint || world.phaseT > 7 || world.phase !== 'play') return;
  c.save(); c.globalAlpha = Math.min(1, 7 - world.phaseT);
  c.fillStyle = 'rgba(11,30,24,.88)'; c.fillRect(24, 100, VW - 48, 45);
  c.fillStyle = '#fff3c8'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center';
  c.fillText(`Toh: ${world.def.hint}`, VW / 2, 128, VW - 75); c.restore();
}
