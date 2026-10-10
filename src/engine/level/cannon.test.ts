import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { isSolidTile } from '../tiles';
import { World } from '../World';
import { buildLevel } from './build';
import type { LevelDef, Op } from './types';

const silent = new AudioEngine();
silent.muted = true;

const def = (ops: readonly Op[]): LevelDef => ({ id: 't', name: 'Prueba', width: 40, theme: 'fortress', ops });

describe('op cannon (cañón de baluarte)', () => {
  it('coloca culata y boca según la dirección', () => {
    const lvl = buildLevel(def([['cannon', 10, 8, 1], ['cannon', 20, 6, -1]]));
    expect(lvl.grid[8].slice(10, 12)).toEqual(['K', '>']);
    expect(lvl.grid[6].slice(20, 22)).toEqual(['<', 'K']);
  });

  it('sus bloques son sólidos y no cuentan como monedas', () => {
    const lvl = buildLevel(def([['cannon', 10, 8, 1]]));
    expect(isSolidTile(lvl.grid[8][10])).toBe(true);
    expect(isSolidTile(lvl.grid[8][11])).toBe(true);
    expect(lvl.totalCoins).toBe(0);
  });

  it('el jugador puede pararse encima del cañón', () => {
    const world = new World({
      def: def([['cannon', 10, GROUND - 3, 1]]),
      session: { score: 0, coins: 0, lives: START_LIVES },
      input: new Input(),
      audio: silent,
    });
    const p = world.player;
    p.x = 10 * T + (2 * T - p.w) / 2;
    p.y = (GROUND - 3) * T - p.h - 20;
    p.vy = 0;
    for (let t = 0; t < 0.5; t += STEP) world.update(STEP);
    expect(p.onGround).toBe(true);
    expect(p.y + p.h).toBe((GROUND - 3) * T);
  });
});
