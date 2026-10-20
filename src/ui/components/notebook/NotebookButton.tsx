import { useRef, useState } from 'react';
import { useAppStore } from '../../../store/appStore';
import { ExplorerNotebook } from './ExplorerNotebook';
import './notebook.css';

interface NotebookButtonProps {
  label?: string;
  className?: string;
}

/** Un diálogo conserva montada la pantalla anfitriona, incluido el motor en pausa. */
export function NotebookButton({ label = 'Cuaderno de Toh', className = 'btn' }: NotebookButtonProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const unread = useAppStore(state => state.progress.discoveries.filter(id => !state.progress.readDiscoveries.includes(id)).length);
  const close = () => { setOpen(false); button.current?.focus({ preventScroll: true }); };
  return <>
    <button ref={button} type="button" className={className} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      {label}{unread > 0 && <span className="notebook-badge" aria-label={`${unread} páginas nuevas`}>{unread}</span>}
    </button>
    {open && <ExplorerNotebook onClose={close} />}
  </>;
}
