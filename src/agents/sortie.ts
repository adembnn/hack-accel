// Chemin de sortie réel : explication + ordre de service par zone, avec les garde-fous branchés ensemble :
// plafond d'appels au modèle (RedacteurPlafonne), texte libre des REX tronqué et balisé comme donnée non fiable (donnees_libres),
// vérification des chiffres par jetons, cohérence avec le plan, repli sur gabarit. Aucun réseau par défaut (le Redacteur est injecté).
import type { Journal } from './types.ts';
import type { RexCrise } from './rex.ts';
import { LIMITES, RedacteurPlafonne, tronquer } from './limites.ts';
import { demandeExplication, demandeOrdre, redigerVerifie, type Redacteur, type TexteRedige } from './redacteur.ts';
import type { RapportVerification } from './verificateur.ts';

export interface OptionsSortie {
  redacteur: Redacteur;
  rex?: RexCrise[];             // retours d'expérience : leurs textes libres entrent dans le prompt comme données non fiables
  zones?: string[];             // défaut : toutes les zones du dernier état
  plafond?: number;             // appels au modèle par (texte, minute) ; défaut LIMITES.appels_modele_par_minute
}
export interface Sortie {
  explication: { texte: TexteRedige; rapport: RapportVerification; repli: boolean };
  ordres: Record<string, { texte: TexteRedige; rapport: RapportVerification; repli: boolean }>;
}

// Textes libres des REX transmis au rédacteur : tronqués à 500 caractères, jamais plus de 20 par REX.
export const donneesLibresRex = (rex: RexCrise[]): string[] =>
  rex.slice(0, LIMITES.rex_par_enseigne * 5).flatMap((r) => [r.description, ...r.mesures.slice(0, LIMITES.mesures_max)]).map((t) => tronquer(t));

export async function produireTextes(journal: Journal, o: OptionsSortie): Promise<Sortie> {
  const redacteur = new RedacteurPlafonne(o.redacteur, o.plafond ?? LIMITES.appels_modele_par_minute);
  const libres = donneesLibresRex(o.rex ?? []);
  const avecLibres = <T extends { donnees_libres?: string[] }>(d: T): T => (libres.length ? { ...d, donnees_libres: libres } : d);
  const explication = await redigerVerifie(redacteur, avecLibres(demandeExplication(journal)), journal);
  const zones = o.zones ?? Object.keys(journal.entrees[journal.entrees.length - 1].etat.par_zone);
  const ordres: Sortie['ordres'] = {};
  for (const z of zones) ordres[z] = await redigerVerifie(redacteur, avecLibres(demandeOrdre(journal, z)), journal);
  return { explication, ordres };
}
