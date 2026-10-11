import { bakedFrame, type Frame } from '../../render/artCache';

const cache = new Map<string, HTMLCanvasElement>();
const SHEET = 'bosses/sargazo.webp';
export const ART_SCALE = 0.29;

/** Los dos recortes inferiores se solapan: se conserva la silueta principal completa. */
export function isolatedArt(frame: Frame): HTMLCanvasElement | null {
  const key = frame.join(',');
  const cached = cache.get(key);
  if (cached) return cached;
  const source = bakedFrame(SHEET, frame, ART_SCALE);
  if (!source) return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const labels = componentLabels(data.data, canvas.width);
  for (let i = 0; i < labels.mask.length; i++) {
    if (labels.mask[i] !== labels.largest) data.data[i * 4 + 3] = 0;
  }
  ctx.putImageData(data, 0, 0); cache.set(key, canvas);
  return canvas;
}

/** Recorrido lineal, ejecutado una sola vez por pose; nunca en el bucle de dibujo. */
export function componentLabels(pixels: Uint8ClampedArray, width: number): { mask: Int32Array; largest: number } {
  const mask = new Int32Array(pixels.length / 4);
  let label = 0, largest = 0, largestSize = 0;
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] || !pixels[start * 4 + 3]) continue;
    const queue = [start]; mask[start] = ++label;
    for (let q = 0; q < queue.length; q++) {
      const p = queue[q];
      const neighbors = [p - width, p + width];
      if (p % width > 0) neighbors.push(p - 1);
      if (p % width < width - 1) neighbors.push(p + 1);
      for (const n of neighbors) {
        if (n < 0 || n >= mask.length || mask[n] || !pixels[n * 4 + 3]) continue;
        mask[n] = label; queue.push(n);
      }
    }
    if (queue.length > largestSize) { largestSize = queue.length; largest = label; }
  }
  return { mask, largest };
}
