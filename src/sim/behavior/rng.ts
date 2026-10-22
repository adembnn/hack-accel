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

/**
 * Mélange quelques entiers en un seul entier de 32 bits (hachage de type murmur). Sert à dériver un flux aléatoire propre
 * à chaque personne et à chaque usage : `melanger(graine, id, canal)`. Choix de modélisation (nombres aléatoires communs,
 * rapport maths-5 §3), pas une mesure.
 */
export function melanger(...entiers: number[]): number {
  let h = 0x811c9dc5;
  for (const x of entiers) {
    h = Math.imul(h ^ (x | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

/**
 * Canaux d'une personne : un flux par usage, pour que deux plans joués avec la même graine tirent les mêmes valeurs
 * pour la même personne, même quand leurs décisions divergent (le choix d'une personne ne décale pas les tirages d'une autre).
 */
export const CANAL = { traits: 0, guidage: 1, choix: 2, hesitation: 3, changement: 4, groupes: 5 } as const;

/** Flux aléatoire d'une personne (id) pour un usage (canal), dérivé de la graine. */
export function creerRngPersonne(graine: number, id: number, canal: number): Rng {
  return creerRng(melanger(graine, id, canal));
}
