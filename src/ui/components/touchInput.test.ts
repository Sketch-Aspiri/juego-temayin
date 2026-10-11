import { describe, expect, it } from 'vitest';
import { Input } from '../../engine/input';
import { TouchInput } from './touchInput';

describe('Controles multitáctiles', () => {
  it('combina carrera, dirección, salto y fuego y suelta cada dedo por separado', () => {
    const input = new Input(); const pad = new TouchInput(input);
    pad.start(1, 'run'); pad.end(1);
    pad.start(2, 'right'); pad.start(3, 'jump'); pad.start(4, 'fire');
    expect(input.held).toEqual({ left: false, right: true, run: true, jump: true, fire: true });
    expect(input.consumeJump()).toBe(true);
    expect(input.consumeFire()).toBe(true);
    pad.end(3);
    expect(input.held.right && input.held.run && input.held.fire).toBe(true);
    expect(input.held.jump).toBe(false);
    pad.start(5, 'run');
    expect(input.held.run).toBe(false);
  });

  it('dos dedos en salto no se cancelan entre sí ni repiten el salto', () => {
    const input = new Input(); const pad = new TouchInput(input);
    pad.start(1, 'jump'); expect(input.consumeJump()).toBe(true);
    pad.start(2, 'jump'); expect(input.consumeJump()).toBe(false);
    pad.end(1); expect(input.held.jump).toBe(true);
    pad.end(2); expect(input.held.jump).toBe(false);
    pad.start(3, 'jump'); expect(input.consumeJump()).toBe(true);
  });

  it('permite deslizar entre direcciones, salir y volver sin levantar el dedo', () => {
    const input = new Input(); const pad = new TouchInput(input);
    pad.start(1, 'left'); pad.move(1, 'right');
    expect(input.held.left).toBe(false); expect(input.held.right).toBe(true);
    pad.move(1, null); expect(pad.has(1)).toBe(true); expect(pad.actions).toEqual([]);
    pad.move(1, 'right'); expect(input.held.right).toBe(true);
    pad.move(1, 'run'); expect(input.held.run).toBe(false);
    pad.end(1); expect(pad.has(1)).toBe(false);
  });

  it('limpia dedos y carrera sin soltar el teclado al pausar o salir', () => {
    const input = new Input(); const pad = new TouchInput(input);
    input.press('right', 'KeyD'); pad.start(1, 'right'); pad.start(2, 'run');
    pad.reset(); expect(pad.actions).toEqual([]);
    expect(input.held.right).toBe(true); expect(input.held.run).toBe(false);
    input.release('right', 'KeyD'); expect(input.held.right).toBe(false);
  });
});
