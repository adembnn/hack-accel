-- Mesure ponctuelle (jetable) : une simulation de 5 000 personnes, 1 position par seconde, 10 minutes = 3 000 000 lignes.
-- Lancer sur une base de test locale : psql -f infra/mesure-volume.sql
\timing on
CREATE TEMP TABLE positions (run integer, t integer, personne integer, x real, y real, niveau smallint);
INSERT INTO positions SELECT 1, t, p, random()*200, random()*200, (random()*5)::int
  FROM generate_series(0,599) t, generate_series(1,5000) p;
SELECT count(*) AS lignes, pg_size_pretty(pg_total_relation_size('positions')) AS taille FROM positions;
-- Densité par cellule de 2 m et par minute (la requête que le jumeau poserait pour la carte de chaleur)
SELECT count(*) AS cellules, max(n) AS pic FROM (
  SELECT t/60 AS minute, niveau, (x/2)::int AS cx, (y/2)::int AS cy, count(*) AS n
  FROM positions GROUP BY 1,2,3,4) s;
