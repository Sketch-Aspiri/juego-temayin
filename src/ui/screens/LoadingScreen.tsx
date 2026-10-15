import { SPRITES } from '../../data/intro';
import { SpriteFrame } from '../components/SpriteFrame';
import './LoadingScreen.css';

/** La escena acompaña la carga real: no añade esperas ni simula porcentajes. */
export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-labelledby="loading-title">
      <div className="loading-screen__content">
        <header className="loading-screen__heading">
          <span className="loading-screen__eyebrow">El viaje está por comenzar</span>
          <span className="loading-screen__brand">Temayin</span>
          <span className="loading-screen__subtitle">La aventura del jaguar</span>
        </header>

        <div className="loading-screen__scene" aria-hidden="true">
          <div className="loading-screen__sun" />
          <div className="loading-screen__landscape" />
          <div className="loading-screen__mist" />
          <div className="loading-screen__railway"><div className="loading-screen__sleepers" /></div>
          <div className="loading-screen__train-motion">
            <SpriteFrame sprite={SPRITES.train} className="loading-screen__train" />
          </div>
          <div className="loading-screen__foreground" />
        </div>

        <div className="loading-screen__status" role="status" aria-live="polite" aria-atomic="true">
          <h1 id="loading-title">Preparando tu aventura…</h1>
          <p>La selva te espera. ¡Todos a bordo!</p>
        </div>
        <div className="loading-screen__route" aria-hidden="true">
          <span /><i /><span /><i /><span />
        </div>
        <p className="loading-screen__destination">Un viaje por el mundo del Tren Maya</p>
      </div>
    </main>
  );
}
