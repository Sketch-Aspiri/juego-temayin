import { GROUND, ROWS } from '../constants';
import type { EnemyId } from '../types';
import { CRUMBLE_TILE, type CrumbleSpan } from '../entities/crumble';
import type { LevelDef } from './types';
import type { BubbleVent, CurrentZone, WaterZone } from './zones';

export interface EnemySpawn {
  id: EnemyId;
  tx: number;
  ty: number;
}

export interface BuiltLevel {
  grid: string[][];
  width: number;
  enemies: EnemySpawn[];
  flagX: number;
  templeX: number;
  /** Monedas sueltas + bloques de moneda: base para calcular las estrellas. */
  totalCoins: number;
  /** Zonas de agua navegable (op `water`). */
  water: readonly WaterZone[];
  /** Corrientes (op `current`). */
  currents: readonly CurrentZone[];
  /** Respiraderos de burbujas que recargan oxígeno (op `bubbles`). */
  bubbles: readonly BubbleVent[];
  /** Tramos de escombro que se derrumban (op `crumble`). */
  crumbles: readonly CrumbleSpan[];
}

/** Convierte la definición declarativa de un nivel en una cuadrícula de bloques. */
export function buildLevel(def: LevelDef): BuiltLevel {
  const W = def.width;
  const grid = Array.from({ length: ROWS }, () => Array<string>(W).fill(' '));
  const set = (x: number, y: number, c: string): void => {
    if (x >= 0 && x < W && y >= 0 && y < ROWS) grid[y][x] = c;
  };

  const pits = def.ops.filter((o) => o[0] === 'pit') as ReadonlyArray<readonly ['pit', number, number]>;
  for (let x = 0; x < W; x++) {
    if (pits.some((p) => x >= p[1] && x <= p[2])) continue;
    for (let y = GROUND; y < ROWS; y++) set(x, y, 'G');
  }

  const enemies: EnemySpawn[] = [];
  const water: WaterZone[] = [];
  const currents: CurrentZone[] = [];
  const bubbles: BubbleVent[] = [];
  const crumbles: CrumbleSpan[] = [];
  let flagX = W - 10;
  let templeX = W - 5;

  for (const op of def.ops) {
    switch (op[0]) {
      case 'row':
        [...op[3]].forEach((c, i) => c !== ' ' && set(op[1] + i, op[2], c));
        break;
      case 'plat':
        for (let i = 0; i < op[3]; i++) set(op[1] + i, op[2], 'X');
        break;
      case 'coins':
        for (let i = 0; i < op[3]; i++) set(op[1] + i, op[2], 'o');
        break;
      case 'pipe': {
        const top = GROUND - op[2];
        set(op[1], top, 'p');
        set(op[1] + 1, top, 'q');
        for (let y = top + 1; y < GROUND; y++) {
          set(op[1], y, 'l');
          set(op[1] + 1, y, 'r');
        }
        break;
      }
      case 'stairs': {
        const [, x, n, dir] = op;
        for (let i = 0; i < n; i++) {
          const h = dir > 0 ? i + 1 : n - i;
          for (let k = 0; k < h; k++) set(x + i, GROUND - 1 - k, 'X');
        }
        break;
      }
      case 'col':
        for (let k = 0; k < op[2]; k++) set(op[1], GROUND - 1 - k, 'X');
        break;
      case 'wall':
        for (let y = 0; y < GROUND; y++) set(op[1], y, 'X');
        break;
      case 'flag':
        flagX = op[1];
        break;
      case 'temple':
        templeX = op[1];
        break;
      case 'spawn':
        enemies.push({ id: op[1], tx: op[2], ty: op[3] ?? GROUND - 1 });
        break;
      case 'water':
        water.push({ x0: op[1], x1: op[2], surface: op[3] });
        break;
      case 'current': {
        const [, x0, x1, y0, y1, vx, vy] = op;
        currents.push({ x0, x1, y0, y1, vx, vy });
        break;
      }
      case 'bubbles':
        bubbles.push({ x: op[1], y: op[2] });
        break;
      case 'crumble':
        for (let i = 0; i < op[3]; i++) set(op[1] + i, op[2], CRUMBLE_TILE);
        crumbles.push({ x: op[1], y: op[2], len: op[3] });
        break;
      case 'cannon': {
        const [, x, y, dir] = op;
        set(x, y, dir > 0 ? 'K' : '<');
        set(x + 1, y, dir > 0 ? '>' : 'K');
        break;
      }
      case 'pit':
        break;
    }
  }

  let totalCoins = 0;
  for (const row of grid) for (const c of row) if (c === 'o' || c === '?') totalCoins++;

  return { grid, width: W, enemies, flagX, templeX, totalCoins, water, currents, bubbles, crumbles };
}
