import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import { makeParticle } from '../../entities/particles';
import type { BossConfig } from '../../level/types';
import { moveX, moveY, overlap, type SolidFn } from '../../physics';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { barkWaves, behindPlayerX, leapVx, mistBurst, stepShockWaves, type ShockWave } from './attacks';
import { drawHuayPek } from './draw';
import * as K from './tuning';

export type HuayPekState =
  | 'sleep' | 'intro' | 'prowl'
  | 'growl' | 'bark'
  | 'crouch' | 'leap'
  | 'fade' | 'hidden' | 'warn' | 'lunge'
  | 'vulnerable' | 'hurt' | 'rising' | 'dead' | 'gone';
type Attack = 'bark' | 'leap' | 'vanish';

/** Ojos encendidos: el único momento en que se le puede pisar o quemar. */
const EYES_LIT: ReadonlySet<HuayPekState> = new Set(['vulnerable']);
/** Estados en los que las bolas de fuego le pasan de largo (todos salvo con los ojos encendidos). */
const NON_HITTABLE: ReadonlySet<HuayPekState> = new Set([
  'sleep', 'intro', 'prowl', 'growl', 'bark', 'crouch', 'leap',
  'fade', 'hidden', 'warn', 'lunge', 'hurt', 'rising', 'dead', 'gone',
]);
/** Tocarlo en estos estados no hace daño (con los ojos encendidos se le pisa). */
const HARMLESS: ReadonlySet<HuayPekState> = new Set([
  'sleep', 'intro', 'fade', 'hidden', 'warn', 'vulnerable', 'hurt', 'rising', 'dead', 'gone',
]);

const PATTERN_1: readonly Attack[] = ['bark', 'leap', 'vanish', 'bark', 'vanish'];
const PATTERN_2: readonly Attack[] = ['vanish', 'bark', 'leap', 'vanish', 'bark', 'leap'];
const FIRST_STATE: Readonly<Record<Attack, HuayPekState>> = { bark: 'growl', leap: 'crouch', vanish: 'fade' };

/** Velocidad (px/s) con la que la cámara se centra en la arena. */
const CAM_PAN = 1200;
/** Probabilidad por paso de levantar polvo en la embestida. */
const DUST_CHANCE = 0.25;

/**
 * Huay Pek, jefe del Mundo 4 (AGENTS.md §4.4): perro espectral de la leyenda
 * yucateca, que ronda de noche por los caminos. Ladra ondas de choque que viajan por
 * el suelo, salta sobre el jugador y se deshace en la niebla para reaparecer a su
 * espalda. Punto débil: los ojos; solo cuando se le encienden se le puede pisar o
 * quemar. A mitad de vida aúlla, la niebla cubre la arena y se vuelve más rápido.
 */
export class HuayPek implements Boss {
  readonly id = 'huayPek';
  readonly name = 'HUAY PEK';
  readonly maxHp = K.HUAY_PEK_HP;
  x: number;
  y = GROUND * T - K.HUAY_PEK_H;
  w = K.HUAY_PEK_W;
  h = K.HUAY_PEK_H;
  vx = 0;
  vy = 0;
  face: 1 | -1 = -1;
  onGround = false;
  hp = K.HUAY_PEK_HP;
  st: HuayPekState = 'sleep';
  /** Tiempo en el estado actual. */
  t = 0;
  /** Reloj continuo para animaciones. */
  clock = 0;
  phase2 = false;
  /** Densidad de la niebla de la arena (0 = ambiente de la fase 1, 1 = fase 2). */
  fog = 0;
  /** Centro del jugador (px de mundo): el claro que abre en la niebla. */
  lightX = 0;
  lightY = 0;
  waves: ShockWave[] = [];
  private cycle = 0;
  private fireHits = 0;
  private readonly a0: number;
  private readonly a1: number;

