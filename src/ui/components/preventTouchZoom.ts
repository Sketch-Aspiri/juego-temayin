const ZOOM_EVENTS = ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend', 'dblclick'] as const;

/** Los toques del mando son acciones del juego, no gestos de zoom del navegador. */
export function preventTouchZoom(target: EventTarget): () => void {
  const prevent = (event: Event): void => { if (event.cancelable) event.preventDefault(); };
  // Los eventos táctiles pasivos no permiten cancelar el doble toque en Safari.
  for (const type of ZOOM_EVENTS) target.addEventListener(type, prevent, { passive: false });
  return () => {
    for (const type of ZOOM_EVENTS) target.removeEventListener(type, prevent);
  };
}
