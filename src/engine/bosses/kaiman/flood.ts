import type { WaterZone } from '../../level/zones';

/**
 * Crecida del pantano (fase 2 del Kaimán). Funciones puras sobre las zonas de agua:
 * el jefe sustituye `world.level.water` por un array nuevo con la superficie más alta
 * (no muta las zonas). Así swim.ts, el HUD y el Renderer ven el nivel del agua al
 * instante, y al reaparecer el `World` se reconstruye con el agua original.
 */

const overlapsArena = (z: WaterZone, a0: number, a1: number): boolean => z.x1 >= a0 && z.x0 <= a1;

/** Superficie (fila, puede ser fraccionaria) del agua de la arena, o `null` si no hay agua. */
export function arenaSurface(zones: readonly WaterZone[], a0: number, a1: number): number | null {
  let best: number | null = null;
  for (const z of zones) {
    if (overlapsArena(z, a0, a1) && (best === null || z.surface < best)) best = z.surface;
  }
  return best;
}

/**
 * Devuelve zonas nuevas donde el agua que toca la arena llega como mínimo a `surface`
 * (fila; menor = más alta). El agua nunca baja y las zonas fuera de la arena no cambian.
 */
export function floodArena(zones: readonly WaterZone[], a0: number, a1: number, surface: number): WaterZone[] {
  return zones.map((z) => (overlapsArena(z, a0, a1) && surface < z.surface ? { ...z, surface } : z));
}

/** Superficie interpolada de `from` a `to` según el progreso 0..1 de la crecida. */
export const risingSurface = (from: number, to: number, progress: number): number =>
  from + (to - from) * Math.max(0, Math.min(1, progress));
