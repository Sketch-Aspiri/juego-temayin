import { GROUND, T, TAU, VW } from '../constants';
import type { World } from '../World';
import { bakedFrame, type Frame } from './artCache';
import type { Ctx } from './drawUtils';

/**
 * Meta (asta + banderín), pirámide final y punto de control con Toh, usando el
 * arte pintado. Cada pieza tiene su respaldo procedural mientras el atlas carga.
 * Los rectángulos se midieron por cajas de alfa (alfa > 64) de cada pieza.
 */

const FLAGS_FILE = 'complementos/banderas.webp';
const PYRAMID_FILE = 'complementos/piramide.webp';
const TOH_FILE = 'personajes/toh.webp';

/** banderas.webp (1774×887): 4 fotogramas de ondeo con el anclaje a la derecha. */
const FLAG_FRAMES: readonly Frame[] = [
  [16, 16, 412, 316],
  [460, 20, 412, 312],
  [904, 20, 408, 312],
  [1340, 20, 420, 312],
];
/** Asta con remate (columna 112..328), partida en tres para estirar solo el fuste. */
const POLE_TOP: Frame = [112, 324, 216, 108];
const POLE_SHAFT: Frame = [112, 432, 216, 280];
const POLE_BASE: Frame = [112, 712, 216, 148];
/** Banderín de checkpoint sobre poste; la punta del poste está en (1105, 418). */
const CHECKPOINT_POST: Frame = [960, 412, 296, 444];
const POST_TIP_X = 1105 - 960;
const POST_TIP_Y = 418 - 412;
/** piramide.webp (1536×1024): la pirámide completa. */
const PYRAMID_FRAME: Frame = [10, 71, 1516, 865];

/**
 * toh.webp (1536×1024, 3×2): rectángulo y punto de apoyo de las patas de cada pose.
 * Las poses de vuelo quedan medidas para escenas futuras (carteles, mapa).
 */
interface TohPose {
  frame: Frame;
  footX: number;
  footY: number;
}
export const TOH_POSES = {
  perch: { frame: [24, 20, 444, 452], footX: 330, footY: 332 },
  perchLook: { frame: [524, 20, 396, 452], footX: 815, footY: 332 },
  perchTail: { frame: [1092, 16, 420, 380], footX: 1215, footY: 335 },
  flyUp: { frame: [20, 464, 560, 524], footX: 300, footY: 870 },
  flyDown: { frame: [504, 572, 552, 372], footX: 730, footY: 810 },
  point: { frame: [972, 556, 552, 452], footX: 1255, footY: 905 },
} as const satisfies Readonly<Record<string, TohPose>>;
type TohPoseId = keyof typeof TOH_POSES;

/** Secuencia de reposo de Toh: mira, vuelve, menea la cola-péndulo («marca la hora»). */
const TOH_IDLE: readonly TohPoseId[] = ['perch', 'perch', 'perchLook', 'perch', 'perchTail', 'perchTail'];
const TOH_IDLE_STEP_MS = 420;
const TOH_SCALE = 0.19;

const POLE_SCALE = 0.45;
const POLE_TOP_Y = 2 * T - 34;
const FLAG_SCALE = 0.24;
const FLAG_FRAME_MS = 120;
/** Píxeles que el banderín se mete detrás del asta (las argollas abrazan el fuste). */
const FLAG_RING_OVERLAP = 10;
const POST_SCALE = 0.27;
const FALLBACK_POST_HEIGHT = 90;
const TEMPLE_WIDTH = 380;
/** Ancho del templo procedural antiguo: el arte se centra en el mismo hueco. */
const TEMPLE_SLOT = 300;
const TEMPLE_SINK = 6;
const VISIBLE_MARGIN = 420;

const onScreen = (sx: number, margin: number): boolean => sx > -margin && sx < VW + margin;

// ---------- Meta ----------

function drawPoleArt(c: Ctx, fx: number): boolean {
  const top = bakedFrame(FLAGS_FILE, POLE_TOP, POLE_SCALE);
  const shaft = bakedFrame(FLAGS_FILE, POLE_SHAFT, POLE_SCALE);
  const base = bakedFrame(FLAGS_FILE, POLE_BASE, POLE_SCALE);
  if (!top || !shaft || !base) return false;
  const x = Math.round(fx - top.width / 2);
  const baseY = GROUND * T - base.height;
  const shaftY = POLE_TOP_Y + top.height;
  c.drawImage(shaft, x, shaftY, shaft.width, baseY - shaftY + 2);
  c.drawImage(top, x, POLE_TOP_Y);
  c.drawImage(base, x, baseY);
  return true;
}

function drawFlagArt(c: Ctx, fx: number, fy: number, now: number): boolean {
  const frame = FLAG_FRAMES[Math.floor(now / FLAG_FRAME_MS) % FLAG_FRAMES.length];
  const img = bakedFrame(FLAGS_FILE, frame, FLAG_SCALE);
  if (!img) return false;
  c.drawImage(img, Math.round(fx + FLAG_RING_OVERLAP - img.width), Math.round(fy - 4));
  return true;
}

