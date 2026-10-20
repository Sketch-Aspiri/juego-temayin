import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getNotebookEntry, NOTEBOOK_ENTRIES, type NotebookEntry } from '../../../data/explorerNotebook';
import { NOTEBOOK_ART } from '../../../data/explorerNotebook/art';
import { assetUrl } from '../../../engine/assets';
import { useAppStore } from '../../../store/appStore';
import type { Progress } from '../../../store/progress';
import { NotebookPage } from './NotebookPage';
import { NotebookCover } from './NotebookCover';
import { NotebookToh } from './NotebookToh';
import '../map/stationInfo.css';

const CATEGORIES = [...new Set(NOTEBOOK_ENTRIES.map(entry => entry.category))];
const PLACES = [...new Set(NOTEBOOK_ENTRIES.map(entry => entry.place))];

/** La URL absoluta evita resolver la textura respecto al archivo CSS del build. */
function showNotebook(element: HTMLDialogElement | null): void {
  if (!element) return;
  const paperUrl = new URL(assetUrl(NOTEBOOK_ART.parchment), document.baseURI).href;
  element.style.setProperty('--notebook-paper', `url("${paperUrl}")`);
  element.showModal();
}

/** Evita que Tab deje el foco en la barra del navegador al llegar al extremo del diálogo. */
function containNotebookFocus(event: KeyboardEvent<HTMLDialogElement>): void {
  event.stopPropagation();
  if (event.key !== 'Tab') return;
  const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select, a[href], summary'))
    .filter(element => element.getClientRects().length > 0 && (!element.closest('details:not([open])') || element.tagName === 'SUMMARY'));
  const boundary = event.shiftKey ? targets[0] : targets.at(-1);
  if (document.activeElement !== boundary) return;
  event.preventDefault();
  (event.shiftKey ? targets.at(-1) : targets[0])?.focus();
}

interface NotebookCollectionProps {
  progress: Progress;
  entries: readonly NotebookEntry[];
  selected?: string;
  onSelect: (id: string) => void;
}

export function NotebookCollection({ entries, progress, selected, onSelect }: NotebookCollectionProps) {
  return <ul className="notebook-list" aria-label="Páginas del cuaderno">
    {entries.map(entry => {
      const found = progress.discoveries.includes(entry.id);
      const unread = found && !progress.readDiscoveries.includes(entry.id);
      return <li key={entry.id}><button type="button" disabled={!found} data-discovery={entry.id} aria-current={selected === entry.id ? 'page' : undefined}
        className={`notebook-entry${found ? '' : ' notebook-entry--locked'}`} onClick={() => onSelect(entry.id)}>
        <span className="notebook-entry__stamp" aria-hidden="true">{found ? '✧' : '◇'}</span>
        <span><small>{entry.place} · {entry.category}</small><strong>{found ? entry.title : 'Por descubrir'}</strong>
          <span className="notebook-entry__hint">{found ? 'Observación registrada' : `Explora el nivel ${entry.levelId}`}</span></span>
        {unread && <em>Nueva</em>}
      </button></li>;
    })}
  </ul>;
}

interface NotebookIndexProps extends NotebookCollectionProps {
  category: string;
  place: string;
  onCategory: (category: string) => void;
  onPlace: (place: string) => void;
}

function NotebookIndex({ progress, category, place, onCategory, onPlace, ...collection }: NotebookIndexProps) {
  return <section className="notebook-index" aria-label="Colección de descubrimientos">
    <p className="notebook-index__title">Índice del viaje</p>
    <div className="notebook-progress"><strong>{progress.discoveries.length}<span> / {NOTEBOOK_ENTRIES.length}</span></strong><p>descubrimientos registrados</p></div>
    <progress value={progress.discoveries.length} max={NOTEBOOK_ENTRIES.length} aria-label="Descubrimientos registrados" />
    <div className="notebook-filters"><label>Categoría<select aria-label="Categoría" value={category} onChange={event => onCategory(event.target.value)}>
      <option>Todas</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Lugar<select aria-label="Lugar" value={place} onChange={event => onPlace(event.target.value)}><option>Todos</option>
        {PLACES.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <NotebookCollection {...collection} progress={progress} />
    {!collection.entries.length && <p className="notebook-empty">No hay páginas con estos filtros. Prueba otro lugar o categoría.</p>}
  </section>;
}

export function ExplorerNotebook({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reading = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState('Todas');
  const [place, setPlace] = useState('Todos');
  const [selected, setSelected] = useState<string>();
  const progress = useAppStore(state => state.progress);
  const entry = selected && progress.discoveries.includes(selected) ? getNotebookEntry(selected) : undefined;
  const entries = NOTEBOOK_ENTRIES.filter(item => (category === 'Todas' || item.category === category) && (place === 'Todos' || item.place === place));

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    showNotebook(element);
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  const select = (id: string) => {
    if (!useAppStore.getState().progress.discoveries.includes(id)) return;
    useAppStore.getState().readDiscovery(id);
    setSelected(id);
    if (reading.current) reading.current.scrollTop = 0;
    requestAnimationFrame(() => {
      const article = reading.current?.querySelector<HTMLElement>('article');
      article?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 700px)').matches) article?.scrollIntoView({ block: 'start' });
    });
  };

  return <dialog ref={dialog} className="notebook" aria-labelledby="notebook-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={containNotebookFocus}>
    <header className="notebook-header"><div className="notebook-header__identity"><NotebookToh portrait decorative /><div><p className="notebook-eyebrow">Temayin · Las notas de Toh</p>
      <h2 id="notebook-title">Cuaderno de explorador</h2><p>Un viaje para observar, descubrir y cuidar.</p></div></div>
      <button type="button" className="notebook-close" onClick={onClose} aria-label="Cerrar cuaderno">✕</button></header>
    <div className="notebook-body"><NotebookIndex progress={progress} entries={entries} selected={selected} onSelect={select}
      category={category} place={place} onCategory={setCategory} onPlace={setPlace} /><div className="notebook-reading" ref={reading}>
      {entry ? <NotebookPage entry={entry} onIndex={() => dialog.current?.querySelector('select')?.focus()} /> : <NotebookCover />}
    </div></div>
    <footer className="notebook-footer"><span>Observa · Descubre · Cuida</span><span>Selecciona una página para leerla</span></footer>
  </dialog>;
}
