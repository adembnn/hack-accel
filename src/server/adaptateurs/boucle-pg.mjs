// Joue la boucle des décideurs (backend `rules` : clients heuristiques, faux simulateur, aucune clé, aucun appel payant)
// contre une VRAIE base PostgreSQL LOCALE, puis relit tout ce qui a été écrit.
//
// Lancer :  TEST_DATABASE_URL=postgres://postgres:<mot de passe jetable>@localhost:<port>/postgres \
//             node src/server/adaptateurs/boucle-pg.mjs
// Base jetable (Docker) :  docker run -d --name pg-jetable -p 55460:5432 -e POSTGRES_PASSWORD=<jeté> postgres:16
// Garde-fou : refuse toute base qui n'est pas sur localhost / 127.0.0.1 / ::1 (jamais Aiven).
// La base `adaptateurs_boucle` est recréée à chaque lancement.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import * as db from '../db.mjs';
import { StockageTableauPg, StockageRexPg } from './index.ts';
import { lancerBoucle, clientsHeuristiques } from '../../agents/boucle.ts';
import { FauxSimulateur, scenarioDeTest } from '../../agents/fausse-sim.ts';
import { StockageMemoire } from '../../agents/stockage.ts';
import { AnalysteDeterministe, verifierLecon, promouvoir } from '../../agents/rex.ts';

export const NOM_BASE = 'adaptateurs_boucle';
export const SCENE = 'forum-des-halles';

export const REX_DE_DEMO = [
  { id: 'r1', enseigne: 'Fnac', zone: 'niveau_-1', type_incident: 'evacuation_magasin', date: '2025-03-02', duree_min: 12, description: 'alarme technique', mesures: ['annonce'], efficace: true },
  { id: 'r2', enseigne: 'Sephora', zone: 'niveau_-1', type_incident: 'evacuation_magasin', date: '2025-06-14', duree_min: 18, description: 'colis suspect', mesures: ['agents'], efficace: false },
  { id: 'r3', enseigne: 'UGC Ciné Cité', zone: 'ugc', type_incident: 'evacuation_cinema', date: '2026-10-19', duree_min: 40, personnes_touchees: 3000, description: 'couvre-feu', mesures: ['annonce vocale'], efficace: true },
];

export function estLocale(url) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(url).hostname);
}

