// Grille de critères d'un run. Sources : reports/criteres-jugement-crise.md ; reports/maths-4-pression-ecrasement.md ;
// décision d'Adem sur #15 : écrasement = personnes-minutes au-dessus de 5 pers./m2 ; la durée de 60 s est écartée ;
// ordre : non sortis, zone de danger, écrasement. Les POIDS du total et les échelles de note sont des propositions
// de réglage (hypothèses), seuls l'ordre et les seuils 4 et 5 pers./m2 viennent des sources ou de la décision.
//
// Écrasement = Σ_t Σ_i 1[ρ_i(t) > 5] · Δt / 60, en personnes-minutes (ρ_i = densité autour de la personne i). Faute de positions
// individuelles, le simulateur ajoute file_par_issue · Δt / 60 à chaque pas où la densité MOYENNE de la zone d'approche dépasse 5 :
// c'est la même somme avec une densité de zone, plus basse que la densité locale (donc une estimation par défaut). Voir `ecrasementDuPas`.
//
// Pression de Helbing (Helbing, Johansson, Al-Abideen 2007, Phys. Rev. E 75, 046109) : la valeur du moteur actuel est un PROXY
// (ρ·(0,15·(ρ−3))², sans vitesses individuelles), non comparable au seuil 0,02 s^-2. Elle est affichée, étiquetée, mais ne déclenche
// aucune ligne rouge et ne pèse pas dans le total. La vraie pression est dans `pression.ts`.
import type { Critere, Grille } from '../behavior/types.ts';
import { AVERTISSEMENT } from '../behavior/types.ts';
import { SEUIL_ECRASEMENT_PERS_M2, SEUIL_PRESSION_HELBING } from './pression.ts';

export { SEUIL_PRESSION_HELBING };

export const SEUIL_ALERTE = 4; // pers./m2 (hypothèse de travail, #15)
export const SEUIL_ROUGE = SEUIL_ECRASEMENT_PERS_M2; // 5 pers./m2 (Green Guide 5,4, Still ; #15) [lu]
/** Tant que la pression du moteur est un proxy, elle ne compte ni dans la ligne rouge ni dans le total. Passer à false avec de vraies vitesses. */
export const PRESSION_EST_PROXY = true;
export const LIBELLE_PRESSION = 'pression (proxy, non comparable au seuil 0,02 s^-2 de Helbing)';
export const SEJOUR_DEHORS_MIN = 10; // minutes passées dans la zone derrière l'issue (hypothèse)
export const NIVEAU_DANGER = { sur: 0, vigilance: 1, interdite: 2, cul_de_sac: 2 } as const;

/** Mesures brutes d'un run, remplies par le simulateur. */
export interface Mesures {
  n: number;
  /** Instant de sortie de chaque personne (Infinity si jamais sortie). */
  t_sortie_s: number[];
  mobilite_reduite: boolean[];
  /**
   * Pour chaque personne : instant d'entrée au refuge (espace d'attente sécurisé) et de sortie du refuge (Infinity = jamais entrée /
   * toujours dedans). Facultatif : absent, personne n'est jamais à l'abri.
   */
  pmr_abri_debut_s?: number[];
  pmr_abri_fin_s?: number[];
  /** Σ niveau de danger x minutes passées derrière l'issue. */
  danger_personnes_minutes: number;
  /** Personnes arrivées dans une station fermée ou une rue barrée. */
  culs_de_sac: number;
  /** Sorties par une issue vers un lieu sûr. */
  sorties_sures: number;
  /** Personnes-minutes passées à plus de SEUIL_ROUGE pers./m2. */
  ecrasement_personnes_minutes: number;
  /** Maximum de la pression observée : un PROXY tant que le mouvement n'a pas de vitesses individuelles (voir PRESSION_EST_PROXY). */
  pression_max: number;
  echeances: { metro_s: number; couvre_feu_s: number };
}

function note(valeur: number, note: number): Critere {
  return { valeur, note: Math.max(0, Math.min(100, note)) };
}

export function percentile(ts: number[], p: number): number | null {
  const tri = ts.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const k = Math.ceil(p * ts.length) - 1;
  if (k < 0 || k >= tri.length) return null; // moins de p % sortis
  return tri[k];
}

