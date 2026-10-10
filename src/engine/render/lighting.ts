import { T, VH, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';

export interface Darkness { readonly radius: number; readonly alpha: number }
export interface LightSource { readonly x: number; readonly y: number; readonly radius: number }
const FIRE_RADIUS = 85;
const TORCH_RADIUS = 110;
const CRYSTAL_RADIUS = 55;
const BOSS_EYE_RADIUS = 80;

/** Coordenadas del mundo, consultables sin DOM por enemigos y pruebas. */
export function lightSources(world: World): readonly LightSource[] {
  const dark = world.darkness;
  if (!dark) return [];
  const p = world.player;
  const result: LightSource[] = [{ x: p.x + p.w / 2, y: p.y + p.h / 2, radius: dark.radius }];
  for (const f of world.fireballs) if (!f.gone) result.push({ x: f.x, y: f.y, radius: FIRE_RADIUS });
  for (const t of world.level.lights) result.push(t);
  const boss = world.boss;
  // Los ojos encendidos señalan la ventana de daño, incluso fuera de la luz del jugador.
  if (boss?.id === 'huayPek' && boss.hittable) {
    result.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, radius: BOSS_EYE_RADIUS });
  }
  if (world.def.theme === 'cave') {
    const left = Math.max(0, Math.floor(world.camX / T));
    const right = Math.min(world.width, left + VW / T + 2);
    for (let y = 0; y < world.grid.length; y++) for (let x = left; x < right; x++) {
      if (world.grid[y][x] === 'X') result.push({ x: (x + 0.5) * T, y: (y + 0.5) * T, radius: CRYSTAL_RADIUS });
    }
  }
  return result;
}

export const createTorch = (x: number, y: number): LightSource =>
  ({ x: (x + 0.5) * T, y: (y + 0.5) * T, radius: TORCH_RADIUS });

/** Máscara reutilizada; los halos radiales se almacenan una vez por radio. */
export class Lighting {
  private mask: HTMLCanvasElement | null = null;
  private halos = new Map<number, HTMLCanvasElement>();

  draw(ctx: Ctx, world: World): void {
    const dark = world.darkness;
    if (!dark) return;
    if (!this.mask) {
      this.mask = document.createElement('canvas');
      this.mask.width = VW; this.mask.height = VH;
    }
    const c = this.mask.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, VW, VH);
    c.fillStyle = `rgba(0,3,12,${dark.alpha})`;
    c.fillRect(0, 0, VW, VH);
    c.globalCompositeOperation = 'destination-out';
    for (const l of world.lightSources()) {
      const halo = this.halo(l.radius);
      c.drawImage(halo, l.x - world.camX - l.radius, l.y - l.radius);
    }
    c.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.mask, 0, 0);
  }

  private halo(radius: number): HTMLCanvasElement {
    const cached = this.halos.get(radius);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.ceil(radius * 2);
    const c = canvas.getContext('2d');
    if (c) {
      const g = c.createRadialGradient(radius, radius, radius * 0.35, radius, radius, radius);
      g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, canvas.width, canvas.height);
    }
    this.halos.set(radius, canvas);
    return canvas;
  }
}
