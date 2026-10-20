import { afterEach, describe, expect, it } from 'vitest';
import { attachMapListeners } from './mapListeners';
import { zoomLimits, type MapCamera } from './mapGestures';
import { IDLE_SESSION, type MapPointerSession } from './mapPointerSession';

const VIEWPORT = { width: 390, height: 844 };
const START: MapCamera = { centerX: 500, centerY: 450, unitsPerPx: 2 };
const cleanups: (() => void)[] = [];
afterEach(() => { for (const detach of cleanups.splice(0)) detach(); });

/** Frontera DOM mínima: las pérdidas de captura pueden proceder de un hijo. */
function harness() {
  const captures = new Set<number>();
  const element = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    setPointerCapture: (id: number) => { captures.add(id); },
    hasPointerCapture: (id: number) => captures.has(id),
  });
  const child = new EventTarget();
  let session: MapPointerSession = IDLE_SESSION;
  let camera = START;
  let gesturing = false;
  const detach = attachMapListeners(element as unknown as HTMLElement, {
    getSession: () => session, setSession: next => { session = next; },
    getViewport: () => VIEWPORT, getLimits: () => zoomLimits(VIEWPORT),
    current: () => camera, commit: next => { camera = next; },
    setGesturing: active => { gesturing = active; },
  });
  cleanups.push(detach);
  const send = (type: string, id: number, x = 100, y = 400, target: EventTarget = element) => {
    const event = new Event(type);
    Object.defineProperties(event, {
      pointerId: { value: id }, pointerType: { value: 'touch' },
      clientX: { value: x }, clientY: { value: y }, target: { value: target },
    });
    element.dispatchEvent(event);
  };
  const loseCapture = (id: number, fromChild = false) => {
    if (!fromChild) captures.delete(id);
    send('lostpointercapture', id, 100, 400, fromChild ? child : element);
  };
  return { send, loseCapture, captures, detach, state: () => ({ session, camera, gesturing }) };
}

describe('entrada táctil del mapa', () => {
  it('mantiene el arrastre al transferir la captura implícita de un hijo al atlas', () => {
    const map = harness();
    map.send('pointerdown', 1, 50, 400);
    map.send('pointermove', 1, 62, 403);
    map.loseCapture(1, true);
    for (let step = 2; step <= 10; step++) map.send('pointermove', 1, 50 + step * 12, 400 + step * 3);
    expect(map.state().session.mode).toBe('drag');
    expect(map.state().gesturing).toBe(true);
    expect(map.state().camera.centerX).toBeCloseTo(START.centerX - 120 * START.unitsPerPx);
    expect(map.state().camera.centerY).toBeCloseTo(START.centerY - 30 * START.unitsPerPx);
    map.send('pointerup', 1);
    expect(map.state().session.mode).toBe('idle');
    expect(map.state().gesturing).toBe(false);
  });

  it('captura ambos dedos y conserva el pellizco ante pérdidas de captura de los hijos', () => {
    const map = harness();
    map.send('pointerdown', 1, 100, 400);
    map.send('pointerdown', 2, 200, 400);
    expect([...map.captures]).toEqual([1, 2]);
    map.loseCapture(1, true);
    map.loseCapture(2, true);
    map.send('pointermove', 1, 50, 400);
    map.send('pointermove', 2, 250, 400);
    expect(map.state().session.mode).toBe('pinch');
    expect(map.state().camera.unitsPerPx).toBeCloseTo(START.unitsPerPx / 2);
    map.send('pointerup', 1);
    map.loseCapture(1);
    const before = map.state().camera;
    map.send('pointermove', 2, 270, 400);
    expect(map.state().session.mode).toBe('drag');
    expect(map.state().camera.centerX).toBeCloseTo(before.centerX - 20 * before.unitsPerPx);
  });

  it('termina el gesto cuando el atlas pierde realmente la captura', () => {
    const map = harness();
    map.send('pointerdown', 1);
    map.send('pointermove', 1, 120);
    map.loseCapture(1);
    const before = map.state().camera;
    map.send('pointermove', 1, 180);
    expect(map.state().session.mode).toBe('idle');
    expect(map.state().gesturing).toBe(false);
    expect(map.state().camera).toEqual(before);
  });

  it('no procesa entradas después de desconectar los listeners', () => {
    const map = harness();
    map.detach();
    map.send('pointerdown', 1);
    map.send('pointermove', 1, 180);
    expect(map.state().session.mode).toBe('idle');
    expect(map.state().camera).toEqual(START);
  });
});
