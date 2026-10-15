import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { GROUND, STEP, T } from '../../constants';
import { updateFireballs } from '../../entities/projectiles';
import { Input } from '../../input';
import { World } from '../../World';
import { HuayChivo } from './index';
import * as K from './tuning';

function setup() {
  const def = getLevel('3-5')!;
  const audio = new AudioEngine(); audio.muted = true;
  const world = new World({ def, input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
  const boss = world.boss as HuayChivo;
  world.player.x = 70 * T; world.player.inv = 1000;
  return { world, boss };
}

describe('Combate en el atrio de Izamal', () => {
  it('devuelve antorchas apagadas cuando el rugido hace caer la noche, sin mutar los datos', () => {
    const { world, boss } = setup();
    boss.hp = 6; boss.st = 'dazed';
    boss.onFireball(world); boss.onFireball(world);
    for (let i = 0; i < 120; i++) boss.update(world, STEP);
    expect(boss.st).toBe('nightfall');
    expect(world.torches.every(t => !t.lit)).toBe(true);
    expect(world.level.lights).toHaveLength(2);
    expect(world.level.lights.every(t => t.radius > 0)).toBe(true);
    expect(world.lightSources().some(l => l === world.torches[0])).toBe(false);
  });

  it('devuelve más fuentes de luz cuando una bola real reenciende una antorcha', () => {
    const { world } = setup();
    world.darkness = K.NIGHT_DARKNESS[2];
    world.camX = 62 * T;
    const torch = world.torches[0]; torch.lit = false;
    const count = world.lightSources().length;
    world.fireballs.push({ x: torch.x, y: torch.y, vx: 0, vy: 0, t: 0, gone: false });
    updateFireballs(world, STEP);
    expect(torch.lit).toBe(true);
    expect(world.fireballs).toHaveLength(0);
    expect(world.lightSources()).toHaveLength(count + 1);
  });

  it('devuelve un destino seguro y reinicia el aviso cuando el jugador invade el arco anunciado', () => {
    const { world, boss } = setup();
    boss.st = 'fade'; boss.t = K.FADE_TIME;
    boss.update(world, STEP);
    const previous = boss.blinkX;
    world.player.x = previous + boss.w / 2 - world.player.w / 2;
    boss.t = K.byPhase(K.BLINK_WARN, boss.phase);
    boss.update(world, STEP);
    expect(boss.st).toBe('hidden');
    expect(boss.t).toBe(0);
    expect(Math.abs(boss.blinkX + boss.w / 2 - (world.player.x + world.player.w / 2))).toBeGreaterThanOrEqual(K.BLINK_MIN_DIST);
  });

  it('devuelve contacto inofensivo durante el aviso y alcance limitado durante la cornada', () => {
    const { world, boss } = setup();
    boss.phase = 2; boss.x = 72 * T; boss.face = 1; boss.st = 'rear'; boss.t = 0;
    world.player.x = boss.x + boss.w + T; world.player.inv = 0; world.player.shield = true;
    boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
    boss.t = K.HORN_WARN;
    boss.update(world, STEP);
    expect(boss.st).toBe('horn');
    expect(world.player.shield).toBe(false);
    expect(boss.hp).toBe(8);
    world.player.shield = true; world.player.inv = 0;
    world.player.x = boss.x + boss.w + K.HORN_REACH + 1;
    boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
    world.player.x = boss.x + boss.w + T;
    world.player.y = GROUND * T - K.HORN_HEIGHT - world.player.h - 1;
    boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
  });

  it.each([[65, -1], [83, 1]] as const)('devuelve un pisotón alcanzable desde el refugio %i tras el segundo choque', (column, dir) => {
    const { world, boss } = setup();
    boss.phase = 3; boss.st = 'dazed'; boss.t = 0;
    boss.x = dir === -1 ? boss.left : boss.right - boss.w;
    const p = world.player;
    p.x = column * T + 2; p.y = 9 * T - p.h; p.onGround = true; p.vx = 0; p.vy = 0;
    world.input.press(dir === -1 ? 'left' : 'right'); world.input.press('run');
    for (let t = 0; t < K.byPhase(K.DAZED_TIME, 3) && boss.hp === 8; t += STEP) world.update(STEP);
    expect(boss.hp).toBe(7);
    expect(boss.st).toBe('hurt');
  });

  it('devuelve un pasillo sin sólidos cuando embiste bajo los dos refugios', () => {
    const { world, boss } = setup();
    const top = Math.floor(boss.y / T), bottom = Math.floor((boss.y + boss.h - 1) / T);
    for (let x = boss.left; x <= boss.right - boss.w; x += T / 2) {
      for (let row = top; row <= bottom; row++) {
        for (let col = Math.floor(x / T); col <= Math.floor((x + boss.w - 1) / T); col++) {
          expect(world.solid(col, row), `pasillo ${col},${row}`).toBe(false);
        }
      }
    }
  });

  it('devuelve chile accesible con salto normal cuando se reaparece en el checkpoint 56', () => {
    const initial = setup().world;
    const world = new World({ def: initial.def, input: new Input(), audio: initial.audio,
      session: { score: 0, coins: 0, lives: 3 }, fromCheckpoint: true });
    const p = world.player;
    expect(p.fire).toBe(false);
    world.input.press('right');
    for (let i = 0; i < 300 && p.x < 58 * T && world.phase === 'play'; i++) world.update(STEP);
    world.input.release('right');
    for (let i = 0; i < 40; i++) world.update(STEP);
    world.input.press('jump');
    for (let i = 0; i < 180; i++) world.update(STEP);
    expect(world.tileAt(58, 9)).toBe('U');
    world.input.release('jump'); world.input.press('right');
    for (let i = 0; i < 120 && p.x < 59 * T + 5; i++) world.update(STEP);
    world.input.release('right');
    for (let i = 0; i < 40; i++) world.update(STEP);
    world.input.press('jump'); world.input.press('left');
    for (let i = 0; i < 180 && !p.fire; i++) world.update(STEP);
    expect(p.fire).toBe(true);
    expect(world.checkpointReached).toBe(true);
  });

  it('devuelve un señuelo sin luz y un destino con ojos cuando se teletransporta en fase 3', () => {
    const { world, boss } = setup();
    boss.phase = 3; boss.st = 'fade'; boss.t = K.FADE_TIME;
    boss.update(world, STEP);
    expect(boss.decoyX).not.toBeNull();
    expect(boss.decoyX).not.toBe(boss.blinkX);
    const lights: import('../../render/lighting').LightSource[] = [];
    boss.lights(lights);
    expect(lights).toHaveLength(1);
    expect(lights[0].x).toBe(boss.eyeX + boss.blinkX - boss.x);
  });

  it.each(['paw', 'turn'] as const)('devuelve contacto inofensivo durante todo el aviso %s', st => {
    const { world, boss } = setup();
    boss.st = st; boss.t = 0;
    world.player.x = boss.x; world.player.y = boss.y;
    world.player.inv = 0; world.player.shield = true;
    for (let t = 0; t < 0.5; t += STEP) boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
  });
});
