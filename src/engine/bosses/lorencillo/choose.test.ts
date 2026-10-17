import { describe, expect, it } from 'vitest';
import { makeRng } from '../../rng';
import { type LorenAttack, chooseAttack, endsWindow } from './choose';
import { MAX_ATTACKS_WITHOUT_WINDOW, MAX_CRABS } from './tuning';

const base = { phase: 1, last: null, sinceWindow: 0, distTiles: 8, crabsAlive: 0 } as const;

describe('Selector de ataques de Lorencillo', () => {
  it('nunca repite el ataque anterior', () => {
    // Organizar
    const rng = makeRng(7);
    const all: LorenAttack[] = ['lunge', 'cannon', 'mast'];
    for (const last of all) {
      for (let i = 0; i < 200; i++) {
        // Actuar
        const pick = chooseAttack({ ...base, last, distTiles: i % 2 ? 2 : 9 }, rng);
        // Comprobar
        expect(pick).not.toBe(last);
      }
    }
  });

  it('fuerza la estocada tras demasiados ataques sin ventana', () => {
    const rng = makeRng(3);
    for (let i = 0; i < 100; i++) {
      const pick = chooseAttack({ ...base, last: 'cannon', sinceWindow: MAX_ATTACKS_WITHOUT_WINDOW }, rng);
      expect(pick).toBe('lunge');
    }
  });

  it('no manda al mástil si ya hay el máximo de cangrejos vivos', () => {
    const rng = makeRng(11);
    for (let i = 0; i < 200; i++) {
      expect(chooseAttack({ ...base, last: 'lunge', crabsAlive: MAX_CRABS }, rng)).not.toBe('mast');
    }
  });

  it('es determinista para la misma semilla y reparte los tres ataques', () => {
    const run = (): LorenAttack[] => {
      const rng = makeRng(99);
      const out: LorenAttack[] = [];
      let last: LorenAttack | null = null;
      for (let i = 0; i < 60; i++) { last = chooseAttack({ ...base, last }, rng); out.push(last); }
      return out;
    };
    expect(run()).toEqual(run());
    expect(new Set(run())).toEqual(new Set(['lunge', 'cannon', 'mast']));
  });

  it('solo la estocada abre ventana de daño', () => {
    expect(endsWindow('lunge')).toBe(true);
    expect(endsWindow('cannon')).toBe(false);
    expect(endsWindow('mast')).toBe(false);
  });
});
