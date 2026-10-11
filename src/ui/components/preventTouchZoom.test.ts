import { describe, expect, it } from 'vitest';
import { preventTouchZoom } from './preventTouchZoom';

describe('Gestos del mando táctil', () => {
  it.each(['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend', 'dblclick'])('cancela %s y retira la protección al desmontar el mando', (type) => {
    const target = new EventTarget(); const cleanup = preventTouchZoom(target);
    const event = new Event(type, { cancelable: true });
    expect(target.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    cleanup();
    expect(target.dispatchEvent(new Event(type, { cancelable: true }))).toBe(true);
  });

  it('conserva los eventos de puntero y la activación de teclado', () => {
    const target = new EventTarget(); const cleanup = preventTouchZoom(target);
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click', 'keydown']) {
      expect(target.dispatchEvent(new Event(type, { cancelable: true }))).toBe(true);
    }
    cleanup();
  });
});
