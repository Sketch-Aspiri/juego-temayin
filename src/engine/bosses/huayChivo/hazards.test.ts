import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { GROUND, PLAYER_GRAVITY, STEP, T } from '../../constants';
import { Input } from '../../input';
import { makeRng } from '../../rng';
import { World } from '../../World';
import {
  blinkTarget, callWisps, type ChivoWave, leapTarget, leapVx, stepLeapBody, stepWaves, stepWisps,
  stompWaves, type Wisp, wispHarmful,
} from './hazards';
import * as K from './tuning';

const silent = new AudioEngine();
silent.muted = true;

const ARENA: readonly [number, number] = [63, 85];
const LEFT = ARENA[0] * T;
const RIGHT = (ARENA[1] + 1) * T;
/** Salto normal del jugador (`entities/player.ts`): impulso y gravedad. */
const PLAYER_JUMP = 830;

function setup(): World {
  const def = getLevel('3-5');
  if (!def) throw new Error('falta el nivel 3-5');
  const world = new World({ def, session: { score: 0, coins: 0, lives: 3 }, input: new Input(), audio: silent });
  world.player.shield = true;
  world.player.inv = 0;
  return world;
}

/** El jugador perdió el escudo (o la vida): algo le hirió. */
const wasHurt = (world: World): boolean => !world.player.shield || world.phase !== 'play';

/** Coloca al jugador con su centro en (x, y). */
function placePlayer(world: World, x: number, y: number): void {
  const p = world.player;
  p.x = x - p.w / 2;
  p.y = y - p.h / 2;
}

describe('teletransporte y salto del Huay Chivo', () => {
  it('elige siempre un arco dentro de la arena y lejos del jugador', () => {
    const rng = makeRng(K.RNG_SEED);
    for (let px = LEFT; px <= RIGHT; px += 10) {
      const x = blinkTarget(px, LEFT, RIGHT, K.HUAY_CHIVO_W, rng);
      expect(x).toBeGreaterThanOrEqual(LEFT);
      expect(x + K.HUAY_CHIVO_W).toBeLessThanOrEqual(RIGHT);
      expect(Math.abs(x + K.HUAY_CHIVO_W / 2 - px)).toBeGreaterThanOrEqual(K.BLINK_MIN_DIST);
    }
  });

  it('limita el objetivo del salto al alcance máximo y a la arena', () => {
    expect(leapTarget(2700, 3400, K.HUAY_CHIVO_W, LEFT, RIGHT)).toBe(2700 + K.LEAP_MAX_DX);
    expect(leapTarget(2600, 2000, K.HUAY_CHIVO_W, LEFT, RIGHT)).toBe(LEFT);
    expect(leapTarget(3300, 3500, K.HUAY_CHIVO_W, LEFT, RIGHT)).toBe(RIGHT - K.HUAY_CHIVO_W);
  });

  it('aterriza en el objetivo y su techo queda por debajo de la fila 5', () => {
    // Organizar
    const floor = GROUND * T - K.HUAY_CHIVO_H;
    const target = 2950;
    const body = { x: 2650, y: floor, vx: leapVx(2650, target), vy: -K.LEAP_JUMP };
    let top = body.y;
    // Actuar
    let landed = false;
    for (let i = 0; i < 400 && !landed; i++) {
      landed = stepLeapBody(body, STEP, floor);
      top = Math.min(top, body.y);
    }
    // Comprobar
    expect(landed).toBe(true);
    expect(body.y).toBe(floor);
    expect(Math.abs(body.x - target)).toBeLessThan(6);
    expect(top).toBeGreaterThanOrEqual(6 * T);
  });
});

