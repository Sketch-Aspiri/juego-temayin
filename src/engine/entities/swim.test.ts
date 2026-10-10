import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, MAX_SINK_SPEED, OXYGEN_MAX, ROWS, SNORKEL_TIME, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { World } from '../World';

const silent = new AudioEngine();
silent.muted = true;

/**
 * Nivel de prueba:
 *  - 10..20: hoyo con agua profunda (superficie fila 8, 6 filas) y burbujas en (18, 12).
 *  - 22..26: agua poco profunda sobre el suelo (superficie fila 11): la cabeza queda fuera.
 *  - 30..40: río sobre lecho firme (superficie 9, 3 filas) con corriente en 30..34
 *            una cornisa sin aire debajo en 36..38 (fila 8) y una orilla de 1 bloque
 *            sobre la superficie en 41..44.
 */
const DEF: LevelDef = {
  id: 'prueba-agua',
  name: 'Prueba de agua',
  width: 70,
  theme: 'river',
  ops: [
    ['pit', 10, 20],
    ['water', 10, 20, 8],
    ['bubbles', 18, 12],
    ['water', 22, 26, 11],
    ['water', 30, 40, 9],
    ['current', 30, 34, 9, 11, 2, 0],
    ['plat', 36, 8, 3],
    ['col', 41, 4],
    ['col', 42, 4],
    ['col', 43, 4],
    ['col', 44, 4],
    ['spawn', 'barracuda', 12, 10],
    ['flag', 60],
  ],
};

const make = (def: LevelDef = DEF) => {
  const input = new Input();
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  world.enemies = [];
  return { world, input };
};

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

/** Coloca al jugador con la parte de arriba del cuerpo en (tx, ty) en bloques. */
const place = (world: World, tx: number, ty: number): void => {
  const p = world.player;
  p.x = tx * T + 2;
  p.y = ty * T;
  p.vx = 0;
  p.vy = 0;
};

describe('nado y oxígeno', () => {
  it('se hunde más despacio en el agua que en el aire', () => {
    const { world } = make();
    place(world, 14, 9);
    const y0 = world.player.y;
    run(world, 0.5);
    const sunk = world.player.y - y0;
    expect(world.player.swimming).toBe(true);
    expect(world.player.vy).toBeLessThanOrEqual(MAX_SINK_SPEED);
    // En caída libre recorrería ~275 px en 0,5 s.
    expect(sunk).toBeGreaterThan(0);
    expect(sunk).toBeLessThan(MAX_SINK_SPEED * 0.5 + 1);
  });

  it('una brazada hace subir al jugador', () => {
    const { world, input } = make();
    place(world, 14, 10);
    run(world, 0.2);
    const y0 = world.player.y;
    input.press('jump');
    run(world, 0.2);
    expect(world.player.y).toBeLessThan(y0 - 20);
  });

  it('el fondo de un hoyo con agua no mata: el jugador reposa en el lecho', () => {
    const { world } = make();
    place(world, 14, 11);
    run(world, 2);
    expect(world.phase).toBe('play');
    expect(world.player.y + world.player.h).toBeLessThanOrEqual(ROWS * T);
  });

  it('muere al agotar el oxígeno bajo el agua', () => {
    const { world } = make();
    place(world, 12, 11);
    run(world, OXYGEN_MAX - 0.5);
    expect(world.phase).toBe('play');
    expect(world.player.oxygen).toBeLessThan(1);
    run(world, 1);
    expect(world.phase).toBe('dying');
  });

  it('recupera oxígeno con la cabeza fuera del agua', () => {
    const { world } = make();
    place(world, 24, GROUND - 2);
    world.player.oxygen = 2;
    run(world, 1.5);
    expect(world.player.swimming).toBe(true);
    expect(world.player.oxygen).toBe(OXYGEN_MAX);
  });

  it('bajo una cornisa a ras de la superficie no se respira', () => {
    const { world, input } = make();
    place(world, 37, 10);
    world.player.oxygen = 5;
    for (let i = 0; i < 6; i++) {
      input.press('jump');
      run(world, 0.05);
      input.release('jump');
      run(world, 0.25);
    }
    expect(world.player.y).toBeGreaterThanOrEqual(9 * T);
    expect(world.player.oxygen).toBeLessThan(5);
  });

  it('las burbujas recargan oxígeno bajo el agua', () => {
    const { world } = make();
    place(world, 18, 11);
    world.player.oxygen = 2;
    run(world, 1);
    expect(world.player.oxygen).toBeGreaterThan(2);
  });

  it('el snorkel congela el consumo de oxígeno', () => {
    const { world } = make();
    place(world, 12, 11);
    world.player.snorkel = SNORKEL_TIME;
    run(world, 3);
    expect(world.player.oxygen).toBe(OXYGEN_MAX);
    expect(world.player.snorkel).toBeLessThan(SNORKEL_TIME);
  });

  it('la corriente empuja a un jugador quieto', () => {
    const { world } = make();
    place(world, 31, 10);
    const x0 = world.player.x;
    run(world, 1);
    // 2 bloques/s durante 1 s.
    expect(world.player.x - x0).toBeGreaterThan(1.5 * T);
  });

  it('sale del río a una orilla de 1 bloque sobre la superficie', () => {
    const { world, input } = make();
    place(world, 39, 10);
    input.press('right');
    const p = world.player;
    for (let i = 0; i < 8 && !(p.onGround && p.y + p.h <= 8 * T); i++) {
      input.press('jump');
      run(world, 0.05);
      input.release('jump');
      for (let k = 0; k < 12 && !(p.onGround && p.y + p.h <= 8 * T); k++) run(world, STEP * 3);
    }
    input.release('right');
    run(world, 0.2);
    expect(p.swimming).toBe(false);
    expect(p.onGround).toBe(true);
    expect(p.y + p.h).toBeLessThanOrEqual(8 * T);
  });

  it('el HUD solo muestra el oxígeno dentro del agua', () => {
    const { world } = make();
    run(world, 0.5);
    expect(world.hudState(0).oxygen).toBeNull();
    place(world, 12, 11);
    run(world, 1);
    const ox = world.hudState(0).oxygen;
    expect(ox).not.toBeNull();
    expect(ox).toBeLessThan(1);
  });

  it('los enemigos nadadores no salen del agua', () => {
    const def: LevelDef = { ...DEF, ops: DEF.ops };
    const input = new Input();
    const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
    const fish = world.enemies.find((e) => e.id === 'barracuda');
    expect(fish).toBeDefined();
    world.player.inv = 99;
    run(world, 6);
    if (!fish || !fish.alive) return;
    const cx = fish.x + fish.w / 2;
    expect(cx).toBeGreaterThanOrEqual(10 * T);
    expect(cx).toBeLessThan(21 * T);
    expect(fish.y).toBeGreaterThanOrEqual(8 * T);
  });
});
