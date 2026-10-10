import type { AudioEngine } from './audio';
import { createBoss, type Boss } from './bosses';
import {
  COINS_PER_LIFE,
  DEFAULT_LEVEL_TIME,
  GOAL_PAN_RATE,
  GOAL_VIEW_WIDTH,
  GROUND,
  OXYGEN_MAX,
  PLAYER_START_TILE,
  ROWS,
  T,
  VW,
} from './constants';
import { createCrumbles, updateCrumbles, type Crumble } from './entities/crumble';
import { createEnemy, ENEMIES, updateEnemies } from './entities/enemies';
import { createItem, updateItems } from './entities/items';
import { makeParticle, stepParticles, stepPopups } from './entities/particles';
import { carryRider, createPlatform, landOnPlatforms, updatePlatforms, type MovingPlatform } from './entities/platforms';
import { animatePlayer, createPlayer, updatePlayer } from './entities/player';
import { updateFireballs, updateQuills } from './entities/projectiles';
import { confineSwimmers, swimmerPositions } from './entities/swim';
import type { Enemy, Fireball, Item, Particle, Player, Popup, Quill } from './entities/types';
import type { HudState } from './hud';
import type { Input } from './input';
import { buildLevel, type BuiltLevel } from './level/build';
import type { LevelDef } from './level/types';
import { waterAt } from './level/zones';
import type { SolidFn } from './physics';
import { ITEM_BLOCKS, isSolidTile } from './tiles';
import type { Session } from './types';

export type Phase = 'play' | 'dying' | 'flag' | 'done';

export interface WorldInit {
  def: LevelDef;
  session: Session;
  input: Input;
  audio: AudioEngine;
  /** Reaparecer en el punto de control. */
  fromCheckpoint?: boolean;
}

const BUMP_TIME = 0.15;
const FLAG_SLIDE_SPEED = 320;
const FIREWORK_COLORS = ['#ffd23f', '#ff5e5b', '#3fb34a', '#4fc3f7', '#fff'];

/** Estado completo y reglas de un nivel en curso. No depende del DOM. */
export class World {
  readonly def: LevelDef;
  readonly level: BuiltLevel;
  readonly grid: string[][];
  readonly width: number;
  readonly session: Session;
  readonly input: Input;
  readonly audio: AudioEngine;

  phase: Phase = 'play';
  phaseT = 0;
  player: Player;
  enemies: Enemy[];
  items: Item[] = [];
  particles: Particle[] = [];
  popups: Popup[] = [];
  fireballs: Fireball[] = [];
  quills: Quill[] = [];
  /** Tramos de escombro que se derrumban (op `crumble`). */
  crumbles: Crumble[];
  /** Plataformas móviles (vagones y plataformas genéricas, AGENTS.md §5.4). */
  platforms: MovingPlatform[];
  boss: Boss | null;
  bumps = new Map<string, number>();
  camX = 0;
  shake = 0;
  timeLeft: number;
  flagY = 2 * T;
  checkpointReached: boolean;
  coinsCollected = 0;

  private timeAcc = 0;

  readonly solidAt: SolidFn = (tx, ty) => this.solid(tx, ty);

  constructor(init: WorldInit) {
    this.def = init.def;
    this.session = init.session;
    this.input = init.input;
    this.audio = init.audio;
    this.level = buildLevel(init.def);
    this.grid = this.level.grid;
    this.width = this.level.width;
    this.timeLeft = init.def.time ?? DEFAULT_LEVEL_TIME;
    this.checkpointReached = !!init.fromCheckpoint;
    this.crumbles = createCrumbles(this.level.crumbles);
    this.input.reset();

    const startTile = init.fromCheckpoint ? this.checkpointTile : PLAYER_START_TILE;
    this.player = createPlayer(startTile);
    if (startTile !== PLAYER_START_TILE) this.placeOnGround(startTile);

    this.enemies = this.level.enemies
      .filter((e) => e.tx * T > this.player.x + 300)
      .map(createEnemy);
    this.boss = init.def.boss ? createBoss(init.def.boss) : null;
    this.platforms = this.level.platforms.map(createPlatform);
  }

  get checkpointTile(): number {
    return this.def.checkpoint ?? Math.floor(this.width / 2);
  }

  // ---------- Consultas del mapa ----------

