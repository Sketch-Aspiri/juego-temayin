import { describe, expect, it, vi } from 'vitest';
import { PLAYER_SPRITES } from '../../data/playerSprites';
import { PLAYER_HEAD_WIDTH, PLAYER_HEAD_WIDTHS } from '../../data/playerScale';
import { TOH_POSES } from '../../data/tohSprites';
import { SPRITES } from '../../data/intro';
import { PLAYER_FRAMES, createPlayer } from '../entities/player';
import type { Assets } from '../assets';
import type { Ctx } from './drawUtils';
import { drawPlayerSprite } from './sprites';

function context() {
  const methods = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
  return { c: methods as unknown as Ctx, methods };
}

describe('Tamaño y apoyo de Temayin', () => {
  it.each(['idle', 'run', 'jump', 'fall', 'win'] as const)('mantiene la cabeza y el apoyo en todos los cuadros de %s', anim => {
    expect(PLAYER_HEAD_WIDTHS[anim]).toHaveLength(PLAYER_SPRITES[anim].length);
    for (const [index, frame] of PLAYER_SPRITES[anim].entries()) {
      expect(PLAYER_HEAD_WIDTHS[anim][index] * frame.scale).toBeCloseTo(PLAYER_HEAD_WIDTH);
      expect(frame.y + frame.h).toBe(frame.ay);
    }
  });

  it.each(Object.entries(PLAYER_SPRITES))('%s contiene todos los cuadros que usa la simulación', (anim, frames) => {
    expect(frames.length).toBe(PLAYER_FRAMES[anim as keyof typeof PLAYER_FRAMES]);
    for (const frame of frames) {
      expect(frame.x + frame.w).toBeLessThanOrEqual(1360);
      expect(frame.y + frame.h).toBeLessThanOrEqual(800);
    }
  });

  it.each([1, -1] as const)('conserva tamaño, proporción y apoyo al cambiar de animación mirando hacia %s', face => {
    const p = createPlayer(4);
    p.face = face;
    const assets = { player: { complete: true, naturalWidth: 1360 } } as unknown as Assets;
    const { c, methods } = context();
    for (const anim of ['idle', 'run', 'jump', 'fall', 'win'] as const) {
      p.anim = anim;
      for (let i = 0; i < PLAYER_SPRITES[anim].length; i++) {
        p.frame = i;
        const before = structuredClone(p);
        drawPlayerSprite(c, assets, p, 40, false, 0, 100);
        const call = methods.drawImage.mock.calls.at(-1)!;
        expect(call[6] + call[8]).toBeCloseTo(0);
        const frame = PLAYER_SPRITES[anim][i];
        expect(call[7] * PLAYER_HEAD_WIDTHS[anim][i] / frame.w).toBeCloseTo(PLAYER_HEAD_WIDTH);
        expect(call[7] / call[8]).toBeCloseTo(frame.w / frame.h);
        expect(methods.translate).toHaveBeenLastCalledWith(p.x + p.w / 2 - 40, p.y + p.h);
        expect(p).toEqual(before);
      }
    }
  });

  it('permite estirarse al saltar y encogerse al aterrizar sin reducir la cabeza', () => {
    const extended = PLAYER_SPRITES.jump[3], crouched = PLAYER_SPRITES.jump[7];
    expect(extended.h * extended.scale).toBeGreaterThan(90);
    expect(crouched.h * crouched.scale).toBeLessThan(75);
    // La altura uniforme anterior empequeñecía la cabeza al estirar las piernas.
    expect(85 * extended.scale).toBeCloseTo(78 * crouched.scale);
  });
});

describe('Recortes compartidos de Toh', () => {
  it('usa las mismas poses aisladas en la historia y en el checkpoint', () => {
    expect(SPRITES.tohPerch.frame).toEqual(TOH_POSES.perch.frame);
    expect(SPRITES.tohFly.frame).toEqual(TOH_POSES.flyDown.frame);
    expect(SPRITES.tohPerch.isolated).toBe(true);
    expect(SPRITES.tohFly.isolated).toBe(true);
  });

  it('incluye la cola completa y mantiene las patas dentro de todos los recortes', () => {
    expect(TOH_POSES.perchTail.frame[1] + TOH_POSES.perchTail.frame[3]).toBe(440);
    for (const pose of Object.values(TOH_POSES)) {
      const [x, y, w, h] = pose.frame;
      expect(pose.footX).toBeGreaterThanOrEqual(x);
      expect(pose.footY).toBeGreaterThanOrEqual(y);
      expect(pose.footX).toBeLessThan(x + w);
      expect(pose.footY).toBeLessThan(y + h);
    }
  });
});
