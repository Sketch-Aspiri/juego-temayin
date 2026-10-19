import { GROUND, T } from '../../constants';
import { extinguishTorches } from '../../entities/torches';
import type { World } from '../../World';
import type { Camazotz } from './index';
import { spawnMotes } from './hazards';
import * as K from './tuning';

export function preparePhase(boss: Camazotz, world: World, phase: 2 | 3): void {
  boss.phase = phase;
  boss.hazards.length = 0;
  boss.motes.length = 0;
  // Solo cambia un piso de la arena ficticia; el contenido original y los otros niveles siguen intactos.
  for (let x = boss.arena[0]; x <= boss.arena[1]; x++) world.grid[GROUND][x] = phase === 2 ? ' ' : 'G';
  for (const x of [boss.arena[0] - 1, boss.arena[1] + 1]) world.grid[GROUND][x] = 'X';
  if (phase === 2) {
    world.darkness = { radius: 115, alpha: 0.96 };
    extinguishTorches(world, boss.left, boss.right);
    boss.litTorches = 0;
    world.player.fire = true;
  } else {
    world.darkness = null;
    world.player.y = Math.min(world.player.y, K.TOP_FLOOR - world.player.h);
    spawnMotes(boss);
    boss.cycle = 0; boss.ritualEchoes = 0;
  }
  boss.x = boss.left + (boss.right - boss.left) / 2 - boss.w / 2;
  boss.y = K.FLY_Y;
  world.player.inv = Math.max(world.player.inv, K.TRANSITION_TIME);
  world.shake = 0.8;
  world.audio.play('roar');
  world.popups.push({ x: boss.x, y: 120, t: 0, txt: phase === 2 ? 'LA CÁMARA · ¡ENCIENDE LAS CUATRO ANTORCHAS!' : 'EL ECLIPSE · ¡REÚNE TRES LUCES!' });
}

export function restoreShrine(boss: Camazotz, world: World): void {
  if (boss.phase !== 2 || world.player.fire) return;
  const shrine = boss.left + T * 1.8;
  if (Math.abs(world.player.x + world.player.w / 2 - shrine) > K.SHRINE_RANGE) return;
  world.player.fire = true;
  world.audio.play('power');
  world.popups.push({ x: shrine, y: boss.floor - 70, t: 0, txt: '¡FUEGO DEL BRASERO!' });
}

export function torchesReady(boss: Camazotz, world: World): boolean {
  const torches = world.torches.filter(torch => torch.x >= boss.left && torch.x <= boss.right);
  return torches.length === 4 && torches.every(torch => torch.lit);
}
