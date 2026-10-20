import { assetUrl } from '../../engine/assets';
import { hiScore } from '../../store/progress';
import { useAppStore } from '../../store/appStore';
import { VersionNote } from '../components/VersionNote';
import { NotebookButton } from '../components/notebook/NotebookButton';

export function TitleScreen() {
  const go = useAppStore((s) => s.go);
  const best = useAppStore((s) => hiScore(s.progress));
  return (
    <main className="title title--hanal">
      <img className="title__backdrop" src={assetUrl('portada/palenque-hanal-pixan.webp')} alt="" aria-hidden="true" />
      <div className="title__fireflies" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="title__content">
        <div className="title__panel">
          <p className="title__celebration">Una noche de <strong>Hanal Pixán</strong></p>
          <h1 className="logo" aria-label="Temayin">
            <span className="logo__depth" aria-hidden="true">TEMAYIN</span>
            <span className="logo__face" aria-hidden="true">TEMAYIN</span>
          </h1>
          <p className="logo__sub">La Aventura del Jaguar</p>
          <nav className="title__menu" aria-label="Menú principal">
            <button type="button" className="btn btn--primary btn--big" onClick={() => go('levels')} autoFocus>Jugar</button>
            <button type="button" className="btn" onClick={() => go('history')}>Historia</button>
            <NotebookButton />
            <button type="button" className="btn" onClick={() => go('tutorial')}>Cómo jugar</button>
            <button type="button" className="btn" onClick={() => go('settings')}>Ajustes</button>
          </nav>
          {best > 0 && <p className="title__record">RÉCORD: {best}</p>}
          <details className="title__version">
            <summary>Notas de versión</summary>
            <div className="title__version-popover"><VersionNote /></div>
          </details>
        </div>
        <div className="title__portrait">
          <img className="title__jaguar" src={assetUrl('portada/temayin-alebrije.webp')} alt="Temayin alebrije, con flores y colores de Día de Muertos" width="1254" height="1254" />
          <p className="title__place">Palenque <span>·</span> Chiapas</p>
        </div>
      </div>
    </main>
  );
}
