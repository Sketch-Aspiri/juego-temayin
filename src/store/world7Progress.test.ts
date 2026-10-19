import { describe, expect, it } from 'vitest';
import { CINEMATICS } from '../data/cinematics';
import { isCinematicUnlocked } from './cinematics';
import { isUnlocked, recordTicket, sanitizeProgress } from './progress';

describe('Progreso anterior al Mundo 7', () => {
  it('conserva un récord antiguo de Chetumal y abre Xpujil sin cambiar el guardado', () => {
    const old = { levels: { '6-6': { stars: 3, bestScore: 12345, completions: 4 }, '1-1': { stars: 1, bestScore: 50, completions: 2 } } };
    const progress = sanitizeProgress(old);
    expect(progress.levels).toEqual(old.levels);
    expect(isUnlocked(progress, '7-1')).toBe(true);
    expect(isUnlocked(progress, '7-2')).toBe(false);
    expect(isUnlocked(progress, '7-extra')).toBe(false);
    const ticket = recordTicket(progress, 'calakmul');
    expect(isUnlocked(ticket, '7-extra')).toBe(true);
    expect(ticket.levels).toBe(progress.levels);
    expect(isCinematicUnlocked(ticket, CINEMATICS['camazotz-victory'])).toBe(false);
  });
});
