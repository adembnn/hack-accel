# Déployer sur Aiven Runtime (lot aiven, ticket #11)

Sources : `recherche/08-aiven-runtime-pas-a-pas.md` (docs Aiven lues le 22 oct. 2026). [DOC] = établi par une page lue ; [SUPPOSÉ] = à vérifier à l'écran ;
[MESURÉ] = essayé en local aujourd'hui. Rien de ce fichier n'a encore été exécuté sur Aiven : aucun accès ni clé n'a été utilisé.

## Ce qui est prêt (rien à coder avant de cliquer)
- **Une seule image** (`Dockerfile` à la racine, modifié par ce lot) : build Vite, puis `node src/server/serveur.mjs` qui sert `dist/` ET l'API, lit `PORT` (8080) et
  `DATABASE_URL`, applique le schéma (idempotent) au démarrage, et écoute. Copie `infra/` et `src/server/`, installe `pg` en production. [MESURÉ] ci-dessous.
- **Preuve locale** (`docker build` puis `docker run` avec une `DATABASE_URL` locale jetable, 22 oct.) : `GET /sante` -> 200 `{"ok":true,"base":"ok"}`, `GET /` -> 200 `text/html`,
  `POST` sans jeton -> 401, `POST /rex` avec jeton -> 201 et la ligne relue en base (`SELECT ... FROM rex_crises`), SSE du tableau commun reçu (`event: tableau`).
  Conteneurs, images et base de test supprimés ensuite.
- `infra/verifier-deploiement.mjs <url>` : vérifie `/sante`, écrit un REX marqué `test-deploiement`, le relit, reçoit un événement SSE, mesure la latence de chaque étape. Sans secret dans la sortie.
- `infra/PLAN-B.md` : écran de démo en rejeu sans base, et ce qu'on dit au jury si Aiven n'est pas prêt à 15 h.
- Point d'extension : `creerServeur(pool, { routesExtra: [...] })` accepte des fonctions `async (req, res, url, ctx) => boolean` essayées avant le 404, pour brancher plus tard
  `routeDirecteur` (proto/directeur) et `routeAgents` (proto/personnages) sans modifier le serveur. Rien n'est importé aujourd'hui. Les POST passent déjà par le jeton `WRITE_TOKEN`.

