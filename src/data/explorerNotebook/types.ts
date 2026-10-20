import type { FactCategory } from '../stationInfo/types';

export interface DiscoverySource {
  readonly label: string;
  readonly url: string;
}

export interface NotebookEntry {
  readonly id: string;
  readonly levelId: string;
  readonly place: string;
  readonly title: string;
  readonly category: FactCategory;
  readonly text: string;
  /** Invitación a observar, no una afirmación histórica adicional. */
  readonly toh: string;
  readonly sources: readonly DiscoverySource[];
  /** Distingue los nuevos apuntes del catálogo inicial; cada uno conserva su imagen acreditada. */
  readonly format?: 'field-note';
}
