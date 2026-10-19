import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../../data/worlds';
import { fitMapView, FULL_MAP, sidePanelInset, worldView } from './mapModel';
import {
  BUTTON_ZOOM_STEP, KEY_PAN_STEP_PX, MAX_ZOOM_IN, MAX_ZOOM_OUT, WHEEL_MAX_STEP,
  cameraFromView, canZoom, clampCamera, mapKeyCommand, panCamera, pinchCamera, viewFromCamera,
  wheelZoomFactor, zoomAnchor, zoomAtPoint, zoomLimits, type MapCamera, type ScreenSize,
} from './mapGestures';

const SIZES: readonly ScreenSize[] = [{ width: 1440, height: 1080 }, { width: 390, height: 844 }, { width: 844, height: 390 }];
const FULL_VIEW = (size: ScreenSize) => fitMapView(FULL_MAP, size.width, size.height);

function freezeDeep<T extends object>(value: T): T { return Object.freeze({ ...value }); }

describe('cámara del mapa: conversiones', () => {
  it('vista y cámara son inversas', () => {
    for (const size of SIZES) {
      const view = FULL_VIEW(size);
      const back = viewFromCamera(cameraFromView(view, size), size);
      expect(back.x).toBeCloseTo(view.x, 8);
      expect(back.y).toBeCloseTo(view.y, 8);
      expect(back.width).toBeCloseTo(view.width, 8);
      expect(back.height).toBeCloseTo(view.height, 8);
    }
  });
});

describe('clampCamera', () => {
  it('no altera ningún encuadre por defecto (península y siete tramos, con y sin panel)', () => {
    const bases = [FULL_MAP, ...WORLDS.map(worldView)];
    for (const size of SIZES) {
      const limits = zoomLimits(size);
      for (const inset of [0, sidePanelInset(size.width, true)]) {
        for (const base of bases) {
          const camera = cameraFromView(fitMapView(base, size.width, size.height, inset), size);
          const clamped = clampCamera(camera, limits);
          expect(clamped.centerX).toBeCloseTo(camera.centerX, 8);
          expect(clamped.centerY).toBeCloseTo(camera.centerY, 8);
          expect(clamped.unitsPerPx).toBeCloseTo(camera.unitsPerPx, 8);
        }
      }
    }
  });

  it('limita la escala a los topes de acercamiento y alejamiento', () => {
    const size = SIZES[0];
    const limits = zoomLimits(size);
    const base = cameraFromView(FULL_VIEW(size), size);
    expect(clampCamera({ ...base, unitsPerPx: 1e-9 }, limits).unitsPerPx).toBeCloseTo(base.unitsPerPx / MAX_ZOOM_IN, 8);
    expect(clampCamera({ ...base, unitsPerPx: 1e9 }, limits).unitsPerPx).toBe(limits.max);
    expect(limits.max).toBeGreaterThanOrEqual(base.unitsPerPx * MAX_ZOOM_OUT);
  });

  it('mantiene el centro dentro de la península tras arrastres extremos', () => {
    for (const size of SIZES) {
      const limits = zoomLimits(size);
      const camera = cameraFromView(FULL_VIEW(size), size);
      for (const delta of [{ x: 10000, y: 10000 }, { x: -10000, y: -10000 }, { x: 10000, y: -10000 }]) {
        const moved = clampCamera(panCamera(camera, delta), limits);
        expect(moved.centerX).toBeGreaterThanOrEqual(FULL_MAP.x);
        expect(moved.centerX).toBeLessThanOrEqual(FULL_MAP.x + FULL_MAP.width);
        expect(moved.centerY).toBeGreaterThanOrEqual(FULL_MAP.y);
        expect(moved.centerY).toBeLessThanOrEqual(FULL_MAP.y + FULL_MAP.height);
      }
    }
  });

  it('sustituye valores no finitos por un centro válido', () => {
    const size = SIZES[0];
    const result = clampCamera({ centerX: NaN, centerY: Infinity, unitsPerPx: NaN }, zoomLimits(size));
    expect(Number.isFinite(result.centerX) && Number.isFinite(result.centerY) && Number.isFinite(result.unitsPerPx)).toBe(true);
  });
});

