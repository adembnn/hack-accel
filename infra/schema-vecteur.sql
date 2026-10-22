-- Mémoire sémantique (pgvector). Optionnel : appliqué par db.migrer() seulement si l'extension existe
-- (Aiven PostgreSQL la propose ; le postgres:16 de base non). Dimension 8 : vecteurs de démonstration calculés
-- hors ligne ou factices, aucun appel payant à un modèle d'embeddings sans l'accord d'Adem.
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE lecons  ADD COLUMN IF NOT EXISTS embedding vector(8);
ALTER TABLE memoire ADD COLUMN IF NOT EXISTS embedding vector(8);
CREATE INDEX IF NOT EXISTS lecons_embedding_idx  ON lecons  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS memoire_embedding_idx ON memoire USING hnsw (embedding vector_cosine_ops);
