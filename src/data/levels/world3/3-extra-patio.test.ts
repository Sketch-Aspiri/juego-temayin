import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../../engine/audio';
import { GROUND, STEP, T } from '../../../engine/constants';
import { Input } from '../../../engine/input';
import { World } from '../../../engine/World';
import { BONUS_3 } from './3-extra-patio';

/** Distancias de carrerilla (bloques antes de la hamaca) que se prueban. */
const RUN_UPS = [0.5, 1, 2, 3, 4, 6];
/** Velocidades horizontales (px/s) de caminar y de correr al llegar a la hamaca. */
const WALK_SPEED = 260;
const RUN_SPEED = 400;
/** Distancia de la cámara por detrás del jugador al arrancar la simulación (px). */
const CAM_LEAD = 300;
/** Tiempo máximo (s) de la simulación del rebote. */
const MAX_FLIGHT_SECONDS = 2.5;
/** Tolerancia (px) para considerar que los pies están a la altura del tejado. */
const LANDING_TOLERANCE = 1;
/** Invulnerabilidad (s) para que ningún enemigo interfiera con el rebote. */
const PROTECTED_SECONDS = 10;

const make = () => new World({ def: BONUS_3, input: new Input(),
  audio: new AudioEngine(), fromCheckpoint: false, session: { score: 0, coins: 0, lives: 3 } });

/** Tejado (fila superior) que se alcanza desde cada hamaca del patio. */
const ROOFS = BONUS_3.ops.flatMap((op, i) => {
  if (op[0] !== 'hammock') return [];
  const plat = BONUS_3.ops[i + 1];
  return plat[0] === 'plat' ? [[op[1], plat[1], plat[2]] as const] : [];
});

/** Rebota en la hamaca con el salto sostenido todo el tiempo y devuelve si aterriza en el tejado. */
function landsOnRoof(hammock: number, roof: number, row: number, runUp: number, run: boolean): boolean {
  const w = make(), p = w.player;
  p.x = (hammock - runUp) * T; p.y = GROUND * T - p.h; p.onGround = true; p.inv = PROTECTED_SECONDS;
  p.vx = run ? RUN_SPEED : WALK_SPEED;
  w.camX = p.x - CAM_LEAD;
  w.input.press('right');
  if (run) w.input.press('run');
  w.input.press('jump');
  w.input.consumeJump(); // salto sostenido, sin saltar antes de la hamaca
  for (let t = 0; t < MAX_FLIGHT_SECONDS; t += STEP) {
    w.update(STEP);
    if (p.onGround && Math.abs(p.y + p.h - row * T) < LANDING_TOLERANCE && p.x + p.w > roof * T) return true;
  }
  return false;
}

describe('3-extra · El patio de las hamacas', () => {
  it.each(ROOFS.map(r => [...r]))('la hamaca de %i permite aterrizar en el tejado de %i (fila %i)', (hammock, roof, row) => {
    const reached = RUN_UPS.some(d => landsOnRoof(hammock, roof, row, d, true) || landsOnRoof(hammock, roof, row, d, false));
    expect(reached).toBe(true);
  });
});
