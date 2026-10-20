import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { STEP, T } from '../constants';
import { hudKey } from '../hud';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { World } from '../World';
import { collectDiscoveries } from './discoveries';
import { getLevel } from '../../data/worlds';
import { NOTEBOOK_ENTRIES } from '../../data/explorerNotebook';

const def: LevelDef = { id: 'prueba', name: 'Observaciones', theme: 'jungle', width: 80,
  ops: [['coins', 8, 10, 2], ['discovery', 12, 11, 'prueba-uno'], ['discovery', 12, 11, 'prueba-dos'], ['flag', 65]] };
const make = (level = def, discoveries: readonly string[] = []) => new World({ def: level, input: new Input(),
  audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 }, discoveries });

describe('Marcas de observación', () => {
  it('recoge por contacto y publica todas las páginas entre dos HUD sin cambiar estrellas ni terreno', () => {
    const w = make();
    w.update(STEP);
    expect(w.discoveries).toEqual([]);
    const before = w.hudState(1);
    const terrain = structuredClone(w.grid);
    w.player.x = 12 * T;
    collectDiscoveries(w);
    expect(w.discoveries).toEqual(['prueba-uno', 'prueba-dos']);
    expect(hudKey(w.hudState(1))).not.toBe(hudKey(before));
    expect(before.discoveries).toEqual([]);
    collectDiscoveries(w);
    expect(w.discoveries).toHaveLength(2);
    expect(w.grid).toEqual(terrain);
    expect(w.level.totalCoins).toBe(2);
    expect(w.session).toEqual({ score: 0, coins: 0, lives: 3 });
  });

  it('no recoge al morir y acepta solo páginas presentes en el nivel al reaparecer', () => {
    const w = make(); w.player.x = 12 * T; w.die(); collectDiscoveries(w);
    expect(w.discoveries).toEqual([]);
    const known = make(def, ['prueba-uno', 'otro-nivel']);
    expect(known.discoveries).toEqual(['prueba-uno']);
    known.player.x = 12 * T; collectDiscoveries(known);
    expect(known.discoveries).toEqual(['prueba-uno', 'prueba-dos']);
  });

  it.each(NOTEBOOK_ENTRIES)('$id se alcanza por aproximación horizontal o a nado sin pisar estromatolitos', entry => {
    const w = make(getLevel(entry.levelId)!);
    const mark = w.level.discoveries.find(item => item.id === entry.id)!;
    const p = w.player;
    p.x = mark.x - T; p.y = mark.y + mark.h - p.h;
    p.onGround = entry.id !== 'bacalar-estromatolitos'; p.inv = 10;
    w.camX = Math.max(0, p.x - 400);
    w.input.press('right');
    for (let step = 0; step < 90 && !w.discoveries.includes(entry.id); step++) w.update(STEP);
    expect(w.discoveries, `${entry.id}: ${p.x / T}, ${p.y / T}`).toContain(entry.id);
    expect(w.phase).toBe('play');
    expect(w.stromatolites.some(segment => segment.damaged)).toBe(false);
  });
});
