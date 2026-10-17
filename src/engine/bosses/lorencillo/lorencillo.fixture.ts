import { AudioEngine } from '../../audio';
import { START_LIVES, T } from '../../constants';
import { Input } from '../../input';
import type { LevelDef } from '../../level/types';
import { World } from '../../World';
import { Lorencillo } from './index';

/** Nivel mínimo que aísla los ataques; completion.test.ts usa el 6-6 real. */
export const ARENA: readonly [number, number] = [30, 50];
export const LEFT = ARENA[0] * T;
export const RIGHT = (ARENA[1] + 1) * T;

const silent = new AudioEngine();
silent.muted = true;

export const TEST_LEVEL: LevelDef = {
  id: 'test-lorencillo',
  name: 'Prueba Lorencillo',
  width: 60,
  theme: 'jungle',
  boss: { id: 'lorencillo', x: 44, arena: ARENA },
  ops: [['wall', ARENA[1] + 1], ['flag', 58]],
};

/** Mundo con el jugador en la arena, invulnerable salvo que la prueba diga lo contrario. */
export function setup(): { world: World; boss: Lorencillo } {
  const world = new World({ def: TEST_LEVEL, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
  const boss = world.boss;
  if (!(boss instanceof Lorencillo)) throw new Error('el jefe debe ser Lorencillo');
  world.player.x = LEFT + T;
  world.player.inv = 1000;
  return { world, boss };
}
