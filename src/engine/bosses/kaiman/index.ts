import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import { createPlatform } from '../../entities/platforms';
import type { BossConfig } from '../../level/types';
import { moveX, moveY, overlap, type SolidFn } from '../../physics';
import { makeRng } from '../../rng';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { emergeX, splash, stepWaves, surfaceY, tailWaves, type TailWave } from './attacks';
import { type Attack, chooseAttack } from './choose';
import { drawKaiman } from './draw';
import { arenaSurface, floodArena, risingSurface } from './flood';
import { dropPropagules, type MudBall, type Propagule, spitMud, stepMud, stepPropagules } from './hazards';
import * as K from './tuning';

export type KaimanState =
  | 'sleep' | 'intro' | 'walk'
  | 'gape' | 'bite' | 'pant'
  | 'tailPrep' | 'tail'
  | 'spitPrep' | 'spit'
  | 'slamPrep' | 'slam'
  | 'dive' | 'submerged' | 'warn' | 'emerge' | 'exposed'
  | 'hurt' | 'rising' | 'enrage' | 'dead' | 'gone';

/** Estados en los que las bolas de fuego le pasan de largo (bajo el agua, presentándose, herido…). */
const NON_HITTABLE: ReadonlySet<KaimanState> = new Set([
  'sleep', 'intro', 'dive', 'submerged', 'warn', 'hurt', 'rising', 'enrage', 'dead', 'gone',
]);
/** Fauces abiertas: el único momento en que el fuego le hace daño. */
const JAWS_OPEN: ReadonlySet<KaimanState> = new Set(['gape', 'bite', 'pant', 'spitPrep', 'spit', 'rising', 'enrage']);
/** Tocarlo en estos estados no hace daño (en `exposed` se le pisa). */
const HARMLESS: ReadonlySet<KaimanState> = new Set([
  'sleep', 'intro', 'dive', 'submerged', 'warn', 'exposed', 'hurt', 'rising', 'enrage', 'dead', 'gone',
]);
const UNDERWATER: ReadonlySet<KaimanState> = new Set(['submerged', 'warn']);

const FIRST_STATE: Readonly<Record<Attack, KaimanState>> = {
  bite: 'gape', tail: 'tailPrep', dive: 'dive', spit: 'spitPrep', slam: 'slamPrep',
};

/** Velocidad (px/s) con la que la cámara se centra en la arena. */
const CAM_PAN = 1200;
const STOMP_REBOUND = 600;
/** Semilla del azar del jefe: misma pelea para la misma partida de entradas. */
const RNG_SEED = 0x2a7c;
/** Altura (px) de la boca respecto a la parte superior de la caja. */
const MOUTH_Y = 18;

/**
 * Kaimán Moreleti, jefe del Mundo 2 (AGENTS.md §4.4): cocodrilo de pantano
 * (*Crocodylus moreletii*). Tres fases:
 *  1. Muerde en carrera, lanza olas con la cola, escupe lodo y se sumerge para
 *     emerger bajo el jugador.
 *  2. (≤ `PHASE2_HP`) El agua sube, flotan troncos a la deriva y golpea las raíces del
 *     mangle para que caigan propágulos.
 *  3. (≤ `PHASE3_HP`) Frenesí bajo la tormenta: más rápido, dos olas seguidas,
 *     emboscada doble y más proyectiles.
 * Elige ataques con pesos según la distancia (`choose.ts`). Punto débil: el lomo
 * tras emerger (pisotón) y el fuego dentro de las fauces abiertas.
 */
export class Kaiman implements Boss {
  readonly id = 'kaiman';
  readonly name = 'KAIMÁN MORELETI';
  readonly maxHp = K.KAIMAN_HP;
  x: number;
  y = GROUND * T - K.KAIMAN_H;
  w = K.KAIMAN_W;
  h = K.KAIMAN_H;
  vx = 0;
  vy = 0;
  face: 1 | -1 = -1;
  onGround = false;
  hp = K.KAIMAN_HP;
  st: KaimanState = 'sleep';
  /** Tiempo en el estado actual. */
  t = 0;
  /** Reloj continuo para animaciones. */
  clock = 0;
  phase: K.KaimanPhase = 1;
  waves: TailWave[] = [];
  mud: MudBall[] = [];
  propagules: Propagule[] = [];
  /** Altura (px) de la superficie bajo el jefe (para el dibujo de ondas y ojos). */
  surfY = GROUND * T;
  /** Último ataque elegido (no se repite dos veces seguidas). */
  lastAttack: Attack | null = null;
  private targetX = 0;
  private sinceDive = 0;
  private divesLeft = 0;
  private fireHits = 0;
  /** Pies del jugador en el paso anterior (px): distingue caer sobre el lomo de estar quieto encima. */
  private prevFeet = Infinity;
  private floodFrom: number | null = null;
  private readonly rng = makeRng(RNG_SEED);
  private readonly a0: number;
  private readonly a1: number;

