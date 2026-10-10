import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../data/worlds';
import { AudioEngine } from './audio';
import { START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

const silent = new AudioEngine();
silent.muted = true;

const make = (levelId: string, fromCheckpoint = false) => {
  const def = ALL_LEVELS.find((l) => l.id === levelId);
  if (!def) throw new Error(`nivel ${levelId} no existe`);
  const input = new Input();
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent, fromCheckpoint });
  return { world, input };
};

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

describe('World', () => {
  it('el jugador cae al suelo y queda apoyado', () => {
    const { world } = make('1-1');
    run(world, 1);
    expect(world.player.onGround).toBe(true);
    expect(world.phase).toBe('play');
  });

  it('avanza a la derecha y la cámara lo sigue', () => {
    const { world, input } = make('1-1');
    input.press('right');
    input.press('run');
    run(world, 2);
    expect(world.player.x).toBeGreaterThan(3 * T + 200);
    expect(world.camX).toBeGreaterThan(0);
  });

  it('saltar consume la pulsación y despega al jugador', () => {
    const { world, input } = make('1-1');
    run(world, 0.5);
    const groundY = world.player.y;
    input.press('jump');
    run(world, 0.2);
    expect(world.player.y).toBeLessThan(groundY - 20);
  });

  it('golpear un bloque ? desde abajo suma una moneda', () => {
    const { world } = make('1-1');
    world.hitBlock(15, 8);
    expect(world.session.coins).toBe(1);
    expect(world.tileAt(15, 8)).toBe('U');
    expect(world.session.score).toBe(100);
  });

  it('100 monedas dan una vida extra', () => {
    const { world } = make('1-1');
    world.session.coins = 99;
    world.addCoin(0, 0);
    expect(world.session.coins).toBe(0);
    expect(world.session.lives).toBe(START_LIVES + 1);
  });

  it('el daño sin escudo mata y con escudo solo lo quita', () => {
    const { world } = make('1-1');
    world.player.shield = true;
    world.hurt();
    expect(world.player.shield).toBe(false);
    expect(world.phase).toBe('play');
    world.player.inv = 0;
    world.hurt();
    expect(world.phase).toBe('dying');
  });

  it('caer a un hoyo provoca la muerte', () => {
    const { world, input } = make('1-1');
    input.press('right');
    input.press('run');
    // Sin saltar, el jugador acaba cayendo en el primer hoyo (columna 50).
    run(world, 12);
    expect(world.phase).toBe('dying');
  });

  it('reaparece en el punto de control con los enemigos de delante', () => {
    const { world } = make('1-1', true);
    expect(world.player.x).toBeGreaterThanOrEqual(world.checkpointTile * T);
    expect(world.enemies.every((e) => e.x > world.player.x)).toBe(true);
  });

  it('la sala del jefe despierta a Púas al entrar en la arena', () => {
    const { world } = make('1-6');
    expect(world.boss?.hudVisible).toBe(false);
    world.player.x = 55 * T;
    world.update(STEP);
    expect(world.boss?.intro).toBe(true);
    expect(world.boss?.lockCamera).toBe(true);
  });

  it('una bola de fuego mata a un coatí', () => {
    const { world, input } = make('1-1');
    run(world, 0.3);
    const target = world.enemies[0];
    target.active = true;
    world.player.fire = true;
    target.x = world.player.x + 100;
    target.y = world.player.y + world.player.h - target.h;
    input.press('fire');
    run(world, 0.6);
    expect(target.dead).toBeGreaterThan(0);
  });
});
