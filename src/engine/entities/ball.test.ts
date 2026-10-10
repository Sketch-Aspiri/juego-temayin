import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { buildLevel } from '../level/build';
import type { LevelDef, Op } from '../level/types';
import type { EnemyId } from '../types';
import { World } from '../World';
import { BALL_BOUNCE_SPEED, BALL_MAX_BOUNCES, BALL_SIZE, updateBalls, type Ball } from './ball';
import { createEnemy } from './enemies';
import { HOOP_COINS, HOOP_SCORE, hoopCenter } from './hoops';
import type { Enemy } from './types';

const silent = new AudioEngine();
silent.muted = true;

const def = (ops: readonly Op[]): LevelDef => ({ id: 't', name: 'Prueba', width: 80, theme: 'ruins', ops });

function makeWorld(ops: readonly Op[] = []): { world: World; input: Input } {
  const input = new Input();
  const world = new World({ def: def(ops), session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  return { world, input };
}

function standAt(world: World, tx: number): void {
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = GROUND * T - p.h;
  p.vy = 0;
  p.onGround = true;
}

function ballAt(world: World, x: number, y: number, vx: number, vy: number): Ball {
  const b: Ball = { x, y, w: BALL_SIZE, h: BALL_SIZE, vx, vy, onGround: false, bounces: 0, t: 0, spin: 0, gone: false };
  world.balls.push(b);
  return b;
}

function spawn(world: World, id: EnemyId, tx: number, ty = GROUND - 1): Enemy {
  const e = createEnemy({ id, tx, ty });
  e.active = true;
  world.enemies.push(e);
  return e;
}

const runBalls = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) updateBalls(world, STEP);
};

/** Pulsa y suelta la tecla de disparo y avanza un paso. */
function fire(world: World, input: Input): void {
  input.press('fire');
  world.update(STEP);
  input.release('fire');
}

describe('pelota de pok ta pok: objeto', () => {
  it('el bloque P suelta la pelota y al recogerla el jugador la lleva', () => {
    const { world } = makeWorld([['row', 10, 8, 'P']]);
    world.hitBlock(10, 8);
    expect(world.tileAt(10, 8)).toBe('U');
    expect(world.items).toHaveLength(1);
    expect(world.items[0].kind).toBe('ball');
    standAt(world, 4);
    for (let t = 0; t < 1; t += STEP) world.update(STEP); // termina de salir del bloque
    const it = world.items[0];
    world.player.x = it.x;
    world.player.y = it.y;
    world.update(STEP);
    expect(world.player.ball).toBe(true);
    expect(world.hudState(0).ball).toBe(true);
  });
});

describe('pelota de pok ta pok: lanzamiento', () => {
  it('con pelota y chile, la tecla lanza primero la pelota y luego fuego', () => {
    const { world, input } = makeWorld();
    standAt(world, 10);
    world.player.ball = true;
    world.player.fire = true;
    fire(world, input);
    expect(world.balls).toHaveLength(1);
    expect(world.fireballs).toHaveLength(0);
    fire(world, input);
    expect(world.balls).toHaveLength(1);
    expect(world.fireballs).toHaveLength(1);
  });

  it('sin pelota la tecla sigue lanzando bolas de fuego', () => {
    const { world, input } = makeWorld();
    standAt(world, 10);
    world.player.fire = true;
    fire(world, input);
    expect(world.balls).toHaveLength(0);
    expect(world.fireballs).toHaveLength(1);
  });

  it('sin pelota ni chile no lanza nada', () => {
    const { world, input } = makeWorld();
    standAt(world, 10);
    fire(world, input);
    expect(world.balls).toHaveLength(0);
    expect(world.fireballs).toHaveLength(0);
  });
});

