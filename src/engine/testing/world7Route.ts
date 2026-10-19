import { T } from '../constants';
import type { World } from '../World';
import { driveHanalRoute } from './hanalRoute';

const STEP_LOOKAHEAD = 105;

/** Recorrido de QA: anticipa los peldaños de ascenso; no mueve al jugador ni altera colisiones. */
export function driveWorld7Route(world: World): void {
  driveHanalRoute(world);
  const player = world.player;
  if (!player.onGround || player.swinging !== null) return;
  const floor = Math.round((player.y + player.h) / T);
  const front = player.x + player.w;
  for (let x = Math.floor(front / T); x <= Math.floor((front + STEP_LOOKAHEAD) / T); x++) {
    if (!world.solid(x, floor - 1) && !world.solid(x, floor - 2)) continue;
    world.input.press('jump'); return;
  }
}
