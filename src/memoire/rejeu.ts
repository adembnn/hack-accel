// (3) REJEU CONTREFACTUEL : le même scénario calibré est joué avec le plan réellement appliqué puis avec le plan choisi par la boucle
// des décideurs (backend rules), sur les mêmes graines. On rapporte l'écart simulé avec son intervalle, jamais « N vies sauvées ».
// Une leçon n'est promue « validee_par_simulation » que si l'écart dépasse l'intervalle ET que le run est enregistré.
// Modèle simplifié, non certifié.
import { createHash } from 'node:crypto';
import { enregistrerLecon, promouvoir } from '../agents/rex.ts';
import type { Action } from '../agents/types.ts';
import { AVERTISSEMENT, type JournalRun, type Plan } from '../sim/behavior/types.ts';
import { jouer, type ParamsModele } from './calibration.ts';
import { planChoisiParDecideurs, type LeconMemoire } from './decideurs.ts';
import type { ScenarioRex } from './rex-scenario.ts';
import { ecartApparie, resume, type Ecart, type Resume } from './stats.ts';

export const GRAINES_REJEU = Array.from({ length: 20 }, (_, k) => 301 + k);

/** Critères de la grille, dans l'ordre fixé (non sortis, zone de danger, écrasement, puis délai). Plus petit = mieux. */
export const CRITERES = ['non_sortis_22h', 'non_sortis_23h', 'zone_danger', 'ecrasement', 't90_s'] as const;
export type Critere = (typeof CRITERES)[number];
const LIRE: Record<Critere, (r: JournalRun) => number> = {
  non_sortis_22h: (r) => r.grille.non_sortis_22h.valeur,
  non_sortis_23h: (r) => r.grille.non_sortis_23h.valeur,
  zone_danger: (r) => r.grille.zone_danger.valeur,
  ecrasement: (r) => r.grille.ecrasement.valeur,
  t90_s: (r) => r.grille.delai_t90_s ?? r.duree_s,
};
export const mesures = (runs: JournalRun[]): Record<Critere, number[]> => Object.fromEntries(CRITERES.map((c) => [c, runs.map(LIRE[c])])) as Record<Critere, number[]>;

export interface RunEnregistre {
  run_id: string;
  rex_id: string;
  graines: number[];
  params: ParamsModele;
  plan_reel: Plan;
  plan_decideurs: Plan;
  reel: Record<Critere, Resume>;
  decideurs: Record<Critere, Resume>;
  source: 'simulation';
  avertissement: string;
}

/** Registre des runs. Un run non enregistré ne peut pas valider une leçon. Le lot aiven branchera la table `runs` derrière. */
export interface RegistreRuns { enregistrer(r: RunEnregistre): string; existe(run_id: string): boolean }
export class RegistreRunsMemoire implements RegistreRuns {
  runs = new Map<string, RunEnregistre>();
  enregistrer(r: RunEnregistre): string { this.runs.set(r.run_id, structuredClone(r)); return r.run_id; }
  existe(id: string): boolean { return this.runs.has(id); }
}

export const identifiantRun = (parts: unknown): string => 'run_' + createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16);

export interface RapportRejeu {
  rex_id: string;
  graines: number[];
  params: ParamsModele;
  plan_reel: Plan;
  plan_decideurs: Plan;
  actions_decideurs: Action[];
  /** Valeurs selon la simulation, par critère, pour chaque plan. */
  reel: Record<Critere, Resume>;
  decideurs: Record<Critere, Resume>;
  /** Écart apparié (décideurs - réel) par critère ; négatif = les décideurs font mieux. */
  ecarts: Record<Critere, Ecart>;
  /** Premier critère de la grille (dans l'ordre) où l'écart dépasse son intervalle, et son sens. */
  critere_decisif: Critere | null;
  meilleure: boolean;
  run_id: string | null;
  lecon: LeconMemoire | null;
  motif_lecon: string;
  source: 'simulation';
  avertissement: string;
}

const arrondi = (x: number, d = 1): number => Math.round(x * 10 ** d) / 10 ** d;

/** Actions des décideurs sans doublon exact, dans l'ordre. */
function dedoublonner(actions: Action[]): Action[] {
  const vues = new Set<string>();
  return actions.filter((a) => { const k = JSON.stringify([a.decideur, a.levier, a.valeur]); if (vues.has(k)) return false; vues.add(k); return true; });
}

