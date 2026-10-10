import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import type { Op } from '../../level/types';
import type { EnemyId } from '../../types';
import { World } from '../../World';
import type { Enemy } from '../types';
import { ANT_COUNT, ANT_SPACING, antsLeft } from './ants';
import { BARRACUDA_STATE, DART_SPEED } from './barracuda';
import { CLAWS_DOWN_TIME, CRAB_STATE } from './blueCrab';
import { arcVelocity, HOWLER_STATE } from './howler';
import { NAUYACA_STATE, LUNGE_DISTANCE } from './nauyaca';
import { TARANTULA_STATE } from './tarantula';
import { createEnemy, ENEMIES, updateEnemies } from '.';

const silent = new AudioEngine();
silent.muted = true;

/** Nivel plano de prueba: saliente en la fila 8 (cols 20-24) y una poza (cols 40-45). */
const OPS: readonly Op[] = [['plat', 20, 8, 5], ['pit', 40, 45], ['water', 40, 45, 11]];

function makeWorld(ops: readonly Op[] = OPS): World {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'jungle' as const, ops };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

function spawn(world: World, id: EnemyId, tx: number, ty = GROUND - 1): Enemy {
  const e = createEnemy({ id, tx, ty });
  e.active = true;
  world.enemies.push(e);
  return e;
}

