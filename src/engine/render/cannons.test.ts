import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NEW_GAMEPLAY_SPRITES } from '../../data/newGameplaySprites';
import { CANNONBALL_RADIUS, type Cannonball } from '../entities/cannons';
import type { Ctx } from './drawUtils';
import { drawCannonballs } from './cannons';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 60, height: 40 } as HTMLCanvasElement;

function context() {
  const methods = {
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), globalAlpha: 1,
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  return { c: methods as unknown as Ctx, methods };
}

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Sprites de las balas de cañón', () => {
  it.each([-220, 220])('centra la bala y orienta la estela para una velocidad de %s', vx => {
    const ball: Cannonball = { x: 300, y: 220, vx, t: 0.3, gone: false };
    const before = structuredClone(ball);
    const { c, methods } = context();
    drawCannonballs(c, [ball], 100);
    const diameter = 2 * CANNONBALL_RADIUS;
    expect(methods.translate).toHaveBeenCalledWith(200, 220);
    expect(methods.scale).toHaveBeenCalledWith(vx < 0 ? -1 : 1, 1);
    expect(methods.drawImage.mock.calls.at(-1)).toEqual([image, -CANNONBALL_RADIUS, -CANNONBALL_RADIUS, diameter, diameter]);
    expect(mock.frame.mock.calls.map(call => call[0])).toEqual([
      NEW_GAMEPLAY_SPRITES.cannonSmoke.file, NEW_GAMEPLAY_SPRITES.cannonball.file,
    ]);
    expect(ball).toEqual(before);
  });

  it('ancla el extremo denso del humo detrás de la bala', () => {
    const { c, methods } = context();
    drawCannonballs(c, [{ x: 300, y: 220, vx: 220, t: 0.3, gone: false }], 0);
    const trail = methods.drawImage.mock.calls[0];
    expect(trail[1] + trail[3]).toBe(-CANNONBALL_RADIUS);
    expect(trail[2] + trail[4] / 2).toBe(0);
  });

  it('conserva un respaldo visible si los sprites todavía no cargan', () => {
    mock.frame.mockReturnValue(null);
    const { c, methods } = context();
    drawCannonballs(c, [{ x: 300, y: 220, vx: 220, t: 0.3, gone: false }], 0);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(methods.arc).toHaveBeenCalledWith(0, 0, CANNONBALL_RADIUS, 0, Math.PI * 2);
    expect(methods.ellipse).toHaveBeenCalledTimes(3);
  });

  it('omite las balas que ya se destruyeron', () => {
    const { c, methods } = context();
    drawCannonballs(c, [{ x: 300, y: 220, vx: 220, t: 0.3, gone: true }], 0);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(mock.frame).not.toHaveBeenCalled();
  });
});
