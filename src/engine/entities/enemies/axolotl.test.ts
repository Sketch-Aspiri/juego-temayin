import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import type { Enemy } from '../types';
import {
  AXOLOTL_FADE_TIME,
  AXOLOTL_HIDDEN_ALPHA,
  AXOLOTL_HIDDEN_TIME,
  AXOLOTL_STATE,
  AXOLOTL_VISIBLE_ALPHA,
  AXOLOTL_VISIBLE_TIME,
  axolotlAlpha,
} from './axolotl';
import { createEnemy, ENEMIES, isAirborne, isTangible, updateEnemies } from '.';

const silent = new AudioEngine();
silent.muted = true;

/** Cenote de prueba: agua en las columnas 10..30 desde la fila 5. */
const WATER_X0 = 10;
const WATER_X1 = 30;

function makeWorld(): World {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'xibalba' as const, ops: [['water', WATER_X0, WATER_X1, 5]] as const };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

/** Ajolote en (tx, fila 8) con un estado fijo durante `timer` segundos. */
function spawnAxolotl(world: World, tx: number, state: number, timer = 10): Enemy {
  const e = createEnemy({ id: 'axolotl', tx, ty: 8 });
  e.active = true;
  e.state = state;
  e.timer = timer;
  world.enemies.push(e);
  return e;
}

const step = (world: World, e: Enemy, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) {
    e.t += STEP;
    ENEMIES[e.id].move(e, world, STEP);
  }
};

/** Deja caer al jugador justo sobre el enemigo y resuelve el contacto. */
function dropOn(world: World, e: Enemy): void {
  const p = world.player;
  p.x = e.x + e.w / 2 - p.w / 2;
  p.y = e.y - p.h + 6;
  p.vy = 300;
  updateEnemies(world, STEP);
}

/** Coloca al jugador tocando al enemigo de lado. */
function touchSide(world: World, e: Enemy): void {
  const p = world.player;
  p.x = e.x - p.w + 4;
  p.y = e.y + e.h / 2 - p.h / 2;
  p.vy = 0;
  updateEnemies(world, STEP);
}

const fireballAt = (world: World, e: Enemy): void => {
  world.camX = 0;
  world.fireballs.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, t: 0, gone: false });
};

describe('ajolote fantasma (axolotl)', () => {
  it('nada: no necesita suelo', () => {
    expect(isAirborne('axolotl')).toBe(true);
  });

  it('cicla entre escondido, aparición, visible y desvanecimiento', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, 20, AXOLOTL_STATE.hidden, AXOLOTL_HIDDEN_TIME);
    const seen: number[] = [];
    for (let t = 0; t < AXOLOTL_HIDDEN_TIME + AXOLOTL_VISIBLE_TIME + 2 * AXOLOTL_FADE_TIME + 0.1; t += STEP) {
      step(world, e, STEP);
      if (seen[seen.length - 1] !== e.state) seen.push(e.state);
    }
    expect(seen).toEqual([
      AXOLOTL_STATE.hidden,
      AXOLOTL_STATE.appear,
      AXOLOTL_STATE.visible,
      AXOLOTL_STATE.fade,
      AXOLOTL_STATE.hidden,
    ]);
  });

  it('solo es tangible del todo visible', () => {
    const world = makeWorld();
    for (const s of [AXOLOTL_STATE.hidden, AXOLOTL_STATE.appear, AXOLOTL_STATE.fade]) {
      expect(isTangible(spawnAxolotl(world, 20, s))).toBe(false);
    }
    expect(isTangible(spawnAxolotl(world, 20, AXOLOTL_STATE.visible))).toBe(true);
  });

  it('es translúcido: la opacidad sube al aparecer y nunca llega a opaco', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, 20, AXOLOTL_STATE.appear, AXOLOTL_FADE_TIME);
    expect(axolotlAlpha(e)).toBeCloseTo(AXOLOTL_HIDDEN_ALPHA);
    e.timer = 0;
    expect(axolotlAlpha(e)).toBeCloseTo(AXOLOTL_VISIBLE_ALPHA);
    e.state = AXOLOTL_STATE.visible;
    expect(axolotlAlpha(e)).toBeLessThan(1);
  });

  it('escondido no hace daño ni se puede pisar', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, 20, AXOLOTL_STATE.hidden);
    world.player.shield = true;
    touchSide(world, e);
    dropOn(world, e);
    expect(world.player.shield).toBe(true);
    expect(e.dead).toBe(0);
  });

  it('visible se puede pisar', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, 20, AXOLOTL_STATE.visible);
    dropOn(world, e);
    expect(e.dead).toBeGreaterThan(0);
  });

  it('visible hace daño al tocarlo de lado', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, 20, AXOLOTL_STATE.visible);
    world.player.shield = true;
    touchSide(world, e);
    expect(world.player.shield).toBe(false);
  });

  it('el fuego lo vence visible pero lo atraviesa escondido', () => {
    const world = makeWorld();
    const hidden = spawnAxolotl(world, 14, AXOLOTL_STATE.hidden);
    fireballAt(world, hidden);
    world.update(STEP);
    expect(hidden.dead).toBe(0);
    const visible = spawnAxolotl(world, 24, AXOLOTL_STATE.visible);
    fireballAt(world, visible);
    world.update(STEP);
    expect(visible.dead).toBeGreaterThan(0);
  });

  it('nunca sale de su zona de agua', () => {
    const world = makeWorld();
    const e = spawnAxolotl(world, WATER_X1 - 1, AXOLOTL_STATE.visible, 100);
    e.vx = 1;
    step(world, e, 30);
    expect(e.x).toBeGreaterThanOrEqual(WATER_X0 * T);
    expect(e.x + e.w).toBeLessThanOrEqual((WATER_X1 + 1) * T);
  });
});
