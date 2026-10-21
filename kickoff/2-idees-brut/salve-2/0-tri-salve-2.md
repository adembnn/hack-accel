# 2. Idées, salve 2 (21 oct. 2026, soir)

**Pourquoi une salve 2.** Adem a rejeté la salve 1 (45 idées sur données publiques de l'État) : trop administrative, trop petite, l'agent y faisait trop peu. Relance complète avec ses contraintes : flux mondial en direct, monde physique, donnée créée par l'usage ; un agent qui tient un vrai poste ; référence SiteSync (1er à Stockholm). Brief commun : `2-idees-brut/salve-2/0-brief-relance.md`. Podiums précédents : `terrain/5-gagnants-accel.md`. Salve 1 archivée dans `2-idees-brut/salve-1/`.

**Méthode.** Six agents Sonnet, contexte neuf, un angle chacun, au plus 4 recherches web pour vérifier l'accès aux données. 45 idées. % = chance qu'un autre LLM propose l'idée (estimation de l'agent, pas une mesure). Sorties complètes dans `2-idees-brut/salve-2/`. `[?]` = accès aux données non vérifié.

**Convergences (pas un signal de qualité).** Trois sujets sont sortis chez deux agents : clips de stream Twitch (25-30 %), radioamateur, routage de voilier. Ce sont les plus « attendus » de la liste.

## Top 10 (sélection de la session)

| # | Idée en une phrase | Le poste remplacé | Ce qu'on voit en démo | % |
|---|---|---|---|---|
| 1 | **Réalisateur de plateau** : des téléphones posés dans une salle, l'agent choisit quelle image passe à l'écran et souffle des consignes aux cadreurs | Réalisateur et mélangeur d'images d'une régie de captation | La salle du pitch filmée sous 4 angles, le jury voit l'agent choisir le plan pendant qu'un juré parle | 6 % |
| 2 | **Repéreur de lieux de tournage** : l'agent regarde des milliers de webcams du monde et trouve le lieu qui a l'ambiance demandée, maintenant ou dans 48 h | Repéreur d'extérieurs qui voyage des jours | « Port, brume, lever du jour, personne » : un mur de 24 webcams se remplit et se trie | 7 % |
| 3 | **Le quai qui chronomètre les camions** : la caméra du quai note l'heure réelle de chaque camion et l'agent conteste les heures d'attente facturées à tort | Chef de quai et contrôleur des factures de transport | Une facture « 3 h 10 d'attente » barrée par la vidéo : « attente réelle 24 min », lettre de contestation prête | 10 % |
| 4 | **Le court de padel vide** : la caméra voit qu'un terrain réservé est vide, l'agent le revend à la liste d'attente, encaisse, et apprend qui ne vient jamais | L'accueil du club et le gestionnaire des prix | Terrain vide à 18 h 10, SMS envoyés, un juré paie le créneau en test, le terrain passe à « revendu » | 8 % |
| 5 | **Vérificateur de records de jeux vidéo** : l'agent regarde la vidéo d'un record soumis, contrôle le chrono et les règles, et rend le verdict avec la minute suspecte | Modérateur bénévole des classements (files de plusieurs semaines) | Une vraie soumission du jour visionnée en accéléré, coupure entourée à 14:32, verdict rédigé | 7 % |
| 6 | **Quelle route saler cette nuit** : l'agent lit les caméras de route et les capteurs de chaussée, choisit les tournées des camions de sel, puis vérifie sur la photo suivante | Chef d'astreinte hivernale réveillé à 3 h | Carte de Finlande couverte de photos de route annotées, six tournées tracées, verdict 10 min plus tard | 6 % |
| 7 | **Médiateur baleines et cargos** : l'agent écoute des micros sous-marins, repère un chant, voit les cargos qui vont passer et demande à chacun de ralentir | Coordinateur de programme de ralentissement des navires | Un chant détecté, deux cargos s'allument, messages envoyés, leur vitesse baisse à l'écran | 4 % |
| 8 | **Stratège de course de karting** : pendant une course d'endurance, l'agent dit quand rentrer au stand, quel pilote mettre et quel kart prendre | Stratège au muret des stands | Classement en direct, fin de course simulée 200 fois, une voix : « rentre dans 2 tours, prends le 9 » | 6 % |
| 9 | **Régulateur de coursiers à la voix** : l'agent dirige des coursiers dans la rue par oreillette et réattribue les courses quand l'un est coincé | Régulateur d'une société de coursiers | Deux membres de l'équipe dehors en direct sur la carte, un juré passe commande, l'agent guide le coursier | 12 % |
| 10 | **Gouvernante de locations courtes** : après le ménage, la personne filme l'appartement et l'agent dit ce qui cloche par rapport à la référence | Gouvernante ou contrôleur qualité d'une conciergerie | Un juré déplace trois objets dans la salle, on filme 20 s, l'agent entoure les trois écarts | 17 % |

