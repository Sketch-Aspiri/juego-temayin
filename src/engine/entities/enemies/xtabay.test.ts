import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { updateFireballs } from '../projectiles';
import { World } from '../../World';
import type { Enemy } from '../types';
import { CLOSED_TIME, LURE_SPEED, STILL_TIME, XTABAY_STATE } from './xtabay';
import { createEnemy, ENEMIES, updateEnemies } from '.';

const silent = new AudioEngine();
silent.muted = true;

const TREE_X = 15;

function setup(): { world: World; input: Input; e: Enemy } {
  const def = { id: 't', name: 'Prueba', width: 60, theme: 'jungle' as const, ops: [] };
  const input = new Input();
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  world.enemies = [];
  const e = createEnemy({ id: 'xtabay', tx: TREE_X, ty: GROUND - 1 });
  e.active = true;
  world.enemies.push(e);
  return { world, input, e };
}

/** Jugador de pie, quieto, en la columna dada. */
function placePlayer(world: World, tx: number): void {
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = GROUND * T - p.h;
  p.vx = 0;
  p.vy = 0;
  p.onGround = true;
}

/** Simula solo a la xtabay (el jugador no se mueve por sí mismo). */
function step(world: World, e: Enemy, seconds: number): void {
  for (let t = 0; t < seconds; t += STEP) {
    e.t += STEP;
    ENEMIES.xtabay.move(e, world, STEP);
  }
}

describe('xtabay', () => {
  it('es una trampa fija que no se puede pisar', () => {
    expect(ENEMIES.xtabay.stompable).toBe(false);
    const { world, e } = setup();
    const x0 = e.x;
    step(world, e, 3);
    expect(e.x).toBe(x0);
  });

  it('atrae suavemente al jugador que se queda quieto cerca', () => {
    const { world, e } = setup();
    placePlayer(world, TREE_X + 3);
    const x0 = world.player.x;
    step(world, e, STILL_TIME + 0.05);
    expect(e.state).toBe(XTABAY_STATE.lure);
    step(world, e, 0.5);
    const pulled = x0 - world.player.x;
    expect(pulled).toBeGreaterThan(0);
    expect(pulled).toBeLessThanOrEqual(LURE_SPEED * 0.6);
  });

  it('acaba lanzando la raíz con espinas y hace daño al jugador quieto', () => {
    const { world, e } = setup();
    placePlayer(world, TREE_X + 2);
    step(world, e, STILL_TIME + 3);
    expect(world.phase).toBe('dying');
  });

  it('el jugador se libra moviéndose o saltando', () => {
    const { world, input, e } = setup();
    placePlayer(world, TREE_X + 3);
    step(world, e, STILL_TIME + 0.1);
    expect(e.state).toBe(XTABAY_STATE.lure);
    input.press('right');
    step(world, e, 0.05);
    expect(e.state).toBe(XTABAY_STATE.rest);
    const x = world.player.x;
    step(world, e, 1);
    expect(world.player.x).toBe(x);
    expect(world.phase).toBe('play');
  });

  it('no atrae a un jugador lejano', () => {
    const { world, e } = setup();
    placePlayer(world, TREE_X + 8);
    step(world, e, STILL_TIME * 3);
    expect(e.state).toBe(XTABAY_STATE.rest);
  });

  it('el fuego le cierra las flores un rato en vez de matarla', () => {
    const { world, e } = setup();
    placePlayer(world, TREE_X + 3);
    world.fireballs.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, t: 0, gone: false });
    updateFireballs(world, STEP);
    expect(e.dead).toBe(0);
    expect(e.state).toBe(XTABAY_STATE.closed);
    expect(world.fireballs).toHaveLength(0);
    step(world, e, CLOSED_TIME - 0.5);
    expect(e.state).toBe(XTABAY_STATE.closed);
    step(world, e, 1);
    expect(e.state).toBe(XTABAY_STATE.rest);
  });

  it('tocar su base con espinas hace daño, aunque caiga desde arriba', () => {
    const { world, e } = setup();
    const p = world.player;
    p.x = e.x + e.w / 2 - p.w / 2;
    p.y = e.y - p.h + 6;
    p.vy = 300;
    updateEnemies(world, STEP);
    expect(world.phase).toBe('dying');
  });
});
