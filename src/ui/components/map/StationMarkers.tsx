import { memo, useMemo, type CSSProperties } from 'react';
import { STATIONS } from '../../../data/stations';
import { WORLDS } from '../../../data/worlds';
import { isUnlocked, type Progress } from '../../../store/progress';
import { mapPoint, worldDiscovered, type MapView } from './mapModel';

interface MarkersProps {
  progress: Progress;
  view: MapView;
  selected: string;
  onSelect: (id: string) => void;
}

// Los rótulos se separan; el punto y el extremo de su guía conservan la posición geográfica.
const CALLOUTS: Readonly<Record<string, readonly [number, number]>> = {
  '1-2': [-17, 20], '1-3': [17, -9], '3-2': [18, 20], '3-4': [-18, -20],
  '4-1': [16, -15], '4-2': [-16, 19], '5-3': [15, -10], '5-4': [-15, 16],
  '7-2': [-25, -24], '7-3': [25, 24],
};

interface PinData {
  readonly id: string;
  readonly label: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly open: boolean;
  readonly done: boolean;
  readonly state: string;
  readonly offset: readonly [number, number];
}

/** Lo que depende solo del progreso: no se recalcula en cada fotograma de cámara. */
function pinData(progress: Progress): readonly PinData[] {
  return WORLDS.filter(world => worldDiscovered(progress, world)).flatMap(world => world.levels.map(level => {
    const station = STATIONS[level.id];
    const open = isUnlocked(progress, level.id);
    const done = !!progress.levels[level.id];
    return { id: level.id, label: station.label, position: mapPoint(station), open, done,
      state: done ? 'Completado' : open ? 'Disponible' : 'Bloqueado', offset: CALLOUTS[level.id] ?? [0, 0] };
  }));
}

export const StationMarkers = memo(function StationMarkers({ progress, view, selected, onSelect }: MarkersProps) {
  const pins = useMemo(() => pinData(progress), [progress]);
  return <div className="atlas__markers">{pins.map(pin => {
    const { x, y } = pin.position;
    if (x < view.x || x > view.x + view.width || y < view.y || y > view.y + view.height) return null;
    const { offset } = pin;
    const style = { left: `${(x - view.x) / view.width * 100}%`, top: `${(y - view.y) / view.height * 100}%`,
      '--callout-x': `${offset[0]}px`, '--callout-y': `${offset[1]}px` } as CSSProperties;
    return <div key={pin.id} style={style} className={`atlas-pin${pin.open ? ' atlas-pin--lit' : ''}${pin.done ? ' atlas-pin--done' : ''}${selected === pin.id ? ' atlas-pin--selected' : ''}`}>
      <i className="atlas-pin__position" aria-hidden="true" />
      <svg className="atlas-pin__guide" aria-hidden="true"><line x1="50" y1="50" x2={50 + offset[0]} y2={50 + offset[1]} /></svg>
      <button type="button" className="atlas-pin__button" aria-label={`${pin.id} · ${pin.label} · ${pin.state}`}
        aria-pressed={selected === pin.id} onClick={() => onSelect(pin.id)} data-station={pin.id}>
        <span aria-hidden="true">{pin.id}</span>
      </button>
      <span className="atlas-pin__label" aria-hidden="true">{pin.label}</span>
    </div>;
  })}</div>;
});
