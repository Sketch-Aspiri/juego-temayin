import { makeParticle } from '../../../entities/particles';
import type { World } from '../../../World';
import { archCenter, blinkTarget } from '../hazards';
import type { HuayChivo } from '../index';
import * as K from '../tuning';

const SMOKE_PUFFS = 8;
const SMOKE_SPEED = 20;
const SMOKE_LIFT = 60;
const SMOKE_STEP = 8;

/** El señuelo comparte humo, pero jamás tiene ojos ni aporta una fuente de luz. */
export function hideChivo(b: HuayChivo, world: World, rng: () => number): void {
  const p = world.player;
  b.blinkX = blinkTarget(p.x + p.w / 2, b.left, b.right, b.w, rng);
  b.face = p.x + p.w / 2 < b.blinkX + b.w / 2 ? -1 : 1;
  b.decoyX = null;
  if (b.phase === 3) {
    for (let i = 0; i < K.ARCH_FRACTIONS.length; i++) {
      const x = archCenter(b.left, b.right, i) - b.w / 2;
      if (Math.abs(x - b.blinkX) > b.w) { b.decoyX = x; break; }
    }
  }
  b.setState('hidden');
  world.audio.play('tick');
}

/** Si invaden el destino anunciado, el nuevo arco recibe un aviso completo. */
export function appearChivo(b: HuayChivo, world: World, rng: () => number): void {
  const p = world.player;
  if (Math.abs(b.blinkX + b.w / 2 - (p.x + p.w / 2)) < K.BLINK_MIN_DIST) return hideChivo(b, world, rng);
  b.x = b.blinkX;
  b.faceToPlayer(world);
  for (let i = 0; i < SMOKE_PUFFS; i++) {
    world.particles.push(makeParticle('dust', b.x + b.w / 2, b.y + b.h - 6,
      { vx: (i - SMOKE_PUFFS / 2) * SMOKE_SPEED, vy: -SMOKE_LIFT - i * SMOKE_STEP }));
  }
  b.setState('appear');
}
