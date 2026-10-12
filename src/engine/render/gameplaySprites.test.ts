import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_LEVELS } from '../../data/worlds';
import { GAMEPLAY_SPRITES } from '../../data/gameplaySprites';
import { NEW_GAMEPLAY_SPRITES } from '../../data/newGameplaySprites';
import { AudioEngine } from '../audio';
import { Input } from '../input';
import { World } from '../World';
import { createPlatform } from '../entities/platforms';
import type { Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';
import { drawCoastalPlatform } from './coastalPlatforms';
import { drawPlayerMechanics } from './playerMechanics';
import { drawFireballArt, drawQuillArt } from './projectileSprites';
import { drawCannonTile, drawFragileTile } from './levelSprites';
import { drawSlowZones } from './slowZones';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 60, height: 40 } as HTMLCanvasElement;

function context() {
  const methods = {
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillRect: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), quadraticCurveTo: vi.fn(),
  };
  return { c: methods as unknown as Ctx, methods };
}

function world() {
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def: ALL_LEVELS[0], audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
}

beforeEach(() => { vi.clearAllMocks(); mock.frame.mockReturnValue(image); });

describe('Integración de sprites con la simulación', () => {
  it('ancla el agujero del aro en su centro físico', () => {
    const { c, methods } = context();
    drawGameplaySprite(c, 'hoop', 100, 200, 53);
    const sprite = GAMEPLAY_SPRITES.hoop;
    expect(methods.drawImage).toHaveBeenCalledWith(image, 100 - 53 * sprite.anchor[0],
      200 - sprite.frame[3] / 5 * sprite.anchor[1], 53, sprite.frame[3] / 5);
  });

  it.each(['boat', 'turtle'] as const)('dibuja %s sin mover la superficie ni modificar su estado', appearance => {
    const platform = createPlatform({ kind: 'mover', appearance, x: 4, y: 8, length: 3, dx: 2, dy: 1, period: 4 });
    platform.submerged = true;
    const before = structuredClone(platform);
    const { c, methods } = context();
    drawCoastalPlatform(c, platform, 40);
    expect(methods.translate).toHaveBeenCalledWith(platform.x - 40, platform.y + 55);
    expect(methods.drawImage).toHaveBeenCalledTimes(1);
    expect(platform).toEqual(before);
  });

  it('elige agarre, balanceo y lanzamiento, manteniendo intacto al jugador', () => {
    const p = world().player;
    const { c } = context();
    p.swinging = 0; p.vx = 0;
    const before = structuredClone(p);
    expect(drawPlayerMechanics(c, p)).toBe(true);
    expect(mock.frame.mock.calls.at(-1)?.[1]).toEqual(GAMEPLAY_SPRITES.hanging.frame);
    expect(p).toEqual(before);
    p.vx = 100;
    drawPlayerMechanics(c, p);
    expect(mock.frame.mock.calls.at(-1)?.[1]).toEqual(GAMEPLAY_SPRITES.swinging.frame);
    p.swinging = null; p.ball = true; p.throwT = 0.1;
    drawPlayerMechanics(c, p);
    expect(mock.frame.mock.calls.at(-1)?.[1]).toEqual(GAMEPLAY_SPRITES.throwing.frame);
  });

  it('anima el fuego y orienta las púas por velocidad sin mutar los proyectiles', () => {
    const { c, methods } = context();
    const fire = { x: 80, y: 90, vx: -200, vy: 0, t: 0.2, gone: false };
    const quill = { x: 70, y: 60, vx: 0, vy: 200, gone: false };
    const before = structuredClone({ fire, quill });
    expect(drawFireballArt(c, fire, 20)).toBe(true);
    expect(methods.rotate).toHaveBeenCalledWith(Math.PI);
    expect(drawQuillArt(c, quill, 20)).toBe(true);
    expect(methods.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect({ fire, quill }).toEqual(before);
    expect(mock.frame.mock.calls.at(-1)?.[0]).toBe(NEW_GAMEPLAY_SPRITES.quill.file);
  });

  it('dibuja una sola pieza por cañón y conserva los dos bloques sólidos', () => {
    const grid = [['K', '>', ' ', '<', 'K']];
    const before = structuredClone(grid);
    const { c, methods } = context();
    for (let tx = 0; tx < 5; tx++) drawCannonTile(c, grid, tx, 0, tx * 40, 0);
    expect(methods.drawImage).toHaveBeenCalledTimes(2);
    expect(methods.scale).toHaveBeenCalledWith(-1, 1);
    expect(grid).toEqual(before);
  });

  it('repite la resina por columna visible sin cambiar la franja de colisión', () => {
    const zones = [{ kind: 'resin' as const, x0: 2, x1: 4, y: 11 }];
    const before = structuredClone(zones);
    const { c, methods } = context();
    drawSlowZones(c, zones, 0, 1000);
    expect(methods.drawImage).toHaveBeenCalledTimes(3);
    expect(zones).toEqual(before);
  });

  it('mantiene visible la boca del cañón cuando su primera mitad sale de cámara', () => {
    const { c, methods } = context();
    expect(drawCannonTile(c, [['K', '>']], 1, 0, 20, 300, 1)).toBe(true);
    expect(methods.translate).toHaveBeenCalledWith(-20, 300);
    expect(methods.drawImage).toHaveBeenCalledTimes(1);
  });

  it('dibuja tramos contiguos de una losa frágil en sus dos bloques', () => {
    const { c, methods } = context();
    drawFragileTile(c, 100, 300, 0, 2);
    drawFragileTile(c, 140, 300, 1, 2);
    expect(methods.drawImage.mock.calls).toEqual([
      [image, 0, 0, 30, 40, 100, 300, 40, 40],
      [image, 30, 0, 30, 40, 140, 300, 40, 40],
    ]);
  });

  it('mantiene los respaldos cuando no hay atlas y funciona sin DOM', () => {
    mock.frame.mockReturnValue(null);
    const { c, methods } = context();
    expect(drawGameplaySprite(c, 'hoop', 0, 0, 52)).toBe(false);
    const platform = createPlatform({ kind: 'mover', appearance: 'turtle', x: 4, y: 8, length: 3, dx: 0, dy: 0, period: 4 });
    drawCoastalPlatform(c, platform, 0);
    expect(methods.drawImage).not.toHaveBeenCalled();
    expect(methods.ellipse).toHaveBeenCalled();
  });
});
