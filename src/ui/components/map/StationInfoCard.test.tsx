import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WORLDS, getLevel } from '../../../data/worlds';
import { EMPTY_PROGRESS, recordTicket } from '../../../store/progress';
import { MapItinerary } from './MapItinerary';
import { StationInfoCard } from './StationInfoCard';

function itinerary(id: string, progress = EMPTY_PROGRESS): string {
  const world = WORLDS.find(world => world.levels.some(level => level.id === id))!;
  return renderToStaticMarkup(<MapItinerary world={world} selected={getLevel(id)!} progress={progress}
    visible onSelect={() => undefined} onPlay={() => undefined} />);
}

describe('Ficha de viaje en el mapa', () => {
  it('presenta datos y enlaces con ambas numeraciones antes del itinerario', () => {
    const html = itinerary('1-1');
    expect(html.indexOf('data-station-info="1-1"')).toBeLessThan(html.indexOf('Itinerario del tramo'));
    expect(html).toContain('¿Sabías que…?');
    expect(html).toContain('1952');
    expect(html).toContain('Descubre más');
    expect(html).toContain('#page=13');
    expect(html).toContain('pp. 22–23; página 13 del PDF');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Ficha de viaje: Palenque');
    expect(html).toContain('assets/estaciones/1-1.webp');
    expect(html).toContain('alt="Templo escalonado de piedra rodeado de vegetación en Palenque."');
    expect(html).toContain('Jan Harenburg');
    expect(html).toContain('CC BY 4.0');
    expect(html).not.toContain('<details class="station-info__more" open');
  });

  it('permite leer estaciones bloqueadas y conserva el bloqueo de jugar y del secreto', () => {
    const html = itinerary('1-2');
    expect(html).toContain('Usumacinta');
    expect(html).toMatch(/disabled="">Estación bloqueada/);
    expect(html).toContain('Destino secreto');
    expect(html).not.toContain(WORLDS[0].bonus!.name);
    const ticket = itinerary('1-2', recordTicket(EMPTY_PROGRESS, WORLDS[0].id));
    expect(ticket).toContain(WORLDS[0].bonus!.name);
    expect(ticket).toMatch(/disabled="">Estación bloqueada/);
  });

  it('identifica explícitamente ficción, lugares de referencia y contexto regional', () => {
    const fiction = renderToStaticMarkup(<StationInfoCard level={getLevel('4-2')!} />);
    expect(fiction).toContain('Escenario de fantasía');
    expect(fiction).toContain('no una estación real');
    expect(fiction).toContain('Entorno real');
    expect(fiction).toContain('referencia real para el escenario ficticio');
    const regional = renderToStaticMarkup(<StationInfoCard level={getLevel('5-5')!} />);
    expect(regional).toContain('Lugar de referencia');
    expect(regional).toContain('Contexto regional');
    expect(regional).toContain('no instalaciones de la localidad');
  });
});
