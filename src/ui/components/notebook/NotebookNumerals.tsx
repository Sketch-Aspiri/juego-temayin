import { parseTerm, termValue, type Term } from '../../../engine/entities/numerals';
import { NUMERAL_ILLUSTRATIONS } from '../../../data/explorerNotebook/numeralIllustrations';

const CELL_WIDTH = 80;
const DRAWING_HEIGHT = 170;
const LEVEL_GAP = 54;
const BAR_GAP = 10;
const DOT_GAP = 10;
const DIGIT_CENTER = CELL_WIDTH / 2;

function MayaDigit({ value, y }: { value: number; y: number }) {
  const bars = Math.floor(value / 5), dots = value % 5;
  if (value === 0) return <g fill="none" stroke="currentColor" strokeWidth="2.5">
    <ellipse cx={DIGIT_CENTER} cy={y + 20} rx="19" ry="11" />
    <path d={`M32 ${y + 12}q-5 8 0 16m8-18v20m8-18q5 8 0 16`} />
  </g>;
  return <g fill="currentColor">
    {Array.from({ length: dots }, (_, i) => <circle key={`p${i}`} cx={DIGIT_CENTER + (i - (dots - 1) / 2) * DOT_GAP} cy={y + 7} r="3.5" />)}
    {Array.from({ length: bars }, (_, i) => <rect key={`r${i}`} x="21" y={y + 17 + i * BAR_GAP} width="38" height="6" rx="2" />)}
  </g>;
}

function NumeralTerm({ term }: { term: Term }) {
  if (term.kind !== 'maya') return <text x={DIGIT_CENTER} y="87" textAnchor="middle" fontSize={term.kind === 'op' ? 28 : 23} fill="currentColor">
    {term.kind === 'op' ? term.symbol : term.value}
  </text>;
  const top = term.levels.length > 1 ? 18 : 55;
  return <g>
    {term.levels.map((value, index) => <MayaDigit key={index} value={value} y={top + index * LEVEL_GAP} />)}
    <text x={DIGIT_CENTER} y="148" textAnchor="middle" fontSize="16" fill="currentColor">{termValue(term)}</text>
  </g>;
}

/** Esquemas vectoriales legibles a cualquier tamaño; no representan piezas arqueológicas. */
export function NotebookNumerals({ entryId, title }: { entryId: string; title: string }) {
  const tokens = NUMERAL_ILLUSTRATIONS[entryId];
  if (!tokens) return null;
  return <figure className="notebook-numerals">
    <svg viewBox={`0 0 ${tokens.length * CELL_WIDTH} ${DRAWING_HEIGHT}`} role="img" aria-label={`Ejemplo de numeración maya: ${title}`}>
      {tokens.map((token, index) => <g key={index} transform={`translate(${index * CELL_WIDTH} 0)`}><NumeralTerm term={parseTerm(token)} /></g>)}
    </svg>
    <figcaption>Esquema didáctico · Puntos = 1 · Rayas = 5 · Concha = 0. Las cifras debajo indican el valor.</figcaption>
  </figure>;
}
