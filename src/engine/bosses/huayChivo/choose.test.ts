import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { type ChivoAttack, chooseAttack, PHASE_ATTACKS } from './choose';
import { byPhase, type ChivoPhase, MAX_ATTACKS_WITHOUT_CHARGE, MAX_WISPS, NEAR_TILES, WISP_COUNT } from './tuning';

const PHASES: readonly ChivoPhase[] = [1, 2, 3];
/** Ataques que terminan con el jefe aturdido contra un borde (ventana de pisotón). */
const ENDS_DAZED: ReadonlySet<ChivoAttack> = new Set(['charge', 'blink']);

describe('elección de ataques del Huay Chivo', () => {
  it.each(PHASES)('fase %i: nunca repite el anterior y usa todo su repertorio', (phase) => {
    for (const dist of [2, NEAR_TILES + 4]) {
      // Organizar
      const rng = makeRng(17);
      const seen = new Set<ChivoAttack>();
      let last: ChivoAttack | null = null;
      let sinceCharge = 0;
      // Actuar
      for (let i = 0; i < 2000; i++) {
        const a = chooseAttack({ phase, last, sinceCharge, distTiles: dist, wispsAlive: 0 }, rng);
        // Comprobar
        expect(a).not.toBe(last);
        expect(PHASE_ATTACKS[phase]).toContain(a);
        seen.add(a);
        last = a;
        sinceCharge = ENDS_DAZED.has(a) ? 0 : sinceCharge + 1;
        expect(sinceCharge).toBeLessThanOrEqual(MAX_ATTACKS_WITHOUT_CHARGE);
      }
      // La cornada corta solo se propone cerca; el resto conserva todo el repertorio.
      const available = PHASE_ATTACKS[phase].filter(a => a !== 'horns' || dist < NEAR_TILES);
      expect([...seen].sort()).toEqual([...available].sort());
    }
  });

  it('la fase 1 no pisotea; las fases 2 y 3 sí', () => {
    expect(PHASE_ATTACKS[1]).not.toContain('stomp');
    expect(PHASE_ATTACKS[2]).toContain('stomp');
    expect(PHASE_ATTACKS[3]).toContain('stomp');
  });

  it('tras dos ataques sin embestir, embiste o se teletransporta (siempre llega la ventana)', () => {
    for (const r of [0, 0.3, 0.6, 0.9999]) {
      const a = chooseAttack({ phase: 3, last: 'wisps', sinceCharge: MAX_ATTACKS_WITHOUT_CHARGE, distTiles: 9, wispsAlive: 0 }, () => r);
      expect(ENDS_DAZED.has(a)).toBe(true);
    }
  });

  it.each(PHASES)('fase %i: no invoca fuegos fatuos si superaría el tope', (phase) => {
    const wispsAlive = MAX_WISPS - byPhase(WISP_COUNT, phase) + 1;
    const rng = makeRng(23);
    for (let i = 0; i < 2000; i++) {
      expect(chooseAttack({ phase, last: null, sinceCharge: 0, distTiles: 10, wispsAlive }, rng)).not.toBe('wisps');
    }
  });

  it('cerca embiste más a menudo que lejos', () => {
    const count = (dist: number): number => {
      const rng = makeRng(3);
      let n = 0;
      for (let i = 0; i < 2000; i++) {
        if (chooseAttack({ phase: 2, last: null, sinceCharge: 0, distTiles: dist, wispsAlive: 0 }, rng) === 'charge') n++;
      }
      return n;
    };
    expect(count(2)).toBeGreaterThan(count(NEAR_TILES + 5));
  });

  it('es determinista con la misma semilla', () => {
    const sequence = (): ChivoAttack[] => {
      const rng = makeRng(0x1a3a);
      return Array.from({ length: 40 }, (_, i) =>
        chooseAttack({ phase: 2, last: null, sinceCharge: i % 2, distTiles: i % 9, wispsAlive: 0 }, rng));
    };
    expect(sequence()).toEqual(sequence());
  });

  it('devuelve cornadas solo cerca y a partir de la fase 2', () => {
    expect(PHASE_ATTACKS[1]).not.toContain('horns');
    const rng = makeRng(41);
    let horns = 0;
    for (let i = 0; i < 500; i++) {
      const input = { phase: 2 as const, last: null, sinceCharge: 0, wispsAlive: 0 };
      if (chooseAttack({ ...input, distTiles: 2 }, rng) === 'horns') horns++;
      expect(chooseAttack({ ...input, distTiles: 8 }, rng)).not.toBe('horns');
    }
    expect(horns).toBeGreaterThan(100);
  });
});