  constructor(cfg: BossConfig) {
    this.x = cfg.x * T;
    [this.a0, this.a1] = cfg.arena;
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
  get eyesLit(): boolean {
    return EYES_LIT.has(this.st);
  }
  /** Bordes de la arena en px. */
  get left(): number {
    return this.a0 * T;
  }
  get right(): number {
    return (this.a1 + 1) * T;
  }

  private set(st: HuayPekState): void {
    this.st = st;
    this.t = 0;
  }

  private faceToPlayer(world: World): void {
    const p = world.player;
    this.face = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
  }

  /** Solo choca con el suelo y los muros de la arena (salta por debajo de las ramas). */
  private solidFn(world: World): SolidFn {
    return (tx, ty) => world.solid(tx, ty) && (ty >= GROUND || tx < this.a0 || tx > this.a1);
  }

  update(world: World, dt: number): void {
    if (this.st === 'gone') return;
    this.t += dt;
    this.clock += dt;
    const p = world.player;
    this.lightX = p.x + p.w / 2;
    this.lightY = p.y + p.h / 2;
    if (this.st === 'sleep') return this.wake(world);
    // La cámara queda fija sobre la arena mientras dura la pelea.
    if (this.st !== 'dead') world.camX = Math.min(entranceColumn(this.a0) * T, world.camX + CAM_PAN * dt);
    this.waves = stepShockWaves(world, this.waves, dt, this.left, this.right);
    this.vy = Math.min(this.vy + K.GRAVITY * dt, K.MAX_FALL);
    this.runState(world);
    this.move(world, dt);
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
    if (hitWall && this.st === 'lunge') this.daze(world);
    if (this.st === 'leap' && this.onGround && wasAir && this.t > dt) this.daze(world);
  }

  /** Lógica de cada estado: velocidad horizontal y transiciones por tiempo. */
  private runState(world: World): void {
    const p2 = this.phase2;
    const speed = p2 ? K.PHASE2_SPEED : 1;
    if (this.st !== 'leap') this.vx = 0;
    switch (this.st) {
      case 'intro':
        if (this.t > K.INTRO_TIME) this.set('prowl');
        break;
      case 'prowl':
        this.faceToPlayer(world);
        this.vx = this.face * K.PROWL_SPEED * speed;
        if (this.t > K.byPhase(K.PROWL_TIME, p2)) this.startAttack(world);
        break;
      case 'growl':
        this.faceToPlayer(world);
        if (this.t > K.byPhase(K.GROWL_TIME, p2)) this.bark(world);
        break;
      case 'crouch':
        this.faceToPlayer(world);
        if (this.t > K.byPhase(K.CROUCH_TIME, p2)) this.leap(world);
        break;
      case 'hidden':
        if (this.t > K.byPhase(K.HIDDEN_TIME, p2)) this.reappear(world);
        break;
      case 'warn':
        this.faceToPlayer(world);
        if (this.t > K.byPhase(K.WARN_TIME, p2)) this.set('lunge');
        break;
      case 'lunge':
        this.vx = this.face * K.LUNGE_SPEED * speed;
        this.kickDust(world);
        if (this.t > K.LUNGE_MAX_TIME) this.daze(world);
        break;
      case 'rising':
        this.fog = Math.min(1, this.t / K.RISE_TIME);
        if (this.t > K.RISE_TIME) this.set('prowl');
        break;
      case 'dead':
        if (this.t > K.DEAD_TIME) this.vanish(world);
        break;
      default:
        this.timeouts(p2, world);
    }
  }

  /** Estados quietos que solo esperan a que pase su tiempo. */
  private timeouts(p2: boolean, world: World): void {
    const limits: Partial<Record<HuayPekState, [number, HuayPekState]>> = {
      bark: [K.BARK_TIME, 'prowl'],
      fade: [K.FADE_TIME, 'hidden'],
      vulnerable: [K.byPhase(K.VULNERABLE_TIME, p2), 'prowl'],
      hurt: [K.HURT_TIME, 'prowl'],
    };
    const lim = limits[this.st];
    if (!lim || this.t <= lim[0]) return;
    if (this.st === 'fade') mistBurst(world, this.x + this.w / 2, this.y + this.h / 2);
    this.set(lim[1]);
  }

  private startAttack(world: World): void {
    const pattern = this.phase2 ? PATTERN_2 : PATTERN_1;
    const next = pattern[this.cycle++ % pattern.length];
    this.set(FIRST_STATE[next]);
    world.audio.play('warn');
  }

  private bark(world: World): void {
    const mouth = this.x + this.w / 2 + this.face * (this.w / 2);
    this.waves = [...this.waves, ...barkWaves(mouth, this.face, this.phase2)];
    world.shake = 0.25;
    world.audio.play('roar');
    this.set('bark');
  }

  private leap(world: World): void {
    const p = world.player;
    const target = p.x + p.w / 2 - this.w / 2;
    this.vx = leapVx(this.x, Math.max(this.left, Math.min(this.right - this.w, target)));
    this.vy = -K.LEAP_JUMP;
    this.onGround = false;
    world.audio.play('jump');
    this.set('leap');
  }

  /** Reaparece a la espalda del jugador, con los ojos rojos como aviso. */
  private reappear(world: World): void {
    this.x = behindPlayerX(world, this.w, this.left, this.right);
    this.faceToPlayer(world);
    mistBurst(world, this.x + this.w / 2, this.y + this.h / 2);
    world.audio.play('warn');
    this.set('warn');
  }

  /** Aterriza o choca: queda mareado con los ojos encendidos. */
  private daze(world: World): void {
    this.vx = 0;
    world.shake = 0.3;
    world.audio.play('bump');
    this.set('vulnerable');
  }

  private kickDust(world: World): void {
    if (Math.random() > DUST_CHANCE) return;
    const x = this.x + this.w / 2 - this.face * 40;
    world.particles.push(makeParticle('dust', x, this.y + this.h - 4, { vx: -this.face * 60, vy: -40 }));
  }

  private contactPlayer(world: World): void {
    const p = world.player;
    if (world.phase !== 'play' || !overlap(p, this)) return;
    const stomp = p.vy > 0 && p.y + p.h - this.y < K.STOMP_MARGIN;
    if (this.eyesLit) {
      if (stomp) this.stomped(world);
      return;
    }
    if (HARMLESS.has(this.st)) return;
    if (stomp) p.vy = -K.STOMP_REBOUND; // rebota en el pelaje sombrío
    const wasVulnerable = p.inv <= 0;
    world.hurt();
    if (!wasVulnerable || world.phase !== 'play') return;
    p.vx = (p.x < this.x ? -1 : 1) * K.KNOCKBACK;
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

  /** Dos bolas de fuego con los ojos encendidos equivalen a un pisotón. */
  onFireball(world: World): void {
    if (!this.eyesLit) {
      world.audio.play('bump'); // el fuego atraviesa la sombra sin dañarla
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
      world.addScore(K.SCORE_KILL, this.x + this.w / 2, this.y - 30);
    } else if (!this.phase2 && this.hp <= this.maxHp / 2) {
      // Fase 2: aúlla y la niebla cubre la arena durante `RISE_TIME`.
      this.phase2 = true;
      world.darkness = { radius: K.FOG_LIGHT_RADIUS, alpha: K.FOG_ALPHA };
      this.cycle = 0;
      world.shake = 0.6;
      this.set('rising');
    } else this.set('hurt');
  }

  /** Se disuelve en la niebla, suelta monedas y abre el muro de salida. */
  private vanish(world: World): void {
    this.set('gone');
    this.fog = 0;
    world.darkness = world.def.darkness ?? null;
    rewardBurst(world, this);
    openExit(world, this.a1);
    world.audio.play('brk');
    world.audio.play('flag');
    world.shake = 0.4;
  }

  draw(ctx: CanvasRenderingContext2D, _assets: Assets, camX: number): void {
    drawHuayPek(ctx, this, camX);
  }
}
