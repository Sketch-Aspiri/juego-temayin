import { T } from '../../constants';
import { overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import type { Camazotz } from './index';
import * as K from './tuning';

export type HazardKind = 'bolt' | 'shard' | 'wave' | 'bat' | 'shell' | 'wisp' | 'seed' | 'quill';
export interface EclipseHazard extends Rect { kind: HazardKind; vx: number; vy: number; gravity: number; age: number; delay: number }
export interface LightMote { x: number; y: number; collected: boolean }

export function addHazard(boss: Camazotz, kind: HazardKind, x: number, y: number, vx: number, vy = 0, gravity = 0, delay = K.PROJECTILE_WARNING): void {
  const size = kind === 'wave' ? 32 : 22;
  boss.hazards.push({ kind, x, y, w: size, h: size, vx, vy, gravity, age: 0, delay });
}

export function stepHazards(boss: Camazotz, world: World, dt: number): void {
  boss.hazards = boss.hazards.filter(hazard => {
    const before = hazard.age;
    hazard.age += dt;
    const active = Math.max(0, hazard.age - Math.max(before, hazard.delay));
    if (!active) return true;
    hazard.vy += hazard.gravity * active;
    hazard.x += hazard.vx * active;
    hazard.y += hazard.vy * active;
    if (hazard.age > K.HAZARD_LIFE + hazard.delay || hazard.x < boss.left || hazard.x + hazard.w > boss.right || hazard.y > boss.floor) return false;
    if (world.solid(Math.floor((hazard.x + hazard.w / 2) / T), Math.floor((hazard.y + hazard.h / 2) / T))) return false;
    if (world.phase === 'play' && overlap(world.player, hazard)) { world.hurt(); return false; }
    return true;
  });
}

/** Cada eco conserva una silueta reconocible y deja un espacio para esquivarlo. */
export function summonEcho(boss: Camazotz, world: World): void {
  const direction = boss.echo % 2 ? 1 : -1;
  const origin = direction > 0 ? boss.left + K.INSIDE_PILLAR : boss.right - K.INSIDE_PILLAR;
  const opposite = direction > 0 ? boss.right - K.INSIDE_PILLAR : boss.left + K.INSIDE_PILLAR;
  const speed = direction * K.HAZARD_SPEED;
  const target = world.player.x + world.player.w / 2;
  switch (boss.echo) {
    case 0:
      for (const offset of [-T * 4, -T * 2, T * 2, T * 4])
        addHazard(boss, 'quill', Math.max(boss.left + T, Math.min(boss.right - T, target + offset)), 100, 0, 170, 240);
      break;
    case 1:
      addHazard(boss, 'wave', origin, boss.floor - 34, speed);
      addHazard(boss, 'wave', opposite, boss.floor - 34, -speed, 0, 0, K.PROJECTILE_WARNING + K.WAVE_GAP);
      break;
    case 2:
      for (const angle of [-0.3, 0, 0.3]) aimedOrb(boss, origin, 230, target, world.player.y + world.player.h / 2, angle);
      break;
    case 3:
      for (let i = 0; i < 2; i++) addHazard(boss, 'wave', origin, boss.floor - 34, speed * 1.2, 0, 0, K.PROJECTILE_WARNING + i * K.WAVE_GAP);
      break;
    case 4:
      for (let x = boss.left + T; x < boss.right - T; x += T * 2)
        if (Math.abs(x - target) > T * 1.5) addHazard(boss, 'seed', x, 85, 0, 155, 190);
      break;
    case 5:
      addHazard(boss, 'shell', origin, 180, speed, -100, 300);
      addHazard(boss, 'shell', opposite, 180, -speed, -100, 300, K.PROJECTILE_WARNING + K.WAVE_GAP);
      break;
  }
}

export function aimedOrb(boss: Camazotz, x: number, y: number, targetX: number, targetY: number, offset = 0): void {
  const angle = Math.atan2(targetY - y, targetX - x) + offset;
  addHazard(boss, 'wisp', x, y, Math.cos(angle) * K.HAZARD_SPEED, Math.sin(angle) * K.HAZARD_SPEED);
}

export function spawnMotes(boss: Camazotz): void {
  boss.motes = [6.5, 11.5, 16.5].map((offset, i) => ({
    x: boss.left + offset * T, y: boss.floor - ((i === 1) !== (boss.hp % 2 === 0) ? 160 : 115), collected: false,
  }));
}

export function collectMotes(boss: Camazotz, world: World): boolean {
  const player = world.player;
  for (const mote of boss.motes) {
    if (mote.collected || !overlap(player, { x: mote.x - K.MOTE_RADIUS, y: mote.y - K.MOTE_RADIUS, w: K.MOTE_RADIUS * 2, h: K.MOTE_RADIUS * 2 })) continue;
    mote.collected = true;
    world.audio.play('coin');
    world.popups.push({ x: mote.x, y: mote.y, t: 0, txt: `${boss.motes.filter(light => light.collected).length}/3 · LUZ` });
  }
  return boss.motes.length === K.LIGHTS_REQUIRED && boss.motes.every(mote => mote.collected);
}

/** El rayo horizontal termina en el primer pilar sólido: protege de verdad su lado opuesto. */
export function beamRect(boss: Camazotz, world: World): Rect {
  const y = boss.floor - K.BEAM_HEIGHT;
  const fromLeft = boss.face > 0;
  const start = boss.x + boss.w / 2;
  let end = fromLeft ? boss.right : boss.left;
  const direction = fromLeft ? 1 : -1;
  for (let tile = Math.floor(start / T); tile >= boss.arena[0] && tile <= boss.arena[1]; tile += direction) {
    if (!world.solid(tile, Math.floor(y / T))) continue;
    end = (fromLeft ? tile : tile + 1) * T; break;
  }
  return { x: Math.min(start, end), y, w: Math.abs(end - start), h: K.BEAM_HEIGHT };
}
