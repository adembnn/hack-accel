# Salve 5 : brief commun (21 oct. 2026, soir)

## Le hack
Accel AI Innovate Paris, 22 oct. 2026, 7 h de build (9h–16h), pitch de 3 min à 16h. Organisé par **Accel, fonds de capital-risque** (Legora, Doctolib, Payfit, Synthesia), avec Iterate ; sponsor technique Aiven. Équipe : 4 builders IA et business, étudiants à Paris, pas d'expert métier.

Brief officiel : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. Strong teams need more than code. Product thinking, design and a credible route to first users all count. »

Couche données Aiven, à justifier brique par brique : PostgreSQL (PostGIS disponible), Kafka, ClickHouse, Valkey, OpenSearch. Calcul : Modal (GPU). Voix : ElevenLabs. Front 3D ou carte : three.js, CesiumJS, deck.gl, MapLibre.

Gagnants précédents de cette série : SiteSync (caméras de chantier existantes → directeur de chantier numérique, 1er à Stockholm), Re-Addie (pub vidéo refaite avec ton produit), LuminoCare (l'agent fait tourner une agence d'aide à domicile, Londres).

## La mécanique qu'Adem veut (« j'ai la vision »)
**Reconstruire quelque chose de réel à partir de données publiques (un lieu, un système, un marché, une compétition, une organisation), construire des scénarios, les visualiser (3D, carte, rejeu animé), puis sélectionner et justifier le meilleur.** Il a aussi aimé deux variantes : l'agent qui négocie ou exécute la décision auprès de vrais interlocuteurs, et le « jumeau » d'un lieu réel nourri de flux en direct où l'on essaie les décisions avant de les prendre.

## Ce qu'Adem a rejeté (ne rien reproposer, même déguisé)
- Salve 1 : données administratives de l'État comme cœur, utilisateurs en costume (registres d'entreprises, marchés publics, rappels de produits, eau potable, DPE, gel des avoirs, survols).
- Salve 2 : tout ce qui exige d'installer une caméra ou un capteur, de filmer nous-mêmes, de jouer la flotte.
- Salve 3 : « paperasse » (dossiers, rapports, audits, due diligences, conformité).
- Salve 4 : petits marchés logistiques dont il ne voit pas la monétisation (péniches du Rhin, Vélib, parcs d'attractions, avitaillement, jets à vide, logement de techniciens, remorqueurs, croisières, béton).
- Salve « climat » : crue, canicule, îlots de chaleur, argiles, adaptation climatique des bâtiments, jugée « sans issue ».

## Filtre zéro : la preuve de paiement (avant toute idée)
Chaque idée part d'une **preuve qu'un acheteur paie déjà beaucoup pour ce travail de scénarios** : un rachat, une levée importante, un prix public, un budget nommé, une profession bien payée qui le fait à la main. Sans source, l'idée est morte. Exemples de preuves (à vérifier, à dépasser) : Spacemaker racheté 240 M$ par Autodesk (implantation de bâtiments par scénarios) ; o9 Solutions et Kinaxis (planification de chaîne logistique par scénarios) ; Second Spectrum racheté par Genius Sports (données de suivi sportif) ; Placer.ai (flux de visiteurs) ; les cabinets de conseil en stratégie qui vendent des scénarios.

## Les quatre filtres
1. **Rien à installer** : données publiques, ou données que le client a déjà avec un vrai échantillon public, accessibles demain à 9h.
2. **Effet wow** : un moment que le jury raconte le soir (le juré donne une entrée, le monde réel se reconstruit sous ses yeux, les scénarios se jouent, le meilleur gagne).
3. **Commercialisable pour un fonds** : prix, nombre de clients en Europe, marché qui peut dépasser 100 M€/an, donnée accumulée qui rend la copie difficile.
4. **L'agent fait un vrai travail** : il construit les scénarios, les fait tourner, compare, choisit, justifie, apprend. Sans la donnée, rien ; sans l'agent, un simulateur seul ou une requête SQL ne suffit pas.

## Interdits
Chatbot ; dashboard ; « plateforme qui aide X » ; assistant généraliste ; extension qui alerte ; outil pour développeurs ou pour agents IA ; « chat avec tes données » ; RAG documentaire ; agent personnel ; « équipe de N agents spécialisés » ; scénarios d'attaque contre des lieux réels ; démarchage de particuliers.

## Format de chaque idée
### [titre de 5 mots max, pas de nom de produit]
- **Preuve de paiement** : qui paie déjà, combien, avec la source (lien).
- **Pour un ami (2 phrases, zéro jargon)** : qui est l'utilisateur, ce que l'agent fait à sa place.
- **Le moment wow** : la phrase que le jury répétera, et ce qu'il voit.
- **Ce qu'on reconstruit et les scénarios** : la chose réelle reconstruite, les scénarios que l'agent fabrique, comment il choisit.
- **Donnée disponible à 9h demain** : sources exactes, vérifiées ou `[?]`.
- **Qui paie, combien, combien de clients** : acheteur précis, prix annuel, clients en Europe, taille de marché.
- **Briques Aiven** : seulement les nécessaires, rôle en une ligne.
- **Concurrent le plus proche et la différence.**
- **Faisable en 7 h ?** : ce qu'on construit, ce qu'on simule, le point le plus risqué.
- **% LLM** : probabilité (0-100 %) qu'un autre LLM propose cette idée. Au moins 3 idées sous 20 %.
