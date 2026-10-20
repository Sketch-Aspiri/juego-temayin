import { useEffect, useRef, useState } from 'react';
import { getNotebookEntry } from '../../../data/explorerNotebook';
import type { Run } from '../../../store/appStore';

const NOTICE_MS = 4200;

/** Una cola conserva las observaciones recogidas entre dos publicaciones del HUD. */
export function DiscoveryNotice({ ids, initial, run, paused }: {
  ids: readonly string[]; initial: readonly string[]; run: Run; paused: boolean;
}) {
  const seen = useRef(new Set(initial));
  const activeRun = useRef(run);
  const [queue, setQueue] = useState<readonly string[]>([]);
  useEffect(() => {
    if (activeRun.current !== run) {
      activeRun.current = run;
      seen.current = new Set(initial);
      setQueue([]);
    }
    const added = ids.filter(id => !seen.current.has(id));
    added.forEach(id => seen.current.add(id));
    if (added.length) setQueue(previous => [...previous, ...added]);
  }, [ids, initial, run]);
  const first = queue[0];
  useEffect(() => {
    if (!first || paused) return;
    const timer = window.setTimeout(() => setQueue(previous => previous.slice(1)), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [first, paused]);
  const entry = first && getNotebookEntry(first);
  return <div className="discovery-notice" role="status" aria-live="polite" hidden={!entry || paused}>
    {entry && <><span aria-hidden="true">✦</span><div><small>¡Nuevo descubrimiento!</small><strong>{entry.title}</strong>
      <p>Guardado en tu cuaderno · Léelo desde la pausa</p></div></>}
  </div>;
}
