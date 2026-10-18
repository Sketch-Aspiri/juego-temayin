import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, BONUS_LEVELS, getLevel, nextLevelId, WORLDS } from './worlds';
import { buildLevel } from '../engine/level/build';
import { T, ROWS } from '../engine/constants';
import { isSolidTile } from '../engine/tiles';

describe('Boletos y desvíos secretos', () => {
  it.each(WORLDS)('Mundo $number tiene un único boleto y un desvío independiente', world => {
    expect(world.bonus).toBeDefined();
    expect(world.levels.flatMap(l => l.ops.filter(op => op[0] === 'ticket'))).toHaveLength(1);
    expect(world.bonus!.ops.some(op => op[0] === 'ticket')).toBe(false);
    expect(getLevel(world.bonus!.id)).toBe(world.bonus);
    expect(ALL_LEVELS).not.toContain(world.bonus);
    expect(nextLevelId(world.bonus!.id)).toBeNull();
    const last = world.levels.at(-1)!;
    const nextWorld = WORLDS.find(w => w.number === world.number + 1);
    expect(nextLevelId(last.id)).toBe(nextWorld?.levels[0].id ?? null);
  });

  it('todos los desvíos tienen identidades únicas', () => {
    expect(BONUS_LEVELS).toHaveLength(WORLDS.length);
    expect(new Set(BONUS_LEVELS.map(l => l.id)).size).toBe(WORLDS.length);
  });

  it.each(ALL_LEVELS.filter(l => l.ops.some(op => op[0] === 'ticket')))('$id esconde el boleto en espacio libre, antes de la meta', def => {
    const level = buildLevel(def);
    expect(level.tickets).toHaveLength(1);
    const ticket = level.tickets[0];
    expect(ticket.x).toBeGreaterThan(3 * T);
    expect(ticket.x + ticket.w).toBeLessThan(level.flagX * T);
    expect(ticket.y).toBeGreaterThanOrEqual(0);
    expect(ticket.y + ticket.h).toBeLessThan(ROWS * T);
    for (let x = Math.floor(ticket.x / T); x <= Math.floor((ticket.x + ticket.w - 1) / T); x++)
      for (let y = Math.floor(ticket.y / T); y <= Math.floor((ticket.y + ticket.h - 1) / T); y++)
        expect(isSolidTile(level.grid[y][x]), `boleto enterrado en ${x},${y}`).toBe(false);
  });
});
