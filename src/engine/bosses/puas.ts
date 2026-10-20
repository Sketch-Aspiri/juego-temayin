import type { Assets } from '../assets';
import { GROUND, T } from '../constants';
import { makeParticle } from '../entities/particles';
import type { BossConfig } from '../level/types';
import { moveX, moveY, overlap } from '../physics';
import type { World } from '../World';
import { closeArena } from './arena';
import { drawPuas } from './puasDraw';
import type { Boss } from './types';

export type PuasState = 'sleep' | 'intro' | 'walk' | 'prep' | 'charge' | 'roll' | 'spikes' | 'dazed' | 'hurt' | 'dead' | 'gone';
type Attack = 'charge' | 'roll' | 'spikes';

const NON_HITTABLE: ReadonlySet<PuasState> = new Set(['sleep', 'intro', 'dead', 'gone', 'hurt']);

/** Púas, el puercoespín: embiste, rueda como bola y dispara púas. Se marea tras cada ataque fallido. */
export class Puas implements Boss {
  readonly id = 'puas';
  readonly name = 'PÚAS, EL PUERCOESPÍN';
  readonly maxHp = 6;
  x: number;
  y = GROUND * T - 100;
  w = 140;
  h = 100;
  vx = 0;
  vy = 0;
  face: 1 | -1 = -1;
  onGround = false;
  hp = 6;
  st: PuasState = 'sleep';
  t = 0;
  spin = 0;
  private next: Attack = 'charge';
  private cycle = 0;
  private bounces = 0;
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

  private set(st: PuasState): void {
    this.st = st;
    this.t = 0;
  }

  private faceToPlayer(world: World): void {
    const p = world.player;
    this.face = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
  }

  update(world: World, dt: number): void {
    if (this.st === 'gone') return;
    this.t += dt;
    const lockX = (this.a0 - 1) * T;

    if (this.st === 'sleep') {
      if (world.player.x > (this.a0 + 1) * T) {
        // Cierra la arena detrás del jugador.
        closeArena(world, this.a0, this.a1);
        this.set('intro');
        world.audio.play('roar');
        world.shake = 0.5;
      }
      return;
    }
    // La cámara queda fija sobre la arena mientras dura la pelea.
    if (this.st !== 'dead') world.camX = Math.min(lockX, world.camX + 1200 * dt);

    const angry = this.hp <= this.maxHp / 2;
    const speed = angry ? 1.3 : 1;
    this.vy = Math.min(this.vy + 2000 * dt, 1000);

    if (!this.runState(world, dt, angry, speed)) return;

    const hitWall = moveX(this, this.vx * dt, world.solidAt);
    const wasAir = !this.onGround;
    moveY(this, this.vy * dt, world.solidAt);
    if (hitWall) this.onWallHit(world);
    if (this.st === 'roll' && this.onGround && wasAir) {
      world.shake = 0.2;
      world.audio.play('bump');
      if (++this.bounces >= (angry ? 5 : 4)) this.set('dazed');
      else {
        this.faceToPlayer(world);
        this.vy = -680;
        this.vx = this.face * 300 * speed;
      }
    }
    this.contactPlayer(world);
  }

  /** Lógica de cada estado. Devuelve false si el estado ya gestionó todo el movimiento. */
  private runState(world: World, dt: number, angry: boolean, speed: number): boolean {
    switch (this.st) {
      case 'intro':
        this.vx = 0;
        if (this.t > 2.4) this.set('walk');
        break;
      case 'walk': {
        this.faceToPlayer(world);
        this.vx = this.face * 90 * speed;
        if (this.t > (angry ? 1.1 : 1.6)) {
          const pattern: Attack[] = angry ? ['charge', 'spikes', 'roll', 'spikes'] : ['charge', 'roll'];
          this.next = pattern[this.cycle++ % pattern.length];
          this.set('prep');
          world.audio.play('warn');
        }
        break;
      }
      case 'prep': // aviso antes de atacar
        this.vx = 0;
        this.faceToPlayer(world);
        if (this.t > (angry ? 0.45 : 0.7)) {
          if (this.next === 'roll') {
            this.vy = -760;
            this.vx = this.face * 300 * speed;
            this.bounces = 0;
          }
          if (this.next === 'spikes') this.shootQuills(world, angry ? 9 : 7);
          this.set(this.next);
        }
        break;
      case 'charge':
        this.vx = this.face * 430 * speed;
        if (Math.random() < dt * 30) {
          world.particles.push(
            makeParticle('dust', this.x + this.w / 2 - this.face * 60, this.y + this.h - 4, { vx: -this.face * 60, vy: -40 }),
          );
        }
        break;
      case 'roll':
        this.spin += (this.vx * dt) / 60;
        break;
      case 'spikes':
        this.vx = 0;
        if (this.t > 0.9) this.set('walk');
        break;
      case 'dazed': // vulnerable: ¡es el momento de saltarle encima!
        this.vx = 0;
        if (this.t > (angry ? 1.7 : 2.3)) this.set('walk');
        break;
      case 'hurt':
        this.vx = 0;
        if (this.t > 0.9) this.set('walk');
        break;
      case 'dead':
        this.vx = 0;
        if (this.t > 2.5) this.vanish(world);
        return false;
    }
    return true;
  }

