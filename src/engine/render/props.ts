import type { ItemKind } from '../tiles';
import { bakedFrame } from './artCache';
import { OBJECTS_FILE, OBJECT_FRAMES, type ObjectId } from '../../data/objectSprites';
import { TAU } from '../constants';
import { drawChili, drawCoin, drawLife, drawShield, type Ctx } from './drawUtils';

/**
 * Objetos pintados del atlas `objetos/objetos.webp` (1254×1254, 3×3).
 * Los rectángulos se midieron por cajas de alfa de cada pieza (alfa > 64).
 */
export { OBJECTS_FILE, OBJECT_FRAMES, type ObjectId } from '../../data/objectSprites';

/** Altura en pantalla de los objetos que salen de los bloques. */
const ITEM_HEIGHT = 34;
/** Altura en pantalla del grano de cacao (moneda). */
const CACAO_HEIGHT = 30;
/** Ancho mínimo relativo al girar el cacao (para que no desaparezca de canto). */
const CACAO_MIN_SPIN = 0.22;

/**
 * Objeto del atlas que representa cada `ItemKind`. Es parcial a propósito: si se
 * añade un `ItemKind` nuevo (p. ej. el snorkel) basta con mapearlo aquí.
 */
const ITEM_ART: Readonly<Partial<Record<ItemKind, ObjectId>>> = {
  life: 'jadeHeart',
  fire: 'chile',
  shield: 'shield',
  snorkel: 'snorkel',
  ball: 'ball',
};

/** Lienzo horneado de un objeto a la altura indicada (o `null` si el atlas no ha cargado). */
export function objectSprite(id: ObjectId, height: number): HTMLCanvasElement | null {
  const frame = OBJECT_FRAMES[id];
  return bakedFrame(OBJECTS_FILE, frame, height / frame[3]);
}

/** Dibuja un objeto del atlas centrado en (x, y); devuelve `false` si aún no hay arte. */
export function drawObject(c: Ctx, id: ObjectId, x: number, y: number, height: number): boolean {
  const img = objectSprite(id, height);
  if (!img) return false;
  c.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  return true;
}

/** Grano de cacao (la moneda del juego) girando sobre su eje vertical. */
export function drawCacao(c: Ctx, x: number, y: number, phase: number): void {
  const img = objectSprite('cacao', CACAO_HEIGHT);
  if (!img) return drawCoin(c, x, y, phase);
  const spin = Math.max(CACAO_MIN_SPIN, Math.abs(Math.cos(phase)));
  const w = img.width * spin;
  c.drawImage(img, x - w / 2, y - img.height / 2, w, img.height);
}

/** Objeto que sale de un bloque (corazón de jade, chile habanero, escudo, snorkel de caracol). */
export function drawItemArt(c: Ctx, kind: ItemKind, x: number, y: number, now: number): void {
  const art = ITEM_ART[kind];
  if (art && drawObject(c, art, x, y, ITEM_HEIGHT)) return;
  if (kind === 'life') drawLife(c, x, y);
  else if (kind === 'fire') drawChili(c, x, y, 1, now);
  else if (kind === 'ball') drawRubberBall(c, x, y, ITEM_HEIGHT / 2);
  else drawShield(c, x, y);
}

/** Pelota de hule procedural (respaldo mientras carga el atlas de objetos). */
export function drawRubberBall(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#2b2622';
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)';
  c.beginPath();
  c.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, TAU);
  c.fill();
}
