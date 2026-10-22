// Test de la couche de données sur une vraie base PostgreSQL locale (jamais Aiven).
// Lancer : TEST_DATABASE_URL=postgres://postgres:<mot de passe jetable>@localhost:5434/postgres node --test src/server/
// (défaut : le conteneur `docker run -d -p 5434:5432 -e POSTGRES_PASSWORD=test postgres:16`).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import pg from 'pg';
import * as db from './db.mjs';
import { creerServeur } from './serveur.mjs';

const ADMIN = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@localhost:5434/postgres';
const NOM_BASE = 'test_jumeau';
let admin, pool, serveur, port, disponible = true;

before(async () => {
  admin = new pg.Pool({ connectionString: ADMIN, max: 1 });
  try {
    await admin.query('SELECT 1');
  } catch (e) {
    disponible = false;
    console.log(`# base de test injoignable (${e.code ?? e.message}) : tests ignorés`);
    return;
  }
  await admin.query(`DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${NOM_BASE}`);
  const url = new URL(ADMIN);
  url.pathname = `/${NOM_BASE}`;
  pool = db.ouvrir(url.toString());
  serveur = await creerServeur(pool);
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  port = serveur.address().port;
});

after(async () => {
  if (serveur) await new Promise((ok) => { serveur.closeAllConnections(); serveur.close(ok); });
  if (pool) await pool.end();
  if (admin) {
    if (disponible) await admin.query(`DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`);
    await admin.end();
  }
});

const appel = (methode, chemin, corps) => new Promise((ok, ko) => {
  const req = http.request({ host: '127.0.0.1', port, path: chemin, method: methode,
    headers: { 'content-type': 'application/json' } }, (res) => {
    let t = ''; res.on('data', (d) => (t += d));
    res.on('end', () => ok({ code: res.statusCode, corps: t ? JSON.parse(t) : null }));
  });
  req.on('error', ko);
  if (corps) req.write(JSON.stringify(corps));
  req.end();
});