/** Coloca al jugador de pie en la columna dada (sobre el suelo). */
function placePlayer(world: World, tx: number): void {
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = GROUND * T - p.h;
  p.vy = 0;
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

describe('saraguato (howler)', () => {
  it('grita y lanza un fruto hacia el jugador cuando está en alcance', () => {
    const world = makeWorld();
    const e = spawn(world, 'howler', 30);
    placePlayer(world, 24);
    step(world, e, 0.5);
    expect(e.state).toBe(HOWLER_STATE.howl);
    expect(world.quills).toHaveLength(0);
    step(world, e, 0.6);
    expect(world.quills).toHaveLength(1);
    expect(world.quills[0].vx).toBeLessThan(0);
    expect(world.quills[0].vy).toBeLessThan(0);
  });

  it('no lanza si el jugador está lejos y no se mueve de su sitio', () => {
    const world = makeWorld();
    const e = spawn(world, 'howler', 60);
    placePlayer(world, 5);
    const x0 = e.x;
    step(world, e, 3);
    expect(world.quills).toHaveLength(0);
    expect(e.x).toBe(x0);
  });

  it('se queda en su rama sin caerse al mirar al jugador', () => {
    const world = makeWorld();
    const e = spawn(world, 'howler', 22, 7);
    placePlayer(world, 10);
    step(world, e, 3);
    expect(e.onGround).toBe(true);
    expect(e.y + e.h).toBe(8 * T);
    expect(e.vx).toBeLessThan(0);
  });

  it('la parábola del fruto pasa por el objetivo', () => {
    const { vx, vy } = arcVelocity(-200, 40);
    let x = 0;
    let y = 0;
    let svy = vy;
    let best = Infinity;
    for (let t = 0; t < 3; t += STEP) {
      svy += 900 * STEP;
      x += vx * STEP;
      y += svy * STEP;
      best = Math.min(best, Math.hypot(x + 200, y - 40));
    }
    expect(best).toBeLessThan(8);
  });
});

describe('tarántula', () => {
  it('aparece en el suelo y sube a colgarse del saliente de encima', () => {
    const world = makeWorld();
    const e = spawn(world, 'tarantula', 22);
    placePlayer(world, 5);
    step(world, e, 0.2);
    expect(e.state).toBe(TARANTULA_STATE.hang);
    expect(e.baseY).toBe(9 * T);
    expect(e.y + e.h).toBeLessThan(GROUND * T - world.player.h);
  });

  it('se deja caer cuando el jugador pasa por debajo y luego camina', () => {
    const world = makeWorld();
    const e = spawn(world, 'tarantula', 22);
    placePlayer(world, 5);
    step(world, e, 0.5);
    expect(e.state).toBe(TARANTULA_STATE.hang);
    placePlayer(world, 22);
    step(world, e, 1);
    expect(e.state).toBe(TARANTULA_STATE.walk);
    expect(e.y + e.h).toBe(GROUND * T);
    expect(e.vx).not.toBe(0);
  });

  it('sin techo encima, simplemente camina', () => {
    const world = makeWorld();
    const e = spawn(world, 'tarantula', 30);
    placePlayer(world, 5);
    step(world, e, 0.2);
    expect(e.state).toBe(TARANTULA_STATE.walk);
  });
});

describe('nauyaca', () => {
  it('espera oculta mientras el jugador está lejos', () => {
    const world = makeWorld();
    const e = spawn(world, 'nauyaca', 30);
    placePlayer(world, 10);
    const x0 = e.x;
    step(world, e, 2);
    expect(e.state).toBe(NAUYACA_STATE.hidden);
    expect(e.x).toBe(x0);
  });

  it('se yergue, se lanza en corto (no pisable) y vuelve a su escondite', () => {
    const world = makeWorld();
    const e = spawn(world, 'nauyaca', 30);
    const home = e.x;
    placePlayer(world, 27);
    step(world, e, 0.1);
    expect(e.state).toBe(NAUYACA_STATE.rear);
    expect(ENEMIES.nauyaca.canStomp?.(e)).toBe(false);
    let farthest = 0;
    for (let i = 0; i < 60; i++) {
      step(world, e, 0.01);
      farthest = Math.max(farthest, home - e.x);
    }
    expect(farthest).toBeGreaterThan(T);
    expect(farthest).toBeLessThanOrEqual(LUNGE_DISTANCE + 1);
    placePlayer(world, 5);
    step(world, e, 4);
    expect(e.x).toBe(home);
    expect(ENEMIES.nauyaca.canStomp?.(e)).toBe(true);
  });
});

describe('hormigas arrieras', () => {
  it('cada pisotón aplasta una hormiga; la última mata la fila', () => {
    const world = makeWorld();
    const e = spawn(world, 'ants', 30);
    expect(e.w).toBe(ANT_COUNT * ANT_SPACING);
    dropOn(world, e);
    expect(antsLeft(e)).toBe(ANT_COUNT - 1);
    expect(e.w).toBe((ANT_COUNT - 1) * ANT_SPACING);
    expect(e.dead).toBe(0);
    expect(world.player.vy).toBeLessThan(0);
    // Justo tras rebotar sigue tocándolas al subir: no debe dañar.
    updateEnemies(world, STEP);
    expect(world.phase).toBe('play');
    for (let i = 1; i < ANT_COUNT; i++) dropOn(world, e);
    expect(e.dead).toBeGreaterThan(0);
    expect(world.phase).toBe('play');
  });
});

describe('cangrejo azul', () => {
  it('alterna pinzas bajas (pisable) y en alto (no pisable)', () => {
    const world = makeWorld();
    const e = spawn(world, 'blueCrab', 30);
    placePlayer(world, 5);
    step(world, e, STEP);
    expect(e.state).toBe(CRAB_STATE.walk);
    expect(ENEMIES.blueCrab.canStomp?.(e)).toBe(true);
    step(world, e, CLAWS_DOWN_TIME + 0.05);
    expect(e.state).toBe(CRAB_STATE.clawsUp);
    expect(ENEMIES.blueCrab.canStomp?.(e)).toBe(false);
  });

  it('pisarlo con las pinzas en alto hace daño', () => {
    const world = makeWorld();
    const e = spawn(world, 'blueCrab', 30);
    e.state = CRAB_STATE.clawsUp;
    e.timer = 1;
    dropOn(world, e);
    expect(e.dead).toBe(0);
    expect(world.phase).toBe('dying');
  });

  it('pisarlo con las pinzas bajas lo vence', () => {
    const world = makeWorld();
    const e = spawn(world, 'blueCrab', 30);
    e.state = CRAB_STATE.walk;
    e.timer = 1;
    dropOn(world, e);
    expect(e.dead).toBeGreaterThan(0);
  });
});

describe('barracuda', () => {
  it('patrulla sin salir de su zona de agua', () => {
    const world = makeWorld();
    const e = spawn(world, 'barracuda', 42, 12);
    placePlayer(world, 5);
    for (let i = 0; i < 1200; i++) {
      step(world, e, STEP);
      expect(e.x).toBeGreaterThanOrEqual(40 * T);
      expect(e.x + e.w).toBeLessThanOrEqual(46 * T);
      expect(Math.abs(e.y - e.baseY)).toBeLessThanOrEqual(3);
    }
  });

  it('embiste cuando el jugador queda alineado delante', () => {
    const world = makeWorld();
    const e = spawn(world, 'barracuda', 45, 12);
    e.vx = -90;
    const p = world.player;
    p.x = 41 * T;
    p.y = e.y + e.h / 2 - p.h / 2;
    const x0 = e.x;
    step(world, e, STEP * 4);
    expect(e.state).toBe(BARRACUDA_STATE.dart);
    expect((x0 - e.x) / (STEP * 4)).toBeGreaterThan(DART_SPEED * 0.9);
  });
});
