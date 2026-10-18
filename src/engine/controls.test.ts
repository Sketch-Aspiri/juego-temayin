import { describe, expect, it } from 'vitest';
import { actionForKey, bindingConflict, DEFAULT_KEY_BINDINGS, isBindableKey, sanitizeKeyBindings } from './controls';

describe('Teclas personalizadas', () => {
  it('conserva todos los atajos originales y Esc siempre pausa', () => {
    for (const code of ['Space', 'KeyZ', 'KeyW', 'ArrowUp']) expect(actionForKey(code, DEFAULT_KEY_BINDINGS)).toBe('jump');
    expect(actionForKey('ShiftRight', DEFAULT_KEY_BINDINGS)).toBe('run');
    expect(actionForKey('Escape', { ...DEFAULT_KEY_BINDINGS, pause: 'KeyO' })).toBe('pause');
  });

  it('una tecla personalizada sustituye los atajos de esa acción y deja intactos los otros', () => {
    const bindings = { ...DEFAULT_KEY_BINDINGS, jump: 'KeyK', pause: 'KeyO', mute: 'KeyN' };
    expect(actionForKey('KeyK', bindings)).toBe('jump');
    for (const code of ['Space', 'KeyZ', 'KeyW', 'ArrowUp']) expect(actionForKey(code, bindings)).toBeUndefined();
    expect(actionForKey('KeyA', bindings)).toBe('left');
    expect(actionForKey('KeyO', bindings)).toBe('pause');
    expect(actionForKey('KeyN', bindings)).toBe('mute');
    expect(actionForKey('KeyP', bindings)).toBeUndefined();
  });

  it('detecta conflictos con teclas principales y atajos secundarios', () => {
    expect(bindingConflict('fire', 'KeyA', DEFAULT_KEY_BINDINGS)).toBe('left');
    expect(bindingConflict('left', 'KeyA', DEFAULT_KEY_BINDINGS)).toBeUndefined();
    expect(bindingConflict('fire', 'KeyA', { ...DEFAULT_KEY_BINDINGS, left: 'KeyQ' })).toBeUndefined();
  });

  it('sanea mapas parciales y recupera un mapa jugable ante duplicados o datos corruptos', () => {
    expect(sanitizeKeyBindings({ jump: 'KeyK' })).toEqual({ ...DEFAULT_KEY_BINDINGS, jump: 'KeyK' });
    expect(sanitizeKeyBindings({ jump: 'KeyA' })).toEqual(DEFAULT_KEY_BINDINGS);
    expect(sanitizeKeyBindings({ jump: 'Escape', fire: 'Tab', left: null })).toEqual(DEFAULT_KEY_BINDINGS);
    expect(sanitizeKeyBindings(null)).toEqual(DEFAULT_KEY_BINDINGS);
  });

  it.each(['Escape', 'Tab', 'Enter', 'MetaLeft', '', 'KeyAA', '__proto__'])('reserva teclas de navegación o inválidas: %s', code => {
    expect(isBindableKey(code)).toBe(false);
  });
});
