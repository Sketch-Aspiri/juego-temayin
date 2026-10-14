import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { ALL_CINEMATICS, type CinematicDef } from '../../data/cinematics';
import { getLevel } from '../../data/worlds';
import { assetUrl } from '../../engine/assets';
import { useAppStore } from '../../store/appStore';
import { isCinematicUnlocked } from '../../store/cinematics';
import type { Progress } from '../../store/progress';
import { CinematicPlayer } from '../components/CinematicPlayer';
import { SpriteFrame } from '../components/SpriteFrame';

interface HistoryCardProps {
  cinematic: CinematicDef;
  unlocked: boolean;
  onPlay: (cinematic: CinematicDef) => void;
}

export function HistoryCard({ cinematic, unlocked, onPlay }: HistoryCardProps) {
  const level = cinematic.afterLevel && getLevel(cinematic.afterLevel);
  return (
    <article className={`history-card${unlocked ? '' : ' history-card--locked'}`} aria-labelledby={`chapter-${cinematic.id}`}>
      <div className="history-card__cover" style={{ backgroundImage: `url(${assetUrl(cinematic.cover.background)})` }}>
        <SpriteFrame sprite={cinematic.cover.actor} className="history-card__actor" />
        <span className="history-card__badge">{unlocked ? 'Disponible' : 'Por descubrir'}</span>
        <span className="history-card__chapter">{cinematic.chapter}</span>
      </div>
      <div className="history-card__body">
        <h2 id={`chapter-${cinematic.id}`}>{cinematic.title}</h2>
        <p>{cinematic.description}</p>
        <p className="history-card__requirement">
          {unlocked ? `${cinematic.scenes.length} escenas · Puedes verla cuando quieras`
            : `Completa ${cinematic.afterLevel} · ${level ? level.name : 'el nivel'} para verla.`}
        </p>
        <button type="button" className={`btn${unlocked ? ' btn--primary' : ''}`} disabled={!unlocked}
          data-cinematic={cinematic.id} aria-label={`${unlocked ? 'Ver' : 'Bloqueada'}: ${cinematic.title}`} onClick={() => onPlay(cinematic)}>
          <span aria-hidden="true">{unlocked ? '▶' : '◆'}</span> {unlocked ? 'Ver cinemática' : 'Bloqueada'}
        </button>
      </div>
    </article>
  );
}

export function HistoryScreen() {
  const progress = useAppStore(s => s.progress);
  const go = useAppStore(s => s.go);
  const updateSettings = useAppStore(s => s.updateSettings);
  const [selected, setSelected] = useState<CinematicDef | null>(null);
  const lastPlayed = useRef<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const finish = useCallback(() => {
    if (selected?.id === 'intro') updateSettings({ introSeen: true });
    setSelected(null);
  }, [selected, updateSettings]);
  useEffect(() => {
    if (selected) return;
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button');
    const target = Array.from(buttons ?? []).find(button => button.dataset.cinematic === lastPlayed.current);
    (target ?? buttons?.[0])?.focus();
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') go('title'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, go]);
  const play = (cinematic: CinematicDef): void => {
    if (!isCinematicUnlocked(progress, cinematic)) return;
    lastPlayed.current = cinematic.id;
    setSelected(cinematic);
  };
  if (selected) return <CinematicPlayer key={selected.id} cinematic={selected} onFinish={finish} finishLabel="Volver a Historia" />;
  return <HistoryMenu progress={progress} menuRef={menuRef} onPlay={play} onBack={() => go('title')} />;
}

interface HistoryMenuProps {
  progress: Progress;
  menuRef: RefObject<HTMLElement | null>;
  onPlay: (cinematic: CinematicDef) => void;
  onBack: () => void;
}

function HistoryMenu({ progress, menuRef, onPlay, onBack }: HistoryMenuProps) {
  const available = ALL_CINEMATICS.filter(cinematic => isCinematicUnlocked(progress, cinematic)).length;
  return (
    <main className="history" ref={menuRef}>
      <div className="history__content">
        <header className="history__header">
          <button type="button" className="btn btn--ghost" onClick={onBack}>← Volver al menú</button>
          <span className="history__count">{available} de {ALL_CINEMATICS.length} disponibles</span>
        </header>
        <div className="history__heading">
          <p className="history__eyebrow">El viaje del jaguar</p>
          <h1>Historia</h1>
          <p>Cada victoria abre un nuevo capítulo. Revive tu aventura.</p>
        </div>
        <div className="history__chapters">
          {ALL_CINEMATICS.map(cinematic => <HistoryCard key={cinematic.id} cinematic={cinematic}
            unlocked={isCinematicUnlocked(progress, cinematic)} onPlay={onPlay} />)}
        </div>
        <p className="history__future">El viaje continúa. Las nuevas cinemáticas aparecerán aquí conforme se añadan a la aventura.</p>
      </div>
    </main>
  );
}
