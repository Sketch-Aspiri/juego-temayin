import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { Camazotz } from './index';

export function setup() {
  const audio = new AudioEngine(); audio.muted = true;
  const def = getLevel('7-4');
  if (!def) throw new Error('Falta el Trono de Camazotz');
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio });
  const boss = world.boss;
  if (!(boss instanceof Camazotz)) throw new Error('Falta Camazotz');
  world.player.x = boss.left + T * 7;
  world.player.inv = 1000;
  return { world, boss };
}

export function advance(world: World, seconds: number): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += STEP) world.update(STEP);
}

export function until(world: World, condition: () => boolean, maximum = 20): boolean {
  for (let elapsed = 0; elapsed < maximum && !condition(); elapsed += STEP) world.update(STEP);
  return condition();
}
