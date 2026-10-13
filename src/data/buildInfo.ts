export interface BuildInfo {
  readonly commit: string | null;
  readonly summary: string;
  readonly changes: readonly string[];
}

/** Vite sustituye este dato al compilar; una versión publicada no consulta commits posteriores. */
export const BUILD_INFO: BuildInfo = __BUILD_INFO__;
