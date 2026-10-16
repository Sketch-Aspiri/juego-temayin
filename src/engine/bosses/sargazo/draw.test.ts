import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SARGAZO_ACTION_FILE, SARGAZO_SCALE } from '../../../data/sargazoArt';
import type { Ctx } from '../../render/drawUtils';
import { drawSargazo } from './draw';
import { Sargazo, type SargazoState } from './index';
import type { SeaAttack } from './choose';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('../../render/artCache').bakedFrame>() }));
vi.mock('../../render/artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 60, height: 40 } as HTMLCanvasElement;
const STATES: readonly SargazoState[] = ['intro', 'idle', 'warn', 'attack', 'exposed', 'hurt', 'shed', 'dead'];
const ATTACKS: readonly SeaAttack[] = ['salvo', 'tide', 'surge', 'whirlpool', 'rain', 'net'];

function context() {
  const methods = { canvas: { width: 960 }, drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    scale: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    fillRect: vi.fn(), strokeRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), strokeText: vi.fn(),
    fillText: vi.fn(), setLineDash: vi.fn(), globalAlpha: 1 };
  return { c: methods as unknown as Ctx, methods };
}

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Lectura visual submarina', () => {
  it.each(STATES)('devuelve pose de %s sin mutar el estado ni variar su escala', state => {
    const b = new Sargazo({ id: 'sargazo', x: 90, arena: [78, 100] }); b.st = state;
    const before = JSON.stringify(b), { c } = context();
    drawSargazo(c, b, 77 * 40);
    expect(mock.frame.mock.calls.at(-1)?.[0]).toBe(SARGAZO_ACTION_FILE);
    expect(mock.frame.mock.calls.at(-1)?.[2]).toBe(SARGAZO_SCALE);
    expect(JSON.stringify(b)).toBe(before);
  });

  it.each(ATTACKS)('devuelve aviso y respaldo sin imágenes para %s', attack => {
    const b = new Sargazo({ id: 'sargazo', x: 90, arena: [78, 100] });
    b.st = 'warn'; b.attack = attack; b.targetY = 290; b.targetX = 3400;
    const { c, methods } = context(); mock.frame.mockReturnValue(null);
    drawSargazo(c, b, 3080);
    expect(methods.fillText).toHaveBeenCalled(); expect(methods.ellipse).toHaveBeenCalled();
    expect(methods.setLineDash).toHaveBeenLastCalledWith([]);
  });

  it('devuelve instrucciones legibles y centradas al encuadrar la arena en vertical', () => {
    const b = new Sargazo({ id: 'sargazo', x: 78, arena: [78, 100] }); b.st = 'exposed';
    const { c, methods } = context(); methods.canvas.width = 480;
    drawSargazo(c, b, 3080);
    expect(c.font).toContain('40px');
    expect(methods.fillText).toHaveBeenCalledWith('¡NÚCLEO: TÓCALO!', (b.left + b.right) / 2 - 3080, 180);
  });
});