describe('panCamera', () => {
  it('arrastrar 100 px a la derecha mueve el centro −100·unitsPerPx', () => {
    const camera: MapCamera = { centerX: 500, centerY: 300, unitsPerPx: 0.7 };
    const moved = panCamera(camera, { x: 100, y: -50 });
    expect(moved.centerX).toBeCloseTo(500 - 100 * 0.7, 8);
    expect(moved.centerY).toBeCloseTo(300 + 50 * 0.7, 8);
    expect(camera.centerX).toBe(500);
  });
});

describe('zoomAtPoint', () => {
  const size = SIZES[0];
  const limits = zoomLimits(size);
  const worldUnder = (camera: MapCamera, point: { x: number; y: number }) => ({
    x: camera.centerX + (point.x - size.width / 2) * camera.unitsPerPx,
    y: camera.centerY + (point.y - size.height / 2) * camera.unitsPerPx,
  });

  it('conserva el punto geográfico bajo el ancla', () => {
    const camera = cameraFromView(FULL_VIEW(size), size);
    const anchor = { x: 300, y: 700 };
    for (const factor of [1.5, 3, 1 / 1.1]) {
      const zoomed = zoomAtPoint(camera, anchor, factor, size, limits);
      expect(worldUnder(zoomed, anchor).x).toBeCloseTo(worldUnder(camera, anchor).x, 6);
      expect(worldUnder(zoomed, anchor).y).toBeCloseTo(worldUnder(camera, anchor).y, 6);
    }
  });

  it('limita la escala antes de recolocar, sin pasar de los topes', () => {
    const camera = cameraFromView(FULL_VIEW(size), size);
    const anchor = { x: 100, y: 100 };
    const closest = zoomAtPoint(camera, anchor, 1000, size, limits);
    expect(closest.unitsPerPx).toBeCloseTo(limits.min, 8);
    expect(worldUnder(closest, anchor).x).toBeCloseTo(worldUnder(camera, anchor).x, 6);
    expect(zoomAtPoint(camera, anchor, 1e-6, size, limits).unitsPerPx).toBe(limits.max);
  });

  it('no muta la cámara de entrada', () => {
    const camera = freezeDeep(cameraFromView(FULL_VIEW(size), size));
    expect(() => zoomAtPoint(camera, { x: 1, y: 1 }, 2, size, limits)).not.toThrow();
  });
});

describe('pinchCamera', () => {
  const size = SIZES[0];
  const limits = zoomLimits(size);
  const camera = cameraFromView(FULL_VIEW(size), size);

  it('separar los dedos al doble divide la escala entre dos y conserva el punto medio', () => {
    const result = pinchCamera(camera, [{ x: 500, y: 500 }, { x: 700, y: 500 }], [{ x: 400, y: 500 }, { x: 800, y: 500 }], size, limits);
    expect(result.unitsPerPx).toBeCloseTo(camera.unitsPerPx / 2, 8);
    const mid = { x: 600, y: 500 };
    const before = camera.centerX + (mid.x - size.width / 2) * camera.unitsPerPx;
    const after = result.centerX + (mid.x - size.width / 2) * result.unitsPerPx;
    expect(after).toBeCloseTo(before, 6);
  });

  it('solo desplazar los dedos equivale a arrastrar', () => {
    const result = pinchCamera(camera, [{ x: 500, y: 500 }, { x: 700, y: 500 }], [{ x: 540, y: 520 }, { x: 740, y: 520 }], size, limits);
    const dragged = panCamera(camera, { x: 40, y: 20 });
    expect(result.unitsPerPx).toBeCloseTo(camera.unitsPerPx, 8);
    expect(result.centerX).toBeCloseTo(dragged.centerX, 8);
    expect(result.centerY).toBeCloseTo(dragged.centerY, 8);
  });

  it('con dedos superpuestos no produce NaN', () => {
    const result = pinchCamera(camera, [{ x: 500, y: 500 }, { x: 500, y: 500 }], [{ x: 520, y: 500 }, { x: 520, y: 500 }], size, limits);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
    expect(result.unitsPerPx).toBeCloseTo(camera.unitsPerPx, 8);
  });
});