describe('pelota de pok ta pok: rebotes', () => {
  it('rebota en el suelo y sube con BALL_BOUNCE_SPEED', () => {
    const { world } = makeWorld();
    const b = ballAt(world, 10 * T, GROUND * T - BALL_SIZE - 2, 0, 300);
    for (let i = 0; i < 10 && b.bounces === 0; i++) updateBalls(world, STEP);
    expect(b.bounces).toBe(1);
    expect(b.vy).toBe(-BALL_BOUNCE_SPEED);
  });

  it('un bote desde el suelo alcanza el centro de un aro en la fila 8', () => {
    const { world } = makeWorld();
    const b = ballAt(world, 10 * T, GROUND * T - BALL_SIZE - 2, 0, 300);
    let top = Infinity;
    for (let t = 0; t < 0.6; t += STEP) {
      updateBalls(world, STEP);
      top = Math.min(top, b.y + b.h / 2);
    }
    expect(top).toBeLessThanOrEqual(8 * T + T / 2);
  });

  it('rebota en las paredes invirtiendo su velocidad horizontal', () => {
    const { world } = makeWorld([['col', 14, 6]]);
    const b = ballAt(world, 13 * T, 9 * T, 400, 0);
    runBalls(world, 0.2);
    expect(b.vx).toBeLessThan(0);
    expect(b.bounces).toBeGreaterThanOrEqual(1);
  });

  it('se deshace tras BALL_MAX_BOUNCES rebotes', () => {
    const { world } = makeWorld();
    ballAt(world, 10 * T, GROUND * T - BALL_SIZE - 2, 0, 300);
    runBalls(world, (BALL_MAX_BOUNCES + 1) * ((2 * BALL_BOUNCE_SPEED) / 1400) + 0.5);
    expect(world.balls).toHaveLength(0);
  });
});

describe('pelota de pok ta pok: golpes', () => {
  it('derriba a un enemigo y rebota hacia atrás', () => {
    const { world } = makeWorld();
    const e = spawn(world, 'coati', 20);
    const b = ballAt(world, e.x - BALL_SIZE - 4, e.y + 4, 400, 0);
    runBalls(world, 0.1);
    expect(e.dead).toBeGreaterThan(0);
    expect(b.vx).toBeLessThan(0);
  });

  it('atraviesa a las sombras de Xibalbá sin dañarlas', () => {
    const { world } = makeWorld();
    const e = spawn(world, 'shade', 20, 8);
    ballAt(world, e.x - BALL_SIZE - 4, e.y + 4, 400, 0);
    runBalls(world, 0.1);
    expect(e.dead).toBe(0);
  });
});

describe('aros del juego de pelota', () => {
  it('la op hoop crea un aro y suma su cacao al total del nivel', () => {
    const base = buildLevel(def([['coins', 5, 9, 3]]));
    const lvl = buildLevel(def([['coins', 5, 9, 3], ['hoop', 15, 8]]));
    expect(lvl.hoops).toEqual([{ x: 15, y: 8 }]);
    expect(lvl.totalCoins).toBe(base.totalCoins + HOOP_COINS);
    // El aro no es sólido: no toca la cuadrícula.
    expect(lvl.grid[8][15]).toBe(' ');
  });

  it('pasar la pelota por el centro enciende el aro una sola vez', () => {
    const { world } = makeWorld([['hoop', 15, 8]]);
    const hoop = world.hoops[0];
    const c = hoopCenter(hoop);
    ballAt(world, c.x - 40, c.y - BALL_SIZE / 2, 420, 0);
    runBalls(world, 0.2);
    expect(hoop.lit).toBe(true);
    expect(world.session.coins).toBe(HOOP_COINS);
    expect(world.coinsCollected).toBe(HOOP_COINS);
    expect(world.session.score).toBe(HOOP_SCORE + HOOP_COINS * 100);

    ballAt(world, c.x - 40, c.y - BALL_SIZE / 2, 420, 0);
    runBalls(world, 0.2);
    expect(world.session.coins).toBe(HOOP_COINS);
  });

  it('una pelota que pasa lejos del centro no lo enciende', () => {
    const { world } = makeWorld([['hoop', 15, 8]]);
    const c = hoopCenter(world.hoops[0]);
    ballAt(world, c.x - 40, c.y - T, 420, 0);
    runBalls(world, 0.1);
    expect(world.hoops[0].lit).toBe(false);
  });
});
