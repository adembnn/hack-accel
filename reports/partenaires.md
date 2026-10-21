# Partenaires et crédits : quoi utiliser, quoi ignorer (Accel AI Innovate Paris, 22 oct. 2026)

Recherche du 21 oct. 2026. Décision débloquée : quels partenaires entrent dans le produit « agents + données » sur Aiven Runtime, quels sont ignorés. `[?]` = non vérifié. Liste officielle des perks : [Luma Paris](https://luma.com/0v3c010v). Équipe = 4 personnes.

## Récapitulatif
| Partenaire | Crédit total équipe (×4) | Verdict | Usage en une ligne |
|---|---|---|---|
| Aiven | Montant par participant : non trouvé `[?]` ; 12 k$ si top 3 ([Luma](https://luma.com/0v3c010v)) | INDISPENSABLE | Runtime + Postgres + Kafka + Valkey (+ ClickHouse/OpenSearch si justifié) |
| Anthropic | 400 $ ≈ 111 M tokens Sonnet 5.5 | INDISPENSABLE | Cerveau des agents (Sonnet en boucle, Opus pour les décisions dures) |
| Vercel AI Gateway | 480 $ | UTILE | Une seule clé, repli automatique entre modèles si un fournisseur tombe en démo |
| OpenAI | 200 $ | UTILE | Embeddings pour pgvector/Valkey `[?]`, second modèle de secours |
| Modal | 400 $ ≈ 100 h de H100 | UTILE (si calcul lourd) | Traitement massif en parallèle que Runtime (≤ 8 Go RAM) ne peut pas faire |
| ElevenLabs | 440 000 crédits ≈ 440 min de voix | BONUS DÉMO | L'agent parle ou appelle en démo |
| Lovable | Montant inconnu `[?]` | BONUS DÉMO | Front en 30 min, déployable sur Runtime via MCP Aiven |
| n8n | 1 mois Cloud Pro (10 000 exécutions) | BONUS DÉMO | Brancher un flux entrant réel (mail, Slack, webhook) |
| Stripe (hors ta liste) | 500 $ par équipe | BONUS DÉMO | Paiement test = « route vers les premiers utilisateurs » |
| Lightdash | 1 mois Cloud Pro (3 000 $/mois au tarif public) | IGNORER par défaut | Exige un projet dbt ; garde-le seulement si la démo est la donnée qui bouge |
| Supabase | 100 $ + 4 mois Pro | IGNORER | Doublon de PostgreSQL Aiven, mauvais signal pour le jury Aiven |
| Miro | 1 mois Enterprise | IGNORER | Pas de gain de build ; MCP désactivé par défaut en Enterprise |

Ordre de grandeur : en 7 h, un agent en boucle brûle plutôt 5 à 20 M de tokens `[?]` (estimation, pas une mesure). Les crédits ne sont pas le facteur limitant ; les limites de débit des comptes neufs le sont peut-être `[?]`.

## Aiven (sponsor principal)
1. **C'est quoi** : un hébergeur de bases de données open source (Postgres, Kafka, ClickHouse…) qui a ajouté Runtime, un endroit où faire tourner l'appli et les agents dans le même projet que les données. [Aiven](https://aiven.io/) · [Communiqué GA 23 sept.](https://aiven.io/press/aiven-launches-runtime-and-datahub-enabling-ai-agents)
2. **Ce que le crédit achète** : montant par participant non trouvé `[?]`. Plans gratuits sans limite de durée pour PostgreSQL, MySQL, OpenSearch, Kafka, Valkey ; pas pour ClickHouse. [Doc pricing](https://aiven.io/docs/platform/concepts/service-pricing) · Essai 30 jours sans carte, un seul par compte (montant non trouvé `[?]`). Runtime dès 7 $/mois ([terrain](hackathon-terrain.md)).
3. **Activer** : compte Aiven Console, projet, MCP : `claude mcp add --transport http aiven-mcp https://mcp.aiven.live/mcp`. Un **admin d'organisation** doit cocher « Allow MCP connection » ([blog Lovable+Aiven](https://aiven.io/blog/lovable-database-aiven-postgresql)). Qui est admin le jour J : à demander aux organisateurs dès 9h `[?]`. Piège : un push GitHub ne redéploie pas, il faut « Deploy latest commit » ([terrain](hackathon-terrain.md)). Le plan gratuit ne gère pas les intégrations de service, donc les identifiants injectés dans l'appli exigent un plan payant ([blog](https://aiven.io/blog/lovable-database-aiven-postgresql)).
4. **Dans le produit** : tout l'état vit chez Aiven (voir tableau des services). Wow démo : l'agent redéployé par un agent via l'Aiven MCP, ou un flux Kafka qui déclenche l'agent en direct.
5. **Verdict** : INDISPENSABLE. Risque : Runtime « Limited availability » sur la page des ports, ClickHouse non détecté par Compose ([terrain](hackathon-terrain.md)) ; commence par un hello-world déployé avant tout le reste.
6. **Services** ([liste docs](https://aiven.io/docs/products/services)) :

| Service | En une phrase | Pour des agents | Offert / risque |
|---|---|---|---|
| PostgreSQL | Base relationnelle classique, extension pgvector pour la recherche par sens ([docs IA](https://aiven.io/docs/ai-features)) | Mémoire longue, état des exécutions, résultats | Gratuit (1 CPU / 1 Go) ; injecté en `DATABASE_URL` |
| Valkey | Clone libre de Redis, en mémoire ; module Search (vecteurs, `FT.SEARCH`) sur Valkey 9+ ([doc](https://aiven.io/docs/products/valkey/reference/valkey-modules)) | Cache sémantique : un prompt quasi identique ne repaie pas de tokens | Gratuit ; version gratuite = 9+ ? `[?]` |
| Kafka | File de messages : les événements arrivent, les agents les consomment | Flux entrant, déclencheur d'agents, journal rejouable | Gratuit ; 4 variables SSL à adapter au code |
| ClickHouse | Base colonnes ultra rapide pour analyser des milliards de lignes ; index vectoriel ([docs](https://aiven.io/docs/ai-features)) | Analytique sur gros jeux de données, traces d'exécution pour que l'agent s'améliore | Payant, pas de plan gratuit ; création à part `[?]` |
| OpenSearch | Moteur de recherche texte + vecteurs, volet « agentic » ([docs](https://aiven.io/docs/ai-features)) | Recherche hybride sur documents et logs | Gratuit |
| Flink | Calcul en continu sur des flux Kafka | Enrichir le flux avant qu'il atteigne l'agent | Dans la doc ([services](https://aiven.io/docs/products/services)) mais absent de la page d'accueil ; dès 0,57 $/h, 3 nœuds ([blog 2023](https://aiven.io/blog/aiven-for-apache-flink-generally-available)) ; offert avec les crédits ? `[?]`. IGNORER |

Autres briques Aiven, hors ta liste : Managed Agents (accès limité, demande par projet) ([doc](https://aiven.io/docs/tools/agents)), AI Gateway (accès anticipé, modèles ouverts) ([blog](https://aiven.io/blog/introducing-aiven-ai-gateway)), DataHub (catalogue/lignée, GA) ([communiqué](https://aiven.io/press/aiven-launches-runtime-and-datahub-enabling-ai-agents)). Aiven AI Gateway fait doublon avec Vercel ; l'avantage est l'effet « tout chez Aiven ».

**Ce que le jury Aiven veut voir utilisé pour de vrai** (déduit du discours Aiven, pas un critère publié) : des agents qui agissent sur des données fraîches qui restent dans le périmètre ([blog GA](https://aiven.io/blog/deploy-your-apps-and-agents-where-your-data-lives-with-aiven-runtime)) ; des combinaisons justifiées Kafka+ClickHouse, Postgres+Kafka+Valkey ([pricing](https://aiven.io/pricing/valkey)) ; Valkey en cache sémantique ([accueil](https://aiven.io/)) ; un déploiement sur Runtime, pas un `localhost` ; et un projet qui sert le produit d'Aiven, comme Overmind au Sunstead ([résultats](https://sunsteadhack.com/results)). Mauvais signal : cocher les 6 services sans raison technique.

## Anthropic
1. API de Claude (le modèle d'IA qui fait tourner les agents). [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
2. 100 $ par personne. Tarifs au 28 sept. 2026 : Sonnet 5.5 à 2 $ entrée / 10 $ sortie par million de tokens ; Opus 5.5 à 4 $ / 20 $ ; Haiku 4.5 à 1 $ / 5 $ ; lecture de cache à 0,10 $ (Sonnet) et 0,20 $ (Opus) ; moitié prix en batch ([liste des prix](https://assets.claude.com/f237fd89990be52c0f683eb5c9d19bc17667f10c.pdf) · [synthèse](https://www.sentra.app/articles/claude-api-pricing)). Un token ≈ ¾ de mot.

| Pour 100 $ (par personne) | Sonnet 5.5 | Opus 5.5 |
|---|---|---|
| Entrée seule | 50 M tokens | 25 M |
| Sortie seule | 10 M | 5 M |
| Mélange agent 80 % entrée / 20 % sortie | ≈ 28 M | ≈ 14 M |
| Équipe ×4, même mélange | ≈ 111 M | ≈ 56 M |

3. Console API, onglet crédits/promo : chemin exact et délai non trouvés `[?]`. La clé va dans `.env` que tu remplis toi-même (pas de clé dans le chat).
4. Wow : un agent qui relit ses propres exécutions passées (stockées dans Postgres) et corrige son prompt. Moins cher : cache de prompt + Sonnet partout, Opus seulement pour trancher.
5. **INDISPENSABLE**. Risque : limites de débit des comptes neufs `[?]` ; prévoir le repli Vercel/OpenAI.

## Vercel AI Gateway
1. Une passerelle : une clé unique et une URL pour appeler les modèles d'Anthropic, OpenAI, Google, xAI et des modèles ouverts, au prix du fournisseur sans marge. [Vercel](https://vercel.com/ai-gateway)
2. 120 $ par personne, 480 $ équipe, au tarif catalogue sans majoration, valable aussi avec tes propres clés ([pricing](https://vercel.com/docs/ai-gateway/pricing)). Plus de 400 modèles ; liste en direct sans authentification : `https://ai-gateway.vercel.sh/v1/models` ([doc](http://vercel.com/docs/ai-gateway/models-and-providers)). Au tarif Sonnet 5.5 (mélange 80/20), 480 $ ≈ 133 M tokens (calcul). Les crédits sont rattachés à une équipe Vercel : pooler les 4 `[?]`.
3. Compte Vercel, section AI Gateway, clé API, base URL `https://ai-gateway.vercel.sh/v1` compatible OpenAI ([Docker doc](https://docs.docker.com/ai/docker-agent/providers/vercel)). Les crédits gratuits démarrent à la première requête ([pricing](https://vercel.com/docs/ai-gateway/pricing)). Réception des 120 $ : `[?]`.
4. Wow : repli en direct. Si Anthropic est lent pendant la démo, la requête repart chez un autre fournisseur sans toucher au code ; budget par clé et journal des coûts ([doc](https://vercel.com/docs/ai-gateway/pricing.graph.md)).
5. **UTILE**. Risque : une couche de plus ; Aiven a sa propre AI Gateway (doublon). Ne l'utilise que si tu veux l'assurance anti-panne.

## OpenAI
1. API de GPT. [Pricing](https://developers.openai.com/api/docs/pricing)
2. 50 $ par personne, 200 $ équipe. gpt-6.1-sol à 2 $ / 10 $ par million, gpt-6-luna à 0,10 $ / 0,50 $ : 50 $ ≈ 14 M tokens sol au mélange 80/20 (56 M équipe). Voix temps réel : GPT-Live à 0,05 $/min, soit ≈ 1 000 min par 50 $ hors modèle de fond (4 000 min équipe). Embeddings : non vérifié `[?]`.
3. Console OpenAI, crédits : chemin et délai non trouvés `[?]`.
4. Wow : voix temps réel pour une démo où l'on parle à l'agent. Sinon, embeddings pour la recherche par sens (je n'ai pas vérifié si Claude en propose `[?]`).
5. **UTILE**, mais le choix du fournisseur est à toi (règle « demande-moi avant »). Risque : doublon avec Claude pour le texte ; rien d'indispensable.

## Modal
1. Du calcul à la demande : tu envoies une fonction Python, Modal la lance sur des dizaines de machines (CPU ou GPU, un GPU = carte graphique de calcul) et facture à la seconde. [Modal](https://modal.com/pricing)
2. 100 $ par personne, 400 $ équipe. Tarifs : H100 0,001097 $/s, A100-80 Go 0,000694 $/s, L40S 0,000542 $/s, L4 0,000222 $/s, T4 0,000164 $/s ; CPU 0,0000131 $/cœur/s ([pricing](https://modal.com/pricing)).

| Pour 100 $ | H100 | A100 80 Go | L40S | L4 | T4 |
|---|---|---|---|---|---|
| Heures de GPU | 25 h | 40 h | 51 h | 125 h | 169 h |
| Équipe ×4 | 101 h | 160 h | 205 h | 501 h | 678 h |

   Plan gratuit Starter : 10 GPU en simultané, 100 conteneurs ([pricing](https://modal.com/pricing)). Ajout aux 30 $/mois gratuits ou non : `[?]`.
3. Compte Modal, `pip install modal`, `modal setup`. Code ou lien de crédit : mode et délai non trouvés `[?]`. Image prête et mise en cache au premier lancement : prévoir un essai à froid avant la démo.
4. Wow : 10 000 documents ou lignes traités en parallèle en 2 minutes, avec un compteur qui monte à l'écran, puis résultats écrits dans ClickHouse/Postgres. Pas de GPU nécessaire si on fait seulement des appels API ; le vrai intérêt est le fan-out (conteneurs en masse).
5. **UTILE si le concept a du calcul lourd** (gros jeu de données, embeddings en masse, modèle local) ; sinon IGNORER. Risque : l'appli sur Runtime appelle Modal par Internet (sortant autorisé, [terrain](hackathon-terrain.md)) ; latence d'un démarrage à froid.

## ElevenLabs
1. Voix de synthèse ultra réalistes, reconnaissance vocale et agents vocaux qui téléphonent ou répondent en direct. [Docs](https://elevenlabs.io/docs/overview/intro)
2. 110 000 crédits par personne, 440 000 équipe. Synthèse vocale : 1 crédit par caractère, ≈ 1 000 caractères par minute ([docs](https://elevenlabs.io/docs/overview/intro), [conversion](https://www.cartesia.ai/learn/elevenlabs-pricing)) :

| Usage | Par personne | Équipe ×4 |
|---|---|---|
| Voix v3/v4/Multilingual (1 crédit/car.) | ≈ 110 min | ≈ 440 min |
| Flash/Turbo (≈ 0,5 crédit/car., −50 %) | ≈ 220 min | ≈ 880 min |
| Transcription Scribe (330 crédits/min) `[?]` | ≈ 333 min | ≈ 1 333 min |
| Agent vocal (0,08 $/min) ; équivalent en crédits non confirmé `[?]` | ≈ 165 min `[?]` | ≈ 660 min `[?]` |

   Agents : 0,08 $/min ([blog](https://elevenlabs.io/blog/weve-lowered-api-agents-pricing-and-introduced-pay-as-you-go)) ; un appel sortant exige un numéro Twilio à part ([API](https://elevenlabs.io/docs/eleven-agents/api-reference/integrations/twilio/outbound-call)).
3. Compte ElevenLabs, clé API (`xi-api-key`), crédits : mode d'octroi et délai non trouvés `[?]`. Widget web ou SDK React pour parler à l'agent depuis le navigateur sans téléphone ([agents](https://elevenlabs.io/docs/eleven-agents/overview)).
4. Wow : l'agent **parle** pendant la démo (résumé vocal du résultat), ou répond à une question posée à voix haute avec le widget. Éviter l'appel téléphonique réel (Twilio + réseau de salle).
5. **BONUS DÉMO**. Mati Staniszewski (ElevenLabs) intervient à 18h ([Luma](https://luma.com/0v3c010v)) : signal d'intérêt, pas un critère de jury `[?]`. Risque : réseau et micro dans une salle bruyante ; prévoir un enregistrement de secours. Pas d'effet « agents + données » en soi : ne l'ajoute que si la voix sert l'utilisateur.

## Lovable
1. Génère une appli web complète (écrans, base, login) à partir d'une description, avec code synchronisable sur GitHub. [Docs](https://docs.lovable.dev/)
2. Montant hackathon inconnu `[?]` (« Lovable and Aiven credits », [Luma](https://luma.com/0v3c010v)). Plan gratuit : 5 crédits de construction par jour, 30 par mois ; Pro : 100 crédits par mois ([FAQ](https://docs.lovable.dev/introduction/faq)).
3. Compte Lovable ; pour la base chez Aiven : Connectors > Custom MCP > URL de l'Aiven MCP, OAuth ; l'agent Lovable peut créer le Postgres puis déployer sur Runtime ([blog Aiven](https://aiven.io/blog/lovable-database-aiven-postgresql)). Git sync crée un **nouveau** dépôt, on ne peut pas en brancher un existant ([FAQ](https://docs.lovable.dev/introduction/faq)). Pile : TanStack Start (rendu serveur) pour les nouvelles applis : prévoir un Dockerfile `[?]`.
4. Wow : écran principal en 30 min, déployé sur Runtime par Lovable lui-même. Utile pour le critère « design » seulement si tu cadres le style (règle : pas de hero centré ni cartes identiques).
5. **BONUS DÉMO**, une seule personne dessus. Risques : sortie générique, base par défaut Lovable Cloud ou Supabase au lieu d'Aiven ([FAQ](https://docs.lovable.dev/introduction/faq)) ; données des plans Free/Pro utilisables pour l'entraînement sauf opt-out depuis le 9 sept. ([FAQ](https://docs.lovable.dev/introduction/faq)) ; MCP bloqué si l'admin Aiven n'a pas autorisé.

## n8n
1. Outil visuel qui enchaîne des étapes automatiques (reçois un mail, appelle une API, écris en base), avec un nœud « agent IA ». [Pricing](https://n8n.io/pricing)
2. 1 mois Cloud Pro par équipe. Pro : 10 000 exécutions/mois, 50 en simultané, 40 min max par exécution, nœud Agent, serveur et client MCP, webhooks ([pricing](https://n8n.io/pricing)). 50 €/mois au tarif annuel.
3. Compte n8n Cloud, activation du mois Pro : lien ou code non trouvé `[?]`.
4. Wow : un vrai flux entrant (formulaire, mail, message Slack) arrive pendant la démo et déclenche l'agent, qui écrit dans Kafka/Postgres. À faire en 20 min.
5. **BONUS DÉMO**, UTILE seulement si le concept dépend d'une source externe en direct. Risque : n8n Cloud est hors du périmètre Aiven (contredit « les données ne quittent pas ») ; doublon avec du code simple vers Kafka.

## Stripe (hors ta liste)
500 $ de crédits par équipe ([Luma](https://luma.com/0v3c010v)). Usage : une page de paiement en mode test pour montrer la route vers les premiers utilisateurs ; le mode test est gratuit de toute façon `[?]`. **BONUS DÉMO**, 15 min max. Activation et nature exacte des crédits : non trouvées `[?]`.

## Lightdash, Supabase, Miro (ignorés)
- **Lightdash** : outil de tableaux de bord relié à ta base ; accepte Postgres et ClickHouse, mais repose sur un projet dbt ([pricing](https://www.lightdash.com/pricing) · [connexion](https://docs.lightdash.com/get-started/setup-lightdash/connect-project)). Cloud Pro 3 000 $/mois au tarif public, offert 1 mois. Wow possible : graphique qui bouge sur ClickHouse pendant la démo. **IGNORER par défaut** (dbt + « dashboard » dans tes interdits) ; l'alternative maison est une page web qui lit ClickHouse.
- **Supabase** : Postgres managé + login + stockage. Pro à 25 $/mois, 8 Go ([pricing](https://supabase.com/pricing.md)). Doublon exact de PostgreSQL Aiven ; un jury Aiven préférera le Postgres Aiven. **IGNORER**.
- **Miro** : tableau blanc ; son MCP fonctionne sur tous les plans mais est désactivé par défaut en Enterprise, un admin doit l'activer ([doc](https://developers.miro.com/docs/mcp-intro)). Peut dessiner un schéma d'architecture pour le pitch. **IGNORER** pour le build.

## Ordre d'activation à 9h
Règle : les clés vont dans un `.env` que tu remplis toi-même ; rien dans le chat. Un cas réel complet (Runtime → Postgres → Claude) doit passer avant de lancer des lots en parallèle.

| Qui | Quoi, dans l'ordre | Test de fin |
|---|---|---|
| Adem (chemin critique) | 1. Console Aiven, projet, demander à l'organisateur qui est admin pour « Allow MCP connection ». 2. PostgreSQL + Valkey + Kafka (plans gratuits). 3. Aiven MCP dans Claude Code. | `SELECT 1` répond |
| Titouan | 1. Crédit Anthropic + clé. 2. Vercel AI Gateway + clé (repli). 3. OpenAI seulement si embeddings nécessaires. | 1 appel Claude via Vercel et en direct |
| Sullyvan | 1. ElevenLabs (crédits + clé). 2. Modal (`modal setup`). | 1 phrase vocale ; 1 fonction Modal lancée sur 10 conteneurs |
| Alexandre | 1. Dépôt GitHub + Dockerfile minimal. 2. Runtime : hello-world, « Deploy latest commit ». 3. Lovable seulement après choix du concept. | URL publique Runtime qui répond |
| Plus tard, seulement si le concept l'exige | n8n, ClickHouse, Stripe test, Lightdash | — |
| Non activés | Supabase, Miro | — |

Questions pour toi :
1. Fournisseur de secours : a) Vercel AI Gateway, b) OpenAI direct, c) aucun. Je recommande a, défaut a.
2. Calcul lourd au programme : a) oui, Modal activé dès 9h, b) on décide après le concept. Je recommande b, défaut b.
3. Voix en démo : a) oui, b) non. Je recommande b tant que le concept n'est pas choisi, défaut b.
