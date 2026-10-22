// Départ : délai de pré-mouvement, loi log-logistique des spectateurs de cinéma.
// Source : Fire Technology 2019 (Lund, 30 exercices de cinéma, 1 954 mesures), voir reports/instantane-4-decision-humaine.md §3 :
// échelle (médiane) 40,5 s, forme 5,8. Ce sont des alarmes incendie en exercice, pas un couvre-feu : plancher, pas prévision.
import type { Rng } from './rng.ts';

export const MEDIANE_CINEMA_S = 40.5;
export const FORME_CINEMA = 5.8;

/** Tirage inverse : t = médiane x (u / (1 - u))^(1 / forme). */
export function tirerDelaiLogLogistique(rng: Rng, mediane_s = MEDIANE_CINEMA_S, forme = FORME_CINEMA): number {
  const u = Math.min(Math.max(rng.next(), 1e-9), 1 - 1e-9);
  return mediane_s * Math.pow(u / (1 - u), 1 / forme);
}

/** Quantile de la loi (pour les tests) : p entre 0 et 1. */
export function quantileLogLogistique(p: number, mediane_s = MEDIANE_CINEMA_S, forme = FORME_CINEMA): number {
  return mediane_s * Math.pow(p / (1 - p), 1 / forme);
}

/**
 * Multiplicateurs du délai (HYPOTHÈSES de réglage, signalées comme telles) :
 * - agent qui guide : retard 20,0 % contre 41,9 % sans (PMC10620751) -> délai x 0,8 ;
 * - message clair : x (1 - 0,25 x clarté) ; message flou (clarté < 0,5) : confusion, x (1 + 0,3 x (1 - clarté)) (FEMA, revue) ;
 * - ordre « rester ouvert » (aucune évacuation ordonnée) : départ naturel, échelle 30 fois plus longue.
 */
export function multiplicateurDelai(opts: { clarte: number | null; guide: boolean; ordonne: boolean }): number {
  if (!opts.ordonne && opts.clarte === null) return 30;
  let m = 1;
  if (opts.clarte !== null) m *= opts.clarte >= 0.5 ? 1 - 0.25 * opts.clarte : 1 + 0.3 * (1 - opts.clarte);
  if (opts.guide) m *= 0.8;
  return m;
}