export async function rejouerContrefactuel(sc: ScenarioRex, params: ParamsModele, registre: RegistreRuns, o: { graines?: number[]; graine_decision?: number; date?: string } = {}): Promise<RapportRejeu> {
  const graines = o.graines ?? GRAINES_REJEU;
  // Le plan des décideurs est choisi UNE fois, sur une graine de décision distincte des graines de mesure, puis joué sur toutes.
  const dec = await planChoisiParDecideurs(sc, params, o.graine_decision ?? 900, {});
  const runsReel = graines.map((g) => jouer(sc, sc.plan_reel, g, params));
  const runsDec = graines.map((g) => jouer(sc, dec.plan_sim, g, params));
  const mr = mesures(runsReel), md = mesures(runsDec);
  const ecarts = Object.fromEntries(CRITERES.map((c) => [c, ecartApparie(mr[c], md[c])])) as Record<Critere, Ecart>;
  const reel = Object.fromEntries(CRITERES.map((c) => [c, resume(mr[c])])) as Record<Critere, Resume>;
  const decideurs = Object.fromEntries(CRITERES.map((c) => [c, resume(md[c])])) as Record<Critere, Resume>;
  const decisif = CRITERES.find((c) => ecarts[c].significatif) ?? null;
  const meilleure = decisif !== null && ecarts[decisif].sens === 'mieux';
  const rapport: RapportRejeu = {
    rex_id: sc.rex_id, graines, params, plan_reel: sc.plan_reel, plan_decideurs: dec.plan_sim, actions_decideurs: dedoublonner(dec.actions),
    reel, decideurs, ecarts, critere_decisif: decisif, meilleure, run_id: null, lecon: null, motif_lecon: '',
    source: 'simulation', avertissement: AVERTISSEMENT,
  };
  // Enregistrement du run d'abord : sans run enregistré, pas de validation.
  const run_id = registre.enregistrer({ run_id: identifiantRun({ rex: sc.rex_id, graines, params, reel: sc.plan_reel, dec: dec.plan_sim }), rex_id: sc.rex_id, graines, params, plan_reel: sc.plan_reel, plan_decideurs: dec.plan_sim, reel, decideurs, source: 'simulation', avertissement: AVERTISSEMENT });
  rapport.run_id = registre.existe(run_id) ? run_id : null;
  rapport.lecon = fabriquerLecon(sc, rapport, o.date ?? new Date().toISOString().slice(0, 10));
  rapport.motif_lecon = rapport.lecon.statut === 'validee_par_simulation'
    ? `écart sur ${decisif} supérieur à son intervalle (${arrondi(ecarts[decisif!].moyenne)} ± ${arrondi(ecarts[decisif!].ic95)}) et run ${run_id} enregistré`
    : decisif === null ? 'aucun écart supérieur à son intervalle sur aucun critère : leçon non vérifiée'
      : !meilleure ? `le premier écart significatif (${decisif}) est en défaveur des décideurs : leçon non vérifiée` : 'run non enregistré : leçon non vérifiée';
  return rapport;
}

/** Leçon tirée du rejeu. Énoncé en français : chaque chiffre du client est « selon le client », chaque chiffre du rejeu « selon la simulation ». */
export function fabriquerLecon(sc: ScenarioRex, r: RapportRejeu, date: string): LeconMemoire {
  const e = r.ecarts;
  const chiffres: Record<string, number> = {
    graines: r.graines.length,
    ecart_zone_danger: arrondi(e.zone_danger.moyenne), ic95_zone_danger: arrondi(e.zone_danger.ic95),
    ecart_t90_s: arrondi(e.t90_s.moyenne, 0), ic95_t90_s: arrondi(e.t90_s.ic95, 0),
    ...(sc.duree_rapportee_s !== null ? { duree_rapportee_min: arrondi(sc.duree_rapportee_s / 60) } : {}),
  };
  const enonce = `Selon la simulation (modèle simplifié, non certifié), sur ${chiffres.graines} graines, le plan choisi par les décideurs change la zone de danger de ${chiffres.ecart_zone_danger} (intervalle ± ${chiffres.ic95_zone_danger}) et le délai t90 de ${chiffres.ecart_t90_s} s (± ${chiffres.ic95_t90_s}) par rapport au plan appliqué.`
    + (chiffres.duree_rapportee_min !== undefined ? ` Durée rapportée selon le client : ${chiffres.duree_rapportee_min} min.` : '');
  const brute = enregistrerLecon({
    id: `lecon:${sc.type_incident}:${sc.zone}:${sc.rex_id}`, type_incident: sc.type_incident, zone: sc.zone, frequence: 1,
    duree_moyenne_min: sc.duree_rapportee_s !== null ? arrondi(sc.duree_rapportee_s / 60) : 0, duree_max_min: sc.duree_rapportee_s !== null ? arrondi(sc.duree_rapportee_s / 60) : 0,
    sources: [sc.rex_id], enonce, chiffres,
    provenance: { auteur: 'rejeu_contrefactuel', date, ...(r.run_id ? { run_id: r.run_id } : {}) },
  });
  let lecon = brute;
  // Promotion : écart > intervalle (critère décisif en faveur des décideurs) ET run enregistré. Sinon la leçon reste non_verifiee.
  if (r.meilleure && r.run_id) lecon = promouvoir(brute, { simulation: { run_id: r.run_id, meilleure: true } });
  return { ...lecon, actions_recommandees: r.actions_decideurs };
}
