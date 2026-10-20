import { useState } from 'react';
import { TUTORIAL_LESSONS } from '../../data/tutorial';
import { keyLabel } from '../../data/controlLabels';
import { keysForAction } from '../../engine/controls';
import { VH, VW } from '../../engine/constants';
import { PORTRAIT_VIEW_WIDTH } from '../../engine/render/viewport';
import { useAppStore } from '../../store/appStore';
import { ControlsHelp } from '../components/ControlsHelp';
import { TouchControls } from '../components/TouchControls';
import { usePortrait } from '../usePortrait';
import { useTutorialGame } from './useTutorialGame';
import '../tutorial.css';

type TutorialGame = ReturnType<typeof useTutorialGame>;

export function TutorialScreen() {
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const settings = useAppStore(s => s.settings);
  const go = useAppStore(s => s.go);
  const game = useTutorialGame(attempt, playing);
  const restart = (): void => { setPlaying(true); setAttempt(value => value + 1); };
  return <main className={`tutorial${playing ? ' tutorial--playing' : ''}`}>
    <header className="tutorial__header">
      <div><span className="tutorial__eyebrow">LA GUÍA DE TOH</span><h1>Cómo jugar</h1></div>
      <div className="tutorial__actions">
        {playing && <button className="btn" onClick={restart}>Reiniciar</button>}
        {playing && <button className="btn" onClick={() => game.setPaused(!game.paused)} disabled={game.complete || game.failed}>
          {game.paused ? 'Continuar' : 'Pausa'}</button>}
        <button className="btn" onClick={() => go('title')}>Volver al menú</button>
      </div>
    </header>
    {playing ? <>
      <div className="tutorial__practice">
        <TutorialGuide game={game} />
        <TutorialField game={game} onRestart={restart} />
      </div>
      {game.ready && !game.paused && !game.complete && !game.failed && <TouchControls mode={settings.touchControls} />}
    </> : <TutorialIntroduction onStart={restart} />}
  </main>;
}

function TutorialGuide({ game }: { game: TutorialGame }) {
  const bindings = useAppStore(s => s.settings.keyBindings);
  const done = game.hud?.tutorial ?? [];
  const lesson = TUTORIAL_LESSONS.find(item => !done.includes(item.id));
  return <aside className="tutorial__guide">
    <span className="tutorial__eyebrow">MINITUTORIAL · {done.length} DE {TUTORIAL_LESSONS.length}</span>
    <div className="tutorial__prompt" role="status" aria-live="polite" aria-atomic="true">
      <h2>{lesson?.title ?? '¡Rumbo a la bandera!'}</h2>
      <p>{lesson?.hint ?? 'Ya dominas lo básico. Ve a la derecha, pasa el punto de control de Toh y toca la bandera para terminar.'}</p>
      {lesson && <div className="tutorial__keys">{lesson.actions.map(action =>
        <kbd key={action}>{keyLabel(keysForAction(action, bindings)[0])}</kbd>)}</div>}
    </div>
    <ol className="tutorial__checklist" aria-label="Objetivos de la práctica">
      {TUTORIAL_LESSONS.map((item, index) => <li key={item.id} data-complete={done.includes(item.id)}
        aria-current={lesson?.id === item.id ? 'step' : undefined}>
        <span aria-hidden="true">{done.includes(item.id) ? '✓' : `0${index + 1}`}</span>
        {item.title}{done.includes(item.id) && <span className="tutorial__sr-only"> · Completado</span>}
      </li>)}
    </ol>
    <p className="tutorial__safe">Practica a tu ritmo: sin enemigos ni límite de tiempo. Tu cacao y tu progreso se mantienen.</p>
  </aside>;
}

function TutorialField({ game, onRestart }: { game: TutorialGame; onRestart: () => void }) {
  const portrait = usePortrait();
  const go = useAppStore(s => s.go);
  return <section className="tutorial__field" aria-label="Claro de práctica">
    <canvas ref={game.canvas} width={portrait ? PORTRAIT_VIEW_WIDTH : VW} height={VH} tabIndex={0}
      aria-label="Minitutorial jugable de Temayin. Sigue las indicaciones de Toh y usa el teclado o los botones táctiles." />
    {(!game.ready || game.paused || game.complete || game.failed) && <div className="tutorial__overlay">
      <div role="status"><h2>{game.complete ? '¡Listo para la aventura!' : game.failed ? '¡Vamos de nuevo!' : game.paused ? 'Un respiro en el claro' : 'Preparando el claro…'}</h2>
        {game.complete ? <><p>Has practicado los cinco movimientos y alcanzado la bandera.</p>
          <button className="btn btn--primary" onClick={() => go('levels')} autoFocus>Ir a jugar</button>
          <button className="btn" onClick={onRestart}>Practicar otra vez</button></>
          : game.failed ? <button className="btn btn--primary" onClick={onRestart}>Reintentar práctica</button>
          : game.paused && <button className="btn btn--primary" onClick={() => game.setPaused(false)}>Seguir practicando</button>}
      </div>
    </div>}
  </section>;
}

function TutorialIntroduction({ onStart }: { onStart: () => void }) {
  return <div className="tutorial__introduction">
    <section className="tutorial__welcome">
      <span className="tutorial__eyebrow">PRIMERA PARADA · EL CLARO DE TOH</span>
      <h2>Todo gran viaje<br />empieza con un salto.</h2>
      <p>Acompaña a Temayin por un pequeño claro de la selva. Toh te enseñará a moverte, saltar, correr, recoger cacao y lanzar fuego.</p>
      <button className="btn btn--primary btn--big" onClick={onStart} autoFocus>Comenzar minitutorial</button>
      <p className="tutorial__safe">Sin enemigos ni prisas. Puedes repetirlo cuantas veces quieras; no cambia tu partida.</p>
    </section>
    <section className="tutorial__manual" aria-label="Guía de controles">
      <h2>Tus controles</h2><ControlsHelp />
      <p>En pantalla táctil, usa las flechas y los botones <strong>Saltar</strong> y <strong>Fuego</strong>. Toca <strong>Correr</strong> para activarlo o desactivarlo.</p>
      <p>Puedes cambiar las teclas y el mando en <strong>Ajustes</strong>. Aquí se muestran tus teclas actuales.</p>
      <hr /><h3>Para la aventura</h3>
      <p>Salta sobre enemigos sin púas, golpea cofres desde abajo y recoge poderes. Toh marca el punto de control; la bandera indica la meta.</p>
      <p>En el agua, pulsa salto para nadar y sube a tomar aire antes de que se agote el oxígeno.</p>
    </section>
  </div>;
}
