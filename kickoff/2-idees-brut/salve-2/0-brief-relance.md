# Relance de la divergence : brief commun (21 oct. 2026, soir)

## Le hack
Accel AI Innovate Paris, 22 oct. 2026, 7 h de build, 4 personnes (Adem, Titouan, Sullyvan, Alexandre : builders IA et business, étudiants à Paris). Brief officiel : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. » Déploiement sur Aiven Runtime ; couche données Aiven : PostgreSQL (mémoire, état), Kafka (flux d'événements), ClickHouse (analyse de très gros volumes, historique), Valkey (mémoire rapide, cache), OpenSearch (recherche texte et vecteurs). Comptent aussi : pensée produit, design, route crédible vers les premiers utilisateurs. Crédits : Anthropic, OpenAI, Modal (calcul massif, GPU), ElevenLabs (voix), Lovable (front rapide), n8n, Stripe test.

## Pourquoi on relance
Adem a rejeté une première salve de 45 idées. Motifs, dans ses mots : trop administratif, pas sexy ; trop petit, pas assez « gros système » ; l'agent fait trop peu (proche d'une alerte). La première salve partait de données publiques de l'État français (registres d'entreprises, marchés publics, rappels de produits, eau potable, diagnostics énergétiques, gel des avoirs, survols d'Orly) avec des utilisateurs en costume (mairie, PME, pharmacien, conseil syndical). **Ces terrains sont interdits dans la relance** comme source principale.

## Ce que le jury de cette série a primé (posts LinkedIn, pas de communiqué officiel)
- **SiteSync, 1er à Stockholm (sept. 2026)** : « directeur de chantier numérique » qui transforme les caméras de chantier en système d'intelligence de projet en direct ; relie les images aux données du projet pour voir l'avancement, repérer les goulots, décider. **C'est la référence de goût d'Adem.**
- **Re-Addie, 2e à Stockholm** : recrée des pubs vidéo existantes avec ton propre produit dedans.
- **LuminoCare, gagnant revendiqué à Londres (oct. 2026)** : l'agent fait tourner à lui seul une agence d'aide à domicile.
- Points communs : métier physique ou opérationnel ; l'agent fait le travail (il pilote, il remplace un poste), il ne prévient pas ; entrée visuelle ou du monde réel ; ambition lisible en une phrase.
- Critères publiés à Amsterdam : valeur pour l'utilisateur, potentiel d'entreprise, avantage mesurable du modèle, exécution technique.

## Contraintes de la relance (choisies par Adem, au moins une par idée, idéalement deux)
1. **Flux mondial en direct** : la donnée arrive en continu, du monde entier (exemples d'amorce, à dépasser : positions d'avions ou de navires, séismes, éclairs, trafic, sport en direct, parties d'échecs en ligne, chats de streams, marchés, météo spatiale, réseaux sociaux ouverts).
2. **Monde physique** : l'agent voit, entend ou mesure le réel (caméras, webcams publiques, vidéo filmée par l'utilisateur, micro, capteurs, radio, images satellites).
3. **Donnée créée par l'usage** : chaque utilisation ajoute à la base quelque chose que personne d'autre n'a, et le produit est meilleur demain qu'aujourd'hui.

## Ce qu'on attend d'une idée
- **Gros système** : plusieurs briques qui s'enchaînent, une démo qui en met plein la vue en 3 minutes, et qu'on finira après le hack.
- **L'agent fait un vrai travail** que ferait un humain payé (un chef de chantier, un régisseur, un coach, un dispatcher, un scout, un monteur), pas une alerte ni un résumé.
- **Sans la donnée, rien** : si on retire la base, l'agent ne sert à rien. Si on retire l'agent et qu'une requête SQL suffit, l'idée est perdue.
- Un utilisateur qu'on pourrait appeler demain soir.

## Interdits (carte de rejet)
Chatbot ; dashboard ; « plateforme qui aide X » ; assistant généraliste ; extension qui alerte ; outil pour développeurs ou pour agents IA ; « chat avec tes données » ; RAG sur documents d'entreprise ; agent personnel (mémoire, santé, podcasts) ; agent qui surveille une base de données (Aiven le vend déjà) ; navires sanctionnés en mer Baltique (déjà primé par Aiven) ; tout ce qui dépend d'un contrat ou d'une API fermée qu'on n'aura pas demain à 9h.
