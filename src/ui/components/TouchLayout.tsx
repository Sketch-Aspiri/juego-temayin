import type { CSSProperties, MouseEventHandler } from 'react';
import type { Action } from '../../engine/input';
import type { TouchAppearance } from '../../store/settings';

export function touchStyle(appearance: TouchAppearance): CSSProperties {
  return { '--touch-scale': appearance.scale, '--touch-opacity': appearance.opacity } as CSSProperties;
}

export function TouchButtonGroups({ active = [], onRun, preview = false }: {
  active?: readonly Action[];
  onRun?: MouseEventHandler<HTMLButtonElement>;
  preview?: boolean;
}) {
  const button = (action: Action, label: string, text: string) => <button type="button" key={action}
    data-action={preview ? undefined : action} aria-label={label} disabled={preview} tabIndex={preview ? -1 : undefined}
    aria-pressed={action === 'run' ? active.includes('run') : undefined}
    className={`pad pad--${action}${active.includes(action) ? ' pad--active' : ''}`} onClick={action === 'run' ? onRun : undefined}>
    {text}
  </button>;
  return <>
    <div className="touch__movement">
      {button('run', 'Correr', active.includes('run') ? 'CORRER ✓' : 'CORRER')}
      {button('left', 'Izquierda', '◀')}{button('right', 'Derecha', '▶')}
    </div>
    <div className="touch__actions">{button('fire', 'Fuego', 'FUEGO')}{button('jump', 'Saltar', '▲')}</div>
  </>;
}
