import type { Assets } from '../assets';
import { Lighting } from './lighting';
import { drawWeather } from './weather';
import { drawBossArena } from './bossArena';
import { arenaPlatformArt, drawArenaPlatforms, type ArenaPlatformArt } from './scenerySprites';
import { drawHaciendaProps, drawTohHint } from './haciendaProps';
import { drawBalls, drawHoops } from './ball';
import { drawCannonballs, drawCannonFx } from './cannons';
import { GROUND, ROWS, T, TAU, VH, VW } from '../constants';
import type { World } from '../World';
import { CRUMBLE_TILE } from '../entities/crumble';
import { crumbleShakeAt, drawFallingCrumbles } from './crumble';
import type { Ctx } from './drawUtils';
import { drawEnemySprite } from './enemies';
import { drawCheckpoint, drawGoal } from './goal';
import { drawPlatforms } from './platforms';
import { drawCacao } from './props';
import { drawSlowZones } from './slowZones';
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
import { drawBeachProps } from './beachProps';
import { drawCannonTile, drawFragileTile } from './levelSprites';
import { drawMayaTile, drawPaintedTerrain, drawRewardLight } from './mayaTiles';
import { renderViewport } from './viewport';
import { drawOffering } from './offering';

const BUMP_HEIGHT = 10;
const BUMP_TIME = 0.15;
const DECORATIVE_WATER_OFFSET = 14;
const DECORATIVE_WATER_BLEND = 28;
const DECORATIVE_FOAM_ALPHA = 0.35;

