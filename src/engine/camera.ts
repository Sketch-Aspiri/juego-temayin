import { T, VW } from './constants';
import type { World } from './World';

/** Fracción de la pantalla a la izquierda del jugador (queda a ~40 % desde el borde). */
const PLAYER_SCREEN_FRACTION = 0.4;

/**
 * Nueva posición de la cámara. Solo avanza (nunca retrocede) y queda fija
 * mientras el jefe bloquea la cámara durante la pelea. Con `autoPx` > 0 (px que
 * empuja el nivel en este paso) avanza al menos esa distancia aunque el jugador
 * se quede atrás; siempre se detiene en el borde derecho del nivel.
 */
export function followCamera(camX: number, playerCenterX: number, levelPx: number, locked: boolean, autoPx = 0): number {
  if (locked) return camX;
  const target = playerCenterX - VW * PLAYER_SCREEN_FRACTION;
  const wanted = Math.max(camX + autoPx, target);
  return Math.max(camX, Math.min(wanted, levelPx - VW));
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
  world.camX = followCamera(world.camX, p.x + p.w / 2, world.width * T, !!world.boss?.lockCamera, auto);
  if (auto <= 0 || p.x >= world.camX) return;
  p.x = world.camX;
  p.vx = Math.max(0, p.vx);
  if (insideSolid(world)) world.die();
}
