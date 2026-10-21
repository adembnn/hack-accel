# Étape 3 : brief commun (21 oct. 2026, soir)

## Le hack
Accel AI Innovate Paris, 22 oct. 2026, 7 h de build (9h–16h), pitch de 3 min à 16h. Organisé par **Accel, fonds de capital-risque**, avec Iterate ; sponsor technique Aiven. Équipe : 4 builders IA et business, étudiants à Paris, pas d'expert métier.

Brief officiel : « Build a working product where one or more agents depend on data to deliver value for a specific user. That could mean querying large datasets, reacting to event streams, keeping long-term memory, combining many sources or improving over time from past runs. Strong teams need more than code. Product thinking, design and a credible route to first users all count. »

Couche données Aiven, à justifier brique par brique : PostgreSQL (avec PostGIS si disponible `[?]`), Kafka, ClickHouse, Valkey, OpenSearch. Calcul massif : Modal (GPU). Front : three.js, CesiumJS, deck.gl ou MapLibre.

## Ce qu'Adem a choisi
La mécanique : **reconstruire un lieu réel en 3D à partir de données publiques, construire des scénarios, les visualiser, et sélectionner le meilleur.** Adem : « j'ai la vision ».

Les deux pistes cochées :
- **B. Crue ou canicule rejouée en 3D sur le relief réel, puis le meilleur investissement d'adaptation par bâtiment.** Preuve que ce marché paie : First Street (risque climatique par bâtiment, 46 M$ levés) racheté par MSCI pour 120 M$ annoncé en 2026 (source unique).
- **G. Où planter des arbres ou retirer du bitume, avec la température simulée selon chaque scénario.**
Adem : « n'hésite pas à innover ».

## Ce qu'Adem a rejeté (ne rien reproposer, même déguisé)
Données administratives comme cœur du produit avec utilisateur en costume ; matériel à installer ; « paperasse » (rapports, dossiers, audits rédigés) ; idées dont il ne voit pas comment elles se vendent. Il veut du réel, des agents qu'on voit agir, une vision, et un marché qu'un fonds financerait.

## Les filtres (une forme qui en rate un est morte)
1. **Rien à installer** : données publiques ou données que le client a déjà, accessibles demain à 9h.
2. **Effet wow** : un moment que le jury raconte le soir (exemple : un juré donne l'adresse de son école, son quartier sort en 3D, l'été 2050 s'y rejoue, l'agent choisit les 12 arbres qui font baisser la température de la cour de 3 °C).
3. **Commercialisable pour un fonds** : un acheteur qui paie déjà ce travail (bureau d'études, consultant, logiciel), un prix, un nombre de clients en Europe, un marché qui peut dépasser 100 M€/an, une donnée accumulée qui rend la copie difficile.
4. **L'agent fait un vrai travail** : il construit les scénarios, les fait tourner, compare, choisit et justifie. Sans la donnée, rien ; sans l'agent, un simulateur seul ou une requête SQL ne suffit pas.

## Interdits
Chatbot ; dashboard ; « plateforme qui aide X » ; assistant généraliste ; extension qui alerte ; outil pour développeurs ou pour agents IA ; « chat avec tes données » ; RAG documentaire ; agent personnel ; « équipe de N agents spécialisés ».
