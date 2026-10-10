import type { Assets } from '../assets';
import { GROUND, ROWS, T, TAU, VH, VW } from '../constants';
import type { World } from '../World';
import { CRUMBLE_TILE } from '../entities/crumble';
import { crumbleShakeAt, drawFallingCrumbles } from './crumble';
import type { Ctx } from './drawUtils';
import { drawEnemySprite } from './enemies';
import { drawCheckpoint, drawGoal } from './goal';
import { drawPlatforms } from './platforms';
import { drawCacao } from './props';
import {
  drawFireballs,
  drawItemSprite,
  drawParticles,
  drawPlayerSprite,
  drawQuills,
} from './sprites';
import { createTextures, FIXED_TEXTURE, type Textures } from './textures';
import { THEMES, type ThemeDef } from './themes';
import { drawSnorkelItem, drawWaterLayer } from './water';
import type { ThemeId } from '../types';

const BLOCK_QUESTION = new Set(['?', 'M', 'L', 'F', 'S']);
const BUMP_HEIGHT = 10;
const BUMP_TIME = 0.15;

/** Dibuja un `World` en un lienzo 2D. No modifica el estado del juego. */
export class Renderer {
  private readonly ctx: Ctx;
  private readonly textures: Textures;

  constructor(canvas: HTMLCanvasElement, private readonly assets: Assets) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible en este navegador');
    this.ctx = ctx;
    this.textures = createTextures();
  }

  /** Cielo, sol, escenario con parallax y velo de color del tema. */
  drawBackdrop(themeId: ThemeId, cam: number, now: number): void {
    const c = this.ctx;
    const theme = THEMES[themeId];
    const g = c.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, VW, VH);
    if (theme.sun) {
      c.fillStyle = 'rgba(255,245,180,.9)';
      c.beginPath();
      c.arc(VW - 140, 90, 44, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,245,180,.25)';
      c.beginPath();
      c.arc(VW - 140, 90, 70, 0, TAU);
      c.fill();
    }
    theme.scenery(c, cam, now);
    if (theme.tint) {
      c.fillStyle = theme.tint;
      c.fillRect(0, 0, VW, VH);
    }
  }

  render(world: World, now: number, paused: boolean): void {
    const c = this.ctx;
    const theme = THEMES[world.def.theme];
    this.drawBackdrop(world.def.theme, world.camX, now);
    if (theme.water) this.drawWater(theme, world.camX, now);

    c.save();
    if (world.shake > 0 && !paused) {
      const k = Math.min(1, world.shake * 3);
      c.translate((Math.random() - 0.5) * 12 * k, (Math.random() - 0.5) * 8 * k);
    }
    drawGoal(c, world, now);
    drawCheckpoint(c, world, now);
    this.drawTiles(world, theme, now);
    drawFallingCrumbles(c, world.crumbles, world.camX, this.textures.rubble);
    drawPlatforms(c, world.platforms, world.camX);
    for (const it of world.items) if (!drawSnorkelItem(c, it, world.camX, now)) drawItemSprite(c, it, world.camX, now);
    for (const e of world.enemies) if (e.alive && e.active) drawEnemySprite(c, this.assets, e, world.camX);
    world.boss?.draw(c, this.assets, world.camX);
    drawQuills(c, world.quills, world.camX);
    drawPlayerSprite(c, this.assets, world.player, world.camX, world.phase === 'dying', world.phaseT, now);
    drawFireballs(c, world.fireballs, world.camX);
    drawWaterLayer(c, world, theme.water, now);
    drawParticles(c, world.particles, world.popups, world.camX);
    c.restore();
  }

  private drawWater(theme: ThemeDef, camX: number, now: number): void {
    const water = theme.water;
    if (!water) return;
    const c = this.ctx;
    const t = now / 1000;
    const top = GROUND * T + 14;
    c.fillStyle = water.fill;
    c.fillRect(0, top, VW, VH - top);
    c.fillStyle = water.foam;
    for (let x = -40; x < VW + 40; x += 40) {
      const wx = x - (camX % 40);
      c.beginPath();
      c.ellipse(wx + Math.sin(t * 2 + x) * 3, top, 20, 5, 0, 0, Math.PI);
      c.fill();
    }
  }

  private drawTiles(world: World, theme: ThemeDef, now: number): void {
    const c = this.ctx;
    const x0 = Math.floor(world.camX / T);
    const x1 = Math.min(world.width - 1, x0 + Math.ceil(VW / T) + 1);
    const blink = (Math.sin(now / 180) + 1) / 2;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.grid[ty][tx];
        if (t === ' ') continue;
        const sx = Math.round(tx * T - world.camX);
        let sy = ty * T;
        const bump = world.bumps.get(`${tx},${ty}`);
        if (bump) sy -= Math.sin((bump / BUMP_TIME) * Math.PI) * BUMP_HEIGHT;
        if (t === CRUMBLE_TILE) {
          c.drawImage(this.textures.rubble, sx + crumbleShakeAt(world.crumbles, tx, ty, now), sy);
          continue;
        }
        if (t === 'o') {
          drawCacao(c, sx + T / 2, sy + T / 2, now / 150 + tx);
          continue;
        }
        c.drawImage(this.textures[this.textureFor(world, theme, t, tx, ty)], sx, sy);
        if (BLOCK_QUESTION.has(t) && blink > 0.7) {
          c.fillStyle = `rgba(255,255,255,${(blink - 0.7) * 0.8})`;
          c.fillRect(sx + 2, sy + 2, T - 4, T - 4);
        }
      }
    }
  }

  private textureFor(world: World, theme: ThemeDef, tile: string, tx: number, ty: number) {
    if (tile === 'G') return world.solid(tx, ty - 1) ? theme.groundBody : theme.groundTop;
    if (tile === 'X') return theme.platform;
    if (tile === 'S') return 'question'; // bloque snorkel
    return FIXED_TEXTURE[tile] ?? 'stone';
  }
}
