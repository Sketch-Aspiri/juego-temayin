import { T, VW } from './constants';
import type { World } from './World';

/** Fracción de la pantalla a la izquierda del jugador (queda a ~40 % desde el borde). */
const PLAYER_SCREEN_FRACTION = 0.4;

/** Velocidad máxima (px/s) a la que la cámara vuelve atrás: suave tras un jefe, pero más rápida que el jugador. */
export const CAMERA_RETREAT_SPEED = 1200;

/**
 * Nueva posición de la cámara. Sigue al jugador hacia delante y, con `retreatPx` > 0 (px que
 * puede retroceder en este paso), también hacia atrás, sin pasar del inicio del nivel; con 0 nunca
 * retrocede. Queda fija mientras el jefe bloquea la cámara durante la pelea. Con `autoPx` > 0 (px que
 * empuja el nivel en este paso) avanza al menos esa distancia aunque el jugador se quede atrás;
 * siempre se detiene en el borde derecho del nivel.
 */
export function followCamera(camX: number, playerCenterX: number, levelPx: number, locked: boolean, autoPx = 0, retreatPx = 0): number {
  if (locked) return camX;
  const target = playerCenterX - VW * PLAYER_SCREEN_FRACTION;
  const maxCam = levelPx - VW;
  if (retreatPx > 0) return Math.max(0, Math.min(Math.max(target, camX - retreatPx), maxCam));
  const wanted = Math.max(camX + autoPx, target);
  return Math.max(camX, Math.min(wanted, maxCam));
}

/** El cuerpo del jugador se solapa con algún bloque sólido. */
function insideSolid(world: World): boolean {
  const p = world.player;
  for (let ty = Math.floor(p.y / T); ty <= Math.floor((p.y + p.h - 1) / T); ty++) {
    for (let tx = Math.floor(p.x / T); tx <= Math.floor((p.x + p.w - 1) / T); tx++) {
      if (world.solid(tx, ty)) return true;
    }
  }
  return false;
}

/**
 * Avanza la cámara del mundo un paso (con el empuje de `LevelDef.autoScroll`, en bloques/s).
 * Si el borde izquierdo alcanza al jugador lo arrastra; si lo arrastra contra un bloque
 * sólido no tiene salida y muere aplastado.
 */
export function advanceCamera(world: World, dt: number): void {
  const p = world.player;
  const auto = (world.def.autoScroll ?? 0) * T * dt;
  // Con desplazamiento automático la cámara no retrocede: empuja al jugador y puede aplastarlo.
  const retreatPx = auto > 0 ? 0 : CAMERA_RETREAT_SPEED * dt;
  world.camX = followCamera(world.camX, p.x + p.w / 2, world.width * T, !!world.boss?.lockCamera, auto, retreatPx);
  if (auto <= 0 || p.x >= world.camX) return;
  p.x = world.camX;
  p.vx = Math.max(0, p.vx);
  if (insideSolid(world)) world.die();
}
