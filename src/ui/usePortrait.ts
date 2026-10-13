import { useEffect, useState } from 'react';

const PORTRAIT_QUERY = '(max-width: 900px) and (orientation: portrait)';

/** Cambiar la orientación adapta la presentación sin reiniciar la partida ni la escena. */
export function usePortrait(): boolean {
  const [portrait, setPortrait] = useState(() => window.matchMedia(PORTRAIT_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_QUERY);
    const update = (): void => setPortrait(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return portrait;
}
