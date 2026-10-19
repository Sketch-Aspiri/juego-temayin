import { fitMapView, FULL_MAP, sidePanelInset, type MapView } from './mapModel';

/** Punto en píxeles de pantalla relativo a la esquina superior izquierda del atlas. */
export interface ScreenPoint { readonly x: number; readonly y: number }
export interface ScreenSize { readonly width: number; readonly height: number }
/** Cámara del mapa: centro en unidades del mapa y escala en unidades por píxel de pantalla. */
export interface MapCamera { readonly centerX: number; readonly centerY: number; readonly unitsPerPx: number }
/** Topes de `unitsPerPx`: `min` = máximo acercamiento, `max` = máximo alejamiento. */
export interface ZoomLimits { readonly min: number; readonly max: number }
export type ZoomDirection = 'in' | 'out';
export type MapKeyCommand =
  | { readonly type: 'pan'; readonly dx: number; readonly dy: number }
  | { readonly type: 'zoom'; readonly factor: number }
  | { readonly type: 'reset' };

/** Un toque que se mueve menos que esto sigue siendo un toque (no arrastre). */
export const TAP_SLOP_PX = 8;
/** Acercamiento máximo respecto al encuadre de la península completa. */
export const MAX_ZOOM_IN = 8;
/** Alejamiento máximo respecto al encuadre más holgado (con panel abierto). */
export const MAX_ZOOM_OUT = 1.25;
export const BUTTON_ZOOM_STEP = 1.5;
export const KEY_PAN_STEP_PX = 80;
export const WHEEL_ZOOM_RATE = 0.002;
export const WHEEL_MAX_STEP = 2;
// Los navegadores informan la rueda en líneas o páginas según el dispositivo.
const WHEEL_LINE_PX = 16;
const WHEEL_PAGE_PX = 400;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;
// El pellizco del panel táctil llega como rueda con Ctrl y deltas diminutos.
const CTRL_WHEEL_BOOST = 10;
const ZOOM_EPSILON = 1e-6;

const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : (min + max) / 2;

export function cameraFromView(view: MapView, size: ScreenSize): MapCamera {
  return { centerX: view.x + view.width / 2, centerY: view.y + view.height / 2, unitsPerPx: view.width / size.width };
}

export function viewFromCamera(camera: MapCamera, size: ScreenSize): MapView {
  const width = size.width * camera.unitsPerPx, height = size.height * camera.unitsPerPx;
  return { x: camera.centerX - width / 2, y: camera.centerY - height / 2, width, height };
}

/** Topes relativos al encuadre de la península; el máximo cubre también el encuadre con el panel abierto. */
export function zoomLimits(size: ScreenSize): ZoomLimits {
  const open = fitMapView(FULL_MAP, size.width, size.height).width / size.width;
  const withPanel = fitMapView(FULL_MAP, size.width, size.height, sidePanelInset(size.width, true)).width / size.width;
  return { min: open / MAX_ZOOM_IN, max: Math.max(open, withPanel) * MAX_ZOOM_OUT };
}

/** Escala dentro de los topes y centro dentro de la península; no toca los encuadres por defecto. */
export function clampCamera(camera: MapCamera, limits: ZoomLimits): MapCamera {
  return {
    centerX: clamp(camera.centerX, FULL_MAP.x, FULL_MAP.x + FULL_MAP.width),
    centerY: clamp(camera.centerY, FULL_MAP.y, FULL_MAP.y + FULL_MAP.height),
    unitsPerPx: clamp(camera.unitsPerPx, limits.min, limits.max),
  };
}

/** Arrastrar el contenido `delta` px mueve el centro en sentido contrario. */
export function panCamera(camera: MapCamera, delta: ScreenPoint): MapCamera {
  return { ...camera, centerX: camera.centerX - delta.x * camera.unitsPerPx, centerY: camera.centerY - delta.y * camera.unitsPerPx };
}

/** `factor` > 1 acerca. La escala se limita primero y después se recoloca para fijar el punto bajo el ancla. */
export function zoomAtPoint(camera: MapCamera, anchor: ScreenPoint, factor: number, size: ScreenSize, limits: ZoomLimits): MapCamera {
  const unitsPerPx = clamp(camera.unitsPerPx / factor, limits.min, limits.max);
  const offsetX = anchor.x - size.width / 2, offsetY = anchor.y - size.height / 2;
  return {
    unitsPerPx,
    centerX: camera.centerX + offsetX * (camera.unitsPerPx - unitsPerPx),
    centerY: camera.centerY + offsetY * (camera.unitsPerPx - unitsPerPx),
  };
}

type Touches = readonly [ScreenPoint, ScreenPoint];
const midpoint = ([a, b]: Touches): ScreenPoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = ([a, b]: Touches): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Zoom por la razón de distancias entre dedos más el desplazamiento de su punto medio. */
export function pinchCamera(camera: MapCamera, previous: Touches, current: Touches, size: ScreenSize, limits: ZoomLimits): MapCamera {
  const before = distance(previous), after = distance(current);
  const factor = before > 0 && after > 0 ? after / before : 1;
  const start = midpoint(previous), end = midpoint(current);
  const zoomed = zoomAtPoint(camera, start, factor, size, limits);
  return panCamera(zoomed, { x: end.x - start.x, y: end.y - start.y });
}

/** Factor de zoom de un evento de rueda (> 1 acerca), acotado por paso. */
export function wheelZoomFactor(deltaY: number, deltaMode: number, ctrlKey: boolean): number {
  if (!Number.isFinite(deltaY)) return 1;
  const unit = deltaMode === DOM_DELTA_PAGE ? WHEEL_PAGE_PX : deltaMode === DOM_DELTA_LINE ? WHEEL_LINE_PX : 1;
  const rate = ctrlKey ? WHEEL_ZOOM_RATE * CTRL_WHEEL_BOOST : WHEEL_ZOOM_RATE;
  // exp puede desbordar a Infinity con deltas enormes: se acota directamente, sin `clamp`.
  return Math.min(WHEEL_MAX_STEP, Math.max(1 / WHEEL_MAX_STEP, Math.exp(-deltaY * unit * rate)));
}

const ARROW_STEPS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

/** Tecla -> orden del mapa. `pan` es cuánto se desplaza el encuadre (no el contenido). */
export function mapKeyCommand(key: string): MapKeyCommand | null {
  const arrow = ARROW_STEPS[key];
  if (arrow) return { type: 'pan', dx: arrow[0] * KEY_PAN_STEP_PX, dy: arrow[1] * KEY_PAN_STEP_PX };
  if (key === '+' || key === '=') return { type: 'zoom', factor: BUTTON_ZOOM_STEP };
  if (key === '-' || key === '_') return { type: 'zoom', factor: 1 / BUTTON_ZOOM_STEP };
  return key === '0' ? { type: 'reset' } : null;
}

export function canZoom(camera: MapCamera, limits: ZoomLimits, direction: ZoomDirection): boolean {
  return direction === 'in' ? camera.unitsPerPx > limits.min * (1 + ZOOM_EPSILON) : camera.unitsPerPx < limits.max * (1 - ZOOM_EPSILON);
}

/** Centro de la parte visible del mapa (descontando el panel lateral). */
export function zoomAnchor(size: ScreenSize, rightInset: number): ScreenPoint {
  return { x: (size.width - rightInset) / 2, y: size.height / 2 };
}
