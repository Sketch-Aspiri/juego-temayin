import { T, TAU } from '../constants';
import { makeTile, type Ctx } from './drawUtils';
import { createMayaTextures } from './mayaTextures';
import { createRuinsTextures, type RuinsTexId } from './ruinsTextures';
import { createGulfTextures, type GulfTexId } from './gulfTextures';
import { createHaciendaTextures } from './haciendaTextures';
import { createTrainTextures, type TrainTexId, type ShipTexId } from './trainTextures';
import { createXibalbaTextures, type XibalbaTexId } from './xibalbaTextures';

export type TexId =
  | 'dirt' | 'grass' | 'brick' | 'question' | 'used' | 'stone' | 'sand' | 'sandTop' | 'wood'
  | 'rock' | 'rockTop' | 'crystal'
  | 'pipeTL' | 'pipeTR' | 'pipeBL' | 'pipeBR'
  | RuinsTexId
  | GulfTexId
  | 'redEarth' | 'redEarthTop' | 'masonry'
  | XibalbaTexId
  | TrainTexId | ShipTexId;

export type Textures = Readonly<Record<TexId, HTMLCanvasElement>>;

/** Textura fija asociada a cada carácter de bloque (G y X dependen del tema). */
export const FIXED_TEXTURE: Readonly<Record<string, TexId>> = {
  B: 'brick',
  '?': 'question',
  M: 'question',
  L: 'question',
  F: 'question',
  P: 'question',
  U: 'used',
  p: 'pipeTL',
  q: 'pipeTR',
  l: 'pipeBL',
  r: 'pipeBR',
  D: 'rubble',
  K: 'cannonBreech',
  '>': 'cannonMuzzleR',
  '<': 'cannonMuzzleL',
};

const dots = (c: Ctx, color: string, pts: ReadonlyArray<readonly [number, number]>, r = 3): void => {
  c.fillStyle = color;
  for (const [x, y] of pts) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }
};

const squares = (c: Ctx, color: string, pts: ReadonlyArray<readonly [number, number]>): void => {
  c.fillStyle = color;
  for (const [x, y] of pts) c.fillRect(x, y, 3, 3);
};

/** Genera todas las texturas de bloques una sola vez (requiere DOM). */
export function createTextures(): Textures {
  return {
    dirt: makeTile(T, (c) => {
      c.fillStyle = '#9a5b2e';
      c.fillRect(0, 0, T, T);
      dots(c, '#7d4522', [[6, 8], [24, 4], [30, 22], [10, 28], [20, 16], [34, 34]]);
    }),
    grass: makeTile(T, (c) => {
      c.fillStyle = '#9a5b2e';
      c.fillRect(0, 0, T, T);
      dots(c, '#7d4522', [[8, 24], [26, 30], [18, 34], [33, 20]]);
      c.fillStyle = '#3fb34a';
      c.fillRect(0, 0, T, 13);
      c.fillStyle = '#2b8c36';
      for (let x = 0; x < T; x += 8) {
        c.beginPath();
        c.moveTo(x, 12);
        c.lineTo(x + 4, 18);
        c.lineTo(x + 8, 12);
        c.fill();
      }
      c.fillStyle = '#7ee07f';
      c.fillRect(0, 0, T, 3);
    }),
    stone: makeTile(T, (c) => {
      c.fillStyle = '#6f6a62';
      c.fillRect(0, 0, T, T);
      c.fillStyle = '#a7a196';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(T, 0);
      c.lineTo(T - 6, 6);
      c.lineTo(6, 6);
      c.lineTo(6, T - 6);
      c.lineTo(0, T);
      c.fill();
      c.fillStyle = '#48443e';
      c.beginPath();
      c.moveTo(T, T);
      c.lineTo(0, T);
      c.lineTo(6, T - 6);
      c.lineTo(T - 6, T - 6);
      c.lineTo(T - 6, 6);
      c.lineTo(T, 0);
      c.fill();
      c.fillStyle = '#8a8478';
      c.fillRect(6, 6, T - 12, T - 12);
      c.strokeStyle = '#6f6a62';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(12, 14);
      c.lineTo(20, 20);
      c.lineTo(17, 28);
      c.stroke();
    }),
    sand: makeTile(T, (c) => {
      c.fillStyle = '#e9c27a';
      c.fillRect(0, 0, T, T);
      squares(c, '#d4a85e', [[6, 8], [24, 4], [30, 22], [10, 28], [20, 16], [34, 34]]);
    }),
    sandTop: makeTile(T, (c) => {
      c.fillStyle = '#e9c27a';
      c.fillRect(0, 0, T, T);
      squares(c, '#d4a85e', [[8, 24], [26, 30], [18, 34], [33, 18]]);
      c.fillStyle = '#f8e3b0';
      c.fillRect(0, 0, T, 8);
      c.fillStyle = '#fff6dc';
      c.fillRect(0, 0, T, 3);
      dots(c, '#f0a8b8', [[28, 14]]); // conchita
    }),
    wood: makeTile(T, (c) => {
      c.fillStyle = '#5a3415';
      c.fillRect(0, 0, T, T);
      for (let i = 0; i < 3; i++) {
        c.fillStyle = i % 2 ? '#b07a45' : '#c48a50';
        c.fillRect(1, 1 + i * 13, T - 2, 11);
        c.fillStyle = '#e0b07a';
        c.fillRect(1, 1 + i * 13, T - 2, 2);
        c.fillStyle = '#3d220c';
        c.fillRect(5, 5 + i * 13, 2, 2);
        c.fillRect(T - 7, 5 + i * 13, 2, 2);
      }
    }),
    rock: makeTile(T, (c) => {
      c.fillStyle = '#34505a';
      c.fillRect(0, 0, T, T);
      dots(c, '#223a44', [[8, 10], [26, 6], [32, 26], [12, 30], [22, 18]], 4);
      squares(c, '#4d7380', [[4, 22], [28, 14], [18, 34]]);
    }),
    rockTop: makeTile(T, (c) => {
      c.fillStyle = '#34505a';
      c.fillRect(0, 0, T, T);
      dots(c, '#223a44', [[10, 26], [28, 30], [20, 20]], 4);
      c.fillStyle = '#3c9a7a';
      c.fillRect(0, 0, T, 10);
      c.fillStyle = '#2a7a60';
      for (let x = 0; x < T; x += 10) {
        c.beginPath();
        c.moveTo(x, 9);
        c.lineTo(x + 5, 16);
        c.lineTo(x + 10, 9);
        c.fill();
      }
      c.fillStyle = '#7fe0bd';
      c.fillRect(0, 0, T, 3);
    }),
    crystal: makeTile(T, (c) => {
      c.fillStyle = '#2c4a73';
      c.fillRect(0, 0, T, T);
      c.fillStyle = '#4d7fc2';
      c.fillRect(3, 3, T - 6, T - 6);
      c.fillStyle = '#8fd4ff';
      c.beginPath();
      c.moveTo(6, 6);
      c.lineTo(T - 6, 6);
      c.lineTo(T - 14, 16);
      c.lineTo(14, 16);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.fillRect(8, 20, 4, 12);
      c.fillStyle = '#1d3354';
      c.fillRect(0, T - 3, T, 3);
    }),
    ...createMayaTextures(),
    ...createRuinsTextures(),
    ...createGulfTextures(),
    ...createHaciendaTextures(),
    ...createXibalbaTextures(),
    ...createTrainTextures(),
  };
}
