import { useLayoutEffect, useRef } from 'react';
import type { LevelDef, WorldDef } from '../../../engine/level/types';
import { isUnlocked, type Progress } from '../../../store/progress';
import { LevelTile } from '../LevelTile';
import { Stars } from '../Stars';
import { StationInfoCard } from './StationInfoCard';

interface ItineraryProps {
  world: WorldDef;
  selected: LevelDef;
  progress: Progress;
  visible: boolean;
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

function StationList({ world, selected, progress, onSelect }: Omit<ItineraryProps, 'visible' | 'onPlay'>) {
  return <section className="map-itinerary__route" aria-label="Itinerario del tramo">
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
  </section>;
}

function Departure({ selected, progress, onPlay }: Pick<ItineraryProps, 'selected' | 'progress' | 'onPlay'>) {
  const open = isUnlocked(progress, selected.id);
  const record = progress.levels[selected.id];
  return <footer className="map-departure" aria-label={`Salida hacia ${selected.name}`}>
    {record && <div className="map-departure__record"><Stars value={record.stars} /><span>Mejor: {record.bestScore}</span></div>}
    <button type="button" className="btn btn--primary" disabled={!open} onClick={() => onPlay(selected.id)}>
      {open ? `Jugar ${selected.id} →` : 'Estación bloqueada'}</button>
    {!open && <p>Completa la estación anterior para encender este punto.</p>}
  </footer>;
}

export function MapItinerary({ world, selected, progress, visible, onSelect, onPlay }: ItineraryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusSelection = useRef(false);
  useLayoutEffect(() => {
    if (!visible) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (focusSelection.current) headingRef.current?.focus({ preventScroll: true });
    focusSelection.current = false;
  }, [selected.id, visible]);
  const chooseFromList = (id: string) => {
    if (id === selected.id) {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      headingRef.current?.focus({ preventScroll: true });
      return;
    }
    focusSelection.current = true;
    onSelect(id);
  };
  return <aside className="map-itinerary" aria-label="Estaciones del tramo">
    <span className="atlas__instructions" role="status" aria-live="polite" aria-atomic="true">Ficha de viaje: {selected.name}</span>
    <div className="map-itinerary__scroll" ref={scrollRef}>
      <StationInfoCard key={selected.id} level={selected} headingRef={headingRef} />
      <StationList world={world} selected={selected} progress={progress} onSelect={chooseFromList} />
      {world.bonus && <LevelTile level={world.bonus} bonus unlocked={isUnlocked(progress, world.bonus.id)}
        record={progress.levels[world.bonus.id]} onPlay={() => onPlay(world.bonus!.id)} />}
    </div>
    <Departure selected={selected} progress={progress} onPlay={onPlay} />
  </aside>;
}