describe('ondas del pisotón', () => {
  it('se saltan con un salto normal', () => {
    expect(K.WAVE_H).toBeLessThan((PLAYER_JUMP * PLAYER_JUMP) / (2 * PLAYER_GRAVITY));
  });

  it('salen por parejas, una a cada lado, y la segunda con retraso', () => {
    const waves: ChivoWave[] = [];
    stompWaves(waves, 3000, 3);
    expect(waves).toHaveLength(2 * K.byPhase(K.STOMP_WAVE_PAIRS, 3));
    expect(waves.filter((w) => w.dir === 1)).toHaveLength(2);
    expect(waves.filter((w) => w.delay > 0)).toHaveLength(2);
    stompWaves(waves, 3000, 1);
    expect(waves).toHaveLength(4);
  });

  it('devuelve suelo libre para aterrizar entre ondas de la fase 3', () => {
    const flight = 2 * PLAYER_JUMP / PLAYER_GRAVITY;
    const bodyClearance = (K.WAVE_W + 34) / K.byPhase(K.WAVE_SPEED, 3);
    const interval = K.WAVE_GAP / K.byPhase(K.WAVE_SPEED, 3);
    expect(interval).toBeGreaterThan(flight + bodyClearance / 2);
    const world = setup();
    world.boss = null;
    world.player.x = 74 * T; world.player.y = GROUND * T - world.player.h;
    world.player.onGround = true;
    const waves: ChivoWave[] = [];
    stompWaves(waves, world.player.x + world.player.w / 2 - 210, 3);
    let jumped = false, landed = false;
    for (let t = 0; t < 2; t += STEP) {
      const next = waves.find(w => w.dir === 1 && w.delay <= 0 && w.x < world.player.x + world.player.w);
      if (next && world.player.onGround && world.player.x - next.x < 80) {
        world.input.press('jump'); jumped = true;
      } else if (world.player.vy >= 0) world.input.release('jump');
      world.update(STEP); stepWaves(world, waves, STEP, LEFT, RIGHT);
      if (jumped && world.player.onGround) landed = true;
    }
    expect(jumped && landed).toBe(true);
    expect(wasHurt(world)).toBe(false);
  });

  it('hieren al jugador que las toca y desaparecen al salir de la arena', () => {
    // Organizar
    const world = setup();
    const waves: ChivoWave[] = [];
    stompWaves(waves, 3000, 2);
    placePlayer(world, 3000 + 40, GROUND * T - world.player.h / 2);
    // Actuar
    for (let i = 0; i < 30; i++) stepWaves(world, waves, STEP, LEFT, RIGHT);
    // Comprobar
    expect(wasHurt(world)).toBe(true);
    for (let i = 0; i < 600; i++) stepWaves(world, waves, STEP, LEFT, RIGHT);
    expect(waves).toHaveLength(0);
  });
});

describe('fuegos fatuos', () => {
  const far = (world: World): void => placePlayer(world, LEFT + 20, 200);

  it('no hacen daño al nacer ni al desvanecerse', () => {
    // Organizar
    const world = setup();
    const wisps: Wisp[] = [];
    callWisps(wisps, 3000, 380, 3);
    placePlayer(world, wisps[0].x, wisps[0].y);
    // Actuar
    stepWisps(world, wisps, STEP);
    // Comprobar
    expect(wispHarmful(wisps[0])).toBe(false);
    expect(wasHurt(world)).toBe(false);

    wisps[0].age = K.WISP_LIFE - K.WISP_FADE + 0.1;
    placePlayer(world, wisps[0].x, wisps[0].y);
    stepWisps(world, wisps, STEP);
    expect(wasHurt(world)).toBe(false);
  });

  it('persiguen sin superar su velocidad y caducan', () => {
    const world = setup();
    far(world);
    const wisps: Wisp[] = [];
    callWisps(wisps, 3000, 380, 3);
    const list = wisps;
    for (let t = 0; t < K.WISP_LIFE + 0.1; t += STEP) {
      stepWisps(world, wisps, STEP);
      for (const w of wisps) expect(Math.hypot(w.vx, w.vy)).toBeLessThanOrEqual(K.byPhase(K.WISP_SPEED, 3) + 1e-6);
    }
    expect(wisps).toHaveLength(0);
    expect(wisps).toBe(list);
  });

  it('dañan al jugador una vez activos y se deshacen al tocarle', () => {
    const world = setup();
    const wisps: Wisp[] = [];
    callWisps(wisps, 3000, 380, 1);
    wisps[0].age = K.WISP_SPAWN_TIME + 0.1;
    placePlayer(world, wisps[0].x, wisps[0].y);
    stepWisps(world, wisps, STEP);
    expect(wasHurt(world)).toBe(true);
    expect(wisps).toHaveLength(1);
  });

  it('una bola de fuego los apaga, suma puntos y desaparece', () => {
    // Organizar
    const world = setup();
    far(world);
    const wisps: Wisp[] = [];
    callWisps(wisps, 3000, 380, 1);
    const target = wisps[1];
    world.fireballs.push({ x: target.x, y: target.y, vx: 0, vy: 0, t: 0, gone: false });
    const fireballs = world.fireballs;
    const score = world.session.score;
    // Actuar
    stepWisps(world, wisps, STEP);
    // Comprobar
    expect(wisps).toHaveLength(1);
    expect(wisps).not.toContain(target);
    expect(world.fireballs).toHaveLength(0);
    expect(world.fireballs).toBe(fireballs);
    expect(world.session.score).toBe(score + K.SCORE_WISP);
  });
});
