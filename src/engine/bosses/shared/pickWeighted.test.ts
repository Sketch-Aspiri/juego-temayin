import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { pickWeighted } from './pickWeighted';

type Move = 'a' | 'b' | 'c';
const WEIGHTS: Readonly<Record<Move, number>> = { a: 1, b: 2, c: 1 };

describe('sorteo ponderado de ataques', () => {
  it('nunca devuelve el anterior si hay alternativas', () => {
    const rng = makeRng(5);
    for (let i = 0; i < 500; i++) expect(pickWeighted(['a', 'b', 'c'], WEIGHTS, 'b', rng)).not.toBe('b');
  });

  it('respeta los pesos: la opción doble sale cerca del doble de veces', () => {
    const rng = makeRng(9);
    const count: Record<Move, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 4000; i++) count[pickWeighted(['a', 'b', 'c'], WEIGHTS, null, rng)]++;
    expect(count.b / count.a).toBeGreaterThan(1.6);
    expect(count.b / count.a).toBeLessThan(2.4);
  });

  it('recorre los extremos del azar sin salirse de las opciones', () => {
    expect(pickWeighted(['a', 'b', 'c'], WEIGHTS, null, () => 0)).toBe('a');
    expect(pickWeighted(['a', 'b', 'c'], WEIGHTS, null, () => 0.9999999)).toBe('c');
  });

  it('si la única opción es la anterior, la repite antes que no atacar', () => {
    expect(pickWeighted(['a'], WEIGHTS, 'a', () => 0.5)).toBe('a');
  });
});
