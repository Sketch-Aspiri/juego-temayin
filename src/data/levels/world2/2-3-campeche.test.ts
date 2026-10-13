import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../../engine/audio';
import { START_LIVES, STEP, T } from '../../../engine/constants';
import { Input } from '../../../engine/input';
import { World } from '../../../engine/World';
import { LEVEL_2_3 } from './2-3-campeche';

const CANNON_ROW = 8;
const FIRST_JUMP_HOLD = 23;
const TURN_STEPS = 11;
const RETURN_JUMP_HOLD = 32;
const MAX_JUMP_STEPS = Math.ceil(1.5 / STEP);
/** Segundos de espera sobre el cañón: más de dos ciclos de disparo de cada cañón. */
const STANDING_WAIT = 8;

function jumpToCannon(world: World, holdSteps: number): void {
  world.input.press('jump');
  for (let step = 0; step < MAX_JUMP_STEPS && world.phase === 'play'; step++) {
    if (step === holdSteps) world.input.release('jump');
    world.update(STEP);
    if (step > 1 && world.player.onGround) break;
  }
  world.input.release('jump');
}

describe('cacao del segundo foso de Campeche', () => {
  it('permite recoger los cinco granos cruzando entre los cañones sin morir', () => {
    const audio = new AudioEngine();
    audio.muted = true;
    const world = new World({
      def: LEVEL_2_3, input: new Input(), audio,
      session: { score: 0, coins: 0, lives: START_LIVES },
    });
    const p = world.player;
    // Comenzamos sobre el cañón de entrada, con colisiones y cámara activas.
    p.x = 89 * T;
    p.y = CANNON_ROW * T - p.h;
    p.onGround = true;
    world.input.press('right');
    world.input.press('run');

    jumpToCannon(world, FIRST_JUMP_HOLD);
    expect(world.phase).toBe('play');
    expect(p.onGround).toBe(true);
    expect(p.x + p.w).toBeGreaterThan(95 * T);
    expect(p.y + p.h).toBe(CANNON_ROW * T);

    world.input.release('right');
    world.input.press('left');
    for (let step = 0; step < TURN_STEPS; step++) world.update(STEP);
    jumpToCannon(world, RETURN_JUMP_HOLD);

    expect(world.phase).toBe('play');
    expect(p.onGround).toBe(true);
    expect(p.x).toBeLessThan(90 * T);
    expect(p.y + p.h).toBe(CANNON_ROW * T);
    expect(world.coinsCollected).toBe(5);
    expect(world.session.lives).toBe(START_LIVES);
    for (let x = 90; x <= 94; x++) expect(world.tileAt(x, 6)).toBe(' ');
  });

  it('de pie sobre un cañón del foso, las balas de su fila pasan por debajo', () => {
    const audio = new AudioEngine();
    audio.muted = true;
    const world = new World({
      def: LEVEL_2_3, input: new Input(), audio,
      session: { score: 0, coins: 0, lives: START_LIVES },
    });
    const p = world.player;
    p.x = 89 * T;
    p.y = CANNON_ROW * T - p.h;
    p.onGround = true;
    let shots = 0;
    for (let t = 0; t < STANDING_WAIT; t += STEP) {
      const before = world.cannonballs.length;
      world.update(STEP);
      if (world.cannonballs.length > before) shots++;
    }
    expect(shots).toBeGreaterThan(0);
    expect(world.phase).toBe('play');
    expect(world.session.lives).toBe(START_LIVES);
  });
});
