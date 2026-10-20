import { GROUND, ROWS, T } from '../constants';
import { createHammock, type Hammock } from '../entities/hammocks';
import type { RopeDef } from '../entities/ropes';
import { createFirefly, createTorch, type LightSource } from '../render/lighting';
import type { PlatformSpec } from '../entities/platforms';
import type { EnemyId } from '../types';
import type { CannonSpec } from '../entities/cannons';
import { CRUMBLE_TILE, type CrumbleSpan } from '../entities/crumble';
import { STROMATOLITE_TILE } from '../entities/stromatolites';
import { HOOP_COINS, type HoopSpec } from '../entities/hoops';
import { createTicket, type Ticket } from '../entities/tickets';
import { createDiscovery, type Discovery } from '../entities/discoveries';
import type { SlowZone } from './slowZones';
import type { LevelDef } from './types';
import type { BubbleVent, CurrentZone, WaterZone } from './zones';

export interface EnemySpawn {
  id: EnemyId;
  tx: number;
  ty: number;
}

export interface BuiltLevel {
  readonly discoveries: readonly Discovery[];
  readonly tickets: readonly Ticket[];
  /** Hamacas, columpios y luces independientes de la cuadrícula. */
  hammocks: readonly Hammock[];
  ropes: readonly RopeDef[];
  lights: readonly LightSource[];
  grid: string[][];
  width: number;
  enemies: EnemySpawn[];
  flagX: number;
  templeX: number;
  /** Monedas sueltas + bloques de moneda: base para calcular las estrellas. */
  totalCoins: number;
  /** Franjas de resina y sargazo que frenan (ops `resin`, `sargassum`). */
  slowZones: readonly SlowZone[];
  /** Zonas de agua navegable (op `water`). */
  water: readonly WaterZone[];
  /** Corrientes (op `current`). */
  currents: readonly CurrentZone[];
  /** Respiraderos de burbujas que recargan oxígeno (op `bubbles`). */
  bubbles: readonly BubbleVent[];
  /** Tramos de escombro que se derrumban (op `crumble`). */
  crumbles: readonly CrumbleSpan[];
  /** Plataformas móviles: vagones de tren y plataformas genéricas (ops `train` y `mover`). */
  platforms: readonly PlatformSpec[];
  /** Aros del juego de pelota (op `hoop`). */
  hoops: readonly HoopSpec[];
  /** Cañones de baluarte que disparan (op `cannon`); sus bloques ya están en `grid`. */
  cannons: readonly CannonSpec[];
  /** Viento y térmicas (op `wind`); misma forma que las corrientes pero actúan en el aire. */
  winds: readonly CurrentZone[];
  /** Luciérnagas (op `firefly`): luces fijas de radio pequeño, activas solo con `darkness`. */
  fireflies: readonly LightSource[];
  /** Tramos de estromatolito (op `stromatolite`); sus bloques `E` ya están en `grid`. */
  stromatolites: readonly CrumbleSpan[];
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
  const tickets: Ticket[] = [];
  const discoveries: Discovery[] = [];
  const hammocks: Hammock[] = [];
  const ropes: RopeDef[] = [];
  const lights: LightSource[] = [];
  const slowZones: SlowZone[] = [];
  const water: WaterZone[] = [];
  const currents: CurrentZone[] = [];
  const bubbles: BubbleVent[] = [];
  const crumbles: CrumbleSpan[] = [];
  const platforms: PlatformSpec[] = [];
  const hoops: HoopSpec[] = [];
  const cannons: CannonSpec[] = [];
  const winds: CurrentZone[] = [];
  const fireflies: LightSource[] = [];
  const stromatolites: CrumbleSpan[] = [];
  let flagX = W - 10;
  let templeX = W - 5;

  for (const op of def.ops) {
    switch (op[0]) {
      case 'discovery': discoveries.push(createDiscovery(op[1], op[2], op[3])); break;
      case 'ticket': tickets.push(createTicket(op[1], op[2])); break;
      case 'truck': platforms.push({ kind: 'mover', appearance: 'truck', x: op[1], y: op[2], length: op[3], dx: op[4], dy: 0, period: op[5] }); break;
      case 'hammock': hammocks.push(createHammock(op[1], op[2], op[3])); break;
      case 'rope': ropes.push({ x: (op[1] + 0.5) * T, y: op[2] * T, length: op[3] * T }); break;
      case 'torch': lights.push(createTorch(op[1], op[2])); break;
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
      case 'resin':
      case 'sargassum':
        slowZones.push({ kind: op[0], x0: op[1], x1: op[2], y: op[3] });
        break;
      case 'water':
        water.push({ x0: op[1], x1: op[2], surface: op[3] });
        break;
      case 'current': {
        const [, x0, x1, y0, y1, vx, vy] = op;
        currents.push({ x0, x1, y0, y1, vx, vy });
        break;
      }
      case 'stromatolite':
        for (let i = 0; i < op[3]; i++) set(op[1] + i, op[2], STROMATOLITE_TILE);
        stromatolites.push({ x: op[1], y: op[2], len: op[3] });
        break;
      case 'firefly': fireflies.push(createFirefly(op[1], op[2])); break;
      case 'wind': {
        const [, x0, x1, y0, y1, vx, vy] = op;
        winds.push({ x0, x1, y0, y1, vx, vy });
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
        cannons.push({ x, y, dir: dir > 0 ? 1 : -1 });
        break;
      }
      case 'train': {
        const [, x, y, cars, speed, range] = op;
        platforms.push({ kind: 'train', x, y, cars, speed, range });
        break;
      }
      case 'mover': {
        const [, x, y, length, dx, dy, period] = op;
        platforms.push({ kind: 'mover', x, y, length, dx, dy, period });
        break;
      }
      case 'boat':
      case 'turtle': {
        const [appearance, x, y, length, dx, dy, period] = op;
        platforms.push({ kind: 'mover', appearance, x, y, length, dx, dy, period });
        break;
      }
      case 'hoop':
        hoops.push({ x: op[1], y: op[2] });
        break;
      case 'pit':
        break;
    }
  }

  let totalCoins = 0;
  for (const row of grid) for (const c of row) if (c === 'o' || c === '?') totalCoins++;
  totalCoins += hoops.length * HOOP_COINS; // cacao que suelta cada aro al encestar

  return { discoveries, tickets, grid, width: W, enemies, flagX, templeX, totalCoins, water, currents, bubbles, crumbles, platforms, hammocks, ropes, lights, hoops, slowZones, cannons, winds, fireflies, stromatolites };
}
