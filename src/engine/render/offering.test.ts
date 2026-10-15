import { describe, expect, it, vi } from 'vitest';
import { getLevel } from '../../data/worlds';
import type { Assets } from '../assets';
import { AudioEngine } from '../audio';
import { Input } from '../input';
import { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawOffering } from './offering';
import { drawPlayerSprite } from './sprites';

vi.mock('./artCache', () => ({ lazyImage: () => ({ naturalWidth: 1145, naturalHeight: 1374 }) }));
vi.mock('./props', () => ({ drawCacao: vi.fn() }));

function context() {
  const methods = {
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(),
    fillRect: vi.fn(), strokeRect: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
  };
  return { c: methods as unknown as Ctx, methods };
}

describe('Dibujo del encuentro', () => {
  it.each([0, 40])('Ek Chuah tiene la misma altura que Temayin y apoya en el mismo suelo (cámara %s)', camX => {
    const world = new World({ def: getLevel('1-3')!, input: new Input(), audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 } });
    world.offeringActive = true; world.camX = camX;
    const { c, methods } = context();
    drawOffering(c, world, 0);
    const deity = methods.drawImage.mock.calls.at(-1)!;
    const assets = { player: { complete: true, naturalWidth: 1360 } } as unknown as Assets;
    drawPlayerSprite(c, assets, world.player, camX, false, 0, 0);
    const player = methods.drawImage.mock.calls.at(-1)!;
    expect(deity[4]).toBeCloseTo(player[8]);
    expect(deity[2] + deity[4]).toBeCloseTo(world.player.y + world.player.h);
    expect(deity[3] / deity[4]).toBeCloseTo(1145 / 1374);
    expect(world.session.coins).toBe(0);
    expect(world.timeLeft).toBe(world.def.time ?? 300);
  });

  it('no dibuja la deidad durante el nivel jugable', () => {
    const world = new World({ def: getLevel('1-3')!, input: new Input(), audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 } });
    const { c, methods } = context();
    drawOffering(c, world, 0);
    expect(methods.drawImage).not.toHaveBeenCalled();
  });
});
