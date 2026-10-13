import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../../data/worlds';
import { AudioEngine } from '../audio';
import { Input } from '../input';
import { T, VH, VW } from '../constants';
import { World } from '../World';
import { PORTRAIT_VIEW_WIDTH, renderViewport } from './viewport';

function world(levelId = '1-1') {
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def: ALL_LEVELS.find(level => level.id === levelId)!, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
}

describe('Encuadre vertical sin cambios a la simulación', () => {
  it('acerca al jugador y conserva un margen para ver los obstáculos', () => {
    const w = world(); w.camX = 100; w.player.x = 500;
    const before = structuredClone({ player: w.player, camX: w.camX, grid: w.grid, session: w.session });
    const view = renderViewport(w, PORTRAIT_VIEW_WIDTH);
    expect(w.player.x + w.player.w / 2 - w.camX - view.offsetX).toBe(PORTRAIT_VIEW_WIDTH * .4);
    expect(view.scale).toBe(1);
    expect({ player: w.player, camX: w.camX, grid: w.grid, session: w.session }).toEqual(before);
  });

  it('contiene el encuadre en los extremos de la ventana del mundo', () => {
    const w = world();
    w.player.x = 0;
    expect(renderViewport(w, PORTRAIT_VIEW_WIDTH).offsetX).toBe(0);
    w.player.x = VW - w.player.w;
    expect(renderViewport(w, PORTRAIT_VIEW_WIDTH).offsetX).toBe(VW - PORTRAIT_VIEW_WIDTH);
  });

  it('mantiene la vista original al girar a horizontal', () => {
    const w = world(); w.player.x = 500;
    renderViewport(w, PORTRAIT_VIEW_WIDTH);
    expect(renderViewport(w, VW)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
    expect(w.player.x).toBe(500);
  });

  it.each(ALL_LEVELS.filter(level => level.boss))('$id muestra la arena completa al despertar su jefe', level => {
    const w = world(level.id);
    w.player.x = (level.boss!.arena[0] + 2) * T;
    w.update(1 / 120);
    expect(w.boss?.lockCamera).toBe(true);
    const view = renderViewport(w, PORTRAIT_VIEW_WIDTH);
    expect(view.offsetX).toBe(0);
    expect(view.scale * VW).toBe(PORTRAIT_VIEW_WIDTH);
    expect(view.offsetY).toBe((VH - VH * view.scale) / 2);
  });

  it.each(['flag', 'done'] as const)('muestra la salida completa durante %s', phase => {
    const w = world(); w.phase = phase;
    expect(renderViewport(w, PORTRAIT_VIEW_WIDTH).scale).toBe(PORTRAIT_VIEW_WIDTH / VW);
  });
});