  constructor(cfg: BossConfig) {
    this.x = cfg.x * T;
    [this.a0, this.a1] = cfg.arena;
  }

  get phase2(): boolean {
    return this.phase >= 2;
  }
  get stage(): number {
    return this.phase;
  }
  get lockCamera(): boolean {
    return this.st !== 'sleep' && this.st !== 'gone';
  }
  get hudVisible(): boolean {
    return this.lockCamera;
  }
  get intro(): boolean {
    return this.st === 'intro';
  }
  get hittable(): boolean {
    return !NON_HITTABLE.has(this.st);
  }
  get jawsOpen(): boolean {
    return JAWS_OPEN.has(this.st);
  }
  get underwater(): boolean {
    return UNDERWATER.has(this.st);
  }
  /** Bordes de la arena en px. */
  get left(): number {
    return this.a0 * T;
  }
  get right(): number {
    return (this.a1 + 1) * T;
  }

  private set(st: KaimanState): void {
    this.st = st;
    this.t = 0;
  }

  private by(values: K.ByPhase): number {
    return K.byPhase(values, this.phase);
  }

  private faceToPlayer(world: World): void {
    const p = world.player;
    this.face = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
  }

  /** El jefe atraviesa los troncos flotantes: solo choca con el suelo y los muros de la arena. */
  private solidFn(world: World): SolidFn {
    return (tx, ty) => world.solid(tx, ty) && (ty >= GROUND || tx < this.a0 || tx > this.a1);
  }

  update(world: World, dt: number): void {
    if (this.st === 'gone') return;
    this.t += dt;
    this.clock += dt;
    if (this.st === 'sleep') return this.wake(world);
    // La cámara queda fija sobre la arena mientras dura la pelea.
    if (this.st !== 'dead') world.camX = Math.min(entranceColumn(this.a0) * T, world.camX + CAM_PAN * dt);
    this.waves = stepWaves(world, this.waves, dt, this.left, this.right);
    this.mud = stepMud(world, this.mud, dt, this.left, this.right);
    this.propagules = stepPropagules(world, this.propagules, dt);
    this.vy = Math.min(this.vy + K.GRAVITY * dt, K.MAX_FALL);
    this.runState(world, dt);
    this.move(world, dt);
    this.surfY = surfaceY(world, this.x + this.w / 2);
    this.contactPlayer(world);
  }

  private wake(world: World): void {
    if (world.player.x <= (this.a0 + 1) * T) return;
    closeArena(world, this.a0);
    this.set('intro');
    world.audio.play('roar');
    world.shake = 0.5;
  }

  private move(world: World, dt: number): void {
    const solid = this.solidFn(world);
    const hitWall = moveX(this, this.vx * dt, solid);
    const wasAir = !this.onGround;
    moveY(this, this.vy * dt, solid);
    if (hitWall && this.st === 'bite') {
      this.set('pant');
      world.shake = 0.4;
      world.audio.play('brk');
    }
    if (this.st === 'emerge' && this.onGround && wasAir) this.land(world);
  }

  /** Cae tras emerger: en la fase 3 vuelve a hundirse una vez antes de quedar expuesto. */
  private land(world: World): void {
    splash(world, this.x + this.w / 2, this.surfY);
    world.shake = 0.25;
    world.audio.play('bump');
    if (--this.divesLeft > 0) {
      this.faceToPlayer(world);
      this.set('dive');
    } else this.set('exposed');
  }

