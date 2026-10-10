import { assetUrl, isReady } from '../assets';

/**
 * Arte pintado que se carga bajo demanda (fondos, atlas de objetos, meta, Toh).
 * No pasa por `MANIFEST` para no retrasar el arranque: la primera vez que el
 * renderer lo pide empieza la descarga y, mientras tanto, se usa el dibujo
 * procedural de respaldo. Sin DOM (pruebas) todo devuelve `null`.
 */

/** Rectángulo de origen dentro de un atlas: [x, y, ancho, alto] en píxeles. */
export type Frame = readonly [x: number, y: number, w: number, h: number];

/** Alfa mínimo que se conserva al hornear: limpia el halo semitransparente de los atlas. */
const ALPHA_CUTOFF = 40;

const images = new Map<string, HTMLImageElement>();
const baked = new Map<string, HTMLCanvasElement | null>();

const hasDom = (): boolean => typeof Image !== 'undefined' && typeof document !== 'undefined';

/** Devuelve la imagen si ya está lista; si no, inicia su carga (una sola vez) y devuelve `null`. */
export function lazyImage(file: string): HTMLImageElement | null {
  if (!hasDom()) return null;
  let img = images.get(file);
  if (!img) {
    img = new Image();
    const name = file;
    img.onerror = () => console.warn(`No se pudo cargar ${name}`);
    img.src = assetUrl(file);
    images.set(file, img);
  }
  return isReady(img) ? img : null;
}

/**
 * Arte pintado que usan los niveles. `warmArt` lo descarga en segundo plano al
 * arrancar, para que fondos, meta y objetos ya estén listos al entrar al nivel.
 */
export const PAINTED_ART: readonly string[] = [
  'backgrounds/jungle.webp',
  'backgrounds/ruins.webp',
  'backgrounds/river.webp',
  'backgrounds/swamp.webp',
  'backgrounds/lair.webp',
  'backgrounds/cave.webp',
  'backgrounds/beach.webp',
  'backgrounds/hacienda.webp',
  'backgrounds/yellowCity.webp',
  'enemies/stalactite.webp',
  'enemies/scorpion.webp',
  'enemies/truck.png',
  'bosses/huayChivo.png',
  'backgrounds/fortress.webp',
  'backgrounds/mangrove.webp',
  'complementos/banderas.webp',
  'complementos/piramide.webp',
  'complementos/tren.webp',
  'personajes/toh.webp',
  'personajes/jugador-mecanicas.webp',
  'enemies/ants.webp',
  'enemies/blueCrab.webp',
  'enemies/nauyaca.webp',
  'enemies/barracuda.webp',
  'bosses/kaiman.webp',
  'enemies/wheel.webp',
  'enemies/pirateCrab.webp',
  'enemies/shade.webp',
  'enemies/alux.webp',
  'objetos/objetos.webp',
  'mecanicas/mecanicas.webp',
  'mecanicas/efectos.webp',
];

/** Inicia la descarga de todo el arte pintado (sin bloquear). */
export function warmArt(files: readonly string[] = PAINTED_ART): void {
  for (const file of files) lazyImage(file);
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  return canvas;
}

function cutAlpha(canvas: HTMLCanvasElement): void {
  const c = canvas.getContext('2d');
  if (!c) return;
  const data = c.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 3; i < px.length; i += 4) if (px[i] < ALPHA_CUTOFF) px[i] = 0;
  c.putImageData(data, 0, 0);
}

/**
 * Recorta `frame` de un atlas y lo escala a `scale` en un lienzo propio, una sola vez.
 * Así cada fotograma solo copia un lienzo pequeño (sin reescalar el atlas entero).
 */
export function bakedFrame(file: string, frame: Frame, scale: number): HTMLCanvasElement | null {
  const key = `${file}|${frame.join(',')}|${scale}`;
  const hit = baked.get(key);
  if (hit !== undefined) return hit;
  const img = lazyImage(file);
  if (!img) return null;
  const [x, y, w, h] = frame;
  const canvas = makeCanvas(w * scale, h * scale);
  const c = canvas.getContext('2d');
  if (!c) {
    baked.set(key, null);
    return null;
  }
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
  cutAlpha(canvas);
  baked.set(key, canvas);
  return canvas;
}
