import type { Assets } from './assets';
import { START_LIVES } from './constants';
import { AudioEngine } from './audio';
import { Input } from './input';
import type { LevelDef } from './level/types';
import { Renderer } from './render/Renderer';
import { World } from './World';

/** Presentación inmóvil: el tiempo, los enemigos y el oxígeno no avanzan. */
export class OfferingScene {
  private readonly world: World;
  private readonly renderer: Renderer;

  constructor(canvas: HTMLCanvasElement, assets: Assets, level: LevelDef) {
    const audio = new AudioEngine();
    audio.muted = true;
    this.world = new World({ def: level, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio });
    this.world.offeringActive = true;
    this.renderer = new Renderer(canvas, assets);
  }

  render(now: number): void {
    this.renderer.render(this.world, now, true);
  }
}
