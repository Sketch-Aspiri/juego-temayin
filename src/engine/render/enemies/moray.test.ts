import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Assets } from '../../assets';
import type { MorayLair } from '../../entities/enemies/moray';
import { createEnemy } from '../../entities/enemies';
import type { Ctx } from '../drawUtils';
import { drawMoray } from './moray';

const mocks = vi.hoisted(() => ({
  lair: vi.fn(), frame: vi.fn<typeof import('./atlas').drawLazyFrame>(() => true),
}));
vi.mock('../../entities/enemies/moray', async importOriginal => ({
  ...await importOriginal<typeof import('../../entities/enemies/moray')>(),
  morayLair: mocks.lair,
}));
vi.mock('./atlas', () => ({ drawLazyFrame: mocks.frame }));

function context() {
  const methods = {
    translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), save: vi.fn(), restore: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), fill: vi.fn(), rect: vi.fn(), clip: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
  };
  return { c: methods as unknown as Ctx, methods };
}
const assets = {} as Assets;
const lair = (dx = 1, dy = 0, ext = 70): MorayLair => ({ ax: 100, ay: 100, dx, dy, ext });

beforeEach(() => { vi.clearAllMocks(); mocks.lair.mockReturnValue(lair()); });

describe('morena pintada en su grieta', () => {
  it.each([[1, 0], [-1, 0], [0, 1], [0, -1]])('orienta y recorta la salida (%i, %i)', (dx, dy) => {
    mocks.lair.mockReturnValue(lair(dx, dy));
    const { c, methods } = context();
    const e = createEnemy({ id: 'moray', tx: 4, ty: 9 });
    e.state = 2;
    drawMoray(c, assets, e);
    if (dx) expect(methods.scale).toHaveBeenCalledWith(dx, 1);
    else expect(methods.rotate).toHaveBeenCalledWith(dy * Math.PI / 2);
    expect(methods.rect).toHaveBeenCalledWith(-90, -200, 400, 400);
    expect(methods.clip).toHaveBeenCalledOnce();
    expect(methods.clip.mock.invocationCallOrder[0]).toBeLessThan(mocks.frame.mock.invocationCallOrder[0]);
    expect(mocks.frame).toHaveBeenCalledWith(c, 'enemies/moray.webp', expect.objectContaining({ ax: 558, ay: 834 }), 0.11);
  });

  it('el recorte oculta toda la cabeza cuando permanece dentro de la roca', () => {
    mocks.lair.mockReturnValue(lair(1, 0, -40));
    const { c, methods } = context();
    drawMoray(c, assets, createEnemy({ id: 'moray', tx: 4, ty: 9 }));
    expect(methods.rect).toHaveBeenCalledWith(20, -200, 400, 400);
    const frame = mocks.frame.mock.calls[0][2] as { x: number; w: number; ax: number };
    expect((frame.x + frame.w - frame.ax) * 0.11).toBeLessThan(20);
  });

  it.each([[0, 454, 369], [1, 1140, 258], [2, 558, 834], [3, 1140, 936]])('ancla la cabeza en la pose %i', (state, ax, ay) => {
    const { c } = context();
    const e = createEnemy({ id: 'moray', tx: 4, ty: 9 });
    e.state = state;
    drawMoray(c, assets, e);
    expect(mocks.frame).toHaveBeenCalledWith(c, 'enemies/moray.webp', expect.objectContaining({ ax, ay }), 0.11);
  });
});
