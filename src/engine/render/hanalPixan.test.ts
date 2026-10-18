import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import { HANAL_MOTION_FILE, HANAL_MOTION_FRAMES } from '../../data/hanalPixanPlayer';
import { PLAYER_HEAD_WIDTH } from '../../data/playerScale';
import { World } from '../World';
import { Input } from '../input';
import { AudioEngine } from '../audio';
import type { Ctx } from './drawUtils';
import { drawHanalEnemy, drawHanalPlayer } from './hanalPixan';

const mocks = vi.hoisted(() => ({ frame: vi.fn() }));
vi.mock('./artCache', () => ({ bakedFrame: mocks.frame }));
const context = () => ({ save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(),
  rotate: vi.fn(), drawImage: vi.fn() });
const world = () => new World({ def: HANAL_PIXAN_LEVEL, input: new Input(), audio: new AudioEngine(),
  session: { score: 0, coins: 0, lives: 3 } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.frame.mockImplementation((_file, frame, scale) => ({ width: frame[2] * scale, height: frame[3] * scale }));
});

describe('Alebrijes jugables', () => {
  it('apoya los pies, conserva proporciones y gira el jugador sin mutar la simulación', () => {
    const w = world(), c = context();
    w.player.onGround = true;
    w.player.face = -1;
    const before = structuredClone(w.player);
    expect(drawHanalPlayer(c as unknown as Ctx, w, 100)).toBe(true);
    const frame = HANAL_MOTION_FRAMES.idle1;
    expect(mocks.frame).toHaveBeenCalledWith(HANAL_MOTION_FILE,
      [frame.x, frame.y, frame.w, frame.h], PLAYER_HEAD_WIDTH / frame.headWidth, true);
    expect(c.translate).toHaveBeenCalledWith(w.player.x + w.player.w / 2, w.player.y + w.player.h);
    expect(c.scale).toHaveBeenCalledWith(-1, 1);
    const [image, x, y] = c.drawImage.mock.calls[0];
    expect(x).toBe(Math.round((frame.x - frame.ax) * PLAYER_HEAD_WIDTH / frame.headWidth));
    expect(Math.abs(y + image.height)).toBeLessThanOrEqual(1);
    expect(w.player).toEqual(before);
  });

  it('mantiene parpadeo de invulnerabilidad y respaldo cuando falta el arte', () => {
    const w = world(), c = context();
    w.player.inv = 1;
    expect(drawHanalPlayer(c as unknown as Ctx, w, 100)).toBe(true);
    expect(c.drawImage).not.toHaveBeenCalled();
    w.player.inv = 0;
    mocks.frame.mockReturnValue(null);
    expect(drawHanalPlayer(c as unknown as Ctx, w, 100)).toBe(false);
  });

  it('sustituye los cuatro enemigos sin alterar sus hitboxes o movimiento', () => {
    const w = world(), c = context();
    for (const enemy of w.enemies) {
      const before = structuredClone(enemy);
      expect(drawHanalEnemy(c as unknown as Ctx, enemy, enemy.x)).toBe(true);
      expect(enemy).toEqual(before);
    }
    expect(c.drawImage).toHaveBeenCalledTimes(w.enemies.length);
  });
});
