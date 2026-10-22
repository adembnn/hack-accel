// Tests des correctifs de l'audit recherche/13-audit-code-red-team.md (F3, F5, F6, F7, F8, bornes, rôle).
// Base locale jetable (TEST_DATABASE_URL, défaut port 5434).
process.env.ALLOW_OPEN_WRITES = '1';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import * as db from './db.mjs';
import { creerServeur } from './serveur.mjs';
import { creerFlux } from './sse.mjs';
import { validerRex, LIMITES } from './valider.mjs';

const ADMIN = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@localhost:5434/postgres';
const NOM_BASE = 'test_correctifs';
let admin, pool, serveur, port, dispo = true;

before(async () => {
  process.env.ECOUTE_DELAI_INITIAL_MS = '100';
  admin = new pg.Pool({ connectionString: ADMIN, max: 2 });
  try { await admin.query('SELECT 1'); } catch (e) { dispo = false; console.log(`# base injoignable (${e.code})`); return; }
  await admin.query(`DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${NOM_BASE}`);
  const u = new URL(ADMIN); u.pathname = `/${NOM_BASE}`;
  pool = db.ouvrir(u.toString());
  await db.migrer(pool);
  await db.enregistrerScene(pool, { id: 'forum', nom: 'Forum' });
  await db.enregistrerEnseigne(pool, { id: 'jeton', sceneId: 'forum', nom: 'Jeton' });
  await db.enregistrerEnseigne(pool, { id: 'e1', sceneId: 'forum', nom: 'E1' });
  serveur = await creerServeur(pool);
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  port = serveur.address().port;
});
after(async () => {
  if (serveur) await new Promise((ok) => { serveur.closeAllConnections(); serveur.close(ok); });
  if (pool) await pool.end();
  if (admin) { if (dispo) await admin.query(`DROP DATABASE IF EXISTS ${NOM_BASE} WITH (FORCE)`); await admin.end(); }
});

const appel = (methode, chemin, corps, entetes = {}) => new Promise((ok, ko) => {
  const req = http.request({ host: '127.0.0.1', port, path: chemin, method: methode, agent: false,
    headers: { 'content-type': 'application/json', ...entetes } }, (res) => {
    let t = ''; res.on('data', (d) => (t += d));
    res.on('end', () => ok({ code: res.statusCode, corps: t ? JSON.parse(t) : null }));
  });
  req.on('error', ko);
  if (corps !== undefined) req.write(JSON.stringify(corps));
  req.end();
});
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function jusque(cond, ms = 5000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { if (await cond()) return true; await attendre(50); }
  return false;
}
function ouvrirFlux(chemin = '/api/tableau/flux', entetes = {}) {
  const recu = { ids: [], texte: '', fini: false };
  const req = http.get({ host: '127.0.0.1', port, path: chemin, headers: entetes }, (res) => {
    res.on('data', (d) => { recu.texte += d; recu.ids = [...recu.texte.matchAll(/^id: (\d+)$/gm)].map((m) => Number(m[1])); });
    res.on('end', () => { recu.fini = true; });
  });
  req.on('error', () => { recu.fini = true; });
  recu.fermer = () => req.destroy();
  return recu;
}
const rexOk = (n, enseigneId = 'e1') => ({ enseigneId, dateIncident: '2026-10-19', typeIncident: 'evacuation',
  description: `Évacuation numéro ${n}`, dureeMinutes: 30, personnesTouchees: 100 });

