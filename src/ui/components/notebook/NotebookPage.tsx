import type { NotebookEntry } from '../../../data/explorerNotebook';
import { STATION_PHOTOS } from '../../../data/stationInfo/photos';
import { StationPhoto } from '../map/StationPhoto';
import { NotebookToh } from './NotebookToh';

export function NotebookPage({ entry, onIndex }: { entry: NotebookEntry; onIndex?: () => void }) {
  const photo = STATION_PHOTOS[entry.levelId];
  return <article className="notebook-page" aria-labelledby="notebook-page-title" tabIndex={-1} data-notebook-page={entry.id}>
    {onIndex && <button type="button" className="notebook-page__back" onClick={onIndex}>← Ver páginas</button>}
    <p className="notebook-eyebrow">{entry.category} <span> / </span> {entry.place}</p>
    <h3 id="notebook-page-title">{entry.title}</h3>
    <p className="notebook-page__text">{entry.text}</p>
    <aside className="notebook-page__toh"><NotebookToh portrait decorative /><div><strong>Una pista de Toh</strong><p>{entry.toh}</p></div></aside>
    <div className="notebook-page__photo">
      <p className="notebook-eyebrow">El lugar real</p>
      <StationPhoto key={entry.id} photo={photo}><span className="notebook-photo-label">Entorno del descubrimiento</span></StationPhoto>
      <p className="notebook-page__context">La fotografía muestra el lugar de referencia; no representa necesariamente el animal, la planta o el detalle descrito.</p>
    </div>
    <details className="notebook-sources"><summary>Fuentes para seguir explorando</summary><ul>
      {entry.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}
    </ul></details>
  </article>;
}
