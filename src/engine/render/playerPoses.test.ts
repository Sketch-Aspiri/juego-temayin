import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GAMEPLAY_SPRITES } from '../../data/gameplaySprites';
import { PLAYER_SPRITES } from '../../data/playerSprites';
import { PLAYER_HEAD_WIDTH, PLAYER_POSE_HEAD_WIDTHS } from '../../data/playerScale';
import type { Assets } from '../assets';
import { createPlayer } from '../entities/player';
import type { Player } from '../entities/types';
import type { Ctx } from './drawUtils';
import { drawPlayerSprite } from './sprites';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mock.frame }));
const assets = { player: { complete: true, naturalWidth: 1360 } } as unknown as Assets;

const POSES = [
  { id: 'swimGlide', state: { swimming: true, animT: 0 } },
  { id: 'swimKick', state: { swimming: true, animT: 0.4 } },
  { id: 'swimStroke', state: { swimming: true, strokeT: 0.2 } },
  { id: 'hanging', state: { swinging: 0, vx: 0 } },
  { id: 'swinging', state: { swinging: 0, vx: 100 } },
  { id: 'throwing', state: { ball: true, throwT: 0.2 } },
] as const satisfies readonly { id: keyof typeof GAMEPLAY_SPRITES; state: Partial<Player> }[];
const CASES = POSES.flatMap(pose => ([1, -1] as const).map(face => ({ ...pose, face })));

function context() {
  const methods = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
  return { c: methods as unknown as Ctx, methods };
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.frame.mockImplementation((_file, frame, scale) => ({
    width: Math.ceil(frame[2] * scale), height: Math.ceil(frame[3] * scale),
  }) as HTMLCanvasElement);
});

describe('Tamaño de las poses de nado, cuerda y pelota', () => {
  it.each(CASES)('$id mantiene tamaño, proporción y ancla mirando hacia $face', ({ id, state, face }) => {
    const p = Object.assign(createPlayer(4), state, { face });
    const before = structuredClone(p);
    const { c, methods } = context();
    drawPlayerSprite(c, assets, p, 40, false, 0, 100);
    expect(methods.drawImage).toHaveBeenCalledTimes(1);
    const [image, x, y, width, height] = methods.drawImage.mock.calls[0];
    const w = width ?? image.width, h = height ?? image.height;
    const sprite = GAMEPLAY_SPRITES[id];
    expect(w * PLAYER_POSE_HEAD_WIDTHS[id] / sprite.frame[2]).toBeCloseTo(PLAYER_HEAD_WIDTH);
    expect(w / h).toBeCloseTo(sprite.frame[2] / sprite.frame[3]);
    expect(x + w * sprite.anchor[0]).toBeCloseTo(0);
    expect(y + h * sprite.anchor[1]).toBeCloseTo(id === 'throwing' ? 0 : -p.h / 2);
    expect(mock.frame.mock.calls.at(-1)?.[1]).toEqual(sprite.frame);
    expect(methods.translate).toHaveBeenCalledWith(p.x + p.w / 2 - 40, p.y + p.h);
    if (face < 0) expect(methods.scale).toHaveBeenCalledWith(-1, 1);
    expect(p).toEqual(before);
  });

  it.each(POSES)('$id conserva el tamaño con la hoja de respaldo si falta el atlas', ({ state }) => {
    mock.frame.mockReturnValue(null);
    const p = Object.assign(createPlayer(4), state);
    const before = structuredClone(p);
    const { c, methods } = context();
    drawPlayerSprite(c, assets, p, 0, false, 0, 100);
    expect(methods.drawImage).toHaveBeenCalledTimes(1);
    const call = methods.drawImage.mock.calls[0];
    expect(call[0]).toBe(assets.player);
    const frame = p.throwT > 0 ? PLAYER_SPRITES.jump[3] : PLAYER_SPRITES[p.anim][p.frame];
    expect(call[8]).toBeCloseTo(frame.h * frame.scale);
    expect(p).toEqual(before);
  });

  it('conserva el tamaño al lanzar fuego y al morir durante el nado', () => {
    const p = createPlayer(4);
    p.fire = true; p.throwT = 0.2;
    const { c, methods } = context();
    drawPlayerSprite(c, assets, p, 0, false, 0, 100);
    const throwing = PLAYER_SPRITES.jump[3];
    expect(methods.drawImage.mock.calls.at(-1)?.[8]).toBeCloseTo(throwing.h * throwing.scale);
    p.swimming = true;
    drawPlayerSprite(c, assets, p, 0, true, 0.2, 100);
    const falling = PLAYER_SPRITES.fall[0];
    expect(methods.drawImage.mock.calls.at(-1)?.[8]).toBeCloseTo(falling.h * falling.scale);
    expect(mock.frame).not.toHaveBeenCalled();
  });

  it('mantiene el tamaño de la cabeza entre avance, patada y brazada', () => {
    const heads = [];
    const { c, methods } = context();
    for (const { state, id } of POSES.slice(0, 3)) {
      drawPlayerSprite(c, assets, Object.assign(createPlayer(4), state), 0, false, 0, 100);
      const [, , , width, height] = methods.drawImage.mock.calls.at(-1)!;
      heads.push(width * PLAYER_POSE_HEAD_WIDTHS[id] / GAMEPLAY_SPRITES[id].frame[2]);
      if (id !== 'swimStroke') expect(height).toBeLessThan(75);
    }
    expect(Math.max(...heads) - Math.min(...heads)).toBeLessThan(1);
  });
});
