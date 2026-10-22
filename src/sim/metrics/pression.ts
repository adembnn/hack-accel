// Pression de foule de Helbing, densité locale, écrasement et diagramme fondamental de Weidmann : fonctions PURES.
// Prêtes pour le jour où le mouvement fournira les positions et les vitesses de chaque personne (le mouvement actuel
// est un modèle à files, sans vitesses individuelles : il ne peut pas les alimenter).
// Source : reports/maths-4-pression-ecrasement.md. Marques : [lu] = vérifié dans la source primaire, « hypothèse » = notre choix.
//
// Termes. Densité = personnes par m2. Pression de Helbing = densité x variance des vitesses (s^-2) : ce n'est PAS une force,
// c'est une mesure de l'agitation de la foule.

export interface Point {
  x: number;
  y: number;
}
export interface Vitesse {
  vx: number;
  vy: number;
}

/** Rayon du noyau gaussien de lissage, en mètres. Helbing, Johansson, Al-Abideen 2007, PRE 75, 046109, Fig. 1a [lu]. */
export const R_DENSITE_M = 1;
/** Début de la « turbulence » de foule, s^-2. Même article [lu] : dépend de R et du type de foule, l'accident vient ~10 min après. */
export const SEUIL_PRESSION_HELBING = 0.02;
/** Seuil d'écrasement, pers./m2. Green Guide 5,4 (HSE, annexe 4) et « redline » de Still [lu]. */
export const SEUIL_ECRASEMENT_PERS_M2 = 5;
/** Au-delà de 3 R le poids du noyau est inférieur à 1,3e-4 : on l'ignore (hypothèse de calcul, donne le coût O(n)). */
const PORTEE_EN_R = 3;

/** Weidmann 1993 : vitesse libre m/s, γ en pers./m2, densité maximale pers./m2 (forme et valeurs : arXiv 0810.4590, Eq. 2 [lu]). */
export const WEIDMANN = { v0: 1.34, gamma: 1.913, rhoMax: 5.4 } as const;

/** Poids gaussien d'une personne vue d'une distance d : exp(-d²/R²) / (π R²). Son intégrale sur le plan vaut 1 [lu]. */
export function noyau(d2: number, R = R_DENSITE_M): number {
  return Math.exp(-d2 / (R * R)) / (Math.PI * R * R);
}

/**
 * Pour chaque cible, somme des poids du noyau des sources et des vitesses pondérées.
 * Hachage spatial : cases de 3 R, chaque cible ne regarde que les 9 cases voisines, donc coût O(n) à densité bornée.
 */
function accumuler(sources: Point[], cibles: Point[], R: number, vit?: Vitesse[]) {
  const L = PORTEE_EN_R * R;
  const cle = (cx: number, cy: number) => `${cx},${cy}`;
  const cases = new Map<string, number[]>();
  sources.forEach((s, j) => {
    const k = cle(Math.floor(s.x / L), Math.floor(s.y / L));
    const c = cases.get(k);
    if (c) c.push(j);
    else cases.set(k, [j]);
  });
  return cibles.map((c) => {
    let w = 0, wx = 0, wy = 0;
    const cx = Math.floor(c.x / L), cy = Math.floor(c.y / L);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const j of cases.get(cle(cx + dx, cy + dy)) ?? []) {
          const d2 = (sources[j].x - c.x) ** 2 + (sources[j].y - c.y) ** 2;
          if (d2 > L * L) continue;
          const p = noyau(d2, R);
          w += p;
          if (vit) {
            wx += p * vit[j].vx;
            wy += p * vit[j].vy;
          }
        }
    return { w, wx, wy };
  });
}

/** Densité locale ρ(r) = Σ exp(-d²/R²)/(πR²) en chaque point de `cibles` (par défaut, à la position de chaque personne : elle se compte elle-même). */
export function densiteLocale(positions: Point[], cibles: Point[] = positions, R = R_DENSITE_M): number[] {
  return accumuler(positions, cibles, R).map((a) => a.w);
}

/** Vitesse locale V(r) = Σ v_j f / Σ f (moyenne pondérée par le même noyau) ; (0, 0) là où aucune personne n'est à portée. */
export function vitesseLocale(positions: Point[], vitesses: Vitesse[], cibles: Point[] = positions, R = R_DENSITE_M): Vitesse[] {
  return accumuler(positions, cibles, R, vitesses).map((a) => (a.w > 0 ? { vx: a.wx / a.w, vy: a.wy / a.w } : { vx: 0, vy: 0 }));
}

/**
 * Pression P = ρ̄ · Var(V) en s^-2 (Helbing 2007, variante de la Fig. 3c : variance SPATIALE des vitesses locales sur les nœuds [lu]).
 * `noeuds` : points où l'on évalue (par défaut la position des personnes ; une grille de 0,5 m sur la zone praticable est préférable).
 * On ne garde que les nœuds de densité > `rhoMin` (1 pers./m2, hypothèse du rapport : ne pas diluer la moyenne).
 * Le lissage sur 10 s et le maximum sur zones et temps sont à la charge de l'appelant (choix à nous, hypothèse).
 */
export function pressionHelbing(positions: Point[], vitesses: Vitesse[], noeuds: Point[] = positions, R = R_DENSITE_M, rhoMin = 1): number {
  const acc = accumuler(positions, noeuds, R, vitesses).filter((a) => a.w > rhoMin);
  if (!acc.length) return 0;
  const V = acc.map((a) => ({ vx: a.wx / a.w, vy: a.wy / a.w }));
  const mx = V.reduce((s, v) => s + v.vx, 0) / V.length;
  const my = V.reduce((s, v) => s + v.vy, 0) / V.length;
  const variance = V.reduce((s, v) => s + (v.vx - mx) ** 2 + (v.vy - my) ** 2, 0) / V.length;
  const rhoMoy = acc.reduce((s, a) => s + a.w, 0) / acc.length;
  return rhoMoy * variance;
}

/** Vitesse de marche de Weidmann v(ρ) = v0 · [1 − exp(−γ (1/ρ − 1/ρmax))], m/s ; 0 au-delà de ρmax, v0 pour ρ proche de 0. */
export function vitesseWeidmann(rho: number): number {
  if (rho <= 0) return WEIDMANN.v0;
  if (rho >= WEIDMANN.rhoMax) return 0;
  return WEIDMANN.v0 * (1 - Math.exp(-WEIDMANN.gamma * (1 / rho - 1 / WEIDMANN.rhoMax)));
}

/** Débit spécifique J = ρ · v, en pers./m/s (maximum ≈ 1,22 vers 1,75 pers./m2). */
export function debitWeidmann(rho: number): number {
  return rho * vitesseWeidmann(rho);
}

/**
 * Écrasement d'UN pas : nombre de personnes à densité locale > seuil, fois dt / 60 (personnes-minutes).
 * Écrasement total = Σ_t Σ_i 1[ρ_i(t) > 5] · Δt / 60 (rapport maths-4 §5).
 */
export function ecrasementDuPas(densitesIndividuelles: number[], dt_s: number, seuil = SEUIL_ECRASEMENT_PERS_M2): number {
  return (densitesIndividuelles.filter((r) => r > seuil).length * dt_s) / 60;
}