/** Ligne rouge : il y a eu de l'écrasement (> 0 personne-minute au-dessus de 5 pers./m2) ; la pression ne compte que si elle est vraie, pas un proxy. */
export function ligneRouge(m: Mesures): boolean {
  return m.ecrasement_personnes_minutes > 0 || (!PRESSION_EST_PROXY && m.pression_max > SEUIL_PRESSION_HELBING);
}

export function calculerGrille(m: Mesures): Grille {
  const { n } = m;
  const nonSortis = (T: number, filtre?: boolean[]) =>
    m.t_sortie_s.reduce((s, t, i) => s + (t > T && (!filtre || filtre[i]) ? 1 : 0), 0);
  const nPmr = m.mobilite_reduite.filter(Boolean).length;
  const ns22 = nonSortis(m.echeances.metro_s);
  const ns23 = nonSortis(m.echeances.couvre_feu_s);
  const nsPmr = nonSortis(m.echeances.metro_s, m.mobilite_reduite);

  // PMR sortis OU à l'abri en espace d'attente sécurisé à 22 h : l'évacuation différée est prévue par la règle (arrêté du 25 juin 1980,
  // CO 57 et GN 8) pour qui ne peut pas sortir seul ; la personne attend alors l'aide en sécurité, elle n'est pas « perdue ». Compte comme
  // non sécurisée toute PMR ni sortie ni au refuge à 22 h. Sans refuge, ce critère est égal à non_sortis_22h_mobilite_reduite. Il ne
  // remplace pas ce dernier et n'entre pas dans le total : décision de pondération laissée à Adem (une PMR au refuge n'est pas dehors).
  const exposeesPmr = m.t_sortie_s.reduce((s, t, i) => {
    if (!m.mobilite_reduite[i] || t <= m.echeances.metro_s) return s;
    const abri = (m.pmr_abri_debut_s?.[i] ?? Infinity) <= m.echeances.metro_s && m.echeances.metro_s < (m.pmr_abri_fin_s?.[i] ?? Infinity);
    return s + (abri ? 0 : 1);
  }, 0);
  const pmr_sortis_ou_abri_22h = note(exposeesPmr, nPmr ? 100 * (1 - exposeesPmr / nPmr) : 100);

  const non_sortis_22h = note(ns22, 100 * (1 - ns22 / n));
  const non_sortis_23h = note(ns23, 100 * (1 - ns23 / n));
  const non_sortis_22h_mobilite_reduite = note(nsPmr, nPmr ? 100 * (1 - nsPmr / nPmr) : 100);

  const dangerTotal = m.danger_personnes_minutes + m.culs_de_sac * NIVEAU_DANGER.cul_de_sac * SEJOUR_DEHORS_MIN;
  const pire = n * NIVEAU_DANGER.interdite * SEJOUR_DEHORS_MIN;
  const zone_danger = note(dangerTotal, 100 * (1 - dangerTotal / pire));

  // échelle de note de l'écrasement : 100 pers.-min = note 50 (hypothèse de réglage)
  const ecrasement = note(m.ecrasement_personnes_minutes, 100 / (1 + m.ecrasement_personnes_minutes / 100));

  const sortis = m.t_sortie_s.filter((t) => Number.isFinite(t)).length;
  const continuite = note(m.sorties_sures, sortis ? 100 * (m.sorties_sures / n) : 0);

  // la pression (proxy) n'entre pas dans le total.
  // poids du total (hypothèse) : l'ordre non sortis > danger > écrasement est celui d'Adem (#15)
  const nonSortisMoy = (non_sortis_22h.note + non_sortis_23h.note + non_sortis_22h_mobilite_reduite.note) / 3;
  const total = 0.4 * nonSortisMoy + 0.3 * zone_danger.note + 0.2 * ecrasement.note + 0.1 * continuite.note;

  return {
    non_sortis_22h,
    non_sortis_23h,
    non_sortis_22h_mobilite_reduite,
    pmr_sortis_ou_abri_22h,
    zone_danger,
    ecrasement,
    pression_helbing_max: m.pression_max,
    delai_t90_s: percentile(m.t_sortie_s, 0.9),
    delai_t99_s: percentile(m.t_sortie_s, 0.99),
    continuite,
    total,
    avertissement: AVERTISSEMENT,
  };
}
