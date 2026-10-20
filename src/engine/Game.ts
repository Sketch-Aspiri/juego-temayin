import { applyBlessings, type BlessingId } from './blessings';
import type { Assets } from './assets';
import type { AudioEngine } from './audio';
import { DEATH_DELAY, STEP } from './constants';
import { hudKey, type HudState } from './hud';
import type { Input } from './input';
import type { LevelDef } from './level/types';
import { Renderer } from './render/Renderer';
import { coinRatio, computeStars, type LevelResult } from './scoring';
import type { Session } from './types';
import { World } from './World';

export interface GameCallbacks {
  onHud(hud: HudState): void;
  onComplete(result: LevelResult): void;
  onGameOver(score: number): void;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  assets: Assets;
  audio: AudioEngine;
  input: Input;
  level: LevelDef;
  /** Se muta durante la partida (puntos, monedas, vidas). */
  session: Session;
  callbacks: GameCallbacks;
  initialBlessings?: readonly BlessingId[];
  ticketCollected?: boolean;
  discoveries?: readonly string[];
}

const MAX_FRAME_TIME = 0.1;

/** Controla el bucle de tiempo fijo, las muertes/reapariciones y la finalización del nivel. */
export class Game {
  private world: World;
  private readonly renderer: Renderer;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private paused = false;
  private finished = false;
  private deaths = 0;
  private spawnId = 0;
  private lastHudKey = '';
  private readonly startScore: number;

  constructor(private readonly opts: GameOptions) {
    this.renderer = new Renderer(opts.canvas, opts.assets);
    this.startScore = opts.session.score;
    this.world = this.spawn(false, opts.ticketCollected ?? false, opts.discoveries ?? []);
    applyBlessings(this.world, opts.initialBlessings ?? []);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.opts.input.attach();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.opts.input.detach();
    this.publishHud();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    // En pausa el teclado queda libre para los botones del menú.
    if (paused) this.opts.input.detach();
    else if (this.running && !this.finished) this.opts.input.attach();
    this.opts.input.reset();
    // Evita que el tiempo en pausa se acumule como un salto enorme.
    this.last = performance.now();
  }

  private spawn(fromCheckpoint: boolean, ticketCollected: boolean, discoveries: readonly string[], riddles: readonly string[] = []): World {
    this.spawnId++;
    return new World({
      def: this.opts.level,
      session: this.opts.session,
      input: this.opts.input,
      audio: this.opts.audio,
      fromCheckpoint,
      ticketCollected,
      discoveries,
      riddles,
    });
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.acc += Math.min(MAX_FRAME_TIME, (now - this.last) / 1000);
    this.last = now;
    while (this.acc >= STEP) {
      if (!this.paused && !this.finished) this.step();
      else if (!this.paused) this.world.update(STEP); // fin de nivel: fuegos artificiales
      this.acc -= STEP;
    }
    this.renderer.render(this.world, now, this.paused);
    this.publishHud();
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(): void {
    const w = this.world;
    w.update(STEP);
    if (w.phase === 'dying' && w.phaseT > DEATH_DELAY) this.handleDeath();
    else if (w.phase === 'done') this.handleComplete();
  }

  private handleDeath(): void {
    const { session, callbacks } = this.opts;
    this.deaths++;
    session.lives--;
    if (session.lives <= 0) {
      this.finished = true;
      this.opts.input.detach();
      this.world.phase = 'dying';
      callbacks.onGameOver(session.score);
      return;
    }
    this.world = this.spawn(this.world.checkpointReached, this.world.ticketCollected, this.world.discoveries, this.world.riddlesSolved);
  }

  private handleComplete(): void {
    if (this.finished) return;
    this.finished = true;
    this.opts.input.detach();
    const w = this.world;
    const ratio = coinRatio(w.coinsCollected, w.level.totalCoins);
    this.opts.callbacks.onComplete({
      levelId: this.opts.level.id,
      score: this.opts.session.score - this.startScore,
      stars: computeStars(ratio, this.deaths),
      coinRatio: ratio,
      deaths: this.deaths,
      session: { ...this.opts.session },
    });
  }

  private publishHud(): void {
    const hud = this.world.hudState(this.spawnId);
    const key = hudKey(hud);
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.opts.callbacks.onHud(hud);
  }
}
