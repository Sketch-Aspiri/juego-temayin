import { T, VH, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';

export interface Darkness { readonly radius: number; readonly alpha: number }
export interface LightSource { readonly x: number; readonly y: number; readonly radius: number }
const FIRE_RADIUS = 85;
const TORCH_RADIUS = 110;
const CRYSTAL_RADIUS = 55;
/** Radio de la luz de una luciérnaga: pequeña, menor que una antorcha. */
export const FIREFLY_RADIUS = 70;

type MutableLight = { x: number; y: number; radius: number };
/** El renderer reutiliza lista y objetos; las consultas públicas conservan resultados independientes. */
export class LightBuffer {
  readonly sources: LightSource[] = [];
  private readonly pool: MutableLight[] = [];
  private used = 0;
  reset(): void { this.sources.length = 0; this.used = 0; }
  add(x: number, y: number, radius: number): void {
    let light = this.pool[this.used];
    if (!light) { light = { x, y, radius }; this.pool.push(light); }
    light.x = x; light.y = y; light.radius = radius;
    this.used++;
    this.sources.push(light);
  }
}

/** Coordenadas del mundo, consultables sin DOM por enemigos y pruebas. */
export function lightSources(world: World, buffer?: LightBuffer): readonly LightSource[] {
  const work = buffer ?? new LightBuffer();
  work.reset();
  const dark = world.darkness;
  if (!dark) return work.sources;
  const p = world.player;
  const result = work.sources;
  work.add(p.x + p.w / 2, p.y + p.h / 2, dark.radius);
  for (const f of world.fireballs) if (!f.gone) work.add(f.x, f.y, FIRE_RADIUS);
  for (const t of world.torches) if (t.lit) result.push(t);
  // Las luciérnagas (op `firefly`) solo alumbran si el nivel está a oscuras.
  for (const f of world.level.fireflies) result.push(f);
  // Cada jefe decide qué luces aporta (p. ej. ojos que delatan su ventana de daño).
  const bossStart = result.length;
  world.boss?.lights?.(result);
  // Solo el renderer consume referencias temporales; una consulta pública conserva su instantánea.
  if (!buffer) for (let i = bossStart; i < result.length; i++) result[i] = { ...result[i] };
  if (world.def.theme === 'cave') {
    const left = Math.max(0, Math.floor(world.camX / T));
    const right = Math.min(world.width, left + VW / T + 2);
    for (let y = 0; y < world.grid.length; y++) for (let x = left; x < right; x++) {
      if (world.grid[y][x] === 'X') work.add((x + 0.5) * T, (y + 0.5) * T, CRYSTAL_RADIUS);
    }
  }
  return result;
}

export const createFirefly = (x: number, y: number): LightSource =>
  ({ x: (x + 0.5) * T, y: (y + 0.5) * T, radius: FIREFLY_RADIUS });

export const createTorch = (x: number, y: number): LightSource =>
  ({ x: (x + 0.5) * T, y: (y + 0.5) * T, radius: TORCH_RADIUS });

/** Máscara reutilizada; los halos radiales se almacenan una vez por radio. */
export class Lighting {
  private readonly sources = new LightBuffer();
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
    for (const l of lightSources(world, this.sources)) {
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
