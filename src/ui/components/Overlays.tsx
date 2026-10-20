import { useEffect, useRef, type ReactNode } from 'react';
import type { LevelResult } from '../../engine/scoring';
import { Stars } from './Stars';
import { HANAL_REWARD } from '../../data/hanalReward';
import { HanalReward } from './HanalReward';
import { NotebookButton } from './notebook/NotebookButton';

interface PanelProps {
  title: string;
  tone?: 'default' | 'win' | 'lose';
  children: ReactNode;
}

/** Panel modal; enfoca el primer botón para poder usar el teclado. */
function Panel({ title, tone = 'default', children }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`panel panel--${tone}`} ref={ref}>
        <h2 className="panel__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PauseMenu({ onResume, onRestart, onExit }: PauseMenuProps) {
  return (
    <Panel title="PAUSA">
      <div className="panel__actions">
        <button type="button" className="btn btn--primary" onClick={onResume}>Continuar</button>
        <NotebookButton />
        <button type="button" className="btn" onClick={onRestart}>Reiniciar nivel</button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>Salir al menú</button>
      </div>
    </Panel>
  );
}

interface LevelCompleteProps {
  result: LevelResult;
  levelName: string;
  hasNext: boolean;
  isBonus?: boolean;
  isSeasonal?: boolean;
  discoveryCount?: number;
  onNext: () => void;
  onRetry: () => void;
  onExit: () => void;
}

export function LevelComplete({ result, levelName, hasNext, isBonus, isSeasonal, discoveryCount = 0, onNext, onRetry, onExit }: LevelCompleteProps) {
  return (
    <Panel title="¡NIVEL COMPLETADO!" tone="win">
      <p className="panel__sub">{isSeasonal ? 'Especial de temporada' : result.levelId} · {levelName}</p>
      <Stars value={result.stars} />
      <dl className="panel__stats">
        <div><dt>Puntos</dt><dd>{result.score}</dd></div>
        <div><dt>Cacao recogido</dt><dd>{Math.round(result.coinRatio * 100)}%</dd></div>
        <div><dt>Muertes</dt><dd>{result.deaths}</dd></div>
      </dl>
      {result.levelId === HANAL_REWARD.levelId && <HanalReward />}
      {discoveryCount > 0 && <div className="panel__sub"><p>{discoveryCount} {discoveryCount === 1 ? 'nuevo descubrimiento registrado' : 'nuevos descubrimientos registrados'} en este intento.</p>
        <NotebookButton label="Leer descubrimientos" /></div>}
      {!hasNext && <p className="panel__sub">{isBonus ? '¡Has completado el nivel secreto! Vuelve al mapa para seguir tu aventura.' : '¡Temayin ha completado toda la aventura!'}</p>}
      <div className="panel__actions">
        {hasNext && <button type="button" className="btn btn--primary" onClick={onNext}>{isSeasonal ? 'Continuar a Palenque' : 'Siguiente nivel'}</button>}
        <button type="button" className={hasNext ? 'btn' : 'btn btn--primary'} onClick={onRetry}>Repetir nivel</button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>{isBonus ? 'Volver al mapa' : 'Elegir nivel'}</button>
      </div>
    </Panel>
  );
}

interface GameOverProps {
  score: number;
  onRetry: () => void;
  onExit: () => void;
}

export function GameOver({ score, onRetry, onExit }: GameOverProps) {
  return (
    <Panel title="FIN DEL JUEGO" tone="lose">
      <p className="panel__sub">Puntos: {score}</p>
      <div className="panel__actions">
        <button type="button" className="btn btn--primary" onClick={onRetry}>Reintentar</button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>Elegir nivel</button>
      </div>
    </Panel>
  );
}
