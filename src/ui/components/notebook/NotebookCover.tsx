import { NotebookToh } from './NotebookToh';

export function NotebookCover() {
  return <div className="notebook-cover">
    <figure className="notebook-cover__portrait"><NotebookToh /><figcaption>Toh · El pájaro reloj</figcaption></figure>
    <p className="notebook-eyebrow">Notas de selva, piedra y agua</p>
    <h3>Cada lugar<br />guarda una historia.</h3>
    <p className="notebook-cover__intro">Busca las marcas de pluma en Palenque, Campeche y Bacalar. Toh guardará aquí tus descubrimientos para volver a ellos cuando quieras.</p>
    <div className="notebook-cover__note"><span aria-hidden="true">✧</span><p>Lo que descubres viaja contigo, aunque pierdas una vida o salgas del nivel.</p></div>
    <span className="notebook-cover__signature">Con cariño, Toh</span>
  </div>;
}
