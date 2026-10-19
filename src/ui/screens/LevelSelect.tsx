import { useEffect, useState, type CSSProperties } from 'react';
import { useAppStore } from '../../store/appStore';
import { totalStars } from '../../store/progress';
import { PeninsulaMap } from './PeninsulaMap';
import { MAP_COVER_MS, MAP_REVEAL_MS, MapCurtain } from '../components/map/MapCurtain';
import '../tickets.css';
import '../offering.css';

export { LevelTile } from '../components/LevelTile';

export function LevelSelect() {
  const go = useAppStore(state => state.go);
  const startLevel = useAppStore(state => state.startLevel);
  const stars = useAppStore(state => totalStars(state.progress));
  const cacao = useAppStore(state => state.wallet.cacao);
  const [exitAction, setExitAction] = useState<(() => void) | null>(null);
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setEntering(false), reduced ? 0 : MAP_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!exitAction) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(exitAction, reduced ? 0 : MAP_COVER_MS);
    return () => window.clearTimeout(timer);
  }, [exitAction]);
  return <main className={`menu level-map-menu${exitAction ? ' level-map-menu--leaving' : ''}`} inert={entering || !!exitAction}
    aria-busy={entering || !!exitAction} style={{ '--map-reveal-duration': `${MAP_REVEAL_MS}ms`, '--map-cover-duration': `${MAP_COVER_MS}ms` } as CSSProperties}>
    <MapCurtain />
    <header className="menu__header">
      <button type="button" className="btn btn--ghost" disabled={!!exitAction} onClick={() => setExitAction(() => () => go('title'))}>← Volver</button>
      <h2>Elige tu nivel</h2>
      <div className="menu__treasures"><span className="menu__stars">★ {stars}</span><span className="menu__wallet">CACAO · {cacao}</span></div>
    </header>
    <div className="menu__body level-map-menu__body">
      <PeninsulaMap onPlay={id => setExitAction(() => () => startLevel(id))} />
    </div>
  </main>;
}