  private onWallHit(world: World): void {
    if (this.st === 'charge') {
      this.set('dazed');
      this.vy = -350;
      world.shake = 0.4;
      world.audio.play('brk');
      this.x -= this.face * 4;
    } else if (this.st === 'roll') {
      this.vx = -this.vx;
      world.audio.play('bump');
    } else this.vx = 0;
  }

  private contactPlayer(world: World): void {
    const p = world.player;
    if (world.phase !== 'play' || !overlap(p, this)) return;
    const stomp = p.vy > 0 && p.y + p.h - this.y < 34;
    if (this.st === 'dazed' && stomp) {
      this.hp--;
      p.vy = world.input.held.jump ? -900 : -700;
      p.vx = (p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1) * 260;
      world.addScore(1000, this.x + this.w / 2, this.y);
      world.audio.play('stomp');
      world.shake = 0.3;
      this.afterHit(world);
    } else if (this.st !== 'dazed' && this.st !== 'hurt' && this.st !== 'intro') {
      if (stomp) p.vy = -600; // rebota en las púas
      const wasVulnerable = p.inv <= 0;
      world.hurt();
      if (wasVulnerable && world.phase === 'play') p.vx = (p.x < this.x ? -1 : 1) * 320;
    }
  }

  private afterHit(world: World): void {
    world.audio.play('roar');
    if (this.hp <= 0) {
      this.set('dead');
      world.addScore(5000, this.x + this.w / 2, this.y - 30);
    } else this.set('hurt');
  }

  /** Tres bolas de fuego equivalen a un pisotón. */
  onFireball(world: World): void {
    if (this.st === 'roll') {
      world.audio.play('bump'); // la bola de púas desvía el fuego
      return;
    }
    this.fireHits++;
    world.addScore(100, this.x + this.w / 2, this.y);
    if (this.fireHits >= 3) {
      this.fireHits = 0;
      this.hp--;
      world.shake = 0.3;
      this.afterHit(world);
    } else world.audio.play('stomp');
  }

  private shootQuills(world: World, n: number): void {
    const cx = this.x + this.w / 2;
    const cy = this.y + 20;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.12 + (0.76 * i) / (n - 1));
      const s = 480 + (i % 2) * 120;
      world.quills.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, gone: false });
    }
    world.shake = 0.25;
    world.audio.play('quills');
  }

  /** Desaparece entre chispas, suelta monedas y abre el muro de salida. */
  private vanish(world: World): void {
    this.set('gone');
    const cols = ['#ffd23f', '#e67e22', '#fff'];
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 200;
      world.particles.push(
        makeParticle('spark', this.x + this.w / 2, this.y + this.h / 2, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: cols[i % 3] }),
      );
    }
    for (let i = 0; i < 8; i++) {
      world.particles.push(makeParticle('coin', this.x + 20 + i * 14, this.y + 40, { vy: -500 - Math.random() * 300 }));
    }
    world.session.coins += 7;
    world.addCoin(this.x + this.w / 2, this.y);
    const wx = this.a1 + 1;
    for (let y = 0; y < GROUND; y++) {
      if (world.grid[y][wx] !== 'X') continue;
      world.grid[y][wx] = ' ';
      world.particles.push(
        makeParticle('brick', wx * T + 20, y * T + 20, { vx: 80 + Math.random() * 120, vy: -300 - Math.random() * 300 }),
      );
    }
    world.audio.play('brk');
    world.audio.play('flag');
    world.shake = 0.4;
  }

  draw(ctx: CanvasRenderingContext2D, assets: Assets, camX: number): void {
    drawPuas(ctx, assets, this, camX);
  }
}