// (a) F6 : DATABASE_URL mal formée -------------------------------------------------------------
test('F6 : une DATABASE_URL mal formée ne fuit jamais (ni erreur, ni journal)', () => {
  const mauvaise = 'postgres://avnadmin:MotDePasseSecret@hote.aivencloud.com:pasunport/defaultdb?sslmode=require';
  let erreur;
  try { db.ouvrir(mauvaise); } catch (e) { erreur = e; }
  assert.ok(erreur, 'doit lever');
  assert.equal(erreur.input, undefined, "pas de propriété input portant l'URL");
  assert.doesNotMatch(`${erreur.message} ${erreur.stack} ${JSON.stringify(erreur)}`, /MotDePasseSecret|avnadmin/);
  for (const script of ['serveur.mjs', 'migrer.mjs', 'charger-rex.mjs']) {
    const r = spawnSync(process.execPath, [new URL(`./${script}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
      { env: { PATH: process.env.PATH, DATABASE_URL: mauvaise }, encoding: 'utf8' });
    assert.equal(r.status, 1, script);
    assert.doesNotMatch(`${r.stdout}${r.stderr}`, /MotDePasseSecret|avnadmin|aivencloud/, script);
  }
  console.log('# F6 : 3 scripts lancés avec une URL invalide : code 1, aucune trace du mot de passe');
});

// (b) F3 : jeton d'écriture ----------------------------------------------------------------------
test('F3 : sans jeton configuré les écritures sont refusées ; avec jeton, il faut le bon', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const avant = { token: process.env.WRITE_TOKEN, ouvert: process.env.ALLOW_OPEN_WRITES };
  const run = await db.creerRun(pool, { sceneId: 'forum', plan: 'p', graine: 1 });
  const ecritures = [
    ['/api/decisions', { runId: run.id, minuteSimulee: 1, decideur: 'a', levier: 'b' }],
    ['/api/tableau', { auteur: 'a', genre: 'note' }],
    ['/rex', rexOk(1, 'jeton')],
    ['/api/lecons/statut', { id: 1, statut: 'contradictoire' }],
  ];
  await db.enregistrerEnseigne(pool, { id: 'jeton', sceneId: 'forum', nom: 'Jeton' });
  try {
    delete process.env.WRITE_TOKEN; delete process.env.ALLOW_OPEN_WRITES;
    for (const [chemin, corps] of ecritures) assert.equal((await appel('POST', chemin, corps)).code, 401, `sans config : ${chemin}`);
    process.env.WRITE_TOKEN = 'jeton-de-test';
    for (const [chemin, corps] of ecritures) {
      assert.equal((await appel('POST', chemin, corps)).code, 401, `sans en-tête : ${chemin}`);
      assert.equal((await appel('POST', chemin, corps, { authorization: 'Bearer mauvais' })).code, 401, `mauvais jeton : ${chemin}`);
    }
    const bon = { authorization: 'Bearer jeton-de-test' };
    assert.equal((await appel('POST', '/api/tableau', ecritures[1][1], bon)).code, 201);
    assert.equal((await appel('POST', '/rex', ecritures[2][1], bon)).code, 201);
    assert.equal((await appel('GET', '/sante')).code, 200, 'les lectures restent ouvertes');
    process.env.ALLOW_OPEN_WRITES = '1'; delete process.env.WRITE_TOKEN;
    assert.equal((await appel('POST', '/api/tableau', ecritures[1][1])).code, 201, 'ALLOW_OPEN_WRITES=1 : développement local');
    console.log('# F3 : 401 sans jeton ni config, 401 mauvais jeton, 201 avec le bon, 201 en ALLOW_OPEN_WRITES=1');
  } finally {
    if (avant.token === undefined) delete process.env.WRITE_TOKEN; else process.env.WRITE_TOKEN = avant.token;
    process.env.ALLOW_OPEN_WRITES = avant.ouvert ?? '1';
  }
});

test('F3 : provenance non écrasable, enseigne non usurpable', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const l = await appel('POST', '/lecons', { sceneId: 'forum', texte: 'Leçon de test provenance',
    auteur: 'corpus-public', provenance: { auteur: 'prefecture', date: '1999-01-01', run_id: 'faux' } });
  assert.equal(l.code, 201);
  assert.equal(l.corps.auteur, 'analyste', "l'auteur réservé est refusé");
  assert.equal(l.corps.provenance.auteur, 'analyste');
  assert.notEqual(l.corps.provenance.date, '1999-01-01');
  assert.deepEqual(l.corps.provenance.declaree.auteur, 'prefecture', 'ce que le client déclare est rangé à part');
  assert.equal((await appel('POST', '/enseignes', { id: 'cine', sceneId: 'forum', nom: 'Cinéma', zone: 'niveau -3' })).code, 201);
  const usurpation = await appel('POST', '/enseignes', { id: 'cine', sceneId: 'forum', nom: 'PIRATE', zone: 'ailleurs' });
  assert.equal(usurpation.code, 409);
  assert.equal((await pool.query(`SELECT nom FROM enseignes WHERE id='cine'`)).rows[0].nom, 'Cinéma');
});

// (c) F5 : écoute LISTEN qui se reconnecte ------------------------------------------------------
test('F5 : après une coupure de la connexion LISTEN, le flux reprend et rattrape ce qui a été écrit pendant la coupure', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const flux = ouvrirFlux();
  await attendre(300);
  const pidsAvant = (await admin.query(`SELECT pid FROM pg_stat_activity WHERE datname=$1 AND application_name='ecoute-tableau'`, [NOM_BASE])).rows.map((r) => r.pid);
  assert.equal(pidsAvant.length, 1, 'une connexion d\'écoute dédiée');
  await admin.query('SELECT pg_terminate_backend($1)', [pidsAvant[0]]);
  const ecrit = await db.ecrireTableau(pool, { auteur: 'pendant', genre: 'coupure' });   // écrit pendant la coupure
  assert.ok(await jusque(() => flux.ids.includes(Number(ecrit.id))), 'la ligne écrite pendant la coupure arrive après reconnexion');
  const pidsApres = (await admin.query(`SELECT pid FROM pg_stat_activity WHERE datname=$1 AND application_name='ecoute-tableau'`, [NOM_BASE])).rows.map((r) => r.pid);
  assert.equal(pidsApres.length, 1);
  assert.notEqual(pidsApres[0], pidsAvant[0]);
  const apres = await db.ecrireTableau(pool, { auteur: 'apres', genre: 'reconnexion' });
  assert.ok(await jusque(() => flux.ids.includes(Number(apres.id))), 'le direct fonctionne de nouveau');
  console.log(`# F5 : écoute coupée (pid ${pidsAvant[0]}), rétablie (pid ${pidsApres[0]}), lignes ${ecrit.id} et ${apres.id} reçues`);
  flux.fermer();
});

// (d) F8 : SSE ------------------------------------------------------------------------------------
test('F8 : ids dans le désordre acceptés par le tampon et les clients', () => {
  const f = creerFlux({ tampon: 10 });
  const client = { recus: [], ecrire(t) { this.recus.push(t); }, arriere: () => 0, fermer() {} };
  f.abonner(client);
  f.publier({ id: 6 }); f.publier({ id: 5 });      // 6 notifié avant 5
  assert.equal(f.publier({ id: 5 }), false, 'doublon exact toujours ignoré');
  assert.deepEqual(f.depuis(0).map((e) => e.id), [5, 6], 'tampon trié');
  assert.equal(client.recus.length, 2, 'le client reçoit 5 ET 6');
});

test('F8 : reprise de plus de 200 événements manqués, sans trou', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const base = Number((await pool.query('SELECT coalesce(max(id),0) AS m FROM tableau_commun')).rows[0].m);
  await pool.query(`INSERT INTO tableau_commun (auteur, genre) SELECT 'masse', 'note' FROM generate_series(1, 450)`);
  const flux = ouvrirFlux('/api/tableau/flux', { 'last-event-id': String(base) });
  assert.ok(await jusque(() => flux.ids.filter((i) => i > base).length >= 450, 8000), `reçus : ${flux.ids.length}`);
  const dans = flux.ids.filter((i) => i > base);
  assert.equal(new Set(dans).size, 450, 'sans doublon');
  assert.equal(Math.max(...dans) - Math.min(...dans), 449, 'sans trou');
  console.log(`# F8 : 450 événements manqués rattrapés (ids ${Math.min(...dans)} à ${Math.max(...dans)})`);
  flux.fermer();
});

test('F8 : une connexion SSE est coupée au bout de la durée maximale', async (t) => {
  if (!dispo) return t.skip('pas de base');
  process.env.SSE_DUREE_MAX_MS = '400';
  try {
    const flux = ouvrirFlux();
    assert.ok(await jusque(() => flux.fini, 3000), 'coupée par le serveur');
  } finally { delete process.env.SSE_DUREE_MAX_MS; }
});

test('F8 : au plus 10 connexions SSE par adresse', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const ouverts = Array.from({ length: 10 }, () => ouvrirFlux());
  await attendre(400);
  const onzieme = ouvrirFlux();
  assert.ok(await jusque(() => onzieme.fini, 2000), 'la 11e est refusée');
  assert.ok(ouverts.every((o) => !o.fini), 'les 10 premières restent ouvertes');
  ouverts.forEach((o) => o.fermer());
});

// (e)(f) F7 : doublons, plafond, bornes ----------------------------------------------------------
test('F7 : le même REX envoyé deux fois = une seule ligne ; plafond de 20 par enseigne ; durée exigée', async (t) => {
  if (!dispo) return t.skip('pas de base');
  await db.enregistrerEnseigne(pool, { id: 'e1', sceneId: 'forum', nom: 'E1' });
  const un = await appel('POST', '/rex', rexOk(1));
  const deux = await appel('POST', '/rex', rexOk(1));
  assert.equal(un.code, 201);
  assert.equal(deux.code, 200);
  assert.equal(deux.corps.doublon, true);
  assert.equal(Number((await pool.query(`SELECT count(*) n FROM rex_crises WHERE enseigne_id='e1'`)).rows[0].n), 1);
  for (let i = 2; i <= 20; i++) assert.equal((await appel('POST', '/rex', rexOk(i))).code, 201);
  const vingtEtUn = await appel('POST', '/rex', rexOk(21));
  assert.equal(vingtEtUn.code, 429);
  assert.equal((await appel('POST', '/rex', rexOk(5))).code, 200, 'un doublon reste accepté même au plafond');
  assert.equal(Number((await pool.query(`SELECT count(*) n FROM rex_crises WHERE enseigne_id='e1'`)).rows[0].n), 20);
  const sansDuree = await appel('POST', '/rex', { ...rexOk(30, 'jeton'), dureeMinutes: undefined, personnesTouchees: 40000 });
  assert.equal(sansDuree.code, 422);
  assert.match(sansDuree.corps.erreur, /dureeMinutes/);
  // concurrence : 30 envois simultanés du même REX = une ligne
  await Promise.all(Array.from({ length: 30 }, () => appel('POST', '/rex', rexOk(99, 'jeton'))));
  assert.equal(Number((await pool.query(`SELECT count(*) n FROM rex_crises WHERE description='Évacuation numéro 99'`)).rows[0].n), 1);
  console.log('# F7 : doublon -> 200, 21e REX -> 429, personnes sans durée -> 422, 30 envois simultanés -> 1 ligne');
});

test('Bornes : validateur et schéma SQL ont la même borne', async (t) => {
  assert.equal(LIMITES.personnesMax, 50000);
  assert.throws(() => validerRex({ ...rexOk(1), dureeMinutes: 1440, personnesTouchees: 50001 }), /hors plage/);
  assert.ok(validerRex({ ...rexOk(1), dureeMinutes: 1440, personnesTouchees: 50000 }));
  if (!dispo) return t.skip('pas de base');
  await assert.rejects(pool.query(`INSERT INTO rex_crises (enseigne_id, date_incident, type_incident, description, personnes_touchees)
    VALUES ('e1','2026-10-01','x','y', 50001)`), /rex_bornes_check/);
  await assert.rejects(pool.query(`INSERT INTO rex_crises (enseigne_id, date_incident, type_incident, description, duree_minutes)
    VALUES ('e1','2026-10-01','x','y', 1441)`), /rex_bornes_check/);
});

// (g) rôle endossé par le serveur ---------------------------------------------------------------
test('Rôle : les écritures de REX passent par enseigne_ecriture (SET LOCAL ROLE)', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const x = validerRex(rexOk(1, 'jeton'));
  x.description = 'Test du rôle'; x.empreinte = 'e'.repeat(64);
  try {
    await pool.query('REVOKE INSERT ON rex_crises FROM enseigne_ecriture');
    await assert.rejects(db.enregistrerRexEnseigne(pool, x), /permission denied/, 'sans le droit INSERT du rôle, l\'écriture échoue : le rôle est bien endossé');
  } finally { await pool.query('GRANT INSERT ON rex_crises TO enseigne_ecriture'); }
  const ok = await db.enregistrerRexEnseigne(pool, x);
  assert.ok(ok.rex.id);
  const sesCols = await pool.query(`SELECT has_table_privilege('enseigne_ecriture','rex_crises','SELECT') AS table_entiere,
    has_column_privilege('enseigne_ecriture','rex_crises','description','SELECT') AS description`);
  assert.deepEqual(sesCols.rows[0], { table_entiere: false, description: false }, 'le rôle ne peut lire ni la table ni le texte');
});
