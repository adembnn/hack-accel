# Relance, angle 3 : le geste des communautés

Huit idées parties d'un geste que des passionnés font déjà à la main. Quatre recherches web ont servi à tester l'accès aux données ; le détail est en fin de fichier. Six idées sont sous 20 % de probabilité d'être proposées par un autre LLM.

### Copilote de chasse aux orages
- **Pour un ami (2 phrases, zéro jargon)** : Un chasseur d'orages roule le week-end pour voir de près une tempête. L'agent joue le passager qui lit le radar et les éclairs, connaît les routes, et lui dit où se garer dans les 20 prochaines minutes pour voir la cellule sans prendre la grêle.
- **Ce qu'on voit à l'écran en démo** : Une carte avec la cellule d'orage qui avance, la voiture en point bleu et trois routes de repli recalculées chaque minute, pendant qu'une voix dit « prends à gauche à Rozay, la cellule passe devant toi dans 14 minutes, grêle côté sud » (rejeu d'un orage de la veille).
- **Le travail que l'agent remplace** : Le navigateur d'une équipe de chasse, celui qui garde le radar sur les genoux, connaît le réseau routier et décide. Une alerte dit « orage à 30 km » ; ici il faut croiser la trajectoire de la cellule, les routes réellement praticables et la position de la voiture, et refaire le calcul à chaque minute avec les erreurs passées de la prévision. Une requête SQL ne produit pas ce trajet.
- **Donnée** : Éclairs en direct via Blitzortung (réseau communautaire ; accès sans compte et conditions d'usage `[?]`). Radar via RainViewer `[?]` (limites récentes de l'API non vérifiées). Vent et énergie convective via Open-Meteo `[?]` (gratuit sans clé, de mémoire). Routes via OpenStreetMap/Overpass `[?]`. Créée par l'usage : traces GPS et photos horodatées des chasseurs. Plan B : enregistrer les flux d'un orage passé pour la démo.
- **Briques Aiven** : Kafka (flux d'éclairs, rejouable pour la démo) ; ClickHouse (historique des cellules et traces des véhicules) ; PostgreSQL (routes, sorties, points de vue) ; Valkey (état de la cellule suivie, relu chaque seconde).
- **Ce que la base sait après 100 utilisations** : Pour chaque région, de combien la prévision a manqué la trajectoire réelle des cellules, quelles routes sont coupées ou bouchées pendant un orage, et quels points de vue ont vraiment un horizon dégagé. La vérité de terrain, photos à l'appui, que les services météo n'ont pas.
- **Utilisateur à appeler demain soir** : Un chasseur d'orages amateur (association Keraunos, groupes de chasseurs sur les forums et réseaux).
- **% LLM** : 10 %
- **Risque principal** : Peu de chances d'orage à Paris demain en octobre, donc la démo repose sur un rejeu et perd l'effet « en direct ».

### Opérateur de chasse aux pays
- **Pour un ami (2 phrases, zéro jargon)** : Un radioamateur parle à des inconnus dans le monde entier avec sa radio et cherche à contacter un maximum de pays. L'agent lit en continu ce que reçoivent des milliers de stations sur la planète, décide sur quelle fréquence et vers quel pays appeler maintenant, et tient son carnet à jour.
- **Ce qu'on voit à l'écran en démo** : Un planisphère avec les arcs de propagation de la dernière minute, et une consigne : « bande des 20 m, appelle la station du Japon, elle entend ta région à -12 dB depuis 3 minutes », puis un pays coché dans son palmarès.
- **Le travail que l'agent remplace** : L'opérateur qui lit le cluster de spots, les cartes de propagation et son carnet de bord pour viser les « nouveaux pays » ; et le stratège d'équipe pendant un concours. Une alerte dit « un Japonais est actif » ; ici il faut croiser ce qui manque à CE carnet, l'état réel de la bande vers CE lieu et la fenêtre de temps, puis ordonner des cibles.
- **Donnée** : PSKReporter, flux MQTT en temps réel de tous les rapports de réception (l'existence du flux est confirmée par la recherche ; conditions d'usage et accès sans compte `[?]`). Spots WSPR via wspr.live `[?]` pour l'historique. Carnet de l'utilisateur importé au format ADIF (créée par l'usage).
- **Briques Aiven** : Kafka (flux de spots) ; ClickHouse (historique par bande, heure et carré de localisation, le gros volume) ; PostgreSQL (carnet, palmarès) ; Valkey (état courant des bandes ouvertes).
- **Ce que la base sait après 100 utilisations** : La carte de portée réelle de chaque station (à quelle heure sa ville atteint quelle région, avec quelle antenne), que les modèles de l'ionosphère ne donnent qu'en moyenne.
- **Utilisateur à appeler demain soir** : Un radioamateur membre d'un radio-club d'Île-de-France ou du Réseau des Émetteurs Français (REF).
- **% LLM** : 6 %
- **Risque principal** : Sans radio qui émet, l'utilisateur ne peut pas agir sur la consigne ; la démo se joue sur un récepteur en ligne et un carnet importé.

### Contrôleur aérien des simulateurs de vol
- **Pour un ami (2 phrases, zéro jargon)** : Un passionné de simulateur de vol cherche quelqu'un pour jouer le contrôleur aérien qui lui répond à la radio. L'agent prend la fréquence à voix haute, avec le vrai trafic du moment à l'aéroport choisi.
- **Ce qu'on voit à l'écran en démo** : L'utilisateur dit au micro « Heathrow Tower, G-ABCD prêt au départ piste 27L » ; la voix de l'agent répond avec la bonne phraséologie, fait attendre un avion réel visible sur le radar et en fait passer un autre.
- **Le travail que l'agent remplace** : Le contrôleur bénévole des réseaux de simulation (VATSIM, IVAO), poste qui manque à la plupart des événements. Il parle, séquence, retient, refuse, et se rappelle ce pilote. Aucune alerte ni requête ne tient une conversation radio en cours avec un trafic qui bouge.
- **Donnée** : Positions ADS-B en direct, par exemple adsb.lol (documentation à api.adsb.lol/docs ; exigence de clé non confirmée `[?]`), ou OpenSky (compte gratuit `[?]`). Feed public JSON de VATSIM `[?]`. Créée par l'usage : chaque échange avec un pilote.
- **Briques Aiven** : Kafka (flux ADS-B) ; ClickHouse (historique pour apprendre quelles pistes sont en service selon le vent, quels chemins de roulage sont réellement suivis) ; Valkey (file d'attente du moment) ; PostgreSQL (mémoire par pilote : indicatif, erreurs de phraséologie répétées).
- **Ce que la base sait après 100 utilisations** : Pour chaque aéroport, la configuration réelle des pistes selon le vent, les routes de roulage et de départ réellement suivies, le rythme des arrivées heure par heure ; et pour chaque pilote, ses erreurs récurrentes.
- **Utilisateur à appeler demain soir** : Un responsable d'événements d'une division française de VATSIM ou d'IVAO, ou un streamer de simulation de vol.
- **% LLM** : 12 %
- **Risque principal** : La chaîne voix (reconnaissance, modèle, synthèse) doit répondre en moins de 2 secondes sinon l'effet s'écroule ; la démo se fait hors des réseaux VATSIM/IVAO dont les règles n'autorisent sans doute pas un agent `[?]`.

### Cartographe qui marche et filme
- **Pour un ami (2 phrases, zéro jargon)** : Un contributeur d'OpenStreetMap, la carte libre du monde, marche dans une rue en filmant avec son téléphone. L'agent revient avec la liste de ce qui a changé par rapport à la carte (commerce fermé, passage piéton ajouté, horaires lus sur la vitrine), prête à envoyer.
- **Ce qu'on voit à l'écran en démo** : La vidéo d'une rue défile à gauche ; à droite la carte se couvre de 14 modifications proposées, chacune avec la vignette de la vidéo qui la justifie ; un clic valide.
- **Le travail que l'agent remplace** : Le bénévole qui note en marchant puis passe deux heures à ressaisir dans l'éditeur ; le mapathon de quartier. Le changement est dans les pixels (enseigne, panneau, bordure) et il faut le comparer à ce que la carte dit déjà : une requête sur la base ne voit pas la rue.
- **Donnée** : OpenStreetMap extrait avec Overpass `[?]` (gratuit sans compte, de mémoire) ; vidéos de l'utilisateur avec trace GPS (créée par l'usage). L'écriture dans OSM demande le compte OSM gratuit de l'utilisateur `[?]` ; en démo on sort un fichier de modifications.
- **Briques Aiven** : PostgreSQL (extraits de la carte et propositions ; l'extension géographique PostGIS sur Aiven `[?]`) ; OpenSearch (empreintes d'images d'enseignes pour reconnaître le même commerce d'un passage à l'autre) ; ClickHouse (journal daté des changements rue par rue).
- **Ce que la base sait après 100 utilisations** : Un journal daté, rue par rue, du commerce réel : quand tel magasin a fermé, quand tel autre a ouvert. Ni OpenStreetMap ni les cartes commerciales ne tiennent cette archive.
- **Utilisateur à appeler demain soir** : Un contributeur actif d'OpenStreetMap France ou un organisateur de cartopartie.
- **% LLM** : 17 %
- **Risque principal** : Lire une enseigne ou un horaire sur une vidéo tremblante sans halluciner ; chaque proposition doit montrer l'image source pour que l'humain tranche vite.

### Écoute de la migration nocturne
- **Pour un ami (2 phrases, zéro jargon)** : Un ornithologue amateur laisse un micro dehors toute la nuit pour capter les oiseaux qui migrent dans le noir. Le matin, au lieu de passer six heures à tout réécouter, il reçoit la liste de ceux qui sont passés au-dessus de son jardin, chaque cri en extrait.
- **Ce qu'on voit à l'écran en démo** : Le spectrogramme de 8 heures de nuit défile et des étiquettes surgissent (grive mauvis, 02:14) ; un clic joue l'extrait ; une courbe compare la nuit aux précédentes et au vent.
- **Le travail que l'agent remplace** : L'écoute humaine, nuit après nuit, des enregistrements (le « nocmig »), et la validation des identifications, c'est-à-dire repérer le cri rare qui compte. Une requête ne peut rien faire d'un fichier audio brut.
- **Donnée** : Enregistrements des utilisateurs (créée par l'usage). Modèle BirdNET, open source, exécuté sur Modal `[?]`. Vent et température via Open-Meteo `[?]`. Enregistrements nocturnes d'essai pour la démo sous licence libre `[?]` (à chercher sur Xeno-canto ou Zenodo ; l'API Xeno-canto demande une clé `[?]`).
- **Briques Aiven** : ClickHouse (détections à la minute, par site et par nuit) ; OpenSearch (empreintes sonores pour retrouver les cris proches et isoler l'inconnu) ; PostgreSQL (sites, observateurs, validations humaines).
- **Ce que la base sait après 100 utilisations** : Le calendrier de la migration nocturne, site par site et espèce par espèce, relié au vent et à la température. À ma connaissance, aucune archive acoustique de ce type n'existe à l'échelle d'un pays en Europe `[?]`.
- **Utilisateur à appeler demain soir** : Un bénévole de la LPO qui pratique le nocmig, ou un membre de groupes d'amateurs de ce domaine.
- **% LLM** : 7 %
- **Risque principal** : La précision de BirdNET sur des cris lointains et faibles est moyenne, avec des faux positifs ; la nuit de démo doit être pré-calculée.

### Clippeur de lives et de leur public
- **Pour un ami (2 phrases, zéro jargon)** : Un streamer de taille moyenne n'a pas de monteur. L'agent regarde le direct avec le chat, découpe les moments qui ont fait réagir SA communauté, et les publie en vertical avec le bon sous-titre.
- **Ce qu'on voit à l'écran en démo** : Pendant un live, une rangée de clips se remplit toutes les minutes, chacun avec un score de réaction du chat, un titre et des sous-titres ; on ouvre un clip prêt à poster.
- **Le travail que l'agent remplace** : Le clippeur ou monteur, souvent payé quelques centaines d'euros par mois, qui sait ce qui est drôle pour cette communauté-là. Le signal du chat est brut (spam d'emotes, rafale de messages) et chaque communauté rit différemment ; les images, elles, ne sont pas dans une requête.
- **Donnée** : Chat Twitch en lecture anonyme avec un pseudo « justinfan » sans compte (confirmé par les forums de développeurs Twitch ; usage communautaire et non documenté officiellement ; conditions d'usage `[?]`). Vidéo du direct par capture `[?]`. Créée par l'usage : ce que le streamer garde ou refuse, et la performance des clips postés.
- **Briques Aiven** : Kafka (chat de plusieurs chaînes en flux) ; ClickHouse (rythme du chat à la seconde, historique de réactions) ; OpenSearch (vocabulaire et emotes propres à chaque communauté, clips passés) ; PostgreSQL (décisions du streamer).
- **Ce que la base sait après 100 utilisations** : Pour chaque communauté, un modèle de ce qui la fait réagir (quelle emote, quel silence avant, quel mot) et la liste des clips qui ont réellement fonctionné sur les plateformes courtes, par niche.
- **Utilisateur à appeler demain soir** : Un streamer francophone entre 500 et 3 000 spectateurs, ou son modérateur en chef.
- **% LLM** : 30 %
- **Risque principal** : Le marché a déjà des outils de clips ; la seule différence défendable est la mémoire par communauté, et la capture vidéo peut poser un problème de conditions d'usage.

### Enquêteur de boules de feu
- **Pour un ami (2 phrases, zéro jargon)** : Quand un météore éclatant traverse le ciel, des dizaines de personnes l'ont filmé (caméras de surveillance, voitures, téléphones). L'agent retrouve ces vidéos, calcule la trajectoire dans le ciel et dit où chercher la pierre au sol.
- **Ce qu'on voit à l'écran en démo** : Trois vidéos de la même boule de feu lancées côte à côte ; trois lignes de visée se croisent sur une carte en 3D et une ellipse de chute apparaît.
- **Le travail que l'agent remplace** : Le météoriticien ou le bénévole d'un réseau de veille qui passe des semaines à rassembler les témoignages et à trianguler. Les vidéos n'ont pas de coordonnées : il faut retrouver la position et l'orientation de chaque caméra à partir des étoiles et des repères visibles, puis résoudre. Ni alerte ni SQL ne font cela.
- **Donnée** : Global Meteor Network, trajectoires et orbites en accès ouvert sous licence CC BY 4.0, fichiers CSV quotidiens et mensuels (vérifié par recherche ; contenu des listes de fichiers non ouvert). Rapports de témoins American Meteor Society / IMO `[?]`. Vidéos publiques de bolides, téléchargement `[?]` et droits à clarifier. Résolution astrométrique avec un catalogue d'étoiles ouvert `[?]`. Créée par l'usage : les caméras calibrées.
- **Briques Aiven** : ClickHouse (trajectoires GMN pour valider les vitesses et pentes plausibles) ; OpenSearch (retrouver les vidéos candidates par texte et empreinte d'image : lieu, date, titre) ; PostgreSQL (dossiers d'enquête, caméras calibrées) ; Kafka (flux de signalements).
- **Ce que la base sait après 100 utilisations** : Un parc de caméras amateurs calibrées (position, orientation, champ de vue) un peu partout, qui permet de trianguler le prochain bolide en minutes au lieu de semaines ; et une carte des pierres retrouvées contre prédites.
- **Utilisateur à appeler demain soir** : Un bénévole de Vigie-Ciel / FRIPON (Muséum national d'histoire naturelle) `[?]`, ou un membre du Global Meteor Network.
- **% LLM** : 3 %
- **Risque principal** : Calibrer des caméras depuis des vidéos de mauvaise qualité en 7 heures ; on rejoue un événement connu dont le résultat publié sert de vérité.

### Analyste vidéo de club de district
- **Pour un ami (2 phrases, zéro jargon)** : L'entraîneur bénévole d'un club de foot de district filme le match avec son téléphone. Le lundi, l'agent lui rend le match découpé par joueur, ce qui a fait perdre, et le dossier de l'adversaire de dimanche, construit avec les matchs filmés par les autres clubs de la ligue.
- **Ce qu'on voit à l'écran en démo** : Le match reconstitué vu de dessus avec 22 points qui bougent ; un clic sur un joueur montre ses 6 meilleures actions et ses 3 pertes de balle ; un panneau dit « adversaire de dimanche : côté gauche laissé ouvert dans 70 % des attaques ».
- **Le travail que l'agent remplace** : L'analyste vidéo des clubs professionnels (poste à plein temps) et le recruteur qui roule 200 km le dimanche. Toute la donnée naît des pixels, une requête sur une base vide ne produit rien.
- **Donnée** : Vidéos filmées par les utilisateurs (créée par l'usage, aucune base ouverte équivalente). Pour la démo : un match amateur filmé nous-mêmes le matin, ou une vidéo sous licence libre `[?]`. Détection et suivi de joueurs avec des modèles ouverts sur Modal `[?]`.
- **Briques Aiven** : ClickHouse (positions des joueurs plusieurs fois par seconde, le très gros volume) ; PostgreSQL (clubs, joueurs, matchs) ; OpenSearch (retrouver des joueurs de profil proche par vecteur).
- **Ce que la base sait après 100 utilisations** : Les statistiques de milliers de joueurs amateurs d'une ligue, que la fédération n'a pas, et le comportement collectif de chaque équipe de la ligue ; les centres de formation voudraient cette base.
- **Utilisateur à appeler demain soir** : Un entraîneur U15 ou U17 d'un club de district de la région, ou un recruteur indépendant.
- **% LLM** : 35 %
- **Risque principal** : Proche de produits existants (Veo, Spiideo), et suivre 22 joueurs sur une vidéo filmée du bord du terrain de façon fiable en 7 heures est difficile.

## Sources vérifiées (4 recherches, aucun appel payant)
- PSKReporter : le flux MQTT en direct existe (mqtt.pskreporter.info, tenu avec l'aide de M0LTE) ; conditions et accès sans compte non confirmés. Documentation développeur : https://pskreporter.info/pskdev.html
- adsb.lol : documentation de l'API annoncée à https://api.adsb.lol/docs ; l'exigence de clé n'est pas confirmée, à tester à 9 h avec un `curl`.
- Global Meteor Network : données ouvertes CC BY 4.0, CSV quotidiens/mensuels, paquet Python `gmn-python-api` : https://globalmeteornetwork.org/data/
- Twitch : lecture anonyme du chat avec un pseudo `justinfan` + chiffres, sans jeton, sur irc.chat.twitch.tv:6697 ; répondre aux PING ; mot de passe aléatoire plus sûr que vide : https://discuss.dev.twitch.tv/t/anonymous-connection-to-twitch-chat/20392
