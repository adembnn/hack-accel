// Statistiques du benchmark : CSV sûr, quantile de Student exact, intervalles de confiance, différence appariée,
// bootstrap à graine fixe, taille d'effet, convergence (critère de Ronchi et al., Fire Technology 2013,
// DOI 10.1007/s10694-013-0352-7), verdict. Sans dépendance, sans appel LLM. Sources : reports/maths-5-statistiques-validation.md.
// Les intervalles ne couvrent que le hasard des personnes (les graines), jamais l'erreur du modèle (jusqu'à 30 %, RiMEA).
import { creerRng } from '../src/sim/behavior/rng.ts';

/** Incertitude de modèle entre logiciels de référence (RiMEA 2025, amphithéâtre) : un écart relatif plus petit n'est pas distinguable. */
export const SEUIL_MODELE_PCT = 30;
export const PLAFOND = 'plafond';

// ---------- CSV ----------

/** Un champ CSV : entre guillemets s'il contient une virgule, un guillemet ou un saut de ligne (guillemets doublés). */
export function champCsv(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export const ligneCsv = (champs: (string | number | null | undefined)[]): string => champs.map(champCsv).join(',');

/** Nombre au format CSV (2 décimales, 4 si 0 < |x| < 1) ; vide si non fini. */
export const nb = (x: number | null | undefined, d?: number): string => (typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d ?? (x !== 0 && Math.abs(x) < 1 ? 4 : 2)) : '');

// ---------- Loi de Student ----------

function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const cj of c) ser += cj / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Bêta incomplète régularisée I_x(a, b), fraction continue de Lentz. */
function betaInc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (xx: number, aa: number, bb: number): number => {
    const T = 1e-30;
    let c = 1;
    let d = 1 - ((aa + bb) * xx) / (aa + 1);
    if (Math.abs(d) < T) d = T;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let an = (m * (bb - m) * xx) / ((aa + m2 - 1) * (aa + m2));
      d = 1 + an * d; if (Math.abs(d) < T) d = T;
      c = 1 + an / c; if (Math.abs(c) < T) c = T;
      d = 1 / d; h *= d * c;
      an = (-(aa + m) * (aa + bb + m) * xx) / ((aa + m2) * (aa + m2 + 1));
      d = 1 + an * d; if (Math.abs(d) < T) d = T;
      c = 1 + an / c; if (Math.abs(c) < T) c = T;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? (bt * cf(x, a, b)) / a : 1 - (bt * cf(1 - x, b, a)) / b;
}

/** Fonction de répartition de la loi de Student à ddl degrés de liberté. */
export function studentCdf(t: number, ddl: number): number {
  const p = 0.5 * betaInc(ddl / (ddl + t * t), ddl / 2, 0.5);
  return t > 0 ? 1 - p : p;
}

/** Quantile de Student (défaut : bilatéral 95 %, soit p = 0,975). Exact par bissection : t(19) = 2,093 ; t(99) = 1,984. */
export function quantileStudent(ddl: number, p = 0.975): number {
  if (!(ddl >= 1)) return NaN;
  let bas = 0;
  let haut = 1e4;
  for (let i = 0; i < 100; i++) {
    const mid = (bas + haut) / 2;
    if (studentCdf(mid, ddl) < p) bas = mid; else haut = mid;
  }
  return (bas + haut) / 2;
}

// ---------- Moyenne, écart-type, intervalle ----------

