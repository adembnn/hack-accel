# Relance, angle 6 : Transfert (8 idées)

Quatre recherches web faites, uniquement pour vérifier l'accès aux données : Windy Webcams, Orcasound, Open Glider Network, aisstream.io. Résultats en bas.

### Repéreur de lieux de tournage
- **Pour un ami (2 phrases, zéro jargon)** : Une régisseuse d'extérieurs doit trouver pour mardi un port dans la brume au lever du jour, sans personne sur le quai. L'outil regarde en direct des milliers de webcams dans le monde, garde celles qui correspondent à la demande maintenant ou dans les 48 prochaines heures, et lui rend un plan de repérage avec les créneaux.
- **Ce qu'on voit à l'écran en démo** : on tape « port industriel, brume basse, lever du jour, personne » ; un mur de 24 webcams se remplit, chaque vignette porte sa note (« brume 70 %, 0 personne, tient jusqu'à 8 h 10 »), les mauvaises se barrent, une feuille de service sort.
- **Mécanique transférée** : du repéreur de cinéma (le métier qui passe des jours à chercher un lieu sur place) et de SiteSync (des caméras déjà installées deviennent les yeux de quelqu'un qui décide). L'agent remplace les jours de recherche et de déplacement, et juge l'image d'après ce que cette caméra montre d'habitude à cette heure. Une alerte ne sait pas ce qu'est « une ambiance » ; une requête SQL n'a pas de colonne « brume sur port ».
- **Donnée** : Windy Webcams API v3, clé gratuite sur api.windy.com, passée dans l'en-tête `x-windy-api-key` ; liste de 50 webcams par page, décalage limité à 1 000 en gratuit, petites images seulement, mention de la source obligatoire (vérifié par recherche, pas testé). Météo : Open-Meteo sans clé `[?]`. Si Windy limite trop : caméras routières ouvertes (Caltrans, NYC DOT, Digitraffic en Finlande) `[?]`.
- **Briques Aiven** : Kafka (une image par webcam toutes les ~10 min, en flux) ; OpenSearch (vecteurs d'images pour retrouver « brume sur port » parmi 10 000 vues) ; ClickHouse (historique d'ambiance par caméra et par heure) ; PostgreSQL (projets, présélections, verdicts de la production).
- **Ce que la base sait après 100 utilisations** : un calendrier d'ambiance par lieu (« ce quai est vide 9 matins sur 10 avant 7 h, brumeux 3 jours sur 10 en novembre ») et, pour chaque demande, quel lieu la production a vraiment retenu. Personne n'a cette table.
- **Utilisateur à appeler demain soir** : régisseur(se) d'extérieurs d'une société de production publicitaire, ou photographe de mode qui prépare un voyage.
- **% LLM** : 7 %
- **Risque principal** : webcams gratuites en basse définition et plafonds d'API ; pré-filtrer par vecteurs (Modal) avant de payer un modèle de vision sur 20 candidates.

### Médiateur entre baleines et cargos
- **Pour un ami (2 phrases, zéro jargon)** : Dans les couloirs de navigation où vivent des orques ou des rorquals, un coordinateur doit demander aux navires de ralentir quand des baleines sont là. L'outil écoute les micros sous-marins, repère les chants, voit quels navires vont passer au même endroit, écrit à chaque capitaine sa demande précise puis vérifie qu'il a bien ralenti.
- **Ce qu'on voit à l'écran en démo** : une carte, huit micros sous-marins qui s'allument ; un chant est repéré, deux cargos se colorent, deux messages partent (« MMSI X, 10 nœuds entre 14 h 20 et 15 h 05 ») et la courbe de vitesse de chacun s'affiche en regard.
- **Mécanique transférée** : du sommelier qui reconnaît à l'aveugle (identifier une source à l'oreille) et de la tour de contrôle (séquencer des mobiles qui ne se voient pas). Il remplace le coordinateur qui reçoit des appels de guetteurs et téléphone aux pilotes. Une alerte dit « baleine détectée » ; elle ne choisit pas quel navire, quand, ni ne contrôle la suite.
- **Donnée** : Orcasound, flux audio HLS dans le bucket S3 public `streaming-orcasound-net` (us-west-2), listable sans compte AWS, latence 10 à 120 s (vérifié par recherche). Licence CC BY-NC-SA : bon pour le hack, pas pour vendre tel quel. Positions des navires : aisstream.io, WebSocket, clé gratuite via compte GitHub, une seule connexion par clé, offre qualifiée d'expérimentale (vérifié par recherche).
- **Briques Aiven** : Kafka (segments audio et positions des navires) ; ClickHouse (historique de vitesses par navire et par zone) ; PostgreSQL (demandes envoyées, réponses, conformité) ; OpenSearch (vecteurs de sons étiquetés par des humains) ; Valkey (position courante de chaque navire).
- **Ce que la base sait après 100 utilisations** : qui ralentit et à quelle condition (tel capitaine obéit si le message arrive 25 min avant, tel armateur jamais), plus des extraits sonores confirmés par des humains, propres à chaque micro.
- **Utilisateur à appeler demain soir** : coordinateur d'un programme de ralentissement volontaire de navires (Colombie-Britannique, Salish Sea) ; en France, responsable environnement d'un armateur de ferries en Méditerranée, où les collisions avec les rorquals sont connues `[?]`.
- **% LLM** : 4 %
- **Risque principal** : un détecteur de chants fiable en 7 h n'est pas garanti ; plan B, démo sur archives étiquetées d'Orcasound rejouées comme du direct.

### Débrief de vol, boîte noire
- **Pour un ami (2 phrases, zéro jargon)** : Un moniteur de parapente reçoit la trace GPS de l'élève après le vol. L'outil la compare minute par minute à tous les autres pilotes en l'air au même endroit le même jour, et dit où l'élève a lâché une ascendance que d'autres continuaient de monter.
- **Ce qu'on voit à l'écran en démo** : la trace de l'élève rejouée en 3D avec les 30 autres appareils du jour en fantômes ; un trait rouge à 14 h 12 : « tu sors du thermique à 1 850 m, six pilotes à l'est montaient encore à 1,8 m/s » ; la voix d'ElevenLabs le raconte.
- **Mécanique transférée** : de la boîte noire d'avion (reconstruire l'enchaînement après coup) et de l'arbitrage vidéo (revoir l'action sous plusieurs angles, ici ceux des autres pilotes). Il remplace le moniteur qui débriefe au bord de l'atterrissage avec ses souvenirs. Une requête SQL sort des chiffres de montée ; elle ne dit pas quelle décision était mauvaise.
- **Donnée** : Open Glider Network, positions en direct de planeurs, parapentes et avions remorqueurs, données libres selon les règles d'usage OGN (vérifié par recherche) ; adresse et port du flux APRS non confirmés, à lire sur wiki.glidernet.org `[?]`. Traces de l'utilisateur : fichier IGC exporté de son instrument ou de XCTrack. Aucun historique garanti demain : on enregistre le flux dès 9 h `[?]`.
- **Briques Aiven** : Kafka (messages APRS en continu) ; ClickHouse (points de trace à 1 Hz, thermiques détectés par site, heure et vent) ; PostgreSQL (pilotes, vols, leçons) ; Valkey (état live par appareil).
- **Ce que la base sait après 100 utilisations** : où et à quelle heure déclenche chaque thermique sur chaque site selon le vent, et quelles erreurs chaque pilote répète.
- **Utilisateur à appeler demain soir** : moniteur d'une école de parapente, ou chef-pilote d'un club de vol à voile.
- **% LLM** : 3 %
- **Risque principal** : en octobre, peu de vols en Europe et un flux enregistré sur 7 h seulement ; il faut une journée de traces propre pour la démo, et le marché est petit (la mécanique se déplace vers le kite et la voile).

