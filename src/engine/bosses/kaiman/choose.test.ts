import { describe, expect, it } from 'vitest';
import { type Attack, chooseAttack, PHASE_ATTACKS } from './choose';
import { makeRng } from '../../rng';
import { propaguleColumns, spitMud } from './hazards';
import { MAX_ATTACKS_WITHOUT_DIVE, PROPAGULE_GAP, SPIT_BALLS } from './tuning';

describe('elección de ataques del Kaimán', () => {
  it('nunca repite el ataque anterior y usa todo su repertorio', () => {
    const rng = makeRng(7);
    for (const phase of [1, 2, 3] as const) {
      const seen = new Set<Attack>();
      let last: Attack | null = null;
      for (let i = 0; i < 300; i++) {
        const a = chooseAttack({ phase, last, sinceDive: 0, distTiles: i % 2 ? 2 : 9 }, rng);
        expect(a).not.toBe(last);
        expect(PHASE_ATTACKS[phase]).toContain(a);
        seen.add(a);
        last = a;
      }
      expect(seen.size).toBe(PHASE_ATTACKS[phase].length);
    }
  });

  it('la fase 1 no golpea el mangle; las fases 2 y 3 sí', () => {
    expect(PHASE_ATTACKS[1]).not.toContain('slam');
    expect(PHASE_ATTACKS[2]).toContain('slam');
  });

  it('tras varios ataques sin sumergirse, se sumerge (siempre llega la ventana de pisotón)', () => {
    const a = chooseAttack({ phase: 1, last: 'bite', sinceDive: MAX_ATTACKS_WITHOUT_DIVE, distTiles: 2 }, () => 0);
    expect(a).toBe('dive');
  });

  it('cerca prefiere morder; lejos prefiere sumergirse o escupir', () => {
    const count = (dist: number, target: Attack): number => {
      const rng = makeRng(3);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (chooseAttack({ phase: 2, last: null, sinceDive: 0, distTiles: dist }, rng) === target) n++;
      return n;
    };
    expect(count(2, 'bite')).toBeGreaterThan(count(10, 'bite'));
    expect(count(10, 'spit')).toBeGreaterThan(count(2, 'spit'));
  });
});

describe('proyectiles del Kaimán', () => {
  it('los propágulos dejan huecos para esquivar', () => {
    const xs = propaguleColumns(700, 400, 1300, 6, makeRng(11));
    expect(xs[0]).toBe(700);
    for (let i = 0; i < xs.length; i++) {
      for (let j = i + 1; j < xs.length; j++) expect(Math.abs(xs[i] - xs[j])).toBeGreaterThanOrEqual(PROPAGULE_GAP);
    }
  });

  it('el lodo sale en arcos distintos hacia el jugador', () => {
    const balls = spitMud(1000, 420, 600, 3);
    expect(balls.length).toBe(SPIT_BALLS[2]);
    for (const b of balls) expect(b.vx).toBeLessThan(0);
    expect(new Set(balls.map((b) => b.vy)).size).toBe(balls.length);
  });
});