## Les 45 idées, par famille

### A. Caméras qui pilotent un lieu (la famille SiteSync)
- Réalisateur de plateau à quatre caméras (A5, 6 %).
- Le quai qui chronomètre les camions (A2, 10 %).
- Le court de padel vide (A2, 8 %).
- Gouvernante de locations courtes, vidéo avant/après (A5, 17 %).
- Gouvernante d'hôtel par photos (A6, 12 %).
- Chef de passe sans mains, caméra sur le passe d'une cuisine (A6, 14 %).
- Contrôleur de chargement de camion, caisses comptées sur la rampe (A6, 9 %).
- Le sous-traitant qui n'est pas venu, caméra de chantier + appel vocal (A2, 30 %).
- Directeur de course adjoint, ravitaillements d'un semi-marathon (A6, 11 %).

### B. Caméras de la rue et du monde, filmées ou publiques
- Repéreur de lieux de tournage par webcams (A6, 7 %).
- Quelle route saler cette nuit, caméras de route finlandaises vérifiées (A1, 6 %).
- Prospecteur de chantiers pour loueurs de matériel, vidéos de rue (A5, 22 %).
- Chasseur de locaux commerciaux, façades et passants (A5, 14 %).
- Acheteur du marché pour chefs, prix lus sur les étals (A5, 9 %).
- Le rayon qui cache ma marque, vidéos de rayons de supérettes (A2, 15 %).
- Cartographe qui marche et filme, mise à jour d'OpenStreetMap (A3, 17 %).

### C. Le ciel, la mer, la météo (flux mondiaux en direct)
- Médiateur baleines et cargos, micros sous-marins + positions de navires (A6, 4 %).
- Où emmener le car ce soir, sorties aurores boréales (A1, 12 %).
- Accueillir les jets d'affaires au Bourget (A1, 9 %).
- Chef-pilote d'aéroclub, planning des vols selon la météo vérifiée (A4, 8 %).
- Débrief de vol de parapente, boîte noire comparée aux autres pilotes (A6, 3 %).
- Capitaine de port sans capitainerie, places de ponton attribuées (A6, 7 %).
- État des lieux d'un bateau loué, caution décidée sur la trace (A2, 10 %).
- Routeur de voilier de course (A1, 8 % ; A4, 12 %).
- Directeur d'école de surf (A4, 12 %).
- Copilote de chasse aux orages (A3, 10 %).
- Enquêteur de boules de feu, trajectoire triangulée depuis des vidéos (A3, 3 %).
- Écoute de la migration nocturne des oiseaux (A3, 7 %).
- Radioamateur : opérateur de concours (A4, 2 %) et chasse aux pays (A3, 6 %).
- Contrôleur aérien pour simulateurs de vol, à la voix (A3, 12 %).

### D. Jeux, sport, compétition en ligne
- Vérificateur de records de speedrun, API vérifiée sans clé, raisons de rejet comme étiquettes (A2, 7 %).
- Stratège de course de karting (A4, 6 %).
- Arbitre de triche aux échecs en ligne (A2, 22 %).
- Préparer l'adversaire aux échecs, fiche + clone (A1, 15 %).
- Monteur ou clippeur de stream Twitch (A4, 25 % ; A3, 30 %).
- Analyste vidéo de club de foot de district (A3, 35 %).
- Ouvreur de salle d'escalade (A5, 3 %).

### E. Ville et opérations en direct
- Régulateur de coursiers à la voix (A5, 12 %).
- Régler les bus en direct à Oslo (A1, 14 %).
- Régisseur général de festival à la voix (A4, 30 %).
- Replanifier le tournage du jour (A1, 5 %).
- Vérifier les vidéos d'un séisme, géolocalisation (A1, 25 %).

## Accès aux données vérifiés par les agents (21 oct.)
- **Vérifié** : caméras et capteurs de route Digitraffic (Finlande), METAR/TAF aviationweather.gov, API speedrun.com sans clé, API Lichess sans clé et archive de septembre (29 Go), chat Twitch en lecture anonyme, Global Meteor Network (CC BY 4.0), Orcasound (audio public, licence non commerciale).
- **Clé gratuite** : Windy Webcams (50 par page, petites images), aisstream.io (navires, une connexion par clé), Mapillary (photos de rue).
- **Non vérifié** `[?]` : adsb.lol, Open-Meteo, Entur sans clé, Jetstream, PSKReporter, Open Glider Network, live timing de karting.
