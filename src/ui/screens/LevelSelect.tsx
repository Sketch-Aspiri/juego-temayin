import { WORLDS } from '../../data/worlds';
import type { LevelDef } from '../../engine/level/types';
import { useAppStore } from '../../store/appStore';
import { isUnlocked, totalStars } from '../../store/progress';
import { Stars } from '../components/Stars';
import '../offering.css';

interface LevelCardProps {
  level: LevelDef;
}

function LevelCard({ level }: LevelCardProps) {
  const startLevel = useAppStore((s) => s.startLevel);
  const record = useAppStore((s) => s.progress.levels[level.id]);
  const unlocked = useAppStore((s) => isUnlocked(s.progress, level.id));
  return (
    <button
      type="button"
      className={`level-tile${unlocked ? '' : ' level-tile--locked'}${record ? ' level-tile--done' : ''}`}
      disabled={!unlocked}
      onClick={() => startLevel(level.id)}
    >
      <span className="level-tile__id">{level.id}</span>
      <span className="level-tile__name">{level.name}</span>
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
        {WORLDS.map((w) => (
          <section key={w.id} className="world">
            <h3 className="world__title">Mundo {w.number} · {w.name}</h3>
            <div className="world__grid">
              {w.levels.map((l) => (
                <LevelCard key={l.id} level={l} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
