// Personnes à mobilité réduite (PMR) : profils, vitesses, accès aux issues, aide. Sources et chiffres : reports/maths-6-mobilite-reduite.md.
// Règle française (ERP, arrêté du 25 juin 1980, art. CO 57 à CO 60 et GN 8, modifiés par l'arrêté du 24 sept. 2009) : l'évacuation reste
// la règle pour qui peut sortir ; sinon « évacuation différée » : la personne attend en espace d'attente sécurisé (EAS) l'aide d'une
// personne présente (aide humaine disponible en permanence) ou des secours. Modèle simplifié, non certifié.
import type { AccesPmr, ProfilPmr } from './types.ts';
import type { Rng } from './rng.ts';

export type { AccesPmr, ProfilPmr };

/** Canaux aléatoires de ce module, au-dessus de ceux de rng.ts (0 à 6) pour ne décaler aucun flux existant. */
export const CANAL_PMR = 7;
export const CANAL_AIDE = 8;

export const PROFILS: readonly ProfilPmr[] = ['fauteuil', 'canne', 'autre'];

/**
 * Vitesse libre sur le plat (m/s), loi normale tronquée. Valeurs lues (voir le rapport) :
 * - fauteuil : 0,67 (± 0,12) sans aide sur un cheminement extérieur plat, 1,03 poussé (PLOS ONE 2025, Chine, Table 2) [lu] ;
 * - canne : 0,8 m/s, moyenne des personnes avec trouble de la locomotion à l'horizontale, contre 1,25 pour les valides (Boyce, Shields
 *   et Silcock 1999, cité par Shields et al. 2009 sur le 11 septembre) [lu] ; l'écart-type 0,15 est une HYPOTHÈSE ;
 * - autre (malvoyant, grande fatigue...) : 25 à 50 % plus lent que la moyenne des évacués (observations d'exercices, citées par Sci Rep
 *   2025) [lu, source de seconde main] : 0,75 ± 0,15 (HYPOTHÈSE sur le milieu de la fourchette).
 */
export const VITESSES_PMR: Record<ProfilPmr, { moyenne: number; ecart: number }> = {
  fauteuil: { moyenne: 0.67, ecart: 0.12 },
  canne: { moyenne: 0.8, ecart: 0.15 },
  autre: { moyenne: 0.75, ecart: 0.15 },
};
export const VITESSE_PMR_MIN = 0.3; // plancher du tirage (hypothèse : en dessous, la personne n'est plus autonome)
/** Fauteuil poussé par un aidant : 1,03 m/s (PLOS ONE 2025, Table 2) [lu]. */
export const VITESSE_FAUTEUIL_POUSSE = 1.03;

/**
 * Répartition des profils parmi les PMR. HYPOTHÈSE (aucune statistique de foule trouvée pour un soir de cinéma) ; à balayer.
 * Le 4 % de PMR lui-même vient d'une fourchette : « troubles de la marche chez près de 4 % des adultes » (États-Unis, [lu]) contre
 * 8,4 % des 16 à 64 ans déclarant un handicap ou une gêne en France (SDES, enquête mobilité 2019 [lu]) et 14 à 17 % en Angleterre.
 */
export const PARTS_PROFILS: Record<ProfilPmr, number> = { fauteuil: 0.25, canne: 0.45, autre: 0.3 };

/** Délai moyen d'une aide d'agent à une personne seule (s) : 6 min, moyenne de l'attente de personnes handicapées dans un exercice (Proulx 1995) [lu]. */
export const DELAI_AGENT_MOYEN_S = 360;
export const DELAI_AGENT_MIN_S = 30; // plancher (hypothèse) quand plusieurs agents se partagent les PMR
/** Délai moyen d'une aide spontanée d'un proche (s), une fois qu'il est prêt à partir. HYPOTHÈSE : Piliavin 1969 (métro) donne moins de 5 s pour un homme à canne, sans danger [?]. */
export const DELAI_VOISIN_MOYEN_S = 20;

