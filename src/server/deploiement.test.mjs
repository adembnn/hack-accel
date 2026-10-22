// Préparation au déploiement : (1) utilisateur de base NON superuser comme sur Aiven (rôle d'écriture endossable),
// (2) le script infra/verifier-deploiement.mjs contre un vrai serveur, (3) point d'extension routesExtra.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import * as db from './db.mjs';
import { creerServeur } from './serveur.mjs';

process.env.ALLOW_OPEN_WRITES = '1';
const ADMIN = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@localhost:5434/postgres';
const BASE = 'test_deploiement';
const UTILISATEUR = 'utilisateur_type_aiven';
// Nom propre à ce test : un rôle est global au cluster et les autres fichiers de test tournent en parallèle.
const ROLE = 'enseigne_ecriture_deploiement';
let admin, pool, serveur, port, dispo = true;

before(async () => {
  admin = new pg.Pool({ connectionString: ADMIN, max: 1 });
  try { await admin.query('SELECT 1'); } catch { dispo = false; return; }
  await admin.query(`DROP DATABASE IF EXISTS ${BASE} WITH (FORCE)`);
  await admin.query(`DROP ROLE IF EXISTS ${ROLE}`);
  await admin.query(`DROP ROLE IF EXISTS ${UTILISATEUR}`);
  // Comme avnadmin : peut créer des rôles et des bases, n'est pas superuser.
  await admin.query(`CREATE ROLE ${UTILISATEUR} LOGIN CREATEROLE CREATEDB PASSWORD 'jetable'`);
  await admin.query(`CREATE DATABASE ${BASE} OWNER ${UTILISATEUR}`);
  const u = new URL(ADMIN); u.pathname = `/${BASE}`; u.username = UTILISATEUR; u.password = 'jetable';
  pool = db.ouvrir(u.toString());
  // Le schéma réel (avec un nom de rôle neuf) exécuté par cet utilisateur : il doit créer le rôle ET pouvoir l'endosser.
  const schema = readFileSync(fileURLToPath(new URL('../../infra/schema.sql', import.meta.url)), 'utf8');
  await pool.query(schema.replaceAll('enseigne_ecriture', ROLE));
  await db.enregistrerScene(pool, { id: 'forum-des-halles', nom: 'Forum' });
  serveur = await creerServeur(pool, {
    routesExtra: [async (req, res, url, ctx) => {
      if (url.pathname !== '/api/extension-test') return false;
      ctx.json(res, 200, { extension: true });
      return true;
    }],
  });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  port = serveur.address().port;
});
after(async () => {
  if (serveur) await new Promise((ok) => { serveur.closeAllConnections(); serveur.close(ok); });
  if (pool) await pool.end();
  if (admin) {
    if (dispo) {
      await admin.query(`DROP DATABASE IF EXISTS ${BASE} WITH (FORCE)`);
      await admin.query(`DROP ROLE IF EXISTS ${ROLE}`);
      await admin.query(`DROP ROLE IF EXISTS ${UTILISATEUR}`);
    }
    await admin.end();
  }
});

test('utilisateur non superuser : GRANT ... WITH SET TRUE appliqué, le rôle d\'écriture est endossable', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const m = await pool.query(`SELECT bool_or(m.set_option) AS set_option FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles u ON u.oid=m.member
    WHERE r.rolname=$1 AND u.rolname=$2`, [ROLE, UTILISATEUR]);
  assert.equal(m.rows[0]?.set_option, true);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query(`SET LOCAL ROLE ${ROLE}`);                        // échouerait sans SET TRUE (PostgreSQL 16+)
    await assert.rejects(c.query('SELECT description FROM rex_crises'), /permission denied/);
    await c.query('ROLLBACK');
  } finally { c.release(); }
  console.log(`# non superuser ${UTILISATEUR} : set_option=true, SET LOCAL ROLE ${ROLE} accepté, lecture du texte refusée`);
});

test('infra/verifier-deploiement.mjs : tout vert contre un vrai serveur, aucun secret dans la sortie', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const jeton = 'jeton-de-test-secret-123';
  const avant = process.env.WRITE_TOKEN;
  process.env.WRITE_TOKEN = jeton;            // le serveur de test lit l'environnement de ce processus
  try {
    const script = fileURLToPath(new URL('../../infra/verifier-deploiement.mjs', import.meta.url));
    const r = await new Promise((ok) => {
      const p = spawn(process.execPath, [script, `http://user:motdepasse@127.0.0.1:${port}/?cle=secrete`, '--scene', 'forum-des-halles'],
        { env: { ...process.env, WRITE_TOKEN: jeton } });
      let sortie = '';
      p.stdout.on('data', (d) => (sortie += d)); p.stderr.on('data', (d) => (sortie += d));
      p.on('close', (code) => ok({ code, sortie }));
    });
    assert.equal(r.code, 0, r.sortie);
    assert.match(r.sortie, /GET \/sante.*HTTP 200/);
    assert.match(r.sortie, /ligne retrouvée en base/);
    assert.match(r.sortie, /événement reçu en direct/);
    assert.doesNotMatch(r.sortie, /motdepasse|secrete|jeton-de-test-secret/);
    console.log(r.sortie.trimEnd().split('\n').map((l) => '# ' + l).join('\n'));
  } finally { if (avant === undefined) delete process.env.WRITE_TOKEN; else process.env.WRITE_TOKEN = avant; }
});

test('routesExtra : point d\'extension pour routeDirecteur / routeAgents', async (t) => {
  if (!dispo) return t.skip('pas de base');
  const r = await fetch(`http://127.0.0.1:${port}/api/extension-test`);
  assert.deepEqual(await r.json(), { extension: true });
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/inconnue`)).status, 404);
});
