import { describe, expect, it } from 'vitest';
import {
  IDLE_SESSION, pointerCancel, pointerDown, pointerMove, pointerUp,
  type MapPointerEffect, type MapPointerSession,
} from './mapPointerSession';

const SLOP = 8;

/** Aplica una secuencia de pasos y devuelve la sesión final con todos los efectos. */
function run(steps: ReadonlyArray<(session: MapPointerSession) => { session: MapPointerSession; effect: MapPointerEffect }>) {
  let session: MapPointerSession = IDLE_SESSION;
  const effects: MapPointerEffect[] = [];
  for (const step of steps) {
    const result = step(session);
    session = result.session;
    effects.push(result.effect);
  }
  return { session, effects };
}

const down = (id: number, x: number, y: number) => (s: MapPointerSession) => pointerDown(s, id, { x, y });
const move = (id: number, x: number, y: number) => (s: MapPointerSession) => pointerMove(s, id, { x, y }, SLOP);
const up = (id: number) => (s: MapPointerSession) => pointerUp(s, id);

describe('sesión de punteros del mapa', () => {
  it('un toque bajo el umbral no suprime el clic', () => {
    const { session, effects } = run([down(1, 100, 100), move(1, 104, 103), up(1)]);
    expect(effects[1]).toEqual({ kind: 'none' });
    expect(effects[2]).toEqual({ kind: 'end', suppressClick: false });
    expect(session.mode).toBe('idle');
  });

  it('al superar el umbral emite begin-drag con todo el desplazamiento y suprime el clic al soltar', () => {
    const { effects } = run([down(1, 100, 100), move(1, 120, 100), up(1)]);
    expect(effects[1]).toEqual({ kind: 'begin-drag', pointerId: 1, delta: { x: 20, y: 0 } });
    expect(effects[2]).toEqual({ kind: 'end', suppressClick: true });
  });

  it('la suma de desplazamientos iguala el movimiento total desde el origen', () => {
    const { effects } = run([down(1, 50, 60), move(1, 55, 60), move(1, 70, 90), move(1, 40, 120)]);
    const total = effects.reduce((acc, effect) => {
      if (effect.kind === 'begin-drag' || effect.kind === 'pan') return { x: acc.x + effect.delta.x, y: acc.y + effect.delta.y };
      return acc;
    }, { x: 0, y: 0 });
    expect(total).toEqual({ x: 40 - 50, y: 120 - 60 });
  });

  it('un segundo dedo inicia el pellizco y suprime el clic', () => {
    const { session, effects } = run([down(1, 100, 100), down(2, 200, 100)]);
    expect(effects[1]).toEqual({ kind: 'pinch-start', pointerIds: [1, 2] });
    expect(session.mode).toBe('pinch');
    const end = run([down(1, 100, 100), down(2, 200, 100), up(1), up(2)]).effects;
    expect(end[3]).toEqual({ kind: 'end', suppressClick: true });
  });

  it('en pellizco emite posiciones previas y actuales de ambos dedos', () => {
    const { effects } = run([down(1, 100, 100), down(2, 200, 100), move(2, 300, 100)]);
    expect(effects[2]).toEqual({
      kind: 'pinch', previous: [{ x: 100, y: 100 }, { x: 200, y: 100 }], current: [{ x: 100, y: 100 }, { x: 300, y: 100 }],
    });
  });

  it('al levantar un dedo del pellizco sigue arrastrando con el otro sin salto', () => {
    const { session, effects } = run([down(1, 100, 100), down(2, 200, 100), move(2, 260, 100), up(1), move(2, 270, 105)]);
    expect(effects[3]).toEqual({ kind: 'none' });
    expect(session.mode).toBe('drag');
    expect(effects[4]).toEqual({ kind: 'pan', delta: { x: 10, y: 5 } });
  });

  it('cancelar vuelve a reposo, y suprime el clic solo si había gesto', () => {
    expect(pointerCancel(pointerDown(IDLE_SESSION, 1, { x: 0, y: 0 }).session)).toEqual({ session: IDLE_SESSION, effect: { kind: 'end', suppressClick: false } });
    const dragging = run([down(1, 0, 0), move(1, 30, 0)]).session;
    expect(pointerCancel(dragging)).toEqual({ session: IDLE_SESSION, effect: { kind: 'end', suppressClick: true } });
  });

  it('ignora un tercer dedo y los identificadores desconocidos', () => {
    const base = run([down(1, 0, 0), down(2, 50, 0)]).session;
    expect(pointerDown(base, 3, { x: 9, y: 9 })).toEqual({ session: base, effect: { kind: 'none' } });
    expect(pointerMove(base, 3, { x: 9, y: 9 }, SLOP)).toEqual({ session: base, effect: { kind: 'none' } });
    expect(pointerUp(base, 3)).toEqual({ session: base, effect: { kind: 'none' } });
    expect(pointerMove(IDLE_SESSION, 1, { x: 5, y: 5 }, SLOP).effect).toEqual({ kind: 'none' });
  });

  it('no muta la sesión de entrada', () => {
    const session = Object.freeze(pointerDown(IDLE_SESSION, 1, { x: 1, y: 1 }).session);
    expect(() => pointerMove(session, 1, { x: 90, y: 90 }, SLOP)).not.toThrow();
  });
});
