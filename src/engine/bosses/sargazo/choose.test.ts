import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { chooseAttack, type SeaAttack } from './choose';
import type { SeaPhase } from './tuning';

function sequence(phase: SeaPhase, distance: number): SeaAttack[] {
  const rng = makeRng(525), result: SeaAttack[] = [];
  let last: SeaAttack | null = null, since = 0;
  for (let i = 0; i < 120; i++) {
    const attack = chooseAttack(phase, last, since, distance, rng);
    result.push(attack); last = attack; since = attack === 'net' ? 0 : since + 1;
  }
  return result;
}

describe('Repertorio del Capitán', () => {
  it.each([1, 2, 3, 4] as const)('devuelve aperturas cada dos ataques sin repeticiones en fase %i', phase => {
    const attacks = sequence(phase, 600);
    expect(attacks).toEqual(sequence(phase, 600));
    for (let i = 1; i < attacks.length; i++) expect(attacks[i]).not.toBe(attacks[i - 1]);
    for (let i = 2; i < attacks.length; i += 3) expect(attacks[i]).toBe('net');
    if (phase >= 2) expect(attacks).toEqual(expect.arrayContaining(['surge', 'whirlpool']));
    if (phase >= 3) expect(attacks).toContain('rain');
    if (phase === 1) expect(new Set(attacks)).toEqual(new Set(['salvo', 'tide', 'net']));
  });

  it('devuelve selección influida por la distancia sin perder ataques', () => {
    expect(sequence(4, 50)).not.toEqual(sequence(4, 600));
  });
});
