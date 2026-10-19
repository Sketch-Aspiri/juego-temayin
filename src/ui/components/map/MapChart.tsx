import { memo, useCallback, useId, useMemo, type CSSProperties } from 'react';
import { ALL_LEVELS, WORLDS } from '../../../data/worlds';
import { STATIONS } from '../../../data/stations';
import { isUnlocked, type Progress } from '../../../store/progress';
import { MapFog, MapLandscape } from './MapLandscape';
import { MapZoomControls } from './MapZoomControls';
import { StationMarkers } from './StationMarkers';
import { BUTTON_ZOOM_STEP, type ScreenSize } from './mapGestures';
import { FULL_MAP, latestStation, routePoints, visiblePosition, worldDiscovered, type MapView } from './mapModel';
import { useMapGestures } from './useMapGestures';

export interface MapChartProps {
  progress: Progress;
  /** Encuadre por defecto (península o tramo); la cámara libre parte de él. */
  base: MapView;
  /** Cambia cuando hay que reencuadrar (otro tramo o vista), no al tocar estaciones. */
  frameKey: number;
  selected: string;
  closeView: boolean;
  viewport: ScreenSize;
  /** Ancho del panel lateral abierto (0 si no resta mapa visible). */
  sidePanel: number;
  /** El panel de itinerario tapa los botones de zoom (móvil): no se montan para que no sean tabulables a ciegas. */
  zoomHidden?: boolean;
  onSelect: (id: string) => void;
}

/** Ayuda visible solo mientras el atlas tiene el foco del teclado. */
const KEY_HELP = 'Flechas: mover · + −: zoom · 0: reencuadrar';
const INSTRUCTIONS = 'Arrastra o usa las flechas para desplazarte; rueda, pellizco o + y − para acercar; 0 reencuadra';

/** Rutas apagadas y encendidas: solo cambian con el progreso, no con cada fotograma de cámara. */
const MapRoutes = memo(function MapRoutes({ progress }: { progress: Progress }) {
  return <g className="atlas__routes">{WORLDS.filter(world => worldDiscovered(progress, world)).map(world =>
    <polyline key={world.id} points={routePoints(world.levels.map(level => STATIONS[level.id]))} />)}
    {ALL_LEVELS.slice(1).map((level, index) => isUnlocked(progress, level.id) &&
      <polyline className="atlas__route-lit" key={level.id} points={routePoints([STATIONS[ALL_LEVELS[index].id], STATIONS[level.id]])} />)}
  </g>;
});

export function MapChart({ progress, base, frameKey, selected, closeView, viewport, sidePanel, zoomHidden = false, onSelect }: MapChartProps) {
  const maskId = useId().replace(/:/g, '');
  const hintId = useId();
  const gestures = useMapGestures({ base, frameKey, viewport, sidePanel });
  const { view } = gestures;
  const current = useMemo(() => latestStation(progress), [progress]);
  const train = STATIONS[current];
  const zoomIn = useCallback(() => gestures.zoomBy(BUTTON_ZOOM_STEP), [gestures.zoomBy]);
  const zoomOut = useCallback(() => gestures.zoomBy(1 / BUTTON_ZOOM_STEP), [gestures.zoomBy]);
  return <>
    <div className="atlas" ref={gestures.atlasRef} data-map-view={closeView ? 'tramo' : 'peninsula'}
      data-map-camera={gestures.customized ? 'libre' : 'encuadre'} data-gesture={gestures.gesturing ? '' : undefined}
      tabIndex={0} role="group" aria-label="Carta de la península" aria-describedby={hintId} onKeyDown={gestures.onKeyDown}>
      <p id={hintId} className="atlas__instructions">{INSTRUCTIONS}</p>
      <p className="atlas__keyhelp" aria-hidden="true">{KEY_HELP}</p>
      <svg className="atlas__drawing" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-hidden="true"
        style={{ '--map-label-scale': view.width / Math.max(1, viewport.width) } as CSSProperties}>
        <MapLandscape />
        <MapRoutes progress={progress} />
        <MapFog progress={progress} maskId={`fog-${maskId}`} />
      </svg>
      <StationMarkers progress={progress} view={view} selected={selected} onSelect={onSelect} />
      <div className="atlas__train" style={visiblePosition(train, view)} aria-label={`Tren en ${train.label}`}>
        <svg viewBox="0 0 42 32" aria-hidden="true"><path d="M5 6h25l7 12v8H5z" fill="#ffe19b" stroke="#4d3925" strokeWidth="2" />
          <path d="M10 10h7v7h-7zm11 0h6l4 7H21z" fill="#204c48" /><path d="M7 22h28" stroke="#c58335" strokeWidth="3" />
          <circle cx="12" cy="28" r="3" fill="#193d3b" /><circle cx="30" cy="28" r="3" fill="#193d3b" /></svg>
      </div>
      <div className="atlas__compass" aria-label="Norte arriba"><span>N</span><svg viewBox="0 0 40 54" aria-hidden="true"><path d="m20 2 13 45-13-9L7 47z" fill="#ecd8a1" /><path d="M20 2v36L7 47z" fill="#5b968e" /></svg></div>
      <div className="atlas__scale"><i />{Math.round(view.width / FULL_MAP.width * 100)} km aprox.</div>
    </div>
    {!zoomHidden && <MapZoomControls canZoomIn={gestures.canZoomIn} canZoomOut={gestures.canZoomOut} customized={gestures.customized}
      onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={gestures.reset} />}
  </>;
}
