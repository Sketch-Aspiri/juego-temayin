import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NEW_GAMEPLAY_SPRITES } from '../../../data/newGameplaySprites';
import type { Ctx } from '../../render/drawUtils';
import { waveRect } from './attacks';
import { drawKaiman } from './draw';
import { drawMud, drawPropagules, drawStorm } from './drawHazards';
import { mudRect, propaguleRect, type MudBall, type Propagule } from './hazards';
import { Kaiman } from './index';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('../../render/artCache').bakedFrame>() }));
vi.mock('../../render/artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 60, height: 40 } as HTMLCanvasElement;

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

function boss() {
  const b = new Kaiman({ id: 'kaiman', x: 74, arena: [62, 83] });
  b.clock = 8.2; b.t = 0.2;
  return b;
}

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Lectura visual del combate de Kaimán', () => {
  it.each(['spitPrep', 'spit', 'slamPrep', 'slam'] as const)('distingue %s sin modificar el jefe', st => {
    const b = boss(); b.st = st;
    const before = JSON.stringify(b);
    const { c } = context();
    drawKaiman(c, b, 2440);
    const pose = st.startsWith('spit') ? NEW_GAMEPLAY_SPRITES.kaimanSpit : NEW_GAMEPLAY_SPRITES.kaimanSlam;
    expect(mock.frame.mock.calls.at(-1)?.[0]).toBe(pose.file);
    expect(JSON.stringify(b)).toBe(before);
  });

  it('dibuja lodo y propágulos dentro de sus rectángulos de contacto', () => {
    const mud: MudBall = { x: 200, y: 250, vx: -120, vy: 50, t: 0.2 };
    const seed: Propagule = { x: 260, y: 320, floor: 430, wait: 0, stuck: null };
    const before = structuredClone({ mud, seed });
    const { c, methods } = context();
    drawMud(c, [mud], 40);
    const mr = mudRect(mud);
    expect(methods.translate).toHaveBeenCalledWith(mud.x - 40, mud.y);
    expect(methods.drawImage).toHaveBeenCalledWith(image, -mr.w / 2, -mr.h / 2, mr.w, mr.h);
    drawPropagules(c, [seed], 40, 5);
    const sr = propaguleRect(seed);
    expect(methods.drawImage).toHaveBeenCalledWith(image, sr.x - 40, sr.y, sr.w, sr.h);
    expect({ mud, seed }).toEqual(before);
  });

  it('mantiene un aviso de caída sobre los troncos y apunta a la superficie real', () => {
    const seed: Propagule = { x: 300, y: -44, floor: 430, wait: 0.4, stuck: null };
    const before = structuredClone(seed);
    const { c, methods } = context();
    drawPropagules(c, [seed], 40, 5);
    expect(methods.setLineDash).toHaveBeenCalledWith([4, 8]);
    expect(methods.lineTo).toHaveBeenCalledWith(260, seed.floor - 8);
    expect(methods.ellipse.mock.calls[0]?.slice(0, 2)).toEqual([260, seed.floor]);
    expect(methods.drawImage.mock.calls[0]?.[2]).toBeLessThan(9 * 40);
    expect(seed).toEqual(before);
  });

  it('la ola pintada coincide con el ancho y alto de su colisión', () => {
    const b = boss(); b.st = 'walk';
    const wave = { x: 2700, dir: -1 as const, speed: 320, t: 0.2 };
    b.waves = [wave];
    const { c, methods } = context();
    drawKaiman(c, b, 2440);
    const rect = waveRect(wave);
    expect(methods.drawImage.mock.calls[0]).toEqual([image, -rect.w / 2, rect.y, rect.w, rect.h]);
  });

  it('sitúa el aviso de pisotón por encima del sprite expuesto', () => {
    const b = boss(); b.st = 'exposed';
    const { c, methods } = context();
    drawKaiman(c, b, 2440);
    const cue = methods.fillText.mock.calls.find(call => call[0] === '¡PISA EL LOMO!');
    expect(cue).toBeDefined();
    expect(cue?.[2]).toBeLessThan(b.y + b.h - 278 * 0.38);
  });

  it('enmascara la pose vecina sin desplazar el sprite de reposo', () => {
    const b = boss(); b.st = 'walk';
    const { c, methods } = context();
    drawKaiman(c, b, 2440);
    expect(methods.clip).toHaveBeenCalledWith('evenodd');
    expect(methods.rect).toHaveBeenCalledWith((522 - (15 + 517 / 2)) * 0.38, (243 - 479) * 0.38, 3.8, 10.64);
    expect(methods.translate).toHaveBeenCalledWith(b.x + b.w / 2 - 2440, b.y + b.h);
  });

  it('conserva los respaldos procedurales cuando faltan las imágenes', () => {
    mock.frame.mockReturnValue(null);
    const { c, methods } = context();
    const b = boss(); b.st = 'spit';
    drawKaiman(c, b, 2440);
    drawMud(c, [{ x: 100, y: 200, vx: 0, vy: 10, t: 0 }], 0);
    drawPropagules(c, [{ x: 300, y: 320, floor: 430, wait: 0, stuck: null }], 0, 0);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(methods.fill).toHaveBeenCalled();
  });

  it('no añade lluvia fuera del frenesí ni con intensidad nula', () => {
    const { c, methods } = context();
    const b = boss(); b.st = 'walk';
    drawKaiman(c, b, 2440);
    drawStorm(c, b.clock, 0);
    expect(methods.fillRect).not.toHaveBeenCalled();
    b.phase = 3;
    drawKaiman(c, b, 2440);
    expect(methods.fillRect).toHaveBeenCalledWith(0, 0, 960, 560);
  });
});
