// Choix de sortie : logit multinomial, poids de Lovreglio et al. (VR immersive, 344 choix, préprint arXiv 2110.11577)
// et du personnel (VR métro, Fire Technology 2025) ; voir reports/instantane-4-decision-humaine.md §2.
// Limite de transfert : ces poids viennent de portes à 3-6 m. On NORMALISE la distance (écart relatif entre portes ramené à
// 0-3 m équivalents) : choix de modélisation, pas une mesure. Logit mixte : le poids du suivisme est tiré par personne.
import type { Rng } from './rng.ts';

export const POIDS = {
  distance: -0.378, // par mètre équivalent
  connue: 0.795, // porte déjà connue (celle d'entrée)
  fermee_connue: -1.765, // poids « fumée » réutilisé pour une issue connue comme fermée ou impraticable
  suivisme_moyen: 0.076, // par personne (niveaux 0, 1, 5, 10)
  suivisme_ecart: 0.08, // écart-type du logit mixte (certains évitent la foule)
  personnel: 2.739, // un agent qui indique une sortie
  file_par_minute: -0.9, // attente estimée (hypothèse de réglage : lien avec le déséquilibre des files, Haghani 2020)
} as const;

export interface CandidatSortie {
  id: string;
  /** Distance normalisée en mètres équivalents (0 à 3). */
  distance_eq: number;
  connue: boolean;
  fermee_connue: boolean;
  /** Part (0 à 1) des autres personnes qui vont déjà vers cette issue. */
  part_foule: number;
  /** Consigne du personnel ou d'un message vers cette issue : force 0 à 1 (confiance x clarté). */
  consigne: number;
  /** Attente estimée dans la file (minutes). */
  attente_min: number;
}

/** Tire un coefficient de suivisme propre à une personne (logit mixte). */
export function tirerSuivisme(rng: Rng): number {
  return rng.normal(POIDS.suivisme_moyen, POIDS.suivisme_ecart);
}

/** Distance relative : écart à l'issue la plus proche, ramené à 0-3 m équivalents. */
export function normaliserDistances(distances_m: number[]): number[] {
  const min = Math.min(...distances_m);
  const max = Math.max(...distances_m);
  const etendue = max - min;
  return distances_m.map((d) => (etendue < 1e-9 ? 0 : (3 * (d - min)) / etendue));
}

export function utilite(c: CandidatSortie, suivisme: number): number {
  return (
    POIDS.distance * c.distance_eq +
    (c.connue ? POIDS.connue : 0) +
    (c.fermee_connue ? POIDS.fermee_connue : 0) +
    suivisme * 10 * c.part_foule + // NP = nombre de personnes sur l'échelle 0-10 du préprint
    POIDS.personnel * c.consigne +
    POIDS.file_par_minute * c.attente_min
  );
}

/** Probabilités du logit (softmax). */
export function probabilites(candidats: CandidatSortie[], suivisme: number): number[] {
  if (!candidats.length) return [];
  const v = candidats.map((c) => utilite(c, suivisme));
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

/** Tirage selon le logit ; null si aucun candidat. */
export function choisir(candidats: CandidatSortie[], suivisme: number, rng: Rng): string | null {
  if (!candidats.length) return null;
  const p = probabilites(candidats, suivisme);
  let u = rng.next();
  for (let i = 0; i < p.length; i++) {
    u -= p[i];
    if (u <= 0) return candidats[i].id;
  }
  return candidats[candidats.length - 1].id;
}

/**
 * Changement d'avis : logit binaire (Haghani et Sarvi 2019 ; Haghani 2020). Pousse à changer : déséquilibre des files
 * (facteur principal) et rafale de changements vers la même porte. Constante réglée pour que 7 à 15 % des personnes
 * changent au moins une fois (Bode et Codling 2013) ; coefficients exacts non publiés dans nos sources `[?]`.
 */
export const CHANGEMENT = { constante: -6.4, desequilibre_par_minute: 0.6, rafale: 1.0 } as const;

export function probaChangement(desequilibre_min: number, rafale: number): number {
  const z = CHANGEMENT.constante + CHANGEMENT.desequilibre_par_minute * Math.max(0, desequilibre_min) + CHANGEMENT.rafale * Math.min(rafale, 2);
  return 1 / (1 + Math.exp(-z));
}
