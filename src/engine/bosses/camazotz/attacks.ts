import { T } from '../../constants';
import { moveX, overlap } from '../../physics';
import type { World } from '../../World';
import type { Camazotz } from './index';
import { addHazard, aimedOrb, beamRect } from './hazards';
import * as K from './tuning';

export function startDive(boss: Camazotz, world: World): void {
  boss.targetX = boss.clampTarget(world.player.x - boss.w / 2);
  boss.diveFromX = boss.x;
  boss.y = K.FLY_Y;
  boss.face = boss.targetX < boss.x ? -1 : 1;
  boss.setState('diveWarn');
  world.audio.play('warn');
}

export function stepDive(boss: Camazotz, world: World): boolean {
  const progress = Math.min(1, boss.t / K.DIVE_TIME);
  boss.x = boss.diveFromX + (boss.targetX - boss.diveFromX) * progress;
  boss.y = K.FLY_Y + (boss.floor - boss.h - K.FLY_Y) * progress * progress;
  if (progress < 1) return false;
  boss.diveCount++;
  world.shake = 0.35; world.audio.play('stomp');
  if (boss.diveCount >= boss.comboSize) return true;
  for (const direction of [-1, 1])
    addHazard(boss, 'wave', boss.x + boss.w / 2, boss.floor - 34, direction * K.HAZARD_SPEED, 0, 0, 0.25);
  boss.setState('diveRecover');
  return false;
}

export function stepSwarm(boss: Camazotz): void {
  if (boss.shots >= 2 || boss.t < boss.shots * K.WAVE_GAP) return;
  const origin = boss.face > 0 ? boss.left + K.INSIDE_PILLAR : boss.right - K.INSIDE_PILLAR;
  for (let lane = 0; lane < 3; lane++) {
    if (lane === boss.safeLane) continue;
    addHazard(boss, 'bat', origin, boss.floor - 38 - lane * 84, boss.face * K.HAZARD_SPEED);
  }
  boss.shots++;
}

export function stepGust(boss: Camazotz, world: World, dt: number): void {
  const player = world.player;
  moveX(player, boss.face * K.WIND_FORCE * dt, world.solidAt);
  player.x = Math.max(boss.left, Math.min(boss.right - player.w, player.x));
  if (boss.shots < 2 && boss.t >= boss.shots * K.WAVE_GAP) {
    const origin = boss.face > 0 ? boss.left + K.INSIDE_PILLAR : boss.right - K.INSIDE_PILLAR;
    addHazard(boss, 'wave', origin, boss.floor - 34, boss.face * K.HAZARD_SPEED);
    boss.shots++;
  }
  if (boss.t >= K.WIND_TIME) boss.setState('idle');
}

export function stepChamber(boss: Camazotz, world: World, dt: number): void {
  boss.chamberClock += dt;
  if (boss.chamberClock < K.CHAMBER_ATTACK_GAP) return;
  boss.chamberClock = 0; boss.chamberCycle++;
  const target = world.player.x + world.player.w / 2;
  for (const offset of [-K.CHAMBER_SHARD_SPACING, 0, K.CHAMBER_SHARD_SPACING]) {
    const x = Math.max(boss.left + T, Math.min(boss.right - T, target + offset));
    addHazard(boss, 'shard', x, 70, 0, 160, 240, 1);
  }
  if (boss.chamberCycle % 2 === 0) aimedOrb(boss, boss.x, boss.y, target, world.player.y + world.player.h / 2);
  world.audio.play('warn');
}

export function startBeam(boss: Camazotz, world: World): void {
  boss.beamCount = 0; boss.beamTotal = boss.hp <= K.FRENZY_HP ? 3 : 2;
  boss.face = world.player.x < boss.x ? -1 : 1;
  boss.y = boss.floor - boss.h;
  boss.setState('beamWarn');
}

export function stepBeam(boss: Camazotz, world: World): void {
  if (overlap(world.player, beamRect(boss, world))) world.hurt();
  if (boss.t < K.BEAM_TIME) return;
  if (++boss.beamCount >= boss.beamTotal) { boss.y = K.FLY_Y; boss.setState('idle'); return; }
  boss.face = boss.face === 1 ? -1 : 1;
  boss.setState('beamWarn'); world.audio.play('warn');
}
