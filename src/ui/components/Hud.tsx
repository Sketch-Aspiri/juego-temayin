import { assetUrl } from '../../engine/assets';
import type { HudState } from '../../engine/hud';

const LOW_TIME = 30;
/** Fracción de oxígeno por debajo de la cual la barra avisa en rojo. */
const LOW_OXYGEN = 0.3;

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
      {hud.oxygen !== null && <OxygenBar ratio={hud.oxygen} />}
      <div className="hud__lives">
        <div className="hud__powers">
          {hud.shield && <span title="Escudo" aria-label="Escudo activo">🛡️</span>}
          {hud.fire && <span title="Chile de fuego" aria-label="Fuego activo">🌶️</span>}
          {hud.snorkel && <span title="Snorkel" aria-label="Snorkel activo">🤿</span>}
          {hud.ball && <span title="Pelota de pok ta pok" aria-label="Pelota de pok ta pok">⚫</span>}
        </div>
        <span
          className="life-icon"
          style={{ backgroundImage: `url(${assetUrl('guepardo.webp')})` }}
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

interface OxygenBarProps {
  /** Oxígeno restante 0..1. */
  ratio: number;
}

/** Barra de oxígeno: solo aparece con el jugador en el agua. */
function OxygenBar({ ratio }: OxygenBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const low = ratio <= LOW_OXYGEN;
  return (
    <div className="stat">
      <span className="stat__label">OXÍGENO</span>
      <span
        role="meter"
        aria-label="Oxígeno"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{
          display: 'block',
          width: 96,
          height: 12,
          marginTop: 4,
          borderRadius: 6,
          border: '2px solid rgba(255,255,255,.85)',
          background: 'rgba(0,0,0,.35)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            background: low ? '#ff5e5b' : '#7fe6f0',
            transition: 'width 120ms linear',
          }}
        />
      </span>
    </div>
  );
}
