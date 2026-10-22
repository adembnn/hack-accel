// Choix de sortie : logit multinomial, poids de Lovreglio et al. (VR immersive, 344 choix, préprint arXiv 2110.11577)
// et du personnel (VR métro, Fire Technology 2025, 1 048 choix) ; voir reports/instantane-4-decision-humaine.md §2 et
// reports/maths-1-choix-de-sortie.md. [lu] = chiffre lu dans la source ; « hypothèse » = réglage à balayer, aucune mesure.
//
// Utilité de la porte i :  V_i = -θ x T_i + 0,795 connue + (-1,765) fermée_connue + 10 x β_p x part_foule + 2,739 consigne
//                          (+ ln(1/n_voisines) si la correction des portes voisines est activée).
// T_i = temps de marche + attente dans la file (minutes) ; la MÊME fonction de coût sert à choisir et à reconsidérer.
// Limite de transfert : les poids viennent de portes à 3-6 m ; passer à 50-150 m par un temps de trajet est un choix de
// modélisation, pas une mesure. Logit mixte : le poids du suivisme est tiré par personne.
import type { Rng } from './rng.ts';

/** Poids publiés. */
export const POIDS = {
  connue: 0.795, // porte déjà connue (celle d'entrée) [lu] arXiv 2110.11577, table 3
  fermee_connue: -1.765, // poids « fumée » réutilisé pour une issue connue comme fermée : extension, hypothèse
  suivisme_moyen: 0.076, // par personne (niveaux 0, 1, 5, 10) [lu] arXiv 2110.11577
  // Écart-type du logit mixte : 0,053/0,039 x 0,076 = 0,10 [lu + calcul] (VR métro, Fire Technology 2025, table 4).
  // L'ancien 0,08 n'avait aucune source (le préprint n'estime pas de logit mixte).
  suivisme_ecart: 0.1,
  personnel: 2.739, // un agent qui indique une sortie [lu] Fire Technology 2025
} as const;

/** Variante « personnes surprises » (couvre-feu non annoncé) : suivisme du premier essai du préprint, 0,041 + 0,192 [lu]. */
export const SUIVISME_SURPRIS = 0.233;

/** Réglages du choix de sortie, tous exposés pour l'analyse de sensibilité. */
export interface ParamsChoix {
  /** θ : échelle du coût en temps (par minute), pour la marche ET l'attente. Hypothèse, à balayer 0,3 / 0,9 / 3. */
  theta_par_minute: number;
  /** Moyenne du suivisme (0,076 [lu] ; SUIVISME_SURPRIS pour des personnes surprises). */
  suivisme_moyen: number;
  suivisme_ecart: number;
  /** 'somme' : T = marche + attente (défaut) ; 'max' : T = max(marche, attente), file fluide (maths-1 §4). Hypothèse à trancher. */
  cout_file: 'somme' | 'max';
  /**
   * Correction des portes voisines (IIA, maths-1 §1) : ajoute ln(1/n_voisines) à l'utilité pour que deux portes accolées
   * pèsent comme une seule. DÉSACTIVÉE par défaut : forme exacte non lue `[?]`, rayon de 15 m = hypothèse.
   */
  correction_iia: boolean;
  rayon_iia_m: number;
}

export const PARAMS_CHOIX: ParamsChoix = {
  theta_par_minute: 0.9, // hypothèse de réglage (maths-1 §2) : 100 m de marche = -1,15, proche de la plage de la VR (-1,13)
  suivisme_moyen: POIDS.suivisme_moyen,
  suivisme_ecart: POIDS.suivisme_ecart,
  cout_file: 'somme',
  correction_iia: false,
  rayon_iia_m: 15, // hypothèse
};

export function completerChoix(p?: Partial<ParamsChoix>): ParamsChoix {
  return { ...PARAMS_CHOIX, ...p };
}

export interface CandidatSortie {
  id: string;
  /** Temps de marche jusqu'à l'issue (minutes). */
  marche_min: number;
  connue: boolean;
  fermee_connue: boolean;
  /** Part (0 à 1) des autres personnes qui vont déjà vers cette issue. */
  part_foule: number;
  /** Consigne du personnel ou d'un message vers cette issue : force 0 à 1 (confiance x clarté). */
  consigne: number;
  /** Attente estimée dans la file (minutes) : (n + 1) / débit, la personne elle-même compte. */
  attente_min: number;
  /** Nombre équivalent de portes voisines, elle comprise (1 = isolée) ; utilisé seulement si `correction_iia`. */
  n_voisines?: number;
}

/** Coût en temps (minutes) d'une issue : la même fonction pour choisir et pour reconsidérer. */
export function coutMinutes(marche_min: number, attente_min: number, params: ParamsChoix = PARAMS_CHOIX): number {
  return params.cout_file === 'max' ? Math.max(marche_min, attente_min) : marche_min + attente_min;
}

/** Tire un coefficient de suivisme propre à une personne (logit mixte). */
export function tirerSuivisme(rng: Rng, params: Pick<ParamsChoix, 'suivisme_moyen' | 'suivisme_ecart'> = PARAMS_CHOIX): number {
  return rng.normal(params.suivisme_moyen, params.suivisme_ecart);
}

