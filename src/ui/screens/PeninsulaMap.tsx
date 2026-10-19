import { useEffect, useId, useState, type CSSProperties } from 'react';
import { ALL_LEVELS, getLevel, WORLDS } from '../../data/worlds';
import { STATIONS } from '../../data/stations';
import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import { useAppStore } from '../../store/appStore';
import { isUnlocked, type Progress } from '../../store/progress';
import { MapFog, MapLandscape } from '../components/map/MapLandscape';
import { MapItinerary } from '../components/map/MapItinerary';
import { MapNavigation } from '../components/map/MapNavigation';
import { StationMarkers } from '../components/map/StationMarkers';
import { fitMapView, FULL_MAP, latestStation, routePoints, visiblePosition, worldDiscovered, worldForStation, worldView, type MapView } from '../components/map/mapModel';
import '../peninsulaMap.css';

export function PeninsulaMap({ onPlay }: { onPlay: (id: string) => void }) {
  const progress = useAppStore(state => state.progress);
  const [selectedId, selectStation] = useState(() => latestStation(progress));
  const [closeView, setCloseView] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const viewport = useMapViewport();
  const selected = getLevel(selectedId) ?? ALL_LEVELS[0];
  const world = worldForStation(selected.id);
  const sidePanel = panelOpen && viewport.width > 760 ? 390 : 0;
  const view = fitMapView(closeView ? worldView(world) : FULL_MAP, viewport.width, viewport.height, sidePanel);
  const chooseStation = (id: string) => { selectStation(id); setPanelOpen(true); };
  const chooseWorld = (id: string) => {
    const destination = WORLDS.find(entry => entry.id === id)!;
    const current = destination.levels.filter(level => isUnlocked(progress, level.id)).at(-1) ?? destination.levels[0];
    selectStation(current.id);
    setCloseView(true);
  };
  return <section className="peninsula" aria-label="Mapa de la aventura">
    <div className="peninsula__intro"><div><p className="peninsula__eyebrow">ESTACIÓN POR ESTACIÓN</p>
      <h2>La ruta del jaguar</h2></div>
      <div className="map-legend" aria-label="Leyenda del mapa"><span><i className="map-legend__lit" />Disponible</span>
        <span><i />Bloqueado</span><span><i className="map-legend__cloud" />Por descubrir</span></div></div>
    <MapNavigation progress={progress} selectedWorld={world.id} onSelect={chooseWorld} />
    <div className="peninsula__layout"><div className="map-chart">
      <div className="map-chart__toolbar"><span>PENÍNSULA DE YUCATÁN</span><button type="button" aria-pressed={closeView}
        onClick={() => setCloseView(!closeView)}>{closeView ? '− Ver península' : '+ Acercar al tramo'}</button></div>
      <MapChart progress={progress} view={view} selected={selected.id} onSelect={chooseStation} closeView={closeView} screenWidth={viewport.width} />
      <MapAttribution />
    </div><div className="map-panel" hidden={!panelOpen}>
      <button className="map-panel__close" type="button" onClick={() => setPanelOpen(false)} aria-label="Cerrar itinerario">✕</button>
      <MapItinerary world={world} selected={selected} progress={progress} onSelect={selectStation} onPlay={onPlay} />
    </div></div>
    <div className="map-dock"><button type="button" className="btn" aria-expanded={panelOpen} onClick={() => setPanelOpen(!panelOpen)}>Estaciones</button>
      {!panelOpen && <button type="button" className="btn btn--primary" disabled={!isUnlocked(progress, selected.id)} onClick={() => onPlay(selected.id)}>Jugar {selected.id} →</button>}
      {!panelOpen && <button type="button" className="btn map-dock__seasonal" onClick={() => onPlay(HANAL_PIXAN_LEVEL.id)}>✦ Hanal Pixán</button>}</div>
  </section>;
}

function useMapViewport() {
  const [size, setSize] = useState(() => ({ width: typeof window === 'undefined' ? 1440 : window.innerWidth, height: typeof window === 'undefined' ? 900 : window.innerHeight }));
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return size;
}

interface ChartProps { progress: Progress; view: MapView; selected: string; closeView: boolean; screenWidth: number; onSelect: (id: string) => void }

function MapChart({ progress, view, selected, onSelect, closeView, screenWidth }: ChartProps) {
  const maskId = useId().replace(/:/g, '');
  const current = latestStation(progress);
  return <div className="atlas" data-map-view={closeView ? 'tramo' : 'peninsula'}>
    <svg className="atlas__drawing" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-hidden="true"
      style={{ '--map-label-scale': view.width / screenWidth } as CSSProperties}>
      <rect x={view.x} y={view.y} width={view.width} height={view.height} fill="#103a43" />
      <MapLandscape />
      <g className="atlas__routes">{WORLDS.filter(world => worldDiscovered(progress, world)).map(world =>
        <polyline key={world.id} points={routePoints(world.levels.map(level => STATIONS[level.id]))} />)}
        {ALL_LEVELS.slice(1).map((level, index) => isUnlocked(progress, level.id) &&
          <polyline className="atlas__route-lit" key={level.id} points={routePoints([STATIONS[ALL_LEVELS[index].id], STATIONS[level.id]])} />)}
      </g>
      <MapFog progress={progress} maskId={`fog-${maskId}`} />
    </svg>
    <StationMarkers progress={progress} view={view} selected={selected} onSelect={onSelect} />
    <div className="atlas__train" style={visiblePosition(STATIONS[current], view)} aria-label={`Tren en ${STATIONS[current].label}`}>
      <svg viewBox="0 0 42 32" aria-hidden="true"><path d="M5 6h25l7 12v8H5z" fill="#ffe19b" stroke="#4d3925" strokeWidth="2" />
        <path d="M10 10h7v7h-7zm11 0h6l4 7H21z" fill="#204c48" /><path d="M7 22h28" stroke="#c58335" strokeWidth="3" />
        <circle cx="12" cy="28" r="3" fill="#193d3b" /><circle cx="30" cy="28" r="3" fill="#193d3b" /></svg>
    </div>
    <div className="atlas__compass" aria-label="Norte arriba"><span>N</span><svg viewBox="0 0 40 54" aria-hidden="true"><path d="m20 2 13 45-13-9L7 47z" fill="#ecd8a1" /><path d="M20 2v36L7 47z" fill="#5b968e" /></svg></div>
    <div className="atlas__scale"><i />{Math.round(view.width / FULL_MAP.width * 100)} km aprox.</div>
  </div>;
}

function MapAttribution() {
  return <details className="map-sources"><summary>Acerca de este mapa</summary><p>Costa y fronteras de <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>.
    {' '}Estaciones: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">colaboradores de OpenStreetMap</a> (ODbL).</p>
    <p>Las estaciones usan sus coordenadas geográficas. Los destinos turísticos se sitúan en sus lugares de referencia.
      Chichén Itzá es una zona arqueológica real. Únicamente Xibalbá representa la entrada ficticia al inframundo. El itinerario representa el orden del juego.</p></details>;
}
