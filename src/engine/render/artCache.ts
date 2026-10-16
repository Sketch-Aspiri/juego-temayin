import { EK_CHUAH } from '../../data/offerings';
import { CHIVO_ART_FILES } from '../../data/huayChivoArt';
import { SARGAZO_ART_FILES } from '../../data/sargazoArt';
import { assetUrl, isReady } from '../assets';
import { GAMEPLAY_SPRITES } from '../../data/gameplaySprites';
import { NEW_GAMEPLAY_SPRITES } from '../../data/newGameplaySprites';
import { MAYA_TILE_SPRITES } from '../../data/mayaTileSprites';
import { TERRAIN_SPRITES } from '../../data/terrainSprites';
import { ALPHA_CUTOFF, isolateSprite } from './spriteMask';

/**
 * Arte pintado que se carga bajo demanda (fondos, atlas de objetos, meta, Toh).
 * No pasa por `MANIFEST` para no retrasar el arranque: la primera vez que el
 * renderer lo pide empieza la descarga y, mientras tanto, se usa el dibujo
 * procedural de respaldo. Sin DOM (pruebas) todo devuelve `null`.
 */

/** Rectángulo de origen dentro de un atlas: [x, y, ancho, alto] en píxeles. */
export type Frame = readonly [x: number, y: number, w: number, h: number];

const images = new Map<string, HTMLImageElement>();
const baked = new Map<string, HTMLCanvasElement | null>();
const isolatedUrls = new Map<string, Promise<string | null>>();

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
  EK_CHUAH.file,
  ...CHIVO_ART_FILES,
  ...SARGAZO_ART_FILES,
  ...Object.values(MAYA_TILE_SPRITES).map(sprite => sprite.file),
  ...new Set(Object.values(TERRAIN_SPRITES).map(sprite => sprite.file)),
  ...new Set(Object.values(NEW_GAMEPLAY_SPRITES).map(sprite => sprite.file)),
  ...new Set(Object.values(GAMEPLAY_SPRITES).map(sprite => sprite.file)),
  'bosses/sargazo.webp',
  'escenarios/arcada-izamal.webp',
  'escenarios/guarida-puas.webp',
  'complementos/utileria.webp',
  'complementos/vegetacion.webp',
  'backgrounds/deepJungle.webp',
  'backgrounds/jungle.webp',
  'backgrounds/ruins.webp',
  'backgrounds/river.webp',
  'backgrounds/swamp.webp',
  'backgrounds/lair.webp',
  'backgrounds/cave.webp',
  'backgrounds/beach.webp',
  'backgrounds/reef.webp',
  'enemies/lionfish.webp',
  'enemies/jellyfish.webp',
  'backgrounds/hacienda.webp',
  'backgrounds/yellowCity.webp',
  'backgrounds/xibalba.webp',
  'enemies/axolotl.webp',
  'enemies/xtabay.webp',
  'bosses/huayPek.webp',
  'enemies/stalactite.webp',
  'enemies/scorpion.webp',
  'enemies/truck.webp',
  'bosses/huayChivo.webp',
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
  'enemies/moray.webp',
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

/**
 * Resuelve cuando todo el arte indicado terminó de cargar (los fallos también
 * cuentan: el dibujo procedural de respaldo cubre las imágenes que no llegan).
 */
export function artReady(files: readonly string[] = PAINTED_ART): Promise<void> {
  const waits = files.map((file) => {
    const img = lazyImage(file) ?? images.get(file);
    if (!img || isReady(img)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  });
  return Promise.all(waits).then(() => undefined);
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
export function bakedFrame(file: string, frame: Frame, scale: number, isolated = false): HTMLCanvasElement | null {
  const key = `${file}|${frame.join(',')}|${scale}|${isolated}`;
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
  const source = isolated ? isolatedSource(img, frame) : null;
  if (source) c.drawImage(source, 0, 0, canvas.width, canvas.height);
  else c.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
  cutAlpha(canvas);
  baked.set(key, canvas);
  return canvas;
}

/** Se aísla a resolución original para no perder patas, hilos o colas al reducir. */
function isolatedSource(img: HTMLImageElement, [x, y, w, h]: Frame): HTMLCanvasElement | null {
  const source = makeCanvas(w, h);
  const ctx = source.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  isolateSprite(data.data, w);
  ctx.putImageData(data, 0, 0);
  return source;
}

/** Recorte limpio para los actores CSS de la historia; comparte caché con el canvas. */
export function isolatedFrameUrl(file: string, frame: Frame): Promise<string | null> {
  const key = `${file}|${frame.join(',')}`;
  let pending = isolatedUrls.get(key);
  if (!pending) { pending = prepareIsolatedUrl(file, frame); isolatedUrls.set(key, pending); }
  return pending;
}

async function prepareIsolatedUrl(file: string, frame: Frame): Promise<string | null> {
  if (!hasDom()) return null;
  lazyImage(file);
  const img = images.get(file);
  if (!img) return null;
  try { await img.decode(); }
  catch { return null; }
  return bakedFrame(file, frame, 1, true)?.toDataURL('image/png') ?? null;
}
