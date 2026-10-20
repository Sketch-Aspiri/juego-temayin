export type FactCategory = 'Historia' | 'Naturaleza' | 'Cultura viva' | 'Arquitectura';

export interface GuideReference {
  readonly section: string;
  readonly printedPages: readonly [number, number];
  readonly pdfPage: number;
}

export type StationText =
  | { readonly text: string; readonly source: GuideReference }
  | { readonly text: string; readonly source: 'game' };

export interface StationFact {
  readonly category: FactCategory;
  readonly text: string;
  readonly source: GuideReference;
}

export interface StationInfo {
  readonly location: string;
  readonly relation: 'direct' | 'regional' | 'fiction';
  readonly note?: string;
  readonly description: StationText;
  readonly facts: readonly [StationFact, StationFact, StationFact];
}

export const GUIDE_TITLE = 'INAH · Gran Guía Tren Maya (2023)';
export const GUIDE_URL = 'https://www.trenmaya.gob.mx/images/granguiainah.pdf';
const PDF_FRONT_MATTER_PAGES = 2;

/** Esta edición reúne dos páginas impresas en cada página del PDF. */
export function guide(section: string, first: number, last = first): GuideReference {
  return { section, printedPages: [first, last], pdfPage: Math.floor(first / 2) + PDF_FRONT_MATTER_PAGES };
}

export function sourced(text: string, source: GuideReference): StationText {
  return { text, source };
}

export function fact(category: FactCategory, text: string, source: GuideReference): StationFact {
  return { category, text, source };
}

export function guideUrl(source: GuideReference): string {
  return `${GUIDE_URL}#page=${source.pdfPage}`;
}

export function pageLabel(source: GuideReference): string {
  const [first, last] = source.printedPages;
  return first === last ? `p. ${first}` : `pp. ${first}–${last}`;
}
