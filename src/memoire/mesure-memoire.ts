// (4) MESURE DE LA MÉMOIRE : décideurs qui reçoivent les leçons pertinentes d'un REX passé contre décideurs sans leçons,
// sur un scénario TEST différent du REX source, mêmes graines des deux côtés. On rapporte l'effet par critère avec son intervalle,
// y compris « aucun effet détectable ». Modèle simplifié, non certifié.
import { AVERTISSEMENT } from '../sim/behavior/types.ts';
import { jouer, type ParamsModele } from './calibration.ts';
import { planChoisiParDecideurs, type LeconMemoire } from './decideurs.ts';
import { CRITERES, mesures, type Critere } from './rejeu.ts';
import type { ScenarioRex } from './rex-scenario.ts';
import { ecartApparie, resume, type Ecart, type Resume } from './stats.ts';

export const GRAINES_MEMOIRE = Array.from({ length: 20 }, (_, k) => 501 + k);

export interface RapportMemoire {
  scenario_test: string;
  graines: number[];
  lecons_fournies: { id: string; statut: string }[];
  lecons_validees: string[];
  lecons_montrees_aux_decideurs: string[];
  sans_memoire: Record<Critere, Resume>;
  avec_memoire: Record<Critere, Resume>;
  /** avec - sans, apparié par graine ; négatif = la mémoire aide. */
  effets: Record<Critere, Ecart>;
  plans_differents: number;
  verdict: Record<Critere, 'aide' | 'degrade' | 'aucun_effet_detectable'>;
  source: 'simulation';
  avertissement: string;
}

export async function mesurerMemoire(test: ScenarioRex, params: ParamsModele, lecons: LeconMemoire[], o: { graines?: number[] } = {}): Promise<RapportMemoire> {
  const graines = o.graines ?? GRAINES_MEMOIRE;
  const sans = [], avec = [];
  const utilisees = new Set<string>();
  let differents = 0;
  for (const g of graines) {
    // Même graine de décision et de mesure des deux côtés : seule la présence des leçons change.
    const a = await planChoisiParDecideurs(test, params, g, { lecons: [] });
    const b = await planChoisiParDecideurs(test, params, g, { lecons, avecMemoire: true });
    for (const e of b.journal.entrees) for (const d of e.decisions) for (const id of d.lecons_utilisees ?? []) utilisees.add(id);
    if (JSON.stringify(a.plan) !== JSON.stringify(b.plan)) differents++;
    sans.push(jouer(test, a.plan_sim, g, params));
    avec.push(jouer(test, b.plan_sim, g, params));
  }
  const ms = mesures(sans), ma = mesures(avec);
  const effets = Object.fromEntries(CRITERES.map((c) => [c, ecartApparie(ms[c], ma[c])])) as Record<Critere, Ecart>;
  const verdict = Object.fromEntries(CRITERES.map((c) => [c, effets[c].sens === 'mieux' ? 'aide' : effets[c].sens === 'pire' ? 'degrade' : 'aucun_effet_detectable'])) as RapportMemoire['verdict'];
  return {
    scenario_test: test.rex_id, graines,
    lecons_fournies: lecons.map((l) => ({ id: l.id, statut: l.statut })),
    lecons_montrees_aux_decideurs: [...utilisees],
    lecons_validees: lecons.filter((l) => l.statut === 'validee_par_simulation').map((l) => l.id),
    sans_memoire: Object.fromEntries(CRITERES.map((c) => [c, resume(ms[c])])) as Record<Critere, Resume>,
    avec_memoire: Object.fromEntries(CRITERES.map((c) => [c, resume(ma[c])])) as Record<Critere, Resume>,
    effets, plans_differents: differents, verdict, source: 'simulation', avertissement: AVERTISSEMENT,
  };
}
