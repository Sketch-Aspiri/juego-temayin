import type { Assets } from '../../assets';
import { CHIVO_EYES, CHIVO_POSES, CHIVO_STATE_POSE } from '../../../data/huayChivoArt';
import { GROUND, T } from '../../constants';
import { extinguishTorches } from '../../entities/torches';
import { appearChivo, hideChivo } from './states/blink';
import { chargeStep, startPaw } from './states/charge';
import { makeParticle } from '../../entities/particles';
import type { BossConfig } from '../../level/types';
import { overlap } from '../../physics';
import type { LightSource } from '../../render/lighting';
import { LightBuffer } from '../../render/lighting';
import { makeRng } from '../../rng';
import type { World } from '../../World';
import { closeArena, entranceColumn, openExit, rewardBurst } from '../arena';
import type { Boss } from '../types';
import { type ChivoAttack, chooseAttack, endsDazed } from './choose';
import { drawHuayChivo } from './draw';
import {
  callWisps, type ChivoWave, leapTarget, leapVx, stepLeapBody, stepWaves, stepWisps,
  stompWaves, type Wisp,
} from './hazards';
import { duskAt, NIGHT_POPUP, phaseFor } from './night';
import * as K from './tuning';

export type ChivoState =
  | 'sleep' | 'intro' | 'idle'
  | 'fade' | 'hidden' | 'appear'
  | 'paw' | 'charge' | 'turn' | 'dazed'
  | 'crouch' | 'leap' | 'land'
  | 'rear' | 'horn' | 'recover'
  | 'call' | 'hurt' | 'nightfall' | 'dead' | 'gone';

/** Tocarlo en estos estados hiere al jugador (aunque le pise: rebota en los cuernos). */
const HARMFUL: ReadonlySet<ChivoState> = new Set(['charge', 'leap']);
/** Avisos con los ojos encendidos: también alumbran en la oscuridad. */
const EYES_GLOW: ReadonlySet<ChivoState> = new Set(['paw', 'turn', 'crouch', 'call', 'rear']);
const HURT_SPARKS = 10;
const SPARK_SPEED = 220;
/** Caché de dibujo separada del estado serializable del combate. */
const lightBuffers = new WeakMap<HuayChivo, LightBuffer>();


/**
 * Huay Chivo, jefe del Mundo 3 (AGENTS.md §4.4): brujo-cabra del folclor yucateco,
 * presentado como figura de leyenda. Pelea en el atrio amarillo de Izamal mientras cae
 * la noche, en tres fases (8, 5 y 2 PV):
 *  1. Atardecer: embiste, se teletransporta entre los arcos e invoca fuegos fatuos.
 *  2. Anochecer: oscuridad parcial, más velocidad y pisotón con ondas de choque.
 *  3. Noche cerrada: casi a oscuras; tras cada choque da media vuelta y embiste otra vez.
 * Única ventana de daño: aturdido tras chocar con un borde (`dazed`). Pisotón o dos
 * bolas de fuego quitan 1 PV, solo uno por ventana. Elige ataques con `choose.ts`.
 */
export class HuayChivo implements Boss {
  readonly id = 'huayChivo';
  readonly name = 'HUAY CHIVO';
  readonly maxHp = K.HUAY_CHIVO_HP;
  hp = K.HUAY_CHIVO_HP;
  x: number;
  y = GROUND * T - K.HUAY_CHIVO_H;
  w = K.HUAY_CHIVO_W;
  h = K.HUAY_CHIVO_H;
  vx = 0;
  vy = 0;
  face: 1 | -1 = -1;
  st: ChivoState = 'sleep';
  /** Tiempo en el estado actual. */
  t = 0;
  /** Reloj continuo para animaciones. */
  clock = 0;
  phase: K.ChivoPhase = 1;
  wisps: Wisp[] = [];
  waves: ChivoWave[] = [];
  /** Borde izquierdo (px) del arco donde aparecerá tras el teletransporte. */
  blinkX = 0;
  decoyX: number | null = null;
  stucco: { x: number; y: number; t: number }[] = [];
  /** Borde izquierdo (px) donde caerá el pisotón. */
  leapX = 0;
  readonly arena: readonly [number, number];
  private last: ChivoAttack | null = null;
  private sinceCharge = 0;
  doubled = false;
  fireHits = 0;
  private readonly rng = makeRng(K.RNG_SEED);

  constructor(cfg: BossConfig) {
    this.x = cfg.x * T;
    this.arena = cfg.arena;
    lightBuffers.set(this, new LightBuffer());
  }

