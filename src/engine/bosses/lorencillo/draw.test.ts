import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LORENCILLO_POSES, LORENCILLO_STATE_POSE } from '../../../data/lorencilloArt';
import type { Ctx } from '../../render/drawUtils';
import { drawLorencillo } from './draw';
import { type LorenState, Lorencillo } from './index';
import { fireSalvo } from './hazards';
import { makeRng } from '../../rng';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('../../render/artCache').bakedFrame>() }));
vi.mock('../../render/artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 60, height: 40 } as HTMLCanvasElement;
const CAM = 1200;

function context() {
  const methods = {
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
    strokeRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), quadraticCurveTo: vi.fn(),
    setLineDash: vi.fn(), createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })), globalAlpha: 1,
  };
  return { c: methods as unknown as Ctx, methods };
}

function boss(st: LorenState): Lorencillo {
  const b = new Lorencillo({ id: 'lorencillo', x: 44, arena: [30, 50] });
  b.st = st; b.clock = 2.3; b.t = 0.2;
  return b;
}

const STATES = Object.keys(LORENCILLO_STATE_POSE) as LorenState[];

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Dibujo de Lorencillo', () => {
  it.each(STATES.filter((s) => s !== 'gone'))('en %s usa su pose y no modifica al jefe', (st) => {
    // Organizar
    const b = boss(st);
    const before = JSON.stringify(b);
    const { c, methods } = context();
    // Actuar
    drawLorencillo(c, b, CAM);
    // Comprobar
    const pose = LORENCILLO_POSES[LORENCILLO_STATE_POSE[st]];
    expect(mock.frame.mock.calls.at(-1)?.slice(0, 3)).toEqual([pose.file, pose.frame, pose.scale]);
    expect(methods.drawImage).toHaveBeenCalled();
    expect(JSON.stringify(b)).toBe(before);
  });

  it('sin atlas dibuja un respaldo procedural legible', () => {
    mock.frame.mockReturnValue(null);
    for (const st of STATES.filter((s) => s !== 'gone')) {
      const { c, methods } = context();
      expect(() => drawLorencillo(c, boss(st), CAM), st).not.toThrow();
      expect(methods.drawImage).not.toHaveBeenCalled();
      expect(methods.fillRect.mock.calls.length + methods.fill.mock.calls.length, st).toBeGreaterThan(0);
    }
  });

  it('no dibuja nada cuando ya se fue', () => {
    const { c, methods } = context();
    drawLorencillo(c, boss('gone'), CAM);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(methods.fillRect).not.toHaveBeenCalled();
  });

  it('las marcas de cañonazo se dibujan sin mutar las balas', () => {
    const b = boss('cannon');
    fireSalvo(b.shells, b.x, 1300, 1200, 2040, 2, makeRng(2));
    const before = JSON.stringify(b.shells);
    const { c, methods } = context();
    drawLorencillo(c, b, CAM);
    expect(methods.ellipse.mock.calls.length + methods.arc.mock.calls.length).toBeGreaterThan(0);
    expect(JSON.stringify(b.shells)).toBe(before);
  });
});
