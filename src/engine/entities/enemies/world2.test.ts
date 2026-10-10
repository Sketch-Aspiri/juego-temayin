import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import type { EnemyId } from '../../types';
import { World } from '../../World';
import type { Enemy } from '../types';
import { ALUX_FLEE_SPEED, ALUX_FLEE_TIME, ALUX_RETURN_FACTOR, ALUX_STATE, ALUX_STEAL, aluxLoot } from './alux';
import { SHADE_NOTICE_RANGE, SHADE_STATE } from './shade';
import { createEnemy, ENEMIES, isAirborne, updateEnemies } from '.';

const silent = new AudioEngine();
silent.muted = true;

function makeWorld(coins = 0): World {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'ruins' as const, ops: [['plat', 20, 8, 5]] as const };
  return new World({ def, session: { score: 0, coins, lives: START_LIVES }, input: new Input(), audio: silent });
}

function spawn(world: World, id: EnemyId, tx: number, ty = GROUND - 1): Enemy {
  const e = createEnemy({ id, tx, ty });
  e.active = true;
  world.enemies.push(e);
  return e;
}

function placePlayer(world: World, tx: number): void {
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = GROUND * T - p.h;
  p.vy = 0;
  p.onGround = true;
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

describe('sombra de Xibalbá (shade)', () => {
  it('flota y no necesita suelo', () => {
    expect(isAirborne('shade')).toBe(true);
  });

  it('flota en su sitio mientras el jugador está lejos', () => {
    const world = makeWorld();
    const e = spawn(world, 'shade', 60, 6);
    placePlayer(world, 5);
    const x0 = e.x;
    step(world, e, 2);
    expect(e.state).toBe(SHADE_STATE.idle);
    expect(e.x).toBe(x0);
  });

  it('deriva hacia el jugador al acercarse, atravesando bloques', () => {
    const world = makeWorld();
    const e = spawn(world, 'shade', 30, 8);
    placePlayer(world, 30 - Math.floor(SHADE_NOTICE_RANGE / T) + 1);
    const d0 = Math.abs(world.player.x - e.x);
    step(world, e, 2);
    expect(e.state).toBe(SHADE_STATE.drift);
    expect(Math.abs(world.player.x - e.x)).toBeLessThan(d0);
  });

  it('no se puede pisar: pisarla hace daño', () => {
    const world = makeWorld();
    const e = spawn(world, 'shade', 30, 8);
    world.player.shield = true;
    dropOn(world, e);
    expect(e.dead).toBe(0);
    expect(world.player.shield).toBe(false);
  });

  it('el fuego la disuelve', () => {
    const world = makeWorld();
    const e = spawn(world, 'shade', 30, 8);
    world.camX = 20 * T;
    world.fireballs.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, t: 0, gone: false });
    world.update(STEP);
    expect(e.dead).toBeGreaterThan(0);
  });
});

/** Hace que el jugador (en el suelo) toque al alux de lado. */
function touchSide(world: World, e: Enemy): void {
  const p = world.player;
  p.x = e.x - p.w + 4;
  p.y = GROUND * T - p.h;
  p.vy = 0;
  updateEnemies(world, STEP);
}

describe('alux', () => {
  it('al tocarlo roba cacao sin quitar vida ni escudo y huye', () => {
    const world = makeWorld(12);
    const e = spawn(world, 'alux', 30);
    world.player.shield = true;
    touchSide(world, e);
    expect(world.session.coins).toBe(12 - ALUX_STEAL);
    expect(aluxLoot(e)).toBe(ALUX_STEAL);
    expect(world.player.shield).toBe(true);
    expect(world.phase).toBe('play');
    expect(e.state).toBe(ALUX_STATE.flee);
    expect(e.vx).toBeGreaterThan(0); // huye alejándose del jugador (que está a su izquierda)
  });

  it('no roba más de lo que tienes ni dos veces seguidas', () => {
    const world = makeWorld(2);
    const e = spawn(world, 'alux', 30);
    touchSide(world, e);
    touchSide(world, e);
    expect(world.session.coins).toBe(0);
    expect(aluxLoot(e)).toBe(2);
  });

  it('huye más rápido de lo que camina y luego sigue con el botín', () => {
    const world = makeWorld(10);
    const e = spawn(world, 'alux', 30);
    touchSide(world, e);
    const x0 = e.x;
    step(world, e, 0.5);
    expect(e.x - x0).toBeGreaterThan(ALUX_FLEE_SPEED * 0.4);
    step(world, e, ALUX_FLEE_TIME);
    expect(e.state).toBe(ALUX_STATE.carry);
  });

  it('pisarlo devuelve el doble de lo robado sin inflar el cacao del nivel', () => {
    const world = makeWorld(10);
    const e = spawn(world, 'alux', 30);
    touchSide(world, e);
    const collected = world.coinsCollected;
    dropOn(world, e);
    expect(e.dead).toBeGreaterThan(0);
    expect(world.session.coins).toBe(10 - ALUX_STEAL + ALUX_STEAL * ALUX_RETURN_FACTOR);
    expect(world.coinsCollected).toBe(collected);
  });

  it('no se cae de las cornisas', () => {
    const world = makeWorld();
    const e = spawn(world, 'alux', 22, 7);
    e.vx = 60;
    step(world, e, 4);
    expect(e.y).toBeLessThan(8 * T);
  });
});
