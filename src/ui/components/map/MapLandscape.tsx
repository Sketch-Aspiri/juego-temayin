import { memo } from 'react';
import { PENINSULA_LAND } from '../../../data/peninsulaGeography';
import { STATIONS } from '../../../data/stations';
import { WORLDS } from '../../../data/worlds';
import type { Progress } from '../../../store/progress';
import { mapPoint, routePoints, worldDiscovered } from './mapModel';

const REGION_LABELS = [
  { label: 'YUCATÁN', latitude: 21.33, longitude: -89.15 },
  { label: 'CAMPECHE', latitude: 19.15, longitude: -89.98 },
  { label: 'QUINTANA ROO', latitude: 19.90, longitude: -87.95 },
  { label: 'TABASCO', latitude: 17.96, longitude: -92.05 },
  { label: 'CHIAPAS', latitude: 17.20, longitude: -92.0 },
  { label: 'BELICE', latitude: 17.55, longitude: -88.66 },
  { label: 'GUATEMALA', latitude: 17.27, longitude: -90.15 },
] as const;

/** Capa pesada y estática: memoizada para no repintarla en cada fotograma de cámara. */
export const MapLandscape = memo(function MapLandscape() {
  return <>
    <defs>
      <linearGradient id="map-land" x2="0.6" y2="1"><stop stopColor="#54826a" /><stop offset="0.6" stopColor="#315b48" /><stop offset="1" stopColor="#233f33" /></linearGradient>
      <pattern id="map-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#a8d2c7" strokeOpacity=".07" /></pattern>
      <pattern id="map-forest" width="33" height="38" patternUnits="userSpaceOnUse"><path d="m16 10-5 10h10zM16 20v5" fill="none" stroke="#afc29a" strokeWidth="1" strokeOpacity=".12" /></pattern>
      <filter id="map-cloud-shadow" x="-40%" y="-50%" width="180%" height="200%"><feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="#071a25" floodOpacity=".4" /></filter>
    </defs>
    <rect x="-5000" y="-5000" width="10000" height="10000" fill="#103a43" />
    <g className="atlas__coasts">{PENINSULA_LAND.map(land => <path key={land.name} d={land.path} fillRule="evenodd"
      fill={land.name === 'Mexico' ? 'url(#map-land)' : '#354c42'} stroke="#90b69b" strokeWidth="1.2" />)}</g>
    {PENINSULA_LAND.map(land => <path key={land.name} d={land.path} fill="url(#map-forest)" fillRule="evenodd" />)}
    <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#map-grid)" />
    <g className="atlas__region-labels">{REGION_LABELS.map(label => {
      const { x, y } = mapPoint(label);
      return <text key={label.label} x={x} y={y}>{label.label}</text>;
    })}</g>
    <g className="atlas__sea-labels"><text x="190" y="220"><tspan x="190">Golfo de</tspan><tspan x="190" dy="1.15em">México</tspan></text>
      <text x="887" y="470" transform="rotate(-62 887 470)">Mar Caribe</text></g>
  </>;
});

interface FogProps { progress: Progress; maskId: string }

export const MapFog = memo(function MapFog({ progress, maskId }: FogProps) {
  const revealed = WORLDS.filter(world => worldDiscovered(progress, world));
  const hidden = WORLDS.filter(world => !worldDiscovered(progress, world));
  return <>
    <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1100">
      <rect x="-100" y="-100" width="1200" height="1100" fill="white" />
      {revealed.map(world => <polyline key={world.id} points={routePoints(world.levels.map(level => STATIONS[level.id]))}
        stroke="black" strokeWidth="78" strokeLinejoin="round" strokeLinecap="round" fill="none" />)}
    </mask></defs>
    <g mask={`url(#${maskId})`} className="atlas__fog" data-testid="map-fog">
      {hidden.map(world => <CloudBank key={world.id} id={world.id} points={routePoints(world.levels.map(level => STATIONS[level.id]))} />)}
    </g>
  </>;
});

function CloudBank({ points, id }: { points: string; id: string }) {
  return <g data-cloud-world={id} filter="url(#map-cloud-shadow)">
    <polyline points={points} fill="none" stroke="#b0c0c4" strokeWidth="100" strokeLinecap="round" strokeLinejoin="round" />
    {points.split(' ').map((point, index) => {
      const [x, y] = point.split(',').map(Number);
      return <g key={point} transform={`translate(${x} ${y})`}>
        <ellipse cx="-27" cy="9" rx="42" ry="28" fill="#bdcdd0" />
        <ellipse cx="8" cy="-12" rx="43" ry={index % 2 ? 34 : 38} fill="#d3dfe0" />
        <ellipse cx="40" cy="9" rx="35" ry="26" fill="#c8d7d9" />
      </g>;
    })}
  </g>;
}
