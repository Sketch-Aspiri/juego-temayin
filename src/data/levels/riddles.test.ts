import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../engine/audio';
import { GROUND, STEP, T } from '../../engine/constants';
import { isCorrect } from '../../engine/entities/riddles';
import { termValue } from '../../engine/entities/numerals';
import { driveRiddles } from '../../engine/testing/riddleRoute';
import { Input } from '../../engine/input';
import { World } from '../../engine/World';
import { BONUS_LEVELS } from '../worlds';

/** Respuesta numérica de cada acertijo, calculada aquí a mano con la numerología maya. */
const EXPECTED: Readonly<Record<string, number>> = {
  '1-cuenta': 13, // 2 rayas y 3 puntos
  '2-suma': 9 + 8,
  '3-serie': 18, // 3, 8, 13: de cinco en cinco
  '4-cero': 20 - 14,
  '5-posicion': 1 * 20 + 3,
  '6-uinal': 2 * 20,
  '7-tzolkin': 13 * 20,
  '7-haab': 18 * 20 + 5,
};

const make = (level: (typeof BONUS_LEVELS)[number], riddles: readonly string[] = []) => new World({ def: level,
  input: new Input(), audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 }, riddles });

describe('Acertijos de los niveles secretos', () => {
  it('cada nivel secreto tiene al menos un acertijo y todos están cubiertos por esta prueba', () => {
    const ids = BONUS_LEVELS.flatMap(level => make(level).level.riddles.map(r => r.id));
    expect(ids.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const level of BONUS_LEVELS) {
    const w = make(level);
    for (const riddle of w.level.riddles) {
      describe(`${level.id} · ${riddle.id}`, () => {
        const stones = w.level.stones.filter(s => s.riddleId === riddle.id);
        const gate = w.level.gates.find(g => g.riddleId === riddle.id);

        it('tiene exactamente una piedra correcta y es la esperada', () => {
          const correct = stones.filter(s => isCorrect(s, riddle));
          expect(correct).toHaveLength(1);
          expect(termValue(correct[0].term)).toBe(EXPECTED[riddle.id]);
          expect(riddle.answerValue).toBe(EXPECTED[riddle.id]);
        });

        it('ofrece de tres a cuatro piedras de valores distintos', () => {
          expect(stones.length).toBeGreaterThanOrEqual(3);
          expect(stones.length).toBeLessThanOrEqual(4);
          expect(new Set(stones.map(s => termValue(s.term))).size).toBe(stones.length);
        });

        it('coloca estela, piedras y puerta en orden, antes de la meta y con suelo continuo', () => {
          expect(gate).toBeDefined();
          const lastStone = Math.max(...stones.map(s => s.x / T));
          expect(riddle.cx / T).toBeLessThan(Math.min(...stones.map(s => s.x / T)));
          expect(gate!.x).toBeGreaterThan(lastStone + 1);
          expect(gate!.x).toBeLessThan(w.level.flagX - 1);
          for (let x = Math.floor(riddle.cx / T); x <= gate!.x; x++) expect(w.grid[GROUND][x], `suelo en ${x}`).toBe('G');
        });

        it('se resuelve caminando y saltando bajo la piedra correcta, sin rozar las equivocadas', () => {
          const others = w.level.riddles.filter(r => r.id !== riddle.id).map(r => r.id);
          const walk = make(level, others), p = walk.player;
          p.x = riddle.cx - 3 * T; p.y = GROUND * T - p.h; p.onGround = true; p.inv = 10;
          walk.camX = Math.max(0, p.x - 300);
          walk.input.press('right');
          for (let t = 0; t < 12 && !walk.riddlesSolved.includes(riddle.id); t += STEP) { driveRiddles(walk); walk.update(STEP); }
          expect(walk.riddlesSolved).toContain(riddle.id);
          expect(walk.stoneCooldown.size).toBe(0);
        });

        it('se resuelve de verdad: con la puerta cerrada se bloquea el paso y con la piedra correcta se cruza', () => {
          const closed = make(level);
          expect(closed.grid[GROUND - 1][gate!.x]).toBe('X');
          const answer = stones.find(s => isCorrect(s, riddle))!;
          closed.player.x = answer.x; closed.player.y = answer.y; closed.player.inv = 10;
          closed.update(STEP);
          expect(closed.riddlesSolved).toContain(riddle.id);
          for (let y = 0; y < GROUND; y++) expect(closed.grid[y][gate!.x]).toBe(' ');
        });
      });
    }
  }

  it('las dos puertas de 7-extra son independientes: resolver una no abre la otra', () => {
    const level = BONUS_LEVELS.find(l => l.id === '7-extra')!;
    const solved = make(level, ['7-tzolkin']);
    const [first, second] = solved.level.gates;
    expect(solved.grid[GROUND - 1][first.x]).toBe(' ');
    expect(solved.grid[GROUND - 1][second.x]).toBe('X');
  });
});