test('le schéma est idempotent (appliqué trois fois sans erreur)', { skip: !disponible && 'pas de base' }, async (t) => {
  if (!disponible) return t.skip('pas de base');
  await db.migrer(pool); await db.migrer(pool); await db.migrer(pool);
  const r = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`);
  assert.deepEqual(r.rows.map((x) => x.table_name),
    ['contraintes', 'decisions', 'journal_chiffres', 'memoire', 'runs', 'scenes', 'tableau_commun']);
  console.log('# tables :', r.rows.map((x) => x.table_name).join(', '));
});

test('scène, contrainte, run, décision, chiffre : écriture puis relecture', async (t) => {
  if (!disponible) return t.skip('pas de base');
  await db.enregistrerScene(pool, { id: 'forum', nom: 'Forum des Halles', contenu: { niveaux: 6 } });
  await db.poserContrainte(pool, { sceneId: 'forum', type: 'issue', cible: 'sortie-3', etat: 'ferme' });
  await db.poserContrainte(pool, { sceneId: 'forum', type: 'issue', cible: 'sortie-3', etat: 'ouvert' });
  const courantes = await db.contraintesCourantes(pool, 'forum');
  assert.equal(courantes.length, 1);
  assert.equal(courantes[0].etat, 'ouvert');

  await assert.rejects(db.poserContrainte(pool, { sceneId: 'forum', type: 'issue', cible: 'x', etat: 'casse' }),
    /contraintes_etat_check/);

  const run = await db.creerRun(pool, { sceneId: 'forum', plan: 'consigne-19-oct', graine: 7 });
  await db.enregistrerDecision(pool, { runId: run.id, minuteSimulee: 2, decideur: 'directeur', levier: 'fermer_issue',
    valeur: { cible: 'sortie-3' }, justification: 'densité trop forte', score: { ecrasement: 0 } });
  await db.enregistrerDecision(pool, { runId: run.id, minuteSimulee: 1, decideur: 'ratp', levier: 'guidage' });
  const decisions = await db.lireDecisions(pool, run.id);
  assert.deepEqual(decisions.map((d) => d.minute_simulee), [1, 2]);
  assert.deepEqual(decisions[1].valeur, { cible: 'sortie-3' });

  await db.noterChiffre(pool, { runId: run.id, nom: 'temps_evacuation_s', valeur: 412.5, unite: 's', source: 'simulation', verifie: true });
  assert.equal(Number((await db.lireChiffres(pool, run.id))[0].valeur), 412.5);

  const fini = await db.terminerRun(pool, run.id);
  assert.equal(fini.statut, 'termine');
  assert.ok(fini.fin);
  console.log('# run', run.id, 'decisions', decisions.length);
});

test('mémoire : les cas passés les plus proches sortent en premier', async (t) => {
  if (!disponible) return t.skip('pas de base');
  const base = { sceneId: 'forum', signature: {} };
  await db.enregistrerMemoire(pool, { ...base, etiquettes: ['issue_fermee:sortie-3', 'metro_ferme:chatelet'], resume: 'cas A', note: 0.7 });
  await db.enregistrerMemoire(pool, { ...base, etiquettes: ['issue_fermee:sortie-3'], resume: 'cas B', note: 0.9 });
  await db.enregistrerMemoire(pool, { ...base, etiquettes: ['manifestation:rivoli'], resume: 'cas C (sans rapport)', note: 1 });
  const proches = await db.casSimilaires(pool, { sceneId: 'forum', etiquettes: ['issue_fermee:sortie-3', 'metro_ferme:chatelet'] });
  assert.deepEqual(proches.map((c) => c.resume), ['cas A', 'cas B']);
  assert.equal(proches[0].similarite, 1);
  assert.equal(proches[1].similarite, 0.5);
  console.log('# similaires :', proches.map((c) => `${c.resume}=${c.similarite}`).join(', '));
});

test('serveur : /sante, décisions, mémoire, erreurs de saisie', async (t) => {
  if (!disponible) return t.skip('pas de base');
  const s = await appel('GET', '/sante');
  assert.equal(s.code, 200);
  assert.deepEqual(s.corps, { ok: true, base: 'ok' });

  const run = await db.creerRun(pool, { sceneId: 'forum', plan: 'plan-decideurs', graine: 1 });
  const p = await appel('POST', '/api/decisions', { runId: run.id, minuteSimulee: 3, decideur: 'securite', levier: 'message_zone' });
  assert.equal(p.code, 201);
  const g = await appel('GET', `/api/decisions?run=${run.id}`);
  assert.equal(g.corps.length, 1);

  assert.equal((await appel('POST', '/api/decisions', { runId: run.id })).code, 400);
  assert.equal((await appel('GET', '/api/decisions?run=pas-un-uuid')).code, 400);
  assert.equal((await appel('GET', '/inconnue')).code, 404);

  await appel('POST', '/api/memoire', { sceneId: 'forum', resume: 'via http', etiquettes: ['metro_ferme:chatelet'] });
  const sim = await appel('GET', '/api/memoire/similaires?scene=forum&etiquettes=metro_ferme:chatelet');
  assert.ok(sim.corps.some((c) => c.resume === 'via http'));
  console.log('# /sante ->', s.code, JSON.stringify(s.corps));
});

test('tableau commun : une écriture arrive en direct par SSE', async (t) => {
  if (!disponible) return t.skip('pas de base');
  const recus = [];
  const req = http.get({ host: '127.0.0.1', port, path: '/api/tableau/flux' });
  const res = await new Promise((ok) => req.on('response', ok));
  assert.match(res.headers['content-type'], /text\/event-stream/);
  let tampon = '';
  const attente = new Promise((ok) => {
    res.on('data', (d) => {
      tampon += d;
      if (tampon.includes('"auteur":"alexandre"')) ok();
    });
  });
  await new Promise((ok) => setTimeout(ok, 200)); // laisse la connexion s'enregistrer
  const w = await appel('POST', '/api/tableau', { auteur: 'alexandre', genre: 'alerte', contenu: { zone: 'niveau -3' } });
  assert.equal(w.code, 201);
  await Promise.race([attente, new Promise((_, ko) => setTimeout(() => ko(new Error('SSE : rien reçu en 3 s')), 3000))]);
  const evt = tampon.split('\n\n').find((b) => b.includes('event: tableau'));
  recus.push(evt);
  assert.match(evt, /"genre":"alerte"/);
  console.log('# SSE reçu :', evt.replace(/\n/g, ' | '));
  req.destroy();
  const lu = await appel('GET', '/api/tableau?apres=0');
  assert.ok(lu.corps.length >= 1);
});
