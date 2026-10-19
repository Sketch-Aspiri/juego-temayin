import type { Assets } from '../../assets';
import { GROUND, T } from '../../constants';
import type { BossConfig } from '../../level/types';
import { moveX, overlap } from '../../physics';
import type { LightSource } from '../../render/lighting';
import type { World } from '../../World';
import type { ThemeId } from '../../types';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { drawCamazotz } from './draw';
import { addHazard, beamRect, collectMotes, spawnMotes, stepHazards, summonEcho, type EclipseHazard, type LightMote } from './hazards';
import { preparePhase, restoreShrine, torchesReady } from './phases';
import * as K from './tuning';

export type CamazotzState = 'sleep' | 'intro' | 'idle' | 'diveWarn' | 'dive' | 'swarmWarn' | 'swarm'
  | 'gustWarn' | 'gust' | 'chamber' | 'beamWarn' | 'beam' | 'echoWarn' | 'echo' | 'exposed' | 'hurt' | 'transition' | 'dead' | 'gone';
const CONTACT_STATES: ReadonlySet<CamazotzState> = new Set(['dive', 'swarm', 'gust', 'beam', 'echo']);

/** Tres fases, cuatro PV por fase y una sola herida por apertura. */
export class Camazotz implements Boss {
  readonly id = 'camazotz';
  readonly name = 'CAMAZOTZ';
  readonly maxHp = K.HP;
  hp = K.HP;
  x: number;
  y = K.FLY_Y;
  w = K.WIDTH;
  h = K.HEIGHT;
  face: 1 | -1 = -1;
  st: CamazotzState = 'sleep';
  t = 0;
  clock = 0;
  phase: 1 | 2 | 3 = 1;
  cycle = 0;
  echo = 0;
  targetX = 0;
  diveFromX = 0;
  fireHits = 0;
  chamberClock = 0;
  litTorches = 0;
  ritualEchoes = 0;
  hazards: EclipseHazard[] = [];
  motes: LightMote[] = [];
  readonly arena: readonly [number, number];

