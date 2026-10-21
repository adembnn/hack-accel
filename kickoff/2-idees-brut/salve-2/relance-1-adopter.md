# Relance 1 : Adopter, Adapter, Scaler

Angle : un geste réel où des yeux humains regardent le monde physique ou un flux et décident, transposé à un autre métier, puis tenu à l'échelle par un agent qui dépend de la donnée.

Vérification des sources (4 lectures de documentation, aucun appel payant) :
- Vérifié sur la documentation officielle : Digitraffic Finlande (caméras de route et stations météo, adresses ci-dessous, images toutes les 10 min environ, stations toutes les minutes). La page ne parle ni de clé ni de compte ; de mémoire, Digitraffic recommande un en-tête `Digitraffic-User`.
- Vérifié partiellement : Entur Norvège (flux GTFS-RT trip-updates, rafraîchi toutes les 15 s, adresse documentée ; la page ne dit pas si une clé est requise).
- Non vérifié `[?]` : adsb.lol, Bluesky Jetstream, USGS, NOAA SWPC, Open-Meteo, Lichess. Ce que j'en sais vient de la mémoire ; à tester par un `curl` demain à 9 h avant de bâtir dessus.

---

### Quelle route saler cette nuit
- **Pour un ami (2 phrases, zéro jargon)** : Le responsable d'astreinte d'un réseau routier décide en pleine nuit quels camions de salage partent sur quelles routes. L'outil regarde les caméras de la route et les capteurs de chaussée, choisit les tournées et écrit l'ordre à chaque chauffeur.
- **Ce qu'on voit à l'écran en démo** : Une carte de Finlande couverte de photos de route qui se rafraîchissent, chacune annotée par l'agent (« verglas probable, 2 mm de neige »), six tournées de camions tracées, puis dix minutes plus tard la nouvelle photo avec le verdict « route dégagée, décision utile » ou « salage inutile ».
- **Le travail que l'agent remplace** : Le chef d'astreinte de viabilité hivernale (celui qu'on réveille à 3 h). Une alerte dit « il gèle » ; elle ne choisit ni le nombre de camions, ni l'ordre des routes, ni ne juge sur photo qu'une route est blanche alors que le capteur dit 1 °C. Une requête SQL ne lit pas une image.
- **Donnée** : Digitraffic Finlande, caméras `tie.digitraffic.fi/api/weathercam/v1/stations/data` (images `weathercam.digitraffic.fi/{presetId}.jpg`) et stations météo `tie.digitraffic.fi/api/weather/v1/stations/data` (température de chaussée, humidité), vérifié sur la documentation officielle. Prévisions : Open-Meteo `[?]`. La flotte de camions est inventée pour la démo. Les décisions et leurs verdicts sont créés par l'usage.
- **Briques Aiven** : Kafka (arrivée des mesures de 500 stations et des images), ClickHouse (historique mesures, décisions et verdicts), PostgreSQL (tournées, état des camions).
- **Ce que la base sait après 100 utilisations** : Pour chaque tronçon, la suite de conditions (image, température chaussée, humidité, heure) qui a donné du verglas que les capteurs ne voyaient pas, et le seuil à partir duquel saler était inutile. Personne ne garde le lien entre une décision de salage et l'image d'après.
- **Utilisateur à appeler demain soir** : Chef de district de viabilité hivernale (société d'autoroute ou service routier d'un département).
- **% LLM** : 6 %
- **Risque principal** : Les camions n'existent pas demain ; le verdict repose sur la photo suivante, pas sur une vraie tournée. Contraintes : monde physique, donnée créée par l'usage.

### Où emmener le car ce soir
- **Pour un ami (2 phrases, zéro jargon)** : Un guide de sorties aurores boréales doit choisir, à 18 h, où conduire 40 clients, parce que les nuages décident de tout. L'outil choisit le lieu et l'heure de départ, écrit aux clients et au chauffeur, puis vérifie après coup si l'aurore a eu lieu.
- **Ce qu'on voit à l'écran en démo** : Une carte de Laponie avec l'ovale d'aurore et les trouées de nuages ; l'agent désigne un parking à 90 minutes de route et envoie un SMS aux 40 clients ; plus tard, les photos des clients arrivent et l'agent écrit « aurore visible, Kp 4, ciel dégagé à 80 % ».
- **Le travail que l'agent remplace** : Le guide-chauffeur ou le patron d'agence qui, à 17 h, ouvre cinq sites météo et dix webcams. Une alerte Kp existe déjà partout ; elle ne sait pas où se trouve la trouée de nuages dans 90 minutes de route, ni ne réécrit le plan quand le vent change à 20 h.
- **Donnée** : NOAA SWPC, indice Kp et grille d'aurore `[?]` (`services.swpc.noaa.gov/json/`, de mémoire sans clé) ; Open-Meteo, nuages bas, moyens et hauts par point `[?]` ; webcams de route de Laponie par la même API Digitraffic que ci-dessus (vérifié). Les photos des clients sont créées par l'usage.
- **Briques Aiven** : PostgreSQL (sorties, clients, décisions), ClickHouse (historique Kp, nuages, lieu et résultat vu).
- **Ce que la base sait après 100 utilisations** : Pour chaque lieu, la probabilité réelle de voir l'aurore selon l'indice Kp, la couverture nuageuse et la lune, mesurée par des photos de clients. Les sites publient des prévisions ; personne ne publie ce qui a été vu.
- **Utilisateur à appeler demain soir** : Patron d'une agence de sorties aurores à Tromsø, Rovaniemi ou Abisko.
- **% LLM** : 12 %
- **Risque principal** : Sans sortie réelle demain, la vérité terrain (photos) est simulée ; on peut prendre les webcams de nuit comme substitut `[?]`. Contraintes : flux mondial, donnée créée par l'usage.

### Accueillir les jets d'affaires
- **Pour un ami (2 phrases, zéro jargon)** : Sur un aéroport pour avions privés, quelqu'un doit savoir quel jet arrive à quelle minute pour préparer le carburant, la voiture, le traiteur et le hangar. L'outil voit les avions arriver dans le ciel, passe les commandes et répartit le personnel.
- **Ce qu'on voit à l'écran en démo** : Une carte du Bourget avec douze jets en approche ; chacun fait apparaître une fiche (« type, arrivée 14 h 52, 2 passagers, 4 t de carburant, voiture, hangar 3 ») et le planning des équipes se réécrit quand trois avions arrivent en même temps.
- **Le travail que l'agent remplace** : Le dispatcher d'un handler d'aviation d'affaires, présent jour et nuit, qui surveille un écran radar et passe vingt coups de téléphone. Une alerte « avion à 30 minutes » ne combine pas le type d'avion, l'heure réelle, le personnel disponible et les retards habituels de chaque opérateur.
- **Donnée** : adsb.lol, positions ADS-B ouvertes `[?]` (gratuit sans clé de mémoire, non vérifié) ; repli : adsb.fi ou OpenSky en accès anonyme `[?]`. Base des types d'avions (code ICAO) ouverte `[?]`. Demain 9 h : un `curl` suffit pour savoir. Ce ne sont pas des données d'État : réseau de récepteurs communautaires.
- **Briques Aiven** : Kafka (flux de positions), Valkey (état courant de chaque avion), ClickHouse (historique des mouvements et durées), PostgreSQL (affectations, équipes).
- **Ce que la base sait après 100 utilisations** : Le temps réel entre l'entrée dans le rayon et l'arrêt sur parking, par type d'avion et par terrain, plus le retard habituel de chaque compagnie, plus le coût des choix de personnel (heures supplémentaires). Les handlers gardent ça dans la tête de leur chef d'équipe.
- **Utilisateur à appeler demain soir** : Responsable des opérations d'un handler d'aviation d'affaires au Bourget.
- **% LLM** : 9 %
- **Risque principal** : Équipes et commandes sont fictives ; le « verdict » (temps réel) vient des données d'avions, pas du terrain. Contrainte : flux mondial.

### Router un voilier de course
- **Pour un ami (2 phrases, zéro jargon)** : Un skipper en solitaire n'a pas le temps de calculer sa route ; un routeur à terre le fait et lui dit quand virer de bord. L'outil joue ce routeur à toute heure et apprend la vitesse réelle de ce bateau précis.
- **Ce qu'on voit à l'écran en démo** : Une carte de l'Atlantique avec trois routes en couleurs (nord, centre, sud), l'une d'elles recommandée, un message vocal « vire à 3 h 40, le vent refuse à l'ouest », et une courbe de performance du bateau qui se précise à chaque sortie.
- **Le travail que l'agent remplace** : Le routeur météo (un poste payé sur les Class40, les IMOCA, les Mini 6.50). Une alerte de vent ne choisit pas la route ; une requête SQL ne compare pas cinquante scénarios de prévision avec le comportement d'un bateau.
- **Donnée** : Open-Meteo, vent et vagues marines, y compris prévisions d'ensemble `[?]` (sans clé, de mémoire) ; GRIB GFS de NOAA, libre `[?]`. Positions : le GPS du téléphone du skipper, créé par l'usage ; pour la démo, une traversée passée rejouée à partir d'un fichier GPX.
- **Briques Aiven** : ClickHouse (séries de position et champs de vent pour calculer la vraie polaire), PostgreSQL (routes, décisions, polaires par bateau), Valkey (prévisions en cache pour recalculer les routes vite).
- **Ce que la base sait après 100 utilisations** : La polaire réelle de chaque bateau (vitesse selon l'angle du vent et la mer, voiles portées), et pour chaque zone, quel modèle météo s'est trompé de combien. Les polaires officielles sont des courbes de bureau d'études.
- **Utilisateur à appeler demain soir** : Routeur météo, ou skipper de Class40 ou de Mini 6.50.
- **% LLM** : 8 %
- **Risque principal** : Le calcul de route (isochrones) est du vrai code à écrire en 7 h ; sans bateau demain, tout se joue sur un rejeu. Contraintes : flux mondial, donnée créée par l'usage.

### Régler les bus en direct
- **Pour un ami (2 phrases, zéro jargon)** : Quand trois bus se collent et laissent ensuite un grand vide, une personne en salle de contrôle appelle les chauffeurs : « retiens 90 secondes », « fais demi-tour ici ». L'outil donne ces consignes seul, pour toute une ville.
- **Ce qu'on voit à l'écran en démo** : Une carte d'Oslo avec 400 bus qui bougent ; deux bus collés passent au rouge, l'agent écrit « ligne 21 : retiens 90 s à Nydalen » et la courbe d'écart revient à la normale en six minutes.
- **Le travail que l'agent remplace** : Le régulateur d'un poste de commande de bus, qui gère quinze à trente lignes. Une alerte « bus collés » ne dit pas quelle consigne donner ; à 400 véhicules aucun humain ne peut tout traiter ni essayer deux consignes pour comparer.
- **Donnée** : Entur (Norvège), GTFS-RT trip-updates `api.entur.io/realtime/v1/gtfs-rt/trip-updates`, rafraîchi toutes les 15 s, adresse documentée ; l'absence de clé n'est pas confirmée `[?]`. Horaires théoriques : GTFS statique d'Entur `[?]`. Aucun bus n'obéit demain : l'effet des consignes passe par un simulateur nourri du vrai flux.
- **Briques Aiven** : Kafka (flux de véhicules), Valkey (état courant de chaque ligne), ClickHouse (historique des écarts par ligne, arrêt et heure), PostgreSQL (consignes émises).
- **Ce que la base sait après 100 utilisations** : Quelle consigne (retenue de 60 ou 90 s, demi-tour) rétablit quel écart sur quelle ligne à quelle heure. Les horaires publiés ne contiennent pas la réaction du réseau.
- **Utilisateur à appeler demain soir** : Régulateur ou chef de poste de commande chez un exploitant de bus (Keolis, Transdev, RATP).
- **% LLM** : 14 %
- **Risque principal** : L'effet des consignes est simulé, donc la mémoire « ce qui marche » reste théorique tant qu'aucun exploitant n'a branché ses bus. Contrainte : flux mondial.

### Vérifier les vidéos du séisme
- **Pour un ami (2 phrases, zéro jargon)** : Quand un séisme ou un incendie éclate, des centaines de gens postent des vidéos et un journaliste doit savoir lesquelles sont vraies, où et quand elles ont été filmées. L'outil le fait en deux minutes et rend un dossier trié : à publier, trop ancienne, faux lieu.
- **Ce qu'on voit à l'écran en démo** : Les posts tombent en direct sur un bandeau ; un séisme de magnitude 5,8 apparaît, l'agent épingle quatorze vidéos sur la carte (« tournée à 400 m de ce carrefour, trois minutes après la secousse ») et en écarte six, dont une qui circule depuis 2019.
- **Le travail que l'agent remplace** : Le journaliste vérificateur d'une cellule de vérification de rédaction ou d'agence. Une alerte dit « séisme » ; vérifier une vidéo, c'est retrouver le lieu sur la carte (panneaux, relief, ombres) et recouper avec les capteurs. Une requête SQL ne regarde pas une image.
- **Donnée** : Bluesky Jetstream, flux public de tous les posts `[?]` (sans compte, de mémoire ; filtre sur les posts avec média) ; USGS, séismes en GeoJSON `[?]` (sans clé, de mémoire) ; OpenStreetMap pour la géolocalisation `[?]`. Le rejeu des dernières heures d'un événement passé sert de repli si rien ne se passe demain.
- **Briques Aiven** : Kafka (flux filtré), OpenSearch (recherche texte et vecteurs : retrouver une image déjà vue), PostgreSQL (dossiers vérifiés).
- **Ce que la base sait après 100 utilisations** : Une collection d'événements confirmés avec leurs médias vérifiés, plus l'empreinte de chaque image déjà recyclée (« cette vidéo existe depuis 2019 »). Une rédaction ne possède que ses propres dossiers.
- **Utilisateur à appeler demain soir** : Journaliste vérificateur dans une cellule de vérification d'une rédaction web ou d'une agence.
- **% LLM** : 25 %
- **Risque principal** : Peu de posts géolocalisables en direct sur ce réseau ; il faut préparer un rejeu. Contraintes : flux mondial, monde physique.

### Préparer l'adversaire aux échecs
- **Pour un ami (2 phrases, zéro jargon)** : Avant un match par équipes, le capitaine veut savoir comment chaque adversaire joue en ligne : ses débuts de partie, ses faiblesses, le moment où il craque face à la pendule. L'outil lit leurs centaines de parties, écrit une fiche de préparation et fait jouer un sparring-partner qui imite l'adversaire.
- **Ce qu'on voit à l'écran en démo** : On tape un pseudo, et en 90 secondes l'écran affiche « il joue 1.d4 puis le système Londres (71 %), perd 60 % de ses parties dans le temps après le coup 28, piège à tenter : … », puis une partie démarre contre son clone.
- **Le travail que l'agent remplace** : Le « second » d'un joueur fort, payé à la journée pour préparer les adversaires. Une requête SQL donne des statistiques d'ouvertures ; elle ne construit ni le plan de préparation ni un clone qui reproduit les erreurs de style.
- **Donnée** : Lichess : parties d'un joueur par l'API `[?]` (sans jeton, de mémoire, avec limite de débit) ; archive mensuelle `database.lichess.org` `[?]` (parties libres et très nombreuses) pour les statistiques par niveau. Les retours des capitaines (« ça a marché ») sont créés par l'usage.
- **Briques Aiven** : ClickHouse (statistiques d'ouverture sur des milliards de positions), OpenSearch vecteurs (trouver des joueurs au style proche), PostgreSQL (dossiers adversaires et résultats des matchs).
- **Ce que la base sait après 100 utilisations** : Quelle préparation gagne contre quel profil de joueur, d'après les retours des capitaines. Aucune base de parties n'enregistre ça.
- **Utilisateur à appeler demain soir** : Capitaine d'une équipe de club en Nationale (fédération française) ou entraîneur de jeunes.
- **% LLM** : 15 %
- **Risque principal** : Marché étroit ; l'effet « gros système » dépend de montrer la machine à milliards de parties. Contraintes : flux mondial, donnée créée par l'usage.

### Replanifier le tournage du jour
- **Pour un ami (2 phrases, zéro jargon)** : Sur un tournage, le premier assistant réalisateur refait le plan de la journée dès que la météo, la lumière ou un acteur change. L'outil le refait à sa place, prévient les 60 personnes de l'équipe et prépare la feuille de service.
- **Ce qu'on voit à l'écran en démo** : Un plan de travail avec huit scènes ; un nuage d'orage arrive sur le radar, l'agent intervertit deux scènes pour tourner à l'intérieur d'abord, réécrit la feuille de service et envoie le message vocal à l'équipe.
- **Le travail que l'agent remplace** : Le premier assistant réalisateur ou le directeur de production, qui refait le plan à la main au milieu de la journée. Une alerte pluie existe ; elle ne sait pas que cette scène exige un ciel gris, que la comédienne part à 17 h et que le décor couvert est à 40 minutes de route.
- **Donnée** : Open-Meteo, prévision et nuages par heure `[?]` ; position du soleil calculée par bibliothèque ; décomposition de scènes à partir d'un scénario tombé dans le domaine public `[?]`, donc inventée pour la démo. Durées réelles par type de plan : créées par l'usage.
- **Briques Aiven** : PostgreSQL (plan de travail, feuilles de service), ClickHouse (historique de durée par type de scène), Valkey (état du jour).
- **Ce que la base sait après 100 utilisations** : La durée réelle d'un plan selon le type de scène, la taille de l'équipe et l'heure. Les productions gardent ça confidentiel ; aucune base publique n'existe.
- **Utilisateur à appeler demain soir** : Premier assistant réalisateur ou directeur de production d'une société de production publicitaire à Paris.
- **% LLM** : 5 %
- **Risque principal** : L'agent est d'abord un planificateur ; sans donnée de tournage réelle demain, « sans la donnée, rien » tient mal. Contrainte : donnée créée par l'usage.

---

## Lecture rapide
- Sous 20 % : salage, aurores, jets d'affaires, voilier de course, bus, échecs, tournage (sept idées sur huit ; seule la vérification de vidéos est au-dessus).
- Les plus solides sur « sans la donnée, rien » et sur la donnée disponible demain : salage (sources vérifiées), jets d'affaires, voilier de course.
- Les plus fragiles : tournage (peu de donnée), bus (effet simulé), vidéos du séisme (volume de posts incertain).
- À tester demain à 9 h avant tout choix : adsb.lol, Entur sans clé, Jetstream, Open-Meteo, USGS, Lichess.
