// Accès PostgreSQL (Aiven) du jumeau 3D. La connexion vient UNIQUEMENT de la variable
// d'environnement DATABASE_URL ; aucun fichier de clés n'est lu ici.
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SCHEMA = fileURLToPath(new URL('../../infra/schema.sql', import.meta.url));
const SCHEMA_VECTEUR = fileURLToPath(new URL('../../infra/schema-vecteur.sql', import.meta.url));

/** Ouvre un pool de connexions. Aiven impose TLS : DATABASE_URL contient déjà `sslmode=require`. */
export function ouvrir(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL manquante (variable d'environnement)");
  // Aiven Runtime + node-postgres : la doc demande uselibpqcompat=true (TLS chiffré, certificat non vérifié).
  // Ajouté seulement quand l'URL demande TLS (sslmode présent) ; la base locale de test n'est pas touchée.
  const u = new URL(url);
  if (u.searchParams.has('sslmode') && !u.searchParams.has('uselibpqcompat')) u.searchParams.set('uselibpqcompat', 'true');
  // Base gratuite Aiven : 20 connexions au plus, sans pooling. Pool de 5 + 1 connexion dédiée au LISTEN.
  return new pg.Pool({ connectionString: u.toString(), max: 5 });
}

/** Applique infra/schema.sql (idempotent), puis le volet pgvector si l'extension est disponible. */
export async function migrer(pool) {
  await pool.query(readFileSync(SCHEMA, 'utf8'));
  const dispo = await pool.query(`SELECT 1 FROM pg_available_extensions WHERE name='vector'`);
  if (dispo.rowCount) await pool.query(readFileSync(SCHEMA_VECTEUR, 'utf8'));
}

export async function vecteurDisponible(pool) {
  const r = await pool.query(`SELECT 1 FROM pg_extension WHERE extname='vector'`);
  return r.rowCount > 0;
}

const versVecteur = (v) => `[${v.join(',')}]`;

/** Associe un vecteur (8 nombres) à une leçon. */
export async function poserEmbeddingLecon(pool, leconId, embedding) {
  await pool.query('UPDATE lecons SET embedding=$2::vector WHERE id=$1', [leconId, versVecteur(embedding)]);
}

/** Leçons les plus proches par distance cosinus (index HNSW). */
export async function leconsProchesVecteur(pool, { sceneId, embedding, limite = 3 }) {
  const r = await pool.query(
    `SELECT id, texte, etiquettes, embedding <=> $2::vector AS distance
     FROM lecons WHERE scene_id=$1 AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector LIMIT $3`, [sceneId, versVecteur(embedding), limite]);
  return r.rows;
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

// --- enseignes, retours d'expérience (REX) et leçons ----------------------
export async function enregistrerEnseigne(pool, { id, sceneId, nom, zone = '' }) {
  const r = await pool.query(
    `INSERT INTO enseignes (id, scene_id, nom, zone) VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET nom=$3, zone=$4 RETURNING *`, [id, sceneId, nom, zone]);
  return r.rows[0];
}

export async function enregistrerRex(pool, { enseigneId, dateIncident, zone = '', typeIncident, description,
  decisionsPrises = '', resultat = '', dureeMinutes = null, personnesTouchees = null, leconsEnseigne = '', etiquettes = [],
  motifsSuspects = [], sourceUrl = null, confiance = null, empreinte = null }) {
  const r = await pool.query(
    `INSERT INTO rex_crises (enseigne_id, date_incident, zone, type_incident, description, decisions_prises,
       resultat, duree_minutes, personnes_touchees, lecons_enseigne, etiquettes, suspect, motifs_suspects,
       source_url, confiance, empreinte)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (empreinte) WHERE empreinte IS NOT NULL DO NOTHING
     RETURNING *`,
    [enseigneId, dateIncident, zone, typeIncident, description, decisionsPrises, resultat,
     dureeMinutes, personnesTouchees, leconsEnseigne, etiquettes, motifsSuspects.length > 0, motifsSuspects,
     sourceUrl, confiance, empreinte]);
  return r.rows[0] ?? null;   // null = doublon exact ignoré
}

export async function lireRex(pool, { enseigneId = null, sceneId = null, limite = 200 } = {}) {
  const r = await pool.query(
    `SELECT x.* FROM rex_crises x JOIN enseignes e ON e.id = x.enseigne_id
     WHERE ($1::text IS NULL OR x.enseigne_id = $1) AND ($2::text IS NULL OR e.scene_id = $2)
     ORDER BY x.date_incident DESC, x.id DESC LIMIT $3`, [enseigneId, sceneId, limite]);
  return r.rows;
}

/** Enregistre une leçon (toujours non_verifiee) et ses REX sources en une transaction. Doublon exact : renvoyé tel quel. */
export async function enregistrerLecon(pool, { sceneId, texte, etiquettes = [], confiance = null, auteur = 'analyste', rexIds = [], provenance = {} }) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const prov = { auteur, date: new Date().toISOString(), ...provenance };
    let r = await c.query(
      `INSERT INTO lecons (scene_id, texte, etiquettes, confiance, auteur, provenance) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (scene_id, (md5(texte))) DO NOTHING RETURNING *`,
      [sceneId, texte, etiquettes, confiance, auteur, prov]);
    if (!r.rowCount) r = await c.query('SELECT * FROM lecons WHERE scene_id=$1 AND md5(texte)=md5($2)', [sceneId, texte]);
    for (const rexId of rexIds) {
      await c.query('INSERT INTO lecons_sources (lecon_id, rex_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [r.rows[0].id, rexId]);
    }
    await c.query('COMMIT');
    return { ...r.rows[0], rex_ids: rexIds };
  } catch (e) { await c.query('ROLLBACK'); throw e; }
  finally { c.release(); }
}

/** Change le statut d'une leçon. validee_par_simulation exige le run qui la valide (la base le vérifie aussi). */
export async function changerStatutLecon(pool, { id, statut, runId = null }) {
  const r = await pool.query(
    'UPDATE lecons SET statut=$2, run_validation=$3 WHERE id=$1 RETURNING *',
    [id, statut, statut === 'validee_par_simulation' ? runId : null]);
  return r.rows[0] ?? null;
}

/** Leçons à relire avant une décision : celles dont les étiquettes recoupent la situation (Jaccard), avec leurs REX sources. */
export async function lireLecons(pool, { sceneId, etiquettes = [], limite = 10 }) {
  const r = await pool.query(
    `SELECT l.*,
            COALESCE(cardinality(ARRAY(SELECT unnest(l.etiquettes) INTERSECT SELECT unnest($2::text[])))::float
              / NULLIF(cardinality(ARRAY(SELECT unnest(l.etiquettes) UNION SELECT unnest($2::text[]))), 0), 0) AS similarite,
            ARRAY(SELECT rex_id FROM lecons_sources s WHERE s.lecon_id = l.id ORDER BY rex_id) AS rex_ids
     FROM lecons l
     WHERE l.scene_id=$1 AND (cardinality($2::text[]) = 0 OR l.etiquettes && $2::text[])
     ORDER BY similarite DESC, l.confiance DESC NULLS LAST, l.id DESC LIMIT $3`,
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
