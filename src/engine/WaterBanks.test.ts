import { describe, expect, it } from 'vitest';
import { getLevel } from '../data/worlds';
import { AudioEngine } from './audio';
import { closeArena, openExit } from './bosses/arena';
import { floodArena } from './bosses/kaiman/flood';
import { Input } from './input';
import { waterAt } from './level/zones';
import { ROWS, STEP, T } from './constants';
import { updatePlayer } from './entities/player';
import { World } from './World';

function make(id: string, fromCheckpoint = false): World {
  const def = getLevel(id)!;
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def, fromCheckpoint, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
}

function expectContained(w: World): void {
  for (const z of w.level.water) {
    for (const x of [z.x0 - 1, z.x1 + 1]) {
      for (let y = Math.floor(z.surface); y < ROWS; y++) {
        const continues = waterAt(w.level.water, (x + 0.5) * T, Math.max(y * T, z.surface * T) + 1);
        expect(w.solid(x, y) || continues !== null, `agua abierta en ${x},${y}`).toBe(true);
      }
    }
  }
}

describe('Orillas y apertura de arenas', () => {
  it.each(['2-7', '5-6'])('%s abre el paso conservando la orilla debajo de la salida', id => {
    const w = make(id), arena = w.def.boss!.arena;
    closeArena(w, arena[0], arena[1]);
    if (id === '2-7') w.level.water = floodArena(w.level.water, arena[0], arena[1], 10.75);
    openExit(w, arena[1]);
    expect(w.solid(arena[1] + 1, 0)).toBe(false);
    expect(w.solid(arena[1] + 1, 11)).toBe(true);
    expectContained(w);
  });

  it.each(['4-2', '4-3', '5-2', '5-4', '5-6'])('%s conserva un checkpoint seco y sin bloques sobre el jugador', id => {
    const w = make(id, true), p = w.player;
    const cx = p.x + p.w / 2;
    expect(waterAt(w.level.water, cx, p.y + p.h / 2)).toBeNull();
    for (const y of [p.y, p.y + p.h - 1]) {
      expect(w.solid(Math.floor(cx / T), Math.floor(y / T))).toBe(false);
    }
    expect(w.solid(Math.floor(cx / T), Math.floor((p.y + p.h) / T))).toBe(true);
  });

  it('Playa del Carmen conserva un salto accesible desde el muelle hasta el tubo', () => {
    const w = make('5-3');
    expect(w.solid(54, 10)).toBe(true);
    expect(w.solid(55, 8)).toBe(true);
    const coati = w.enemies.find(e => e.id === 'coati' && Math.floor(e.x / T) === 52)!;
    expect(w.solid(52, Math.floor(coati.y / T))).toBe(false);
    expect(w.solid(52, 10)).toBe(true);
  });

  it.each([['1-5', 87.5, 92], ['4-2', 106.5, 111]] as const)(
    '%s permite subir la orilla y entrar en el túnel sin golpear un techo bajo', (id, start, end) => {
      const w = make(id), p = w.player;
      p.x = start * T; p.y = 12 * T - p.h; p.onGround = true;
      w.input.press('right'); w.input.press('run');
      for (let i = 0; i < 360 && p.x < end * T; i++) {
        if (p.onGround && !w.input.held.jump) w.input.press('jump');
        if (p.vy > 0) w.input.release('jump');
        updatePlayer(w, STEP);
      }
      expect(p.x).toBeGreaterThanOrEqual(end * T);
    });
});
