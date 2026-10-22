# 08 - Aiven Runtime pas à pas et couche de données minimale

Décision débloquée (ticket #11, lot `aiven`) : comment déployer l'application sur Aiven Runtime et quelle couche de données montrer au jury pour le critère « la donnée au cœur », en une soirée.
Complète 04-flux-et-apis-paris.md (qui parle déjà de Kafka pour les flux). Recherche faite le 2026-10-22 via Keenable, aucun appel payant.

## Verdict en 6 lignes

1. Runtime déploie depuis un dépôt GitHub (branche choisie), construit l'image depuis un `Dockerfile`, détecte le port via `EXPOSE`, expose en HTTPS 443.
2. Les URL de connexion arrivent en variables d'environnement toutes seules quand on « connecte » un service (`DATABASE_URL` pour PostgreSQL).
3. Un push GitHub ne redéploie PAS : il faut cliquer « Deploy latest commit ». À mettre dans la routine.
4. Couche minimale à montrer : PostgreSQL Aiven seul, avec 3 rôles visibles (tables relationnelles, `LISTEN/NOTIFY` pour le tableau commun, `pgvector` pour la mémoire). Une seule brique, bien démontrée.
5. Kafka seulement si le flux Vélib/temps réel est ingéré en direct (déjà évoqué en 04). ClickHouse : non ce soir (plus petit plan payant à partir de 155 $/mois, pas de plan gratuit).
6. Point à confirmer avec Adem : quel plan Runtime, quels crédits, et quelle organisation Aiven (voir questions).

## Établi (source lue) ou supposé

Légende : [E] établi par une page lue ; [S] supposé ou estimation de ma part.

### Aiven Runtime

- [E] Runtime = déployer des applications conteneurisées dans le projet Aiven, à côté des services de données. Page « generally available ». Sources : https://aiven.io/docs/products/aiven-apps , https://aiven.io/runtime
- [E] Déploiement depuis GitHub : console, projet, Runtime, Deploy application, compte GitHub, dépôt, branche, Next, choisir le manifeste, Scan, Deploy. Source : https://aiven.io/docs/products/runtime/deploy-apps
- [E] Connecter le compte GitHub exige d'être admin de l'organisation Aiven ; pour une organisation GitHub, il faut en être propriétaire ; un compte GitHub personnel est possible. Même source, et https://aiven.io/docs/products/runtime/connect-github-account
- [E] Un push ne déclenche pas de déploiement. Redéployer : application, Actions, « Deploy latest commit ». Même source.
- [E] Manifestes reconnus : `Dockerfile`, `Containerfile`, `Dockerfile.*`, `docker-compose.yml`/`compose.yaml`, etc. Le port vient de `EXPOSE`, les variables de `ENV`. Source : https://aiven.io/docs/products/runtime/manifest-files/containerfiles
- [E] Ports : le point d'entrée public est toujours HTTPS 443, TLS terminé par Aiven, transmis au conteneur en HTTP simple. HTTP uniquement : pas de gRPC, ni HTTP/2, ni TCP brut. Ajouter ou changer un port redéploie. Source : https://aiven.io/docs/products/runtime/ports
- [E] Sortie réseau : certains ports sortants sont bloqués (23, 25, 119, 135, 137-139, 179, 445, 465, 631). Même source. Les API HTTPS publiques (Vélib, IDFM) passent donc.
- [E] Le nom de domaine par défaut de l'appli est dans « Connection information » (forme `*.aiven.app`). Source : custom-domain ci-dessous.
- [E] Domaine personnalisé : possible seulement via Cloudflare (CNAME + Worker), avec un saut en plus ; WebSockets et SSE « à valider » ; l'URL `*.aiven.app` reste publique. Source : https://aiven.io/docs/products/runtime/custom-domain. Conclusion : pour ce soir, garder l'URL `*.aiven.app`.
- [E] Variables d'environnement : section « Environment variables » de l'appli, case « Secret » pour les valeurs sensibles, import depuis fichier possible. Chaque modification redéploie le même commit. Source : https://aiven.io/docs/products/runtime/secrets-and-variables
- [E] Variables ajoutées d'office : `DATABASE_URL` (PostgreSQL, URI complète), `VALKEY_URL`, `OPENSEARCH_URI`, et pour Kafka `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_SECURITY_PROTOCOL`, `KAFKA_ACCESS_KEY`, `KAFKA_ACCESS_CERT`, `KAFKA_CA_CERT`. Pas de `PGHOST` séparé : l'app doit lire l'URI. Même source.
- [E] Services connectables à une appli : Kafka, PostgreSQL, OpenSearch, Valkey, MySQL, ClickHouse. Une appli Runtime ne se connecte pas à une autre appli Runtime. Source : https://aiven.io/docs/products/runtime/connect-services-to-apps
- [E] Pas de commande de pré-déploiement : les migrations se lancent dans le `CMD`/entrypoint du conteneur, ou en CI avant déploiement. Même source. Conséquence pour `npm run test:db` : les migrations SQL doivent être idempotentes (`CREATE ... IF NOT EXISTS`) car rejouées à chaque démarrage.
- [E] Runtime peut se connecter à des services gratuits, d'essai ou payants (FAQ de https://aiven.io/runtime).
- [S] Logs : l'onglet de l'appli dans la console les affiche très probablement (non trouvé en page dédiée dans le temps imparti). À vérifier en vrai au premier déploiement.
- [S] Temps de premier déploiement : aucune durée publiée trouvée. Mon estimation : 3 à 8 minutes pour une image Node simple (build + création du service). À chronométrer au premier essai.
- [S] Plan Runtime et coût : la page https://aiven.io/pricing/runtime annonce des tailles de 0,5 CPU et 0,25 à 8 Go de RAM mais le texte récupéré n'affiche pas les prix. La même page évoque « Free plan » dans une phrase sur la rétention, ce qui suggère qu'un plan gratuit existe, sans détail de limites. Ne pas supposer plus.

### Services de données, gratuit et crédits

- [E] PostgreSQL gratuit : 1 nœud, 1 CPU, 1 Go de RAM, 1 Go de disque, extensions supportées, sauvegardes, pas de carte bancaire, pas d'expiration. Limites : 20 connexions maximum, pas de pooling de connexions, pas d'intégrations, un seul service de chaque type par organisation, pas de SLA. Source : https://aiven.io/docs/products/postgresql/concepts/pg-free-tier
- [E] Risque : Aiven peut éteindre un service gratuit sans activité (avec notification), et même un service sans usage les premières heures. Se rallume à la main. Source : https://aiven.io/docs/platform/concepts/service-pricing . À faire : envoyer une requête régulière dès que la base existe, et ne pas la créer trop tôt avant la démo.
- [E] Kafka gratuit : 250 KiB/s en entrée et en sortie, 5 topics de 2 partitions, rétention fixe courte (3 jours selon un comparatif), Karapace inclus, pas de Kafka Connect, création uniquement par la console. Sources : https://aiven.io/docs/products/kafka/free-tier/kafka-free-tier , https://whichdevtool.com/tools/aiven-databases
- [E] Valkey gratuit : 1 Go de RAM. OpenSearch gratuit : 4 Go de RAM, 20 Go de disque. Source : https://aiven.io/free-tier
- [E] ClickHouse : pas de plan gratuit listé ; premier plan Startup « à partir de 155 $/mois » (0,21 $/h). Source : https://aiven.io/pricing?product=clickhouse&tab=plan-comparison
- [E] Essai gratuit de 30 jours avec 300 $ de crédit, pour accéder aux services hors plan gratuit (dont ClickHouse). Source : https://aiven.io/book-demo ; crédits ajoutés à un groupe de facturation par code : https://aiven.io/docs/platform/howto/credits
- [E] Facturation à l'heure, minimum une heure ; éteindre un service arrête la facturation. Source : https://aiven.io/docs/platform/concepts/service-pricing
- [S] « Crédits hackathon » spécifiques à Accel AI Innovate : rien trouvé dans les sources publiques. Possible qu'Aiven en distribue via un code le jour J. Question à Adem.

### Connexion PostgreSQL (SSL)

- [E] Toutes les connexions sont chiffrées TLS ; `sslmode=require` est la valeur par défaut. Source : https://aiven.io/docs/products/postgresql/howto
- [E] Dans Runtime, avec `node-postgres` (`pg`), la doc demande d'ajouter `uselibpqcompat=true` à `DATABASE_URL` (équivaut à `sslmode=require` : chiffré, certificat serveur non vérifié). Source : connect-services-to-apps ci-dessus. Extrait utile :
  `const u = new URL(process.env.DATABASE_URL); u.searchParams.set("uselibpqcompat","true"); const client = new pg.Client({connectionString: u.toString()});`
- [E] Hors Runtime (poste de dev), l'exemple officiel utilise le certificat `ca.pem` téléchargé sur la page du service, avec `rejectUnauthorized: true`. Source : https://aiven.io/docs/products/postgresql/howto/connect-node
- [E] Piège connu : « self-signed certificate in certificate chain » avec Prisma 7 + adapter-pg sur Aiven. Source : https://stackoverflow.com/questions/80004613/prisma-7-prisma-adapter-pg-fails-with-self-signed-certificate-in-certificate . Conseil : `pg` direct, sans ORM, ce soir.

### Tableau commun avec LISTEN/NOTIFY

- [E] `LISTEN canal` / `NOTIFY canal, 'texte'` : pub/sub natif. Charge utile limitée à environ 8000 octets ; pas de stockage (qui n'écoute pas à ce moment perd le message) ; les noms de canaux font 63 octets au plus. Sources : https://matthewpalma.dev/blog/postgresql-listen-notify-real-time-invalidation-patterns-and-limits , https://blog.michaelsam94.com/postgres-listen-notify-realtime
- [E] Règle d'usage : NOTIFY sert de signal de réveil ; la vérité reste dans une table. Source : https://nerdleveltech.com/postgres-listen-notify-job-queue
- [E] Un listener doit avoir sa propre connexion dédiée, pas une connexion de pool. Les poolers en mode transaction cassent LISTEN. Sources : michaelsam94 ci-dessus, https://hivebook.wiki/wiki/postgresql-listen-notify-async-pub-sub-payload-limits-and-pooler-traps
- [E] Le plan gratuit n'a pas de pooling : pas de piège de pooler, mais 20 connexions maximum.
- [S] Schéma : le serveur ouvre UNE connexion `LISTEN tableau` et relaie aux navigateurs en SSE (HTTP, accepté par Runtime ; ne pas compter sur les WebSockets, non documentés). Budget connexions : 1 écoute + un petit pool de 5 = 6 sur 20.

### Mémoire avec pgvector

- [E] pgvector est disponible sur Aiven PostgreSQL ; activation : `CREATE EXTENSION vector;` dans chaque base. Types `vector(n)`, index HNSW disponibles. Source : https://aiven.io/docs/products/postgresql/howto/use-pgvector , concepts : https://aiven.io/docs/products/postgresql/concepts/pgvector
- [E] La liste des extensions et leur version : https://github.com/aiven/aiven-docs/blob/main/docs/products/postgresql/reference/list-of-extensions.md (à relire sur la base réelle avec `SELECT * FROM pg_available_extensions WHERE name='vector'`).
- [S] Les embeddings viennent d'un modèle. Or la règle du ticket interdit tout appel payant à un LLM sans accord d'Adem : pour la mémoire, prévoir soit des vecteurs calculés hors ligne, soit un jeu de vecteurs factices de dimension 3 à 8 pour le démonstrateur, soit un accord explicite. Question à Adem.

### Quand ClickHouse ou Kafka valent le coup (positions de foule)

- [E] ClickHouse excelle en analytique sur des centaines de millions de lignes (colonnes compressées, insertion par gros lots). Sous environ 100 millions de lignes, PostgreSQL suffit, avec jointures et transactions. Sources : https://sivaro.in/articles/clickhouse-or-postgresql-for-time-series-data-2026-guide , https://markaicode.com/vs/clickhouse-vs-postgresql . Ces sources sont des blogs sans méthode vérifiée : à prendre comme ordre de grandeur.
- [S] Calcul de volume (mon estimation, à contester) : 2 000 agents à 1 Hz = 2 000 lignes par seconde ; à environ 60 octets par ligne, cela fait environ 0,4 Go par heure. Le disque gratuit de 1 Go est donc plein en environ 2 h 30 si on stocke tout brut. Une démo de 10 minutes à 2 000 lignes par seconde = 1,2 million de lignes = environ 70 Mo : acceptable. Conclusion : PostgreSQL suffit pour une scène de démonstration si on (a) agrège ou échantillonne à 1 ligne par agent toutes les 2 à 5 s, (b) purge ou garde seulement le dernier run, (c) insère par lots avec `COPY` ou `INSERT ... UNNEST`.
- [S] Le seuil qui justifierait ClickHouse : rejouer et comparer beaucoup de runs sur des milliers d'agents (par exemple 50 runs x 5 000 agents x 600 s = 150 millions de lignes). Ce n'est pas l'objet d'une soirée, et le plan Startup coûte 155 $/mois, soit payé sur essai/crédits uniquement. Pour le ticket : commentaire de justification « pas de ClickHouse : volume de démonstration < 5 millions de lignes, PostgreSQL suffit, plan ClickHouse payant ».
- [E] Kafka gratuit plafonne à 250 KiB/s : environ 4 000 messages/s de 60 octets en théorie, largement assez pour des positions agrégées, mais sans Kafka Connect et avec 5 topics. Utile si l'on veut montrer « flux en direct » (Vélib, IDFM) : 1 topic `velib`, 1 topic `positions`. Voir 04-flux-et-apis-paris.md section « Direct dans Kafka, ou en fichier ? ».
- [S] Coût de mise en place : PostgreSQL 10 min (créer le service, `CREATE EXTENSION`), Kafka 20 à 30 min (certificats TLS : `KAFKA_ACCESS_KEY/CERT/CA_CERT` en variables, client `kafkajs` ou `node-rdkafka` configuré en SSL, création du service uniquement par console), ClickHouse 45 min ou plus (client, schéma, plan payant). Estimations non mesurées.

## Recommandation : couche de données minimale à montrer au jury

Principe : une seule base, trois usages visibles, un schéma lisible. Chaque brique doit répondre à une question que le jury peut voir à l'écran.

1. PostgreSQL Aiven (obligatoire) : scènes, contraintes, runs, décisions. Écran : un run rejoué depuis la base ; lignes visibles dans la console Aiven ou un `psql` projeté.
2. `LISTEN/NOTIFY` (gratuit, 30 min) : tableau commun mis à jour en direct entre deux navigateurs. Effet immédiat à la démo, sans nouvelle brique.
3. `pgvector` (gratuit, 20 min) : mémoire des décisions passées (« situation similaire ») avec requête `ORDER BY embedding <=> $1 LIMIT 3`. Sous réserve de la question des embeddings.
4. Kafka (optionnel, après 1 à 3 verts) : seulement si le lot « flux » (04) pousse des données en direct. Sinon ne pas l'ajouter pour cocher une case.
5. Valkey, OpenSearch, ClickHouse : non ce soir.

Phrase à mettre dans le TXT « couche de données en action » : l'application et la donnée tournent dans le même périmètre Aiven ; une seule base PostgreSQL porte l'historique, le temps réel (NOTIFY) et la mémoire (vecteurs).

## Check-list de déploiement chronométrée

Les durées sont des estimations [S] sauf mention ; la colonne de gauche est le cumul visé.

| Cumul | Étape | Détail |
|---|---|---|
| 0:00 | Compte et projet Aiven | Se connecter à https://console.aiven.io ; vérifier qui est admin d'organisation (nécessaire pour GitHub) ; vérifier qu'une carte n'est pas exigée pour le plan gratuit [E] |
| 0:10 | Créer PostgreSQL gratuit | Console, nouveau service, PostgreSQL, plan Free ; noter région ; attendre « Running » (quelques minutes) |
| 0:15 | Activer pgvector | `psql` avec l'URI du service : `CREATE EXTENSION vector;` puis `SELECT * FROM pg_available_extensions WHERE name='vector';` |
| 0:20 | Dockerfile minimal dans le dépôt | `FROM node:20-alpine`, `WORKDIR /app`, `COPY package*.json`, `RUN npm ci --omit=dev`, `COPY . .`, `EXPOSE 3000`, `ENV NODE_ENV=production`, `CMD ["node","src/server/index.js"]` (adapter la commande à la vraie entrée) |
| 0:25 | Serveur : écouter `process.env.PORT \|\| 3000` sur `0.0.0.0` | Route `GET /sante` qui renvoie 200 et fait `SELECT 1` |
| 0:30 | Connexion `pg` | Lire `DATABASE_URL`, ajouter `uselibpqcompat=true`, pool max 5, une connexion dédiée pour LISTEN |
| 0:35 | Migrations au démarrage | `CREATE TABLE IF NOT EXISTS ...` exécutées dans le point d'entrée avant `listen` (pas de pré-déploiement sur Runtime) [E] |
| 0:40 | Pousser sur GitHub, branche choisie | Runtime déploie une branche : décider laquelle (`main` ou `lot/aiven`) |
| 0:45 | Connecter GitHub à Aiven | Runtime, Deploy application, Connect GitHub account (installer l'application « Aiven Platform » sur le compte) |
| 0:50 | Déployer | Compte, dépôt, branche, Next, manifeste `Dockerfile`, Scan, vérifier le port 3000 détecté, Deploy. Chronométrer ici le temps de build (inconnu) |
| 0:55 | Connecter PostgreSQL | Dans l'appli, Connected services, Connect service ; vérifier que `DATABASE_URL` apparaît, marquer les autres clés en « Secret » |
| 1:00 | Vérifier | `curl -i https://<hôte>.aiven.app/sante` doit donner 200 ; lire les logs dans la console |
| 1:05 | Test de base | `npm run test:db` contre la base Aiven (URI en variable locale, jamais dans le dépôt) |
| 1:15 | NOTIFY | Trigger `AFTER INSERT` sur la table du tableau qui appelle `pg_notify('tableau', row_id)`, relais SSE `/flux` |
| 1:30 | Redéploiement de routine | Après chaque push : Actions, Deploy latest commit ; chronométrer |
| 1:45 | TXT « couche de données en action » | 1 page : schéma, 3 usages, volumes réels, justification de l'absence de ClickHouse |

Règles : aucune clé ni URI dans le chat ou un commit (tout dans `.env` local et variables Aiven) ; les services gratuits peuvent s'éteindre sans activité, donc lancer un ping au `/sante` toutes les 5 minutes pendant la préparation et vérifier l'état une heure avant la démo.

## Pièges à connaître

- Pas de déploiement automatique au push [E]. Oublier de redéployer est l'erreur la plus probable.
- Modifier une variable redéploie l'ancien commit, pas le dernier [E].
- Pas de WebSockets garantis [E, limité à « HTTP seulement » dans la doc des ports] : préférer SSE.
- 20 connexions maximum sur la base gratuite [E] : un seul pool, pas de connexion par requête.
- Le disque de 1 Go est le vrai plafond [E] : surveiller la taille (`SELECT pg_size_pretty(pg_database_size(current_database()));`).
- Une seule base gratuite par organisation [E] : si l'organisation d'Aiven en a déjà une, en réutiliser une en créant un schéma séparé.

## Questions à poser à Adem

1. Qui possède l'organisation Aiven utilisée pour la soirée, et qui est admin pour connecter GitHub ? Le dépôt `adembnn/hack-accel` est-il sous une organisation GitHub (propriétaire requis) ou un compte personnel ?
2. Un plan Runtime est-il disponible gratuitement, ou faut-il l'essai de 30 jours (300 $) ? Y a-t-il un code de crédits hackathon d'Aiven ?
3. Branche à déployer : `main` ou `lot/aiven` ? Autorise-t-on le redéploiement manuel à chaque merge ?
4. Mémoire pgvector : accord pour un appel d'embedding (coût), ou on utilise des vecteurs calculés hors ligne / factices ?
5. Kafka est-il déjà créé par le lot « flux » ? Sinon, qui le crée (création uniquement par la console) ?
6. Y a-t-il une contrainte de région (RGPD, données de positions) ? Le plan gratuit n'en laisse pas choisir [E].
7. Volume visé de la démo (nombre d'agents, durée, fréquence) pour confirmer que PostgreSQL seul suffit.
8. Accord pour documenter dans le ticket « pas de ClickHouse » avec la justification ci-dessus ?

## Sources principales

- https://aiven.io/docs/products/runtime/deploy-apps
- https://aiven.io/docs/products/runtime/connect-services-to-apps
- https://aiven.io/docs/products/runtime/secrets-and-variables
- https://aiven.io/docs/products/runtime/ports
- https://aiven.io/docs/products/runtime/manifest-files/containerfiles
- https://aiven.io/docs/products/runtime/custom-domain
- https://aiven.io/runtime
- https://aiven.io/pricing/runtime
- https://aiven.io/free-tier
- https://aiven.io/docs/products/postgresql/concepts/pg-free-tier
- https://aiven.io/docs/products/kafka/free-tier/kafka-free-tier
- https://aiven.io/docs/platform/concepts/service-pricing
- https://aiven.io/docs/platform/howto/credits
- https://aiven.io/book-demo
- https://aiven.io/docs/products/postgresql/howto/connect-node
- https://aiven.io/docs/products/postgresql/howto/use-pgvector
- https://aiven.io/pricing?product=clickhouse&tab=plan-comparison
- https://matthewpalma.dev/blog/postgresql-listen-notify-real-time-invalidation-patterns-and-limits
- https://sivaro.in/articles/clickhouse-or-postgresql-for-time-series-data-2026-guide