  /** Lógica de cada estado: velocidad horizontal y transiciones por tiempo. */
  private runState(world: World, dt: number): void {
    const speed = this.by(K.PHASE_SPEED);
    this.vx = 0;
    switch (this.st) {
      case 'intro':
        if (this.t > K.INTRO_TIME) this.set('walk');
        break;
      case 'walk':
        this.faceToPlayer(world);
        this.vx = this.face * K.WALK_SPEED * speed;
        if (this.t > this.by(K.WALK_TIME)) this.startAttack(world);
        break;
      case 'gape': // aviso: abre las fauces y tiembla
        this.faceToPlayer(world);
        if (this.t > this.by(K.GAPE_TIME)) this.set('bite');
        break;
      case 'bite':
        this.vx = this.face * K.BITE_SPEED * speed;
        this.kickDust(world, dt);
        if (this.t > K.BITE_MAX_TIME) this.set('pant');
        break;
      case 'tailPrep':
        this.faceToPlayer(world);
        if (this.t > this.by(K.TAIL_PREP_TIME)) this.tailSweep(world);
        break;
      case 'spitPrep':
        this.faceToPlayer(world);
        if (this.t > this.by(K.SPIT_PREP_TIME)) this.spit(world);
        break;
      case 'slamPrep':
        if (this.t > this.by(K.SLAM_PREP_TIME)) this.slam(world);
        break;
      case 'submerged':
        this.chase(world, speed);
        break;
      case 'warn': // quieto bajo el jugador: burbujas y ondas
        this.x = this.targetX;
        if (this.t > this.by(K.WARN_TIME)) this.emerge(world);
        break;
      case 'rising':
        this.flood(world);
        if (this.t > K.RISE_TIME) this.set('walk');
        break;
      case 'enrage':
        if (Math.random() < dt * 6) world.shake = Math.max(world.shake, 0.15);
        if (this.t > K.ENRAGE_TIME) this.set('walk');
        break;
      case 'dead':
        if (this.t > K.DEAD_TIME) this.vanish(world);
        break;
      default:
        this.timeouts();
    }
  }

  /** Estados quietos que solo esperan a que pase su tiempo. */
  private timeouts(): void {
    const limits: Partial<Record<KaimanState, [number, KaimanState]>> = {
      pant: [this.by(K.PANT_TIME), 'walk'],
      tail: [K.TAIL_TIME, 'walk'],
      spit: [K.SPIT_TIME, 'walk'],
      slam: [K.SLAM_TIME, 'walk'],
      dive: [K.DIVE_TIME, 'submerged'],
      exposed: [this.by(K.EXPOSED_TIME), 'walk'],
      hurt: [K.HURT_TIME, 'walk'],
    };
    const lim = limits[this.st];
    if (lim && this.t > lim[0]) this.set(lim[1]);
  }

