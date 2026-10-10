import { TAU } from '../../constants';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, drawAtlasFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/** Cuadros reales de `enemies/bat.png` (`bat.atlas.json`); anclaje en el centro del cuerpo. */
const FRAMES: readonly AtlasFrame[] = [
  { x: 108, y: 107, w: 460, h: 424, ax: 450, ay: 420 }, // alas arriba
  { x: 593, y: 216, w: 648, h: 313, ax: 975, ay: 420 }, // alas extendidas
  { x: 178, y: 711, w: 378, h: 447, ax: 450, ay: 905 }, // alas abajo
  { x: 803, y: 727, w: 317, h: 354, ax: 1000, ay: 950 }, // alas recogidas
];
/** Ciclo de aleteo: arriba → extendidas → abajo → recogidas → abajo → extendidas. */
const FLAP_CYCLE = [0, 1, 2, 3, 2, 1] as const;
const FLAP_FPS = 14;
/** Cuerpo de ~200 px en la hoja → ~30 px en pantalla (caja de 34×26). */
const SCALE = 0.13;
const WING_FLAP_SPEED = 18;

/** Murciélago procedural: respaldo mientras la imagen no ha cargado. */
function drawBatFallback(c: Ctx, t: number): void {
  const flap = Math.sin(t * WING_FLAP_SPEED);
  c.fillStyle = '#3b2a52';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 4, -14);
    c.quadraticCurveTo(side * 22, -14 - flap * 14, side * 30, -8 + flap * 6);
    c.quadraticCurveTo(side * 22, -6, side * 16, -2);
    c.quadraticCurveTo(side * 10, -8, side * 4, -4);
    c.fill();
  }
  c.fillStyle = '#54397a';
  c.beginPath();
  c.ellipse(0, -10, 9, 11, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#3b2a52';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 3, -19);
    c.lineTo(side * 8, -29);
    c.lineTo(side * 9, -17);
    c.fill();
  }
  c.fillStyle = '#ff4d4d';
  c.beginPath();
  c.arc(-3.5, -12, 2, 0, TAU);
  c.arc(3.5, -12, 2, 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-3, -5, 1.5, 3);
  c.fillRect(1.5, -5, 1.5, 3);
}

/** Murciélago (hoja `enemies/bat.png`, mira a la derecha); al morir, alas recogidas. */
export const drawBat: EnemyDrawFn = (c, assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  const frame = e.dead ? FRAMES[3] : FRAMES[FLAP_CYCLE[Math.floor(e.t * FLAP_FPS) % FLAP_CYCLE.length]];
  if (!drawAtlasFrame(c, assets.bat, frame, SCALE, 0, -e.h / 2)) drawBatFallback(c, e.t);
};
