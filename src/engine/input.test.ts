import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('mantiene la acción hasta soltar todas sus fuentes y reset las limpia', () => {
    const input = new Input();
    input.press('run', 'ShiftLeft'); input.press('run', 'ShiftRight');
    input.release('run', 'ShiftLeft'); expect(input.held.run).toBe(true);
    input.reset(); input.press('run', 'touch'); input.release('run', 'touch');
    expect(input.held.run).toBe(false);
  });
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
