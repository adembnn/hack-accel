# Déployer sur Aiven Runtime (lot aiven, ticket #11)

Sources : `reports/hackathon-terrain.md`, section « Aiven Runtime en pratique » (docs Aiven lues le 21 oct. 2026).
`[?]` = non vérifié, à confirmer sur place avec Aiven.

Aiven Runtime fait tourner un conteneur (une application emballée dans une boîte standard) dans le même projet que la
base PostgreSQL Aiven. Il ne lit pas le code : il lit un `Dockerfile` à la racine du dépôt (ports lus depuis `EXPOSE`).

## Ce que ce lot fournit
- `infra/schema.sql` : le schéma, idempotent. `src/server/migrer.mjs` l'applique ; `serveur.mjs` le rejoue aussi au démarrage.
- `src/server/serveur.mjs` : serveur HTTP sans framework, port `PORT` (défaut 8080), `/sante` pour la vérification.
- `infra/Dockerfile.indicatif` : un exemple minimal du serveur seul. **Il ne remplace pas le `Dockerfile` du socle (#6)**, qui
  construit aussi l'interface Vite et doit lancer `node src/server/serveur.mjs` (ou importer `creerServeur`) pour servir
  `dist/` et l'API sur le même port.

## Variables d'environnement
| Variable | Qui la pose | Rôle |
|---|---|---|
| `DATABASE_URL` | injectée par Aiven Runtime quand une base PostgreSQL du projet est liée (`[?]` à vérifier dans « Connection information ») | connexion TLS (`sslmode=require`) lue par `db.mjs` |
| `PORT` | optionnelle, défaut 8080 | port d'écoute ; doit correspondre à `EXPOSE` |
| `ANTHROPIC_API_KEY` etc. | secrets saisis dans la Console Aiven, jamais dans le dépôt | pour le lot decideurs, pas pour ce lot |

Le code n'attend que des URI (pas de `PGHOST` séparé). En local : `DATABASE_URL` dans l'environnement du shell, jamais dans un fichier lu par ce lot.

## Étapes (Console Aiven)
1. Projet Aiven > créer (ou réutiliser) un service PostgreSQL. Le plan gratuit suffit (1 CPU, 1 Go) pour la démo ; voir le TXT pour les volumes.
2. Runtime > Deploy application > connecter GitHub > dépôt `adembnn/hack-accel`, branche `main` > choisir le manifeste `Dockerfile` > Scan.
3. Lier la base PostgreSQL au service pour obtenir `DATABASE_URL` ; ajouter les secrets éventuels dans la Console.
4. Ajouter un port public HTTP (8080) ; le domaine apparaît dans « Connection information ».
5. Deploy. **Un push GitHub ne redéploie pas** : après chaque fusion dans `main`, cliquer « Deploy latest commit ».
6. Vérifier : `curl -i https://<domaine>/sante` doit répondre `200 {"ok":true,"base":"ok"}`. C'est le critère « URL hébergée qui répond 200 ».

## Points à demander à Adem
- Qui a accès à l'organisation Aiven (compte, crédits hackathon) : je n'ai ni accès ni clé, et je n'en crée pas.
- Le service PostgreSQL existe-t-il déjà (le socle #6 « branche PostgreSQL Aiven ») ? Sinon qui le crée, et sous quel nom ?
- Le `Dockerfile` du socle : confirmer qu'il expose le port 8080 et démarre `src/server/serveur.mjs`.
- Quel domaine public pour la démo, et qui clique « Deploy latest commit » avant 15 h 30 (gel des déploiements).
- GPU : non utile ici (rendu WebGL côté navigateur), pas de demande à Aiven.
- ClickHouse n'est pas dans la détection Compose d'Aiven `[?]` : à n'ajouter que si le volume l'exige (voir le TXT).

## Couture avec le socle (#6), à traiter par l'orchestrateur du socle
- Le socle (proto/socle) sert dist/ et /sante depuis `src/app/serveur.mjs`. Le serveur de ce lot (`src/server/serveur.mjs`) fait la même chose
  (dist/ + /sante avec test de la base) EN PLUS de l'API : pour une seule URL Runtime, le `Dockerfile` doit lancer `node src/server/serveur.mjs`
  et copier `infra/` et `src/server/` dans l'image (le serveur lit `infra/schema.sql`). Voir `infra/Dockerfile.indicatif`. Le Dockerfile du socle n'est pas modifié par ce lot.
- `pg` a été ajouté aux dépendances et `test:db` branché sur les tests (lignes de package.json du socle : seuls changements hors src/server et infra, à garder en rebasant).
- Ce lot dépend de proto/socle fusionné localement ; au moment de la PR, rebaser sur main quand le socle d'Adem y sera.
- Variables : `DATABASE_URL` (injectée par Aiven quand le service est connecté), `PORT`. `DATABASE_URL` est déjà dans `.env.example`.
- Pas de commande de pré-déploiement sur Runtime : le serveur rejoue le schéma au démarrage (idempotent) ; /sante fait un SELECT 1, un ping régulier garde la base gratuite éveillée.
- Faits Aiven repris de recherche/08 : [établi] 20 connexions max sans pooling (pool de 5 + 1 LISTEN), HTTP seulement derrière HTTPS 443 (donc SSE, pas de WebSocket),
  pgvector disponible, service gratuit éteint sans activité ; [supposé] droit CREATEROLE pour le rôle enseigne_ecriture, durée du premier déploiement (3 à 8 min).
- Corpus de départ : `DATABASE_URL=... node src/server/charger-rex.mjs` (idempotent).

## Pour une seule URL avec l'API : le Dockerfile du socle doit changer (action du socle, pas de ce lot)
Le `Dockerfile` du socle (fusionné dans main) lance `node src/app/serveur.mjs`, qui sert `dist/` et `/sante` sans base ni API.
Pour qu'une seule URL Runtime serve l'interface ET l'API de données, son `CMD` doit devenir `node src/server/serveur.mjs`
(ce serveur sert aussi `dist/` et répond sur `/sante` en vérifiant la base), et l'image doit contenir `infra/` (schema.sql, schema-vecteur.sql),
`src/server/`, `node_modules` de production (dépendance `pg`) : `RUN npm ci --omit=dev` dans l'étage final ou copie de `node_modules`.
Variables : `DATABASE_URL` (injectée par Aiven), `WRITE_TOKEN` (secret saisi dans la Console, sans lui toutes les écritures HTTP sont refusées en 401), `PORT`.
Ce lot n'a pas modifié ce Dockerfile : à demander à l'orchestrateur du socle (commentaire sur #6).

## Ce qu'il reste à faire dans la console Aiven (quand Adem aura donné l'accès)
1. Créer le service PostgreSQL (plan gratuit : 1 Go, 20 connexions) dans le projet, région au choix d'Adem.
2. Créer l'application Runtime depuis le dépôt GitHub (branche à choisir : main), manifeste `Dockerfile`, port 8080.
3. Connecter le service PostgreSQL à l'application : `DATABASE_URL` apparaît dans ses variables. Ajouter `WRITE_TOKEN` (case Secret).
4. Deploy, puis `curl -i https://<domaine>.aiven.app/sante` doit répondre 200 `{"ok":true,"base":"ok"}` (le schéma s'applique au démarrage).
5. Charger le corpus : `DATABASE_URL=<url> node src/server/charger-rex.mjs` depuis un poste (URL à ne jamais coller dans le chat ni un commit).
6. Vérifier le rôle `enseigne_ecriture` (`SELECT rolname FROM pg_roles`) ; sinon le serveur écrit avec le propriétaire (journal : « rôle enseigne_ecriture indisponible »).
7. Après chaque fusion dans main : Actions, « Deploy latest commit » (un push ne redéploie pas). Pinger `/sante` régulièrement : la base gratuite peut s'éteindre.