describe('wheelZoomFactor', () => {
  it('acerca al girar hacia arriba y aleja hacia abajo', () => {
    expect(wheelZoomFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0, false)).toBeLessThan(1);
    expect(wheelZoomFactor(0, 0, false)).toBe(1);
  });
  it('convierte líneas y páginas a píxeles', () => {
    expect(wheelZoomFactor(-3, 1, false)).toBeGreaterThan(wheelZoomFactor(-3, 0, false));
    expect(wheelZoomFactor(-1, 2, false)).toBeGreaterThan(wheelZoomFactor(-1, 1, false));
  });
  it('acota el paso a [1/WHEEL_MAX_STEP, WHEEL_MAX_STEP]', () => {
    expect(wheelZoomFactor(-1e6, 0, false)).toBe(WHEEL_MAX_STEP);
    expect(wheelZoomFactor(1e6, 0, false)).toBeCloseTo(1 / WHEEL_MAX_STEP, 12);
    expect(wheelZoomFactor(Number.NaN, 0, false)).toBe(1);
  });
  it('con Ctrl (pellizco del panel táctil) es más sensible', () => {
    expect(wheelZoomFactor(-5, 0, true)).toBeGreaterThan(wheelZoomFactor(-5, 0, false));
  });
});

describe('mapKeyCommand', () => {
  it('traduce flechas a desplazamientos de KEY_PAN_STEP_PX', () => {
    expect(mapKeyCommand('ArrowLeft')).toEqual({ type: 'pan', dx: -KEY_PAN_STEP_PX, dy: 0 });
    expect(mapKeyCommand('ArrowRight')).toEqual({ type: 'pan', dx: KEY_PAN_STEP_PX, dy: 0 });
    expect(mapKeyCommand('ArrowUp')).toEqual({ type: 'pan', dx: 0, dy: -KEY_PAN_STEP_PX });
    expect(mapKeyCommand('ArrowDown')).toEqual({ type: 'pan', dx: 0, dy: KEY_PAN_STEP_PX });
  });
  it('traduce +, =, - y _ a zoom y 0 a reencuadre', () => {
    for (const key of ['+', '=']) expect(mapKeyCommand(key)).toEqual({ type: 'zoom', factor: BUTTON_ZOOM_STEP });
    for (const key of ['-', '_']) expect(mapKeyCommand(key)).toEqual({ type: 'zoom', factor: 1 / BUTTON_ZOOM_STEP });
    expect(mapKeyCommand('0')).toEqual({ type: 'reset' });
  });
  it('devuelve null para otras teclas', () => {
    expect(mapKeyCommand('a')).toBeNull();
    expect(mapKeyCommand('Enter')).toBeNull();
  });
});

describe('canZoom y zoomAnchor', () => {
  const size = SIZES[0];
  const limits = zoomLimits(size);
  it('detecta los topes en cada sentido', () => {
    const base = cameraFromView(FULL_VIEW(size), size);
    expect(canZoom(base, limits, 'in')).toBe(true);
    expect(canZoom(base, limits, 'out')).toBe(true);
    expect(canZoom({ ...base, unitsPerPx: limits.min }, limits, 'in')).toBe(false);
    expect(canZoom({ ...base, unitsPerPx: limits.max }, limits, 'out')).toBe(false);
  });
  it('centra el ancla en la parte visible descontando el panel', () => {
    expect(zoomAnchor(size, 0)).toEqual({ x: 720, y: 540 });
    expect(zoomAnchor(size, 390)).toEqual({ x: 525, y: 540 });
  });
});
