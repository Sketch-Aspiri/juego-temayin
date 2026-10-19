import { T } from '../../constants';
import { overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import type { Camazotz } from './index';
import * as K from './tuning';

export type HazardKind = 'bolt' | 'shard' | 'wave' | 'bat' | 'shell' | 'wisp' | 'seed' | 'quill';
export interface EclipseHazard extends Rect { kind: HazardKind; vx: number; vy: number; gravity: number; age: number }
export interface LightMote { x: number; y: number; collected: boolean }

export function addHazard(boss: Camazotz, kind: HazardKind, x: number, y: number, vx: number, vy = 0, gravity = 0): void {
  const size = kind === 'wave' ? 32 : 22;
  boss.hazards.push({ kind, x, y, w: size, h: size, vx, vy, gravity, age: 0 });
}

export function stepHazards(boss: Camazotz, world: World, dt: number): void {
  boss.hazards = boss.hazards.filter(hazard => {
    hazard.age += dt;
    hazard.vy += hazard.gravity * dt;
    hazard.x += hazard.vx * dt;
    hazard.y += hazard.vy * dt;
    if (hazard.age > K.HAZARD_LIFE || hazard.x < boss.left || hazard.x + hazard.w > boss.right || hazard.y > boss.floor) return false;
    if (world.solid(Math.floor((hazard.x + hazard.w / 2) / T), Math.floor((hazard.y + hazard.h / 2) / T))) return false;
    if (world.phase === 'play' && overlap(world.player, hazard)) { world.hurt(); return false; }
    return true;
  });
}

/** Cada eco conserva una silueta reconocible y deja un espacio para esquivarlo. */
export function summonEcho(boss: Camazotz, world: World): void {
  const direction = boss.cycle % 2 ? 1 : -1;
  const origin = direction > 0 ? boss.left + T : boss.right - T;
  const speed = direction * K.HAZARD_SPEED;
  const target = world.player.x + world.player.w / 2;
  switch (boss.echo) {
    case 0:
      for (const offset of [-T * 2, T * 2]) addHazard(boss, 'quill', boss.clampTarget(target + offset), 100, 0, 140, 170);
      break;
    case 1: case 3: addHazard(boss, 'wave', origin, boss.floor - 34, speed); break;
    case 2:
      addHazard(boss, 'wisp', origin, boss.floor - 85, speed);
      addHazard(boss, 'wisp', origin, boss.floor - 175, speed * 0.8);
      break;
    case 4:
      for (let x = boss.left + T; x < boss.right - T; x += T * 3)
        if (Math.abs(x - target) > T * 1.6) addHazard(boss, 'seed', x, 85, 0, 125, 120);
      break;
    case 5: addHazard(boss, 'shell', origin, 180, speed, -100, 300); break;
  }
}

export function spawnMotes(boss: Camazotz): void {
  boss.motes = [7, 11.5, 16].map(offset => ({ x: boss.left + offset * T, y: boss.floor - T * 2.2, collected: false }));
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
  for (let x = start + direction * T; fromLeft ? x < boss.right : x > boss.left; x += direction * T) {
    if (!world.solid(Math.floor(x / T), Math.floor(y / T))) continue;
    end = x; break;
  }
  return { x: Math.min(start, end), y, w: Math.abs(end - start), h: K.BEAM_HEIGHT };
}
