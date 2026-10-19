import { STATIONS } from '../../../data/stations';
import type { LevelDef, WorldDef } from '../../../engine/level/types';
import { isUnlocked, type Progress } from '../../../store/progress';
import { LevelTile } from '../LevelTile';
import { Stars } from '../Stars';

interface ItineraryProps {
  world: WorldDef;
  selected: LevelDef;
  progress: Progress;
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

export function MapItinerary({ world, selected, progress, onSelect, onPlay }: ItineraryProps) {
  const open = isUnlocked(progress, selected.id);
  const record = progress.levels[selected.id];
  const station = STATIONS[selected.id];
  return <aside className="map-itinerary" aria-label="Estaciones del tramo">
    <div className="map-itinerary__heading"><span>TRAMO {String(world.number).padStart(2, '0')}</span><h3>{world.name}</h3>
      <p>{world.levels.filter(level => progress.levels[level.id]).length} de {world.levels.length} estaciones completadas</p></div>
    <ol className="map-itinerary__stops">{world.levels.map(level => {
      const available = isUnlocked(progress, level.id);
      const completed = progress.levels[level.id];
      return <li key={level.id}><button type="button" onClick={() => onSelect(level.id)} aria-pressed={selected.id === level.id}
        className={`${available ? 'is-lit' : ''}${selected.id === level.id ? ' is-selected' : ''}`}>
        <span className="map-itinerary__dot" aria-hidden="true">{completed ? '✓' : ''}</span>
        <span><small>{level.id}{level.boss ? ' · JEFE' : ''}</small><strong>{level.name}</strong></span>
        <span className="map-itinerary__status">{completed ? 'Completado' : available ? 'Disponible' : 'Bloqueado'}</span>
      </button></li>;
    })}</ol>
    <div className="map-departure" aria-live="polite"><p>{station.reference ?? 'Estación del Tren Maya'}</p>
      <h4>{selected.name}</h4><span className="map-departure__coordinates">{station.latitude.toFixed(3)}° N · {Math.abs(station.longitude).toFixed(3)}° O</span>
      {record && <div className="map-departure__record"><Stars value={record.stars} /><span>Mejor: {record.bestScore}</span></div>}
      <button type="button" className="btn btn--primary" disabled={!open} onClick={() => onPlay(selected.id)}>
        {open ? `Jugar ${selected.id} →` : 'Estación bloqueada'}</button>
      {!open && <p>Completa la estación anterior para encender este punto.</p>}
    </div>
    {world.bonus && <LevelTile level={world.bonus} bonus unlocked={isUnlocked(progress, world.bonus.id)}
      record={progress.levels[world.bonus.id]} onPlay={() => onPlay(world.bonus!.id)} />}
  </aside>;
}
