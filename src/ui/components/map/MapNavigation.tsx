import { WORLDS } from '../../../data/worlds';
import type { Progress } from '../../../store/progress';
import { worldDiscovered } from './mapModel';

interface NavigationProps { progress: Progress; selectedWorld: string; onSelect: (id: string) => void }

export function MapNavigation({ progress, selectedWorld, onSelect }: NavigationProps) {
  return <nav className="map-worlds" aria-label="Mundos de la aventura">{WORLDS.map(world => {
    const discovered = worldDiscovered(progress, world);
    return <button type="button" key={world.id} disabled={!discovered} aria-pressed={selectedWorld === world.id}
      onClick={() => onSelect(world.id)} title={discovered ? world.name : `Mundo ${world.number} · Por descubrir`}>
      <span>{String(world.number).padStart(2, '0')}</span>{discovered ? world.name : 'Por descubrir'}</button>;
  })}</nav>;
}
