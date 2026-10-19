import type { CSSProperties } from 'react';
import { STATIONS } from '../../../data/stations';
import { WORLDS } from '../../../data/worlds';
import { isUnlocked, type Progress } from '../../../store/progress';
import { mapPoint, visiblePosition, worldDiscovered, type MapView } from './mapModel';

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
};

export function StationMarkers({ progress, view, selected, onSelect }: MarkersProps) {
  return <div className="atlas__markers">{WORLDS.filter(world => worldDiscovered(progress, world)).flatMap(world =>
    world.levels.map(level => {
      const station = STATIONS[level.id];
      const point = mapPoint(station);
      if (point.x < view.x || point.x > view.x + view.width || point.y < view.y || point.y > view.y + view.height) return null;
      const open = isUnlocked(progress, level.id);
      const done = !!progress.levels[level.id];
      const offset = CALLOUTS[level.id] ?? [0, 0];
      const style = { ...visiblePosition(station, view), '--callout-x': `${offset[0]}px`, '--callout-y': `${offset[1]}px` } as CSSProperties;
      const state = done ? 'Completado' : open ? 'Disponible' : 'Bloqueado';
      return <div key={level.id} style={style} className={`atlas-pin${open ? ' atlas-pin--lit' : ''}${done ? ' atlas-pin--done' : ''}${selected === level.id ? ' atlas-pin--selected' : ''}`}>
        <i className="atlas-pin__position" aria-hidden="true" />
        <svg className="atlas-pin__guide" aria-hidden="true"><line x1="50" y1="50" x2={50 + offset[0]} y2={50 + offset[1]} /></svg>
        <button type="button" className="atlas-pin__button" aria-label={`${level.id} · ${station.label} · ${state}`}
          aria-pressed={selected === level.id} onClick={() => onSelect(level.id)} data-station={level.id}>
          <span aria-hidden="true">{level.id}</span>
        </button>
        <span className="atlas-pin__label" aria-hidden="true">{station.label}</span>
      </div>;
    }))}</div>;
}