/** Dibuja un `World` en un lienzo 2D. No modifica el estado del juego. */
export class Renderer {
  private readonly lighting = new Lighting();
  private readonly ctx: Ctx;
  private readonly textures: Textures;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly assets: Assets) {
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
    this.beginViewport(world);
    const theme = THEMES[world.def.theme];
    const arenaPlatforms = arenaPlatformArt(world);
    this.drawBackdrop(world.def.theme, world.camX, now);
    if (theme.water && !world.level.water.length && world.def.decorativeWater !== false) {
      this.drawWater(theme, world.camX, now);
    }

    c.save();
    if (world.shake > 0 && !paused) {
      const k = Math.min(1, world.shake * 3);
      c.translate((Math.random() - 0.5) * 12 * k, (Math.random() - 0.5) * 8 * k);
    }
    drawBossArena(c, world, now);
    drawGoal(c, world, now);
    drawCheckpoint(c, world, now);
    drawHoops(c, world.hoops, world.camX, now);
    this.drawTiles(world, theme, now, arenaPlatforms);
    drawBeachProps(c, world);
    drawArenaPlatforms(c, arenaPlatforms, world.camX);
    drawFallingCrumbles(c, world.crumbles, world.camX, this.textures.rubble);
    drawPlatforms(c, world.platforms, world.camX);
    drawCannonFx(c, world.cannons, world.camX, now);
    drawHaciendaProps(c, world, now);
    drawSlowZones(c, world.slowZones, world.camX, now);
    for (const it of world.items) if (!drawSnorkelItem(c, it, world.camX, now)) drawItemSprite(c, it, world.camX, now);
    for (const e of world.enemies) if (e.alive && e.active) drawEnemySprite(c, this.assets, e, world.camX);
    world.boss?.draw(c, this.assets, world.camX);
    drawQuills(c, world.quills, world.camX);
    drawCannonballs(c, world.cannonballs, world.camX);
    drawPlayerSprite(c, this.assets, world.player, world.camX, world.phase === 'dying', world.phaseT, now);
    drawFireballs(c, world.fireballs, world.camX);
    drawBalls(c, world.balls, world.camX);
    drawWaterLayer(c, world, theme.water, now);
    drawParticles(c, world.particles, world.popups, world.camX);
    c.restore();
    this.lighting.draw(c, world);
    drawWeather(c, world, now);
    drawOffering(c, world, now);
    if (this.canvas.width >= VW && !world.offeringActive) drawTohHint(c, world);
    c.restore();
  }

  /** El recorte cambia solo el dibujo: enemigos, saltos y cámara física siguen siendo los mismos. */
  private beginViewport(world: World): void {
    const c = this.ctx;
    const view = renderViewport(world, this.canvas.width);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.save();
    c.translate(0, view.offsetY);
    c.scale(view.scale, view.scale);
    c.translate(-view.offsetX, 0);
  }

  private drawWater(theme: ThemeDef, camX: number, now: number): void {
    const water = theme.water;
    if (!water) return;
    const c = this.ctx;
    const t = now / 1000;
    const top = GROUND * T + DECORATIVE_WATER_OFFSET;
    const gradient = c.createLinearGradient(0, top - DECORATIVE_WATER_BLEND, 0, VH);
    gradient.addColorStop(0, 'transparent'); gradient.addColorStop(1, water.fill);
    c.fillStyle = gradient;
    c.fillRect(0, top - DECORATIVE_WATER_BLEND, VW, VH - top + DECORATIVE_WATER_BLEND);
    c.save(); c.globalAlpha = DECORATIVE_FOAM_ALPHA;
    c.fillStyle = water.foam;
    for (let x = -40; x < VW + 40; x += 40) {
      const wx = x - (camX % 40);
      c.beginPath();
      c.ellipse(wx + Math.sin(t * 2 + x) * 3, top, 20, 5, 0, 0, Math.PI);
      c.fill();
    }
    c.restore();
  }

  private drawTiles(world: World, theme: ThemeDef, now: number, arenaPlatforms: readonly ArenaPlatformArt[]): void {
    const c = this.ctx;
    const x0 = Math.floor(world.camX / T);
    const x1 = Math.min(world.width - 1, x0 + Math.ceil(VW / T) + 1);
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.grid[ty][tx];
        if (t === ' ') continue;
        if (t === 'X' && arenaPlatforms.some(p => ty === p.ty && tx >= p.tx && tx < p.tx + p.length)) continue;
        const sx = Math.round(tx * T - world.camX);
        let sy = ty * T;
        const bump = world.bumps.get(`${tx},${ty}`);
        if (bump) sy -= Math.sin((bump / BUMP_TIME) * Math.PI) * BUMP_HEIGHT;
        if (t === CRUMBLE_TILE) {
          const shaken = sx + crumbleShakeAt(world.crumbles, tx, ty, now);
          const cr = world.crumbles.find(p => p.y === ty && tx >= p.x && tx < p.x + p.len);
          if (!drawFragileTile(c, shaken, sy, cr ? tx - cr.x : 0, cr?.len)) c.drawImage(this.textures.rubble, shaken, sy);
          continue;
        }
        if (t === 'o') {
          drawCacao(c, sx + T / 2, sy + T / 2, now / 150 + tx);
          continue;
        }
        if (drawCannonTile(c, world.grid, tx, ty, sx, sy, x0)) continue;
        const texture = this.textureFor(world, theme, t, tx, ty);
        const depth = t === 'G' ? this.groundDepth(world, tx, ty) : 0;
        if (!drawMayaTile(c, t, sx, sy) && !drawPaintedTerrain(c, texture, sx, sy, tx, depth)) {
          c.drawImage(this.textures[texture], sx, sy);
        }
        drawRewardLight(c, t, sx, sy, now);
      }
    }
  }

  /** La tierra continúa desde su propia orilla, también en peldaños y montículos. */
  private groundDepth(world: World, tx: number, ty: number): number {
    let depth = 0;
    while (world.tileAt(tx, ty - depth - 1) === 'G') depth++;
    return depth;
  }

  private textureFor(world: World, theme: ThemeDef, tile: string, tx: number, ty: number) {
    if (tile === 'G') return world.solid(tx, ty - 1) ? theme.groundBody : theme.groundTop;
    if (tile === 'X') return theme.platform;
    if (tile === 'S') return 'question'; // bloque snorkel
    return FIXED_TEXTURE[tile] ?? 'stone';
  }
}
