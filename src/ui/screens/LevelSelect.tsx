import { WORLDS } from '../../data/worlds';
import type { LevelDef } from '../../engine/level/types';
import { useAppStore } from '../../store/appStore';
import { isUnlocked, totalStars } from '../../store/progress';
import type { LevelRecord } from '../../store/progress';
import { Stars } from '../components/Stars';
import { TicketIcon } from '../components/TicketIcon';
import '../tickets.css';
import '../offering.css';

/** La campaña completa son 7 tramos del Tren Maya (AGENTS.md §4.3). */
const TOTAL_WORLDS = 7;

interface LevelCardProps {
  level: LevelDef;
  bonus?: boolean;
}

function LevelCard({ level, bonus = false }: LevelCardProps) {
  const startLevel = useAppStore((s) => s.startLevel);
  const record = useAppStore((s) => s.progress.levels[level.id]);
  const unlocked = useAppStore((s) => isUnlocked(s.progress, level.id));
  return <LevelTile level={level} bonus={bonus} unlocked={unlocked} record={record} onPlay={() => startLevel(level.id)} />;
}

interface LevelTileProps extends LevelCardProps {
  unlocked: boolean;
  record?: LevelRecord;
  onPlay: () => void;
}

export function LevelTile({ level, bonus = false, unlocked, record, onPlay }: LevelTileProps) {
  return (
    <button
      type="button"
      className={`level-tile${unlocked ? '' : ' level-tile--locked'}${record ? ' level-tile--done' : ''}${bonus ? ' level-tile--secret' : ''}`}
      disabled={!unlocked}
      onClick={onPlay}
    >
      <span className="level-tile__id">{bonus ? 'DESVÍO SECRETO' : level.id}</span>
      {bonus && <TicketIcon />}
      <span className="level-tile__name">{bonus && !unlocked ? 'Destino secreto' : level.name}</span>
      {bonus && <span className="level-tile__secret">{unlocked ? 'Boleto encontrado · ¡A explorar!' : 'Encuentra el boleto de este mundo'}</span>}
      {level.boss && <span className="level-tile__badge">JEFE</span>}
      {unlocked ? <Stars value={record?.stars ?? 0} /> : <span className="level-tile__lock" aria-label="Bloqueado">🔒</span>}
      {record && <span className="level-tile__best">Mejor: {record.bestScore}</span>}
    </button>
  );
}

export function LevelSelect() {
  const go = useAppStore((s) => s.go);
  const stars = useAppStore((s) => totalStars(s.progress));
  const cacao = useAppStore(s => s.wallet.cacao);
  return (
    <main className="menu">
      <header className="menu__header">
        <button type="button" className="btn btn--ghost" onClick={() => go('title')}>← Volver</button>
        <h2>Elige tu nivel</h2>
        <div className="menu__treasures"><span className="menu__stars">★ {stars}</span><span className="menu__wallet">CACAO · {cacao}</span></div>
      </header>
      <div className="menu__body">
        <p className="ticket-guide">Hay un boleto del Tren Maya escondido en cada mundo. Encuéntralo para abrir su nivel secreto.</p>
        {WORLDS.map((w) => (
          <section key={w.id} className="world">
            <h3 className="world__title">Mundo {w.number} · {w.name}</h3>
            <div className="world__grid">
              {w.levels.map((l) => (
                <LevelCard key={l.id} level={l} />
              ))}
              {w.bonus && <LevelCard level={w.bonus} bonus />}
            </div>
          </section>
        ))}
        {WORLDS.length < TOTAL_WORLDS && (
          <p className="world world--soon">
            {WORLDS.length === TOTAL_WORLDS - 1 ? 'Falta 1 mundo' : `Faltan ${TOTAL_WORLDS - WORLDS.length} mundos`} · Próximamente
          </p>
        )}
      </div>
    </main>
  );
}
