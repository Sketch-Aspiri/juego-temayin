import { describe, expect, it, vi } from 'vitest';
import { PLAYER_GROUND_ART_HEIGHT, PLAYER_SPRITES } from '../../data/playerSprites';
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
  it.each(['idle', 'run', 'win'] as const)('mantiene la altura visible en todos los cuadros de %s', anim => {
    for (const frame of PLAYER_SPRITES[anim]) {
      expect(frame.h * frame.scale).toBeCloseTo(PLAYER_GROUND_ART_HEIGHT);
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

  it('cambia de reposo a carrera sin mover los pies ni modificar al jugador', () => {
    const p = createPlayer(4);
    const assets = { player: { complete: true, naturalWidth: 1360 } } as unknown as Assets;
    const { c, methods } = context();
    for (const anim of ['idle', 'run'] as const) {
      p.anim = anim;
      for (let i = 0; i < PLAYER_SPRITES[anim].length; i++) {
        p.frame = i;
        const before = structuredClone(p);
        drawPlayerSprite(c, assets, p, 40, false, 0, 100);
        const call = methods.drawImage.mock.calls.at(-1)!;
        expect(call[6] + call[8]).toBeCloseTo(0);
        expect(call[8]).toBeCloseTo(PLAYER_GROUND_ART_HEIGHT);
        expect(p).toEqual(before);
      }
    }
  });

  it('conserva la proporción y la flexión natural de las poses aéreas', () => {
    for (const frame of [...PLAYER_SPRITES.jump, ...PLAYER_SPRITES.fall]) expect(frame.scale).toBe(0.6);
    expect(PLAYER_SPRITES.jump[6].h).toBeLessThan(PLAYER_SPRITES.jump[3].h);
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
