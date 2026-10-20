import type { Assets } from '../../assets';
import { T } from '../../constants';
import type { BossConfig } from '../../level/types';
import { overlap } from '../../physics';
import { makeRng } from '../../rng';
import type { Rect } from '../../types';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { chooseAttack, type SeaAttack } from './choose';
import { clamp, salvo, startHazard, stepShots, stepTides, stepVortices, type SeaShot, type SeaTide, type SeaVortex } from './hazards';
import { drawSargazo } from './draw';
import { TurtleTeam } from './turtles';
import * as K from './tuning';

export type SargazoState = 'sleep' | 'intro' | 'idle' | 'warn' | 'attack' | 'exposed' | 'hurt' | 'shed' | 'dead' | 'gone';

/** Combate submarino: rescatar aliadas rompe el escudo y permite tocar el núcleo. */
export class Sargazo implements Boss {
  readonly id = 'sargazo';
  readonly name = 'CAPITÁN SARGAZO';
  readonly maxHp = K.HP;
  hp = K.HP;
  x: number;
  y = K.START_Y;
  w = K.WIDTH;
  h = K.HEIGHT;
  face: 1 | -1 = -1;
  st: SargazoState = 'sleep';
  t = 0;
  clock = 0;
  phase: K.SeaPhase = 1;
  attack: SeaAttack = 'salvo';
  targetX = 0;
  targetY = K.START_Y;
  targetTurtle = 0;
  readonly team = new TurtleTeam();
  readonly shots: SeaShot[] = [];
  readonly tides: SeaTide[] = [];
  readonly vortices: SeaVortex[] = [];
  readonly arena: readonly [number, number];
  private last: SeaAttack | null = null;
  private sinceRescue = 0;
  private fireHits = 0;
  private volleyAt = 0;
  private readonly rng = makeRng(K.RNG_SEED);

