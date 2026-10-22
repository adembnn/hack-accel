# Plan B : écran de démo en rejeu, sans base de données

À déclencher si, à 15 h, Aiven n'est toujours pas accessible (pas d'accès à l'organisation, `DATABASE_URL` absente, `/sante` en 503
qui ne se règle pas en 10 minutes) ou si une panne survient en plein pitch. Le plan B ne dépend ni d'Aiven ni de PostgreSQL.

## Ce qu'on sert
- `dist/` : l'interface construite (`npm run build`).
- Le fichier de résultats pré-calculés (`resultats.json`, produit par les lots simulation et décideurs en mode rejeu) : à placer dans `public/`
  de Vite pour qu'il se retrouve dans `dist/resultats.json`. Son chemin exact est à confirmer avec le lot qui le produit (il n'existe pas encore dans le dépôt
  à l'heure où ce plan est écrit).
- Le serveur du socle `src/app/serveur.mjs` : il sert `dist/` et `/sante`, sans base, sans jeton, sans variable d'environnement obligatoire.

## Trois façons, de la plus rapide à la plus lente
1. **Sur l'ordinateur de la démo, sans Docker** (2 minutes) : `npm run build`, puis `node src/app/serveur.mjs` (port 8080 par défaut) et ouvrir `http://localhost:8080`.
2. **Avec Docker, image dédiée** : `docker build -f infra/Dockerfile.plan-b -t refuge-plan-b .` puis `docker run -p 8080:8080 refuge-plan-b`.
3. **Sur Aiven Runtime sans base** : dans la Console, choisir le manifeste `infra/Dockerfile.plan-b` au lieu de `Dockerfile` (même clic « Deploy latest commit »).
   Utile si Runtime répond mais que la base gratuite est éteinte ou inaccessible : l'URL hébergée répond alors 200 sur `/sante`, sans toucher à PostgreSQL.

## Vérifier avant de monter sur scène
- `curl -i http://localhost:8080/sante` répond 200 ; la page d'accueil s'affiche ; le parcours de démo se rejoue en entier avec le réseau coupé.
- Faire cette répétition une fois à 14 h 30, pas pendant le pitch.

## Ce qu'on dit au jury (vérité d'abord)
- Ce qui est vrai en plan B : l'écran qu'ils voient rejoue des résultats de simulation calculés à l'avance (sources de rejeu, mêmes graines), pas un calcul en direct ni une écriture en base en direct.
- À dire : « Notre déploiement Aiven n'est pas finalisé à cette heure ; voici la démo en rejeu. La couche de données (PostgreSQL, 11 tables, mémoire des retours d'expérience, tableau commun en temps réel)
  est testée en local : plus de 30 tests passent sur une vraie base, dont la reprise du flux après coupure. »
- À ne pas dire : que l'application tourne sur Aiven, que les chiffres affichés sont écrits ou lus en direct dans PostgreSQL, ou que la mémoire apprend en direct, tant que ce n'est pas le cas.
- Montrer, si le jury le demande, la sortie de `npm run test:db` et le schéma `infra/schema.sql` : ce sont des preuves réelles de la couche de données, même sans l'URL Aiven.
- Si Aiven revient plus tard : lancer `node infra/verifier-deploiement.mjs <url>` et ne le dire qu'une fois toutes les lignes en OK.

## Ce qui est perdu en plan B
Écritures en direct (REX des enseignes, tableau commun partagé entre deux navigateurs), mémoire relue avant décision, URL qui prouve « la donnée au cœur »
chez Aiven. Le critère « donnée au cœur » repose alors sur les tests locaux et le TXT `infra/couche-de-donnees.txt`, à présenter comme tels.
