import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import type { Op } from '../../level/types';
import type { EnemyId } from '../../types';
import { World } from '../../World';
import { updateFireballs } from '../projectiles';
import type { Enemy } from '../types';
import { HIDDEN_EXT, MORAY_STATE, morayLair, STRIKE_EXT } from './moray';
import { CROUCH_TIME, PIRATE_CRAB_STATE } from './pirateCrab';
import { createEnemy, ENEMIES, updateEnemies } from '.';

const silent = new AudioEngine();
silent.muted = true;

/** Columna de roca (col 50, filas 6-11) dentro de una zona de agua (cols 40-70, superficie 3). */
const OPS: readonly Op[] = [['col', 50, 6], ['water', 40, 70, 3]];
/** Fila de la grieta de prueba, en el agua junto a la columna de roca. */
const LAIR_ROW = 10;

function makeWorld(ops: readonly Op[] = OPS): World {
  const def = { id: 't', name: 'Prueba', width: 90, theme: 'mangrove' as const, ops };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

function spawn(world: World, id: EnemyId, tx: number, ty = GROUND - 1): Enemy {
  const e = createEnemy({ id, tx, ty });
  e.active = true;
  world.enemies.push(e);
  return e;
}

/** Coloca al jugador con su centro en el centro del bloque (tx, ty), quieto. */
function placePlayer(world: World, tx: number, ty: number): void {
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = ty * T + (T - p.h) / 2;
  p.vx = 0;
  p.vy = 0;
}

const step = (world: World, e: Enemy, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) {
    e.t += STEP;
    ENEMIES[e.id].move(e, world, STEP);
  }
};

/** Avanza hasta que el enemigo llega al estado pedido (o se agota el tiempo). */
function stepUntil(world: World, e: Enemy, state: number, maxSeconds = 5): void {
  for (let t = 0; t < maxSeconds && e.state !== state; t += STEP) step(world, e, STEP);
}

/** La caja del enemigo cae por completo dentro de bloques sólidos. */
function insideSolid(world: World, e: Enemy): boolean {
  const corners = [[e.x, e.y], [e.x + e.w - 1, e.y], [e.x, e.y + e.h - 1], [e.x + e.w - 1, e.y + e.h - 1]];
  return corners.every(([x, y]) => world.solid(Math.floor(x / T), Math.floor(y / T)));
}

describe('morena (moray)', () => {
  it('escondida queda dentro de la roca y no sale si el jugador está lejos', () => {
    const world = makeWorld();
    const e = spawn(world, 'moray', 51, LAIR_ROW);
    placePlayer(world, 68, 5);
    step(world, e, 3);
    expect(e.state).toBe(MORAY_STATE.hidden);
    expect(morayLair(e)?.ext).toBe(HIDDEN_EXT);
    expect(insideSolid(world, e)).toBe(true);
  });

  it('sale de la grieta hacia el agua abierta, muerde y vuelve a esconderse', () => {
    const world = makeWorld();
    const e = spawn(world, 'moray', 51, LAIR_ROW);
    placePlayer(world, 54, 8);
    stepUntil(world, e, MORAY_STATE.peek);
    expect(e.state).toBe(MORAY_STATE.peek);
    stepUntil(world, e, MORAY_STATE.retract);
    expect(morayLair(e)?.ext).toBe(STRIKE_EXT);
    // Sale hacia la derecha (la roca está a su izquierda) y a la altura de la grieta.
    expect(e.x).toBeGreaterThan(52 * T);
    expect(Math.floor((e.y + e.h / 2) / T)).toBe(LAIR_ROW);
    stepUntil(world, e, MORAY_STATE.hidden);
    expect(insideSolid(world, e)).toBe(true);
  });

  it('sin pared al lado, sale del fondo hacia arriba', () => {
    const world = makeWorld();
    const e = spawn(world, 'moray', 60, GROUND - 1);
    placePlayer(world, 62, 8);
    stepUntil(world, e, MORAY_STATE.retract);
    expect(morayLair(e)).toMatchObject({ dx: 0, dy: -1 });
    expect(e.y + e.h).toBeLessThan((GROUND - 1) * T);
  });

  it('no se puede pisar: tocarla fuera de la grieta hace daño', () => {
    const world = makeWorld();
    const e = spawn(world, 'moray', 51, LAIR_ROW);
    placePlayer(world, 54, 8);
    stepUntil(world, e, MORAY_STATE.retract);
    const p = world.player;
    p.x = e.x + e.w / 2 - p.w / 2;
    p.y = e.y - p.h + 6;
    p.vy = 300;
    updateEnemies(world, STEP);
    expect(e.dead).toBe(0);
    expect(world.phase).toBe('dying');
  });

  it('una bola de fuego la vence cuando está fuera', () => {
    const world = makeWorld();
    const e = spawn(world, 'moray', 51, LAIR_ROW);
    placePlayer(world, 54, 8);
    stepUntil(world, e, MORAY_STATE.retract);
    world.camX = 45 * T;
    world.fireballs.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, t: 0, gone: false });
    updateFireballs(world, STEP);
    expect(e.dead).toBeGreaterThan(0);
  });
});

describe('cangrejo pirata', () => {
  it('camina, se agacha y pega un brinco; luego vuelve a caminar', () => {
    const world = makeWorld([]);
    const e = spawn(world, 'pirateCrab', 30);
    stepUntil(world, e, PIRATE_CRAB_STATE.crouch);
    expect(e.state).toBe(PIRATE_CRAB_STATE.crouch);
    const groundY = e.y;
    step(world, e, CROUCH_TIME + 0.15);
    expect(e.state).toBe(PIRATE_CRAB_STATE.jump);
    expect(e.y).toBeLessThan(groundY - T / 2);
    stepUntil(world, e, PIRATE_CRAB_STATE.walk);
    expect(e.onGround).toBe(true);
    expect(e.y).toBe(groundY);
  });

  it('pisarlo lo vence', () => {
    const world = makeWorld([]);
    const e = spawn(world, 'pirateCrab', 30);
    step(world, e, 0.2);
    const p = world.player;
    p.x = e.x + e.w / 2 - p.w / 2;
    p.y = e.y - p.h + 6;
    p.vy = 300;
    updateEnemies(world, STEP);
    expect(e.dead).toBeGreaterThan(0);
  });
});
