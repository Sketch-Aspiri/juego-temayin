/** Etiqueta las siluetas alfa sin unir los bordes laterales de filas consecutivas. */
export function componentLabels(pixels: Uint8ClampedArray, width: number): { mask: Int32Array; largest: number } {
  const mask = new Int32Array(pixels.length / 4);
  const queue = new Int32Array(mask.length);
  let label = 0, largest = 0, largestSize = 0;
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] || pixels[start * 4 + 3] < ALPHA_CUTOFF) continue;
    let length = 1;
    queue[0] = start; mask[start] = ++label;
    for (let q = 0; q < length; q++) {
      const p = queue[q];
      for (const n of neighbors(p, width, mask.length)) {
        if (mask[n] || pixels[n * 4 + 3] < ALPHA_CUTOFF) continue;
        mask[n] = label; queue[length++] = n;
      }
    }
    if (length > largestSize) { largestSize = length; largest = label; }
  }
  return { mask, largest };
}

export const ALPHA_CUTOFF = 40;

function neighbors(p: number, width: number, length: number): number[] {
  const adjacent: number[] = [];
  if (p >= width) adjacent.push(p - width);
  if (p + width < length) adjacent.push(p + width);
  if (p % width > 0) adjacent.push(p - 1);
  if (p % width < width - 1) adjacent.push(p + 1);
  return adjacent;
}

/** Conserva la pose principal; los fragmentos de otras poses no llegan al lienzo. */
export function isolateSprite(pixels: Uint8ClampedArray, width: number): void {
  const { mask, largest } = componentLabels(pixels, width);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== largest || pixels[i * 4 + 3] < ALPHA_CUTOFF) pixels[i * 4 + 3] = 0;
  }
}
