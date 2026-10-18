import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLevel } from '../data/worlds';
import type { Assets } from './assets';
import { AudioEngine } from './audio';
import { DEATH_DELAY, START_LIVES } from './constants';
import { Game } from './Game';
import { Input } from './input';
import { World } from './World';

vi.mock('./render/Renderer', () => ({ Renderer: class { render(): void {} } }));

describe('Bendiciones durante la partida', () => {
  let frame: FrameRequestCallback;
  let now: number;
  let current: World;
  const onHud = vi.fn();
  const onComplete = vi.fn();
  const onGameOver = vi.fn();

  beforeEach(() => {
    now = performance.now();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const update = World.prototype.update;
    vi.spyOn(World.prototype, 'update').mockImplementation(function (this: World, dt: number) {
      current = this;
      update.call(this, dt);
    });
    onHud.mockClear(); onComplete.mockClear(); onGameOver.mockClear();
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function make(): Game {
    const input = new Input();
    vi.spyOn(input, 'attach').mockImplementation(() => undefined);
    vi.spyOn(input, 'detach').mockImplementation(() => undefined);
    return new Game({ canvas: {} as HTMLCanvasElement, assets: {} as Assets, input, audio: new AudioEngine(),
      level: getLevel('1-3')!, session: { score: 0, coins: 150, lives: START_LIVES },
      initialBlessings: ['fire', 'shield', 'life'], callbacks: { onHud, onComplete, onGameOver } });
  }

  function advance(seconds: number): void {
    for (let t = 0; t < seconds; t += 0.02) { now += 20; frame(now); }
  }

  it('entrega los poderes una vez y conserva el cacao al reaparecer en el checkpoint', () => {
    const game = make(); game.start(); advance(0.1);
    expect(onHud).toHaveBeenLastCalledWith(expect.objectContaining({ fire: true, shield: true, lives: START_LIVES + 1 }));
    const first = current;
    current.session.coins = 157;
    current.checkpointReached = true;
    current.die(); advance(DEATH_DELAY + 0.2);
    expect(current).not.toBe(first);
    expect(current.checkpointReached).toBe(true);
    expect(current.player.fire).toBe(false);
    expect(current.player.shield).toBe(false);
    expect(current.session.coins).toBe(157);
    expect(current.session.lives).toBe(START_LIVES);
    game.stop();
  });

  it('no avanza el tiempo ni duplica bendiciones mientras está en pausa', () => {
    const game = make(); game.start(); advance(0.1);
    const time = current.timeLeft;
    game.setPaused(true); advance(2);
    expect(current.timeLeft).toBe(time);
    expect(current.session.lives).toBe(START_LIVES + 1);
    game.stop();
  });

  it('conserva el boleto al morir y lo publica también al salir', () => {
    const game = make(); game.start(); advance(0.1);
    current.ticketCollected = true;
    current.checkpointReached = true;
    current.die(); advance(DEATH_DELAY + 0.2);
    expect(current.ticketCollected).toBe(true);
    expect(onHud).toHaveBeenLastCalledWith(expect.objectContaining({ ticket: true }));
    game.stop();
    expect(onHud).toHaveBeenLastCalledWith(expect.objectContaining({ ticket: true }));
  });

  it('publica el último saldo al salir y lo conserva al perder todas las vidas', () => {
    const game = make(); game.start(); advance(0.1);
    current.session.coins = 173;
    game.stop();
    expect(onHud).toHaveBeenLastCalledWith(expect.objectContaining({ coins: 173 }));
    game.start();
    current.session.lives = 1; current.die(); advance(DEATH_DELAY + 0.2);
    expect(onGameOver).toHaveBeenCalledOnce();
    expect(current.session.coins).toBe(173);
    game.stop();
  });

  it('finalizar no convierte el saldo de la bolsa en cacao recogido ni duplica resultados', () => {
    const game = make(); game.start(); advance(0.1);
    current.phase = 'done'; advance(0.2);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ stars: 1, coinRatio: 0, session: expect.objectContaining({ coins: 150 }) }));
    game.stop();
  });
});
