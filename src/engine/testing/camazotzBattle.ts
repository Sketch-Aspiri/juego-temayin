import { T } from '../constants';
import { Camazotz } from '../bosses/camazotz';
import type { World } from '../World';
import { driveWorld7Route } from './world7Route';

const ARRIVAL_DISTANCE = 14;
const TORCH_SHOOT_DISTANCE = 55;
const STOMP_JUMP_DISTANCE = 150;

/** Controlador de QA: protege del contacto y apunta al objetivo; usa movimiento, salto y fuego reales. */
export function driveCamazotzBattle(world: World): void {
  const boss = world.boss;
  if (!(boss instanceof Camazotz) || !boss.lockCamera || boss.st === 'gone') return driveWorld7Route(world);
  const player = world.player;
  player.inv = 2;
  let target = boss.left + T * 11;
  let shoot = false;
  let jump = false;
  if (boss.hittable) {
    target = boss.x + boss.w / 2 - player.w / 2;
    jump = Math.abs(target - player.x) < STOMP_JUMP_DISTANCE && (player.onGround || player.vy < 0);
  } else if (boss.phase === 2 && boss.st === 'chamber') {
    const torch = world.torches.find(torch => !torch.lit && torch.x >= boss.left && torch.x <= boss.right);
    if (torch) {
      target = torch.x - TORCH_SHOOT_DISTANCE;
      shoot = Math.abs(target - player.x) < ARRIVAL_DISTANCE;
      if (shoot) player.face = 1;
    }
  } else if (boss.phase === 3 && !['transition', 'hurt', 'dead'].includes(boss.st)) {
    const mote = boss.motes.find(mote => !mote.collected);
    if (mote) target = mote.x - player.w / 2;
  }
  const direction = target - player.x;
  const input = world.input;
  if (direction > ARRIVAL_DISTANCE) input.press('right'); else input.release('right');
  if (direction < -ARRIVAL_DISTANCE) input.press('left'); else input.release('left');
  input.press('run');
  if (jump) input.press('jump'); else input.release('jump');
  if (shoot && !input.held.fire) input.press('fire'); else input.release('fire');
}
