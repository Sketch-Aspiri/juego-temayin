import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('el salto solo se consume una vez por pulsación', () => {
    const i = new Input();
    i.press('jump');
    i.press('jump'); // mantener pulsado no genera otra pulsación
    expect(i.consumeJump()).toBe(true);
    expect(i.consumeJump()).toBe(false);
    i.release('jump');
    i.press('jump');
    expect(i.consumeJump()).toBe(true);
  });

  it('reset suelta todas las teclas', () => {
    const i = new Input();
    i.press('left');
    i.press('fire');
    i.reset();
    expect(i.held.left).toBe(false);
    expect(i.consumeFire()).toBe(false);
  });
});
