# 4. Terrain : les communautés (21 oct. 2026)

Décision débloquée : quelles mécaniques « agent sur un flux ou un gros jeu de données » existent déjà chez les bricoleurs et que l'on peut adopter en 7 h. Étoiles = API GitHub le 21/10/2026. `[?]` = non vérifié. Lecture rapide : presque tout ce qui marche chez les bricoleurs est une alerte sur un flux, donc rejeté par la carte (#7) et faisable sans base (#1). La valeur se trouve dans les mécaniques, pas dans les produits.

### 1. changedetection.io : surveille n'importe quelle page et prévient
- Donnée : pages web, PDF, API JSON, par polling (github.com/dgtlmoon/changedetection.io). Règles en langage naturel par LLM, mais seulement dans l'offre hébergée depuis juin 2026 (même README).
- Preuve : 35 174 étoiles (API GitHub) ; l'auteur affirme des usages en journalisme de données et sécurité (README, auto-déclaré).
- Manque : rien à l'échelle perso ; le trou est la compréhension du changement (diff brut, pas de contexte historique).
- Mécanique : détecter un changement rare et prévenir une personne précise.
- Rejet : #2 (déjà fait, 35 k étoiles), #7, #1 (SQLite suffit).

### 2. plane-notify (+ intégrations Home Assistant) : avions précis ou au-dessus de chez soi
- Donnée : ADS-B via OpenSky (gratuit) ou ADSBExchange (payant) (github.com/Jxck-S/plane-notify) ; adsb.lol / airplanes.live sans clé (github.com/Tobhs/flights_above).
- Preuve : 2 544 étoiles, mais dernier push juin 2024 [?] ; intégration HA Flightradar24 554 étoiles, fil de forum à ~490 messages (community.home-assistant.io/t/custom-component-flightradar24/641969). Un utilisateur y gagne de savoir quel hélicoptère de secours survole (même fil, juin 2026).
- Manque : l'explication. Un bricoleur a branché ChatGPT pour annoncer à voix haute les avions bas (github.com/LunaticKrave/ha-flightradar24-announcer, 45 étoiles). Aucun ne dit « pourquoi cet avion est inhabituel ».
- Mécanique : liste de surveillance nommée × flux massif.
- Rejet : #2, #7, #1.

