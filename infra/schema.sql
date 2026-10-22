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

-- Les enseignes et occupants du Forum : ceux qui racontent leurs crises passées.
CREATE TABLE IF NOT EXISTS enseignes (
  id       text PRIMARY KEY,                   -- ex. 'ugc-cine-cite-les-halles'
  scene_id text NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  nom      text NOT NULL,
  zone     text NOT NULL DEFAULT '',           -- niveau / secteur du Forum
  cree_le  timestamptz NOT NULL DEFAULT now()
);

-- Retours d'expérience (REX) : une situation de crise passée, renseignée par une enseigne.
CREATE TABLE IF NOT EXISTS rex_crises (
  id                 bigserial PRIMARY KEY,
  enseigne_id        text NOT NULL REFERENCES enseignes(id) ON DELETE CASCADE,
  date_incident      date NOT NULL,
  zone               text NOT NULL DEFAULT '',
  type_incident      text NOT NULL,            -- 'evacuation', 'panique', 'incendie', 'metro_ferme'...
  description        text NOT NULL,            -- ce qui s'est passé
  decisions_prises   text NOT NULL DEFAULT '',
  resultat           text NOT NULL DEFAULT '',
  duree_minutes      integer CHECK (duree_minutes >= 0),
  personnes_touchees integer CHECK (personnes_touchees >= 0),
  lecons_enseigne    text NOT NULL DEFAULT '', -- leçons telles que l'enseigne les formule
  etiquettes         text[] NOT NULL DEFAULT '{}', -- même vocabulaire que memoire.etiquettes
  cree_le            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rex_enseigne_idx ON rex_crises (enseigne_id, date_incident DESC);
CREATE INDEX IF NOT EXISTS rex_etiquettes_idx ON rex_crises USING gin (etiquettes);

-- Leçons tirées par la cellule d'agents en analysant les REX ; relues par les décideurs avant chaque décision.
CREATE TABLE IF NOT EXISTS lecons (
  id         bigserial PRIMARY KEY,
  scene_id   text NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  texte      text NOT NULL,
  etiquettes text[] NOT NULL DEFAULT '{}',
  confiance  numeric(4,3) CHECK (confiance BETWEEN 0 AND 1),
  auteur     text NOT NULL DEFAULT 'analyste',
  cree_le    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lecons_etiquettes_idx ON lecons USING gin (etiquettes);

-- Traçabilité : quels REX fondent quelle leçon.
CREATE TABLE IF NOT EXISTS lecons_sources (
  lecon_id bigint NOT NULL REFERENCES lecons(id) ON DELETE CASCADE,
  rex_id   bigint NOT NULL REFERENCES rex_crises(id) ON DELETE CASCADE,
  PRIMARY KEY (lecon_id, rex_id)
);
CREATE INDEX IF NOT EXISTS lecons_sources_rex_idx ON lecons_sources (rex_id);

-- Garde-fous du red team (recherche/10-red-team-decideurs-aiven.md) ---------------------------------

-- A2 : un REX dont le texte ressemble à une consigne est MARQUÉ (jamais corrigé ni supprimé).
ALTER TABLE rex_crises ADD COLUMN IF NOT EXISTS suspect boolean NOT NULL DEFAULT false;
ALTER TABLE rex_crises ADD COLUMN IF NOT EXISTS motifs_suspects text[] NOT NULL DEFAULT '{}';

-- A3 : une leçon n'est pas un fait. Statut + provenance ; elle ne change aucun levier tant qu'elle n'est pas
-- validée par une simulation (statut = validee_par_simulation, avec le run qui la valide).
ALTER TABLE lecons ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'non_verifiee';
ALTER TABLE lecons ADD COLUMN IF NOT EXISTS provenance jsonb NOT NULL DEFAULT '{}'::jsonb; -- {source, auteur, run_id, date}
ALTER TABLE lecons ADD COLUMN IF NOT EXISTS run_validation uuid REFERENCES runs(id) ON DELETE SET NULL;
DO $$ BEGIN
  ALTER TABLE lecons ADD CONSTRAINT lecons_statut_check
    CHECK (statut IN ('non_verifiee','contradictoire','validee_par_simulation'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE lecons ADD CONSTRAINT lecons_validee_exige_run
    CHECK (statut <> 'validee_par_simulation' OR run_validation IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- REX publics (chargés par src/server/charger-rex.mjs) : source citée, confiance, empreinte anti-doublon (A15).
ALTER TABLE rex_crises ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE rex_crises ADD COLUMN IF NOT EXISTS confiance text;
ALTER TABLE rex_crises ADD COLUMN IF NOT EXISTS empreinte text;
DO $$ BEGIN
  ALTER TABLE rex_crises ADD CONSTRAINT rex_confiance_check CHECK (confiance IS NULL OR confiance IN ('basse','moyenne','haute'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS rex_empreinte_uniq ON rex_crises (empreinte) WHERE empreinte IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lecons_texte_uniq ON lecons (scene_id, md5(texte));

-- A4 : rôle des enseignes = INSERT dans rex_crises, rien d'autre (ni lecture, ni DDL, ni les autres tables).
-- Sans mot de passe ni LOGIN : le serveur l'endosse par SET ROLE, ou un administrateur lui donne un accès.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'enseigne_ecriture') THEN
    CREATE ROLE enseigne_ecriture NOLOGIN;
  END IF;
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM enseigne_ecriture;
  GRANT USAGE ON SCHEMA public TO enseigne_ecriture;
  GRANT INSERT ON rex_crises TO enseigne_ecriture;
  GRANT USAGE ON SEQUENCE rex_crises_id_seq TO enseigne_ecriture;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'rôle enseigne_ecriture non créé : droit CREATEROLE manquant (à faire par un administrateur)';
END $$;
