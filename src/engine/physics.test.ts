import { describe, expect, it } from 'vitest';
import { T } from './constants';
import { moveX, moveY, overlap } from './physics';
import type { Body } from './types';

const body = (over: Partial<Body> = {}): Body => ({ x: 0, y: 0, w: 36, h: 66, vx: 0, vy: 0, onGround: false, ...over });
/** Suelo en la fila 10 y un muro en la columna 5 (filas 8-9). */
const solid = (tx: number, ty: number): boolean => ty >= 10 || (tx === 5 && ty >= 8);

describe('overlap', () => {
  it('detecta rectángulos que se solapan y descarta los que solo se tocan', () => {
    expect(overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('moveY', () => {
  it('apoya al cuerpo sobre el suelo al caer', () => {
    const b = body({ y: 10 * T - 66 - 3, vy: 500 });
    const hit = moveY(b, 10, solid);
    expect(hit).toBeNull();
    expect(b.onGround).toBe(true);
    expect(b.y).toBe(10 * T - 66);
    expect(b.vy).toBe(0);
  });

  it('devuelve el bloque golpeado con la cabeza y anula la velocidad', () => {
    const b = body({ x: 5 * T + 2, y: 10 * T - 66 - 150, vy: -500 });
    // Cuerpo bajo un techo en la fila 3.
    const ceiling = (tx: number, ty: number): boolean => ty === 3 && tx === 5;
    b.y = 4 * T + 5;
    const hit = moveY(b, -10, ceiling);
    expect(hit).toEqual([5, 3]);
    expect(b.y).toBe(4 * T);
    expect(b.vy).toBe(0);
  });
});

describe('moveX', () => {
  it('detiene al cuerpo contra una pared a la derecha', () => {
    const b = body({ x: 5 * T - 36 - 2, y: 8 * T });
    expect(moveX(b, 10, solid)).toBe(true);
    expect(b.x).toBe(5 * T - 36);
  });

  it('detiene al cuerpo contra una pared a la izquierda', () => {
    const b = body({ x: 6 * T + 2, y: 8 * T });
    expect(moveX(b, -10, solid)).toBe(true);
    expect(b.x).toBe(6 * T);
  });

  it('permite el movimiento libre', () => {
    const b = body({ x: 0, y: 8 * T });
    expect(moveX(b, 10, solid)).toBe(false);
    expect(b.x).toBe(10);
  });
});
