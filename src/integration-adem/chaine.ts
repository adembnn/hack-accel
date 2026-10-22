// Chaîne de bout en bout avec le moteur d'Adem (sim.js), sans réseau ni clé :
//   navgrid.json + scene.json -> sim.js (Node) -> SimulateurAdem -> boucle des décideurs (rules) -> plan + explication vérifiée + ordres.
// « Avant » = la même boucle, mêmes perturbations, mais aucun décideur n'agit (plan initial). « Après » = les décideurs jouent.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancerBoucle } from '../agents/boucle.ts';
import type { EvenementContrainte } from '../agents/evenements.ts';
import { creerClientsDecision } from '../agents/jev-gateway.ts';
import { AnalysteDeterministe, type Lecon, type RexCrise } from '../agents/rex.ts';
import { demandeExplication, demandeOrdre, RedacteurGabarit, RedacteurRejeu, redigerVerifie } from '../agents/redacteur.ts';
import { StockageMemoire } from '../agents/stockage.ts';
import type { ClientDecision } from '../agents/questions.ts';
import type { Action, DecideurJeu, EntreeJournal, Journal, Scenario } from '../agents/types.ts';
import { DECIDEURS } from '../agents/types.ts';
import { MoteurAdem } from './moteur.ts';
import { populationReelle, SimulateurAdem, ZONES_ADEM } from './simulateur.ts';

export const AVERTISSEMENT = 'modèle simplifié, non certifié ; moteur sim.js d\'Adem (forces sociales, choix de sortie logit), paramètres de démonstration';

/** Perturbations par défaut de la démo (geste du juré, ticket #13) : porte bloquée, ascenseurs en panne, escalators arrêtés, troubles, stations fermées. */
export const CONTRAINTES_DEMO: EvenementContrainte[] = [
  { type: 'contrainte', code: 'B1', minute: 1162, cible: 'lescot' },
  { type: 'contrainte', code: 'B5', minute: 1162, cible: 'tous' },
  { type: 'contrainte', code: 'B3', minute: 1163, cible: 'tous' },
  { type: 'contrainte', code: 'D2', minute: 1164, cible: 'rue_berger' },
  { type: 'contrainte', code: 'C1', minute: 1165, cible: 'chatelet' },
];

export interface OptionsChaine {
  graine?: number;
  personnes?: number;
  horizon_min?: number;
  contraintes?: EvenementContrainte[];
  rejeu_textes?: string;
  rex?: string;
  moteur?: MoteurAdem;
  journalisation?: (msg: string) => void;
}

export function chargerRex(chemin: string): RexCrise[] {
  const brut = JSON.parse(readFileSync(chemin, 'utf8')) as Record<string, unknown>[] | Record<string, Record<string, unknown>>;
  const liste = (Array.isArray(brut) ? brut : Object.values(brut)) as Record<string, unknown>[];
  return liste.map((x, k) => ({
    id: `rex${k + 1}`, enseigne: String(x.enseigne_ou_zone ?? '?'), zone: '*', type_incident: String(x.type_incident ?? '?').slice(0, 60),
    date: String(x.date ?? ''), duree_min: typeof x.duree_min === 'number' ? x.duree_min : 0,
    description: String(x.resume ?? '').slice(0, 300), mesures: x.decisions ? [String(x.decisions).slice(0, 120)] : [],
  }));
}

const clientsInactifs = (): Record<DecideurJeu, ClientDecision> =>
  Object.fromEntries(DECIDEURS.map((d) => [d, { decider: async () => ({ actions: [] }) }])) as unknown as Record<DecideurJeu, ClientDecision>;

function resume(j: Journal, sim: SimulateurAdem, n: number) {
  const e = j.entrees;
  const dernier = e.at(-1)!;
  return {
    minutes_jouees: e.length,
    t90_s: sim.t90_s === null ? null : Math.round(sim.t90_s),
    sortis_fin: dernier.etat.sortis,
    non_sortis_fin: dernier.etat.dans_le_centre,
    taux_sortis_fin: Math.round((dernier.etat.sortis / n) * 1000) / 1000,
    sortis_vers_zone_danger: dernier.etat.sortis_vers_zone_danger,
    ecrasement_personnes_minutes: dernier.note.ecrasement_personnes_minutes,
    densite_max: Math.max(...e.map((x) => x.etat.densite_max)),
    minutes_au_dessus_de_5: e.filter((x) => x.note.ligne_rouge).length,
    portes_fermees_fin: dernier.synthese.portes_fermees,
    agents_places_fin: dernier.synthese.agents_places,
    mode_fin: dernier.plan.mode,
  };
}

