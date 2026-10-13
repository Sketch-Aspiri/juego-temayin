import { bakedFrame, type Frame } from '../../render/artCache';
export { componentLabels } from '../../render/spriteMask';
const SHEET = 'bosses/sargazo.webp';
export const ART_SCALE = 0.29;

/** Los dos recortes inferiores se solapan: se conserva la silueta principal completa. */
export function isolatedArt(frame: Frame): HTMLCanvasElement | null {
  return bakedFrame(SHEET, frame, ART_SCALE, true);
}
