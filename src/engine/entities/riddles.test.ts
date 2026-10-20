import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, STEP, T } from '../constants';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { World } from '../World';
import { parseTerm, termValue } from './numerals';
import { STONE_WRONG_TIME, updateRiddles } from './riddles';

const def: LevelDef = { id: 'prueba', name: 'Acertijo', theme: 'jungle', width: 80,
  ops: [['coins', 4, 10, 2], ['riddle', 10, 11, 'r1', '9 + 8 = ?', '17'],
    ['stone', 14, 8, '16', 'r1'], ['stone', 16, 8, '17', 'r1'], ['stone', 18, 8, '1/3', 'r1'],
    ['gate', 24, 'r1'], ['flag', 60]] };
const make = (riddles: readonly string[] = []) => new World({ def, input: new Input(), audio: new AudioEngine(),
  session: { score: 0, coins: 0, lives: 3 }, riddles });
const touch = (w: World, index: number): void => {
  const stone = w.level.stones[index];
  w.player.x = stone.x; w.player.y = stone.y; w.player.vy = 0; w.player.inv = 10;
  w.update(STEP);
};
const gateClosed = (w: World): boolean => w.grid[GROUND - 1][24] === 'X';

describe('numerales mayas', () => {
  it('lee puntos, rayas, concha y numerales apilados en base 20', () => {
    expect(termValue(parseTerm('13'))).toBe(13);
    expect(termValue(parseTerm('0'))).toBe(0);
    expect(termValue(parseTerm('1/3'))).toBe(23);
    expect(termValue(parseTerm('#260'))).toBe(260);
    expect(termValue(parseTerm('+'))).toBeNull();
  });

  it.each(['20', '1/20', '#', 'a', ''])('rechaza el término inválido «%s»', token => {
    expect(() => parseTerm(token)).toThrow();
  });
});

describe('Acertijos de numerología maya', () => {
  it('la puerta nace cerrada y la piedra correcta la abre', () => {
    const w = make();
    expect(gateClosed(w)).toBe(true);
    touch(w, 1);
    expect(w.riddlesSolved).toEqual(['r1']);
    expect(gateClosed(w)).toBe(false);
  });

  it('una piedra equivocada se apaga sin quitar vida, cacao ni puntos y permite reintentar', () => {
    const w = make();
    touch(w, 0);
    expect(w.riddlesSolved).toEqual([]);
    expect(w.stoneCooldown.has(0)).toBe(true);
    expect(gateClosed(w)).toBe(true);
    expect(w.session).toEqual({ score: 0, coins: 0, lives: 3 });
    for (let t = 0; t < STONE_WRONG_TIME + 0.1; t += STEP) w.update(STEP);
    expect(w.stoneCooldown.has(0)).toBe(false);
    touch(w, 1);
    expect(gateClosed(w)).toBe(false);
  });

  it('la piedra apagada se reactiva aunque el paso de tiempo sea grande', () => {
    const w = make();
    touch(w, 0);
    w.player.x = 2 * T; // fuera de la piedra, para que el vencimiento no la vuelva a activar
    updateRiddles(w, STONE_WRONG_TIME * 10);
    expect(w.stoneCooldown.size).toBe(0);
  });

  it('acepta la respuesta por valor aunque se escriba apilada o en cifras', () => {
    const w = new World({ def: { ...def, ops: [['riddle', 10, 11, 'r1', '1/3 = ?', '#23'],
      ['stone', 14, 8, '1/3', 'r1'], ['gate', 24, 'r1'], ['flag', 60]] }, input: new Input(), audio: new AudioEngine(),
    session: { score: 0, coins: 0, lives: 3 } });
    touch(w, 0);
    expect(w.riddlesSolved).toEqual(['r1']);
  });

  it('pasar por debajo de las piedras caminando no las activa', () => {
    const w = make();
    const stone = w.level.stones[1];
    w.player.x = stone.x; w.player.y = GROUND * T - w.player.h; w.player.inv = 10;
    for (let i = 0; i < 10; i++) w.update(STEP);
    expect(w.riddlesSolved).toEqual([]);
    expect(w.stoneCooldown.size).toBe(0);
  });

  it('conserva el acertijo resuelto al reaparecer y descarta ids ajenos', () => {
    const w = make(['r1', 'otro-nivel']);
    expect(w.riddlesSolved).toEqual(['r1']);
    expect(gateClosed(w)).toBe(false);
  });

  it('no deja resolver al morir ni cambia el terreno fuera de la puerta', () => {
    const w = make();
    const before = structuredClone(w.grid);
    w.die();
    touch(w, 1);
    expect(w.riddlesSolved).toEqual([]);
    expect(w.grid).toEqual(before);
  });
});
