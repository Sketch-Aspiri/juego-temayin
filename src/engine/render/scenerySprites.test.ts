import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_LEVELS } from '../../data/worlds';
import { SCENERY_SPRITES } from '../../data/scenerySprites';
import { AudioEngine } from '../audio';
import { T } from '../constants';
import { Input } from '../input';
import { World } from '../World';
import type { Ctx } from './drawUtils';
import { arenaPlatformArt, drawScenerySprite, drawTorches } from './scenerySprites';

const mocks = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mocks.frame }));
const image = { width: 42, height: 56 } as HTMLCanvasElement;

function makeWorld(id: string): World {
  const def = ALL_LEVELS.find(level => level.id === id)!;
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
}

function context() {
  const gradient = { addColorStop: vi.fn() };
  const methods = {
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    fill: vi.fn(), fillRect: vi.fn(), ellipse: vi.fn(), createRadialGradient: vi.fn(() => gradient),
  };
  return { c: methods as unknown as Ctx, methods };
}

beforeEach(() => { vi.clearAllMocks(); mocks.frame.mockReturnValue(image); });

describe('Sprites de escenario', () => {
  it('ancla la llama pintada en la fuente de iluminación y conserva su tamaño', () => {
    const { c, methods } = context();
    drawScenerySprite(c, 'torch', 100, 420, 42);
    expect(mocks.frame).toHaveBeenCalledWith(SCENERY_SPRITES.torch.file, SCENERY_SPRITES.torch.frame, 42 / 249);
    expect(methods.drawImage).toHaveBeenCalledWith(image, Math.round(100 - 185 * 42 / 249), Math.round(420 - 90 * 42 / 249));
  });

  it('mantiene iluminación y simulación al dibujar las antorchas de Izamal', () => {
    const world = makeWorld('3-5');
    world.camX = 62 * T;
    const sources = world.lightSources();
    const grid = world.grid.map(row => [...row]);
    const { c, methods } = context();
    drawTorches(c, world, 1000);
    expect(methods.drawImage).toHaveBeenCalledTimes(2);
    expect(methods.save).toHaveBeenCalledTimes(2);
    expect(methods.restore).toHaveBeenCalledTimes(2);
    expect(world.lightSources()).toEqual(sources);
    expect(world.grid).toEqual(grid);
  });

  it.each(['2-7', '4-5'])('viste solo las plataformas de la arena de %s y conserva los bloques sólidos', id => {
    const world = makeWorld(id);
    const boss = world.def.boss!;
    world.camX = (boss.arena[0] - 1) * T;
    const grid = world.grid.map(row => [...row]);
    const platforms = arenaPlatformArt(world);
    expect(platforms).toHaveLength(3);
    for (const p of platforms) {
      expect(p.tx).toBeGreaterThanOrEqual(boss.arena[0]);
      expect(p.tx + p.length - 1).toBeLessThanOrEqual(boss.arena[1]);
      expect(world.grid[p.ty].slice(p.tx, p.tx + p.length)).toEqual(Array(p.length).fill('X'));
    }
    expect(world.grid).toEqual(grid);
  });

  it('conserva el respaldo de bloques mientras el atlas no ha cargado', () => {
    mocks.frame.mockReturnValue(null);
    const world = makeWorld('2-7'); world.camX = 61 * T;
    expect(arenaPlatformArt(world)).toEqual([]);
    const { c, methods } = context();
    expect(drawScenerySprite(c, 'arcade', 400, 480, 800)).toBe(false);
    expect(methods.drawImage).not.toHaveBeenCalled();
  });

  it('omite las antorchas que quedan fuera de cámara', () => {
    const { c, methods } = context();
    drawTorches(c, makeWorld('3-5'), 1000);
    expect(methods.drawImage).not.toHaveBeenCalled();
  });
});
