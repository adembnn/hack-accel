// Générateur pseudo-aléatoire déterministe (mulberry32) : mêmes graines = mêmes résultats.

export interface Rng {
  /** Réel dans [0, 1). */
  next(): number;
  /** Loi normale (Box-Muller). */
  normal(moyenne?: number, ecartType?: number): number;
  /** Entier dans [0, n). */
  entier(n: number): number;
}

export function creerRng(graine: number): Rng {
  let a = graine >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    normal(moyenne = 0, ecartType = 1) {
      const u = Math.max(next(), 1e-12);
      const v = next();
      return moyenne + ecartType * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    entier(n) {
      return Math.floor(next() * n);
    },
  };
}