### Capitaine de port sans capitainerie
- **Pour un ami (2 phrases, zéro jargon)** : Un petit port de plaisance doit placer ce soir les voiliers de passage sans savoir qui part ni qui arrive. L'outil voit les bateaux arriver, repère les places qui se libèrent au quai, et envoie à chaque équipage son numéro de place avec l'heure.
- **Ce qu'on voit à l'écran en démo** : le plan des pontons ; des points AIS entrent dans la zone, des places passent au vert quand la caméra voit un bateau partir, des SMS s'écrivent (« Place C14, 17 h 10, tirant d'eau OK »).
- **Mécanique transférée** : du capitaine de port à la VHF et de la tour de contrôle d'aéroport (attribuer une piste libre à chaque arrivant). Il remplace le maître de ponton qui marche sur les quais et répond à la radio. Une alerte dit « un bateau approche » ; l'agent doit tenir un plan qui change à chaque départ imprévu.
- **Donnée** : aisstream.io (voir plus haut, vérifié par recherche) pour les arrivées : longueur et largeur déclarées par chaque bateau. Caméra du quai : une webcam de port via Windy `[?]` ou la caméra de la capitainerie. Plan des pontons : OpenStreetMap, balises `leisure=marina` et `mooring` `[?]`.
- **Briques Aiven** : Kafka (messages AIS) ; Valkey (état des places en temps réel) ; PostgreSQL (réservations, bateaux, historique par bateau) ; ClickHouse (occupation par place et par heure sur la saison).
- **Ce que la base sait après 100 utilisations** : combien de temps un bateau « pour une nuit » reste vraiment, selon son type ; quels bateaux annoncent sans venir ; quel plan de pontons remplit le plus.
- **Utilisateur à appeler demain soir** : capitaine ou maître de port d'une marina de 200 à 500 places.
- **% LLM** : 7 %
- **Risque principal** : voir qu'une place est libre sur une webcam publique de mauvaise qualité ; repli : le maître de ponton photographie, et la caméra devient une option.

