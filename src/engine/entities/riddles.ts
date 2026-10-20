import { GROUND, T } from '../constants';
import { overlap } from '../physics';
import type { Rect } from '../types';
import type { World } from '../World';
import { parsePrompt, parseTerm, termValue, type Term } from './numerals';

/** Estela con el enunciado (op `riddle`): decorado no sólido anclado al suelo. */
export interface Riddle {
  readonly id: string;
  /** Centro horizontal y base de la estela, en píxeles. */
  readonly cx: number;
  readonly base: number;
  readonly terms: readonly Term[];
  /** Valor de la respuesta: la piedra que valga lo mismo es la correcta, se escriba como se escriba. */
  readonly answerValue: number;
}

/** Piedra de respuesta (op `stone`): se activa al tocarla. */
export interface Stone extends Readonly<Rect> {
  readonly riddleId: string;
  readonly token: string;
  readonly term: Term;
}

/** Puerta de jade (op `gate`): columna de piedra que se retira al resolver su acertijo. */
export interface Gate {
  readonly riddleId: string;
  readonly x: number;
}

export const STONE_HEIGHT = 64;
/** Una piedra equivocada se apaga este tiempo (s); no cuesta vida, cacao ni puntos. */
export const STONE_WRONG_TIME = 1.2;
const SOLVED_SHAKE = 0.25;

export function createRiddle(tx: number, ty: number, id: string, prompt: string, answer: string): Riddle {
  const answerValue = termValue(parseTerm(answer));
  if (answerValue === null) throw new Error(`La respuesta del acertijo ${id} debe ser un número: «${answer}»`);
  return { id, cx: (tx + 0.5) * T, base: (ty + 1) * T, terms: parsePrompt(prompt), answerValue };
}

export function createStone(tx: number, ty: number, token: string, riddleId: string): Stone {
  return { riddleId, token, term: parseTerm(token), x: tx * T, y: (ty + 1) * T - STONE_HEIGHT, w: T, h: STONE_HEIGHT };
}

/** Compara por valor, no por texto: `#23` y `1/3` son la misma respuesta. */
export function isCorrect(stone: Stone, riddle: Riddle): boolean {
  return termValue(stone.term) === riddle.answerValue;
}

/** Retira la columna de cada puerta del acertijo; se llama también al reaparecer. */
export function openGates(world: World, riddleId: string): void {
  for (const gate of world.level.gates) {
    if (gate.riddleId !== riddleId) continue;
    for (let y = 0; y < GROUND; y++) if (world.grid[y][gate.x] === 'X') world.grid[y][gate.x] = ' ';
  }
}

function solve(world: World, riddleId: string): void {
  world.riddlesSolved = [...world.riddlesSolved, riddleId];
  openGates(world, riddleId);
  world.audio.play('power');
  world.shake = Math.max(world.shake, SOLVED_SHAKE);
}

/** Tocar una piedra: la correcta abre las puertas, una errónea se apaga un momento. */
export function updateRiddles(world: World, dt: number): void {
  // Actualizar o borrar la clave en curso durante el recorrido de un Map es seguro en JS.
  for (const [index, left] of world.stoneCooldown) {
    if (left - dt > 0) world.stoneCooldown.set(index, left - dt);
    else world.stoneCooldown.delete(index);
  }
  const { stones, riddles } = world.level;
  if (world.phase !== 'play' || stones.length === 0) return;
  for (let index = 0; index < stones.length; index++) {
    const stone = stones[index];
    if (world.riddlesSolved.includes(stone.riddleId) || world.stoneCooldown.has(index)) continue;
    if (!overlap(world.player, stone)) continue;
    const riddle = riddles.find(r => r.id === stone.riddleId);
    if (!riddle) continue;
    if (isCorrect(stone, riddle)) solve(world, riddle.id);
    else {
      world.stoneCooldown.set(index, STONE_WRONG_TIME);
      world.audio.play('warn');
    }
  }
}
