import { panCamera, pinchCamera, wheelZoomFactor, zoomAtPoint, TAP_SLOP_PX, type MapCamera, type ScreenPoint, type ScreenSize, type ZoomLimits } from './mapGestures';
import { pointerCancel, pointerDown, pointerMove, pointerUp, type MapPointerSession, type PointerStep } from './mapPointerSession';

/** Lo que el controlador necesita del hook; todo se consulta en el momento para no capturar valores viejos. */
export interface MapListenerDeps {
  getSession: () => MapPointerSession;
  setSession: (session: MapPointerSession) => void;
  getViewport: () => ScreenSize;
  getLimits: () => ZoomLimits;
  current: () => MapCamera;
  commit: (camera: MapCamera) => void;
  setGesturing: (active: boolean) => void;
}

/** Si tras el arrastre no llega clic (pointercancel, soltar fuera), el supresor se desarma solo. */
const CLICK_SUPPRESS_MS = 50;

function capturePointer(element: Element, pointerId: number): void {
  try { element.setPointerCapture(pointerId); } catch {
    // El puntero ya se soltó: el arrastre continúa con los eventos normales, no es un error.
  }
}

/** El clic que sigue a un arrastre se traga una sola vez para no seleccionar la estación bajo el dedo. */
function createClickSuppressor(element: HTMLElement) {
  let disarm: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const swallow = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
  const clear = () => {
    disarm?.(); disarm = null;
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const arm = () => {
    clear();
    element.addEventListener('click', swallow, { capture: true, once: true });
    disarm = () => element.removeEventListener('click', swallow, true);
    timer = setTimeout(clear, CLICK_SUPPRESS_MS);
  };
  return { arm, clear };
}

/**
 * Conecta ratón, tacto y rueda al atlas y devuelve la limpieza. Los eventos son nativos
 * (no pasivos) para poder cancelar el scroll y el zoom del navegador.
 */
export function attachMapListeners(element: HTMLElement, deps: MapListenerDeps): () => void {
  const suppressor = createClickSuppressor(element);
  // Rectángulo en caché: leerlo en cada move/wheel fuerza un reflujo por evento.
  let rect = element.getBoundingClientRect();
  const refreshRect = () => { rect = element.getBoundingClientRect(); };
  const pointAt = (event: MouseEvent): ScreenPoint => ({ x: event.clientX - rect.left, y: event.clientY - rect.top });

  const apply = ({ session, effect }: PointerStep) => {
    deps.setSession(session);
    if (effect.kind === 'begin-drag') {
      capturePointer(element, effect.pointerId); deps.setGesturing(true); deps.commit(panCamera(deps.current(), effect.delta));
    } else if (effect.kind === 'pan') deps.commit(panCamera(deps.current(), effect.delta));
    else if (effect.kind === 'pinch-start') deps.setGesturing(true);
    else if (effect.kind === 'pinch') {
      deps.commit(pinchCamera(deps.current(), effect.previous, effect.current, deps.getViewport(), deps.getLimits()));
    } else if (effect.kind === 'end') { deps.setGesturing(false); if (effect.suppressClick) suppressor.arm(); }
  };
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    refreshRect();
    suppressor.clear();
    apply(pointerDown(deps.getSession(), event.pointerId, pointAt(event)));
  };
  const onMove = (event: PointerEvent) => {
    // Un ratón soltado fuera de la ventana sin captura no avisa: sin botones pulsados, se da por soltado.
    if (event.pointerType === 'mouse' && event.buttons === 0) return apply(pointerUp(deps.getSession(), event.pointerId));
    apply(pointerMove(deps.getSession(), event.pointerId, pointAt(event), TAP_SLOP_PX));
  };
  const onUp = (event: PointerEvent) => apply(pointerUp(deps.getSession(), event.pointerId));
  const onCancel = () => apply(pointerCancel(deps.getSession()));
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const factor = wheelZoomFactor(event.deltaY, event.deltaMode, event.ctrlKey);
    deps.commit(zoomAtPoint(deps.current(), pointAt(event), factor, deps.getViewport(), deps.getLimits()));
  };

  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refreshRect);
  observer?.observe(element);
  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onCancel);
  element.addEventListener('lostpointercapture', onUp);
  element.addEventListener('keydown', suppressor.clear);
  element.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    observer?.disconnect();
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', onCancel);
    element.removeEventListener('lostpointercapture', onUp);
    element.removeEventListener('keydown', suppressor.clear);
    element.removeEventListener('wheel', onWheel);
    suppressor.clear();
  };
}
