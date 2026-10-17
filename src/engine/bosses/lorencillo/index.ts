import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import type { BossConfig } from '../../level/types';
import { overlap } from '../../physics';
import { makeRng } from '../../rng';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { type LorenAttack, chooseAttack, endsWindow } from './choose';
import { drawLorencillo } from './draw';
import { type Crab, clearCrabs, crabsAlive, fireSalvo, type Shell, stepShells, throwCrab } from './hazards';
import { applyTilt, createTilt, resetTilt, stepTilt, tiltAmount, type Tilt } from './tilt';
import * as K from './tuning';

export type LorenState =
  | 'sleep' | 'intro' | 'idle'
  | 'advance' | 'warn' | 'lunge' | 'exposed'
  | 'cannon' | 'mast'
  | 'hurt' | 'rally' | 'dead' | 'gone';

/** Tocarlo en estos estados hiere al jugador (aunque le pise: rebota en la espada). */
const HARMFUL: ReadonlySet<LorenState> = new Set(['lunge']);
const FLOOR = GROUND * T;
const HURT_SPARKS = 10;
const SPARK_SPEED = 220;
const PHASE2_POPUP = '¡EL BARCO SE INCLINA!';

/**
 * Lorencillo, jefe del Mundo 6 (AGENTS.md §4.4): pirata barracuda de aventura, inspirado
 * en un pirata histórico y presentado como villano de fantasía. Pelea en la cubierta de
 * su barco en dos fases (8 y 4 PV):
 *  1. Estocadas con sable-aleta, cañonazos en arco y piratas cangrejo desde el mástil.
 *  2. Tras un rugido seguro, el barco se inclina: doble estocada con dos avisos y
 *     salva durante el mástil. Las marcas también alcanzan las cofas.
 * Única ventana de daño: la espalda expuesta tras una estocada fallida (`exposed`).
 * Pisotón o dos bolas de fuego quitan 1 PV, solo uno por ventana. Elige con `choose.ts`.
 */
export class Lorencillo implements Boss {
  readonly id = 'lorencillo';
  readonly name = 'LORENCILLO';
  readonly maxHp = K.LORENCILLO_HP;
  hp = K.LORENCILLO_HP;
  x: number;
  y = FLOOR - K.LORENCILLO_H;
  w = K.LORENCILLO_W;
  h = K.LORENCILLO_H;
  face: 1 | -1 = -1;
  st: LorenState = 'sleep';
  /** Tiempo en el estado actual. */
  t = 0;
  /** Reloj continuo para animaciones. */
  clock = 0;
  phase: K.LorenPhase = 1;
  shells: Shell[] = [];
  crabs: Crab[] = [];
  readonly tilt: Tilt = createTilt();
  fireHits = 0;
  readonly arena: readonly [number, number];
  private last: LorenAttack | null = null;
  private sinceWindow = 0;
  private thrown = 0;
  private lunges = 0;
  private readonly rng = makeRng(K.RNG_SEED);

