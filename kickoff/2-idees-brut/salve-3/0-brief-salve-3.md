# Salve 3 : brief commun (21 oct. 2026, soir)

## Le hack
Accel AI Innovate Paris, 22 oct. 2026, 7 h de build (9h–16h), pitch de 3 min devant un jury à 16h. Organisé par **Accel, fonds de capital-risque** (Legora, Doctolib, Payfit, Synthesia), avec Iterate ; sponsor technique Aiven. Équipe : 4 builders IA et business, étudiants à Paris.

Brief officiel : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. Strong teams need more than code. Product thinking, design and a credible route to first users all count. » Critères publiés à l'étape d'Amsterdam : valeur pour l'utilisateur, potentiel d'entreprise, avantage mesurable du modèle, exécution technique.

Couche données Aiven, à justifier brique par brique : PostgreSQL (mémoire, état, piste d'audit), Kafka (flux d'événements), ClickHouse (analyse de milliards de lignes, historique), Valkey (état courant, cache), OpenSearch (recherche texte et vecteurs). Calcul massif possible sur Modal (GPU). Voix : ElevenLabs.

## Ce que le jury a déjà primé dans cette série (posts LinkedIn)
- **SiteSync, 1er à Stockholm** : « directeur de chantier numérique », les caméras **déjà présentes** sur le chantier deviennent un système qui suit l'avancement et repère les blocages. Référence de goût d'Adem.
- **Re-Addie, 2e à Stockholm** : refait une pub vidéo existante avec ton produit dedans.
- **LuminoCare, Londres (revendiqué)** : l'agent fait tourner seul une agence d'aide à domicile.
- Thèse d'Accel sur les apps verticales : la valeur est dans le contexte, la donnée et l'outillage difficiles à acquérir (juridique, comptabilité, finance, assurance, santé, industrie) ; un « collègue IA » pour une équipe plutôt qu'un assistant individuel.

## Ce qu'Adem a rejeté, et pourquoi
- **Salve 1** (données publiques de l'État : registres d'entreprises, marchés publics, rappels de produits, eau potable, DPE, gel des avoirs, survols d'Orly) : trop administratif, trop petit, l'agent fait trop peu (proche d'une alerte).
- **Salve 2** (caméras et flux : réalisateur de plateau multi-téléphones, quai qui chronomètre les camions, terrain de padel vide, vérificateur de speedrun, salage des routes en Finlande, baleines et cargos, stratège de karting, coursiers guidés à la voix, contrôle d'Airbnb après ménage) : « pas trop mal », mais il fallait **installer ou filmer nous-mêmes**, il n'y avait **pas d'effet wow**, et les marchés étaient **trop petits pour un fonds**.
Ne repropose aucune de ces idées, même déguisée.

## Les quatre filtres (une idée qui en rate un est morte)
1. **Réalisable demain sans rien installer.** La donnée existe déjà : flux ou API publique, ou donnée que le client a déjà dans un format standard (vidéos de caméras existantes, e-mails, PDF, appels enregistrés, exports de logiciel métier) dont on trouve un vrai échantillon public pour la démo. Interdit : poser une caméra, un capteur, filmer nous-mêmes, jouer la flotte ou le terrain.
2. **Effet wow.** Un moment précis que le jury raconte le soir : une échelle impossible pour un humain (un pays entier, dix ans, un million de documents en 40 s), une vitesse (le monde réel qui bouge et l'agent qui réagit devant eux), ou une pièce qui prend des semaines à un professionnel produite en direct. Une carte avec des points ou un tableau qui se remplit ne compte pas.
3. **Commercialisable à l'échelle d'un fonds.** Un acheteur qui paie déjà ce travail aujourd'hui (salaire, prestataire, cabinet, logiciel), un prix plausible, un nombre de clients en Europe, une route vers les 10 premiers. Le marché doit pouvoir dépasser 100 M€ par an. La donnée accumulée doit rendre la copie difficile.
4. **L'agent fait un vrai travail** que paie aujourd'hui un humain qualifié. Si on retire la donnée, rien ne marche ; si on retire l'agent, une requête SQL ne suffit pas.

## Interdits (carte de rejet)
Chatbot ; dashboard ; « plateforme qui aide X » ; assistant généraliste ; extension qui alerte ; outil pour développeurs ou pour agents IA ; « chat avec tes données » ; RAG sur documents d'entreprise ; agent personnel (mémoire, santé, podcasts) ; agent qui surveille une base de données (Aiven le vend) ; navires sanctionnés en Baltique ; analyste de données en langage naturel (Hex, Basedash, ClickHouse Agents) ; veille BODACC, veille d'appels d'offres, audit de factures de fret, vérification de sous-traitants (marchés équipés).

## Format de chaque idée
### [titre de 5 mots max, pas de nom de produit]
- **Pour un ami (2 phrases, zéro jargon)** : qui est l'utilisateur, ce que l'outil fait à sa place.
- **Le moment wow** : la phrase que le jury répétera le soir, et ce qu'il voit à l'écran à ce moment-là.
- **Le travail remplacé** : quel poste, combien il coûte aujourd'hui (salaire, prestation), et pourquoi une alerte ou une requête SQL ne suffit pas.
- **Qui paie, combien, combien de clients** : acheteur précis, prix annuel plausible, nombre de clients en Europe, taille de marché (ordre de grandeur, marqué `[?]` si non sourcé).
- **Donnée disponible à 9h demain** : source exacte, accès (sans compte, clé gratuite, échantillon public), vérifiée ou `[?]`. Rien à installer.
- **Briques Aiven** : seulement les nécessaires, rôle en une ligne chacune.
- **Ce que la base sait après 1 000 clients** : la donnée qui rend la copie difficile.
- **Faisable en 7 h ?** : ce qu'on construit vraiment, ce qu'on simule, le point le plus risqué.
- **% LLM** : probabilité (0-100 %) qu'un autre LLM propose cette idée. Au moins 3 idées sous 20 %.
