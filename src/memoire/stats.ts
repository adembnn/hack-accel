// Statistiques élémentaires pour comparer des runs sur graines appariées. Intervalle de confiance à 95 % (loi de Student).
const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];

export const moyenne = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export function ecartType(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = moyenne(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

export interface Resume { n: number; moyenne: number; ic95: number; min: number; max: number }

/** Moyenne et demi-largeur de l'intervalle de confiance à 95 % de la moyenne. */
export function resume(xs: number[]): Resume {
  const n = xs.length;
  const t = n < 2 ? Infinity : n - 1 <= T95.length ? T95[n - 2] : 1.96;
  return { n, moyenne: moyenne(xs), ic95: n < 2 ? Infinity : (t * ecartType(xs)) / Math.sqrt(n), min: Math.min(...xs), max: Math.max(...xs) };
}

export interface Ecart extends Resume {
  /** vrai si |moyenne| est strictement supérieure à la demi-largeur de l'intervalle (l'intervalle n'inclut pas 0). */
  significatif: boolean;
  /** « mieux » si la moyenne de (b - a) est négative et significative (plus petit = mieux), « pire » si positive, sinon « indetermine ». */
  sens: 'mieux' | 'pire' | 'indetermine';
}

/** Écart apparié b - a (mêmes graines). Plus petit = mieux pour tous les critères de la grille. */
export function ecartApparie(a: number[], b: number[]): Ecart {
  if (a.length !== b.length) throw new Error('écart apparié : longueurs différentes');
  const r = resume(a.map((x, i) => b[i] - x));
  const significatif = Math.abs(r.moyenne) > r.ic95;
  return { ...r, significatif, sens: !significatif ? 'indetermine' : r.moyenne < 0 ? 'mieux' : 'pire' };
}
