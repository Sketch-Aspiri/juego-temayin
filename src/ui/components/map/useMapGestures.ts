import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import {
  cameraFromView, canZoom, clampCamera, mapKeyCommand, panCamera, viewFromCamera, zoomAnchor, zoomAtPoint, zoomLimits,
  type MapCamera, type ScreenSize,
} from './mapGestures';
import { attachMapListeners } from './mapListeners';
import { IDLE_SESSION, type MapPointerSession } from './mapPointerSession';
import type { MapView } from './mapModel';

export interface MapGestureOptions {
  /** Encuadre por defecto; la cámara lo sigue mientras no se personalice. */
  base: MapView;
  /** Al cambiar, la cámara vuelve al encuadre (cambio de tramo o de vista). */
  frameKey: number;
  viewport: ScreenSize;
  /** Ancho que el panel lateral quita al mapa visible; centra el zoom por botón. */
  sidePanel: number;
}

export interface MapGestures {
  view: MapView;
  customized: boolean;
  gesturing: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  atlasRef: RefObject<HTMLDivElement | null>;
  zoomBy: (factor: number) => void;
  reset: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function useMapGestures({ base, frameKey, viewport, sidePanel }: MapGestureOptions): MapGestures {
  const [camera, setCamera] = useState<MapCamera | null>(null);
  const [appliedKey, setAppliedKey] = useState(frameKey);
  const [gesturing, setGesturing] = useState(false);
  const atlasRef = useRef<HTMLDivElement>(null);
  // Los topes solo cambian con el tamaño de la ventana: se calculan una vez por tamaño, no por evento.
  const limits = useMemo(() => zoomLimits(viewport), [viewport]);
  const latest = useRef({ base, viewport, sidePanel, limits });
  const live = useRef<MapCamera | null>(null); // cámara más reciente, aún sin publicar si hay un fotograma pendiente
  const session = useRef<MapPointerSession>(IDLE_SESSION);
  const frame = useRef<number | null>(null);

  // Cambiar de encuadre descarta la cámara libre en el mismo render, sin parpadeo del encuadre anterior.
  if (appliedKey !== frameKey) { setAppliedKey(frameKey); setCamera(null); }
  useEffect(() => { latest.current = { base, viewport, sidePanel, limits }; });

  const current = useCallback((): MapCamera => live.current ?? cameraFromView(latest.current.base, latest.current.viewport), []);
  const commit = useCallback((next: MapCamera) => {
    live.current = clampCamera(next, latest.current.limits);
    // Un solo setState por fotograma: el arrastre llega a más de 100 eventos por segundo.
    if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; setCamera(live.current); });
  }, []);
  const resetCamera = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null; live.current = null; session.current = IDLE_SESSION;
    setCamera(null); setGesturing(false);
  }, []);
  useEffect(resetCamera, [frameKey, resetCamera]);

  const zoomBy = useCallback((factor: number) => {
    const { viewport: size, sidePanel: inset, limits: bounds } = latest.current;
    commit(zoomAtPoint(current(), zoomAnchor(size, inset), factor, size, bounds));
  }, [commit, current]);

  useEffect(() => {
    const element = atlasRef.current;
    if (!element) return;
    const detach = attachMapListeners(element, {
      getSession: () => session.current, setSession: next => { session.current = next; },
      getViewport: () => latest.current.viewport, getLimits: () => latest.current.limits,
      current, commit, setGesturing,
    });
    return () => {
      detach();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [commit, current]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    // Las teclas pulsadas sobre un botón de estación o de zoom son suyas, no mueven el mapa.
    if (event.target !== event.currentTarget) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const command = mapKeyCommand(event.key);
    if (!command) return;
    event.preventDefault();
    if (command.type === 'reset') resetCamera();
    else if (command.type === 'zoom') zoomBy(command.factor);
    else commit(panCamera(current(), { x: -command.dx, y: -command.dy }));
  }, [commit, current, resetCamera, zoomBy]);

  // Tras redimensionar se conserva la cámara y se vuelve a acotar con los topes del nuevo tamaño.
  const free = camera ? clampCamera(camera, limits) : null;
  const shown = free ?? cameraFromView(base, viewport);
  return {
    view: free ? viewFromCamera(free, viewport) : base, customized: free !== null, gesturing,
    canZoomIn: canZoom(shown, limits, 'in'), canZoomOut: canZoom(shown, limits, 'out'),
    atlasRef, zoomBy, reset: resetCamera, onKeyDown,
  };
}
