import { CHIVO_EFFECT_FILE, CHIVO_EFFECTS, CHIVO_TORCH_ART } from '../../data/huayChivoArt';
import { bakedFrame } from './artCache';
import type { Ctx } from './drawUtils';

/** Recortes compartidos: los efectos conservan todas sus piezas, sin aislar humo o polvo. */
export function drawChivoEffect(c: Ctx, id: keyof typeof CHIVO_EFFECTS, x: number, y: number, w: number, h: number): boolean {
  const frame = CHIVO_EFFECTS[id];
  const image = bakedFrame(CHIVO_EFFECT_FILE, frame, w / frame[2]);
  if (!image) return false;
  c.drawImage(image, x, y, w, h);
  return true;
}

/** La mecha coincide con la luz tanto encendida como apagada; no se deforma el soporte. */
export function drawAtriumTorch(c: Ctx, lit: boolean, x: number, y: number): boolean {
  const art = CHIVO_TORCH_ART[lit ? 'on' : 'off'];
  const image = bakedFrame(CHIVO_EFFECT_FILE, art.frame, art.scale, true);
  if (!image) return false;
  c.drawImage(image, Math.round(x + (art.frame[0] - art.anchor[0]) * art.scale),
    Math.round(y + (art.frame[1] - art.anchor[1]) * art.scale));
  return true;
}
