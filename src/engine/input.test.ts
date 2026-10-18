import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { DEFAULT_KEY_BINDINGS } from './controls';

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

  it('recibe la tecla reasignada, ignora la anterior y limpia teclas al cambiar el mapa', () => {
    const target = new EventTarget();
    const input = new Input();
    input.setBindings({ ...DEFAULT_KEY_BINDINGS, jump: 'KeyK' });
    input.attach(target as unknown as Window);
    const key = (type: string, code: string): void => {
      const event = new Event(type, { cancelable: true });
      Object.defineProperty(event, 'code', { value: code });
      target.dispatchEvent(event);
    };
    key('keydown', 'Space');
    expect(input.held.jump).toBe(false);
    key('keydown', 'KeyK');
    expect(input.consumeJump()).toBe(true);
    key('keyup', 'KeyK');
    expect(input.held.jump).toBe(false);
    key('keydown', 'KeyK');
    input.setBindings(DEFAULT_KEY_BINDINGS);
    expect(input.held.jump).toBe(false);
    expect(input.consumeJump()).toBe(false);
    input.detach();
  });
});
