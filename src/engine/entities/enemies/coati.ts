import { walk } from './behaviors';
import type { EnemyDef } from './types';

/** Coatí guardián: camina y da la vuelta al chocar. */
export const COATI: EnemyDef = { id: 'coati', w: 36, h: 34, stompable: true, flying: false, speed: 60, score: 200, move: walk };