## Variables d'environnement
| Variable | Qui la pose | Rôle |
|---|---|---|
| `DATABASE_URL` | **injectée par Aiven** quand le service PostgreSQL est connecté à l'application [DOC] | connexion TLS ; `db.ouvrir()` ajoute `uselibpqcompat=true` (exigé par `pg` sur Runtime [DOC]). Jamais écrite dans un fichier ni dans le chat. |
| `WRITE_TOKEN` | **vous**, dans la Console, case « Secret » | sans lui toutes les écritures HTTP répondent 401 ; avec lui il faut `Authorization: Bearer <jeton>`. Choisir une longue valeur aléatoire. Le même jeton se donne à `verifier-deploiement.mjs` (variable d'environnement). |
| `ANTHROPIC_API_KEY` | **vous**, case « Secret » | pour les lots decideurs/agents (Claude Haiku 5.5 et Sonnet 5.5). Ce lot (données) n'en a pas besoin ; ne la saisir que si l'application déployée appelle Claude (appels payants : accord d'Adem). |
| `PORT` | optionnelle, défaut 8080 | doit correspondre à `EXPOSE 8080`. |
| `SSE_DUREE_MAX_MS` | optionnelle, défaut 600000 | durée maximale d'une connexion de flux ; le navigateur se reconnecte seul. |

Modifier une variable redéploie le MÊME commit [DOC] : pour un nouveau code, il faut « Deploy latest commit ».

## Étapes exactes dans la console Aiven (pour Titouan, quand Adem a donné l'accès)
1. **Compte** : ouvrir `https://console.aiven.io`, s'inscrire (e-mail, ou GitHub/Google). L'essai de 30 jours avec 300 $ de crédit couvre Runtime et les services payants [DOC] ;
   les crédits hackathon d'Accel s'ajoutent par un code (« crédits » dans le groupe de facturation) : à demander à Adem [SUPPOSÉ pour le détail]. Rejoindre ou créer l'organisation d'Adem :
   il faut en être **admin** pour connecter GitHub [DOC].
2. **Projet** : créer (ou ouvrir) un projet, par exemple `refuge`. Région au choix (le plan gratuit n'en laisse pas choisir [DOC]).
3. **Service PostgreSQL** : « Create service » -> PostgreSQL -> plan **Free** (1 CPU, 1 Go de RAM, 1 Go de disque, 20 connexions, pas de carte bancaire [DOC]) -> attendre « Running ».
   Une seule base gratuite par organisation [DOC] : si elle existe déjà, la réutiliser.
4. **Autoriser GitHub** : Runtime -> « Deploy application » -> connecter le compte GitHub (installer l'application GitHub d'Aiven) [DOC].
   Pour une organisation GitHub il faut en être propriétaire [DOC]. **Si le dépôt `adembnn/hack-accel` n'est pas autorisé pour l'application Aiven** (Adem n'est pas le propriétaire de l'installation,
   ou le dépôt n'apparaît pas dans la liste) : déployer depuis un **fork**. Créer le fork sur le compte GitHub de Titouan (`gh repo fork adembnn/hack-accel --clone=false`),
   autoriser l'application Aiven sur ce fork, déployer sa branche `main`. Avant chaque déploiement, resynchroniser : `gh repo sync <compte>/hack-accel --branch main`
   (le fork ne se met pas à jour tout seul).
5. **Créer l'application** : dépôt, branche `main`, « Next », manifeste `Dockerfile` (pas `infra/Dockerfile.plan-b`), « Scan » : le port **8080** doit être détecté (via `EXPOSE`).
   Ajouter le port public HTTP si la Console le demande [DOC]. « Deploy ». Le premier déploiement prend quelques minutes [SUPPOSÉ : 3 à 8 min, à chronométrer].
6. **Connecter la base** : dans l'application, « Connected services » -> connecter le service PostgreSQL. `DATABASE_URL` apparaît dans les variables [DOC]. Ajouter `WRITE_TOKEN` (et `ANTHROPIC_API_KEY` si besoin) en **Secret**.
   Cliquer **« Deploy latest commit »** (menu « Actions » de l'application) : l'application redémarre avec la base [DOC : un push ne redéploie pas, une variable redéploie l'ancien commit].
7. **Récupérer l'URL** : « Connection information » de l'application, domaine `*.aiven.app` [DOC]. Garder cette URL (les domaines personnalisés passent par Cloudflare : pas ce soir [DOC]).
8. **Vérifier** : depuis un poste, `WRITE_TOKEN=<jeton> node infra/verifier-deploiement.mjs https://<domaine>.aiven.app --scene forum-des-halles`.
   Attendu : 6 lignes OK. Si « POST /enseignes » répond 400, la scène `forum-des-halles` n'existe pas encore : étape 9.
9. **Charger le corpus de REX publics** (crée la scène et les 13 REX) : `DATABASE_URL=<url de la base, depuis la Console> node src/server/charger-rex.mjs recherche/09-rex-seed.json` depuis un poste
   où ce fichier existe (il n'est pas dans l'image). URL de base à ne jamais coller dans le chat, un commit ou un ticket. Relancer l'étape 8.
10. **Rôle d'écriture** : le schéma crée le rôle `enseigne_ecriture` et exécute `GRANT enseigne_ecriture TO <utilisateur> WITH SET TRUE` (PostgreSQL 16+ : sans `SET TRUE`, l'utilisateur de l'application
    ne peut pas endosser le rôle). [MESURÉ] avec un utilisateur non superuser local. Sur Aiven, si les journaux affichent « rôle enseigne_ecriture indisponible », se connecter en `avnadmin` et lancer
    `GRANT enseigne_ecriture TO <utilisateur de DATABASE_URL> WITH SET TRUE;` puis redéployer. Sans cela le serveur écrit avec le propriétaire (moins sûr, mais fonctionnel).
11. **Routine** : après chaque fusion dans `main` (ou chaque resynchronisation du fork) -> « Deploy latest commit ». Pinger `/sante` toutes les 5 minutes pendant la préparation :
    la base gratuite peut être éteinte sans activité [DOC].

## Points à demander à Adem
- Accès à l'organisation Aiven (admin) et crédits hackathon ; le service PostgreSQL existe-t-il déjà ?
- Le dépôt `adembnn/hack-accel` peut-il être autorisé pour l'application Aiven, sinon accord pour un fork de Titouan.
- Valeur de `WRITE_TOKEN` à convenir (à transmettre hors du chat public) ; accord pour `ANTHROPIC_API_KEY` sur l'application déployée.
- Gel des déploiements avant la soumission de 15 h 30 : qui clique « Deploy latest commit » en dernier.

## Autres faits repris de la recherche
[DOC] 20 connexions maximum sans pooling (pool de 5 + 1 connexion dédiée au LISTEN) ; HTTP seulement derrière HTTPS 443 (donc SSE, pas de WebSocket) ; pgvector disponible
(`CREATE EXTENSION vector`, appliqué par le schéma s'il existe) ; ports sortants bloqués : 23, 25, 119, 135, 137-139, 179, 445, 465, 631.
[SUPPOSÉ] droit CREATEROLE de l'utilisateur de l'application ; durée du premier déploiement. ClickHouse hors périmètre (pas de plan gratuit, volume démo trop faible : voir le TXT).

## Fichiers du lot
`Dockerfile` (image unique), `infra/schema.sql`, `infra/schema-vecteur.sql`, `infra/verifier-deploiement.mjs`, `infra/PLAN-B.md`, `infra/Dockerfile.plan-b`,
`infra/couche-de-donnees.txt`, `infra/mesure-volume.sql`.
Test local derrière un proxy qui intercepte TLS : `docker build --build-arg NPM_STRICT_SSL=false .` (jamais sur Aiven).
