// Mémoire sémantique pgvector, avec des vecteurs FACTICES de dimension 8 (aucun appel à un modèle d'embeddings).
// Base : un PostgreSQL avec pgvector, ex. `docker run -d -p 5435:5432 -e POSTGRES_PASSWORD=test pgvector/pgvector:pg16`.
// Si elle est injoignable, ces tests sont ignorés (et le disent).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import * as db from './db.mjs';

const ADMIN = process.env.TEST_VECTOR_DATABASE_URL ?? 'postgres://postgres:test@localhost:5435/postgres';
let admin, pool, ok = true;

before(async () => {
  admin = new pg.Pool({ connectionString: ADMIN, max: 1 });
  try { await admin.query('SELECT 1'); } catch (e) {
    ok = false; console.log(`# base pgvector injoignable (${e.code ?? e.message}) : ignoré`); return;
  }
  await admin.query('DROP DATABASE IF EXISTS test_vecteur WITH (FORCE)');
  await admin.query('CREATE DATABASE test_vecteur');
  const u = new URL(ADMIN); u.pathname = '/test_vecteur';
  pool = db.ouvrir(u.toString());
});

after(async () => {
  if (pool) await pool.end();
  if (admin) { if (ok) await admin.query('DROP DATABASE IF EXISTS test_vecteur WITH (FORCE)'); await admin.end(); }
});

test('ouvrir() ajoute uselibpqcompat=true seulement quand TLS est demandé', () => {
  const avec = db.ouvrir('postgres://u:p@hote.aivencloud.com:1234/db?sslmode=require');
  assert.match(avec.options.connectionString, /uselibpqcompat=true/);
  const sans = db.ouvrir('postgres://u:p@localhost:5434/db');
  assert.doesNotMatch(sans.options.connectionString, /uselibpqcompat/);
  assert.equal(avec.options.max, 5);
  avec.end(); sans.end();
});

test('pgvector : la leçon la plus proche par distance cosinus sort en premier', async (t) => {
  if (!ok) return t.skip('pas de base pgvector');
  await db.migrer(pool); await db.migrer(pool); // idempotent, volet vecteur compris
  assert.equal(await db.vecteurDisponible(pool), true);
  await db.enregistrerScene(pool, { id: 'forum', nom: 'Forum' });
  const a = await db.enregistrerLecon(pool, { sceneId: 'forum', texte: 'Phaser les salles' });
  const b = await db.enregistrerLecon(pool, { sceneId: 'forum', texte: 'Fermer la bouche de métro tôt' });
  await db.poserEmbeddingLecon(pool, a.id, [1, 0, 0, 0, 0, 0, 0, 0]);
  await db.poserEmbeddingLecon(pool, b.id, [0, 1, 0, 0, 0, 0, 0, 0]);
  const proches = await db.leconsProchesVecteur(pool, { sceneId: 'forum', embedding: [0.9, 0.1, 0, 0, 0, 0, 0, 0] });
  assert.deepEqual(proches.map((x) => x.texte), ['Phaser les salles', 'Fermer la bouche de métro tôt']);
  assert.ok(proches[0].distance < proches[1].distance);
  console.log('# pgvector :', proches.map((x) => `${x.texte}=${Number(x.distance).toFixed(4)}`).join(' ; '));
});
