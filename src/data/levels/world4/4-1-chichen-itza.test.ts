import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../../engine/audio';
import { GROUND, START_LIVES, STEP, T } from '../../../engine/constants';
import { Input } from '../../../engine/input';
import { buildLevel } from '../../../engine/level/build';
import { World } from '../../../engine/World';
import { LEVEL_4_1 } from './4-1-chichen-itza';

const silent = new AudioEngine();
silent.muted = true;

/** Margen de cámara por detrás del jugador al colocarlo a mano. */
const CAMERA_BACK = 300;
/** Columnas antes del aro desde las que se prueba el lanzamiento. */
const THROW_RANGE = 12;
/** Retrasos (s) del lanzamiento tras empezar a saltar; `null` = lanzar desde el suelo. */
const JUMP_DELAYS = [null, 0.15, 0.3] as const;

/** Lanza la pelota desde la columna `tx` (saltando antes si hay retraso) y dice si enciende el aro. */
function lights(hoopIndex: number, tx: number, jumpDelay: number | null): boolean {
  const input = new Input();
  const world = new World({ def: LEVEL_4_1, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  world.enemies = [];
  const p = world.player;
  p.x = tx * T + (T - p.w) / 2;
  p.y = GROUND * T - p.h;
  p.onGround = true;
  p.ball = true;
  world.camX = Math.max(0, p.x - CAMERA_BACK);
  if (jumpDelay !== null) {
    input.press('jump');
    for (let t = 0; t < jumpDelay; t += STEP) world.update(STEP);
  }
  input.press('fire');
  world.update(STEP);
  input.release('fire');
  input.release('jump');
  const hoop = world.hoops[hoopIndex];
  for (let t = 0; t < 3 && !hoop.lit && world.phase === 'play'; t += STEP) world.update(STEP);
  return hoop.lit;
}

describe('4-1 Chichén Itzá', () => {
  const lvl = buildLevel(LEVEL_4_1);

  it('tiene bloques de pelota y al menos dos aros en la cancha', () => {
    const balls = lvl.grid.flat().filter((c) => c === 'P').length;
    expect(balls).toBeGreaterThanOrEqual(2);
    expect(lvl.hoops.length).toBeGreaterThanOrEqual(2);
  });

  it('cada aro se puede encender lanzando la pelota desde algún punto', () => {
    lvl.hoops.forEach((h, i) => {
      let ok = false;
      for (let tx = h.x - THROW_RANGE; tx < h.x && !ok; tx++) {
        for (const jump of JUMP_DELAYS) ok = ok || lights(i, tx, jump);
      }
      expect(ok, `aro ${i} en ${h.x},${h.y}`).toBe(true);
    });
  });
});
