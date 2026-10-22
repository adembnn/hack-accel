// Départ : délai de pré-mouvement (temps entre l'ordre et le premier pas), loi log-logistique.
// Source : Forssberg, Kjellström, Frantzich, Mossberg, Nilsson, « The Variation of Pre-movement Time in Building
// Evacuation », Fire Technology 55(6), 2019, tableau 6 : cinéma, message vocal, 891 personnes (14 exercices),
// échelle (= médiane) 40,5 s, forme 5,8 [lu]. Ce sont des alarmes incendie en exercice, pas un couvre-feu :
// c'est un PLANCHER, pas une prévision. Détail et limites : reports/maths-2-temps-de-depart.md.
// Légende : [lu] = lu dans la source citée ; [calcul] = refait à partir de chiffres lus ; « hypothèse » = sans source.
import type { Rng } from './rng.ts';

/** Échelle = médiane du plancher, en secondes. Forssberg 2019, tableau 6 [lu]. */
export const MEDIANE_PLANCHER_S = 40.5;
/** Forme du plancher (plus elle est petite, plus la queue est longue). Forssberg 2019, tableau 6 [lu]. */
export const FORME_PLANCHER = 5.8;
/** Anciens noms, gardés pour que simuler.ts et les tests compilent sans changement. */
export const MEDIANE_CINEMA_S = MEDIANE_PLANCHER_S;
export const FORME_CINEMA = FORME_PLANCHER;

/** Forme minimale : en dessous de 2,5 la variance devient infinie (elle n'existe que si forme > 2). Maths 2 §2 [calcul]. */
export const FORME_MIN = 2.5;

function verifierForme(forme: number): void {
  if (!(forme >= FORME_MIN)) throw new RangeError(`forme ${forme} < ${FORME_MIN} : variance infinie, refusé`);
}

/** Tirage inverse : t = médiane x (u / (1 - u))^(1 / forme). */
export function tirerDelaiLogLogistique(rng: Rng, mediane_s = MEDIANE_PLANCHER_S, forme = FORME_PLANCHER): number {
  verifierForme(forme);
  const u = Math.min(Math.max(rng.next(), 1e-9), 1 - 1e-9);
  return mediane_s * Math.pow(u / (1 - u), 1 / forme);
}

/** Quantile de la loi (pour les tests) : p entre 0 et 1. */
export function quantileLogLogistique(p: number, mediane_s = MEDIANE_PLANCHER_S, forme = FORME_PLANCHER): number {
  verifierForme(forme);
  return mediane_s * Math.pow(p / (1 - p), 1 / forme);
}

// --- Facteurs multiplicatifs du délai (modèle à temps accéléré : toute la loi est étirée par m) ---

/** Guidage par un agent : x 0,8. Cohérent avec 0,83 = rapport de cotes 0,33 (régression, 126 vidéos, PMC10620751) converti par m = RC^(1/forme) avec forme 5,8 [lu, calcul] ; plage 0,68 à 1,0. */
export const FACTEUR_GUIDAGE = 0.8;

/** Facteur de clarté à clarté 0 (message flou, confusion) : 1,3. Hypothèse sans source (extrémité de l'ancien réglage). */
export const FACTEUR_CLARTE_0 = 1.3;
/** Facteur de clarté à clarté 1 (message clair) : 0,75. Hypothèse sans source (extrémité de l'ancien réglage). */
export const FACTEUR_CLARTE_1 = 0.75;

/** Facteur de clarté continu 1,3^(1-c) x 0,75^c : 1,3 à c = 0, 0,75 à c = 1, sans saut. Hypothèse sans source (aucun coefficient publié pour la clarté). */
export function facteurClarte(clarte: number): number {
  const c = Math.min(Math.max(clarte, 0), 1);
  return Math.pow(FACTEUR_CLARTE_0, 1 - c) * Math.pow(FACTEUR_CLARTE_1, c);
}

