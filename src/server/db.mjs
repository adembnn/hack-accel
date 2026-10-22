// Accès PostgreSQL (Aiven) du jumeau 3D. La connexion vient UNIQUEMENT de la variable
// d'environnement DATABASE_URL ; aucun fichier de clés n'est lu ici.
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SCHEMA = fileURLToPath(new URL('../../infra/schema.sql', import.meta.url));

/** Ouvre un pool de connexions. Aiven impose TLS : DATABASE_URL contient déjà `sslmode=require`. */
export function ouvrir(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL manquante (variable d'environnement)");
  return new pg.Pool({ connectionString: url, max: 5 });
}

/** Applique infra/schema.sql (idempotent). */
export async function migrer(pool) {
  await pool.query(readFileSync(SCHEMA, 'utf8'));
}

export async function sante(pool) {
  const r = await pool.query('SELECT 1 AS ok');
  return r.rows[0].ok === 1;
}

// --- scènes et contraintes -------------------------------------------------
export async function enregistrerScene(pool, { id, nom, version = 1, contenu = {} }) {
  const r = await pool.query(
    `INSERT INTO scenes (id, nom, version, contenu) VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET nom=$2, version=$3, contenu=$4 RETURNING *`,
    [id, nom, version, contenu]);
  return r.rows[0];
}

export async function poserContrainte(pool, { sceneId, type, cible, etat, parametres = {}, posePar = 'utilisateur' }) {
  const r = await pool.query(
    `INSERT INTO contraintes (scene_id, type, cible, etat, parametres, pose_par)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sceneId, type, cible, etat, parametres, posePar]);
  return r.rows[0];
}

/** État courant : la dernière contrainte posée par (type, cible). */
export async function contraintesCourantes(pool, sceneId) {
  const r = await pool.query(
    `SELECT DISTINCT ON (type, cible) * FROM contraintes
     WHERE scene_id=$1 ORDER BY type, cible, pose_le DESC, id DESC`, [sceneId]);
  return r.rows;
}

// --- runs ------------------------------------------------------------------
export async function creerRun(pool, { sceneId, plan, graine, parametres = {} }) {
  const r = await pool.query(
    `INSERT INTO runs (scene_id, plan, graine, parametres) VALUES ($1,$2,$3,$4) RETURNING *`,
    [sceneId, plan, graine, parametres]);
  return r.rows[0];
}

export async function terminerRun(pool, runId, statut = 'termine') {
  const r = await pool.query(
    `UPDATE runs SET statut=$2, fin=now() WHERE id=$1 RETURNING *`, [runId, statut]);
  return r.rows[0];
}

export async function lireRun(pool, runId) {
  const r = await pool.query('SELECT * FROM runs WHERE id=$1', [runId]);
  return r.rows[0] ?? null;
}

// --- décisions -------------------------------------------------------------
export async function enregistrerDecision(pool, { runId, minuteSimulee, decideur, levier, valeur = {}, justification = '', score = null }) {
  const r = await pool.query(
    `INSERT INTO decisions (run_id, minute_simulee, decideur, levier, valeur, justification, score)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [runId, minuteSimulee, decideur, levier, valeur, justification, score]);
  return r.rows[0];
}

export async function lireDecisions(pool, runId) {
  const r = await pool.query(
    'SELECT * FROM decisions WHERE run_id=$1 ORDER BY minute_simulee, id', [runId]);
  return r.rows;
}

// --- mémoire : cas passés similaires --------------------------------------
export async function enregistrerMemoire(pool, { sceneId, runId = null, etiquettes = [], signature = {}, resume, planRetenu = null, note = null }) {
  const r = await pool.query(
    `INSERT INTO memoire (scene_id, run_id, etiquettes, signature, resume, plan_retenu, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [sceneId, runId, etiquettes, signature, resume, planRetenu, note]);
  return r.rows[0];
}

/**
 * Les cas passés les plus proches : similarité de Jaccard sur les étiquettes
 * (étiquettes communes / étiquettes réunies), départagée par la meilleure note.
 * Le filtre `&&` s'appuie sur l'index GIN : seuls les cas partageant une étiquette sont lus.
 */
export async function casSimilaires(pool, { sceneId, etiquettes, limite = 5 }) {
  const r = await pool.query(
    `SELECT m.*,
            cardinality(ARRAY(SELECT unnest(m.etiquettes) INTERSECT SELECT unnest($2::text[])))::float
            / NULLIF(cardinality(ARRAY(SELECT unnest(m.etiquettes) UNION SELECT unnest($2::text[]))), 0) AS similarite
     FROM memoire m
     WHERE m.scene_id=$1 AND m.etiquettes && $2::text[]
     ORDER BY similarite DESC, m.note DESC NULLS LAST, m.id DESC
     LIMIT $3`,
    [sceneId, etiquettes, limite]);
  return r.rows;
}

// --- tableau commun --------------------------------------------------------
export async function ecrireTableau(pool, { runId = null, auteur, genre, contenu = {} }) {
  const r = await pool.query(
    `INSERT INTO tableau_commun (run_id, auteur, genre, contenu) VALUES ($1,$2,$3,$4) RETURNING *`,
    [runId, auteur, genre, contenu]);
  return r.rows[0];
}

export async function lireTableau(pool, { runId = null, apresId = 0, limite = 200 } = {}) {
  const r = await pool.query(
    `SELECT * FROM tableau_commun WHERE id > $1 AND ($2::uuid IS NULL OR run_id = $2)
     ORDER BY id LIMIT $3`, [apresId, runId, limite]);
  return r.rows;
}

// --- journal des chiffres --------------------------------------------------
export async function noterChiffre(pool, { runId = null, nom, valeur, unite = '', source, verifie = false }) {
  const r = await pool.query(
    `INSERT INTO journal_chiffres (run_id, nom, valeur, unite, source, verifie)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [runId, nom, valeur, unite, source, verifie]);
  return r.rows[0];
}

export async function lireChiffres(pool, runId) {
  const r = await pool.query('SELECT * FROM journal_chiffres WHERE run_id=$1 ORDER BY id', [runId]);
  return r.rows;
}

/** Écoute NOTIFY sur le tableau commun ; renvoie une fonction d'arrêt. */
export async function ecouterTableau(pool, surId) {
  const client = await pool.connect();
  client.on('notification', (m) => surId(Number(m.payload)));
  await client.query('LISTEN tableau_commun');
  return () => { client.release(); };
}
