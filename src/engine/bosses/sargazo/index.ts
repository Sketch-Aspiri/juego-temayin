import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import type { BossConfig } from '../../level/types';
import { overlap } from '../../physics';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { coverFloor, stepAlgae, throwAlgae, type AlgaeBall } from './attacks';
import { drawSargazo } from './draw';

export type SargazoState = 'sleep' | 'intro' | 'idle' | 'warn' | 'attack' | 'exposed' | 'hurt' | 'shed' | 'dead' | 'gone';
type Attack = 'throw' | 'wave' | 'dive';
const PATTERN: readonly Attack[] = ['throw', 'wave', 'dive'];
const HP = 6;
const WIDTH = 110;
const HEIGHT = 115;
const CAM_PAN = 1200;
const INTRO_TIME = 2.4;
const IDLE_TIME = 1.1;
const WARN_TIME = 1;
const ATTACK_TIME = 1.3;
const EXPOSED_TIME = 3.2;
const HURT_TIME = 0.7;
const SHED_TIME = 1.7;
const DEAD_TIME = 2;
const STOMP_MARGIN = 32;
const STOMP_BOUNCE = 620;
const FIRE_HITS = 2;
const WAVE_SPEED = 260;
const WAVE_WIDTH = 36;
const WAVE_HEIGHT = 42;
const HIT_SCORE = 500;
const DEFEAT_SCORE = 5000;

/** Tres capas de algas; el núcleo solo recibe daño al abrirse tras cada ataque. */
export class Sargazo implements Boss {
  readonly id = 'sargazo';
  readonly name = 'CAPITÁN SARGAZO';
  readonly maxHp = HP;
  hp = HP;
  x: number;
  y = GROUND * T - HEIGHT;
  w = WIDTH;
  h = HEIGHT;
  st: SargazoState = 'sleep';
  t = 0;
  clock = 0;
  layer = 1;
  attack: Attack = 'throw';
  balls: AlgaeBall[] = [];
  waveX: number | null = null;
  private cycle = 0;
  private fireHits = 0;
  private readonly a0: number;
  private readonly a1: number;

  constructor(cfg: BossConfig) { this.x = cfg.x * T; [this.a0, this.a1] = cfg.arena; }
  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'exposed'; }
  private set(st: SargazoState): void { this.st = st; this.t = 0; }

  update(world: World, dt: number): void {
    if (this.st === 'gone' || world.phase !== 'play') return;
    this.t += dt; this.clock += dt;
    if (this.st === 'sleep') {
      if (world.player.x <= (this.a0 + 1) * T) return;
      closeArena(world, this.a0); this.set('intro'); world.audio.play('roar'); return;
    }
    world.camX = Math.min(entranceColumn(this.a0) * T, world.camX + CAM_PAN * dt);
    this.balls = stepAlgae(world, this.balls, dt, this.a0, this.a1);
    this.stepWave(world, dt);
    this.runState(world);
    this.contact(world);
  }

  private runState(world: World): void {
    switch (this.st) {
      case 'intro': if (this.t > INTRO_TIME) this.set('idle'); break;
      case 'idle':
        if (this.t > IDLE_TIME) {
          this.attack = PATTERN[this.cycle++ % PATTERN.length];
          this.set('warn'); world.audio.play('warn');
        }
        break;
      case 'warn': if (this.t > WARN_TIME) this.startAttack(world); break;
      case 'attack':
        if (this.t > ATTACK_TIME) { this.restoreTurtles(world); this.set('exposed'); }
        break;
      case 'exposed': if (this.t > EXPOSED_TIME) this.set('idle'); break;
      case 'hurt': if (this.t > HURT_TIME) this.set('idle'); break;
      case 'shed': if (this.t > SHED_TIME) this.set('idle'); break;
      case 'dead': if (this.t > DEAD_TIME) this.finish(world); break;
    }
  }

  private startAttack(world: World): void {
    this.set('attack');
    if (this.attack === 'throw') {
      this.balls.push(...throwAlgae(this.x + this.w / 2, this.y + 20, world.player.x, this.layer));
    } else if (this.attack === 'wave') {
      this.waveX = (this.a1 + 1) * T;
    } else {
      // Las tortugas se refugian bajo el agua, nunca se convierten en enemigos.
      for (const m of world.platforms) {
        if (m.spec.kind === 'mover' && m.spec.appearance === 'turtle' && m.spec.x >= this.a0 && !m.rider) m.submerged = true;
      }
      coverFloor(world, world.player.x, this.a0, this.a1);
    }
    world.audio.play('roar');
  }

  private stepWave(world: World, dt: number): void {
    if (this.waveX === null) return;
    this.waveX -= WAVE_SPEED * dt;
    coverFloor(world, this.waveX, this.a0, this.a1);
    const wave = { x: this.waveX, y: GROUND * T - WAVE_HEIGHT, w: WAVE_WIDTH, h: WAVE_HEIGHT };
    if (overlap(world.player, wave)) world.hurt();
    if (this.waveX < this.a0 * T) this.waveX = null;
  }

  private contact(world: World): void {
    const p = world.player;
    if (!overlap(p, this)) return;
    if (this.hittable && p.vy > 0 && p.y + p.h - this.y < STOMP_MARGIN) {
      p.vy = -STOMP_BOUNCE; this.damage(world); return;
    }
    if (this.st === 'idle' || this.st === 'warn' || this.st === 'attack') world.hurt();
  }

  onFireball(world: World): void {
    if (!this.hittable) return;
    if (++this.fireHits < FIRE_HITS) { world.audio.play('stomp'); return; }
    this.fireHits = 0; this.damage(world);
  }

  private damage(world: World): void {
    this.hp--; this.fireHits = 0;
    world.addScore(HIT_SCORE, this.x + this.w / 2, this.y); world.audio.play('stomp');
    world.shake = 0.35;
    if (this.hp <= 0) {
      this.balls = []; this.waveX = null; this.restoreTurtles(world); this.set('dead');
      world.addScore(DEFEAT_SCORE, this.x, this.y);
    } else if (this.hp % 2 === 0) {
      this.layer++; this.balls = []; this.waveX = null;
      this.clearAlgae(world); this.restoreTurtles(world); this.set('shed');
      world.popups.push({ x: this.x, y: this.y - 30, t: 0, txt: '¡Una capa menos!' });
    } else this.set('hurt');
  }

  private restoreTurtles(world: World): void {
    for (const m of world.platforms) if (m.spec.kind === 'mover' && m.spec.appearance === 'turtle') m.submerged = false;
  }

  private clearAlgae(world: World): void {
    world.slowZones = world.slowZones.filter(z => z.kind !== 'sargassum' || z.x1 < this.a0 || z.x0 > this.a1);
  }

  private finish(world: World): void {
    this.clearAlgae(world); this.set('gone');
    rewardBurst(world, this); openExit(world, this.a1); world.audio.play('flag');
    world.popups.push({ x: this.x, y: this.y - 50, t: 0, txt: '¡Tortugas a salvo! Cuidemos el mar.' });
  }

  draw(ctx: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawSargazo(ctx, this, camX); }
}