/** (Re)crée la base de test et renvoie { admin, pool, url }. */
export async function preparerBase(urlAdmin) {
  if (!urlAdmin) throw new Error('TEST_DATABASE_URL manquante (base PostgreSQL locale jetable)');
  if (!estLocale(urlAdmin)) throw new Error('refus : la base doit être locale (localhost / 127.0.0.1)');
  const admin = new pg.Pool({ connectionString: urlAdmin, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${NOM_BASE}`);
  const u = new URL(urlAdmin);
  u.pathname = `/${NOM_BASE}`;
  const pool = db.ouvrir(u.toString());
  await db.migrer(pool);
  return { admin, pool, url: u.toString() };
}

/** La boucle complète ; renvoie un rapport chiffré (et lève si une relecture ne correspond pas). */
export async function jouerBoucle(pool, { minutes = 6 } = {}) {
  await db.enregistrerScene(pool, { id: SCENE, nom: 'Forum des Halles' });
  const run = await db.creerRun(pool, { sceneId: SCENE, plan: 'plan-decideurs', graine: 7 });
  const rexPg = new StockageRexPg(pool, SCENE);
  const tableauPg = new StockageTableauPg(pool, run.id);

  // 1. REX (écrits sous le rôle enseigne_ecriture) -> relus tels quels.
  for (const r of REX_DE_DEMO) await rexPg.ajouterRex(r);
  const rexRelus = await rexPg.listerRex();
  assert.deepEqual(rexRelus, REX_DE_DEMO, 'les REX relus doivent être identiques aux REX écrits');

  // 2. Leçons de l'analyste (non vérifiées) -> écrites avec provenance et sources -> relues, chiffres vérifiés.
  const lecons = await new AnalysteDeterministe().analyser(rexRelus);
  await rexPg.remplacerLecons(lecons);
  const leconsRelues = await rexPg.listerLecons();
  assert.deepEqual(leconsRelues, lecons, 'les leçons relues doivent être identiques aux leçons écrites');
  for (const l of leconsRelues) assert.deepEqual(verifierLecon(l, rexRelus), { ok: true, problemes: [] });

  // 3. La boucle, avec les leçons relues DANS LA BASE, écrit le tableau commun et les décisions dans PostgreSQL.
  const lancer = (stockage) => lancerBoucle({ simulateur: new FauxSimulateur(), scenario: scenarioDeTest(), clients: clientsHeuristiques(), stockage, minutes, lecons: leconsRelues });
  const journal = await lancer(tableauPg);
  const memoire = new StockageMemoire();
  const journalMemoire = await lancer(memoire);   // même partie, stockage en mémoire : le témoin

  // 4. Relecture : identique au témoin en mémoire (le stockage ne doit rien changer à la partie).
  const ecrit = await tableauPg.lister();
  assert.deepEqual(ecrit, await memoire.lister(), 'le tableau relu de PostgreSQL doit égaler celui de la mémoire');
  assert.equal(ecrit.length, minutes * 4, 'une entrée par décideur et par minute');
  assert.deepEqual(journal.entrees.map((e) => e.note), journalMemoire.entrees.map((e) => e.note));
  const m0 = ecrit[0].minute;
  assert.deepEqual(await tableauPg.lister({ minute: m0, decideur: 'directeur' }), ecrit.filter((e) => e.minute === m0 && e.decideur === 'directeur'));

  // 5. Les décisions (une ligne par action acceptée) citent leurs leçons.
  const decisions = await db.lireDecisions(pool, run.id);
  const nbAcceptees = ecrit.reduce((s, e) => s + e.actions_acceptees.length, 0);
  assert.equal(decisions.length, nbAcceptees);
  const idLecon = leconsRelues[0].id;
  const citant = await tableauPg.decisionsCitant(idLecon);
  assert.ok(citant.length > 0, `aucune décision ne cite ${idLecon}`);
  assert.ok(decisions.every((d) => Array.isArray(d.valeur.lecons_utilisees) && d.valeur.lecons_utilisees.length > 0));
  const bandeau = await pool.query(`SELECT count(*)::int AS n FROM tableau_commun WHERE run_id=$1 AND genre='decision'`, [run.id]);

  // 6. Promotion d'une leçon par simulation : le run qui la valide est référencé dans la base.
  const promue = promouvoir(leconsRelues[0], { simulation: { run_id: run.id, meilleure: true } });
  await rexPg.remplacerLecons([promue, ...leconsRelues.slice(1)]);
  const apres = await rexPg.listerLecons();
  assert.equal(apres[0].statut, 'validee_par_simulation');
  assert.equal(apres[0].provenance.validation.run_id, run.id);
  const rv = await pool.query(`SELECT statut, run_validation FROM lecons WHERE scene_id=$1 AND statut='validee_par_simulation'`, [SCENE]);
  assert.equal(rv.rows[0].run_validation, run.id);
  const nbSources = await pool.query('SELECT count(*)::int AS n FROM lecons_sources');
  await db.terminerRun(pool, run.id);

  return { run_id: run.id, rex: rexRelus.length, lecons: apres.length, entrees_tableau: bandeau.rows[0].n, decisions: decisions.length,
    decisions_citant_la_premiere_lecon: citant.length, sources_tracees: nbSources.rows[0].n, lecon_validee: apres[0].id };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = await preparerBase(process.env.TEST_DATABASE_URL);
  try {
    console.log(JSON.stringify(await jouerBoucle(base.pool), null, 2));
    console.log('OK : tableau commun, REX, leçons et décisions écrits puis relus dans PostgreSQL.');
  } finally {
    await base.pool.end();
    await base.admin.end();
  }
}
