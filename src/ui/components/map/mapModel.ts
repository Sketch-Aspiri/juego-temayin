import { ALL_LEVELS, WORLDS } from '../../../data/worlds';
import { MAP_HEIGHT, MAP_WIDTH, projectPosition, STATIONS, type GeoPoint } from '../../../data/stations';
import type { WorldDef } from '../../../engine/level/types';
import { hasTicket, isUnlocked, type Progress } from '../../../store/progress';

export interface MapView { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
export const FULL_MAP: MapView = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
const WORLD_PADDING = 170;
const MIN_WORLD_WIDTH = 310;
const MOBILE_VIEWPORT_WIDTH = 760;
const MOBILE_MAP_SCALE = 0.88;
const DESKTOP_MAP_SCALE = 0.86;

/** Ajusta la cámara al tamaño de la pantalla sin estirar la geografía. */
export function fitMapView(base: MapView, width: number, height: number, rightInset = 0): MapView {
  const padding = width < MOBILE_VIEWPORT_WIDTH ? MOBILE_MAP_SCALE : DESKTOP_MAP_SCALE;
  const availableWidth = width - rightInset;
  const scale = Math.min(availableWidth / base.width, height / base.height) * padding;
  const viewWidth = width / scale, viewHeight = height / scale;
  return { x: base.x + base.width / 2 - availableWidth / scale / 2, y: base.y + (base.height - viewHeight) / 2, width: viewWidth, height: viewHeight };
}

export function mapPoint(point: GeoPoint): { x: number; y: number } {
  const position = projectPosition(point);
  return { x: position.x * MAP_WIDTH, y: position.y * MAP_HEIGHT };
}

export function worldDiscovered(progress: Progress, world: WorldDef): boolean {
  return world.levels.some(level => isUnlocked(progress, level.id)) || hasTicket(progress, world.id);
}

export function latestStation(progress: Progress): string {
  return ALL_LEVELS.filter(level => isUnlocked(progress, level.id)).at(-1)?.id ?? ALL_LEVELS[0].id;
}

export function worldForStation(id: string): WorldDef {
  return WORLDS.find(world => world.levels.some(level => level.id === id)) ?? WORLDS[0];
}

export function routePoints(points: readonly GeoPoint[]): string {
  return points.map(point => { const { x, y } = mapPoint(point); return `${x},${y}`; }).join(' ');
}

export function worldView(world: WorldDef): MapView {
  const points = world.levels.map(level => mapPoint(STATIONS[level.id]));
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const width = Math.min(MAP_WIDTH, Math.max(MIN_WORLD_WIDTH,
    Math.max(...xs) - Math.min(...xs) + WORLD_PADDING,
    (Math.max(...ys) - Math.min(...ys) + WORLD_PADDING) * MAP_WIDTH / MAP_HEIGHT));
  const height = width * MAP_HEIGHT / MAP_WIDTH;
  const x = Math.max(0, Math.min(MAP_WIDTH - width, (Math.min(...xs) + Math.max(...xs) - width) / 2));
  const y = Math.max(0, Math.min(MAP_HEIGHT - height, (Math.min(...ys) + Math.max(...ys) - height) / 2));
  return { x, y, width, height };
}

export function visiblePosition(point: GeoPoint, view: MapView): { left: string; top: string } {
  const { x, y } = mapPoint(point);
  return { left: `${(x - view.x) / view.width * 100}%`, top: `${(y - view.y) / view.height * 100}%` };
}