export function utilite(c: CandidatSortie, suivisme: number, params: ParamsChoix = PARAMS_CHOIX): number {
  return (
    -params.theta_par_minute * coutMinutes(c.marche_min, c.attente_min, params) +
    (c.connue ? POIDS.connue : 0) +
    (c.fermee_connue ? POIDS.fermee_connue : 0) +
    suivisme * 10 * c.part_foule + // NP = nombre de personnes sur l'échelle 0-10 du préprint
    POIDS.personnel * c.consigne +
    (params.correction_iia ? Math.log(1 / (c.n_voisines ?? 1)) : 0)
  );
}

/** Probabilités du logit (softmax). */
export function probabilites(candidats: CandidatSortie[], suivisme: number, params: ParamsChoix = PARAMS_CHOIX): number[] {
  if (!candidats.length) return [];
  const v = candidats.map((c) => utilite(c, suivisme, params));
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

/** Tirage selon le logit ; null si aucun candidat. Consomme exactement une valeur aléatoire. */
export function choisir(candidats: CandidatSortie[], suivisme: number, rng: Rng, params: ParamsChoix = PARAMS_CHOIX): string | null {
  if (!candidats.length) return null;
  const p = probabilites(candidats, suivisme, params);
  let u = rng.next();
  for (let i = 0; i < p.length; i++) {
    u -= p[i];
    if (u <= 0) return candidats[i].id;
  }
  return candidats[candidats.length - 1].id;
}

/**
 * Changement d'avis : logit binaire de Haghani et Sarvi 2019 (Transportation Research Part C, modèle de simulation) :
 *   V = c + 3,5 x ratio_de_congestion + 0,8 x visibilité + 0,8 x influence_sociale ;  P = 1 / (1 + e^-V).
 * ratio = (coût actuel - coût de la meilleure autre issue) / coût actuel, entre 0 et 1 ; visibilité = 1 si une issue moins
 * encombrée est visible ; influence sociale = 1 si quelqu'un a quitté, dans les 2 dernières secondes, l'issue envisagée
 * (le rapport maths-3 écrit « la même issue » : on prend celle vers laquelle on envisage d'aller, lecture à confirmer `[?]`).
 * ATTENTION : ces coefficients (3,5 ; 0,8 ; 0,8 ; fenêtre 2 s) ont été « choisis par essais et erreurs » par les auteurs
 * pour avoir des motifs plausibles, ils ne sont PAS estimés sur des données [lu]. Leur constante était -7,5 pour une
 * révision toutes les 0,4 s ; ici la révision est toutes les 15 s et chaque personne change au plus une fois, donc la
 * constante est RECALÉE (hypothèse) pour que 3 à 12 % des personnes changent au moins une fois : cible issue de Liao 2017
 * (0 à 7,5 % en vraies foules de laboratoire) et de Bode et Codling 2013 (7 à 15 % en réalité virtuelle).
 */
export interface ParamsChangement {
  constante: number;
  coef_congestion: number;
  coef_visibilite: number;
  coef_social: number;
  /** Période de révision de l'avis (s). Hypothèse (Haghani : 0,4 s ; ici 15 s, voir ci-dessus). */
  periode_s: number;
  /** Fenêtre de l'influence sociale (s) [lu] Haghani et Sarvi 2019. */
  fenetre_social_s: number;
  /**
   * Déclencheur mesuré de Liao 2017 : on ne reconsidère que si la vitesse tombe sous la moitié de la vitesse voulue. Notre
   * mouvement ne rend pas la vitesse de chaque personne : proxy = la personne est arrivée devant l'issue et une file s'y est
   * formée (vitesse nulle). Désactivé par défaut (révision périodique de tous ceux qui marchent).
   */
  declencheur_vitesse: boolean;
}

export const PARAMS_CHANGEMENT: ParamsChangement = {
  // Recalée (hypothèse) : départ -4,0 (maths-3) donnait 11-14 % ; balayage -4,5 / -5 / -5,5 sur 5 graines et les 2 plans du
  // benchmark : -5,0 donne 6,7-9,2 % (cible 3-12 %, centre ~7 %). À refaire si la scène ou le mouvement changent.
  constante: -5.0,
  coef_congestion: 3.5, // [lu] essais et erreurs
  coef_visibilite: 0.8, // [lu] essais et erreurs
  coef_social: 0.8, // [lu] essais et erreurs
  periode_s: 15, // hypothèse
  fenetre_social_s: 2, // [lu] essais et erreurs
  declencheur_vitesse: false,
};

export function completerChangement(p?: Partial<ParamsChangement>): ParamsChangement {
  return { ...PARAMS_CHANGEMENT, ...p };
}

export function probaChangement(ratio: number, visible: boolean, social: boolean, params: ParamsChangement = PARAMS_CHANGEMENT): number {
  const z = params.constante + params.coef_congestion * Math.min(1, Math.max(0, ratio)) + params.coef_visibilite * (visible ? 1 : 0) + params.coef_social * (social ? 1 : 0);
  return 1 / (1 + Math.exp(-z));
}
