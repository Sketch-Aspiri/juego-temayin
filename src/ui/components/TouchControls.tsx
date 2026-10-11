import { useEffect, useState, type PointerEvent } from 'react';
import { input, type Action } from '../../engine/input';
import type { TouchMode } from '../../store/settings';
import { TouchInput } from './touchInput';

const ACTIONS: readonly Action[] = ['left', 'right', 'run', 'fire', 'jump'];

function actionAt(element: Element | null): Action | null {
  const value = element?.closest('[data-action]')?.getAttribute('data-action');
  return ACTIONS.find((action) => action === value) ?? null;
}

function useTouchVisible(mode: TouchMode): boolean {
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = (): void => setCoarse(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mode === 'on' || (mode === 'auto' && coarse);
}

function useTouchPad() {
  const [controller] = useState(() => new TouchInput(input));
  const [active, setActive] = useState<readonly Action[]>([]);
  const sync = (): void => setActive(controller.actions);
  useEffect(() => {
    const clear = (): void => { controller.reset(); setActive([]); };
    const hidden = (): void => { if (document.hidden) clear(); };
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', hidden);
      controller.reset();
    };
  }, [controller]);
  const down = (event: PointerEvent<HTMLDivElement>): void => {
    const action = actionAt(event.target instanceof Element ? event.target : null);
    if (!action || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    controller.start(event.pointerId, action);
    sync();
  };
  const move = (event: PointerEvent<HTMLDivElement>): void => {
    if (!controller.has(event.pointerId)) return;
    event.preventDefault();
    controller.move(event.pointerId, actionAt(document.elementFromPoint(event.clientX, event.clientY)));
    sync();
  };
  const up = (event: PointerEvent<HTMLDivElement>): void => { controller.end(event.pointerId); sync(); };
  const toggleRun = (): void => { controller.toggleRun(); sync(); };
  return { active, down, move, up, toggleRun };
}

function TouchPad() {
  const { active, down, move, up, toggleRun } = useTouchPad();
  const button = (action: Action, label: string, text: string) => (
    <button type="button" data-action={action} aria-label={label}
      aria-pressed={action === 'run' ? active.includes('run') : undefined}
      className={`pad pad--${action}${active.includes(action) ? ' pad--active' : ''}`}
      onClick={(event) => { if (action === 'run' && event.detail === 0) toggleRun(); }}>
      {text}
    </button>
  );
  return (
    <div className="touch" aria-label="Controles táctiles" onPointerDown={down} onPointerMove={move}
      onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onContextMenu={(event) => event.preventDefault()}>
      <div className="touch__movement">
        {button('run', 'Correr', active.includes('run') ? 'CORRER ✓' : 'CORRER')}
        {button('left', 'Izquierda', '◀')}
        {button('right', 'Derecha', '▶')}
      </div>
      <div className="touch__actions">
        {button('fire', 'Fuego', 'FUEGO')}
        {button('jump', 'Saltar', '▲')}
      </div>
    </div>
  );
}

export function TouchControls({ mode }: { mode: TouchMode }) {
  return useTouchVisible(mode) ? <TouchPad /> : null;
}
