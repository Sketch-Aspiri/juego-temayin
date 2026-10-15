/**
 * Azar determinista del motor (mulberry32). Los jefes lo siembran con una semilla fija
 * para que las pruebas y las repeticiones sean reproducibles; `Math.random` queda solo
 * para efectos puramente visuales.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
