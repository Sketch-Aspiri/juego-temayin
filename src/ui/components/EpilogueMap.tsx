import type { CSSProperties } from 'react';
import { EPILOGUE_RETURN } from '../../data/epilogue';
import { PENINSULA_LAND } from '../../data/peninsulaGeography';
import { MAP_HEIGHT, MAP_WIDTH, projectPosition, STATIONS } from '../../data/stations';
import { ALL_LEVELS } from '../../data/worlds';
import { SPRITES } from '../../data/intro';
import { assetUrl } from '../../engine/assets';
import '../epilogue.css';

const point = (position: Parameters<typeof projectPosition>[0]) => {
  const { x, y } = projectPosition(position);
  return `${x * MAP_WIDTH},${y * MAP_HEIGHT}`;
};
const journey = 'M' + ALL_LEVELS.map(level => point(STATIONS[level.id])).join('L');
const returning = 'M' + EPILOGUE_RETURN.map(point).join('L');

/** La ruta y el tren se animan con CSS; movimiento reducido presenta el regreso completo. */
export function EpilogueMap() {
  return <div className="epilogue-map" role="img" aria-label="La península vuelve a iluminarse; el tren regresa por Centenario hasta Escárcega">
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#103a43" />
      {PENINSULA_LAND.map(land => <path key={land.name} d={land.path} fill="#346047" stroke="#98b08c" strokeWidth="1" fillRule="evenodd" />)}
      <path className="epilogue-map__journey" d={journey} pathLength="100" />
      {ALL_LEVELS.map((level, index) => {
        const { x, y } = projectPosition(STATIONS[level.id]);
        return <circle key={level.id} className="epilogue-map__station" cx={x * MAP_WIDTH} cy={y * MAP_HEIGHT} r="6"
          style={{ animationDelay: `${index * 0.1}s` }}><title>{level.name}</title></circle>;
      })}
      <path className="epilogue-map__return" d={returning} pathLength="100" />
      {EPILOGUE_RETURN.slice(-2).map(station => {
        const { x, y } = projectPosition(station);
        return <text key={station.label} x={x * MAP_WIDTH} y={y * MAP_HEIGHT - 20}>{station.label}</text>;
      })}
      <g className="epilogue-map__train" style={{ offsetPath: `path('${returning}')` } as CSSProperties}>
        <svg x="-50" y="-11" width="100" height="22" viewBox={SPRITES.train.frame.join(' ')}>
          <image href={assetUrl(SPRITES.train.file)} width={SPRITES.train.sheetW} height={SPRITES.train.sheetH} />
        </svg>
      </g>
    </svg>
  </div>;
}