/** Contexte « sans menace visible » (ni fumée ni alarme sonore) : central x 1,5. Hypothèse encadrée par deux lignes d'indices : rapports de cotes des vidéos x1,2 à 1,4 et moyennes sonnerie/voix x1,9 à 2,5 [calcul]. */
export const CONTEXTE_SANS_MENACE_CENTRAL = 1.5;
/** Borne basse de la plage du contexte sans menace. Hypothèse (maths 2 §3). */
export const CONTEXTE_SANS_MENACE_MIN = 1.15;
/** Borne haute de la plage du contexte sans menace. Hypothèse (maths 2 §3). */
export const CONTEXTE_SANS_MENACE_MAX = 2.5;

/** Ordre « rester ouvert », aucune évacuation ordonnée : départ naturel, échelle x30. HYPOTHÈSE SANS SOURCE (aucune publication ne donne 30) : à remplacer par p_reste ou le contexte ; gardé seulement pour compatibilité. */
export const FACTEUR_SANS_ORDRE_HYPOTHESE = 30;

/**
 * Multiplicateur total du délai.
 * - clarté (continue) : voir facteurClarte (hypothèse) ; null = pas de message ;
 * - guide : x 0,8 (voir FACTEUR_GUIDAGE) ;
 * - contexte (optionnel, défaut 1 = plancher) : par exemple CONTEXTE_SANS_MENACE_CENTRAL ;
 * - sans ordre ni message : x30, hypothèse sans source.
 */
export function multiplicateurDelai(opts: { clarte: number | null; guide: boolean; ordonne: boolean; contexte?: number }): number {
  if (!opts.ordonne && opts.clarte === null) return FACTEUR_SANS_ORDRE_HYPOTHESE;
  let m = opts.contexte ?? 1;
  if (opts.clarte !== null) m *= facteurClarte(opts.clarte);
  if (opts.guide) m *= FACTEUR_GUIDAGE;
  return m;
}

// --- Préréglages nommés : fourchette à montrer au jury, jamais un chiffre unique ---

export interface PreregageDepart {
  /** Facteur de contexte appliqué à la médiane. */
  contexte: number;
  /** Forme de la loi (queue), >= FORME_MIN. */
  forme: number;
  /** Part des personnes qui ne partent pas, entre 0 et 1. */
  p_reste: number;
}

/** Plancher : cas de référence de la source. Médiane 40,5 s [lu]. */
export const PRESET_PLANCHER: PreregageDepart = { contexte: 1, forme: 5.8, p_reste: 0 };
/** Central : sans menace visible x1,5, forme 4,0. Médiane ~61 s [calcul]. Forme 4,0 et contexte : hypothèses encadrées par le tableau 6 (forme 2,3 à 5,8). */
export const PRESET_CENTRAL: PreregageDepart = { contexte: CONTEXTE_SANS_MENACE_CENTRAL, forme: 4.0, p_reste: 0 };
/** Lent : x2,5, forme 2,5, 15 % ne partent pas. Médiane ~101 s [calcul]. Hypothèse, aucune source pour les 15 %. */
export const PRESET_LENT: PreregageDepart = { contexte: CONTEXTE_SANS_MENACE_MAX, forme: FORME_MIN, p_reste: 0.15 };

export const PRESETS_DEPART = { plancher: PRESET_PLANCHER, central: PRESET_CENTRAL, lent: PRESET_LENT } as const;

/** Médiane d'un préréglage : la médiane ne dépend pas de la forme (log-logistique), seulement du contexte. */
export function medianePreset(p: PreregageDepart): number {
  return MEDIANE_PLANCHER_S * p.contexte;
}

// --- Part qui ne part pas ---

/** Part par défaut de ceux qui ne partent pas : 0. Balayage proposé : 0, 0,05, 0,15 — hypothèse sans source (aucun pourcentage publié pour ce cas). */
export const P_RESTE_DEFAUT = 0;

/** Fonction pure : cette personne ne part-elle pas ? u est un tirage uniforme dans [0, 1). */
export function nePartPas(u: number, p_reste = P_RESTE_DEFAUT): boolean {
  return u < p_reste;
}

/** Délai d'une personne selon un préréglage ; Infinity si elle ne part pas. Tire d'abord « reste ? », puis le délai. */
export function tirerDelaiPreset(rng: Rng, preset: PreregageDepart = PRESET_PLANCHER): number {
  if (nePartPas(rng.next(), preset.p_reste)) return Infinity;
  return tirerDelaiLogLogistique(rng, medianePreset(preset), preset.forme);
}
