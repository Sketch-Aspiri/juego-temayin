import type { AudioEngine } from './audio';
import { createRope, type Rope } from './entities/ropes';
import type { Torch } from './entities/torches';
import { lightSources, type Darkness, type LightSource } from './render/lighting';
import { createBoss, type Boss } from './bosses';
import { advanceCamera } from './camera';
import { firework, reachFlag, updateFlag } from './goal';
import {
  DEFAULT_LEVEL_TIME,
  GROUND,
  OXYGEN_MAX,
  PLAYER_START_TILE,
  ROWS,
  T,
} from './constants';
import { updateBalls, type Ball } from './entities/ball';
import { createCannons, updateCannons, type Cannon, type Cannonball } from './entities/cannons';
import { createCrumbles, updateCrumbles, type Crumble } from './entities/crumble';
import { createEnemy, ENEMIES, updateEnemies } from './entities/enemies';
import { createHoops, updateHoops, type Hoop } from './entities/hoops';
import { createItem, updateItems } from './entities/items';
import { makeParticle, stepParticles, stepPopups } from './entities/particles';
import { carryRider, createPlatform, landOnPlatforms, updatePlatforms, type MovingPlatform } from './entities/platforms';
import { animatePlayer, createPlayer, updatePlayer } from './entities/player';
import { updateFireballs, updateQuills } from './entities/projectiles';
import { burnSargassum } from './entities/sargassum';
import { createStromatolites, updateStromatolites, type Stromatolite } from './entities/stromatolites';
import { confineSwimmers, swimmerPositions } from './entities/swim';
import type { Enemy, Fireball, Item, Particle, Player, Popup, Quill } from './entities/types';
import type { HudState } from './hud';
import type { Input } from './input';
import { buildLevel, type BuiltLevel } from './level/build';
import type { SlowZone } from './level/slowZones';
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

/** Estado completo y reglas de un nivel en curso. No depende del DOM. */
export class World {
  readonly def: LevelDef;
  readonly ropes: Rope[];
  readonly torches: Torch[];
  darkness: Darkness | null;
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
  /** Pelotas de pok ta pok en el aire y aros del juego de pelota (op `hoop`). */
  balls: Ball[] = [];
  hoops: Hoop[];
  /** Cañones de baluarte que disparan (op `cannon`) y sus balas en vuelo. */
  cannons: Cannon[];
  cannonballs: Cannonball[] = [];
  /** Tramos de escombro que se derrumban (op `crumble`). */
  crumbles: Crumble[];
  /** Estromatolitos de Bacalar: dañarlos resta puntos (op `stromatolite`). */
  stromatolites: Stromatolite[];
  /** Plataformas móviles (vagones y plataformas genéricas, AGENTS.md §5.4). */
  platforms: MovingPlatform[];
  /** Resina y sargazo vigentes: el sargazo quemado desaparece (lista nueva, no se muta). */
  slowZones: readonly SlowZone[];
  boss: Boss | null;
  bumps = new Map<string, number>();
  camX = 0;
  shake = 0;
  timeLeft: number;
  flagY = 2 * T;
  checkpointReached: boolean;
  coinsCollected = 0;
  /** Presentación del encuentro: solo dibujo, sin avanzar la simulación. */
  offeringActive = false;

  private timeAcc = 0;

  readonly solidAt: SolidFn = (tx, ty) => this.solid(tx, ty);

  constructor(init: WorldInit) {
    this.def = init.def;
    this.session = init.session;
    this.input = init.input;
    this.audio = init.audio;
    this.level = buildLevel(init.def);
    this.ropes = this.level.ropes.map(createRope);
    this.torches = this.level.lights.map(light => ({ ...light, lit: true }));
    this.darkness = init.def.darkness ?? null;
    this.grid = this.level.grid;
    this.width = this.level.width;
    this.slowZones = this.level.slowZones;
    this.timeLeft = init.def.time ?? DEFAULT_LEVEL_TIME;
    this.checkpointReached = !!init.fromCheckpoint;
    this.crumbles = createCrumbles(this.level.crumbles);
    this.hoops = createHoops(this.level.hoops);
    this.cannons = createCannons(this.level.cannons);
    this.stromatolites = createStromatolites(this.level.stromatolites);
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

  lightSources(): readonly LightSource[] { return lightSources(this); }

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

  addCoin(_x: number, _y: number): void {
    this.session.coins++;
    this.coinsCollected++;
    this.addScore(100);
    this.audio.play('coin');
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
    updateStromatolites(this, dt);
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
    updateCannons(this, dt);
    updateFireballs(this, dt);
    updateBalls(this, dt);
    updateHoops(this.hoops, dt);
    burnSargassum(this);
    if (this.shake > 0) this.shake -= dt;
    animatePlayer(p, dt);

    // La cámara solo avanza (nunca retrocede) y queda fija durante la pelea con el jefe.
    advanceCamera(this, dt);
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

  private reachFlag(): void { reachFlag(this); }

  private updateFlag(dt: number): void { updateFlag(this, dt); }

  firework(): void { firework(this); }

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
      ball: this.player.ball,
      boss: b && b.hudVisible ? { id: b.id, name: b.name, hp: Math.max(0, b.hp), maxHp: b.maxHp, intro: b.intro } : null,
      spawnId,
    };
  }
}