  constructor(cfg: BossConfig) {
    this.x = cfg.x * T;
    this.arena = cfg.arena;
  }

  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'exposed'; }
  get stage(): number { return this.phase; }
  /** El decorado del barco se ladea hacia donde empuja la cubierta. */
  get lean(): number { return tiltAmount(this.tilt); }
  get left(): number { return this.arena[0] * T; }
  get right(): number { return (this.arena[1] + 1) * T; }

  setState(st: LorenState): void {
    // Un disparo en una apertura caducada no cuenta para la siguiente.
    if (st === 'exposed' || this.st === 'exposed') this.fireHits = 0;
    this.st = st;
    this.t = 0;
  }

  faceToPlayer(world: World): void {
    const p = world.player;
    this.face = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
  }

  update(world: World, dt: number): void {
    if (this.st === 'gone') return;
    this.t += dt;
    this.clock += dt;
    if (this.st === 'sleep') return this.wake(world);
    world.camX = Math.min(entranceColumn(this.arena[0]) * T, world.camX + K.CAM_PAN * dt);
    stepShells(world, this.shells, dt);
    this.stepDeck(world, dt);
    this.runState(world, dt);
    this.y = FLOOR - this.h - this.lift();
    this.contact(world);
  }

  private wake(world: World): void {
    if (world.player.x <= (this.arena[0] + 1) * T) return;
    closeArena(world, this.arena[0]);
    this.setState('intro');
    world.audio.play('roar');
  }

  /** La cubierta solo se inclina en la fase 2 y mientras el pirata sigue en pie. */
  private stepDeck(world: World, dt: number): void {
    if (this.phase < 2 || ['dead', 'intro', 'rally', 'hurt', 'exposed'].includes(this.st)) return;
    stepTilt(this.tilt, dt, this.rng);
    applyTilt(world, this.tilt, dt);
  }

  private runState(world: World, dt: number): void {
    const ph = this.phase;
    switch (this.st) {
      case 'intro': if (this.t >= K.INTRO_TIME) this.setState('idle'); break;
      case 'idle':
        this.faceToPlayer(world);
        if (this.t >= K.byPhase(K.IDLE_TIME, ph)) this.startAttack(world);
        break;
      case 'advance': this.advance(world, dt); break;
      case 'warn': if (this.t >= K.byPhase(K.WARN_TIME, ph)) { this.setState('lunge'); world.audio.play('jump'); } break;
      case 'lunge': this.lunge(world, dt); break;
      case 'exposed': if (this.t >= K.byPhase(K.EXPOSED_TIME, ph)) this.setState('idle'); break;
      case 'cannon': if (this.t >= K.byPhase(K.CANNON_TIME, ph)) this.setState('idle'); break;
      case 'mast': this.mast(world, dt); break;
      case 'hurt': if (this.t >= K.HURT_TIME) this.afterHurt(world); break;
      case 'rally': if (this.t >= K.RALLY_TIME) this.setState('idle'); break;
      case 'dead': if (this.t >= K.DEAD_TIME) this.vanish(world); break;
    }
  }

  private startAttack(world: World): void {
    const p = world.player;
    const distTiles = Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) / T;
    const a = chooseAttack({
      phase: this.phase, last: this.last, sinceWindow: this.sinceWindow, distTiles, crabsAlive: crabsAlive(this.crabs),
    }, this.rng);
    this.last = a;
    this.sinceWindow = endsWindow(a) ? 0 : this.sinceWindow + 1;
    this.faceToPlayer(world);
    world.audio.play('warn');
    if (a === 'lunge') { this.lunges = 0; return this.setState('advance'); }
    if (a === 'mast') {
      this.thrown = 0;
      if (this.phase === 2) this.salvo(world);
      return this.setState('mast');
    }
    this.salvo(world);
    this.setState('cannon');
  }

  private salvo(world: World): void {
    const from = this.face > 0 ? this.left + (this.right - this.left) * 0.16 : this.left + (this.right - this.left) * 0.84;
    fireSalvo(this.shells, from, world.player.x + world.player.w / 2,
      this.left, this.right, this.phase, this.rng, world);
  }

  private clampX(): void { this.x = Math.max(this.left, Math.min(this.right - this.w, this.x)); }

  /** Se acerca al jugador y, a tiro, se planta a avisar (la orientación queda fijada). */
  private advance(world: World, dt: number): void {
    this.faceToPlayer(world);
    this.x += this.face * K.byPhase(K.ADVANCE_SPEED, this.phase) * dt;
    this.clampX();
    const p = world.player;
    const near = Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) <= K.LUNGE_RANGE;
    if (near || this.t >= K.ADVANCE_MAX_TIME) this.setState('warn');
  }

  /** Estocada en línea recta; al fallar queda de espaldas, expuesto. */
  private lunge(world: World, dt: number): void {
    this.x += this.face * K.byPhase(K.LUNGE_SPEED, this.phase) * dt;
    const before = this.x;
    this.clampX();
    if (this.x === before && this.t < K.LUNGE_TIME) return;
    if (++this.lunges < K.byPhase(K.LUNGES, this.phase)) {
      this.faceToPlayer(world);
      world.audio.play('warn');
      this.setState('warn');
    } else this.setState('exposed');
  }

  /** Altura sobre la cubierta: sube y baja suavemente en los extremos del estado `mast`. */
  private lift(): number {
    if (this.st !== 'mast') return 0;
    const total = K.byPhase(K.MAST_TIME, this.phase);
    return K.MAST_HEIGHT * Math.max(0, Math.min(1, this.t / K.MAST_RISE, (total - this.t) / K.MAST_RISE));
  }

  private mast(world: World, dt: number): void {
    const target = this.left + (this.right - this.left) * K.MAIN_MAST_FRACTION - this.w / 2;
    const distance = target - this.x;
    this.x += Math.sign(distance) * Math.min(Math.abs(distance), K.MAST_TRAVEL_SPEED * dt);
    if (this.thrown < K.MAST_THROW_AT.length && this.t >= K.MAST_THROW_AT[this.thrown]) {
      this.thrown++;
      this.faceToPlayer(world);
      throwCrab(world, this.crabs, this.x + this.w / 2, this.face, this.arena, FLOOR - this.lift() - T);
      world.audio.play('jump');
    }
    if (this.t >= K.byPhase(K.MAST_TIME, this.phase)) this.setState('idle');
  }

  private contact(world: World): void {
    const p = world.player;
    const blade = { x: this.face > 0 ? this.x + this.w : this.x - K.BLADE_REACH,
      y: this.y + this.h / 2, w: K.BLADE_REACH, h: K.BLADE_HEIGHT };
    const swordHit = this.st === 'lunge' && overlap(p, blade);
    if (world.phase !== 'play' || (!overlap(p, this) && !swordHit)) return;
    const stomp = p.vy > 0 && p.y + p.h - this.y < K.STOMP_MARGIN;
    if (this.st === 'exposed') {
      if (stomp) this.stomped(world);
      return;
    }
    if (!HARMFUL.has(this.st)) return;
    if (stomp) p.vy = -K.STOMP_BOUNCE;
    world.hurt();
  }

  private stomped(world: World): void {
    const p = world.player;
    p.vy = world.input.held.jump ? -K.STOMP_BOUNCE_HELD : -K.STOMP_BOUNCE;
    p.vx = (p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1) * K.STOMP_PUSH;
    world.addScore(K.SCORE_STOMP, this.x + this.w / 2, this.y);
    world.audio.play('stomp');
    this.damage(world);
  }

  /** Dos bolas de fuego dentro de la ventana equivalen a un pisotón. */
  onFireball(world: World): void {
    if (!this.hittable) return;
    this.fireHits++;
    world.addScore(K.SCORE_FIRE, this.x + this.w / 2, this.y);
    if (this.fireHits < K.FIRE_HITS_PER_HP) return world.audio.play('stomp');
    this.damage(world);
  }

  /** Quita 1 PV y cierra la ventana: tras el daño no se le puede golpear otra vez. */
  private damage(world: World): void {
    this.hp--;
    this.fireHits = 0;
    this.shells.length = 0;
    world.shake = K.HURT_SHAKE;
    world.audio.play('roar');
    this.sparks(world);
    if (this.hp > 0) return this.setState('hurt');
    clearCrabs(this.crabs);
    resetTilt(this.tilt);
    world.addScore(K.SCORE_KILL, this.x + this.w / 2, this.y - this.h / 2);
    this.setState('dead');
  }

  private sparks(world: World): void {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 3;
    for (let i = 0; i < HURT_SPARKS; i++) {
      const a = (i / HURT_SPARKS) * Math.PI * 2;
      world.particles.push(makeParticle('spark', cx, cy, { vx: Math.cos(a) * SPARK_SPEED, vy: Math.sin(a) * SPARK_SPEED, col: i % 2 ? '#ffd23f' : '#fff3c4' }));
    }
  }

  /** Tras el daño: al cruzar el umbral el barco empieza a inclinarse; siempre vuelve a la guardia. */
  private afterHurt(world: World): void {
    if (this.phase === 1 && this.hp <= K.PHASE2_HP) {
      this.phase = 2;
      resetTilt(this.tilt);
      this.shells.length = 0;
      clearCrabs(this.crabs);
      world.shake = K.HURT_SHAKE;
      world.popups.push({ x: this.x + this.w / 2, y: this.y - 35, t: 0, txt: PHASE2_POPUP });
      world.audio.play('roar');
      return this.setState('rally');
    }
    this.setState('idle');
  }

  /** Se desvanece, abre el muro de salida y suelta el premio. */
  private vanish(world: World): void {
    this.setState('gone');
    this.shells.length = 0;
    rewardBurst(world, this);
    openExit(world, this.arena[1]);
    world.popups.push({ x: this.x, y: this.y, t: 0, txt: '¡EL CAMINO ESTÁ LIBRE!' });
    world.audio.play('flag');
  }

  draw(c: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawLorencillo(c, this, camX); }
}
