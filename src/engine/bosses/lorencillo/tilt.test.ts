import { describe, expect, it } from 'vitest';
import { STEP } from '../../constants';
import { makeRng } from '../../rng';
import { setup } from './lorencillo.fixture';
import { applyTilt, createTilt, resetTilt, stepTilt, tiltAmount, tiltDrift } from './tilt';
import { TILT_DRIFT, TILT_WARN } from './tuning';

const MIN_WARNING = 0.6;

/** Avanza hasta que se cumpla `done`; devuelve los segundos transcurridos. */
function until(done: () => boolean, step: () => void, max = 20): number {
  let t = 0;
  while (!done() && t < max) { step(); t += STEP; }
  expect(done()).toBe(true);
  return t;
}

describe('Inclinación de la cubierta', () => {
  it('empieza en reposo, sin deriva ni inclinación', () => {
    const tilt = createTilt();
    expect(tilt.phase).toBe('rest');
    expect(tiltDrift(tilt)).toBe(0);
    expect(tiltAmount(tilt)).toBe(0);
  });

  it('avisa al menos 0,6 s antes de arrastrar, y arrastra ±TILT_DRIFT', () => {
    const tilt = createTilt();
    const rng = makeRng(4);
    const step = (): void => stepTilt(tilt, STEP, rng);
    until(() => tilt.phase === 'warn', step);
    expect(tiltDrift(tilt)).toBe(0);
    const warn = until(() => tilt.phase === 'active', step);
    expect(warn).toBeGreaterThanOrEqual(MIN_WARNING);
    expect(TILT_WARN).toBeGreaterThanOrEqual(MIN_WARNING);
    expect(Math.abs(tiltDrift(tilt))).toBe(TILT_DRIFT);
    expect(Math.sign(tiltDrift(tilt))).toBe(tilt.dir);
    until(() => tilt.phase === 'rest', step);
    expect(tiltDrift(tilt)).toBe(0);
  });

  it('la inclinación visible crece durante el aviso', () => {
    const tilt = createTilt();
    tilt.phase = 'warn'; tilt.dir = -1; tilt.t = TILT_WARN / 2;
    expect(tiltAmount(tilt)).toBeLessThan(0);
    expect(Math.abs(tiltAmount(tilt))).toBeGreaterThan(0);
    expect(Math.abs(tiltAmount(tilt))).toBeLessThan(1);
  });

  it('arrastra solo al jugador apoyado en la cubierta', () => {
    const { world } = setup();
    const tilt = createTilt();
    tilt.phase = 'active'; tilt.dir = 1;
    world.player.onGround = true;
    const x0 = world.player.x;
    applyTilt(world, tilt, 0.5);
    expect(world.player.x - x0).toBeCloseTo(TILT_DRIFT * 0.5, 3);
    world.player.onGround = false;
    const x1 = world.player.x;
    applyTilt(world, tilt, 0.5);
    expect(world.player.x).toBe(x1);
  });

  it('no atraviesa un muro al derivar', () => {
    const { world } = setup();
    const tilt = createTilt();
    tilt.phase = 'active'; tilt.dir = 1;
    world.player.onGround = true;
    world.player.x = 51 * 40 - world.player.w - 4; // pegado al muro de salida (columna 51)
    for (let i = 0; i < 400; i++) applyTilt(world, tilt, STEP);
    expect(world.player.x + world.player.w).toBeLessThan(51 * 40 + 1); // la física tolera 1 px de solape
  });

  it('resetTilt la deja plana', () => {
    const tilt = createTilt();
    tilt.phase = 'active';
    resetTilt(tilt);
    expect(tilt.phase).toBe('rest');
    expect(tiltAmount(tilt)).toBe(0);
  });
});
