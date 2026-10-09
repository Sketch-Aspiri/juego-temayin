import { assetUrl } from '../../engine/assets';
import type { HudState } from '../../engine/hud';

const LOW_TIME = 30;

interface HudProps {
  hud: HudState;
}

export function Hud({ hud }: HudProps) {
  return (
    <div className="hud" aria-live="off">
      <Stat label="PUNTOS" value={String(hud.score).padStart(6, '0')} />
      <Stat label="MONEDAS" value={`× ${String(hud.coins).padStart(2, '0')}`} />
      <Stat label="MUNDO" value={hud.levelId} />
      <Stat label="TIEMPO" value={String(hud.time)} warn={hud.time <= LOW_TIME} />
      <div className="hud__lives">
        <div className="hud__powers">
          {hud.shield && <span title="Escudo" aria-label="Escudo activo">🛡️</span>}
          {hud.fire && <span title="Chile de fuego" aria-label="Fuego activo">🌶️</span>}
        </div>
        <span
          className="life-icon"
          style={{ backgroundImage: `url(${assetUrl('guepardo.png')})` }}
          role="img"
          aria-label="Vidas"
        />
        <span className="stat__value">× {hud.lives}</span>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  warn?: boolean;
}

function Stat({ label, value, warn }: StatProps) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={warn ? 'stat__value stat__value--warn' : 'stat__value'}>{value}</span>
    </div>
  );
}
