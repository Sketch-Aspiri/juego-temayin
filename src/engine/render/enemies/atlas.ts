import { isReady } from '../../assets';
import { bakedFrame } from '../artCache';
import type { Ctx } from '../drawUtils';

/**
 * Cuadro de una hoja de sprites con rectángulo real (copiado del `*.atlas.json` de
 * `imagenes/nuevos/enemigos/`, no se lee en tiempo de ejecución). `ax, ay` es el
 * punto de anclaje en coordenadas de la hoja (p. ej. entre las patas, o el centro
 * del cuerpo en voladores): ese punto cae en el origen local al dibujar.
 */
export interface AtlasFrame {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly ax: number;
  readonly ay: number;
}

/** Cuadro con anclaje en el centro de su borde inferior (enemigos que pisan suelo). */
export const footFrame = (x: number, y: number, w: number, h: number): AtlasFrame => ({ x, y, w, h, ax: x + w / 2, ay: y + h });

/** Cuadro con anclaje en su centro (nadadores y voladores). */
export const centerFrame = (x: number, y: number, w: number, h: number): AtlasFrame => ({ x, y, w, h, ax: x + w / 2, ay: y + h / 2 });

/**
 * Como `drawAtlasFrame`, pero con una hoja de `public/assets` cargada bajo demanda
 * (`artCache`) y el cuadro horneado a su escala una sola vez. Así los enemigos nuevos
 * no pasan por `MANIFEST` ni retrasan el arranque. Devuelve false mientras carga.
 */
export function drawLazyFrame(c: Ctx, file: string, f: AtlasFrame, scale: number, dx = 0, dy = 0): boolean {
  const img = bakedFrame(file, [f.x, f.y, f.w, f.h], scale);
  if (!img) return false;
  c.drawImage(img, Math.round(dx + (f.x - f.ax) * scale), Math.round(dy + (f.y - f.ay) * scale));
  return true;
}

/**
 * Dibuja un cuadro con escala uniforme y su anclaje en (dx, dy). Devuelve false si
 * la imagen no está lista, para que el llamador use su dibujo procedural.
 */
export function drawAtlasFrame(c: Ctx, img: HTMLImageElement, f: AtlasFrame, scale: number, dx = 0, dy = 0): boolean {
  if (!isReady(img)) return false;
  c.drawImage(img, f.x, f.y, f.w, f.h, dx + (f.x - f.ax) * scale, dy + (f.y - f.ay) * scale, f.w * scale, f.h * scale);
  return true;
}
