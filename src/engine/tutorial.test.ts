import { describe, expect, it } from 'vitest';
import { TUTORIAL_LEVEL } from '../data/tutorial';
import { getLevel, PLAYABLE_LEVELS } from '../data/worlds';
import { AudioEngine } from './audio';
import { STEP, T } from './constants';
import { hudKey } from './hud';
import { Input } from './input';
import { TUTORIAL_OBJECTIVES } from './tutorial';
import { World } from './World';

function practice() {
  const input = new Input();
  const world = new World({ def: TUTORIAL_LEVEL, input, audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 } });
  const advance = (seconds: number): void => { for (let t = 0; t < seconds; t += STEP) world.update(STEP); };
  return { world, input, advance };
}

describe('Práctica guiada de Toh', () => {
  it('empieza con chile, sin objetivos regalados y sin consumir tiempo ni vidas', () => {
    const { world, advance } = practice();
    advance(10);
    expect(world.player.fire).toBe(true);
    expect(world.hudState(1).tutorial).toEqual([]);
    expect(world.phase).toBe('play');
    expect(world.timeLeft).toBe(TUTORIAL_LEVEL.time);
    expect(world.session.lives).toBe(3);
    expect(getLevel(TUTORIAL_LEVEL.id)).toBeUndefined();
    expect(PLAYABLE_LEVELS.some(level => level.id === TUTORIAL_LEVEL.id)).toBe(false);
  });

  it('publica el salto real mediante hudKey y conserva lo aprendido', () => {
    const { world, input, advance } = practice();
    advance(.1);
    const before = hudKey(world.hudState(1));
    input.press('jump'); advance(.1); input.release('jump');
    expect(world.hudState(1).tutorial).toContain('jump');
    expect(hudKey(world.hudState(1))).not.toBe(before);
    advance(2);
    expect(world.hudState(1).tutorial).toEqual(['jump']);
  });

  it('espera a demostrar las cinco acciones antes de permitir la bandera', () => {
    const { world, advance } = practice();
    world.player.x = 39 * T;
    advance(.1);
    expect(world.phase).toBe('play');
    expect(world.player.x).toBeLessThan(39 * T);
    expect(world.hudState(1).tutorial).not.toContain('collect');
    expect(world.hudState(1).tutorial).not.toContain('fire');
  });

  it('se completa con entradas reales, checkpoint y meta sin modificar posiciones ni colisiones', () => {
    const { world, input } = practice();
    input.press('right'); input.press('run'); input.press('fire');
    for (let elapsed = 0; elapsed < 25 && world.phase !== 'done'; elapsed += STEP) {
      const x = world.player.x / T;
      const obstacle = (x > 13 && x < 17) || (x > 28 && x < 32);
      if (obstacle && world.player.onGround) input.press('jump');
      else if (!obstacle) input.release('jump');
      world.update(STEP);
    }
    expect(world.hudState(1).tutorial).toEqual(TUTORIAL_OBJECTIVES);
    expect(world.checkpointReached).toBe(true);
    expect(world.phase).toBe('done');
    expect(world.session.coins).toBeGreaterThan(0);
    expect(world.session.lives).toBe(3);
  });

  it('mantiene intactas las reglas y el HUD de la campaña', () => {
    const world = new World({ def: getLevel('1-1')!, input: new Input(), audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 } });
    const initialTime = world.timeLeft;
    world.update(1);
    expect(world.hudState(1).tutorial).toBeUndefined();
    expect(world.timeLeft).toBe(initialTime - 1);
    expect(world.player.fire).toBe(false);
  });
});
