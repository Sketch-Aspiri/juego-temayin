import { VH, VW } from '../../constants';
import { lazyImage, makeCanvas } from '../artCache';
import type { Scenery } from '../backgrounds';

/**
 * Fondos pintados (public/assets/backgrounds/*.png, 1672×941) con parallax.
 *
 * La imagen se escala en modo «cover» al lienzo lógico (960×560) y se hornea UNA vez
 * en dos tiras: la lejana (imagen completa) y la cercana (solo la franja inferior,
 * con un fundido en su borde de arriba). Cada tira lleva la imagen y su espejo
 * para poder repetirse sin costura visible. En cada fotograma solo se copian lienzos.
 */

export interface PaintedOptions {
  /** Velocidad de parallax de la tira lejana (fracción de la cámara). */
  far?: number;
  /** Velocidad de parallax de la franja cercana. */
  near?: number;
  /** Altura (0..1 del lienzo) donde empieza la franja cercana. */
  nearTop?: number;
  /** Velo horneado sobre todo el fondo para que el primer plano destaque. */
  haze?: string;
}

interface Strips {
  far: HTMLCanvasElement;
  near: HTMLCanvasElement;
}

const DEFAULT_FAR = 0.06;
const DEFAULT_NEAR = 0.2;
const DEFAULT_NEAR_TOP = 0.62;
/** Alto del fundido entre la franja cercana y la lejana (px lógicos). */
const NEAR_FADE = 70;

const wrap = (v: number, period: number): number => ((v % period) + period) % period;

/** Dibuja la imagen en modo cover y, a su derecha, su reflejo horizontal. */
function bakeMirrored(img: HTMLImageElement, haze: string | undefined): HTMLCanvasElement {
  const s = Math.max(VW / img.naturalWidth, VH / img.naturalHeight);
  const w = Math.ceil(img.naturalWidth * s);
  const h = Math.ceil(img.naturalHeight * s);
  const dy = Math.round((VH - h) / 2);
  const canvas = makeCanvas(w * 2, VH);
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, 0, dy, w, h);
  c.save();
  c.translate(w * 2, 0);
  c.scale(-1, 1);
  c.drawImage(img, 0, dy, w, h);
  c.restore();
  if (haze) {
    c.fillStyle = haze;
    c.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/** Copia de la tira con solo la franja inferior visible (fundido hacia arriba). */
function bakeNear(far: HTMLCanvasElement, nearTop: number): HTMLCanvasElement {
  const canvas = makeCanvas(far.width, far.height);
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  c.drawImage(far, 0, 0);
  const top = VH * nearTop;
  const mask = c.createLinearGradient(0, top - NEAR_FADE, 0, top);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-in';
  c.fillStyle = mask;
  c.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawStrip(c: CanvasRenderingContext2D, strip: HTMLCanvasElement, off: number): void {
  const x = -Math.round(wrap(off, strip.width));
  c.drawImage(strip, x, 0);
  if (x + strip.width < VW) c.drawImage(strip, x + strip.width, 0);
}

/**
 * Crea un escenario a partir de un fondo pintado. Mientras la imagen carga
 * (o si falla) se dibuja el escenario procedural `fallback`.
 */
export function paintedScenery(file: string, fallback: Scenery, opts: PaintedOptions = {}): Scenery {
  let strips: Strips | null = null;
  const far = opts.far ?? DEFAULT_FAR;
  const near = opts.near ?? DEFAULT_NEAR;
  return (c, cam, now) => {
    if (!strips) {
      const img = lazyImage(`backgrounds/${file}`);
      if (!img) return fallback(c, cam, now);
      const farStrip = bakeMirrored(img, opts.haze);
      strips = { far: farStrip, near: bakeNear(farStrip, opts.nearTop ?? DEFAULT_NEAR_TOP) };
    }
    drawStrip(c, strips.far, cam * far);
    drawStrip(c, strips.near, cam * near);
  };
}
