// Influence d'une réaction choisie par une personne-modèle sur ses voisins : fonction pure, prête à être branchée dans le
// comportement. Un voisin dans le rayon adopte la réaction avec une probabilité qui dépend de sa confiance ; l'effet reçu
// est borné par les constantes publiées (sortie.ts, depart.ts).
import { POIDS } from '../sortie.ts';
import { CONTEXTE_SANS_MENACE_MAX } from '../depart.ts';
import type { Rng } from '../rng.ts';
import { reaction } from './catalogue.ts';

export interface Personne {
  id: string;
  x: number;
  y: number;
  /** Confiance accordée à la personne qui réagit, de 0 à 1. */
  confiance: number;
}

export interface Source {
  id: string;
  x: number;
  y: number;
  reaction: string;
  issue: string | null;
  /** De 0 à 1, telle que répondue par le modèle. */
  intensite: number;
}

export interface EffetVoisin {
  id: string;
  mult_delai: number;
  mult_vitesse: number;
  /** Bonus d'utilité vers `issue`, au plus POIDS.personnel. */
  bonus_issue: number;
  issue: string | null;
}

/** Observance maximale : environ 90 % des gens suivent l'agent qui indique une sortie (Fire Technology 2025, maths-3 §4.4). */
export const PLAFOND_ADOPTION = 0.9;
/** Bornes du délai reçu : plage du guidage 0,68 à 1,0 (depart.ts) en bas, borne haute du contexte sans menace en haut. */
export const BORNES_DELAI = [0.68, CONTEXTE_SANS_MENACE_MAX] as const;
/** Bornes de la vitesse reçue : hypothèse (marche très ralentie à course modérée). */
export const BORNES_VITESSE = [0.5, 1.3] as const;
/** Bonus d'utilité maximal reçu : le poids d'un agent qui indique une sortie, 2,739 (sortie.ts). */
export const BONUS_MAX = POIDS.personnel;

const borne = (v: number, [min, max]: readonly [number, number]): number => Math.min(max, Math.max(min, v));
/** Applique l'intensité (0 = aucun effet, 1 = effet plein) à un multiplicateur. */
const doser = (m: number, intensite: number): number => 1 + (m - 1) * intensite;

/** Renvoie l'effet reçu par chacun des voisins qui adoptent la réaction ; les autres n'apparaissent pas. */
export function appliquerInfluence(source: Source, voisins: readonly Personne[], rng: Rng): EffetVoisin[] {
  const c = reaction(source.reaction).effet.contagion;
  if (!c) return [];
  const intensite = Math.min(1, Math.max(0, source.intensite));
  const sortie: EffetVoisin[] = [];
  for (const v of voisins) {
    if (v.id === source.id) continue;
    if (Math.hypot(v.x - source.x, v.y - source.y) > c.rayon_m) continue;
    const p = Math.min(PLAFOND_ADOPTION, c.proba * Math.min(1, Math.max(0, v.confiance)) * intensite);
    // Un tirage par voisin dans le rayon, même si p vaut 0 : le hasard consommé ne dépend pas des valeurs.
    if (rng.next() >= p) continue;
    sortie.push({
      id: v.id,
      mult_delai: borne(doser(c.mult_delai ?? 1, intensite), BORNES_DELAI),
      mult_vitesse: borne(doser(c.mult_vitesse ?? 1, intensite), BORNES_VITESSE),
      bonus_issue: source.issue ? Math.min(BONUS_MAX, (c.bonus_issue ?? 0) * intensite) : 0,
      issue: source.issue,
    });
  }
  return sortie;
}
