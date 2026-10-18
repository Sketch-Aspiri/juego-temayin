import type { ControlAction } from '../engine/controls';

export const CONTROL_LABELS: Readonly<Record<ControlAction, string>> = {
  left: 'Izquierda', right: 'Derecha', jump: 'Saltar', run: 'Correr', fire: 'Fuego / pelota', pause: 'Pausa', mute: 'Silenciar',
};
const KEY_LABELS: Readonly<Record<string, string>> = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espacio',
  ShiftLeft: 'Shift izq.', ShiftRight: 'Shift der.', Comma: ',', Period: '.', Slash: '/', Semicolon: ';',
  Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`',
};
/** Nombres físicos de las teclas para que el mapa guardado no dependa del idioma del navegador. */
export const keyLabel = (code: string): string => KEY_LABELS[code] ?? code.replace(/^(Key|Digit)/, '');
