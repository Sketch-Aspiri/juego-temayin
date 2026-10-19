import { useEffect, useState } from 'react';
import type { ScreenSize } from './mapGestures';

const FALLBACK_SIZE: ScreenSize = { width: 1440, height: 900 };

/** Tamaño de la ventana; sin `window` (pruebas sin DOM) usa un escritorio típico. */
export function useMapViewport(): ScreenSize {
  const [size, setSize] = useState<ScreenSize>(() =>
    typeof window === 'undefined' ? FALLBACK_SIZE : { width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    // Sin cambio real se devuelve el mismo objeto: evita renders y recálculos por eventos de resize repetidos.
    const resize = () => setSize(previous => previous.width === window.innerWidth && previous.height === window.innerHeight
      ? previous : { width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return size;
}
