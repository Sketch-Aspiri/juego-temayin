import { TAP_SLOP_PX } from './mapGestures';

/** Punto estructural propio: la sesión no depende de eventos del DOM. */
export interface PointerPoint { readonly x: number; readonly y: number }
interface Tracked { readonly id: number; readonly x: number; readonly y: number }

/** Reposo -> press (dedo abajo, aún puede ser un toque) -> drag (superó el umbral) -> pinch (dos dedos). */
export type MapPointerSession =
  | { readonly mode: 'idle' }
  | { readonly mode: 'press'; readonly pointer: Tracked; readonly origin: PointerPoint }
  | { readonly mode: 'drag'; readonly pointer: Tracked }
  | { readonly mode: 'pinch'; readonly a: Tracked; readonly b: Tracked };

export type MapPointerEffect =
  | { readonly kind: 'none' }
  | { readonly kind: 'begin-drag'; readonly pointerId: number; readonly delta: PointerPoint }
  | { readonly kind: 'pan'; readonly delta: PointerPoint }
  | { readonly kind: 'pinch-start'; readonly pointerIds: readonly [number, number] }
  | { readonly kind: 'pinch'; readonly previous: readonly [PointerPoint, PointerPoint]; readonly current: readonly [PointerPoint, PointerPoint] }
  | { readonly kind: 'end'; readonly suppressClick: boolean };

export interface PointerStep { readonly session: MapPointerSession; readonly effect: MapPointerEffect }

export const IDLE_SESSION: MapPointerSession = { mode: 'idle' };
const NONE: MapPointerEffect = { kind: 'none' };

const unchanged = (session: MapPointerSession): PointerStep => ({ session, effect: NONE });
const track = (id: number, point: PointerPoint): Tracked => ({ id, x: point.x, y: point.y });
const plain = ({ x, y }: Tracked): PointerPoint => ({ x, y });
const offset = (to: PointerPoint, from: PointerPoint): PointerPoint => ({ x: to.x - from.x, y: to.y - from.y });

export function pointerDown(session: MapPointerSession, id: number, point: PointerPoint): PointerStep {
  if (session.mode === 'idle') return { session: { mode: 'press', pointer: track(id, point), origin: point }, effect: NONE };
  if (session.mode === 'pinch' || session.pointer.id === id) return unchanged(session);
  // El segundo dedo convierte cualquier toque o arrastre en pellizco.
  const first = session.pointer;
  return { session: { mode: 'pinch', a: first, b: track(id, point) }, effect: { kind: 'pinch-start', pointerIds: [first.id, id] } };
}

function moveInPinch(session: Extract<MapPointerSession, { mode: 'pinch' }>, id: number, point: PointerPoint): PointerStep {
  if (id !== session.a.id && id !== session.b.id) return unchanged(session);
  const next = id === session.a.id ? { ...session, a: track(id, point) } : { ...session, b: track(id, point) };
  return { session: next, effect: { kind: 'pinch', previous: [plain(session.a), plain(session.b)], current: [plain(next.a), plain(next.b)] } };
}

export function pointerMove(session: MapPointerSession, id: number, point: PointerPoint, slop: number = TAP_SLOP_PX): PointerStep {
  if (session.mode === 'idle') return unchanged(session);
  if (session.mode === 'pinch') return moveInPinch(session, id, point);
  if (session.pointer.id !== id) return unchanged(session);
  if (session.mode === 'drag') return { session: { mode: 'drag', pointer: track(id, point) }, effect: { kind: 'pan', delta: offset(point, session.pointer) } };
  const total = offset(point, session.origin);
  if (Math.hypot(total.x, total.y) <= slop) return { session: { ...session, pointer: track(id, point) }, effect: NONE };
  // Todo el desplazamiento desde el origen se aplica de una vez: no se pierde el tramo bajo el umbral.
  return { session: { mode: 'drag', pointer: track(id, point) }, effect: { kind: 'begin-drag', pointerId: id, delta: total } };
}

export function pointerUp(session: MapPointerSession, id: number): PointerStep {
  if (session.mode === 'idle') return unchanged(session);
  if (session.mode === 'pinch') {
    if (id !== session.a.id && id !== session.b.id) return unchanged(session);
    // El dedo restante sigue arrastrando desde donde está, sin salto.
    return { session: { mode: 'drag', pointer: id === session.a.id ? session.b : session.a }, effect: NONE };
  }
  if (session.pointer.id !== id) return unchanged(session);
  return { session: IDLE_SESSION, effect: { kind: 'end', suppressClick: session.mode === 'drag' } };
}

/** Cancelación del sistema: todo vuelve a reposo; hubo gesto si ya no era un simple toque. */
export function pointerCancel(session: MapPointerSession): PointerStep {
  return { session: IDLE_SESSION, effect: { kind: 'end', suppressClick: session.mode === 'drag' || session.mode === 'pinch' } };
}
