import type { NotebookEntry } from '../../../data/explorerNotebook';
import { getNotebookPhoto } from '../../../data/explorerNotebook/photos';
import { StationPhoto } from '../map/StationPhoto';
import { NotebookToh } from './NotebookToh';

export function NotebookPage({ entry, onIndex }: { entry: NotebookEntry; onIndex?: () => void }) {
  const photo = getNotebookPhoto(entry.id);
  return <article className="notebook-page" aria-labelledby="notebook-page-title" tabIndex={-1} data-notebook-page={entry.id}>
    {onIndex && <button type="button" className="notebook-page__back" onClick={onIndex}>← Ver páginas</button>}
    <p className="notebook-eyebrow">{entry.category} <span> / </span> {entry.place}</p>
    <h3 id="notebook-page-title">{entry.title}</h3>
    <p className="notebook-page__text">{entry.text}</p>
    <aside className="notebook-page__toh"><NotebookToh portrait decorative /><div><strong>Una pista de Toh</strong><p>{entry.toh}</p></div></aside>
    {photo && <div className="notebook-page__photo">
      <p className="notebook-eyebrow">Lo que descubriste</p>
      <StationPhoto key={entry.id} photo={photo}><span className="notebook-photo-label">{entry.title}</span></StationPhoto>
      <p className="notebook-page__context">Fotografía real. Si el pie de foto indica que es de referencia, muestra la misma especie o tipo de lugar, no necesariamente el sitio exacto.</p>
    </div>}
    <details className="notebook-sources"><summary>Fuentes para seguir explorando</summary><ul>
      {entry.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}
    </ul></details>
  </article>;
}
