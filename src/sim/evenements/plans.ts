// Comparaison de trois plans rejoués en accéléré, porté de reports/maquettes/chatelet-3d/plans.js.
// Le simulateur est INJECTÉ (interface SimulateurRejouable) : le vrai vient des lots foule. Chaque plan est joué sur une
// COPIE de l'état de départ avec la même graine : à graine égale, le rejeu est identique (octet pour octet).
// Délais (dispositif.json de la maquette) : sonorisation 30 s, guide-files 120 s (estimé), fermeture de porte 120 s.
// Verdict dans l'ordre décidé par Adem (#15) : non-sortis, puis passés en zone de danger, puis écrasement ; écarts sous le bruit comptés égaux.
import type { PlanDecideur } from './types.ts';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS5097 : Node exige l extension .ts ; le tsconfig du socle n autorise pas encore allowImportingTsExtensions
import { mulberry32 } from './types.ts';

export const DELAI_S = { annonce: 30, agent: 120, fermer: 120 } as const;
export const DUREE_S = 600;
export const PAS_S = 0.1;

export type ActionPlan =
  | { t: number; type: 'fermer'; cible: string; txt: string }
  | { t: number; type: 'agent'; cible: string; txt: string }
  | { t: number; type: 'annonce'; cibles: string[]; seul: boolean; txt: string }
  | { t: number; type: 'ratp'; txt: string };

export interface PlanRejouable { id: string; titre: string; actions: ActionPlan[]; ignore?: string[] }

export interface Mesure { nonSortis: number; zone: number; expo: number; sortis: number }

/** Contrat du simulateur à brancher. `avancer` doit n'utiliser que le générateur `rng` fourni pour l'aléa. */
export interface SimulateurRejouable<E> {
  cloner(etat: E): E;
  appliquer(etat: E, action: ActionPlan): E;
  avancer(etat: E, dt_s: number, rng: () => number): E;
  mesurer(etat: E): Mesure;
}

export interface LignePlan {
  id: string; titre: string; actions: string[]; ignore: string[];
  n5: number; n10: number; zone: number; expo5: number; expo10: number;
}
export interface ResultatComparaison { lignes: LignePlan[]; recommande: LignePlan; raison: string; graine: number; population: number; resume: string }

/** Rejoue un plan sur une copie de l'état de départ. Pure vis-à-vis de `depart` (jamais modifié). */
export function rejouerPlan<E>(sim: SimulateurRejouable<E>, depart: E, plan: PlanRejouable, graine: number, duree_s = DUREE_S, pas_s = PAS_S): { m5: Mesure; m10: Mesure } {
  const rng = mulberry32(graine);
  let etat = sim.cloner(depart);
  const evts = plan.actions.slice().sort((a, b) => a.t - b.t);
  const n = Math.round(duree_s / pas_s);
  const i5 = Math.round(Math.min(300, duree_s) / pas_s);
  let m5: Mesure | null = null;
  for (let k = 0; k < n; k++) {
    while (evts.length && evts[0]!.t <= k * pas_s + 1e-6) etat = sim.appliquer(etat, evts.shift()!);
    etat = sim.avancer(etat, pas_s, rng);
    if (k + 1 === i5) m5 = sim.mesurer(etat);
  }
  const m10 = sim.mesurer(etat);
  return { m5: m5 ?? m10, m10 };
}

/** Verdict : critères dans l'ordre, un écart sous le seuil de bruit compte pour égal ; à égalité, le plan qui change le moins de choses. */
export function verdict(lignes: LignePlan[], population: number): { best: LignePlan; raison: string; tol: { nonSortis: number; zone: number; expo: number } } {
  const tol = { nonSortis: Math.max(10, 0.01 * population), zone: Math.max(10, 0.01 * population), expo: 0.05 * Math.max(1, ...lignes.map((l) => l.expo10)) };
  const crit: ['nonSortis' | 'zone' | 'expo', string, 'n10' | 'zone' | 'expo10'][] = [
    ['nonSortis', 'non sortis à 10 min', 'n10'], ['zone', 'passés en zone', 'zone'], ['expo', 'personnes-secondes > 5/m²', 'expo10'],
  ];
  let reste = lignes.slice(), decide: string | null = null;
  for (const [c, nom, f] of crit) {
    const min = Math.min(...reste.map((l) => l[f]));
    const garde = reste.filter((l) => l[f] - min <= tol[c]);
    if (garde.length < reste.length && !decide) decide = nom;
    reste = garde;
  }
  const best = reste.slice().sort((a, b) => a.actions.length - b.actions.length || a.n10 - b.n10)[0]!;
  const A = lignes[0]!;
  let raison: string;
  if (best === A && !decide) raison = 'Aucun écart au-delà du bruit de la simulation : on garde la consigne actuelle.';
  else if (best === A) raison = `La consigne actuelle reste devant sur : ${decide}.`;
  else raison = `Devant sur : ${decide}. Les autres écarts sont sous le seuil de bruit ; à égalité on prend le plan qui change le moins de choses.`;
  return { best, raison, tol };
}

