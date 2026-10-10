import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { World } from '../World';
import { buildLevel } from './build';
import { burnSlowZones, NORMAL_FACTORS, SLOWED_FACTORS, slowFactorsFor, slowZoneAt, type SlowZone } from './slowZones';
import type { Op } from './types';

const silent = new AudioEngine();
silent.muted = true;

const ROW = GROUND - 1;

function makeWorld(ops: readonly Op[]): { world: World; input: Input } {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'jungle' as const, ops };
  const input = new Input();
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  return { world, input };
}

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

/** Distancia recorrida corriendo a la derecha durante `seconds` desde la columna 4. */
function distanceRun(ops: readonly Op[], seconds: number): number {
  const { world, input } = makeWorld(ops);
  run(world, 0.3);
  const x0 = world.player.x;
  input.press('right');
  run(world, seconds);
  return world.player.x - x0;
}

/** Altura máxima (px) de un salto desde parado. */
function jumpHeight(ops: readonly Op[]): number {
  const { world, input } = makeWorld(ops);
  run(world, 0.3);
  const y0 = world.player.y;
  input.press('jump');
  let top = y0;
  for (let t = 0; t < 0.8; t += STEP) {
    world.update(STEP);
    top = Math.min(top, world.player.y);
  }
  return y0 - top;
}

describe('zonas que frenan (puras)', () => {
  const resin: SlowZone = { kind: 'resin', x0: 10, x1: 20, y: ROW };
  const sargassum: SlowZone = { kind: 'sargassum', x0: 10, x1: 20, y: ROW };

  it('buildLevel traduce las ops resin y sargassum a zonas', () => {
    const lvl = buildLevel({ id: 't', name: 't', width: 40, theme: 'jungle', ops: [['resin', 2, 5, ROW], ['sargassum', 8, 9, ROW]] });
    expect(lvl.slowZones).toEqual([
      { kind: 'resin', x0: 2, x1: 5, y: ROW },
      { kind: 'sargassum', x0: 8, x1: 9, y: ROW },
    ]);
  });

  it('slowZoneAt solo encuentra la franja en su fila y columnas', () => {
    expect(slowZoneAt([resin], 15 * T, ROW * T + 5)).toBe(resin);
    expect(slowZoneAt([resin], 15 * T, (ROW - 1) * T + 5)).toBeNull();
    expect(slowZoneAt([resin], 25 * T, ROW * T + 5)).toBeNull();
  });

  it('solo frena con los pies apoyados dentro', () => {
    const body = { x: 15 * T, y: GROUND * T - 66, w: 36, h: 66, vx: 0, vy: 0, onGround: true };
    expect(slowFactorsFor([resin], body)).toBe(SLOWED_FACTORS);
    expect(slowFactorsFor([resin], { ...body, onGround: false })).toBe(NORMAL_FACTORS);
    expect(slowFactorsFor([resin], { ...body, x: 30 * T })).toBe(NORMAL_FACTORS);
  });

  it('quemar parte el sargazo en dos sin mutar la lista original', () => {
    const zones = [sargassum];
    const burnt = burnSlowZones(zones, 15, ROW, 1);
    expect(burnt).toEqual([
      { ...sargassum, x1: 13 },
      { ...sargassum, x0: 17 },
    ]);
    expect(zones).toEqual([sargassum]);
  });

  it('quemar un extremo recorta y quemar todo elimina la zona', () => {
    expect(burnSlowZones([sargassum], 10, ROW, 1)).toEqual([{ ...sargassum, x0: 12 }]);
    expect(burnSlowZones([{ ...sargassum, x1: 11 }], 10, ROW, 1)).toEqual([]);
  });

  it('la resina no arde', () => {
    const zones = [resin];
    expect(burnSlowZones(zones, 15, ROW, 1)).toBe(zones);
  });
});

describe('zonas que frenan en el mundo', () => {
  it('el jugador avanza más lento sobre resina y normal fuera de ella', () => {
    const normal = distanceRun([], 1);
    const slowed = distanceRun([['resin', 0, 60, ROW]], 1);
    const beside = distanceRun([['resin', 40, 60, ROW]], 1);
    expect(slowed).toBeLessThan(normal * 0.6);
    expect(beside).toBeCloseTo(normal, 0);
  });

  it('el jugador salta menos desde el sargazo', () => {
    const normal = jumpHeight([]);
    const slowed = jumpHeight([['sargassum', 0, 20, ROW]]);
    expect(normal).toBeGreaterThan(3 * T);
    expect(slowed).toBeLessThan(normal * 0.6);
    expect(slowed).toBeGreaterThan(T);
  });

  it('una bola de fuego quema el sargazo y se consume', () => {
    const { world } = makeWorld([['sargassum', 10, 20, ROW]]);
    world.fireballs.push({ x: 15 * T + 20, y: ROW * T + 20, vx: 0, vy: 0, t: 0, gone: false });
    world.update(STEP);
    expect(world.fireballs).toHaveLength(0);
    expect(slowZoneAt(world.slowZones, 15 * T + 20, ROW * T + 20)).toBeNull();
    expect(slowZoneAt(world.slowZones, 11 * T, ROW * T + 20)?.kind).toBe('sargassum');
  });

  it('una bola de fuego no quema la resina', () => {
    const { world } = makeWorld([['resin', 10, 20, ROW]]);
    world.fireballs.push({ x: 15 * T + 20, y: ROW * T + 20, vx: 0, vy: 0, t: 0, gone: false });
    world.update(STEP);
    expect(world.fireballs).toHaveLength(1);
    expect(world.slowZones).toEqual([{ kind: 'resin', x0: 10, x1: 20, y: ROW }]);
  });
});
