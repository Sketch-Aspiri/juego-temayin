import { fly } from './behaviors';
import type { EnemyDef } from './types';

/** Murciélago: vuela ondulando. */
export const BAT: EnemyDef = { id: 'bat', w: 34, h: 26, stompable: true, flying: true, speed: 75, score: 300, move: fly };