  constructor(config: BossConfig) { this.x = config.x * T; this.arena = config.arena; }
  get left(): number { return this.arena[0] * T; }
  get right(): number { return (this.arena[1] + 1) * T; }
  get floor(): number { return this.phase === 2 ? K.CHAMBER_FLOOR : K.TOP_FLOOR; }
  get backdrop(): ThemeId { return this.st === 'gone' ? 'calakmulDawn' : this.phase === 2 ? 'batCave' : 'throne'; }
  get stage(): number { return this.phase; }
  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'exposed'; }
  get objective(): string {
    if (this.st === 'dead') return '¡El Sol de Jade vuelve a brillar!';
    if (this.hittable) return '¡Ahora! Pisotón o dos disparos';
    if (this.phase === 1) return 'Fase 1 · Esquiva la picada y pisa al aterrizar';
    if (this.phase === 2) return `Fase 2 · Antorchas ${this.litTorches}/4 · Brasero: recupera fuego`;
    return `Fase 3 · Luces ${this.motes.filter(mote => mote.collected).length}/3 · Resiste los ecos y el rayo`;
  }
  clampTarget(x: number): number { return Math.max(this.left + 6 * T, Math.min(this.right - 6 * T - this.w, x)); }
  setState(state: CamazotzState): void { this.st = state; this.t = 0; this.fireHits = 0; }

  update(world: World, dt: number): void {
    if (this.st === 'gone' || world.phase !== 'play') return;
    this.clock += dt; this.t += dt;
    if (this.st === 'sleep') return this.wake(world);
    world.camX = Math.min(entranceColumn(this.arena[0]) * T, world.camX + K.CAM_PAN * dt);
    stepHazards(this, world, dt);
    this.litTorches = world.torches.filter(torch => torch.lit && torch.x >= this.left && torch.x <= this.right).length;
    restoreShrine(this, world);
    this.runState(world, dt);
    this.contact(world);
  }

  private wake(world: World): void {
    if (world.player.x <= (this.arena[0] + 1) * T) return;
    closeArena(world, this.arena[0]);
    this.setState('intro'); world.audio.play('roar');
  }

  private runState(world: World, dt: number): void {
    switch (this.st) {
      case 'intro': if (this.t >= K.INTRO_TIME) this.setState('idle'); break;
      case 'idle': if (this.t >= K.IDLE_TIME) this.choose(world); break;
      case 'diveWarn': if (this.t >= K.WARN_TIME) this.setState('dive'); break;
      case 'dive': this.dive(world); break;
      case 'swarmWarn': if (this.t >= K.WARN_TIME) this.swarm(world); break;
      case 'swarm': if (this.t >= K.SWARM_TIME) this.setState('idle'); break;
      case 'gustWarn': if (this.t >= K.WARN_TIME) this.setState('gust'); break;
      case 'gust': this.gust(world, dt); break;
      case 'chamber': this.chamber(world, dt); break;
      case 'beamWarn': if (this.t >= K.WARN_TIME) this.setState('beam'); break;
      case 'beam': this.beam(world); break;
      case 'echoWarn': if (this.t >= K.WARN_TIME) { summonEcho(this, world); this.setState('echo'); } break;
      case 'echo': if (this.t >= K.ECHO_TIME) { this.ritualEchoes++; this.setState('idle'); } break;
      case 'exposed': if (this.t >= K.EXPOSED_TIME) this.closeWindow(world); break;
      case 'hurt': if (this.t >= K.HURT_TIME) this.afterHurt(world); break;
      case 'transition': if (this.t >= K.TRANSITION_TIME) this.setState(this.phase === 2 ? 'chamber' : 'idle'); break;
      case 'dead': if (this.t >= K.DEAD_TIME) this.finish(world); break;
    }
    if (this.phase === 3 && !['transition', 'hurt', 'dead', 'exposed'].includes(this.st)
      && collectMotes(this, world) && this.ritualEchoes >= K.ECHOES_PER_WINDOW && this.st === 'idle') this.expose(world);
  }

  private choose(world: World): void {
    this.cycle++;
    this.y = K.FLY_Y;
    this.face = world.player.x < this.x ? -1 : 1;
    world.audio.play('warn');
    if (this.phase === 2) return this.setState('chamber');
    if (this.phase === 3) {
      this.echo = Math.floor((this.cycle - 1) / 2) % K.ECHO_NAMES.length;
      if (this.cycle % 2) {
        world.popups.push({ x: this.left + T * 10, y: 100, t: 0, txt: `ECO DE ${K.ECHO_NAMES[this.echo].toUpperCase()}` });
        return this.setState('echoWarn');
      }
      this.face = this.cycle % 4 ? 1 : -1;
      return this.setState('beamWarn');
    }
    const attack = this.cycle % 3;
    if (attack === 2) return this.setState('swarmWarn');
    if (attack === 0) return this.setState('gustWarn');
    this.targetX = this.clampTarget(world.player.x - this.w / 2);
    this.diveFromX = this.x;
    this.setState('diveWarn');
  }

  private dive(world: World): void {
    const progress = Math.min(1, this.t / K.DIVE_TIME);
    this.x = this.diveFromX + (this.targetX - this.diveFromX) * progress;
    this.y = K.FLY_Y + (this.floor - this.h - K.FLY_Y) * progress * progress;
    if (progress >= 1) this.expose(world);
  }

  private swarm(world: World): void {
    const fromLeft = world.player.x > this.left + (this.right - this.left) / 2;
    for (const height of [T * 2, T * 4, T * 6])
      addHazard(this, 'bat', fromLeft ? this.left + T : this.right - T, this.floor - height, (fromLeft ? 1 : -1) * K.HAZARD_SPEED);
    this.setState('swarm');
  }

  private gust(world: World, dt: number): void {
    const player = world.player;
    const push = this.face * K.WIND_FORCE * dt;
    moveX(player, push, world.solidAt);
    player.x = Math.max(this.left, Math.min(this.right - player.w, player.x));
    if (this.t >= K.WIND_TIME) this.setState('idle');
  }

  private chamber(world: World, dt: number): void {
    if (torchesReady(this, world)) return this.expose(world);
    this.chamberClock += dt;
    if (this.chamberClock < K.CHAMBER_ATTACK_GAP) return;
    this.chamberClock = 0;
    // El brillo de la marca da 0,9 s para apartarse antes de la caída.
    const target = this.clampTarget(world.player.x);
    addHazard(this, 'shard', target, 80, 0, 70, 130);
  }

  private beam(world: World): void {
    if (overlap(world.player, beamRect(this, world))) world.hurt();
    if (this.t >= K.BEAM_TIME) this.setState('idle');
  }

  private expose(world: World): void {
    this.hazards.length = 0;
    this.x = this.clampTarget(world.player.x);
    this.y = this.floor - this.h;
    this.setState('exposed');
    world.audio.play('stomp');
    world.popups.push({ x: this.x, y: this.y - 30, t: 0, txt: '¡AHORA! · PISOTÓN O DOS DISPAROS' });
  }

  private closeWindow(world: World): void {
    if (this.phase === 2) {
      for (const torch of world.torches) if (torch.x >= this.left && torch.x <= this.right) torch.lit = false;
      this.litTorches = 0;
    }
    if (this.phase === 3) { spawnMotes(this); this.ritualEchoes = 0; }
    this.y = K.FLY_Y;
    this.setState(this.phase === 2 ? 'chamber' : 'idle');
  }

  private contact(world: World): void {
    const player = world.player;
    if (!overlap(player, this)) return;
    if (this.hittable && player.vy > 0 && player.y + player.h - this.y < K.STOMP_MARGIN) {
      player.vy = -K.STOMP_BOUNCE; this.damage(world); return;
    }
    if (CONTACT_STATES.has(this.st)) world.hurt();
  }

  onFireball(world: World): void {
    if (!this.hittable) return;
    if (++this.fireHits >= K.FIRE_HITS) this.damage(world);
  }

  private damage(world: World): void {
    if (!this.hittable) return;
    this.hp--;
    this.hazards.length = 0;
    world.addScore(K.DAMAGE_SCORE, this.x, this.y);
    world.shake = 0.4; world.audio.play('roar');
    if (this.hp > 0) return this.setState('hurt');
    this.motes.length = 0; world.darkness = null;
    this.setState('dead');
  }

  private afterHurt(world: World): void {
    const nextPhase = this.hp <= K.PHASE3_HP ? 3 : this.hp <= K.PHASE2_HP ? 2 : 1;
    if (nextPhase !== this.phase && nextPhase !== 1) {
      preparePhase(this, world, nextPhase); return this.setState('transition');
    }
    this.closeWindow(world);
  }

  private finish(world: World): void {
    openExit(world, this.arena[1]);
    world.grid[GROUND][this.arena[1] + 1] = 'G';
    world.darkness = null;
    rewardBurst(world, this);
    world.addScore(K.VICTORY_SCORE, this.x, this.y);
    world.popups.push({ x: this.x, y: 130, t: 0, txt: '¡TEMAYINA ESTÁ LIBRE! · ¡BRILLA EL SOL DE JADE!' });
    this.setState('gone'); world.audio.play('flag');
  }

  lights(out: LightSource[]): void {
    if (this.phase !== 2) return;
    out.push({ x: this.left + T * 1.8, y: this.floor - 50, radius: 100 });
    out.push({ x: this.x + this.w / 2, y: this.y - 15, radius: this.hittable ? 160 : 110 });
    for (const hazard of this.hazards) out.push({ x: hazard.x, y: hazard.y, radius: 65 });
  }

  draw(context: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawCamazotz(context, this, camX); }
}
