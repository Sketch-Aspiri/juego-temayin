import { describe, expect, it } from 'vitest';
import { hudKey } from '../../hud';
import { STEP, T } from '../../constants';
import { updateFireballs } from '../../entities/projectiles';
import { advance, setup, until } from './camazotz.fixture';
import { beamRect, summonEcho } from './hazards';
import { preparePhase } from './phases';
import * as K from './tuning';

describe('Camazotz: combate final', () => {
  it('cierra la arena y ofrece una apertura alcanzable después de avisar la picada', () => {
    const { world, boss } = setup();
    expect(boss.lockCamera).toBe(false);
    expect(until(world, () => boss.st === 'diveWarn')).toBe(true);
    expect(world.solid(boss.arena[0] - 1, 0)).toBe(true);
    expect(boss.hittable).toBe(false);
    const hp = boss.hp;
    boss.onFireball(world);
    expect(boss.hp).toBe(hp);
    advance(world, K.WARN_TIME / 2);
    expect(boss.st).toBe('diveWarn');
    expect(until(world, () => boss.hittable)).toBe(true);
    expect(boss.y + boss.h).toBe(boss.floor);
  });

  it('pide dos disparos en la misma apertura y nunca recibe más de un PV por ventana', () => {
    const { world, boss } = setup();
    expect(until(world, () => boss.hittable)).toBe(true);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HP);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HP - 1);
    boss.onFireball(world); boss.onFireball(world);
    expect(boss.hp).toBe(K.HP - 1);
    expect(until(world, () => boss.hittable)).toBe(true);
    boss.onFireball(world);
    advance(world, K.EXPOSED_TIME + STEP);
    expect(until(world, () => boss.hittable)).toBe(true);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HP - 1);
  });

  it('baja a la cámara a diez PV, mantiene suelo y cierra también el paso inferior', () => {
    const { world, boss } = setup();
    boss.hp = K.PHASE2_HP + 1; boss.setState('exposed');
    boss.onFireball(world); boss.onFireball(world);
    advance(world, K.HURT_TIME + STEP);
    expect(boss.phase).toBe(2);
    expect(boss.st).toBe('transition');
    expect(world.darkness?.alpha).toBeGreaterThan(0.9);
    expect(world.solid(boss.arena[0] + 8, 12)).toBe(false);
    expect(world.solid(boss.arena[0] + 8, 13)).toBe(true);
    expect(world.solid(boss.arena[1] + 1, 12)).toBe(true);
    expect(world.torches.every(torch => !torch.lit)).toBe(true);
  });

  it('cuatro antorchas se encienden con proyectiles reales y el HUD publica el objetivo', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 2); boss.setState('chamber');
    world.camX = (boss.arena[0] - 1) * T;
    const before = hudKey(world.hudState(1));
    for (const torch of world.torches) {
      world.fireballs.push({ x: torch.x, y: torch.y, vx: 0, vy: 0, t: 0, gone: false });
      updateFireballs(world, STEP);
    }
    boss.update(world, STEP);
    expect(boss.st).toBe('exposeWarn');
    expect(until(world, () => boss.hittable)).toBe(true);
    expect(world.torches.every(torch => torch.lit)).toBe(true);
    expect(hudKey(world.hudState(1))).not.toBe(before);
    expect(world.hudState(1).boss?.objective).toContain('Pisotón');
  });

  it('el brasero devuelve el fuego perdido, sin depender de cofres consumidos', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 2); boss.setState('chamber');
    world.player.fire = false;
    world.player.x = boss.left + T * 1.8;
    boss.update(world, STEP);
    expect(world.player.fire).toBe(true);
    expect(boss.hp).toBe(K.HP);
  });

  it.each([1, -1] as const)('el viento hacia %s empuja sin introducir el cuerpo en un pilar', face => {
    const { world, boss } = setup();
    const player = world.player;
    boss.setState('gust'); boss.face = face;
    player.y = boss.floor - player.h;
    player.x = face === 1 ? 93 * T - player.w : 95 * T;
    const blocked = player.x;
    boss.update(world, 0.1);
    expect(player.x).toBe(blocked);
    player.x = boss.left + 10 * T;
    const open = player.x;
    boss.update(world, 0.1);
    expect(player.x).toBeCloseTo(open + face * K.WIND_FORCE * 0.1);
  });

  it('la luz requiere tres contactos y expone al jefe sin otorgar daño automático', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 3); boss.setState('idle');
    for (const mote of boss.motes) {
      world.player.x = mote.x; world.player.y = mote.y;
      boss.update(world, STEP);
    }
    expect(boss.motes.every(mote => mote.collected)).toBe(true);
    expect(boss.hittable).toBe(false);
    boss.ritualEchoes = 2;
    boss.update(world, STEP);
    expect(until(world, () => boss.hittable)).toBe(true);
    expect(boss.hittable).toBe(true);
    expect(boss.hp).toBe(K.HP);
    expect(world.darkness).toBeNull();
  });

  it('el rayo hiere dentro de su franja y el pilar y el salto protegen físicamente', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 3); boss.setState('beam'); boss.face = 1;
    const beam = beamRect(boss, world);
    expect(beam.w).toBeGreaterThan(T);
    expect(beam.x + beam.w).toBeLessThan(boss.right);
    world.player.inv = 0; world.player.shield = true;
    world.player.x = beam.x + T; world.player.y = boss.floor - world.player.h;
    boss.update(world, STEP);
    expect(world.player.shield).toBe(false);
    world.player.inv = 0; world.player.shield = true;
    world.player.x = boss.right - T; boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
    world.player.x = beam.x + T; world.player.y = beam.y - world.player.h - 5;
    boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
  });

  it('los seis ecos invocan ataques y mantienen sus estados independientes', () => {
    const { world, boss } = setup();
    preparePhase(boss, world, 3);
    for (let echo = 0; echo < 6; echo++) {
      boss.echo = echo; boss.hazards.length = 0;
      summonEcho(boss, world);
      expect(boss.hazards.length).toBeGreaterThan(0);
      expect(boss.hazards.every(hazard => hazard.w > 0 && Number.isFinite(hazard.vx))).toBe(true);
    }
  });
});
