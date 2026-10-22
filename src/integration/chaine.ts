// Chaîne de bout en bout, en local, sans réseau ni clé :
//   navgrid.json (jumeau-3d) -> CrowdSim (foule-mouvement) -> simuler() (foule-decision) -> boucle des décideurs (decideurs, mode rules)
//   -> plan choisi + explication vérifiée + ordres de service (rédacteur en rejeu).
// Rien n'est modifié dans les dossiers des lots : tout le collage est ici (voir LISEZMOI.md pour les écarts).
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientsHeuristiques, lancerBoucle } from '../agents/boucle.ts';
import { creerClientsDecision } from '../agents/jev-gateway.ts';
import { AnalysteDeterministe, type RexCrise } from '../agents/rex.ts';
import { demandeExplication, demandeOrdre, RedacteurGabarit, RedacteurRejeu, redigerVerifie } from '../agents/redacteur.ts';
import { StockageMemoire } from '../agents/stockage.ts';
import { planInitial, type Action, type Journal, type Plan as PlanDecideurs, type Scenario } from '../agents/types.ts';
import type { Grille as GrilleSim } from '../sim/behavior/types.ts';
import { moteurPartage, SALLES } from './mouvement.ts';
import { SimulateurIntegre, type ResultatRun } from './simulateur.ts';

export const ZONES_DEMO = ['ugc', 'niveau_0', 'niveau_-1', 'niveau_-2', 'niveau_-3', 'niveau_-4'];

export interface OptionsChaine {
  graine?: number;
  /** Personnes par salle (6 salles). Démo : 100 (600 personnes) ; la scène d'Adem parle de ~3 000 (500 par salle), non rejoué ici (voir LISEZMOI). */
  personnes_par_salle?: number;
  /** Horizon de chaque simulation complète, en minutes simulées. */
  horizon_min?: number;
  /** Fichier de rejeu des textes (cache du rédacteur, sans réseau). */
  rejeu_textes?: string;
  /** Fichier REX (défaut : copie du corpus public dans src/integration/donnees). */
  rex?: string;
  journalisation?: (msg: string) => void;
}

function resume(r: ResultatRun) {
  const g: GrilleSim = r.journal.grille;
  return {
    duree_simulee_s: r.journal.duree_s,
    t90_s: g.delai_t90_s,
    t99_s: g.delai_t99_s,
    non_sortis_fin: r.journal.minutes.at(-1)?.personnes_restantes ?? null,
    non_sortis_22h: g.non_sortis_22h.valeur,
    non_sortis_23h: g.non_sortis_23h.valeur,
    zone_danger_valeur: g.zone_danger.valeur,
    zone_danger_note: g.zone_danger.note,
    ecrasement_personnes_minutes: g.ecrasement.valeur,
    pression_helbing_max: g.pression_helbing_max,
    continuite_note: g.continuite.note,
    note_totale: g.total,
    avertissement: g.avertissement,
    stats: r.journal.stats,
    plan_traduit: r.plan_sim,
    cpu_mouvement_ms: Math.round(r.cpu_mouvement_ms),
    duree_mur_ms: Math.round(r.duree_mur_ms),
  };
}

export function chargerRex(chemin: string): RexCrise[] {
  const brut = JSON.parse(readFileSync(chemin, 'utf8')) as Record<string, unknown>[] | Record<string, Record<string, unknown>>;
  const liste = (Array.isArray(brut) ? brut : Object.values(brut)) as Record<string, unknown>[];
  return liste.map((x, k) => ({
    id: `rex${k + 1}`,
    enseigne: String(x.enseigne_ou_zone ?? '?'),
    zone: '*', // le corpus public n'est pas rattaché aux zones de la démo : toutes les décisions peuvent le citer (écart)
    type_incident: String(x.type_incident ?? '?').slice(0, 60),
    date: String(x.date ?? ''),
    duree_min: typeof x.duree_min === 'number' ? x.duree_min : 0,
    description: String(x.resume ?? '').slice(0, 300),
    mesures: x.decisions ? [String(x.decisions).slice(0, 120)] : [],
  }));
}

