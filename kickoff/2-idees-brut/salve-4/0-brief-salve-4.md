# Salve 4 : brief commun (21 oct. 2026, soir)

## Le hack
Accel AI Innovate Paris, 22 oct. 2026, 7 h de build (9h–16h), pitch de 3 min à 16h. Organisé par **Accel, fonds de capital-risque**, avec Iterate ; sponsor technique Aiven. Équipe : 4 builders IA et business, étudiants à Paris, pas d'expert métier.

Brief officiel : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. Strong teams need more than code. Product thinking, design and a credible route to first users all count. »

Couche données Aiven, à justifier brique par brique : PostgreSQL (mémoire, état, piste d'audit), Kafka (flux d'événements), ClickHouse (historique, milliards de lignes), Valkey (état courant, cache), OpenSearch (recherche texte et vecteurs). Voix : ElevenLabs (synthèse et agents vocaux ; un vrai appel sortant demande un numéro Twilio). Calcul : Modal.

Gagnants précédents de la série : SiteSync (caméras de chantier déjà présentes → directeur de chantier numérique), Re-Addie (pub vidéo refaite avec ton produit), LuminoCare (l'agent fait tourner une agence d'aide à domicile).

## Les deux directions choisies par Adem
- **D. L'agent négociateur** : un agent qui écrit ou téléphone à de vrais fournisseurs ou transporteurs, négocie un prix et se souvient de chaque échange. Adem : « ça je peux avoir la vision ».
- **F. Le jumeau qui teste** : l'agent reconstitue un lieu réel (port, aéroport, ou autre) à partir de ses flux en direct, et essaie ses décisions avant de les prendre. Adem : « j'ai carrément la vision aussi ».
- Les deux peuvent fusionner : le jumeau teste une décision, l'agent part la négocier ou l'exécuter auprès de vrais interlocuteurs.

## Ce qu'Adem a rejeté (ne rien reproposer, même déguisé)
- Données administratives de l'État et utilisateurs en costume (registres d'entreprises, marchés publics, rappels de produits, eau, DPE, gel des avoirs).
- Idées qui exigent d'installer une caméra ou un capteur, de filmer nous-mêmes ou de jouer la flotte.
- « Paperasse » : agents qui rédigent des dossiers, rapports, audits, due diligences, déclarations de conformité.
- Ce qu'il veut : **du réel** (le monde physique, des choses qui bougent) **ou des agents qu'on voit agir**.

## Les quatre filtres (une idée qui en rate un est morte)
1. **Rien à installer** : la donnée existe déjà (flux ou API publique, ou donnée que le client a déjà, dont on trouve un vrai échantillon public). Pour D, les interlocuteurs sont réels ou joués par un juré, jamais simulés par nous en coulisse sans le dire.
2. **Effet wow** : un moment que le jury raconte le soir (exemples : l'agent appelle quelqu'un pendant le pitch et obtient un prix ; le jumeau rejoue la journée de demain et montre ce qui casse ; un juré joue le fournisseur et se fait négocier).
3. **Commercialisable pour un fonds** : un acheteur qui paie déjà ce travail (salaire, prestataire, logiciel), un prix, un nombre de clients en Europe, un marché qui peut dépasser 100 M€/an, une donnée accumulée qui rend la copie difficile (par exemple tous les prix réellement obtenus chez tous les clients).
4. **L'agent fait un vrai travail** que paie aujourd'hui un humain (acheteur, affréteur, dispatcher, régulateur, planificateur). Sans la donnée, rien ; sans l'agent, une requête SQL ne suffit pas.

## Interdits (carte de rejet)
Chatbot ; dashboard ; « plateforme qui aide X » ; assistant généraliste ; extension qui alerte ; outil pour développeurs ou pour agents IA ; « chat avec tes données » ; RAG documentaire ; agent personnel ; agent qui surveille une base de données ; navires sanctionnés en Baltique ; « équipe de N agents spécialisés » ; démarchage téléphonique de particuliers.

## Format de chaque idée
### [titre de 5 mots max, pas de nom de produit]
- **Pour un ami (2 phrases, zéro jargon)** : qui est l'utilisateur, ce que l'agent fait à sa place.
- **Le moment wow** : la phrase que le jury répétera, et ce qu'il voit ou entend à l'écran.
- **Le travail remplacé** : quel poste, ce qu'il coûte, pourquoi une requête SQL ou une alerte ne suffit pas.
- **Qui paie, combien, combien de clients** : acheteur précis, prix annuel, nombre de clients en Europe, taille de marché (`[?]` si non sourcé).
- **Donnée disponible à 9h demain** : source exacte et accès (vérifié ou `[?]`). Rien à installer.
- **Briques Aiven** : seulement les nécessaires, rôle en une ligne.
- **Ce que la base sait après 1 000 clients** : la donnée qui rend la copie difficile.
- **Concurrent le plus proche** : nom, ce qu'il fait, levée si connue, et la différence.
- **Faisable en 7 h ?** : ce qu'on construit, ce qu'on simule (et comment on le dit), le point le plus risqué.
- **% LLM** : probabilité (0-100 %) qu'un autre LLM propose cette idée. Au moins 3 idées sous 20 %.
