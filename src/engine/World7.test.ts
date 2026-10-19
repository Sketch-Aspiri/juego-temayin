import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, getLevel, nextLevelId, WORLDS } from '../data/worlds';
import { AudioEngine } from './audio';
import { Input } from './input';
import { START_LIVES, STEP } from './constants';
import { World } from './World';
import { driveWorld7Route } from './testing/world7Route';
import { Camazotz } from './bosses/camazotz';
import { driveCamazotzBattle } from './testing/camazotzBattle';

export function makeWorld7(id: string, fromCheckpoint = false): World {
  const def = getLevel(id);
  if (!def) throw new Error(`Falta ${id}`);
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def, fromCheckpoint, input: new Input(), audio, session: { score: 0, coins: 0, lives: START_LIVES } });
}

describe('Mundo 7', () => {
  it('continúa Chetumal y termina únicamente en el trono, con boleto propio', () => {
    expect(nextLevelId('6-6')).toBe('7-1');
    expect(nextLevelId('7-3')).toBe('7-4');
    expect(nextLevelId('7-4')).toBeNull();
    const world = WORLDS.find(world => world.number === 7)!;
    expect(world.levels).toHaveLength(4);
    expect(world.levels.flatMap(level => level.ops.filter(op => op[0] === 'ticket'))).toHaveLength(1);
    expect(ALL_LEVELS).toHaveLength(39);
  });

  it.each(['7-1', '7-2', '7-3', '7-extra'])('%s se recorre con colisiones reales hasta checkpoint y meta', id => {
    const world = makeWorld7(id);
    for (let elapsed = 0; elapsed < 150 && world.phase === 'play'; elapsed += STEP) {
      driveWorld7Route(world); world.update(STEP);
    }
    const position = `${id}: ${world.phase}, x=${world.player.x / 40}, y=${world.player.y / 40}, suelo=${world.player.onGround}, cuerda=${world.player.swinging}`;
    expect(world.checkpointReached, position).toBe(true);
    expect(['flag', 'done'], position).toContain(world.phase);
    expect(world.player.x).toBeGreaterThan(world.level.flagX * 40 - 40);
  });

  it('el trono crea un jefe completo y reinicia sus fases al reaparecer', () => {
    const first = makeWorld7('7-4');
    expect(first.boss).toBeInstanceOf(Camazotz);
    const next = makeWorld7('7-4', true);
    expect(next.boss?.hp).toBe(15);
    expect((next.boss as Camazotz).phase).toBe(1);
    expect(next.darkness).toBeNull();
  });

  it.each(['7-1', '7-2', '7-3', '7-extra'])('%s también se completa al reaparecer desde su checkpoint', id => {
    const world = makeWorld7(id, true);
    for (let elapsed = 0; elapsed < 100 && world.phase === 'play'; elapsed += STEP) {
      driveWorld7Route(world); world.update(STEP);
    }
    expect(['flag', 'done'], `${id}: x=${world.player.x / 40}`).toContain(world.phase);
  });

  it('el boleto de Calakmul se recoge con un salto desde el sendero alto', () => {
    const world = makeWorld7('7-3');
    world.player.x = 151 * 40; world.player.y = 6 * 40 - world.player.h;
    world.player.onGround = true; world.camX = 140 * 40;
    world.input.press('right'); world.input.press('jump');
    for (let elapsed = 0; elapsed < 1 && !world.ticketCollected; elapsed += STEP) world.update(STEP);
    expect(world.ticketCollected).toBe(true);
  });

  it('recorre el trono y vence las tres fases con saltos y fuego reales, hasta la meta', () => {
    const world = makeWorld7('7-4');
    const boss = world.boss as Camazotz;
    const stages = new Set<number>();
    const echoes = new Set<number>();
    for (let elapsed = 0; elapsed < 400 && world.phase === 'play'; elapsed += STEP) {
      driveCamazotzBattle(world); world.update(STEP); stages.add(boss.phase);
      if (boss.st === 'echo') echoes.add(boss.echo);
    }
    const diagnostic = `${boss.st}, PV=${boss.hp}, fase=${boss.phase}, x=${world.player.x / 40}, y=${world.player.y / 40}, antorchas=${boss.litTorches}`;
    expect(boss.hp, diagnostic).toBe(0);
    expect([...stages]).toEqual([1, 2, 3]);
    expect([...echoes].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(boss.st).toBe('gone');
    expect(world.checkpointReached).toBe(true);
    expect(['flag', 'done'], diagnostic).toContain(world.phase);
    expect(world.solid(boss.arena[1] + 1, 0)).toBe(false);
    expect(world.darkness).toBeNull();
    expect(boss.backdrop).toBe('calakmulDawn');
  });
});
