-- Schéma PostgreSQL du jumeau 3D du Forum des Halles (lot aiven, ticket #11).
-- Idempotent : on peut le rejouer à chaque démarrage sans rien casser ni perdre.
-- Appliqué par `node src/server/migrer.mjs` (variable d'environnement DATABASE_URL).

-- Les scènes : le décor 3D (niveaux, portes, grille praticable) tel que produit par le lot jumeau-3d.
CREATE TABLE IF NOT EXISTS scenes (
  id         text PRIMARY KEY,                 -- ex. 'forum-des-halles'
  nom        text NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  contenu    jsonb NOT NULL DEFAULT '{}'::jsonb, -- scene.json + navgrid
  cree_le    timestamptz NOT NULL DEFAULT now()
);

-- Les contraintes posées sur une scène (bouche de métro fermée, issue bloquée, barrage...).
CREATE TABLE IF NOT EXISTS contraintes (
  id         bigserial PRIMARY KEY,
  scene_id   text NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  type       text NOT NULL,                    -- 'issue', 'bouche_metro', 'escalator', 'zone'...
  cible      text NOT NULL,                    -- identifiant de l'objet dans la scène
  etat       text NOT NULL CHECK (etat IN ('ouvert','ferme','limite','impraticable')),
  parametres jsonb NOT NULL DEFAULT '{}'::jsonb,
  pose_par   text NOT NULL DEFAULT 'utilisateur',
  pose_le    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contraintes_scene_idx ON contraintes (scene_id, pose_le DESC);

-- Un run = une simulation complète d'un plan, avec sa graine aléatoire (rejouable à l'identique).
CREATE TABLE IF NOT EXISTS runs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id   text NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  plan       text NOT NULL,                    -- 'consigne-19-oct', 'plan-decideurs'...
  graine     integer NOT NULL,
  statut     text NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','termine','echec')),
  parametres jsonb NOT NULL DEFAULT '{}'::jsonb,
  debut      timestamptz NOT NULL DEFAULT now(),
  fin        timestamptz
);
CREATE INDEX IF NOT EXISTS runs_scene_idx ON runs (scene_id, debut DESC);
CREATE INDEX IF NOT EXISTS runs_plan_idx ON runs (plan, graine);

-- Les décisions des décideurs pendant un run (une ligne par levier actionné).
CREATE TABLE IF NOT EXISTS decisions (
  id             bigserial PRIMARY KEY,
  run_id         uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  minute_simulee integer NOT NULL CHECK (minute_simulee >= 0),
  decideur       text NOT NULL,                -- 'prefecture', 'ratp', 'securite', 'directeur'
  levier         text NOT NULL,                -- 'fermer_issue', 'guidage', 'message_zone'...
  valeur         jsonb NOT NULL DEFAULT '{}'::jsonb,
  justification  text NOT NULL DEFAULT '',
  score          jsonb,                        -- notes selon la grille de critères
  cree_le        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decisions_run_idx ON decisions (run_id, minute_simulee);

-- La mémoire longue : les cas passés, pour retrouver les plus proches d'une situation neuve.
CREATE TABLE IF NOT EXISTS memoire (
  id          bigserial PRIMARY KEY,
  scene_id    text NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  run_id      uuid REFERENCES runs(id) ON DELETE SET NULL,
  etiquettes  text[] NOT NULL DEFAULT '{}',    -- ex. {'issue_fermee:sortie-3','metro_ferme:chatelet'}
  signature   jsonb NOT NULL DEFAULT '{}'::jsonb, -- chiffres de la situation (foule, issues, heure)
  resume      text NOT NULL,
  plan_retenu text,
  note        numeric(6,3),                    -- note globale du plan retenu (plus haut = meilleur)
  cree_le     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memoire_etiquettes_idx ON memoire USING gin (etiquettes);
CREATE INDEX IF NOT EXISTS memoire_scene_idx ON memoire (scene_id, cree_le DESC);

-- Le tableau commun : ce que les agents et l'interface s'écrivent en direct.
CREATE TABLE IF NOT EXISTS tableau_commun (
  id         bigserial PRIMARY KEY,
  run_id     uuid REFERENCES runs(id) ON DELETE CASCADE,
  auteur     text NOT NULL,
  genre      text NOT NULL,                    -- 'contrainte', 'decision', 'alerte', 'note'
  contenu    jsonb NOT NULL DEFAULT '{}'::jsonb,
  cree_le    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tableau_run_idx ON tableau_commun (run_id, id);

-- Chaque ligne du tableau commun prévient les serveurs à l'écoute (SSE) via NOTIFY.
CREATE OR REPLACE FUNCTION tableau_notifier() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('tableau_commun', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tableau_notifier_trg ON tableau_commun;
CREATE TRIGGER tableau_notifier_trg AFTER INSERT ON tableau_commun
  FOR EACH ROW EXECUTE FUNCTION tableau_notifier();

-- Le journal des chiffres : tout nombre affiché ou prononcé, avec sa source, pour le vérificateur de chiffres.
CREATE TABLE IF NOT EXISTS journal_chiffres (
  id         bigserial PRIMARY KEY,
  run_id     uuid REFERENCES runs(id) ON DELETE CASCADE,
  nom        text NOT NULL,                    -- 'personnes_ecrasees', 'temps_evacuation_s'...
  valeur     numeric NOT NULL,
  unite      text NOT NULL DEFAULT '',
  source     text NOT NULL,                    -- 'simulation', 'mesure publiée', 'presse'
  verifie    boolean NOT NULL DEFAULT false,   -- retrouvé par le vérificateur
  cree_le    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chiffres_run_idx ON journal_chiffres (run_id, nom);
