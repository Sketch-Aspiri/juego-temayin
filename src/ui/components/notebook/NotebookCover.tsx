import { NotebookToh } from './NotebookToh';
import { NOTEBOOK_ENTRIES } from '../../../data/explorerNotebook';

export function NotebookCover() {
  return <div className="notebook-cover">
    <figure className="notebook-cover__portrait"><NotebookToh /><figcaption>Toh · El pájaro reloj</figcaption></figure>
    <p className="notebook-eyebrow">Notas de selva, piedra y agua</p>
    <h3>Cada lugar<br />guarda una historia.</h3>
    <p className="notebook-cover__intro">Reúne las {NOTEBOOK_ENTRIES.length} páginas de los siete mundos y sus niveles secretos. Busca las marcas de pluma: Toh guardará tus descubrimientos para volver a ellos cuando quieras.</p>
    <div className="notebook-cover__note"><span aria-hidden="true">✧</span><p>Lo que descubres viaja contigo, aunque pierdas una vida o salgas del nivel.</p></div>
    <span className="notebook-cover__signature">Con cariño, Toh</span>
  </div>;
}
