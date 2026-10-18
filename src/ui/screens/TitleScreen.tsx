import { useEffect, useRef } from 'react';
import { assetUrl } from '../../engine/assets';
import { VH, VW } from '../../engine/constants';
import { Renderer } from '../../engine/render/Renderer';
import { hiScore } from '../../store/progress';
import { useAppStore } from '../../store/appStore';
import { ControlsHelp } from '../components/ControlsHelp';
import { useAssets } from '../assetsContext';
import { VersionNote } from '../components/VersionNote';

const SCROLL_SPEED = 0.05; // píxeles de cámara por milisegundo

/** Fondo animado: reutiliza el renderer del juego para el escenario con parallax. */
function Backdrop() {
  const assets = useAssets();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new Renderer(canvas, assets);
    let raf = 0;
    const tick = (now: number): void => {
      renderer.drawBackdrop('jungle', now * SCROLL_SPEED, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [assets]);
  return <canvas ref={ref} className="title__backdrop" width={VW} height={VH} aria-hidden="true" />;
}

export function TitleScreen() {
  const go = useAppStore((s) => s.go);
  const best = useAppStore((s) => hiScore(s.progress));
  return (
    <main className="title">
      <Backdrop />
      <div className="title__content">
        <div className="title__panel">
          <h1 className="logo" aria-label="Temayin">
            <span className="logo__depth" aria-hidden="true">TEMAYIN</span>
            <span className="logo__face" aria-hidden="true">TEMAYIN</span>
          </h1>
          <p className="logo__sub">La Aventura del Jaguar</p>
          <nav className="title__menu" aria-label="Menú principal">
            <button type="button" className="btn btn--primary btn--big" onClick={() => go('levels')} autoFocus>Jugar</button>
            <button type="button" className="btn" onClick={() => go('history')}>Historia</button>
            <button type="button" className="btn" onClick={() => go('settings')}>Ajustes</button>
          </nav>
          <ControlsHelp />
          {best > 0 && <p className="title__record">RÉCORD: {best}</p>}
          <VersionNote />
        </div>
        <img className="title__jaguar" src={assetUrl('jaguar_titulo.webp')} alt="Temayin, el jaguar aventurero" />
      </div>
    </main>
  );
}
