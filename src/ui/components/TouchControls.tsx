import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { input, type Action } from '../../engine/input';
import type { TouchMode } from '../../store/settings';
import { TouchInput } from './touchInput';
import { preventTouchZoom } from './preventTouchZoom';
import { useAppStore } from '../../store/appStore';
import { TouchButtonGroups, touchStyle } from './TouchLayout';
import '../customControls.css';

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
  const appearance = useAppStore(s => s.settings.touchAppearance);
  const { active, down, move, up, toggleRun } = useTouchPad();
  const padRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (padRef.current) return preventTouchZoom(padRef.current);
  }, []);
  return (
    <div ref={padRef} className={`touch touch--custom touch--${appearance.layout}`} style={touchStyle(appearance)}
      aria-label="Controles táctiles" onPointerDown={down} onPointerMove={move}
      onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onContextMenu={(event) => event.preventDefault()}>
      <TouchButtonGroups active={active} onRun={event => { if (event.detail === 0) toggleRun(); }} />
    </div>
  );
}

export function TouchControls({ mode }: { mode: TouchMode }) {
  return useTouchVisible(mode) ? <TouchPad /> : null;
}