/** Respaldo procedural: asta gris, bola dorada y banderín verde con huella. */
function drawFlagFallback(c: Ctx, fx: number, fy: number): void {
  c.fillStyle = '#ddd';
  c.fillRect(fx - 3, 2 * T, 6, GROUND * T - 2 * T);
  c.fillStyle = '#ffd23f';
  c.beginPath();
  c.arc(fx, 2 * T - 6, 10, 0, TAU);
  c.fill();
  c.fillStyle = '#1f7a3a';
  c.beginPath();
  c.moveTo(fx - 3, fy);
  c.lineTo(fx - 70, fy + 25);
  c.lineTo(fx - 3, fy + 50);
  c.fill();
  c.fillStyle = '#ffd23f';
  c.beginPath();
  c.arc(fx - 28, fy + 25, 7, 0, TAU);
  c.fill();
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(fx - 36 + i * 8, fy + 15, 3.2, 0, TAU);
    c.fill();
  }
  c.fillStyle = '#8a8478';
  c.fillRect(fx - 18, GROUND * T - 10, 36, 10);
}

/** Respaldo procedural: pirámide escalonada de seis cuerpos. */
function drawPyramidFallback(c: Ctx, tx: number): void {
  const base = GROUND * T;
  for (let i = 0; i < 6; i++) {
    const w = 300 - i * 44;
    const h = 34;
    c.fillStyle = i % 2 ? '#a8865a' : '#b99668';
    c.fillRect(tx + (300 - w) / 2, base - (i + 1) * h, w, h);
    c.fillStyle = 'rgba(0,0,0,.15)';
    c.fillRect(tx + (300 - w) / 2, base - (i + 1) * h + h - 4, w, 4);
  }
  c.fillStyle = '#8a6a42';
  c.fillRect(tx + 120, base - 6 * 34 - 46, 60, 46);
  c.fillStyle = '#2a1a0a';
  c.fillRect(tx + 138, base - 6 * 34 - 34, 24, 34);
  c.fillStyle = '#7a5a36';
  for (let i = 0; i < 12; i++) c.fillRect(tx + 130, base - 12 - i * 17, 40, 5);
}

function drawPyramid(c: Ctx, tx: number): void {
  const img = bakedFrame(PYRAMID_FILE, PYRAMID_FRAME, TEMPLE_WIDTH / PYRAMID_FRAME[2]);
  if (!img) return drawPyramidFallback(c, tx);
  c.drawImage(img, Math.round(tx + (TEMPLE_SLOT - img.width) / 2), GROUND * T - img.height + TEMPLE_SINK);
}

/** Asta de meta con banderín ondeando y la pirámide maya del final del nivel. */
export function drawGoal(c: Ctx, world: World, now: number): void {
  const fx = world.level.flagX * T + T / 2 - world.camX;
  if (onScreen(fx, 100)) {
    if (!drawPoleArt(c, fx) || !drawFlagArt(c, fx, world.flagY, now)) drawFlagFallback(c, fx, world.flagY);
  }
  const tx = world.level.templeX * T - world.camX;
  if (tx > -VISIBLE_MARGIN && tx < VW + 50) drawPyramid(c, tx);
}

// ---------- Punto de control: Toh, el pájaro reloj ----------

/** Columna y altura (px) del suelo donde reaparece el jugador (misma regla que `World.placeOnGround`). */
function checkpointSpot(world: World): { x: number; y: number } {
  let tx = world.checkpointTile;
  while (tx < world.width - 1 && !world.solid(tx, GROUND)) tx++;
  let ty = GROUND;
  while (ty > 0 && world.solid(tx, ty - 1)) ty--;
  return { x: tx * T + T / 2, y: ty * T };
}

function drawToh(c: Ctx, pose: TohPoseId, x: number, y: number, flip: boolean): void {
  const { frame, footX, footY } = TOH_POSES[pose];
  const img = bakedFrame(TOH_FILE, frame, TOH_SCALE);
  if (!img) return;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (flip) c.scale(-1, 1);
  c.drawImage(img, -(footX - frame[0]) * TOH_SCALE, -(footY - frame[1]) * TOH_SCALE);
  c.restore();
}

/** Respaldo procedural del poste: palo con banderín verde. */
function drawPostFallback(c: Ctx, x: number, y: number): void {
  c.fillStyle = '#6b4220';
  c.fillRect(x - 3, y - FALLBACK_POST_HEIGHT, 6, FALLBACK_POST_HEIGHT);
  c.fillStyle = '#1f7a3a';
  c.fillRect(x - 22, y - 84, 44, 34);
}

/**
 * Checkpoint: Toh se posa en el banderín y mira hacia el jugador; al pasar,
 * señala hacia delante con el ala (AGENTS.md §4.1).
 */
export function drawCheckpoint(c: Ctx, world: World, now: number): void {
  const spot = checkpointSpot(world);
  const sx = spot.x - world.camX;
  if (!onScreen(sx, 120)) return;
  const post = bakedFrame(FLAGS_FILE, CHECKPOINT_POST, POST_SCALE);
  let tipY = spot.y - FALLBACK_POST_HEIGHT;
  if (post) {
    const top = spot.y - post.height + 4;
    c.drawImage(post, Math.round(sx - POST_TIP_X * POST_SCALE), top);
    tipY = top + POST_TIP_Y * POST_SCALE;
  } else {
    drawPostFallback(c, sx, spot.y);
  }
  if (world.checkpointReached) return drawToh(c, 'point', sx, tipY, false);
  const pose = TOH_IDLE[Math.floor(now / TOH_IDLE_STEP_MS) % TOH_IDLE.length];
  drawToh(c, pose, sx, tipY, true);
}