  constructor(cfg: BossConfig) { this.x = cfg.x * T; this.arena = cfg.arena; }
  get left(): number { return this.arena[0] * T; }
  get right(): number { return (this.arena[1] + 1) * T; }
  get stage(): number { return this.phase; }
  get layer(): number { return this.phase; }
  get turtles() { return this.team.allies; }
  get rescues(): number { return this.team.rescues; }
  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'exposed'; }
  get warningTime(): number { return this.attack === 'tide' ? K.TIDE_WARN : K.byPhase(K.WARN, this.phase); }
  providesAir(body: Rect): boolean { return this.lockCamera && this.team.providesAir(body); }
  private set(st: SargazoState): void { this.st = st; this.t = 0; }

  update(world: World, dt: number): void {
    if (this.st === 'gone' || world.phase !== 'play') return;
    this.t += dt; this.clock += dt;
    this.team.bind(world, this.left, this.right);
    if (this.st === 'sleep') return this.wake(world);
    world.camX = Math.min(entranceColumn(this.arena[0]) * T, world.camX + K.CAM_PAN * dt);
    stepShots(world, this.shots, dt, this.left, this.right);
    stepTides(world, this.tides, dt, this.left, this.right);
    stepVortices(world, this.vortices, this.phase, dt);
    if (this.team.step(world, this, dt) && this.hp > 0) this.expose(world);
    this.runState(world, dt);
    this.contact(world);
  }

  private wake(world: World): void {
    if (world.player.x <= (this.arena[0] + 1) * T) return;
    closeArena(world, this.arena[0], this.arena[1]);
    this.set('intro'); world.audio.play('roar');
  }

  private runState(world: World, dt: number): void {
    switch (this.st) {
      case 'intro': if (this.t >= K.INTRO_TIME) this.set('idle'); break;
      case 'idle': if (this.t >= K.byPhase(K.IDLE, this.phase)) this.prepare(world); break;
      case 'warn': if (this.t >= this.warningTime) this.startAttack(world); break;
      case 'attack': this.attackStep(world, dt); break;
      case 'exposed': if (this.t >= K.byPhase(K.EXPOSED, this.phase)) this.set('idle'); break;
      case 'hurt': if (this.t >= K.HURT_TIME) this.set('idle'); break;
      case 'shed': if (this.t >= K.SHED_TIME) this.set('idle'); break;
      case 'dead': if (this.t >= K.DEAD_TIME) this.finish(world); break;
    }
  }

  private prepare(world: World): void {
    const p = world.player;
    this.attack = chooseAttack(this.phase, this.last, this.sinceRescue, Math.abs(p.x - this.x), this.rng);
    this.last = this.attack;
    this.targetX = clamp(p.x + p.w / 2, this.left + K.VORTEX_RADIUS, this.right - K.VORTEX_RADIUS);
    this.targetY = clamp(p.y + p.h / 2, K.WARNING_Y_MIN, K.WARNING_Y_MAX);
    this.targetTurtle = this.team.target(this);
    this.face = this.targetX < this.x + this.w / 2 ? -1 : 1;
    this.set('warn'); world.audio.play('warn');
  }

  private startAttack(world: World): void {
    this.set('attack');
    startHazard(this, world);
    this.volleyAt = K.byPhase(K.NET_VOLLEY, this.phase);
    this.sinceRescue = this.attack === 'net' ? 0 : this.sinceRescue + 1;
  }

  private attackStep(world: World, dt: number): void {
    if (this.attack === 'net') {
      if (this.t >= this.volleyAt && !this.team.pulse) {
        const p = world.player;
        this.targetX = p.x + p.w / 2; this.targetY = p.y + p.h / 2;
        salvo(this, 1, K.SEED_WARN);
        this.volleyAt += K.byPhase(K.NET_VOLLEY, this.phase);
        world.audio.play('warn');
      }
      return;
    }
    if (this.attack === 'surge') this.x = clamp(this.x + this.face * K.byPhase(K.DASH_SPEED, this.phase) * dt, this.left, this.right - this.w);
    if (this.t >= K.byPhase(K.ATTACK_TIME, this.phase)) this.set('idle');
  }

  private expose(world: World): void {
    this.clearHazards(); this.fireHits = 0;
    this.set('exposed'); world.audio.play('bump');
  }

  private contact(world: World): void {
    const p = world.player;
    if (!overlap(p, this)) return;
    if (this.hittable) {
      p.vx = (p.x < this.x ? -1 : 1) * K.CONTACT_PUSH;
      p.vy = -K.CONTACT_LIFT;
      this.damage(world);
    } else if (this.st === 'attack' && this.attack === 'surge') world.hurt();
  }

  onFireball(world: World): void {
    if (!this.hittable) return;
    if (++this.fireHits < K.FIRE_HITS) { world.audio.play('stomp'); return; }
    this.damage(world);
  }

  private damage(world: World): void {
    this.hp--; this.fireHits = 0;
    this.clearHazards(); this.team.restore();
    world.addScore(K.HIT_SCORE, this.x + this.w / 2, this.y); world.audio.play('stomp');
    world.shake = K.HIT_SHAKE;
    if (this.hp <= 0) {
      this.set('dead'); world.addScore(K.DEFEAT_SCORE, this.x, this.y); return;
    }
    const next = K.phaseFor(this.hp);
    if (next > this.phase) {
      this.phase = next; this.set('shed'); world.audio.play('roar');
      world.popups.push({ x: this.x, y: this.y - 30, t: 0, txt: 'FASE ' + next });
    } else this.set('hurt');
  }

  private clearHazards(): void { this.shots.length = 0; this.tides.length = 0; this.vortices.length = 0; }

  private finish(world: World): void {
    this.clearHazards(); this.team.restore(); this.set('gone');
    rewardBurst(world, this); openExit(world, this.arena[1]); world.audio.play('flag');
    world.popups.push({ x: this.x, y: this.y - 50, t: 0, txt: '¡Tortugas a salvo! Cuidemos el mar.' });
  }

  draw(ctx: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawSargazo(ctx, this, camX); }
}
