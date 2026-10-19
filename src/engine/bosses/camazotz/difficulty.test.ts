import { describe, expect, it } from 'vitest';
import { STEP, T } from '../../constants';
import { advance, setup, until } from './camazotz.fixture';
import { addHazard, beamRect, collectMotes, stepHazards, summonEcho } from './hazards';
import { preparePhase } from './phases';
import { startBeam } from './attacks';
import * as K from './tuning';

describe('Camazotz: dificultad y oportunidades de evasión', () => {
  it.each([[K.HP, 2], [K.TRIPLE_DIVE_HP, 3]])('con %s PV exige %s picadas antes de exponer el cuerpo', (hp, count) => {
    const { world, boss } = setup(); boss.hp = hp;
    expect(until(world, () => boss.st === 'diveWarn')).toBe(true);
    expect(boss.comboSize).toBe(count);
    const destination = boss.targetX;
    world.player.x += 3 * T;
    advance(world, K.WARN_TIME / 2);
    expect(boss.targetX).toBe(destination);
    for (let i = 1; i < count; i++) {
      expect(until(world, () => boss.st === 'diveRecover')).toBe(true);
      expect(boss.diveCount).toBe(i);
      expect(boss.hittable).toBe(false);
      expect(until(world, () => boss.st === 'diveWarn')).toBe(true);
      expect(boss.t).toBeLessThan(STEP * 2);
    }
    expect(until(world, () => boss.hittable)).toBe(true);
    expect(boss.diveCount).toBe(count);
  });

  it('los proyectiles avisan sin moverse ni dañar antes de activarse', () => {
    const { world, boss } = setup();
    world.player.inv = 0; world.player.shield = true;
    world.player.y = 350;
    addHazard(boss, 'wisp', world.player.x, 350, 100, 0, 0, 1);
    const x = boss.hazards[0].x;
    stepHazards(boss, world, 0.9);
    expect(boss.hazards[0].x).toBe(x);
    expect(world.player.shield).toBe(true);
    stepHazards(boss, world, 0.11);
    expect(world.player.shield).toBe(false);
  });

  it('el tiempo de aviso no se convierte en desplazamiento al cruzar su límite', () => {
    const { world, boss } = setup();
    addHazard(boss, 'bat', boss.left + 10 * T, 200, 100, 0, 0, 1);
    const x = boss.hazards[0].x;
    stepHazards(boss, world, 1.1);
    expect(boss.hazards[0].x).toBeCloseTo(x + 10);
  });

  it.each([1, 3])('el eco %s atraviesa la zona central sin desaparecer contra el pilar de origen', echo => {
    const { world, boss } = setup();
    preparePhase(boss, world, 3); boss.echo = echo;
    world.player.y = 100;
    summonEcho(boss, world);
    const first = boss.hazards[0]; const start = first.x;
    for (let t = 0; t < 1.3; t += STEP) stepHazards(boss, world, STEP);
    expect(boss.hazards).toContain(first);
    expect(Math.abs(first.x - start)).toBeGreaterThan(100);
  });

  it('la cámara lanza tres fragmentos con huecos y añade un proyectil dirigido en la segunda oleada', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 2); boss.setState('chamber');
    boss.update(world, K.CHAMBER_ATTACK_GAP);
    expect(boss.hazards.map(hazard => hazard.kind)).toEqual(['shard', 'shard', 'shard']);
    expect(boss.hazards[1].x - boss.hazards[0].x).toBeGreaterThan(world.player.w * 2);
    expect(boss.hazards.every(hazard => hazard.delay >= K.PROJECTILE_WARNING)).toBe(true);
    boss.update(world, K.CHAMBER_ATTACK_GAP);
    expect(boss.hazards.some(hazard => hazard.kind === 'wisp')).toBe(true);
  });

  it.each([[5, 2], [2, 3]])('a %s PV encadena %s rayos, con un aviso completo entre direcciones', (hp, count) => {
    const { world, boss } = setup();
    preparePhase(boss, world, 3); boss.hp = hp; startBeam(boss, world);
    for (let i = 0; i < count; i++) {
      expect(boss.st).toBe('beamWarn');
      const face = boss.face;
      boss.update(world, K.WARN_TIME);
      expect(boss.st).toBe('beam');
      boss.update(world, K.BEAM_TIME);
      expect(boss.st).toBe(i === count - 1 ? 'idle' : 'beamWarn');
      if (i < count - 1) { expect(boss.face).toBe(-face); expect(boss.t).toBe(0); }
    }
  });

  it('las luces necesitan salto y cada rayo termina exactamente en la cara del pilar', () => {
    const { world, boss } = setup(); preparePhase(boss, world, 3);
    world.player.y = boss.floor - world.player.h;
    for (const mote of boss.motes) { world.player.x = mote.x; collectMotes(boss, world); }
    expect(boss.motes.every(mote => !mote.collected)).toBe(true);
    boss.face = 1;
    const right = beamRect(boss, world);
    expect(right.x + right.w).toBe(109 * T);
    boss.face = -1;
    expect(beamRect(boss, world).x).toBe(95 * T);
  });

  it('la transición cancela también los ataques que todavía estaban avisando', () => {
    const { world, boss } = setup();
    addHazard(boss, 'shell', boss.left + 10 * T, 200, 100);
    preparePhase(boss, world, 2);
    expect(boss.hazards).toHaveLength(0);
    expect(boss.hp).toBe(K.HP);
    expect(boss.exposedTime).toBeLessThan(K.EXPOSED_TIME);
  });
});
