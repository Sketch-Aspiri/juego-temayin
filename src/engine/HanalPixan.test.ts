import { describe, expect, it } from 'vitest';
import { HANAL_PIXAN_LEVEL } from '../data/levels/seasonal/hanal-pixan';
import { AudioEngine } from './audio';
import { OXYGEN_MAX, STEP, T } from './constants';
import { Input } from './input';
import { driveHanalRoute } from './testing/hanalRoute';
import { World } from './World';

const make = (fromCheckpoint = false) => new World({ def: HANAL_PIXAN_LEVEL, input: new Input(),
  audio: new AudioEngine(), fromCheckpoint, session: { score: 0, coins: 0, lives: 3 } });

describe('Recorrido ampliado de Hanal Pixán', () => {
  it.each([false, true])('llega a la meta desde %s (false: inicio; true: checkpoint)', fromCheckpoint => {
    const w = make(fromCheckpoint);
    let swam = false;
    for (let t = 0; t < 180 && w.phase === 'play'; t += STEP) {
      driveHanalRoute(w); w.update(STEP);
      swam ||= w.player.swimming;
    }
    expect(w.phase, `Detenido en ${w.player.x / T},${w.player.y / T}`).toBe('flag');
    expect(w.checkpointReached).toBe(true);
    expect(swam).toBe(!fromCheckpoint);
    expect(w.player.oxygen).toBe(OXYGEN_MAX);
    expect(w.session.lives).toBe(3);
  });

  it('el checkpoint deja escudo, chile y snorkel accesibles tras perder los poderes', () => {
    const w = make(true);
    expect(w.player.x / T).toBeGreaterThanOrEqual(288);
    expect(w.player.fire).toBe(false);
    expect(w.player.swimming).toBe(false);
    expect(w.tileAt(290, 8)).toBe('M');
    expect(w.tileAt(291, 8)).toBe('F');
    expect(w.tileAt(292, 8)).toBe('S');
  });

  it.each([[52, 56], [76, 80], [468, 472], [490, 494]])('la hamaca de %i permite aterrizar en el tejado de %i', (hammock, roof) => {
    const w = make(), p = w.player;
    p.x = (hammock - 2) * T; p.y = 12 * T - p.h; p.onGround = true; p.vx = 400; p.inv = 10;
    w.camX = p.x - 300; w.input.press('right'); w.input.press('run');
    let landed = false;
    for (let t = 0; t < 2 && !landed; t += STEP) {
      w.update(STEP);
      landed = p.onGround && Math.abs(p.y + p.h - 6 * T) < 1 && p.x + p.w > roof * T;
    }
    expect(landed).toBe(true);
  });

  it('la barca transporta al jugador sobre el agua durante un ciclo completo', () => {
    const w = make(), p = w.player;
    const boat = w.platforms.find(m => m.spec.kind === 'mover' && m.spec.appearance === 'boat')!;
    p.x = boat.x + boat.w / 2 - p.w / 2; p.y = boat.y - p.h - 4; p.vy = 80;
    w.camX = boat.x - 300;
    for (let t = 0; t < 6; t += STEP) {
      w.update(STEP);
      expect(boat.y).toBeLessThan(8 * T);
      expect(p.swimming).toBe(false);
      if (t > 0.2) {
        expect(p.onGround).toBe(true);
        expect(p.y + p.h).toBeCloseTo(boat.y);
        expect(Math.abs(p.x + p.w / 2 - (boat.x + boat.w / 2))).toBeLessThan(1);
      }
    }
    expect(w.phase).toBe('play');
    expect(p.oxygen).toBe(OXYGEN_MAX);
  });

  it.each([257, 272])('se puede encestar en el aro de %i con una pelota lanzada desde el suelo', tx => {
    let scored = false;
    for (let distance = 3; distance < 12 && !scored; distance += 0.25) {
      const w = make(true), p = w.player;
      p.x = (tx - distance) * T; p.y = 12 * T - p.h; p.onGround = true; p.ball = true; p.inv = 10;
      w.camX = p.x - 300; w.input.press('fire');
      for (let t = 0; t < 3 && !scored; t += STEP) {
        w.update(STEP);
        scored = w.hoops.some(h => h.tx === tx && h.lit);
      }
    }
    expect(scored).toBe(true);
  });
});
