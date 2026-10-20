/**
 * Numerales mayas de los acertijos (ops `riddle` y `stone`). Sin DOM: solo interpreta los
 * términos de texto que escriben los niveles.
 *
 * Sintaxis de un término:
 *  - `N` (0..19)    numeral maya: punto = 1, raya = 5, concha = 0.
 *  - `a/b[/c]`      numerales apilados de arriba abajo (valor posicional en base 20).
 *  - `#N`           cifras arábigas, para pedir o dar respuestas mayores de 19.
 *  - `+ × = ?`      operadores y la incógnita.
 */
export const MAX_MAYA_DIGIT = 19;
export const MAYA_BASE = 20;

export type Operator = '+' | '×' | '=' | '?';

export type Term =
  | { readonly kind: 'maya'; readonly levels: readonly number[] }
  | { readonly kind: 'arabic'; readonly value: number }
  | { readonly kind: 'op'; readonly symbol: Operator };

const OPERATORS: ReadonlySet<string> = new Set<Operator>(['+', '×', '=', '?']);
const DIGITS = /^\d{1,2}$/;
const INTEGER = /^\d{1,6}$/;

/** Interpreta un término; lanza si el texto del nivel es inválido (falla pronto, en la construcción). */
export function parseTerm(token: string): Term {
  if (OPERATORS.has(token)) return { kind: 'op', symbol: token as Operator };
  if (token.startsWith('#') && INTEGER.test(token.slice(1))) return { kind: 'arabic', value: Number(token.slice(1)) };
  const parts = token.split('/');
  const levels = parts.map(Number);
  if (parts.every(p => DIGITS.test(p)) && levels.every(n => n <= MAX_MAYA_DIGIT)) return { kind: 'maya', levels };
  throw new Error(`Término numérico no válido: «${token}»`);
}

export function parsePrompt(prompt: string): readonly Term[] {
  return prompt.split(/\s+/).filter(Boolean).map(parseTerm);
}

/** Valor entero del término; `null` para operadores. Los numerales apilados valen en base 20. */
export function termValue(term: Term): number | null {
  if (term.kind === 'maya') return term.levels.reduce((total, digit) => total * MAYA_BASE + digit, 0);
  return term.kind === 'arabic' ? term.value : null;
}
