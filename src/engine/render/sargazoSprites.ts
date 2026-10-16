import { AKUMAL_TURTLES, SARGAZO_ALLY_FILE, SARGAZO_EFFECTS } from '../../data/sargazoArt';
import type { MovingPlatform } from '../entities/platforms';
import { bakedFrame } from './artCache';
import type { Ctx } from './drawUtils';

const SHELL_WIDTH = 270;

export function drawAkumalTurtle(c: Ctx, m: MovingPlatform): boolean {
  if (!m.turtleState) return false;
  const art = AKUMAL_TURTLES[m.turtleState];
  const scale = m.w / SHELL_WIDTH;
  const image = bakedFrame(SARGAZO_ALLY_FILE, art.frame, scale, true);
  if (!image) return false;
  c.drawImage(image, Math.round(m.w / 2 + (art.frame[0] - art.anchor[0]) * scale),
    Math.round((art.frame[1] - art.anchor[1]) * scale));
  return true;
}

export function drawSeaEffect(c: Ctx, id: keyof typeof SARGAZO_EFFECTS, x: number, y: number, w: number, h = w): boolean {
  const frame = SARGAZO_EFFECTS[id];
  const image = bakedFrame(SARGAZO_ALLY_FILE, frame, w / frame[2]);
  if (!image) return false;
  c.drawImage(image, x - w / 2, y - h / 2, w, h);
  return true;
}