export async function lancerChaine(o: OptionsChaine = {}) {
  const log = o.journalisation ?? (() => {});
  const graine = o.graine ?? 7;
  const par_salle = o.personnes_par_salle ?? 100;
  const horizon_min = o.horizon_min ?? 20;
  const t0 = performance.now();
  const ecarts: string[] = [];

  // (1) scène et grille du lot jumeau-3d
  log('1/6 chargement de scene.json et navgrid.json, construction du moteur de mouvement...');
  const moteur = moteurPartage();
  const carte = moteur.carte;
  log(`    moteur prêt en ${Math.round(moteur.ms_construction)} ms ; issues réelles : ${carte.issues.map((i) => i.id).join(', ')}`);
  if (carte.portes_sans_sortie.length) ecarts.push(`portes du lot decideurs sans sortie réelle rattachée : ${carte.portes_sans_sortie.join(', ')}`);

  const scenario: Scenario = {
    graine, minute_annonce: 1160, stations_fermees_minute: 1320, couvre_feu_debut_minute: 1380, effectif_securite: 20,
    population: Object.fromEntries(ZONES_DEMO.map((z) => [z, par_salle])),
  };
  const sim = new SimulateurIntegre({ moteur, horizon_min, personnes_par_salle: par_salle, surRun: (r, raison) => log(`    simulation complète (${raison}) : ${Math.round(r.duree_mur_ms / 1000)} s de calcul`) });
  sim.initialiser(scenario);

  // (2)+(3) « avant » : plan initial (rien ne change), mouvement réel branché sur simuler()
  log('2/6 run « avant » (plan initial, mouvement réel)...');
  const avant = sim.lancer([planInitial()], horizon_min);

  // (4) boucle des décideurs en mode rules (aucun appel Jev ni Claude), leçons du REX en mémoire
  log('3/6 boucle des décideurs (DECIDER_BACKEND=rules)...');
  const rex = chargerRex(o.rex ?? fileURLToPath(new URL('./donnees/rex-seed.json', import.meta.url)));
  const lecons = await new AnalysteDeterministe().analyser(rex);
  const clients = creerClientsDecision({ env: { DECIDER_BACKEND: 'rules' }, effectif_securite: scenario.effectif_securite });
  const stockage = new StockageMemoire();
  const journal: Journal = await lancerBoucle({ simulateur: sim, scenario, clients, stockage, lecons, minutes: horizon_min });
  const apres = sim.dernierRun();
  if (!apres) throw new Error('aucune simulation lancée par la boucle');
  log(`    ${journal.entrees.length} minutes jouées, ${sim.runs} simulations complètes`);

  // plan choisi et leviers
  const dernier = journal.entrees.at(-1)!;
  const plan: PlanDecideurs = dernier.plan;
  const leviers: { minute: number; decideur: string; levier: string; valeur: unknown }[] = [];
  const decisions_citees: { minute: number; decideur: string; leviers: string[]; lecons_citees: string[] }[] = [];
  for (const e of journal.entrees) for (const d of e.decisions) {
    for (const a of d.actions_acceptees) leviers.push({ minute: e.minute, decideur: d.decideur, levier: a.levier, valeur: a.valeur });
    if (d.actions_acceptees.length) decisions_citees.push({ minute: e.minute, decideur: d.decideur, leviers: d.actions_acceptees.map((a: Action) => a.levier), lecons_citees: d.lecons_utilisees ?? [] });
  }
  const vus = new Map<string, { minute: number; decideur: string; levier: string; valeur: unknown; repetitions: number }>();
  for (const l of leviers) { const k = JSON.stringify([l.decideur, l.levier, l.valeur]); const v = vus.get(k); if (v) v.repetitions++; else vus.set(k, { ...l, repetitions: 1 }); }
  const leviersUniques = [...vus.values()];
  const refus = journal.entrees.flatMap((e) => e.decisions.flatMap((d) => d.actions_refusees.map((r) => `${d.decideur}: ${r.raisons.join(' ; ')}`)));

  // (5) explication et ordres de service : rédacteur en rejeu (cache rempli par gabarit, aucun réseau), chiffres vérifiés
  log('4/6 explication et ordres de service (rejeu, chiffres vérifiés)...');
  const cheminRejeu = o.rejeu_textes ?? 'bench/integration/rejeu-textes.json';
  mkdirSync(dirname(cheminRejeu), { recursive: true });
  const rejeu = new RedacteurRejeu(cheminRejeu);
  const gabarit = new RedacteurGabarit();
  const demandes = [demandeExplication(journal), ...Object.keys(dernier.etat.par_zone).map((z) => demandeOrdre(journal, z))];
  for (const d of demandes) {
    try { await rejeu.rediger(d); } catch { rejeu.enregistrer(d, await gabarit.rediger(d)); }
  }
  const rejouees = new RedacteurRejeu(cheminRejeu);
  const textes = [];
  for (const d of demandes) {
    const r = await redigerVerifie(rejouees, d, journal, { repli: false });
    textes.push({ type: d.type, zone: d.zone ?? null, porteur: d.porteur ?? null, origine: r.texte.origine, texte: r.texte.texte, chiffres_verifies: r.rapport.ok, chiffres_non_retrouves: r.rapport.non_retrouves.length });
  }

  for (const e of sim.ecarts) ecarts.push(e);
  const A = resume(avant), P = resume(apres);
  log('5/6 résultats prêts');
  return {
    version: 1,
    avertissement: 'modèle simplifié, non certifié ; population réduite et paramètres de démonstration (voir src/integration/LISEZMOI.md)',
    config: {
      graine, backend_decision: 'rules', redacteur: 'rejeu (cache rempli par gabarit)', reseau: false, cle: false,
      salles: SALLES.length, personnes_par_salle: par_salle, personnes: par_salle * SALLES.length, horizon_min,
      zones_decideurs: ZONES_DEMO, grille_moteur: { largeur: moteur.grille.width, hauteur: moteur.grille.height, niveaux: moteur.grille.levels, cellule_m: moteur.grille.cellSize },
      issues_reelles: carte.issues.map((i) => ({ id: i.id, sorties_osm: i.exits_ids.length, largeur_m: Math.round(i.largeur_m * 10) / 10, distance_m: moteur.distances_m[i.id] })),
      lecons_rex: lecons.length,
    },
    avant: A,
    apres: P,
    comparaison: {
      delta_t90_s: A.t90_s !== null && P.t90_s !== null ? P.t90_s - A.t90_s : null,
      delta_non_sortis_fin: (P.non_sortis_fin ?? 0) - (A.non_sortis_fin ?? 0),
      delta_zone_danger: P.zone_danger_valeur - A.zone_danger_valeur,
      delta_pression_max: P.pression_helbing_max - A.pression_helbing_max,
      delta_note_totale: P.note_totale - A.note_totale,
    },
    plan_choisi: plan,
    leviers_choisis: leviersUniques,
    leviers_refuses: refus,
    decisions_citees,
    note_boucle: dernier.note,
    etat_final: dernier.etat,
    explication: textes.find((t) => t.type === 'explication'),
    ordres_de_service: textes.filter((t) => t.type === 'ordre_de_service'),
    ecarts_constates: ecarts,
    performance: { total_ms: Math.round(performance.now() - t0), simulations_completes: sim.runs + 1, cpu_mouvement_avant_ms: Math.round(avant.cpu_mouvement_ms), cpu_mouvement_apres_ms: Math.round(apres.cpu_mouvement_ms) },
  };
}

export type ResultatChaine = Awaited<ReturnType<typeof lancerChaine>>;
void clientsHeuristiques; void existsSync;