### 3. anon / @congressedits : tweete les modifs Wikipédia faites depuis des plages IP de parlements
- Donnée : flux de modifications Wikimedia (stream.wikimedia.org) filtré par plages IP (github.com/edsu/anon).
- Preuve : 979 étoiles, 51 contributeurs, des dizaines de bots clones par pays ; Wikipédia a bloqué une IP du Congrès après le bot (theguardian.com/technology/2014/jul/25/us-congress-banned-editing-wikipedia-trolling). Cible morte : depuis le 4 nov. 2025 les comptes temporaires masquent les IP (en.wikipedia.org/wiki/CongressEdits).
- Manque : tout le contexte (conflit d'intérêts, réversion rapide, récidive par bureau).
- Mécanique : liste de surveillance × flux ; leçon : la source peut être fermée par la plateforme.
- Rejet : #3 (source morte), #7.

### 4. Bellingcat Auto Archiver : archive les liens collés dans une Google Sheet avant qu'ils soient supprimés
- Donnée : URLs de posts, vidéos, Telegram ; la feuille sert d'interface (github.com/bellingcat/auto-archiver).
- Preuve : 1 134 étoiles ; 150 000 pages préservées depuis 2022 ; adopté par rédactions et ONG (bellingcat.com/resources/2025/08/13/the-open-source-tool-that-has-preserved-150000-pieces-of-online-evidence/).
- Manque : décider quoi archiver. Ce sont des humains qui collent les liens ; rien ne repère seul le post qui va disparaître.
- Mécanique : capter avant disparition ; humain au centre, tableur comme UI.
- Rejet : #8 (outil pour enquêteurs, pas pour agents), mais utilisateur nommable (journalistes). #2.

### 5. Shadow Fleet Tracker Light : navires sanctionnés près de câbles sous-marins
- Donnée : flux websocket AISStream croisé avec le catalogue ukrainien GUR (1 200+ navires), SQLite, carte (github.com/FormerLab/shadow-fleet-tracker-light).
- Preuve : 44 étoiles, créé 17/03/2026, apparu sur Hacker News [?] (feedbagel.com/post/open-source-baltic-sea-shadow-fleet-tracker-local-ais-monitoring-with-cable-prox). Alerte à 10 km d'un câble, d'après un billet secondaire (patreon.com/posts/153285871).
- Manque : le dossier narratif (qui, quand, quel trajet) ; la liste est figée dans un catalogue.
- Mécanique : liste de surveillance × flux ; séquence d'événements (ports, extinction AIS, stationnement) lue comme une histoire.
- Rejet : #2 ; #1 non (SQLite suffit).

### 6. AIS Guardian : le même thème, déjà montré par Aiven
- Donnée : 5 000 signaux de navires par seconde, Kafka + Flink, mer Baltique (aiven.io/blog/free-tier-kafka-competition-the-winners).
- Preuve : cité dans le bilan du concours Kafka d'Aiven (13/02/2026). L'auteur dit avoir repéré le comportement du FITBURG avant la rupture du câble Finlande-Estonie (auto-déclaré, même page).
- Manque : [?] pas de code public vérifié (lopez.fi/projects/aisguardian non ouvert).
- Mécanique : séquence → récit.
- Rejet : #2 grave pour nous : l'organisateur le connaît. Éviter l'AIS Baltique.

### 7. camply / recreation-gov-campsite-checker : guette les annulations de campings
- Donnée : API publique Recreation.gov, polling (github.com/juftin/camply ; github.com/banool/recreation-gov-campsite-checker).
- Preuve : 656 et 362 étoiles ; camply poussé le 19/10/2026 ; notifications Telegram, SMS, Slack, etc.
- Manque : l'action. Il prévient, l'humain doit réserver en minutes. L'auteur de l'autre outil demande de ne pas en abuser (README banool).
- Mécanique : fenêtre de rareté (minutes) + prévenir la bonne personne.
- Rejet : #7, #2, #1.

### 8. ViteMaDose : agrège les créneaux de vaccination disponibles (2021)
- Donnée : scraping des plateformes de prise de rendez-vous ; le dépôt compte 95 702 commits, donc probablement Git comme base [?] (github.com/rozierguillaume/vitemadose).
- Preuve : Rozier cité par Les Echos comme data scientist le plus médiatisé (en.wikipedia.org/wiki/Guillaume_Rozier). Dépôt à 19 étoiles : l'usage s'est fait par le site, pas le code.
- Manque : source disparue avec la pandémie.
- Mécanique : fenêtre de rareté ; grand public français prouvé.
- Rejet : #3 (plus de données équivalentes), #7.

### 9. Bots Vinted (Vinted-Notifications, vinted-sniper) : alertes sur recherches enregistrées
- Donnée : scraping de recherches Vinted ; l'endpoint JSON d'un article est bloqué (403) par l'anti-bot (pypi.org/project/vinted-scraper). Leboncoin est protégé par DataDome (scrapfly.io/blog/posts/how-to-scrape-leboncoin-marketplace-real-estate).
- Preuve : 183 étoiles (github.com/Fuyucch1/Vinted-Notifications) ; produit payant avec achat en 1 clic (github.com/VINTISHOP/vintedbot) ; vinted-sniper : 5 étoiles, mais son « watchdog » prévient quand une recherche devient muette (github.com/jasp-nerd/vinted-sniper).
- Manque : juger si l'annonce est une affaire ; aucun historique de prix.
- Mécanique : fenêtre de rareté ; surveiller le silence de la source.
- Rejet : #3 (anti-bot), #7.

### 10. tracksuccession.com : changements de dirigeants lus dans les 8-K de la SEC
- Donnée : flux EDGAR ; un LLM extrait les champs du texte libre (news.ycombinator.com/item?id=47778306).
- Preuve : Show HN, 191 points, 63 commentaires (avril 2026) ; 50 $ pour le flux complet. Critiques : abonnement mince face à Bloomberg ; un commentaire souligne que l'Europe n'a pas d'équivalent SEC ; question RGPD (même fil).
- Manque : relations entre personnes et entreprises, demandées dans les commentaires (graphe de mouvements).
- Mécanique : texte réglementaire → événement structuré → profil historique de l'entité.
- Rejet : #6 (clients américains), mais l'analogue français est ouvert : BODACC (créations, procédures collectives) par API sans clé (github.com/AbsoluteAnchor/bodacc-scraper) ; BOAMP aussi (apify.com/zkrobotics/boamp-appels-offres, avec historique 24 mois de l'acheteur, 2 utilisateurs). #2 partiel.

### 11. BlueHoover : firehose Bluesky vers ClickHouse, tendances par jeton
- Donnée : Jetstream websocket, insertions par lots, SummingMergeTree par tranche de 10 min ; tendance = dernière heure contre moyenne des 24 h précédentes (altinity.com/blog/bluehoover-analyzing-bluesky-posts-with-clickhouse).
- Preuve : 6 étoiles (github.com/JosephRedfern/bluehoover) ; relayé par Altinity. Doublons Jetstream jusqu'à 24 h d'écart (clickhouse.com/blog/building-a-medallion-architecture-for-bluesky-json-data-with-clickhouse). CLI bluebird pour pousser vers ClickHouse, Kafka, Tinybird (npmjs.com/package/@sdairs/bluebird).
- Manque : tout ce qui est sémantique ; c'est un compteur de mots.
- Mécanique : dérive d'une fréquence contre sa propre base ; ClickHouse fait le travail.
- Rejet : #7 (dashboard) ; passe #1 car la base est le produit.

### 12. RappAlert : alertes sur les rappels produits français (RappelConso)
- Donnée : API RappelConso V2 (V1 dépréciée, V2 ajoute le GTIN code-barres) ; filtres marque, enseigne, mot-clé ; Telegram ou Discord (data.gouv.fr/reuses/rappalert, créé 10/07/2025).
- Preuve : [?] aucune : 0 discussion sur data.gouv.fr, pas de dépôt public vu.
- Manque : lier un rappel à CE foyer (ses achats, ses allergies).
- Mécanique : prévenir une personne précise d'un événement rare qui la concerne.
- Rejet : #2 partiel, #7. Utilisateur nommable (parent de nourrisson), mais source de preuve faible.

### 13. ratpstatus.fr : historique du trafic métro/RER/tram d'Île-de-France
- Donnée : API PRIM d'Île-de-France mobilités, relevé toutes les 2 min, % de bon fonctionnement par ligne et par heure depuis avril 2024 (ratpstatus.fr).
- Preuve : 140 étoiles, AGPL (github.com/wincelau/ratpstatus, via topics GitHub « statut »).
- Manque : une fois l'historique accumulé, pas de réponse du genre « ligne 13 à 61 %, est-ce normal pour un mardi ? ».
- Mécanique : mémoire d'une source qui n'expose que le « maintenant ».
- Rejet : #7 (dashboard), #2.

### 14. Regards Citoyens (NosDéputés, La Fabrique de la Loi, suivi de documents)
- Donnée : robots qui scrutent Assemblée et JO toutes les 8 h, revue humaine quotidienne (README NosDéputés, via recherche ; ancienneté [?]) ; versions de documents parlementaires suivies par dépôt Git (github.com/regardscitoyens/suivi-documents-parlementaires, MAJ juil. 2026).
- Preuve : nosdeputes.fr 154 étoiles (API GitHub), the-law-factory 78 ; données ODbL et API (regardscitoyens.org/publication/). 2,8 M d'avantages pharma ouverts (regardscitoyens.org).
- Manque : reconstituer qui a modifié quoi dans un texte de loi, en langage clair, pour un acteur précis (lobbyiste, journaliste, collectivité).
- Mécanique : reconstruire une histoire à partir de milliers de modifications.
- Rejet : #2 (existe), mais le suivi de versions plus raisonnement est un angle ouvert.

### 15. Politwoops : tweets supprimés par les élus
- Donnée : flux Twitter, enregistre tweet puis suppression et durée de vie (sunlightfoundation.com/2012/05/30/announcing-politwoops).
- Preuve : 3 000+ tweets en 6 mois, 13 versions nationales, presse large (techcrunch.com/2012/05/30/the-internet-never-forgets-politwoops-saves-the-tweets-your-politicians-tried-to-delete). Coupé par Twitter en 2015 (cnn.com/2015/06/04/politics/twitter-shuts-down-politwoops), à nouveau à l'arrêt via ProPublica après un changement d'API (projects.propublica.org/politwoops).
- Manque : source ouverte équivalente. Jetstream (Bluesky) expose les suppressions : testé le 21/10, voir « Vérifications ».
- Mécanique : détecter la disparition, pas l'apparition.
- Rejet : #3 pour X ; Bluesky est observable (voir « Vérifications »).

## 6 mécaniques transférables (proba qu'un autre LLM la propose : mon estimation, pas une mesure)
1. **Liste de surveillance × flux massif** (2, 3, 5). Une petite liste nommée, tenue par une communauté (catalogue GUR, plages IP), croisée avec un flux géant. La valeur est la liste. ~45 %.
2. **Disparition et silence** (4, 9, 15). Alerter sur ce qui s'efface, ou sur la source qui se tait. Le watchdog de vinted-sniper et l'histoire des pigeons sur un nourrisseur connecté mesuré via Kafka (aiven.io/blog/how-i-discovered-pigeons-sabotaging-my-project-with-aiven-free-tier-kafka) montrent que surveiller le capteur est un produit. ~10 %.
3. **Fenêtre de rareté + action** (7, 8, 9). Un créneau dure des minutes ; le trou est l'exécution, pas l'alerte. ~35 %.
4. **Mémoire d'une source qui n'expose que le maintenant** (13, 11, 14). Accumuler l'historique que personne ne garde, puis répondre « est-ce normal ? » contre sa propre base. Passe le test #1 par construction. ~25 %.
5. **Texte réglementé → événement structuré → fiche historique** (10, 12). Un LLM lit le texte libre, l'événement s'attache à une entité dont on garde 24 mois. ~30 %.
6. **Séquence → récit** (5, 6, 14). Des centaines d'événements reconstruits en un dossier daté. GDELT : StoryTrace suit une dépêche à travers les médias, simple entrée de hackathon, aucun code vu (lablab.ai/u/@Kylanmendoza [?]). ~25 %.

Signal propre à ce hack : Aiven a récompensé en 2026 un jeu Kafka et une notification de colis ; ils jugent 50 % la réalisation, 50 % le récit publié (aiven.io/blog/free-tier-apache-kafkar-competition).

## Ce que je n'ai pas trouvé
- Reddit (r/dataengineering, r/OSINT, r/selfhosted, r/datasets), Discord, YouTube, Telegram : l'outil de recherche n'y accède pas ; un lien r/OSINT sur le shadow fleet donne 404. Aucune preuve de commentaires utilisateurs hors Hacker News et le forum Home Assistant.
- Aucun projet communautaire avec boucle d'amélioration réelle (retour utilisateur qui affine les seuils). Les cas « mémoire qui s'affine » restent une promesse, pas une preuve.
- Enchères judiciaires : Licitor publie ~400 annonces actives (licitor.com/dernieres-encheres.html), sans API ni bot open source vu. Billets, files d'attente, parkings, caméras de trafic : seul un scraper Singapour (apify.com/hipersoft/sg-carpark-scraper). Radios : scanners + Whisper + LLM existent mais à 0 étoile [?] (github.com/arandomguyhere/ScannerTranscribe).
- Presse de données : Aleph (OCCRP) est en fin de vie, remplacé par Aleph Pro et le fork OpenAleph (github.com/alephdata/aleph). Rien de vérifié côté Décodeurs, Code for France ; Datactivist est un cabinet de conseil, pas un produit (platform.tracxn.com).

## Vérifications du 21/10/2026 (mesures faites ici, pas des estimations)
**BODACC, requête réelle** sur `bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records`, sans clé.
- Volume : 51 132 086 annonces. Depuis le 14/10 : 16 155 créations, 13 978 modifications, 8 901 radiations, 5 265 procédures collectives, 1 060 ventes/cessions, 47 846 dépôts de comptes.
- Fraîcheur : `max(dateparution)` = 2026-10-21, le jour même. Quota lu dans l'en-tête : 5 000 000 requêtes par jour.
- Champs utiles : `registre` (SIREN), `commercant`, `tribunal`, `familleavis_lib`, `dateparution`, `jugement`, `acte`, `listepersonnes` (dirigeants, capital, forme juridique) et `listeetablissements` (activité), les derniers en JSON dans une chaîne.
- Reconstruction par entreprise : le SIREN 300317203 a 31 annonces de 2008 à 2026 (comptes, modifications, puis procédures collectives 07/2025, deux en 11/2025, deux en 10/2026). Une histoire se lit en une requête.
- Pièges : `registre` existe sous deux écritures (« 300 317 203 » et « 300317203 ») ; 396 des 5 265 procédures collectives récentes (7,5 %) n'ont aucun SIREN ; `parutionavisprecedent` était vide sur les 30 lignes vues, donc le lien entre avis se fait à la main par SIREN et date.
- Pour qui : mandataires, fournisseurs et assureurs-crédit qui veulent savoir quel client glisse. Pas testé : l'appel à un LLM sur le texte du jugement, qui est en JSON structuré, donc l'extraction LLM apporte peu ici ; la valeur est le croisement historique.

**Suppressions Jetstream (Bluesky)**, 40 s d'écoute de `jetstream2.us-east.bsky.network` filtrée sur posts, likes, reposts.
- Observable : oui. 88 suppressions de posts en 40 s, soit 2,2 par seconde, pour 35 créations par seconde (environ 6 %). 10 Mo par minute sur ce filtre.
- Limite décisive : l'événement de suppression ne contient que `did`, `collection` et `rkey`, sans texte ni date de création. Il faut avoir stocké soi-même chaque création pour savoir ce qui a été supprimé. Le « Politwoops Bluesky » exige donc d'enregistrer tous les posts d'une liste de comptes d'avance.
- Qui s'en servirait : journalistes politiques et cellules de veille de communication [?], non vérifié. Aucune preuve d'usage trouvée (Politwoops existait pour cela sur X, source ci-dessus).
- Cadre : volume tenable pour une liste de comptes (quelques dizaines) ; l'enregistrement complet du firehose est plus lourd. Posts supprimés par des personnes privées : RGPD à traiter, à limiter aux élus et à leurs comptes publics.
