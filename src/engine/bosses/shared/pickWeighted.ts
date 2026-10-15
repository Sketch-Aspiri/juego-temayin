/**
 * Sorteo ponderado del siguiente ataque de un jefe, compartido por los selectores de
 * Kaimán y Huay Chivo. Nunca devuelve `last` si hay otra opción (repetir el mismo
 * ataque se siente injusto); no crea arrays: recorre `options` dos veces.
 * Función pura: el azar llega como `rng` (0..1).
 */
export function pickWeighted<A extends string>(
  options: readonly A[],
  weights: Readonly<Record<A, number>>,
  last: A | null,
  rng: () => number,
): A {
  let total = 0;
  for (const a of options) if (a !== last) total += weights[a];
  // Solo queda el anterior: mejor repetirlo que quedarse sin atacar.
  if (total <= 0) return options[0];
  let r = rng() * total;
  let pick = options[0];
  for (const a of options) {
    if (a === last) continue;
    pick = a;
    r -= weights[a];
    if (r < 0) return a;
  }
  return pick;
}
