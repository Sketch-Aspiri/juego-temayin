import { execFileSync } from 'node:child_process';
import type { BuildInfo } from '../src/data/buildInfo.ts';

type BuildEnvironment = Readonly<Record<string, string | undefined>>;
const COMMIT_PATTERN = /^[a-f\d]{7,64}$/i;
const CONVENTIONAL_PREFIX = /^[a-z]+(?:\([^)]*\))?!?:\s*/i;
const UNAVAILABLE = 'Información de versión no disponible.';

/** El archivo publicado conserva el commit que lo produjo, aunque Git avance después. */
export function parseBuildInfo(log: string, environment: BuildEnvironment = {}): BuildInfo {
  const [revision = '', subject = '', ...body] = log.trim().split(/\r?\n/);
  const commit = (environment.TEMAYIN_BUILD_COMMIT ?? revision).trim();
  if (!COMMIT_PATTERN.test(commit)) return { commit: null, summary: UNAVAILABLE, changes: [] };
  const summary = (environment.TEMAYIN_BUILD_SUMMARY ?? subject).replace(CONVENTIONAL_PREFIX, '').trim();
  const notes = environment.TEMAYIN_BUILD_CHANGES ?? body.join('\n');
  const changes = notes.split(/\r?\n/).map(line => line.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
  return { commit, summary: summary || UNAVAILABLE, changes: [...new Set(changes)] };
}

/** Las variables permiten compilar un archivo fuente sin carpeta .git, sin consultas en el navegador. */
export function readBuildInfo(environment: BuildEnvironment = process.env): BuildInfo {
  let log = '';
  try {
    log = execFileSync('git', ['log', '-1', '--format=%H%n%s%n%b'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    // Una distribución de fuentes puede no incluir Git; no se inventa un commit.
  }
  return parseBuildInfo(log, environment);
}
