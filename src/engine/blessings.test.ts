import { describe, expect, it } from 'vitest';
import { getLevel } from '../data/worlds';
import { AudioEngine } from './audio';
import { applyBlessings } from './blessings';
import { START_LIVES, STEP } from './constants';
import { Input } from './input';
import { coinRatio, computeStars } from './scoring';
import { World } from './World';

const make = () => new World({ def: getLevel('1-3')!, input: new Input(), audio: new AudioEngine(), session: { coins: 250, score: 0, lives: START_LIVES } });

describe('Bendiciones iniciales', () => {
  it('aplica fuego, escudo y una vida sin alterar el cacao ni la puntuación', () => {
    const world = make();
    applyBlessings(world, ['fire', 'shield', 'life', 'life']);
    expect(world.player.fire).toBe(true);
    expect(world.player.shield).toBe(true);
    expect(world.session).toEqual({ coins: 250, score: 0, lives: START_LIVES + 1 });
    expect(world.coinsCollected).toBe(0);
  });

  it('el daño consume primero el fuego, luego el escudo y finalmente la vida', () => {
    const world = make();
    applyBlessings(world, ['fire', 'shield']);
    world.hurt();
    expect(world.player.fire).toBe(false);
    expect(world.player.shield).toBe(true);
    world.player.inv = 0; world.hurt();
    expect(world.player.shield).toBe(false);
    world.player.inv = 0; world.hurt();
    expect(world.phase).toBe('dying');
  });

  it('permite disparar con la bendición de fuego', () => {
    const world = make();
    applyBlessings(world, ['fire']);
    world.input.press('fire');
    world.update(STEP);
    expect(world.fireballs).toHaveLength(1);
  });

  it('el saldo acumulado y las bendiciones no inflan las estrellas', () => {
    const world = make();
    applyBlessings(world, ['life']);
    expect(computeStars(coinRatio(world.coinsCollected, world.level.totalCoins), 0)).toBe(1);
  });
});
