import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { buildLevel } from '../level/build';
import type { LevelDef, Op } from '../level/types';
import { isSolidTile } from '../tiles';
import { World } from '../World';
import { CRUMBLE_RESPAWN_TIME, CRUMBLE_SHAKE_TIME, CRUMBLE_TILE } from './crumble';

const silent = new AudioEngine();
silent.muted = true;

/** Tramo de escombro de 3 bloques en la fila 9 (cols 20-22) sobre un hoyo. */
const CRUMBLE_ROW = 9;
const OPS: readonly Op[] = [['pit', 18, 24], ['crumble', 20, CRUMBLE_ROW, 3]];

function makeWorld(ops: readonly Op[] = OPS): World {
  const def: LevelDef = { id: 't', name: 'Prueba', width: 60, theme: 'ruins', ops };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

/** Pone al jugador de pie sobre el tramo de escombro. */
function standOnCrumble(world: World): void {
  const p = world.player;
  p.x = 21 * T;
  p.y = CRUMBLE_ROW * T - p.h;
  p.vy = 0;
  world.camX = 15 * T;
}

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

describe('escombro que se derrumba (op crumble)', () => {
  it('buildLevel escribe bloques sólidos y registra el tramo', () => {
    const lvl = buildLevel({ id: 't', name: 'P', width: 60, theme: 'ruins', ops: OPS });
    expect(lvl.crumbles).toEqual([{ x: 20, y: CRUMBLE_ROW, len: 3 }]);
    for (let x = 20; x <= 22; x++) expect(lvl.grid[CRUMBLE_ROW][x]).toBe(CRUMBLE_TILE);
    expect(isSolidTile(CRUMBLE_TILE)).toBe(true);
  });

  it('sostiene al jugador y tiembla al pisarlo antes de caer', () => {
    const world = makeWorld();
    standOnCrumble(world);
    run(world, CRUMBLE_SHAKE_TIME / 2);
    expect(world.crumbles[0].state).toBe('shaking');
    expect(world.player.onGround).toBe(true);
    expect(world.tileAt(21, CRUMBLE_ROW)).toBe(CRUMBLE_TILE);
  });

  it('cae tras el temblor y el jugador cae con él', () => {
    const world = makeWorld();
    standOnCrumble(world);
    const y0 = world.player.y;
    run(world, CRUMBLE_SHAKE_TIME + 0.2);
    expect(world.crumbles[0].state).toBe('falling');
    expect(world.tileAt(21, CRUMBLE_ROW)).toBe(' ');
    expect(world.player.y).toBeGreaterThan(y0);
  });

  it('reaparece pasado el tiempo de espera si el hueco está libre', () => {
    const world = makeWorld();
    standOnCrumble(world);
    run(world, CRUMBLE_SHAKE_TIME + 0.05);
    // El jugador ya se fue (lo sacamos del hueco para no depender de su caída).
    world.player.x = 30 * T;
    world.player.y = GROUND * T - world.player.h;
    run(world, CRUMBLE_RESPAWN_TIME + 0.1);
    expect(world.crumbles[0].state).toBe('solid');
    expect(world.tileAt(20, CRUMBLE_ROW)).toBe(CRUMBLE_TILE);
  });

  it('no reaparece sobre el jugador: espera a que se aparte', () => {
    const world = makeWorld([['crumble', 20, GROUND - 1, 2]]);
    const c = world.crumbles[0];
    c.state = 'falling';
    c.timer = 0;
    world.grid[GROUND - 1][20] = ' ';
    world.grid[GROUND - 1][21] = ' ';
    world.player.x = 20 * T + 2;
    world.player.y = GROUND * T - world.player.h;
    world.camX = 15 * T;
    run(world, 0.1);
    expect(c.state).toBe('falling');
    expect(world.tileAt(20, GROUND - 1)).toBe(' ');
  });

  it('no se activa si el jugador no lo pisa', () => {
    const world = makeWorld();
    run(world, 1);
    expect(world.crumbles[0].state).toBe('solid');
  });
});
