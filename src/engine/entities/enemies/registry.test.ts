import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP } from '../../constants';
import { Input } from '../../input';
import { ENEMY_SPRITES } from '../../render/enemies';
import { World } from '../../World';
import { ENEMIES, isAirborne } from '.';

const silent = new AudioEngine();
silent.muted = true;

describe('registro de enemigos', () => {
  it('cada definición coincide con su id y tiene dibujo', () => {
    for (const [id, def] of Object.entries(ENEMIES)) {
      expect(def.id).toBe(id);
      expect(ENEMY_SPRITES[def.id]).toBeTypeOf('function');
    }
  });

  it('murciélagos y barracudas no necesitan suelo; el coatí sí', () => {
    expect(isAirborne('bat')).toBe(true);
    expect(isAirborne('barracuda')).toBe(true);
    expect(isAirborne('coati')).toBe(false);
  });

  it.each(ALL_LEVELS.map((l) => [l.id, l] as const))('el nivel %s simula sus enemigos sin errores', (_id, def) => {
    const input = new Input();
    const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
    for (const e of world.enemies) e.active = true;
    expect(() => {
      for (let t = 0; t < 2; t += STEP) world.update(STEP);
    }).not.toThrow();
  });
});
