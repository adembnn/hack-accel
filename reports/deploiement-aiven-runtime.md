# Déployer sur Aiven Runtime : état des docs officielles (22 oct. 2026)

Décision débloquée : comment on met l'app (serveur Node + page three.js) en ligne sur Aiven Runtime, branchée sur pg-a877915.
Sources : docs Aiven (aiven.io/docs, sources Markdown dans github.com/aiven/aiven-docs), changelog, aiven.io/apps. Rien n'a été testé ni connecté.

## En une image
Runtime = un hébergeur de conteneurs posé à côté de vos bases Aiven. Vous pointez Aiven sur un dépôt GitHub contenant un Dockerfile ; il construit l'image, la lance, et donne une URL https publique. Il n'y a PAS de registre d'images où pousser : la source est toujours GitHub.

## 1. Ce que c'est
- Nom : "Aiven Runtime" (anciens noms "Aiven Apps"/"App Runtime" ; la page de marque reste aiven.io/apps). Dans l'API, c'est un type de service `application`. https://aiven.io/docs/products/runtime.md
- Statut : AMBIGU. Le changelog du 23 sept. 2026 annonce "now generally available" (https://aiven.io/changelog/895c60e5-8ac9-4da5-b3ff-88544e7bef0e). Une page de docs plus ancienne (7 août) disait "Limited availability, sur demande" (https://aiven.io/docs/products/aiven-apps). La page de déploiement à jour (13 oct.) n'affiche plus de badge. À retenir : GA, et votre console montre déjà l'entrée Runtime.
- Régions : on choisit fournisseur et région à la création et on peut en changer ensuite (https://aiven.io/docs/products/runtime/change-cloud.md). Exemple des docs : `aws-eu-west-1` ; AWS, GCP et Azure sont cités sur aiven.io/apps. Liste exacte des régions Runtime : NON TROUVÉE. DigitalOcean (le cloud de votre PG) n'est cité nulle part côté Runtime : à vérifier dans le formulaire. Une app dans un autre cloud que la base fonctionne probablement mais perd l'avantage "même réseau".
- Prix : facturation horaire du plan, de la création jusqu'à l'extinction ; pas de frais de build ni d'inactivité ; passage futur à une facturation à l'usage (https://aiven.io/pricing, FAQ "How is Aiven Runtime billed?"). Prix des plans : NON TROUVÉ (seul nom de plan dans les docs : `startup-50-1024`). Pas de palier gratuit documenté pour Runtime (les plans gratuits existent pour PG, MySQL, OpenSearch, Kafka, Valkey, pas pour Runtime). Le crédit d'essai se débite comme les autres services (https://aiven.io/docs/platform/howto/credits.md).
- Extinction : "Power off" possible ; une app éteinte plus de 180 jours est supprimée. https://aiven.io/docs/products/runtime/power-off-apps.md
- Mise en garde du fournisseur : "pas un hébergeur web généraliste pour apps publiques à fort trafic" ; cibles : filtres de flux, tableaux de bord internes, agents (https://aiven.io/apps, FAQ). Pour une démo de jury, ça suffit.

## 2. Comment déployer
- Source : uniquement un dépôt GitHub + branche (via l'app GitHub "Aiven Platform"). Ni image de registre, ni `git push` vers Aiven. https://aiven.io/docs/products/runtime/deploy-apps.md
- Droits : `role:organization:admin` côté Aiven pour connecter GitHub ; propriétaire de l'organisation GitHub, ou compte GitHub personnel accepté. Un compte GitHub ne se connecte qu'à une seule organisation Aiven. https://aiven.io/docs/products/runtime/connect-github-account.md
- Fichiers requis : un Dockerfile (ou Containerfile, `Dockerfile.*`, `*.dockerfile`) qui commence par FROM, ou un compose.yaml. Pas de Procfile ni d'aiven.yaml. Aiven lit les `EXPOSE` (port) et les `ENV` du Dockerfile. https://aiven.io/docs/products/runtime/manifest-files/containerfiles.md
- Build : Aiven construit lui-même l'image à partir de `build_path` (défaut `./`) et `containerfile_path`. Logs de build disponibles. Les builds sur mesure et images non standard ne sont pas supportés dans les fichiers Compose (https://aiven.io/docs/products/runtime/manifest-files/compose-files.md) ; un Dockerfile simple est la voie normale.
- Taille max d'image, durée max de build : NON TROUVÉ.
- Port : vous déclarez un port de conteneur (ex. 8080, protocole HTTP). Le point d'entrée public est toujours HTTPS sur 443 ; Aiven termine le TLS et relaie en HTTP vers votre port. HTTP uniquement (pas de gRPC, HTTP/2 ni TCP). L'URL (*.aiven.app) se lit dans "Connection information". Variable `$PORT` : NON DOCUMENTÉE, donc écouter sur 0.0.0.0 sur le port déclaré. https://aiven.io/docs/products/runtime/ports.md
- Sorties réseau : tout est permis sauf les ports TCP 23, 25, 119, 135, 137, 138, 139, 179, 445, 465, 631. Appeler api.anthropic.com en 443 est donc possible (même page).
- Health checks : NON TROUVÉ. Aucune sonde configurable dans les docs.
- Redéploiement : PAS automatique au push. Il faut "Actions > Deploy latest commit" en console. Changer ports, plan, cloud, variables ou rallumer l'app redéploie le dernier commit déjà déployé. (même page deploy-apps)
- Logs : build et exécution, en console, via `avn service logs NOM` ou l'API (`log_type` = `application-build` ou `application-run`). Conservation 24 h seulement. https://aiven.io/docs/products/runtime/runtime-logs.md
- HTTPS / domaine : l'URL *.aiven.app est en HTTPS d'office. Un domaine perso passe par Cloudflare + un Worker, pas de domaine natif. https://aiven.io/docs/products/runtime/custom-domain.md (inutile pour la démo)
- Montée en charge : changement de plan à chaud, redéploiement à la clé. https://aiven.io/docs/products/runtime/scale-apps.md . Nombre de réplicas ou autoscaling : NON TROUVÉ.
- Stockage persistant : aucun, Aiven Apps est décrit comme "stateless runtime" (https://github.com/aiven/aiven-docs/blob/main/docs/products/aiven-apps.md). Tout état va dans PG.
- SSE : "marche en général" derrière le proxy Cloudflare (page custom-domain) ; en direct sur *.aiven.app, non documenté. WebSockets : NON DOCUMENTÉ en direct (la page parle seulement d'un traitement explicite dans le Worker). Notre app n'en a pas besoin : POST /api/directeur et /api/agents sont des requêtes classiques.

## 3. Secrets et PostgreSQL
- Variables : console > Runtime > l'app > Overview > Environment variables > Edit, case "Secret" pour masquer. Enregistrer redéploie. Import depuis un fichier possible. https://aiven.io/docs/products/runtime/secrets-and-variables.md . En API : `"kind": "secret"`. Donc ANTHROPIC_API_KEY et OPENROUTER_API_KEY se saisissent dans la console, jamais dans le dépôt, ni dans un `ENV` du Dockerfile (ces ENV sont lus par Aiven et affichés comme variables).
- Postgres : on connecte le service existant à l'app (intégration `application_service_credential`). Aiven injecte `DATABASE_URL` (URI complète) ; PGHOST/PGPASSWORD séparés ne sont pas fournis. https://aiven.io/docs/products/runtime/secrets-and-variables.md et https://aiven.io/docs/products/runtime/connect-services-to-apps.md
- CA : l'URI générée est de la forme `...?sslmode=require&uselibpqcompat=true` : connexion chiffrée mais certificat du serveur non vérifié, donc pas de fichier CA à gérer. Avec node-postgres, la doc demande d'ajouter `uselibpqcompat=true` à l'URL (extrait ci-dessous) :
```js
const u = new URL(process.env.DATABASE_URL);
u.searchParams.set("uselibpqcompat", "true");
const client = new Client({ connectionString: u.toString() });
```
- Pare-feu PG : la doc Runtime ne mentionne aucune liste d'IP à ouvrir. Non vérifié pour un PG DigitalOcean Developer-1.

## 4. CLI, API, Terraform, GitHub Actions
- CLI `avn` : pas de sous-commande `runtime` ; l'app est un service de type `application` (https://aiven.io/docs/products/runtime/deploy-apps.md) :
  `avn service create NOM -t application --cloud CLOUD --plan PLAN -c application.source.vcs_integration_id=ID -c application.source.remote_repository_id=ID -c application.source.repository_url=URL -c application.source.branch=main -c application.source.build_path=. -c application.source.containerfile_path=Dockerfile -c 'application.ports=[{"name":"http","port":8080,"protocol":"HTTP"}]'`
  Connexion PG : `avn service integration-create -t application_service_credential -s pg-a877915 -d NOM --user-config-json '{"service_type":"pg","exposed_values":{"connection_string":{"environment_variable_key":"DATABASE_URL"}}}'`. Suivi : `avn service wait NOM`.
- Les IDs GitHub se lisent par `GET https://api.aiven.io/v1/organization/ORG_ID/application/vcs-integrations` puis `.../VCS_INTEGRATION_ID/repositories`. La connexion initiale de GitHub se fait en console.
- API : `POST /v1/project/{projet}/service` avec `service_type: "application"` et `user_config.application.{source, ports, environment_variables}`.
- Terraform : AUCUNE ressource Runtime/application trouvée (ni docs, ni CHANGELOG du provider : seulement des ressources Flink "application"). Non trouvé, donc non utilisable pour l'instant.
- GitHub Actions : aucun workflow officiel pour Runtime. L'endpoint de redéploiement n'est pas documenté (seule la console l'est).

## 5. AI Gateway et Agents
- AI Gateway (Early availability) : un point d'accès unique à des modèles servis par Aiven, avec catalogue, clés d'API et suivi des dépenses. https://aiven.io/docs/products/ai-gateway.md . Accès : bouton "Request access" dans la console (délai inconnu).
- Compatible SDK Anthropic et OpenAI : base URL `https://ai.aiven.io` (Anthropic) ou `https://ai.aiven.io/v1` (OpenAI), clé = clé Gateway, modèle `aiven-model`. https://aiven.io/docs/products/ai-gateway/use-sdks.md . La page "coding agents" cite claude-opus-5, claude-sonnet-5, claude-haiku-4-5 via `ANTHROPIC_BASE_URL=https://ai.aiven.io`. https://aiven.io/docs/products/ai-gateway/use-with-agents.md
- Ce n'est PAS un relais de notre clé Anthropic : on utilise une clé Aiven et la facturation passe par Aiven. OpenRouter à travers la Gateway : NON TROUVÉ.
- Intérêt jury : "les appels IA passent par AI Gateway Aiven" coche la case sponsor. Coût du changement : `baseURL` + clé dans serveur.mjs. Liste des modèles et quotas visibles seulement après accord. À garder en option derrière un drapeau, Anthropic direct en secours. Décision de fournisseur : à valider par Adem.
- Managed Agents (Limited availability, accès par projet via "Request access") : crée et exécute des agents hébergés par Aiven (instructions, modèle, outils web, MCP, chat, planification). https://aiven.io/docs/tools/agents.md . Produit distinct de Runtime : il n'héberge pas notre code Node et ne remplace pas /api/agents.

## 6. Plan concret pour nous
Prérequis (Adem, console) : être admin de l'organisation Aiven ; dépôt sur GitHub (privé ou public ? à confirmer) ; saisir les clés dans la console, jamais dans le chat.
1. Écrire un `Dockerfile`. Les gros JSON générés (scene.json 1,6 Mo, navgrid.json 0,65 Mo) ne sont pas commités, donc les construire PENDANT le build (noms de scripts à adapter) :
   ```dockerfile
   FROM python:3.12-slim AS data
   WORKDIR /w
   COPY reports/maquettes/chatelet-3d/ ./chatelet-3d/
   RUN pip install -r chatelet-3d/requirements.txt && python chatelet-3d/build_scene.py
   FROM node:25-slim
   WORKDIR /app
   COPY --from=data /w/chatelet-3d/ ./
   RUN npm ci --omit=dev
   EXPOSE 8080
   CMD ["node", "serveur.mjs"]
   ```
   Risque : le téléchargement OpenStreetMap (Overpass) au build peut échouer ou être lent. Plan B : committer une fois les 2 JSON sur la branche de déploiement (déroge à "données générées jamais commitées" : décision d'Adem).
2. Dans serveur.mjs : écouter sur `0.0.0.0` et `process.env.PORT ?? 8080` ; lire `ANTHROPIC_API_KEY` et `DATABASE_URL` dans l'environnement.
3. Tester l'image en local : `docker build -t chatelet . && docker run -p 8080:8080 chatelet` (clé via variable, hors chat).
4. Pousser sur GitHub (branche `main` après `tools/fusionner.mjs`, ou une branche `deploy`).
5. Console : projet > Runtime > Deploy application > connecter GitHub > dépôt + branche > Next > Dockerfile > Scan > vérifier le port 8080 > intégration avec pg-a877915 (variable `DATABASE_URL`) > Deploy.
6. L'app > Environment variables > Edit : ANTHROPIC_API_KEY (cocher Secret), OPENROUTER_API_KEY si utilisée > Save (redéploie).
7. "Connection information" > Application URL. Vérifier : page 3D, `POST /api/directeur`, une lecture et une écriture PG.
8. Surveiller : `avn service logs NOM`.
9. Après chaque correctif : "Deploy latest commit" (rien ne part tout seul au push).
10. Option jury : cliquer "Request access" sur AI Gateway maintenant, brancher derrière un drapeau `USE_AIVEN_GATEWAY`.

## Risques en démo
- Cold start et health checks : non documentés. Un redéploiement relance le conteneur "en quelques instants" (formulation de la doc) ; ne rien redéployer pendant le pitch, répéter sur l'URL finale.
- Build qui échoue : OpenStreetMap indisponible, tag `node:25-slim` à vérifier (sinon `node:24`). Garder la dernière version qui marche.
- Chaque changement de variable, de plan ou de port redéploie.
- Logs gardés 24 h seulement : copier les erreurs pendant la répétition.
- Appels Anthropic : le port 443 est permis ; garder le cache de réponses de démo prévu au harnais pour un réseau de salle instable.
- Crédit 49,99 $ : prix du plan Runtime inconnu ; lire le prix dans le formulaire avant de valider, éteindre l'app après la démo.
- Docs récentes (13 oct. 2026) : des options (variable PORT, sondes) peuvent exister sans être documentées.
