import { useEffect, useRef } from 'react';
import { assetUrl } from '../../engine/assets';
import { VH, VW } from '../../engine/constants';
import { Renderer } from '../../engine/render/Renderer';
import { hiScore } from '../../store/progress';
import { useAppStore } from '../../store/appStore';
import { useAssets } from '../assetsContext';

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
          <h1 className="logo">TEMAYIN</h1>
          <p className="logo__sub">La Aventura del Jaguar</p>
          <nav className="title__menu" aria-label="Menú principal">
            <button type="button" className="btn btn--primary btn--big" onClick={() => go('levels')} autoFocus>Jugar</button>
            <button type="button" className="btn" onClick={() => go('settings')}>Ajustes</button>
          </nav>
          <ul className="controls-help">
            <li><kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> moverse</li>
            <li><kbd>Espacio</kbd> / <kbd>↑</kbd> / <kbd>Z</kbd> saltar</li>
            <li><kbd>Shift</kbd> / <kbd>X</kbd> correr</li>
            <li><kbd>C</kbd> / <kbd>F</kbd> bola de fuego (con el chile)</li>
            <li><kbd>P</kbd> pausa · <kbd>M</kbd> silencio</li>
          </ul>
          {best > 0 && <p className="title__record">RÉCORD: {best}</p>}
        </div>
        <img className="title__jaguar" src={assetUrl('jaguar_titulo.png')} alt="Temayin, el jaguar aventurero" />
      </div>
    </main>
  );
}
