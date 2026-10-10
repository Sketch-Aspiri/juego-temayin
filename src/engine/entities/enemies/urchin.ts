import { walk } from './behaviors';
import type { EnemyDef } from './types';

/** Erizo de mar: camina; sus púas impiden pisarlo. */
export const URCHIN: EnemyDef = { id: 'urchin', w: 36, h: 34, stompable: false, flying: false, speed: 60, score: 200, move: walk };
