import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, ROWS, START_LIVES, STEP, STROMATOLITE_GRACE, STROMATOLITE_PENALTY, T } from '../constants';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { isSolidTile } from '../tiles';
import { World } from '../World';

const silent = new AudioEngine();
silent.muted = true;

const START_SCORE = 2000;

/** Tramo de 3 bloques sobre el suelo (10..12) y otro en el lecho de un foso con agua (30..32). */
const DEF: LevelDef = {
  id: 'prueba-estromatolitos',
  name: 'Prueba de estromatolitos',
  width: 70,
  theme: 'lagoon',
  ops: [
    ['stromatolite', 10, GROUND - 1, 3],
    ['pit', 28, 36],
    ['water', 28, 36, 6],
    ['stromatolite', 30, ROWS - 1, 3],
    ['flag', 65],
  ],
};

const make = (score = START_SCORE) => {
  const world = new World({ def: DEF, session: { score, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
  world.enemies = [];
  return world;
};

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

/** Pone al jugador de pie sobre la fila `row` en la columna `tx`. */
const standOn = (world: World, tx: number, row: number): void => {
  const p = world.player;
  p.x = tx * T + 4;
  p.y = row * T - p.h - 1;
  p.vx = 0;
  p.vy = 0;
};

describe('estromatolitos', () => {
  it('la op escribe bloques sólidos E y registra el tramo', () => {
    const world = make();
    expect(world.level.stromatolites).toEqual([{ x: 10, y: GROUND - 1, len: 3 }, { x: 30, y: ROWS - 1, len: 3 }]);
    expect(world.tileAt(11, GROUND - 1)).toBe('E');
    expect(isSolidTile('E')).toBe(true);
  });

  it('no daña si el jugador solo roza el tramo menos del margen de gracia', () => {
    const world = make();
    standOn(world, 11, GROUND - 1);
    run(world, STROMATOLITE_GRACE / 2);
    standOn(world, 5, GROUND); // sale del tramo antes de agotar la gracia
    run(world, STROMATOLITE_GRACE * 2);
    expect(world.session.score).toBe(START_SCORE);
  });

  it('resta puntos una sola vez por tramo, con aviso y sonido, y sin quitar vida', () => {
    // Organizar
    const world = make();
    const play = vi.spyOn(world.audio, 'play');
    standOn(world, 11, GROUND - 1);
    // Actuar
    run(world, STROMATOLITE_GRACE + 0.05);
    const warned = world.popups.some((pop) => /estromatolito/i.test(pop.txt)); // el aviso dura poco
    const afterFirst = world.session.score;
    run(world, 2);
    // Comprobar
    expect(afterFirst).toBe(START_SCORE - STROMATOLITE_PENALTY);
    expect(world.session.score).toBe(afterFirst);
    expect(world.session.lives).toBe(START_LIVES);
    expect(world.phase).toBe('play');
    expect(warned).toBe(true);
    expect(play).toHaveBeenCalledWith('hurt');
    expect(world.stromatolites[0].damaged).toBe(true);
  });

  it('nunca baja de 0 puntos', () => {
    const world = make(STROMATOLITE_PENALTY / 5);
    standOn(world, 11, GROUND - 1);
    run(world, STROMATOLITE_GRACE + 0.3);
    expect(world.session.score).toBe(0);
  });

  it('también daña al apoyarse nadando sobre el lecho', () => {
    const world = make();
    const p = world.player;
    p.x = 31 * T + 4;
    p.y = 9 * T;
    p.vx = 0;
    p.vy = 0;
    run(world, 3);
    expect(p.swimming).toBe(true);
    expect(world.stromatolites[1].damaged).toBe(true);
    expect(world.session.score).toBe(START_SCORE - STROMATOLITE_PENALTY);
  });

  it('un tramo dañado no afecta a los demás', () => {
    const world = make();
    standOn(world, 11, GROUND - 1);
    run(world, STROMATOLITE_GRACE + 0.3);
    expect(world.stromatolites[1].damaged).toBe(false);
  });
});
