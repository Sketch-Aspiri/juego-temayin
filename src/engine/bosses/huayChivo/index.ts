import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import type { BossConfig } from '../../level/types';
import { overlap } from '../../physics';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { drawHuayChivo } from './draw';

export type ChivoState = 'sleep' | 'intro' | 'teleport' | 'warn' | 'charge' | 'dazed' | 'hurt' | 'dead' | 'gone';
export interface Wisp { x: number; y: number; vx: number; age: number }
const HP = 6;
const WIDTH = 78;
const HEIGHT = 86;
const SPEED = 340;
const PHASE_SPEED = 1.35;
const INTRO_TIME = 1.7;
const TELEPORT_TIME = 0.75;
const WARN_TIME = 0.85;
const DAZED_TIME = 2;
const HURT_TIME = 0.8;
const DEAD_TIME = 1.6;
const WISP_SPEED = 95;
const WISP_LIFE = 7;
const STOMP_MARGIN = 28;
const BOUNCE = 650;
const PAN_SPEED = 1200;

/** Huay Chivo se presenta como personaje de leyenda, sin representar comunidades actuales. */
export class HuayChivo implements Boss {
  readonly id = 'huayChivo';
  readonly name = 'HUAY CHIVO';
  readonly maxHp = HP;
  hp = HP;
  x: number;
  y = GROUND * T - HEIGHT;
  w = WIDTH;
  h = HEIGHT;
  face: 1 | -1 = -1;
  st: ChivoState = 'sleep';
  t = 0;
  clock = 0;
  phase2 = false;
  wisps: Wisp[] = [];
  private cycle = 0;
  readonly arena: readonly [number, number];

  constructor(cfg: BossConfig) { this.x = cfg.x * T; this.arena = cfg.arena; }
  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'dazed'; }
  get left(): number { return this.arena[0] * T; }
  get right(): number { return (this.arena[1] + 1) * T - this.w; }
  private set(st: ChivoState): void { this.st = st; this.t = 0; }

  update(world: World, dt: number): void {
    if (this.st === 'gone') return;
    this.t += dt; this.clock += dt;
    if (this.st === 'sleep') {
      if (world.player.x > (this.arena[0] + 1) * T) {
        closeArena(world, this.arena[0]); this.set('intro'); world.audio.play('roar');
      }
      return;
    }
    world.camX = Math.min(entranceColumn(this.arena[0]) * T, world.camX + PAN_SPEED * dt);
    this.stepState(world, dt);
    this.stepWisps(world, dt);
    this.contact(world);
  }

  private stepState(world: World, dt: number): void {
    const speed = this.phase2 ? PHASE_SPEED : 1;
    switch (this.st) {
      case 'intro': if (this.t >= INTRO_TIME) this.set('teleport'); break;
      case 'teleport': if (this.t >= TELEPORT_TIME) this.appear(world); break;
      case 'warn': if (this.t >= WARN_TIME / speed) this.set('charge'); break;
      case 'charge': this.charge(world, dt * speed); break;
      case 'dazed': if (this.t >= DAZED_TIME) this.set('teleport'); break;
      case 'hurt': if (this.t >= HURT_TIME) this.set('teleport'); break;
      case 'dead': if (this.t >= DEAD_TIME) this.vanish(world); break;
    }
  }

  private appear(world: World): void {
    const positions = [this.left + T * 2, this.right - T * 2, (this.left + this.right) / 2];
    this.x = positions[this.cycle++ % positions.length];
    this.face = world.player.x < this.x ? -1 : 1;
    // El borde más cercano siempre es alcanzable: toda embestida abre una ventana de pisotón.
    if (this.cycle % 2 === 0) {
      for (const offset of [-45, 45]) this.wisps.push({ x: this.x + this.w / 2, y: this.y + offset, vx: this.face * WISP_SPEED, age: 0 });
    }
    this.set('warn'); world.audio.play('warn');
  }

  private charge(world: World, dt: number): void {
    this.x += this.face * SPEED * dt;
    if (this.x > this.left && this.x < this.right) return;
    this.x = Math.max(this.left, Math.min(this.right, this.x));
    this.set('dazed'); world.shake = 0.3; world.audio.play('bump');
  }

  private stepWisps(world: World, dt: number): void {
    for (const f of this.wisps) {
      f.age += dt; f.x += f.vx * dt;
      const target = world.player.y + world.player.h / 2;
      f.y += Math.max(-35, Math.min(35, target - f.y)) * dt;
      if (overlap(world.player, { x: f.x - 12, y: f.y - 12, w: 24, h: 24 })) {
        world.hurt(); f.age = WISP_LIFE;
      }
    }
    this.wisps = this.wisps.filter(f => f.age < WISP_LIFE && f.x > this.left && f.x < this.right + this.w);
  }

  private contact(world: World): void {
    if (world.phase !== 'play' || !overlap(world.player, this)) return;
    const p = world.player;
    if (this.st === 'dazed') {
      if (p.vy > 0 && p.y + p.h - this.y < STOMP_MARGIN) {
        p.vy = -BOUNCE; this.damage(world);
      }
      return;
    }
    if (this.st === 'charge' || this.st === 'warn') world.hurt();
  }

  onFireball(world: World): void { if (this.hittable) this.damage(world); }

  private damage(world: World): void {
    this.hp--; this.wisps = [];
    world.addScore(500, this.x, this.y); world.audio.play('stomp');
    if (this.hp <= 0) { this.set('dead'); world.addScore(3000, this.x, this.y); return; }
    if (this.hp <= HP / 2 && !this.phase2) {
      this.phase2 = true;
      world.darkness = { radius: 185, alpha: 0.78 };
      world.popups.push({ x: this.x, y: this.y - 35, t: 0, txt: '¡ILUMINA LA NOCHE!' });
    }
    this.set('hurt');
  }

  private vanish(world: World): void {
    this.set('gone'); rewardBurst(world, this); openExit(world, this.arena[1]);
    world.darkness = null;
    world.popups.push({ x: this.x, y: this.y, t: 0, txt: '¡EL CAMINO ESTÁ LIBRE!' });
    world.audio.play('flag');
  }

  draw(c: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawHuayChivo(c, this, camX); }
}