  private startAttack(world: World): void {
    const p = world.player;
    const distTiles = Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) / T;
    const next = chooseAttack({ phase: this.phase, last: this.lastAttack, sinceDive: this.sinceDive, distTiles }, this.rng);
    this.lastAttack = next;
    this.sinceDive = next === 'dive' ? 0 : this.sinceDive + 1;
    if (next === 'dive') this.divesLeft = this.by(K.DIVE_CHAIN);
    this.set(FIRST_STATE[next]);
    world.audio.play('warn');
    if (next === 'dive') splash(world, this.x + this.w / 2, this.surfY);
  }

  private kickDust(world: World, dt: number): void {
    if (Math.random() >= dt * 30) return;
    const x = this.x + this.w / 2 - this.face * 70;
    world.particles.push(makeParticle('dust', x, this.y + this.h - 4, { vx: -this.face * 60, vy: -40 }));
  }

  private tailSweep(world: World): void {
    const tailX = this.x + this.w / 2 - this.face * (this.w / 2);
    this.waves = [...this.waves, ...tailWaves(tailX, this.face, this.phase)];
    splash(world, tailX, this.surfY);
    world.shake = 0.25;
    world.audio.play('quills');
    this.set('tail');
  }

  /** Escupe bolas de lodo en arco hacia donde está el jugador. */
  private spit(world: World): void {
    const p = world.player;
    const mouthX = this.x + this.w / 2 + this.face * (this.w / 2);
    this.mud = [...this.mud, ...spitMud(mouthX, this.y + MOUTH_Y, p.x + p.w / 2, this.phase)];
    world.audio.play('quills');
    this.set('spit');
  }

  /** Coletazo contra las raíces del mangle: llueven propágulos con aviso. */
  private slam(world: World): void {
    this.propagules = [...this.propagules, ...dropPropagules(world, this.left, this.right, this.phase, this.rng)];
    splash(world, this.x + this.w / 2 - this.face * (this.w / 2), this.surfY);
    world.shake = 0.45;
    world.audio.play('brk');
    this.set('slam');
  }

  /** Bajo el agua nada hacia el jugador; luego se detiene y avisa. */
  private chase(world: World, speed: number): void {
    const target = emergeX(world, this.w, this.left, this.right);
    const d = target - this.x;
    this.vx = Math.abs(d) > 4 ? Math.sign(d) * K.SUBMERGED_SPEED * speed : 0;
    if (this.t <= this.by(K.SUBMERGED_TIME)) return;
    this.targetX = target;
    this.faceToPlayer(world);
    this.set('warn');
    world.audio.play('warn');
  }

  private emerge(world: World): void {
    this.vy = -K.EMERGE_JUMP;
    this.onGround = false;
    splash(world, this.x + this.w / 2, this.surfY);
    world.shake = 0.35;
    world.audio.play('roar');
    this.set('emerge');
  }

  private contactPlayer(world: World): void {
    const p = world.player;
    const feet = p.y + p.h;
    // Con la crecida, los troncos a la deriva quedan justo bajo el lomo: el jugador que
    // cae se apoya en ellos (vy = 0) antes de este contacto. Si sus pies bajaron en este
    // paso, sigue siendo un pisotón; quedarse quieto encima no lo es.
    const falling = p.vy > 0 || feet > this.prevFeet;
    this.prevFeet = feet;
    if (world.phase !== 'play' || !overlap(p, this)) return;
    const feetOnBack = feet - this.y < K.STOMP_MARGIN;
    const stomp = p.vy > 0 && feetOnBack;
    if (this.st === 'exposed') {
      if (feetOnBack && falling) this.stomped(world);
      return;
    }
    if (HARMLESS.has(this.st)) return;
    if (stomp) p.vy = -STOMP_REBOUND; // rebota en las escamas
    const wasVulnerable = p.inv <= 0;
    world.hurt();
    if (!wasVulnerable || world.phase !== 'play') return;
    p.vx = (p.x < this.x ? -1 : 1) * K.KNOCKBACK;
    if (this.st === 'emerge') p.vy = -K.EMERGE_LAUNCH;
  }

  private stomped(world: World): void {
    const p = world.player;
    this.hp--;
    p.vy = world.input.held.jump ? -K.STOMP_BOUNCE_HELD : -K.STOMP_BOUNCE;
    p.vx = (p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1) * K.STOMP_PUSH;
    world.addScore(K.SCORE_STOMP, this.x + this.w / 2, this.y);
    world.audio.play('stomp');
    world.shake = 0.3;
    this.afterHit(world);
  }

  /** Dos bolas de fuego dentro de las fauces abiertas equivalen a un pisotón. */
  onFireball(world: World): void {
    if (!this.jawsOpen) {
      world.audio.play('bump'); // las escamas desvían el fuego
      return;
    }
    this.fireHits++;
    world.addScore(K.SCORE_FIRE, this.x + this.w / 2, this.y);
    if (this.fireHits < K.FIRE_HITS_PER_HP) {
      world.audio.play('stomp');
      return;
    }
    this.fireHits = 0;
    this.hp--;
    world.shake = 0.3;
    this.afterHit(world);
  }

  private afterHit(world: World): void {
    world.audio.play('roar');
    if (this.hp <= 0) {
      this.set('dead');
      this.waves = [];
      this.mud = [];
      this.propagules = [];
      world.addScore(K.SCORE_KILL, this.x + this.w / 2, this.y - 30);
    } else if (this.phase < 2 && this.hp <= K.PHASE2_HP) {
      this.startPhase2(world);
    } else if (this.phase < 3 && this.hp <= K.PHASE3_HP) {
      this.startPhase3(world);
    } else this.set('hurt');
  }

  /** Fase 2: ruge, el agua del pantano sube durante `RISE_TIME` y flotan troncos a la deriva. */
  private startPhase2(world: World): void {
    this.phase = 2;
    this.floodFrom = arenaSurface(world.level.water, this.a0, this.a1);
    for (const [x, length, dx, period] of K.DRIFT_LOGS) {
      world.platforms.push(createPlatform({ kind: 'mover', x, y: K.DRIFT_LOG_ROW, length, dx, dy: 0, period }));
    }
    world.shake = 0.6;
    this.set('rising');
  }

  /** Fase 3: frenesí bajo la tormenta. */
  private startPhase3(world: World): void {
    this.phase = 3;
    this.sinceDive = 0;
    this.mud = [];
    world.shake = 0.7;
    world.audio.play('roar');
    this.set('enrage');
  }

  private flood(world: World): void {
    if (this.floodFrom === null) return;
    const surface = risingSurface(this.floodFrom, Math.min(this.floodFrom, K.PHASE2_SURFACE), this.t / K.RISE_TIME);
    world.level.water = floodArena(world.level.water, this.a0, this.a1, surface);
  }

  /** Desaparece entre chispas, suelta monedas y abre el muro de salida. */
  private vanish(world: World): void {
    this.set('gone');
    rewardBurst(world, this);
    openExit(world, this.a1);
    world.audio.play('brk');
    world.audio.play('flag');
    world.shake = 0.4;
  }

  draw(ctx: CanvasRenderingContext2D, _assets: Assets, camX: number): void {
    drawKaiman(ctx, this, camX);
  }
}
