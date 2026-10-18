import { T } from '../constants';
import { waterAt } from '../level/zones';
import type { World } from '../World';

const LOOKAHEAD = 60;
const SHORE_CLEARANCE = 65;
const RELEASE_ANGLE = 0.15;

/** Entradas de QA: solo protege del contacto; posición, colisiones, oxígeno y saltos son reales. */
export function driveHanalRoute(w: World): void {
  const p = w.player, input = w.input;
  p.inv = 1;
  input.press('right'); input.press('run');
  let jump = false;
  const water = waterAt(w.level.water, p.x + p.w / 2, p.y + p.h / 2);
  if (p.swinging !== null) {
    jump = w.ropes[p.swinging].angle > RELEASE_ANGLE;
    if (!jump) input.release('jump');
  } else if (water && p.swimming) {
    jump = p.y > water.surface * T - SHORE_CLEARANCE && p.vy >= 0;
  } else if (p.onGround || p.coyote > 0) {
    const front = p.x + p.w;
    const floor = Math.round((p.y + p.h) / T);
    for (let x = Math.floor(front / T); x <= Math.floor((front + LOOKAHEAD) / T); x++) {
      const platform = w.platforms.some(m => x * T >= m.x && x * T < m.x + m.w && Math.abs(m.y - (p.y + p.h)) < T / 2);
      if ((!w.solid(x, floor) && !platform) || w.solid(x, Math.floor((p.y + p.h - 3) / T))) jump = true;
    }
  }
  if (jump && !input.held.jump) input.press('jump');
  else if (p.vy >= 0 || (!jump && p.onGround)) input.release('jump');
}