export interface OptionsPmr {
  /** false = ancien comportement : tous les PMR à 0,6 m/s, aucun profil, aucune règle d'accès, aucun refuge. Défaut : true. */
  actif?: boolean;
  /** Part de PMR (défaut : `part_mobilite_reduite`, 4 %). */
  part?: number;
  /** Poids relatifs des profils (normalisés). */
  profils?: Partial<Record<ProfilPmr, number>>;
  /** Aide spontanée d'un proche du même groupe (défaut true). false = seuls les agents de guidage aident. */
  entraide?: boolean;
  /** Délais moyens d'aide (s) pour balayer les hypothèses. */
  delai_agent_moyen_s?: number;
  delai_voisin_moyen_s?: number;
}

export interface ParamsPmr {
  actif: boolean;
  part: number | undefined;
  profils: Record<ProfilPmr, number>;
  entraide: boolean;
  delai_agent_moyen_s: number;
  delai_voisin_moyen_s: number;
}

export function completerPmr(o: OptionsPmr = {}): ParamsPmr {
  return {
    actif: o.actif ?? true,
    part: o.part,
    profils: { ...PARTS_PROFILS, ...o.profils },
    entraide: o.entraide ?? true,
    delai_agent_moyen_s: o.delai_agent_moyen_s ?? DELAI_AGENT_MOYEN_S,
    delai_voisin_moyen_s: o.delai_voisin_moyen_s ?? DELAI_VOISIN_MOYEN_S,
  };
}

/** Profil par inversion d'une valeur u dans [0, 1). */
export function tirerProfil(u: number, profils: Record<ProfilPmr, number>): ProfilPmr {
  const total = PROFILS.reduce((s, p) => s + Math.max(0, profils[p]), 0) || 1;
  let cumul = 0;
  for (const p of PROFILS) {
    cumul += Math.max(0, profils[p]) / total;
    if (u < cumul) return p;
  }
  return PROFILS[PROFILS.length - 1];
}

export function tirerVitessePmr(rng: Rng, profil: ProfilPmr): number {
  const { moyenne, ecart } = VITESSES_PMR[profil];
  return Math.max(VITESSE_PMR_MIN, rng.normal(moyenne, ecart));
}

/** Vitesse une fois aidée : le fauteuil poussé va à 1,03 m/s si c'est plus vite ; les autres gardent leur vitesse (hypothèse prudente). */
export function vitesseAidee(profil: ProfilPmr, vitesse: number): number {
  return profil === 'fauteuil' ? Math.max(vitesse, VITESSE_FAUTEUIL_POUSSE) : vitesse;
}

/** Vitesse de l'aidant : celle de la personne aidée (il marche à son rythme). */
export const vitesseAidant = (_vitesseAidant: number, vitesseAidee: number): number => vitesseAidee;

/**
 * Une PMR peut-elle prendre cette issue ? 'interdit' (escalator, même arrêté : on ne le prend pas en évacuation) jamais ;
 * 'aide' (niveau différent : escalier) seulement aidée ; sinon oui. Hors PMR ou modèle inactif : toujours oui.
 */
export function peutEmprunter(acces: AccesPmr | undefined, aidee: boolean): boolean {
  if (acces === 'interdit') return false;
  if (acces === 'aide') return aidee;
  return true;
}

/** Délai d'attente d'un agent (s) : loi exponentielle, divisée par le nombre d'agents (ceux-ci aident en parallèle ; hypothèse, pas de file d'attente). */
export function delaiAgent(u: number, personnel: number, p: Pick<ParamsPmr, 'delai_agent_moyen_s'>): number {
  const moyenne = Math.max(DELAI_AGENT_MIN_S, p.delai_agent_moyen_s / Math.max(1, personnel));
  return -Math.log(1 - Math.min(u, 0.999999)) * moyenne;
}

/** Délai d'aide d'un proche (s) : loi exponentielle. */
export function delaiVoisin(u: number, p: Pick<ParamsPmr, 'delai_voisin_moyen_s'>): number {
  return -Math.log(1 - Math.min(u, 0.999999)) * p.delai_voisin_moyen_s;
}