export function comparerPlans<E>(sim: SimulateurRejouable<E>, depart: E, plans: PlanRejouable[], graine: number, population: number, duree_s = DUREE_S): ResultatComparaison {
  if (plans.length === 0) throw new Error('au moins un plan à comparer');
  const lignes: LignePlan[] = plans.map((p) => {
    const { m5, m10 } = rejouerPlan(sim, depart, p, graine, duree_s);
    return { id: p.id, titre: p.titre, actions: p.actions.map((a) => `${a.txt} (à +${a.t} s)`), ignore: p.ignore ?? [], n5: m5.nonSortis, n10: m10.nonSortis, zone: m10.zone, expo5: Math.round(m5.expo), expo10: Math.round(m10.expo) };
  });
  const v = verdict(lignes, population);
  const resume = `Plan recommandé : ${v.best.id}, ${v.best.titre}. ${v.raison} ` + lignes.map((l) => `${l.id} : ${l.n5} non sortis à 5 min, ${l.n10} à 10 min, ${l.zone} passés en zone, ${l.expo10} personnes-secondes au-dessus de 5 par mètre carré`).join(' ; ') + '. À valider par le chef de poste.';
  return { lignes, recommande: v.best, raison: v.raison, graine, population, resume };
}

// ---------- définition des plans ----------
export interface AnalyseDepart { parCouverture: string[]; parDemande: string[]; zone: string[]; autres: string[] }

/** Plans par défaut : A consigne actuelle ; B sonorisation + guide-files ; C éviter les zones. Ordre des listes = ordre de priorité. */
export function plansParDefaut(an: AnalyseDepart): PlanRejouable[] {
  const P: PlanRejouable[] = [{ id: 'A', titre: 'Consigne actuelle', actions: [] }];
  const B: ActionPlan[] = [];
  for (const k of an.parDemande.slice(0, 1)) B.push({ t: DELAI_S.annonce, type: 'annonce', cibles: [k], seul: true, txt: `Annonce : sortir par ${k}` });
  for (const k of an.parCouverture.slice(0, 2)) B.push({ t: DELAI_S.agent, type: 'agent', cible: k, txt: `Guide-files à ${k}` });
  P.push({ id: 'B', titre: 'Sonorisation + guide-files', actions: B });
  const C: ActionPlan[] = [];
  if (an.zone.length && an.autres.length) for (const k of an.zone) C.push({ t: DELAI_S.fermer, type: 'fermer', cible: k, txt: `Fermer ${k} (en zone)` });
  if (an.autres.length) C.push({ t: DELAI_S.annonce, type: 'annonce', cibles: an.autres, seul: false, txt: `Annonce : sortir par les portes hors zone (${an.autres.join(', ')})` });
  P.push({ id: 'C', titre: 'Éviter les zones', actions: C });
  return P;
}

/** Traduit un Plan du lot décideurs en actions rejouables. Les vagues de salles et le confinement ne sont pas rejoués ici (listés dans `ignore`). */
export function planDepuisDecideurs(id: string, titre: string, plan: PlanDecideur): PlanRejouable {
  const actions: ActionPlan[] = [];
  const ignore: string[] = [];
  for (const [porte, etat] of Object.entries(plan.portes).sort(([a], [b]) => a.localeCompare(b))) {
    if (etat === 'fermee') actions.push({ t: DELAI_S.fermer, type: 'fermer', cible: porte, txt: `Fermer ${porte}` });
  }
  for (const g of plan.guidage) if (g.agents > 0) actions.push({ t: DELAI_S.agent, type: 'agent', cible: g.point, txt: `Guide-files à ${g.point}` });
  const zones = Object.keys(plan.messages_par_zone);
  if (zones.length) {
    const ouvertes = Object.entries(plan.portes).filter(([, e]) => e === 'ouverte').map(([p]) => p).sort();
    if (ouvertes.length) actions.push({ t: DELAI_S.annonce, type: 'annonce', cibles: ouvertes, seul: false, txt: `Annonce : sortir par ${ouvertes.join(', ')}` });
  }
  if (plan.phasage_salles.length) ignore.push('vagues de salles non rejouées ici');
  if (plan.confinement.actif) ignore.push('confinement non rejoué ici');
  return { id, titre, actions, ignore };
}