### Gouvernante d'hôtel par photos
- **Pour un ami (2 phrases, zéro jargon)** : Dans un hôtel de 80 chambres, la gouvernante passe l'après-midi à contrôler chaque chambre nettoyée. Ici les femmes de chambre photographient le lit et la salle de bains, l'outil valide ou renvoie la photo avec la tache entourée, et réordonne le ménage selon qui arrive tôt.
- **Ce qu'on voit à l'écran en démo** : douze photos arrivent depuis un téléphone ; deux sont refusées avec un cercle rouge ; l'étage 3 se réordonne parce qu'une arrivée anticipée vient de tomber.
- **Mécanique transférée** : de SiteSync (images de terrain reliées aux données du métier pour mesurer l'avancement et décider) et de l'inventaire de nuit. Il remplace le contrôle de chambre par la gouvernante générale. Une requête SQL sait qu'une chambre est « prête » parce qu'on l'a cochée ; elle ne voit pas le cheveu dans la douche.
- **Donnée** : photos prises pendant la démo par nous. Planning arrivées et départs : CSV simulé ; une API de gestion hôtelière avec environnement de démo publique (Mews) `[?]`.
- **Briques Aiven** : PostgreSQL (chambres, planning, états) ; OpenSearch (vecteurs des photos validées ou refusées par hôtel, recherche « joint de douche noirci ») ; Kafka (check-out et photos arrivent en flux) ; Valkey (file d'attente par étage).
- **Ce que la base sait après 100 utilisations** : à quoi ressemble « propre » dans cet hôtel d'après les photos validées par la direction, quels défauts reviennent dans quelle chambre, et le temps réel de remise en état par type de chambre.
- **Utilisateur à appeler demain soir** : gouvernante générale d'un hôtel indépendant de 40 à 120 chambres.
- **% LLM** : 12 %
- **Risque principal** : sujet social sensible (mesure du travail de salariées) ; poser le produit comme outil de la gouvernante, avec contrôle humain du refus.

### Contrôleur de chargement de camion
- **Pour un ami (2 phrases, zéro jargon)** : Après un concert, à 1 h du matin, le chef de quai doit charger 140 caisses dans le bon ordre et ne rien oublier. L'outil regarde les caisses passer sur la rampe, coche chacune contre la liste, et annonce à voix haute ce qui manque ou ce qui est dans le mauvais camion.
- **Ce qu'on voit à l'écran en démo** : une caméra de téléphone sur une rampe ; douze cartons de la salle défilent, la liste se coche en direct, la voix dit « il manque la caisse 14 » quand on retire un carton.
- **Mécanique transférée** : de l'inventaire de nuit d'un magasin, déplacé du rayon vers la rampe de chargement, et du chef de quai. L'agent remplace celui qui lit des étiquettes à la lampe frontale. Un scanner de codes-barres échoue quand l'étiquette est cachée ; l'agent reconnaît l'objet lui-même.
- **Donnée** : liste de colisage en CSV (inventée pour la démo), photos de chaque objet prises une fois par nous, créées par l'usage.
- **Briques Aiven** : OpenSearch (recherche par vecteurs d'image : quelle caisse vient de passer) ; PostgreSQL (listes, camions, chargements) ; Kafka (images et événements de rampe) ; ClickHouse (écarts par prestation et par client).
- **Ce que la base sait après 100 utilisations** : l'apparence de chaque objet d'un parc de matériel, les objets qui reviennent le plus souvent incomplets, les clients et événements où les pertes se concentrent.
- **Utilisateur à appeler demain soir** : chef de quai ou régisseur général chez un loueur de matériel son et lumière.
- **% LLM** : 9 %
- **Risque principal** : des caisses noires identiques ; condition de survie : étiquette ou QR lisible, vecteur d'image seulement en appoint.

### Chef de passe sans mains
- **Pour un ami (2 phrases, zéro jargon)** : En plein coup de feu, le chef de passe crie quelle table attend quel plat pour que tout parte ensemble. L'outil regarde le passe par une caméra, relie chaque assiette au ticket de sa table, et dit à la cuisine ce qui manque et quelle assiette refroidit.
- **Ce qu'on voit à l'écran en démo** : une vidéo de service accélérée avec des tickets qui tombent ; des assiettes entourées, une horloge par table, une voix : « table 12, il manque le tartare, l'entrecôte attend depuis 90 secondes, refais-la ».
- **Mécanique transférée** : du régisseur de plateau qui annonce les tops à toute la troupe, appliqué à la cuisine. Il remplace le chef de passe. Une alerte « ticket en retard » existe déjà sur les écrans de cuisine ; elle ne voit pas quelle assiette est réellement posée.
- **Donnée** : vidéo de service en cuisine (enregistrée par nous ou trouvée en accès libre `[?]`) ; flux de tickets simulé, ou bac à sable d'une caisse comme Square `[?]`.
- **Briques Aiven** : Kafka (tickets et événements de passe) ; Valkey (état du passe par table) ; ClickHouse (temps de dressage par plat et par service) ; OpenSearch (photos de référence du dressage conforme).
- **Ce que la base sait après 100 utilisations** : le temps réel de chaque plat, les combinaisons de plats qui bloquent la cuisine, la photo du dressage que ce chef accepte.
- **Utilisateur à appeler demain soir** : chef exécutif ou chef de cuisine d'un restaurant de 80 couverts.
- **% LLM** : 14 %
- **Risque principal** : reconnaître des plats en vidéo mouvante ; il faut un menu de 6 plats fermé pour la démo.

### Directeur de course adjoint
- **Pour un ami (2 phrases, zéro jargon)** : Sur un semi-marathon de 8 000 coureurs, le directeur de course court partout pour voir où ça bouchonne. L'outil regarde cinq points du parcours, voit le ravitaillement qui se vide, et envoie des bénévoles et des cubes d'eau là où le peloton arrive dans douze minutes.
- **Ce qu'on voit à l'écran en démo** : une vidéo de course sur cinq fenêtres ; la barre d'eau du km 15 tombe, un ordre part (« 4 palettes, 3 bénévoles du km 10 vers le km 15 ») et le temps d'arrivée du peloton se recalcule.
- **Mécanique transférée** : du commissaire de course (celui qui voit toute l'épreuve et applique le règlement, jusqu'aux barrières horaires) et de la tour de contrôle. Il remplace le poste de commandement de la course. Une alerte dit qu'un point est saturé ; l'agent répartit les ressources avec les temps de passage.
- **Donnée** : vidéos de courses en accès libre `[?]`, temps de passage de courses passées dans les pages de résultats publiques `[?]`, météo Open-Meteo `[?]`.
- **Briques Aiven** : Kafka (images et passages en direct) ; ClickHouse (consommation d'eau par km et par groupe d'allure sur toutes les éditions) ; PostgreSQL (organisation, bénévoles, ordres donnés) ; Valkey (état en direct de chaque point).
- **Ce que la base sait après 100 utilisations** : combien d'eau part en 11 minutes à 8 000 coureurs par 24 degrés, où la course se bloque, quelles décisions ont marché.
- **Utilisateur à appeler demain soir** : directeur de course ou responsable logistique d'un semi, d'un trail ou d'une corrida.
- **% LLM** : 11 %
- **Risque principal** : jeu de données de course réel et sans contrat introuvable demain ; s'appuyer sur une vidéo choisie à l'avance.

## Sources vérifiées par recherche (21 oct.)
- Windy Webcams API v3 : clé gratuite, 50 webcams par page, décalage 1 000 max, mention obligatoire, en-tête `x-windy-api-key` ; l'export global n'est pas confirmé en gratuit. Source : https://api.windy.com/webcams/versions-transfer
- Orcasound : audio HLS en direct dans le bucket public `streaming-orcasound-net`, listable sans compte, latence 10-120 s, licence CC BY-NC-SA. Source : https://registry.opendata.aws/orcasound
- Open Glider Network : données libres selon règles d'usage ; hôte et port APRS non retrouvés. Source : https://en.wikipedia.org/wiki/Open_Glider_Network
- aisstream.io : WebSocket `wss://stream.aisstream.io/v0/stream`, clé gratuite via GitHub, une connexion par clé, offre expérimentale. Source : https://dev.to/jj/follow-that-ship-with-aisstreamer-21g3

## Ordre que je recommande
1. Repéreur de lieux de tournage : la démo la plus belle, la donnée la plus sûre (Windy), un utilisateur appelable.
2. Médiateur entre baleines et cargos : le seul où l'agent entend et suit, 4 % de chances qu'un autre y pense ; plus risqué à construire.
3. Débrief de vol, boîte noire : marché étroit, mais la mémoire créée est la plus rare.
