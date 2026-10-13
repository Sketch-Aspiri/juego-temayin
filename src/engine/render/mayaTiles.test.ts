import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAYA_TILE_SPRITES } from '../../data/mayaTileSprites';
import { ALL_LEVELS } from '../../data/worlds';
import { AudioEngine } from '../audio';
import { Input } from '../input';
import { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawMayaTile, drawPaintedTerrain, drawRewardLight } from './mayaTiles';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mock.frame }));
const art = { width: 80, height: 25 } as HTMLCanvasElement;
const drawImage = vi.fn();
const fillRect = vi.fn();
const c = { drawImage, fillRect, save: vi.fn(), restore: vi.fn(), globalAlpha: 1 } as unknown as Ctx;

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(art); });

describe('Cofres y columnas mayas', () => {
  it.each(['p', 'q', 'l', 'r'])('la mitad %s conserva su baldosa y no depende de la otra mitad visible', tile => {
    drawMayaTile(c, tile, 3, 120);
    expect(drawImage).toHaveBeenCalledWith(art, tile === 'q' || tile === 'r' ? 40 : 0, 0, 40, 25, 3, 120, 40, 40);
  });

  it.each(['?', 'M', 'L', 'F', 'S', 'P'])('el premio %s conserva el tamaño y el sello de cacao', tile => {
    drawMayaTile(c, tile, 100, 200);
    expect(mock.frame.mock.calls[0][0]).toBe(MAYA_TILE_SPRITES.reward.file);
    expect(drawImage).toHaveBeenCalledWith(art, 100, 200, 40, 40);
  });

  it('al recoger el premio cambia al cofre vacío, mantiene su colisión y apaga la luz', () => {
    const audio = new AudioEngine(); audio.muted = true;
    const world = new World({ def: ALL_LEVELS[0], input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
    world.hitBlock(15, 8);
    const tile = world.tileAt(15, 8);
    expect(world.solid(15, 8)).toBe(true);
    expect(world.session.coins).toBe(1);
    drawMayaTile(c, tile, 600, 320);
    drawRewardLight(c, tile, 600, 320, 500);
    expect(mock.frame.mock.calls[0][0]).toBe(MAYA_TILE_SPRITES.spent.file);
    expect(fillRect).not.toHaveBeenCalled();
  });

  it('devuelve el dibujo al respaldo para arte sin cargar o terreno de otro tipo', () => {
    mock.frame.mockReturnValue(null);
    expect(drawMayaTile(c, 'p', 0, 0)).toBe(false);
    expect(drawMayaTile(c, '?', 0, 0)).toBe(false);
    expect(drawMayaTile(c, 'G', 0, 0)).toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('mantiene suelo continuo bajo las esquinas transparentes sin invadir otras baldosas', () => {
    expect(drawPaintedTerrain(c, 'grass', 120, 480)).toBe(true);
    expect(fillRect).toHaveBeenCalledWith(120, 480, 40, 40);
    expect(drawImage).toHaveBeenCalledWith(art, 120, 480, 40, 40);
    expect(mock.frame.mock.calls[0][3]).toBe(true);
    mock.frame.mockReturnValue(null); vi.clearAllMocks();
    expect(drawPaintedTerrain(c, 'grass', 120, 480)).toBe(false);
    expect(fillRect).not.toHaveBeenCalled();
  });
});