  tileAt(tx: number, ty: number): string {
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= this.width) return ' ';
    return this.grid[ty][tx];
  }

  solid(tx: number, ty: number): boolean {
    if (tx < 0) return true;
    return isSolidTile(this.tileAt(tx, ty));
  }

  /** Coloca al jugador sobre el primer suelo a partir de la columna dada. */
  private placeOnGround(startTile: number): void {
    const p = this.player;
    let x = startTile;
    while (x < this.width - 1 && !this.solid(x, GROUND)) x++;
    p.x = x * T + 4;
    let y = GROUND;
    while (this.solid(x, y - 1)) y--;
    p.y = y * T - p.h;
  }

  // ---------- Puntuación y daño ----------

  addScore(n: number, x?: number, y?: number): void {
    this.session.score += n;
    if (x !== undefined && y !== undefined) this.popups.push({ x, y, t: 0, txt: String(n) });
  }

  addCoin(x: number, y: number): void {
    this.session.coins++;
    this.coinsCollected++;
    this.addScore(100);
    this.audio.play('coin');
    if (this.session.coins >= COINS_PER_LIFE) {
      this.session.coins -= COINS_PER_LIFE;
      this.session.lives++;
      this.audio.play('life');
      this.popups.push({ x, y: y - 20, t: 0, txt: '1UP' });
    }
  }

  hurt(): void {
    const p = this.player;
    if (p.inv > 0 || this.phase !== 'play') return;
    if (p.fire) {
      p.fire = false;
      p.inv = 1.6;
      this.audio.play('hurt');
    } else if (p.shield) {
      p.shield = false;
      p.inv = 1.6;
      this.audio.play('hurt');
    } else this.die();
  }

  die(): void {
    if (this.phase !== 'play') return;
    this.phase = 'dying';
    this.phaseT = 0;
    this.player.vy = -700;
    this.player.vx = 0;
    this.audio.play('die');
  }

  killEnemy(e: Enemy, flip: boolean): void {
    const def = ENEMIES[e.id];
    e.dead = 0.001;
    // Los voladores caen al morir aunque sean pisados.
    e.flip = flip || def.flying;
    if (flip) {
      e.vy = -400;
      e.vx = 100;
    } else if (def.flying) {
      e.vy = 0;
      e.vx = 0;
    }
    this.addScore(def.score, e.x, e.y);
    this.audio.play('stomp');
  }

  // ---------- Bloques ----------

  /** El jugador golpea con la cabeza el bloque (tx, ty). */
  hitBlock(tx: number, ty: number): void {
    const t = this.tileAt(tx, ty);
    const key = `${tx},${ty}`;
    // Golpea a los enemigos que estén encima del bloque.
    for (const e of this.enemies) {
      if (e.alive && !e.dead && e.x + e.w > tx * T && e.x < (tx + 1) * T && Math.abs(e.y + e.h - ty * T) < 6) {
        this.killEnemy(e, true);
      }
    }
    if (t === '?') {
      this.grid[ty][tx] = 'U';
      this.bumps.set(key, BUMP_TIME);
      this.particles.push(makeParticle('coin', tx * T + T / 2, ty * T, { vy: -520 }));
      this.addCoin(tx * T, ty * T - 20);
    } else if (ITEM_BLOCKS[t]) {
      this.grid[ty][tx] = 'U';
      this.bumps.set(key, BUMP_TIME);
      this.audio.play('power');
      this.items.push(createItem(ITEM_BLOCKS[t], tx, ty));
    } else if (t === 'B') {
      if (this.player.shield) {
        this.grid[ty][tx] = ' ';
        this.audio.play('brk');
        this.addScore(50);
        for (let i = 0; i < 4; i++) {
          this.particles.push(
            makeParticle('brick', tx * T + (i % 2) * 20 + 10, ty * T + (i < 2 ? 10 : 30), {
              vx: (i % 2 ? 1 : -1) * (120 + Math.random() * 80),
              vy: -500 + (i < 2 ? -150 : 0),
            }),
          );
        }
      } else {
        this.bumps.set(key, BUMP_TIME);
        this.audio.play('bump');
      }
    } else this.audio.play('bump');
  }

  // ---------- Bucle principal ----------

  update(dt: number): void {
    this.phaseT += dt;
    for (const [k, v] of this.bumps) {
      if (v - dt <= 0) this.bumps.delete(k);
      else this.bumps.set(k, v - dt);
    }
    this.particles = stepParticles(this.particles, dt);
    this.popups = stepPopups(this.popups, dt);
    updatePlatforms(this.platforms, this.camX, dt);

    if (this.phase === 'dying') return this.updateDying(dt);
    if (this.phase === 'flag') return this.updateFlag(dt);
    if (this.phase === 'done') {
      if (Math.random() < dt * 5) this.firework();
      return;
    }

    this.timeAcc += dt;
    if (this.timeAcc >= 1) {
      this.timeAcc -= 1;
      if (--this.timeLeft <= 0) return this.die();
    }

    const p = this.player;
    const prevFeet = carryRider(this);
    updatePlayer(this, dt);
    landOnPlatforms(this, prevFeet);
    updateCrumbles(this, dt);
    this.collectLooseCoins();

    if (p.y > ROWS * T + 40) return this.die();
    if (p.x > this.checkpointTile * T) this.checkpointReached = true;
    if (p.x + p.w >= this.level.flagX * T + T / 2 - 3) return this.reachFlag();

    const swimmers = swimmerPositions(this.enemies);
    updateEnemies(this, dt);
    confineSwimmers(this, swimmers);
    updateItems(this, dt);
    this.boss?.update(this, dt);
    updateQuills(this, dt);
    updateFireballs(this, dt);
    if (this.shake > 0) this.shake -= dt;
    animatePlayer(p, dt);

    // La cámara solo avanza (nunca retrocede) y queda fija durante la pelea con el jefe.
    if (!this.boss?.lockCamera) {
      const target = p.x + p.w / 2 - VW * 0.4;
      this.camX = Math.max(this.camX, Math.min(target, this.width * T - VW));
    }
  }

  private collectLooseCoins(): void {
    const p = this.player;
    const l = Math.floor(p.x / T);
    const r = Math.floor((p.x + p.w - 1) / T);
    const t0 = Math.floor(p.y / T);
    const t1 = Math.floor((p.y + p.h - 1) / T);
    for (let ty = t0; ty <= t1; ty++) {
      for (let tx = l; tx <= r; tx++) {
        if (this.tileAt(tx, ty) === 'o') {
          this.grid[ty][tx] = ' ';
          this.addCoin(tx * T, ty * T);
        }
      }
    }
  }

  private updateDying(dt: number): void {
    const p = this.player;
    if (this.phaseT > 0.4) {
      p.vy += 1800 * dt;
      p.y += p.vy * dt;
    }
  }

  private reachFlag(): void {
    const p = this.player;
    this.phase = 'flag';
    this.phaseT = 0;
    this.audio.play('flag');
    const bonus = Math.max(100, Math.round(((GROUND * T - (p.y + p.h)) / (9 * T)) * 50) * 100);
    this.addScore(bonus, p.x, p.y);
    p.x = this.level.flagX * T + T / 2 - p.w - 2;
    p.vx = 0;
    p.vy = 0;
    p.face = 1;
  }

  private updateFlag(dt: number): void {
    this.panToGoal(dt);
    const p = this.player;
    const ground = GROUND * T;
    const flagBottom = ground - 2 * T;
    if (p.y + p.h < ground) {
      p.y = Math.min(p.y + FLAG_SLIDE_SPEED * dt, ground - p.h);
      p.anim = 'fall';
      p.frame = 0;
    } else if (this.flagY < flagBottom) {
      p.anim = 'idle';
      p.frame = 0;
    }
    if (this.flagY < flagBottom) this.flagY += FLAG_SLIDE_SPEED * dt;

    if (p.y + p.h >= ground && this.flagY >= flagBottom) {
      p.anim = 'win';
      p.frame = Math.floor(this.phaseT * 9) % 7;
      if (Math.random() < dt * 4) this.firework();
      // Bonus por el tiempo sobrante.
      if (this.timeLeft > 0 && this.phaseT > 1) {
        const n = Math.min(this.timeLeft, 3);
        this.timeLeft -= n;
        this.session.score += n * 50;
        if (Math.floor(this.phaseT * 20) % 3 === 0) this.audio.play('tick');
      }
    }
    if (this.phaseT > 6 && this.timeLeft <= 0) {
      this.phase = 'done';
      this.phaseT = 0;
    }
  }

  /** Durante la meta, desliza la cámara (solo hacia delante) hasta encuadrar la pirámide completa. */
  private panToGoal(dt: number): void {
    const target = Math.min(this.level.templeX * T + GOAL_VIEW_WIDTH - VW, this.width * T - VW);
    if (target > this.camX) this.camX += (target - this.camX) * Math.min(1, dt * GOAL_PAN_RATE);
  }

  firework(): void {
    const x = this.camX + 200 + Math.random() * (VW - 400);
    const y = 80 + Math.random() * 180;
    const col = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const s = 120 + Math.random() * 80;
      this.particles.push(makeParticle('spark', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col }));
    }
    this.audio.play('firework');
  }

  // ---------- Estado para la interfaz ----------

  /** Oxígeno 0..1 para el HUD; `null` con los pies fuera del agua y el oxígeno lleno. */
  private oxygenRatio(): number | null {
    const p = this.player;
    const feetWet = waterAt(this.level.water, p.x + p.w / 2, p.y + p.h - 1) !== null;
    if (!feetWet && p.oxygen >= OXYGEN_MAX) return null;
    return Math.max(0, Math.min(1, p.oxygen / OXYGEN_MAX));
  }

  hudState(spawnId: number): HudState {
    const b = this.boss;
    return {
      score: this.session.score,
      coins: this.session.coins,
      lives: this.session.lives,
      time: Math.max(0, this.timeLeft),
      levelId: this.def.id,
      levelName: this.def.name,
      shield: this.player.shield,
      fire: this.player.fire,
      oxygen: this.oxygenRatio(),
      snorkel: this.player.snorkel > 0,
      boss: b && b.hudVisible ? { name: b.name, hp: Math.max(0, b.hp), maxHp: b.maxHp, intro: b.intro } : null,
      spawnId,
    };
  }
}
