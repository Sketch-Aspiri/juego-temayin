import { PLAYER_START_TILE, T } from './constants';
import type { World } from './World';

export const TUTORIAL_OBJECTIVES = ['move', 'jump', 'run', 'collect', 'fire'] as const;
export type TutorialObjective = typeof TUTORIAL_OBJECTIVES[number];
const WALK_SPEED = 260;
const MOVE_DISTANCE = 2 * T;

/** Solo cuenta acciones realizadas por la simulación; pulsar una tecla no basta. */
export function observeTutorial(world: World, completed: readonly TutorialObjective[]): readonly TutorialObjective[] {
  const p = world.player;
  const achieved: Readonly<Record<TutorialObjective, boolean>> = {
    move: Math.abs(p.x - (PLAYER_START_TILE * T + 4)) >= MOVE_DISTANCE,
    jump: !p.onGround && p.vy < 0,
    run: world.input.held.run && Math.abs(p.vx) > WALK_SPEED,
    collect: world.coinsCollected > 0,
    fire: world.fireballs.length > 0,
  };
  return TUTORIAL_OBJECTIVES.filter(id => completed.includes(id) || achieved[id]);
}
