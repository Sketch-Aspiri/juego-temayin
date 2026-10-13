import { BUILD_INFO, type BuildInfo } from '../../data/buildInfo';

interface VersionNoteProps {
  readonly info?: BuildInfo;
  readonly production?: boolean;
}
const SHORT_COMMIT_LENGTH = 7;

/** Resumen visible y detalles opcionales: el menú conserva el protagonismo. */
export function VersionNote({ info = BUILD_INFO, production = import.meta.env.PROD }: VersionNoteProps) {
  return (
    <section className="version-note" aria-label="Notas de versión">
      <div className="version-note__heading">
        <span>{production ? 'Versión desplegada' : 'Versión local'}</span>
        {info.commit && <code title={`Commit ${info.commit}`}>commit {info.commit.slice(0, SHORT_COMMIT_LENGTH)}</code>}
      </div>
      <p className="version-note__summary">{info.summary}</p>
      {info.changes.length > 0 && (
        <details className="version-note__details">
          <summary>Ver cambios de esta versión</summary>
          <ul>{info.changes.map(change => <li key={change}>{change}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