export const moyenne = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
export const ecartType = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = moyenne(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

export interface Resume {
  n: number;
  moy: number;
  sd: number;
  /** Coefficient de variation en % (écart-type / |moyenne|) ; NaN si la moyenne est nulle. */
  cv_pct: number;
  bas: number;
  haut: number;
  /** Vrai si l'écart-type est nul : l'intervalle [m ; m] n'est pas un résultat, c'est un plafond. */
  plafond: boolean;
}

/** Moyenne et intervalle de confiance à 95 % de Student (n−1 ddl), quel que soit n. */
export function resumer(xs: number[]): Resume {
  const n = xs.length;
  if (!n) return { n: 0, moy: NaN, sd: NaN, cv_pct: NaN, bas: NaN, haut: NaN, plafond: false };
  const moy = moyenne(xs);
  const sd = ecartType(xs);
  const demi = n > 1 ? (quantileStudent(n - 1) * sd) / Math.sqrt(n) : NaN;
  return { n, moy, sd, cv_pct: moy === 0 ? NaN : (100 * sd) / Math.abs(moy), bas: moy - demi, haut: moy + demi, plafond: sd === 0 };
}

// ---------- Différence appariée ----------

export interface Comparaison {
  n: number;
  /** Différence moyenne après − avant. */
  d: Resume;
  /** Différence relative en % de la moyenne « avant » (NaN si elle est nulle). */
  diff_relative_pct: number;
  /** Taille d'effet appariée d_z = d̄ / s_d ; NaN si s_d = 0. */
  d_z: number;
  /** Corrélation avant/après (gain des graines communes seulement si > 0). */
  rho: number;
  boot_bas: number;
  boot_haut: number;
}

/** Paires (avant, après) dont aucune valeur n'est manquante. */
export function apparier(a: (number | null)[], b: (number | null)[]): [number[], number[]] {
  const xa: number[] = [];
  const xb: number[] = [];
  a.forEach((x, i) => { const y = b[i]; if (x !== null && y !== null && y !== undefined) { xa.push(x); xb.push(y); } });
  return [xa, xb];
}

export function correlation(x: number[], y: number[]): number {
  const sx = ecartType(x);
  const sy = ecartType(y);
  if (x.length < 2 || sx === 0 || sy === 0) return NaN;
  const mx = moyenne(x);
  const my = moyenne(y);
  return x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / ((x.length - 1) * sx * sy);
}

/** Intervalle bootstrap percentile de la moyenne ; graine fixe donc reproductible. */
export function bootstrapMoyenne(xs: number[], rechantillons = 2000, graine = 20261022): [number, number] {
  const n = xs.length;
  if (n < 2) return [NaN, NaN];
  const rng = creerRng(graine);
  const moys: number[] = [];
  for (let r = 0; r < rechantillons; r++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += xs[rng.entier(n)];
    moys.push(s / n);
  }
  moys.sort((p, q) => p - q);
  return [moys[Math.floor(0.025 * rechantillons)], moys[Math.min(rechantillons - 1, Math.ceil(0.975 * rechantillons) - 1)]];
}

export function comparer(avant: (number | null)[], apres: (number | null)[]): Comparaison {
  const [xa, xb] = apparier(avant, apres);
  const diffs = xb.map((y, i) => y - xa[i]);
  const d = resumer(diffs);
  const ma = xa.length ? moyenne(xa) : NaN;
  const [boot_bas, boot_haut] = bootstrapMoyenne(diffs);
  return {
    n: diffs.length,
    d,
    diff_relative_pct: ma === 0 ? NaN : (100 * d.moy) / Math.abs(ma),
    d_z: d.sd === 0 ? NaN : d.moy / d.sd,
    rho: correlation(xa, xb),
    boot_bas,
    boot_haut,
  };
}

// ---------- Verdict ----------

export type Sens = 'moins_est_mieux' | 'plus_est_mieux';
export type Verdict = 'mieux' | 'pire' | 'equivalent' | 'indistinct' | 'plafond';

/**
 * Verdict statistique (hasard des graines seulement) :
 * plafond = variance nulle (rien à mesurer) ; mieux / pire = l'IC à 95 % exclut 0 ; equivalent = l'IC tient dans ±5 % de « avant » ;
 * indistinct = ni l'un ni l'autre. Ne dit rien de l'erreur de modèle : voir sous_incertitude_modele.
 */
export function verdict(c: Comparaison, sens: Sens, moyenneAvant: number): Verdict {
  if (c.n < 2 || c.d.plafond) return 'plafond';
  const { bas, haut } = c.d;
  if (bas > 0 || haut < 0) return (c.d.moy < 0) === (sens === 'moins_est_mieux') ? 'mieux' : 'pire';
  const marge = 0.05 * Math.abs(moyenneAvant);
  return marge > 0 && bas > -marge && haut < marge ? 'equivalent' : 'indistinct';
}

/** Vrai si |écart relatif| < 30 % : l'écart est dans l'incertitude de modèle, il ne permet pas de conclure. */
export const sousIncertitudeModele = (diffRelativePct: number): boolean => Number.isFinite(diffRelativePct) && Math.abs(diffRelativePct) < SEUIL_MODELE_PCT;

// ---------- Convergence (Ronchi et al. 2013) ----------

export interface Convergence {
  converge: boolean;
  /** Nombre de runs au premier moment où le critère est tenu (null si jamais). */
  n_converge: number | null;
}

/**
 * Critère de Ronchi : après chaque run (à partir de nMin), la moyenne et l'écart-type cumulés changent de moins de `seuil`
 * (relatif) par rapport au run précédent, pendant b runs consécutifs. Série constante = convergée.
 */
export function convergence(xs: number[], seuil = 0.01, b = 5, nMin = 10): Convergence {
  const rel = (nouveau: number, ancien: number): number => (nouveau === ancien ? 0 : ancien === 0 ? Infinity : Math.abs(nouveau - ancien) / Math.abs(ancien));
  let serie = 0;
  let precM = NaN;
  let precS = NaN;
  for (let k = 2; k <= xs.length; k++) {
    const part = xs.slice(0, k);
    const m = moyenne(part);
    const s = ecartType(part);
    if (k > nMin) {
      serie = rel(m, precM) < seuil && rel(s, precS) < seuil ? serie + 1 : 0;
      if (serie >= b) return { converge: true, n_converge: k };
    }
    precM = m;
    precS = s;
  }
  return { converge: false, n_converge: null };
}

/** Nombre de graines pour que la demi-largeur de l'IC à 95 % de la moyenne soit ≤ 1 % de |moyenne| (null si moyenne nulle). */
export function nRequis1pct(xs: number[]): number | null {
  const r = resumer(xs);
  if (!(r.n > 1) || r.moy === 0) return null;
  if (r.sd === 0) return 2;
  const cv = r.sd / Math.abs(r.moy);
  let n = Math.max(2, Math.ceil((1.96 * cv / 0.01) ** 2));
  for (let i = 0; i < 3; i++) n = Math.max(2, Math.ceil((quantileStudent(n - 1) * cv / 0.01) ** 2));
  return n;
}