async function jouer(sim: SimulateurAdem, scenario: Scenario, clients: Record<DecideurJeu, ClientDecision>, contraintes: EvenementContrainte[], horizon: number, lecons: Lecon[]) {
  const t0 = performance.now();
  const journal = await lancerBoucle({
    simulateur: sim, scenario, clients, stockage: new StockageMemoire(), lecons, contraintes, minutes: horizon,
    surMinute: (e: EntreeJournal) => sim.observerHorsPlan(e.hors_plan),
  });
  return { journal, ms: performance.now() - t0 };
}

export async function lancerChaine(o: OptionsChaine = {}) {
  const log = o.journalisation ?? (() => {});
  const graine = o.graine ?? 7;
  const n = o.personnes ?? 800;
  const horizon = o.horizon_min ?? 10;
  const contraintes = o.contraintes ?? CONTRAINTES_DEMO;
  const t0 = performance.now();

  log('1/5 chargement de sim.js, navgrid.json et scene.json (sim.js non modifié)...');
  const moteur = o.moteur ?? await MoteurAdem.creer();
  log(`    moteur prêt en ${Math.round(moteur.ms_chargement)} ms (${moteur.champs_calcules} champs de pentes calculés, ${Math.round(moteur.ms_champs)} ms)`);
  const population = populationReelle(moteur, n, graine);
  const pop = moteur.tirerPopulation(n, graine);
  const scenario: Scenario = { graine, minute_annonce: 1160, stations_fermees_minute: 1320, couvre_feu_debut_minute: 1380, effectif_securite: 20, population };

  const rex = chargerRex(o.rex ?? fileURLToPath(new URL('../integration/donnees/rex-seed.json', import.meta.url)));
  const lecons = await new AnalysteDeterministe().analyser(rex);

  log(`2/5 run « avant » : ${n} personnes, ${horizon} min simulées, aucun décideur n'agit, ${contraintes.length} perturbations...`);
  const simAvant = new SimulateurAdem({ moteur, contraintes, population: pop });
  const avant = await jouer(simAvant, scenario, clientsInactifs(), contraintes, horizon, lecons);
  log(`    ${Math.round(avant.ms)} ms de calcul`);

  log('3/5 run « après » : boucle des décideurs (DECIDER_BACKEND=rules)...');
  const simApres = new SimulateurAdem({ moteur, contraintes, population: pop });
  const clients = creerClientsDecision({ env: { DECIDER_BACKEND: 'rules' }, effectif_securite: scenario.effectif_securite });
  const apres = await jouer(simApres, scenario, clients, contraintes, horizon, lecons);
  log(`    ${Math.round(apres.ms)} ms de calcul`);

  const dernier = apres.journal.entrees.at(-1)!;
  const vus = new Map<string, { minute: number; decideur: string; levier: string; valeur: unknown; repetitions: number }>();
  const decisions_citees: { minute: number; decideur: string; leviers: string[]; lecons_citees: string[] }[] = [];
  for (const e of apres.journal.entrees) for (const d of e.decisions) {
    for (const a of d.actions_acceptees) {
      const cle = JSON.stringify([d.decideur, a.levier, a.valeur]); const v = vus.get(cle);
      if (v) v.repetitions++; else vus.set(cle, { minute: e.minute, decideur: d.decideur, levier: a.levier, valeur: a.valeur, repetitions: 1 });
    }
    if (d.actions_acceptees.length) decisions_citees.push({ minute: e.minute, decideur: d.decideur, leviers: d.actions_acceptees.map((a: Action) => a.levier), lecons_citees: d.lecons_utilisees ?? [] });
  }

  log('4/5 explication et ordres de service (rédacteur en rejeu, chiffres vérifiés)...');
  const cheminRejeu = o.rejeu_textes ?? 'bench/integration-adem/rejeu-textes.json';
  mkdirSync(dirname(cheminRejeu), { recursive: true });
  const rejeu = new RedacteurRejeu(cheminRejeu);
  const gabarit = new RedacteurGabarit();
  const demandes = [demandeExplication(apres.journal), ...Object.keys(dernier.etat.par_zone).map((z) => demandeOrdre(apres.journal, z))];
  for (const d of demandes) { try { await rejeu.rediger(d); } catch { rejeu.enregistrer(d, await gabarit.rediger(d)); } }
  const rejouees = new RedacteurRejeu(cheminRejeu);
  const textes = [];
  for (const d of demandes) {
    const r = await redigerVerifie(rejouees, d, apres.journal, { repli: false });
    textes.push({ type: d.type, zone: d.zone ?? null, porteur: d.porteur ?? null, origine: r.texte.origine, texte: r.texte.texte, chiffres_verifies: r.rapport.ok, chiffres_non_retrouves: r.rapport.non_retrouves.length });
  }

  const A = resume(avant.journal, simAvant, n), P = resume(apres.journal, simApres, n);
  const ecarts = new Set<string>([...simAvant.ecarts, ...simApres.ecarts]);
  const mesures = (s: SimulateurAdem, ms: number) => ({
    duree_simulation_s: Math.round(ms / 100) / 10,
    ms_calcul_total: Math.round(ms),
    ms_dans_le_moteur: Math.round(s.ms_total),
    pas_moteur: s.pas_total,
    ms_par_pas_moyen: Math.round((s.ms_total / Math.max(1, s.pas_total)) * 100) / 100,
    ms_par_pas_par_minute: s.minutes.map((m) => m.ms_par_pas),
    ms_par_minute_simulee: s.minutes.map((m) => m.ms),
  });
  const minutes = (j: Journal) => j.entrees.map((e) => ({ minute: e.minute, restantes: e.etat.dans_le_centre, sortis: e.etat.sortis, densite_max: e.etat.densite_max, zone_danger: e.etat.sortis_vers_zone_danger }));
  log('5/5 résultats prêts');
  return {
    version: 1,
    source: 'simulation' as const,
    avertissement: AVERTISSEMENT,
    config: {
      graine, backend_decision: 'rules', redacteur: 'rejeu (cache rempli par gabarit)', reseau: false, cle: false,
      moteur: 'reports/maquettes/chatelet-3d/sim.js (non modifié, exécuté dans Node)',
      personnes: n, horizon_min: horizon, pas_s: 0.1, population_par_zone: population, zones_decideurs: ZONES_ADEM,
      perturbations: contraintes, lecons_rex: lecons.length,
      grille: { cellule_m: 1, niveaux: 6, ms_chargement_moteur: Math.round(moteur.ms_chargement), champs_calcules: moteur.champs_calcules, champs_reutilises: moteur.champs_reutilises },
    },
    avant: A,
    apres: P,
    comparaison: {
      delta_t90_s: A.t90_s !== null && P.t90_s !== null ? P.t90_s - A.t90_s : null,
      delta_sortis_fin: P.sortis_fin - A.sortis_fin,
      delta_non_sortis_fin: P.non_sortis_fin - A.non_sortis_fin,
      delta_zone_danger: P.sortis_vers_zone_danger - A.sortis_vers_zone_danger,
      delta_ecrasement_personnes_minutes: P.ecrasement_personnes_minutes - A.ecrasement_personnes_minutes,
      delta_densite_max: Math.round((P.densite_max - A.densite_max) * 100) / 100,
    },
    plan_choisi: dernier.plan,
    leviers_choisis: [...vus.values()],
    decisions_citees,
    perturbations_vues: dernier.hors_plan.perturbations ?? null,
    minutes_apres: minutes(apres.journal),
    minutes_avant: minutes(avant.journal),
    explication: textes.find((t) => t.type === 'explication'),
    ordres_de_service: textes.filter((t) => t.type === 'ordre_de_service'),
    ecarts_constates: [...ecarts],
    temps_reel: {
      avant: mesures(simAvant, avant.ms), apres: mesures(simApres, apres.ms),
      total_ms: Math.round(performance.now() - t0),
      simulation_sous_10_s: apres.ms < 10_000,
      note: 'ms_par_pas = temps de simStep + échantillonnage de densité, mesuré sous Node 24 (V8), pas dans un navigateur',
    },
  };
}

export type ResultatChaine = Awaited<ReturnType<typeof lancerChaine>>;