  get lockCamera(): boolean { return this.st !== 'sleep' && this.st !== 'gone'; }
  get hudVisible(): boolean { return this.lockCamera; }
  get intro(): boolean { return this.st === 'intro'; }
  get hittable(): boolean { return this.st === 'dazed'; }
  get stage(): number { return this.phase; }
  /** Se conserva para `imagenes/verify_bosses.py`. */
  get phase2(): boolean { return this.phase >= 2; }
  /** Bordes de la arena en px. */
  get left(): number { return this.arena[0] * T; }
  get right(): number { return (this.arena[1] + 1) * T; }
  get eyeX(): number {
    const id = CHIVO_STATE_POSE[this.st], pose = CHIVO_POSES[id];
    return this.x + this.w / 2 + this.face * (CHIVO_EYES[id][0] - pose.anchor[0]) * pose.scale;
  }
  get eyeY(): number {
    const id = CHIVO_STATE_POSE[this.st], pose = CHIVO_POSES[id];
    return this.y + this.h + (CHIVO_EYES[id][1] - pose.anchor[1]) * pose.scale;
  }

  setState(st: ChivoState): void { this.st = st; this.t = 0; }

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
    stepWaves(world, this.waves, dt, this.left, this.right);
    stepWisps(world, this.wisps, dt);
    this.stepStucco(dt);
    this.runState(world, dt);
    this.contact(world);
  }

  private wake(world: World): void {
    if (world.player.x <= (this.arena[0] + 1) * T) return;
    closeArena(world, this.arena[0]);
    this.setState('intro');
    world.audio.play('roar');
  }

  private runState(world: World, dt: number): void {
    const ph = this.phase;
    switch (this.st) {
      case 'intro': if (this.t >= K.INTRO_TIME) this.setState('idle'); break;
      case 'idle':
        this.faceToPlayer(world);
        if (this.t >= K.byPhase(K.IDLE_TIME, ph)) this.startAttack(world);
        break;
      case 'fade': if (this.t >= K.FADE_TIME) hideChivo(this, world, this.rng); break;
      case 'hidden': if (this.t >= K.byPhase(K.BLINK_WARN, ph)) appearChivo(this, world, this.rng); break;
      case 'appear': if (this.t >= K.APPEAR_TIME) startPaw(this, world); break;
      case 'paw':
        this.faceToPlayer(world);
        if (this.t >= K.byPhase(K.PAW_TIME, ph)) this.setState('charge');
        break;
      case 'charge': chargeStep(this, world, dt, this.rng); break;
      case 'turn': if (this.t >= K.TURN_TIME) this.setState('charge'); break;
      case 'dazed': if (this.t >= K.byPhase(K.DAZED_TIME, ph)) this.setState('idle'); break;
      case 'crouch':
        this.faceToPlayer(world);
        if (this.t >= K.byPhase(K.CROUCH_TIME, ph)) this.leap(world);
        break;
      case 'leap': this.leapStep(world, dt); break;
      case 'land': if (this.t >= K.LAND_TIME) this.setState('idle'); break;
      case 'rear': if (this.t >= K.HORN_WARN) this.setState('horn'); break;
      case 'horn': if (this.t >= K.HORN_TIME) this.setState('recover'); break;
      case 'recover': if (this.t >= K.HORN_RECOVER) this.setState('idle'); break;
      case 'call': if (this.t >= K.CALL_TIME) this.summon(); break;
      case 'hurt': if (this.t >= K.HURT_TIME) this.afterHurt(world); break;
      case 'nightfall': this.dusk(world); break;
      case 'dead': if (this.t >= K.DEAD_TIME) this.vanish(world); break;
    }
  }

  private startAttack(world: World): void {
    const p = world.player;
    const distTiles = Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) / T;
    const a = chooseAttack({ phase: this.phase, last: this.last, sinceCharge: this.sinceCharge, distTiles, wispsAlive: this.wisps.length }, this.rng);
    this.last = a;
    this.sinceCharge = endsDazed(a) ? 0 : this.sinceCharge + 1;
    if (a === 'charge') return startPaw(this, world);
    if (a === 'blink') return this.setState('fade');
    this.faceToPlayer(world);
    this.setState(a === 'horns' ? 'rear' : a === 'stomp' ? 'crouch' : 'call');
    world.audio.play('warn');
  }

  private stepStucco(dt: number): void {
    let n = 0;
    for (const s of this.stucco) {
      s.t += dt;
      s.y += K.STUCCO_FALL * s.t * dt;
      if (s.t < K.STUCCO_LIFE) this.stucco[n++] = s;
    }
    this.stucco.length = n;
  }

  private leap(world: World): void {
    const p = world.player;
    this.leapX = leapTarget(this.x, p.x + p.w / 2, this.w, this.left, this.right);
    this.vx = leapVx(this.x, this.leapX);
    this.vy = -K.LEAP_JUMP;
    world.audio.play('jump');
    this.setState('leap');
  }

  private leapStep(world: World, dt: number): void {
    const landed = stepLeapBody(this, dt, GROUND * T - this.h);
    this.x = Math.max(this.left, Math.min(this.right - this.w, this.x));
    if (!landed) return;
    this.vx = 0;
    world.shake = K.STOMP_SHAKE;
    world.audio.play('brk');
    stompWaves(this.waves, this.x + this.w / 2, this.phase);
    this.setState('land');
  }

  private summon(): void {
    callWisps(this.wisps, this.x + this.w / 2, this.y, this.phase);
    this.setState('idle');
  }

  private contact(world: World): void {
    const p = world.player;
    if (world.phase !== 'play') return;
    if (this.st === 'horn') {
      const x = this.face > 0 ? this.x : this.x - K.HORN_REACH;
      if (p.x + p.w > x && p.x < x + this.w + K.HORN_REACH && p.y + p.h > GROUND * T - K.HORN_HEIGHT && p.y < GROUND * T) world.hurt();
      return;
    }
    if (!overlap(p, this)) return;
    const stomp = p.vy > 0 && p.y + p.h - this.y < K.STOMP_MARGIN;
    if (this.st === 'dazed') {
      if (stomp) this.stomped(world);
      return;
    }
    if (!HARMFUL.has(this.st)) return;
    if (stomp) p.vy = -K.STOMP_BOUNCE; // rebota en los cuernos, pero se lastima
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
    if (this.fireHits < K.FIRE_HITS_PER_HP) {
      world.audio.play('stomp');
      return;
    }
    this.damage(world);
  }

  /** Quita 1 PV y cierra la ventana: tras el daño no se le puede golpear otra vez. */
  private damage(world: World): void {
    this.hp--;
    this.fireHits = 0;
    this.wisps.length = 0;
    world.shake = K.HURT_SHAKE;
    world.audio.play('roar');
    this.sparks(world);
    if (this.hp > 0) return this.setState('hurt');
    this.waves.length = 0;
    world.addScore(K.SCORE_KILL, this.x + this.w / 2, this.y - this.h / 2);
    world.darkness = world.def.darkness ?? null;
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

  /** Tras el daño: si cruzó un umbral, cae la noche; si no, se teletransporta para dar respiro. */
  private afterHurt(world: World): void {
    const next = phaseFor(this.hp, K.PHASE2_HP, K.PHASE3_HP);
    if (next > this.phase) return this.nightfall(world, next === 3 ? 3 : 2);
    this.blinkAway();
  }

  private blinkAway(): void {
    this.last = 'blink';
    this.sinceCharge = 0;
    this.setState('fade');
  }

  private nightfall(world: World, phase: 2 | 3): void {
    this.phase = phase;
    extinguishTorches(world, this.left, this.right);
    this.wisps.length = 0;
    this.waves.length = 0;
    world.shake = K.NIGHTFALL_SHAKE;
    world.audio.play('roar');
    world.popups.push({ x: this.x + this.w / 2, y: this.y - 35, t: 0, txt: NIGHT_POPUP[phase] });
    this.setState('nightfall');
  }

  /** Rugido mientras oscurece: inofensivo y no golpeable; luego se teletransporta. */
  private dusk(world: World): void {
    world.darkness = duskAt(this.phase, this.t);
    if (this.t >= K.NIGHTFALL_TIME) this.blinkAway();
  }

  /** Se desvanece, devuelve la luz del nivel, abre el muro de salida y suelta el premio. */
  private vanish(world: World): void {
    this.setState('gone');
    this.wisps.length = 0;
    this.waves.length = 0;
    world.darkness = world.def.darkness ?? null;
    rewardBurst(world, this);
    openExit(world, this.arena[1]);
    world.popups.push({ x: this.x, y: this.y, t: 0, txt: '¡EL CAMINO ESTÁ LIBRE!' });
    world.audio.play('flag');
  }

  /** Ojos en los avisos, destino del teletransporte, aturdimiento y fuegos fatuos. */
  lights(out: LightSource[]): void {
    const buffer = lightBuffers.get(this)!;
    buffer.reset();
    if (EYES_GLOW.has(this.st)) buffer.add(this.eyeX, this.eyeY, K.EYE_LIGHT_RADIUS);
    if (this.st === 'hidden') buffer.add(this.eyeX + this.blinkX - this.x, this.eyeY, K.EYE_LIGHT_RADIUS);
    if (this.st === 'dazed') buffer.add(this.x + this.w / 2, this.y + this.h / 2, K.DAZED_LIGHT_RADIUS);
    for (const f of this.wisps) buffer.add(f.x, f.y, K.WISP_LIGHT_RADIUS);
    for (const light of buffer.sources) out.push(light);
  }

  draw(c: CanvasRenderingContext2D, _assets: Assets, camX: number): void { drawHuayChivo(c, this, camX); }
}
