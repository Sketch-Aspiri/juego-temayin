import { ROWS, T, VW } from '../constants';
import { moveX, moveY, overlap } from '../physics';
import type { Body, EnemyId } from '../types';
import type { World } from '../World';
import { hoopAt, scoreHoop } from './hoops';
import { makeParticle } from './particles';
import { isTangible } from './enemies/registry';

/**
 * Pelota de pok ta pok (AGENTS.md §4.6). Se consigue en un bloque `P` y dura hasta
 * perder la vida. Con ella, la tecla de disparo lanza una pelota de hule que rebota
 * en el suelo, las paredes y los techos BALL_MAX_BOUNCES veces, derriba enemigos y
 * enciende los aros del juego de pelota (`entities/hoops.ts`).
 *
 * Prioridad con el chile (ver `shoot` en `player.ts`): la pelota va primero. Si ya
 * hay BALL_MAX_ACTIVE pelotas en el aire, la tecla lanza bolas de fuego (si el
 * jugador tiene el chile). Así ninguno de los dos poderes anula al otro.
 */
export interface Ball extends Body {
  /** Rebotes ya dados (suelo, paredes, techo o enemigos). */
  bounces: number;
  /** Segundos en el aire. */
  t: number;
  /** Ángulo de giro para el dibujo (radianes). */
  spin: number;
  gone: boolean;
}

/** Diámetro de la pelota (px). */
export const BALL_SIZE = 20;
/** Pelotas a la vez en pantalla. */
export const BALL_MAX_ACTIVE = 1;
/** Rebotes antes de deshacerse (el último contacto la retira). */
export const BALL_MAX_BOUNCES = 5;
/** Velocidad horizontal del lanzamiento (px/s). */
export const BALL_SPEED_X = 420;
/** Velocidad vertical del lanzamiento (px/s, negativa = hacia arriba). */
export const BALL_THROW_VY = -420;
/** Gravedad de la pelota (px/s²): algo menor que la del jugador, vuela en arcos amplios. */
export const BALL_GRAVITY = 1400;
/** Velocidad con la que rebota en el suelo (px/s): sube ~3,4 bloques en cada bote. */
export const BALL_BOUNCE_SPEED = 620;
/** Velocidad máxima de caída (px/s). */
const BALL_MAX_FALL = 900;
/** Segundos máximos en el aire. */
const BALL_LIFETIME = 5;
/** Margen (px) fuera de la cámara antes de retirarla. */
const BALL_OFFSCREEN = 40;
/** Giro visual por píxel recorrido. */
const BALL_SPIN_RATE = 0.05;
/** Duración (s) de la pose de lanzar. */
const THROW_POSE_TIME = 0.15;
/** Altura del lanzamiento medida desde la parte de arriba del jugador (px). */
const THROW_HAND_Y = 22;

/**
 * Enemigos a los que la pelota atraviesa sin dañarlos: las sombras de Xibalbá
 * solo se disuelven con luz o fuego (AGENTS.md §4.5).
 */
const BALL_IMMUNE: ReadonlySet<EnemyId> = new Set<EnemyId>(['shade', 'xtabay']);

/** Lanza una pelota si el jugador la tiene y no hay demasiadas en el aire. */
export function throwBall(world: World): boolean {
  const p = world.player;
  if (!p.ball || world.balls.length >= BALL_MAX_ACTIVE) return false;
  const x = p.x + p.w / 2 + p.face * (p.w / 2) - BALL_SIZE / 2;
  world.balls.push({
    x: Math.max(world.camX, x),
    y: p.y + THROW_HAND_Y - BALL_SIZE / 2,
    w: BALL_SIZE,
    h: BALL_SIZE,
    vx: p.face * BALL_SPEED_X,
    vy: BALL_THROW_VY,
    onGround: false,
    bounces: 0,
    t: 0,
    spin: 0,
    gone: false,
  });
  p.throwT = THROW_POSE_TIME;
  world.audio.play('jump');
  return true;
}

/** Física, golpes y aros de todas las pelotas. */
export function updateBalls(world: World, dt: number): void {
  for (const b of world.balls) {
    b.t += dt;
    moveBall(world, b, dt);
    if (b.gone) continue;
    if (isOut(world, b)) {
      b.gone = true;
      continue;
    }
    const hoop = hoopAt(world.hoops, b.x + b.w / 2, b.y + b.h / 2);
    if (hoop) scoreHoop(world, hoop);
    hitTargets(world, b);
  }
  world.balls = world.balls.filter((b) => !b.gone);
}

/** Movimiento con rebotes contra la cuadrícula. */
function moveBall(world: World, b: Ball, dt: number): void {
  const vx = b.vx;
  b.vy = Math.min(b.vy + BALL_GRAVITY * dt, BALL_MAX_FALL);
  b.spin += vx * dt * BALL_SPIN_RATE;
  if (moveX(b, vx * dt, world.solidAt)) {
    b.vx = -vx;
    bounce(world, b);
  }
  const falling = b.vy > 0;
  const head = moveY(b, b.vy * dt, world.solidAt);
  if (b.onGround && falling) {
    b.vy = -BALL_BOUNCE_SPEED;
    bounce(world, b);
  } else if (head) {
    b.vy = Math.abs(b.vy);
    bounce(world, b);
  }
}

/** Cuenta un rebote; al agotarlos la pelota se deshace en polvo. */
function bounce(world: World, b: Ball): void {
  b.bounces++;
  if (b.bounces <= BALL_MAX_BOUNCES) return;
  b.gone = true;
  for (let i = 0; i < 6; i++) {
    world.particles.push(
      makeParticle('dust', b.x + b.w / 2, b.y + b.h / 2, { vx: (i - 2.5) * 30, vy: -40 - i * 5 }),
    );
  }
}

function isOut(world: World, b: Ball): boolean {
  return (
    b.t > BALL_LIFETIME ||
    b.y > ROWS * T ||
    b.x + b.w < world.camX - BALL_OFFSCREEN ||
    b.x > world.camX + VW + BALL_OFFSCREEN
  );
}

/** Derriba enemigos (salvo inmunes) y golpea al jefe vulnerable. */
function hitTargets(world: World, b: Ball): void {
  for (const e of world.enemies) {
    if (!e.alive || e.dead || !e.active || !isTangible(e) || BALL_IMMUNE.has(e.id) || !overlap(b, e)) continue;
    world.killEnemy(e, true);
    b.vx = -b.vx;
    bounce(world, b);
    return;
  }
  const boss = world.boss;
  if (boss && boss.hittable && overlap(b, boss)) {
    b.gone = true;
    boss.onFireball(world);
  }
}
