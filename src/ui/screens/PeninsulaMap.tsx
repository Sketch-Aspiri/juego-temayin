import { useCallback, useReducer, useRef, useState } from 'react';
import { ALL_LEVELS, getLevel, WORLDS } from '../../data/worlds';
import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import { useAppStore } from '../../store/appStore';
import { isUnlocked } from '../../store/progress';
import { MapAttribution } from '../components/map/MapAttribution';
import { MapChart } from '../components/map/MapChart';
import { MapItinerary } from '../components/map/MapItinerary';
import { MapNavigation } from '../components/map/MapNavigation';
import { fitMapView, FULL_MAP, latestStation, panelCoversZoom, sidePanelInset, worldForStation, worldView } from '../components/map/mapModel';
import { useMapViewport } from '../components/map/useMapViewport';
import '../peninsulaMap.css';
import '../components/map/stationInfo.css';

export function PeninsulaMap({ onPlay }: { onPlay: (id: string) => void }) {
  const progress = useAppStore(state => state.progress);
  const [selectedId, selectStation] = useState(() => latestStation(progress));
  const [closeView, setCloseView] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const dockRef = useRef<HTMLButtonElement>(null);
  const closePanel = () => { setPanelOpen(false); dockRef.current?.focus({ preventScroll: true }); };
  // Cambia solo al cambiar de tramo o de vista: tocar una estación o abrir el panel no reencuadra.
  const [frameKey, reframe] = useReducer((key: number) => key + 1, 0);
  const viewport = useMapViewport();
  const selected = getLevel(selectedId) ?? ALL_LEVELS[0];
  const world = worldForStation(selected.id);
  const sidePanel = sidePanelInset(viewport.width, panelOpen);
  const base = fitMapView(closeView ? worldView(world) : FULL_MAP, viewport.width, viewport.height, sidePanel);
  // Estable: los marcadores están memoizados y no deben repintarse por un handler nuevo en cada render.
  const chooseStation = useCallback((id: string) => { selectStation(id); setPanelOpen(true); }, []);
  const chooseWorld = (id: string) => {
    const destination = WORLDS.find(entry => entry.id === id)!;
    const current = destination.levels.filter(level => isUnlocked(progress, level.id)).at(-1) ?? destination.levels[0];
    chooseStation(current.id);
    setCloseView(true);
    reframe();
  };
  return <section className={`peninsula${panelOpen ? ' peninsula--panel-open' : ''}`} aria-label="Mapa de la aventura">
    <div className="peninsula__intro"><div><p className="peninsula__eyebrow">ESTACIÓN POR ESTACIÓN</p>
      <h2>La ruta del jaguar</h2></div>
      <div className="map-legend" aria-label="Leyenda del mapa"><span><i className="map-legend__lit" />Disponible</span>
        <span><i />Bloqueado</span><span><i className="map-legend__cloud" />Por descubrir</span></div></div>
    <MapNavigation progress={progress} selectedWorld={world.id} onSelect={chooseWorld} />
    <div className="peninsula__layout"><div className="map-chart">
      <div className="map-chart__toolbar"><span>PENÍNSULA DE YUCATÁN</span><button type="button" aria-pressed={closeView}
        onClick={() => { setCloseView(!closeView); reframe(); }}>{closeView ? '− Ver península' : '+ Acercar al tramo'}</button></div>
      <MapChart progress={progress} base={base} frameKey={frameKey} selected={selected.id} onSelect={chooseStation}
        closeView={closeView} viewport={viewport} sidePanel={sidePanel} zoomHidden={panelCoversZoom(viewport.width, panelOpen)} />
      <MapAttribution />
    </div><div className="map-panel" id="station-panel" hidden={!panelOpen} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePanel(); }
    }}>
      <button className="map-panel__close" type="button" onClick={closePanel} aria-label="Cerrar itinerario">✕</button>
      <MapItinerary world={world} selected={selected} progress={progress} visible={panelOpen} onSelect={selectStation} onPlay={onPlay} />
    </div></div>
    <div className="map-dock"><button ref={dockRef} type="button" className="btn" aria-expanded={panelOpen} aria-controls="station-panel"
      onClick={() => panelOpen ? closePanel() : setPanelOpen(true)}>Estaciones</button>
      {!panelOpen && <button type="button" className="btn btn--primary" disabled={!isUnlocked(progress, selected.id)} onClick={() => onPlay(selected.id)}>Jugar {selected.id} →</button>}
      {!panelOpen && <button type="button" className="btn map-dock__seasonal" onClick={() => onPlay(HANAL_PIXAN_LEVEL.id)}>✦ Hanal Pixán</button>}</div>
  </section>;
}
