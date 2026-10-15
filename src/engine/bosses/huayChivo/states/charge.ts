import type { World } from '../../../World';
import type { HuayChivo } from '../index';
import * as K from '../tuning';

/** Aviso de raspado y ojos antes de fijar la carrera. */
export function startPaw(b: HuayChivo, world: World): void {
  b.faceToPlayer(world);
  b.doubled = false;
  b.setState('paw');
  world.audio.play('warn');
}

/** Impactos escénicos: los restos sueltos no dañan ni modifican el monumento. */
export function chargeStep(b: HuayChivo, world: World, dt: number, rng: () => number): void {
  const maxX = b.right - b.w;
  b.x += b.face * K.CHARGE_SPEED * K.byPhase(K.PHASE_SPEED, b.phase) * dt;
  if (b.x > b.left && b.x < maxX) return;
  b.x = Math.max(b.left, Math.min(maxX, b.x));
  world.shake = K.DAZE_SHAKE;
  world.audio.play('bump');
  for (let i = 0; i < K.STUCCO_COUNT; i++) {
    b.stucco.push({ x: b.x + b.w / 2 + (i - K.STUCCO_COUNT / 2) * K.STUCCO_SPREAD, y: K.STUCCO_Y, t: 0 });
  }
  const chance = K.byPhase(K.DOUBLE_CHARGE_CHANCE, b.phase);
  if (!b.doubled && chance > 0 && rng() < chance) {
    b.doubled = true;
    b.face = b.face === 1 ? -1 : 1;
    b.setState('turn');
    world.audio.play('warn');
    return;
  }
  b.fireHits = 0;
  // Ninguna onda anterior puede cerrar la única oportunidad de pisotón.
  b.waves.length = 0;
  b.wisps.length = 0;
  b.setState('dazed');
}
