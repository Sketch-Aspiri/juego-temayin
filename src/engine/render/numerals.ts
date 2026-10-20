import type { Term } from '../entities/numerals';
import type { Ctx } from './drawUtils';

export const NUMERAL_FONT = '"Bree Serif", Georgia, serif';
export const NUMERAL_INK = '#214b3e';

const GLYPH_W = 36;
const DOT_R = 4.5;
const DOT_STEP = 10;
const BAR_H = 8;
const BAR_STEP = 12;
const BAR_INSET = 1;
const SHELL_H = 16;
const SHELL_INSET = 2;
const SHELL_SLITS: readonly number[] = [-8, 0, 8];
const SLIT_MARGIN = 4;
const LEVEL_GAP = 6;
const DOT_ROW_H = 13;
const TEXT_PAD = 6;
const TEXT_H = 30;
const TEXT_BASELINE = 3;
const DIGIT_FONT_PX = 26;
const OPERATOR_FONT_PX = 30;
const GLYPH_LINE = 2;
const BAR_RADIUS = 3;

export interface Size { readonly w: number; readonly h: number }
/** Mide un texto con una fuente (lo aporta quien dibuja, que conoce el contexto). */
export type Measure = (text: string, font: string) => number;

function digitHeight(digit: number): number {
  if (digit === 0) return SHELL_H;
  return Math.floor(digit / 5) * BAR_STEP + (digit % 5 > 0 ? DOT_ROW_H : 0);
}

function textFont(term: Term, scale: number): string {
  return `bold ${Math.round((term.kind === 'op' ? OPERATOR_FONT_PX : DIGIT_FONT_PX) * scale)}px ${NUMERAL_FONT}`;
}

function textOf(term: Term): string {
  if (term.kind === 'arabic') return String(term.value);
  return term.kind === 'op' ? term.symbol : '';
}

/** Ancho y alto del término a esa escala. Los numerales mayas no necesitan medir texto. */
export function termSize(term: Term, scale: number, measure: Measure): Size {
  if (term.kind === 'maya') {
    const h = term.levels.reduce((sum, d) => sum + digitHeight(d), 0) + (term.levels.length - 1) * LEVEL_GAP;
    return { w: GLYPH_W * scale, h: h * scale };
  }
  return { w: measure(textOf(term), textFont(term, scale)) + TEXT_PAD * scale, h: TEXT_H * scale };
}

function drawShell(c: Ctx, cx: number, bottom: number): void {
  c.beginPath();
  c.ellipse(cx, bottom - SHELL_H / 2, GLYPH_W / 2 - SHELL_INSET, SHELL_H / 2 - 1, 0, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  for (const dx of SHELL_SLITS) { c.moveTo(cx + dx, bottom - SHELL_H + SLIT_MARGIN); c.lineTo(cx + dx, bottom - SLIT_MARGIN); }
  c.stroke();
}

/** Dibuja un dígito 0..19 (rayas abajo, puntos arriba) y devuelve su borde superior. */
function drawDigit(c: Ctx, digit: number, cx: number, bottom: number): number {
  if (digit === 0) { drawShell(c, cx, bottom); return bottom - SHELL_H; }
  let y = bottom;
  for (let i = 0; i < Math.floor(digit / 5); i++) {
    c.beginPath();
    c.roundRect(cx - GLYPH_W / 2 + BAR_INSET, y - BAR_H - BAR_INSET, GLYPH_W - 2 * BAR_INSET, BAR_H, BAR_RADIUS);
    c.fill();
    y -= BAR_STEP;
  }
  const dots = digit % 5;
  for (let i = 0; i < dots; i++) {
    c.beginPath(); c.arc(cx + (i - (dots - 1) / 2) * DOT_STEP, y - DOT_ROW_H / 2, DOT_R, 0, Math.PI * 2); c.fill();
  }
  return dots > 0 ? y - DOT_ROW_H : y;
}

/** Dibuja el término con la base en `bottom` y centrado en `cx` a esa escala. */
export function drawTerm(c: Ctx, term: Term, cx: number, bottom: number, scale: number): void {
  c.save();
  c.fillStyle = NUMERAL_INK; c.strokeStyle = NUMERAL_INK; c.lineWidth = GLYPH_LINE;
  if (term.kind === 'maya') {
    c.translate(cx, bottom); c.scale(scale, scale);
    let y = 0;
    for (let i = term.levels.length - 1; i >= 0; i--) y = drawDigit(c, term.levels[i], 0, y) - LEVEL_GAP;
  } else {
    c.font = textFont(term, scale); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(textOf(term), cx, bottom - TEXT_BASELINE * scale);
  }
  c.restore();
}
