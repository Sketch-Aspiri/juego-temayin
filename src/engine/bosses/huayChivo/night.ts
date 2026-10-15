import type { Darkness } from '../../render/lighting';
import { type ChivoPhase, DUSK_STEPS, NIGHT_DARKNESS, NIGHTFALL_TIME } from './tuning';

/**
 * La noche cae sobre el atrio de Izamal a medida que el Huay Chivo pierde vida: la
 * oscuridad sube en `DUSK_STEPS` escalones durante el rugido de `nightfall`. Los
 * escalones se calculan una sola vez al cargar el módulo: el bucle de 120 Hz solo
 * reasigna referencias, sin crear objetos `Darkness` por paso.
 */

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Rampa hacia la oscuridad de `phase`; el último escalón es exactamente `NIGHT_DARKNESS`. */
function ramp(phase: 2 | 3): readonly Darkness[] {
  const to = NIGHT_DARKNESS[phase - 1] as Darkness;
  const from = NIGHT_DARKNESS[phase - 2] ?? { radius: to.radius, alpha: 0 };
  return Array.from({ length: DUSK_STEPS }, (_, i) => {
    if (i === DUSK_STEPS - 1) return to;
    const k = (i + 1) / DUSK_STEPS;
    return { radius: lerp(from.radius, to.radius, k), alpha: lerp(from.alpha, to.alpha, k) };
  });
}

const DUSK: Readonly<Record<2 | 3, readonly Darkness[]>> = { 2: ramp(2), 3: ramp(3) };

/** Oscuridad de `phase` tras `t` segundos de anochecer. */
export function duskAt(phase: ChivoPhase, t: number): Darkness | null {
  if (phase === 1) return NIGHT_DARKNESS[0];
  const i = Math.min(DUSK_STEPS - 1, Math.floor((t / NIGHTFALL_TIME) * DUSK_STEPS));
  return DUSK[phase][i];
}

/** Aviso en pantalla al empezar cada fase nocturna. */
export const NIGHT_POPUP: Readonly<Record<2 | 3, string>> = { 2: '¡CAE LA NOCHE!', 3: '¡NOCHE CERRADA!' };

/** Fase que corresponde a los PV restantes. */
export const phaseFor = (hp: number, phase2Hp: number, phase3Hp: number): ChivoPhase =>
  hp <= phase3Hp ? 3 : hp <= phase2Hp ? 2 : 1;
