import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GROUND, T } from '../../constants';
import type { Ctx } from '../../render/drawUtils';
import { CHIVO_POSES } from '../../../data/huayChivoArt';
import { drawHuayChivo } from './draw';
import { callWisps, stompWaves } from './hazards';
import { drawBlinkWarning } from './drawHazards';
import { type ChivoState, HuayChivo } from './index';

const mock = vi.hoisted(() => ({
  frame: vi.fn<typeof import('../../render/artCache').bakedFrame>(),
  star: vi.fn(),
}));
vi.mock('../../render/artCache', () => ({ bakedFrame: mock.frame }));
vi.mock('../../render/drawUtils', async (original) => ({
  ...(await original<typeof import('../../render/drawUtils')>()),
  star: mock.star,
}));
const image = { width: 60, height: 40 } as HTMLCanvasElement;
const CAM = 2440;
const FLOOR = GROUND * T;

function context() {
  const methods = {
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), quadraticCurveTo: vi.fn(), rect: vi.fn(), clip: vi.fn(),
    strokeText: vi.fn(), fillText: vi.fn(), setLineDash: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })), globalAlpha: 1,
  };
  return { c: methods as unknown as Ctx, methods };
}

function boss(st: ChivoState): HuayChivo {
  const b = new HuayChivo({ id: 'huayChivo', x: 75, arena: [63, 85] });
  b.st = st; b.clock = 4.3; b.t = 0.2;
  return b;
}

/** Cada acción conserva una postura propia, sin igualar artificialmente su altura. */
const EXPECTED_FRAME: readonly [ChivoState, keyof typeof CHIVO_POSES][] = [
  ['sleep', 'rest'], ['intro', 'rest'], ['idle', 'rest'], ['land', 'land'], ['nightfall', 'nightfall'],
  ['paw', 'paw'], ['crouch', 'crouch'], ['call', 'call'], ['turn', 'paw'],
  ['charge', 'run'], ['leap', 'leap'], ['rear', 'rear'], ['horn', 'horn'], ['recover', 'rest'],
  ['fade', 'blink'], ['appear', 'blink'], ['dazed', 'dazed'], ['hurt', 'hurt'], ['dead', 'dead'],
];

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Dibujo del Huay Chivo', () => {
  it.each(EXPECTED_FRAME)('en %s usa la pose %s sin modificar el jefe', (st, index) => {
    // Organizar
    const b = boss(st);
    const before = JSON.stringify(b);
    const { c } = context();
    // Actuar
    drawHuayChivo(c, b, CAM);
    // Comprobar
    const f = CHIVO_POSES[index];
    expect(mock.frame.mock.calls.at(-1)?.slice(0, 3)).toEqual([f.file, f.frame, f.scale]);
    expect(JSON.stringify(b)).toBe(before);
  });

  it.each([-1, 1] as const)('devuelve el anclaje de pezuñas correcto mirando hacia %i', face => {
    for (const [st, pose] of EXPECTED_FRAME) {
      const b = boss(st); b.face = face;
      const { c, methods } = context();
      drawHuayChivo(c, b, CAM);
      const art = CHIVO_POSES[pose];
      expect(methods.translate).toHaveBeenCalledWith(b.x + b.w / 2 - CAM, b.y + b.h);
      expect(methods.drawImage).toHaveBeenLastCalledWith(image,
        Math.round((art.frame[0] - art.anchor[0]) * art.scale),
        Math.round((art.frame[1] - art.anchor[1]) * art.scale));
      expect(methods.scale.mock.calls).toEqual(face === -1 ? [[-1, 1]] : []);
    }
  });

  it('oculto no dibuja el cuerpo y avisa en el arco de destino', () => {
    const b = boss('hidden');
    b.blinkX = 3100;
    const { c, methods } = context();
    drawHuayChivo(c, b, CAM);
    expect(mock.frame.mock.calls.every(call => call[0].includes('efectos'))).toBe(true);
    expect(methods.translate).toHaveBeenCalledWith(b.blinkX + b.w / 2 - CAM, FLOOR);
  });

  it('devuelve humo sin ojos cuando el destino es un señuelo', () => {
    const { c, methods } = context();
    drawBlinkWarning(c, 3000, 65, 0.2, CAM, false);
    expect(methods.drawImage).toHaveBeenCalled();
    expect(methods.arc).not.toHaveBeenCalled();
    drawBlinkWarning(c, 3100, 65, 0.2, CAM, true);
    expect(methods.arc).toHaveBeenCalledTimes(4);
  });

  it('marca con una sombra el punto donde caerá el pisotón', () => {
    const b = boss('leap');
    b.leapX = 2900; b.y = FLOOR - b.h - 100;
    const { c, methods } = context();
    drawHuayChivo(c, b, CAM);
    const shadow = methods.ellipse.mock.calls.find((call) => call[0] === b.leapX + b.w / 2 - CAM);
    expect(shadow?.[1]).toBe(FLOOR);
  });

  it('solo muestra estrellas aturdido, dibujadas con trazo', () => {
    const { c, methods } = context();
    for (const [st] of EXPECTED_FRAME) if (st !== 'dazed') drawHuayChivo(c, boss(st), CAM);
    expect(mock.star).not.toHaveBeenCalled();
    drawHuayChivo(c, boss('dazed'), CAM);
    expect(mock.star).toHaveBeenCalledTimes(3);
    expect(methods.fillText).not.toHaveBeenCalled();
  });

  it('dibuja fuegos fatuos y ondas sin gradientes por fotograma ni mutarlos', () => {
    const b = boss('idle');
    callWisps(b.wisps, 3000, 380, 2);
    stompWaves(b.waves, 3000, 3);
    const before = JSON.stringify(b);
    const { c, methods } = context();
    drawHuayChivo(c, b, CAM);
    expect(methods.createRadialGradient).not.toHaveBeenCalled();
    expect(JSON.stringify(b)).toBe(before);
  });

  it('conserva un respaldo procedural cuando falta el atlas', () => {
    mock.frame.mockReturnValue(null);
    const b = boss('paw');
    callWisps(b.wisps, 3000, 380, 1);
    const { c, methods } = context();
    drawHuayChivo(c, b, CAM);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(methods.fillRect).toHaveBeenCalled();
    expect(methods.arc).toHaveBeenCalled();
  });
});
