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

## Bloqué par le socle (#6)
`package.json` (dépendance `pg`, scripts `test:db` = `node --test src/server/db.test.mjs`, `start`), `Dockerfile` final, et le
branchement du serveur sur `dist/`. En attendant, `pg` est installé hors dépôt (`npm install --no-save pg`).
