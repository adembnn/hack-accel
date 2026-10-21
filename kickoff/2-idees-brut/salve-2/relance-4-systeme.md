# Relance 4 : Système ambitieux (un agent qui tient un poste)

Sources vérifiées par recherche web (4 sur 4 utilisées) :
- aviationweather.gov (METAR/TAF en JSON, 100 requêtes/min) : page API lue, aucun compte mentionné. **Vérifié.**
- aisstream.io (positions de navires, websocket) : compte + clé API obligatoires, 3 connexions par compte, pas de rejeu de l'historique, connexion depuis un serveur uniquement. La page ne dit pas si c'est gratuit ni en combien de temps la clé arrive. **`[?]`**
- PSKReporter (flux MQTT de réceptions radio) : le flux existe et des applis tierces le consomment, mais la recherche ne dit rien sur l'authentification. **`[?]`**
- Apex Timing (chronométrage de karting en direct) : le site propose des pages de live timing publiques, mais aucun accès programmatique n'est documenté. **`[?]`**
Le reste (Open-Meteo, NDBC, Twitch IRC, adsb.lol, archive météo de l'Iowa) vient de ma connaissance, non vérifié : marqué `[?]`.

---

### Stratège de course en karting
- **Pour un ami (2 phrases, zéro jargon)** : un chef d'équipe participe à une course d'endurance de 3 à 6 heures dans un circuit de karting de location, avec 4 pilotes qui se relaient. L'outil lui dit en direct quand rentrer au stand, quel pilote mettre, et quel kart choisir au changement, parce qu'il a vu comment tous les karts et tous les pilotes tournent depuis le début de la course.
- **Ce qu'on voit à l'écran en démo** : le classement live de la course, avec en dessous la fin de course simulée 200 fois ; une phrase tombe en voix (ElevenLabs) : « Rentre dans 2 tours, Léa prend le relais, le 17 a perdu 0,6 s depuis 40 minutes, prends le 9 ».
- **Le travail que l'agent remplace** : le stratège au muret des stands, qui tient un tableur papier, chronomètre les rivaux et décide sous pression. Une alerte ne sait pas simuler la course entière avec les règles d'arrêts obligatoires et le trafic ; une requête SQL donne le chrono moyen d'un kart, pas la décision qui maximise la position finale.
- **Donnée** : pages de live timing publiques des circuits équipés Apex Timing (flux websocket derrière la page, protocole texte à décoder) ; repli : on filme l'écran de chronométrage du circuit et un modèle de vision lit le tableau. Accès demain matin : `[?]` (aucun accès programmatique confirmé, et il faut une course en cours demain ; sinon on rejoue un enregistrement).
- **Briques Aiven** :
  - Kafka : reçoit chaque passage de ligne de tous les karts (un événement par tour et par kart).
  - Valkey : tient le classement, les écarts et le nombre de tours de chaque pilote à l'instant T, lu par l'agent toutes les secondes.
  - ClickHouse : garde tous les tours de toutes les courses, pour calculer « ce kart, à ce moment de course, par cette température, tourne 0,4 s plus vite que la médiane ».
  - Postgres : équipes, pilotes, décisions prises, et résultat réel de chaque décision.
- **Ce que la base sait après 100 utilisations** : quels karts de quel circuit sont vraiment rapides selon l'usure et la météo, et quel pilote perd du temps en fin de relais. Aucun circuit ne publie ça, et les équipes de location ne le tiennent pas.
- **Utilisateur à appeler demain soir** : capitaine d'équipe d'endurance de karting de location (équipes d'entreprise, associations d'étudiants, clubs d'amis).
- **% LLM** : 6 %
- **Risque principal** : pas de course en direct demain à l'heure de la démo et protocole Apex non décodable à temps ; il faut prévoir l'enregistrement rejoué dès le matin.

### Routeur météo pour régatiers
- **Pour un ami (2 phrases, zéro jargon)** : un équipage de régate côtière reçoit dans l'oreille où virer, quand changer de voile, quel côté du plan d'eau prendre, comme le ferait un navigateur professionnel. L'outil apprend aussi la vitesse réelle du bateau selon le vent, ce que le constructeur ne donne jamais juste.
- **Ce qu'on voit à l'écran en démo** : une carte avec le bateau, ses concurrents en direct et le chemin optimal qui se redessine quand le vent tourne, plus la courbe de performance du bateau qui s'affine tour après tour.
- **Le travail que l'agent remplace** : le routeur ou navigateur d'une équipe de course, un poste payé en course au large et en régates de ligue. Une alerte de vent ne dit pas quel bord choisir ; une requête SQL ne calcule pas la route sous un vent qui évolue.
- **Donnée** : prévisions de vent et de mer Open-Meteo Marine (sans clé, `[?]`) ; positions AIS des bateaux autour via aisstream.io (clé obligatoire, tarif et délai d'obtention non précisés : `[?]`) ; le GPS du téléphone de l'équipage. Pas d'historique AIS disponible, donc la base se remplit à partir de maintenant.
- **Briques Aiven** :
  - Kafka : reçoit le flux AIS filtré sur la zone et les positions du bateau.
  - ClickHouse : garde toutes les traces de tous les bateaux avec le vent observé, pour apprendre la courbe de vitesse selon l'angle et la force du vent.
  - Valkey : tient l'état courant (position, vent, cap) que l'agent relit à chaque seconde.
  - Postgres : bateaux, équipages, régates, conseils donnés et ce que l'équipage a fait.
- **Ce que la base sait après 100 utilisations** : la vraie courbe de vitesse de chaque bateau, et les phénomènes locaux de chaque plan d'eau (où le vent se plie le long de telle côte à tel moment de marée).
- **Utilisateur à appeler demain soir** : skipper ou chef de bord d'un équipage de régates de ligue (clubs de voile, classes monotypes).
- **% LLM** : 12 %
- **Risque principal** : on est à Paris le 22 octobre, sans bateau sous la main ; la démo repose sur un enregistrement de régate, ce que le jury verra tout de suite.

### Chef-pilote d'un aéroclub
- **Pour un ami (2 phrases, zéro jargon)** : dans un aéroclub, quelqu'un décide chaque matin qui vole, sur quel avion, avec quel instructeur, selon la météo et le niveau de chaque élève. L'outil fait ce planning à sa place, le refait quand le plafond de nuages descend, et prévient chaque élève.
- **Ce qu'on voit à l'écran en démo** : le planning de la journée qui se réorganise tout seul quand on fait avancer la météo : des vols passent en rouge, les élèves de niveau avancé prennent les créneaux restants, des messages vocaux partent.
- **Le travail que l'agent remplace** : le chef-pilote (ou son adjoint) à 7 h, qui lit les METAR et les TAF (bulletins météo d'aéroport), connaît les minima de chaque élève et rejongle le planning. Une alerte dit « mauvais temps » ; elle ne sait pas que l'élève lâché seul n'a pas le droit sous 1 500 pieds de plafond alors que l'élève en double commande, si.
- **Donnée** : METAR et TAF en JSON sur aviationweather.gov, sans clé annoncée, 100 requêtes/min (**vérifié**) ; archives de bulletins METAR du monde entier pour la climatologie, par exemple l'archive de l'Iowa Environmental Mesonet (`[?]`) ; positions ADS-B des avions du club via un agrégateur ouvert comme adsb.lol ou airplanes.live (`[?]`). Les élèves et leurs minima sont saisis par nous (données de démonstration).
- **Briques Aiven** :
  - Kafka : reçoit METAR/TAF mis à jour et positions des avions du club.
  - ClickHouse : garde des millions de bulletins météo passés pour calculer « à Toussus en novembre, un plafond à 1 200 pieds à 8 h se lève en moins de 2 h dans X % des cas » (chiffre à produire, non mesuré).
  - Valkey : tient la météo courante et l'état de chaque avion (au sol, en vol, indisponible).
  - Postgres : élèves, minima, plannings et chaque décision go/no-go avec son issue.
  - OpenSearch : retrouve les cas passés comparables (« même situation de brume, que s'est-il passé »).
- **Ce que la base sait après 100 utilisations** : combien de vols le club annule à tort ou à raison selon les conditions réelles de son terrain, et la durée réelle de chaque type de vol par élève, de quoi mieux remplir le planning.
- **Utilisateur à appeler demain soir** : chef-pilote ou président d'un aéroclub d'Île-de-France (Toussus, Lognes, Pontoise, Saint-Cyr).
- **% LLM** : 8 %
- **Risque principal** : la sécurité aérienne ; l'agent propose et le chef-pilote valide d'un clic, et le pitch doit le dire dès la première phrase.

### Opérateur de concours radioamateur
- **Pour un ami (2 phrases, zéro jargon)** : lors d'un concours de radio de 24 ou 48 heures, un radio-club cherche à parler au plus de pays possible. L'outil choisit à chaque instant la bonne fréquence et la bonne direction selon l'état des ondes dans le monde, et tient le carnet de contacts à la place de l'opérateur.
- **Ce qu'on voit à l'écran en démo** : un globe où s'allument en direct des milliers d'arcs de réceptions radio, et l'agent qui dit « la bande 20 m se ferme vers le Japon dans 12 minutes, passe sur 15 m cap Amérique du Nord ».
- **Le travail que l'agent remplace** : le chef d'équipe d'un radio-club en concours, qui devine avec l'expérience où les ondes passent. Une requête SQL sur les réceptions passées ne dit pas où elles passeront dans 20 minutes avec l'activité du soleil du moment.
- **Donnée** : flux MQTT de PSKReporter, des milliers de réceptions par minute dans le monde, sans historique (`[?]` sur l'authentification, à tester avec un client anonyme) ; météo spatiale NOAA SWPC (`[?]`, flux publics de l'indice solaire) ; repli : Reverse Beacon Network en telnet avec un indicatif quelconque (`[?]`). Journal de contacts créé par l'usage.
- **Briques Aiven** :
  - Kafka : pont du flux MQTT, une réception par événement, le débit justifie un tampon.
  - ClickHouse : agrège les réceptions par bande, heure et zone de la Terre, depuis le début et pour chaque station.
  - Valkey : carte courante des ouvertures de bande par zone, mise à jour à la seconde.
  - Postgres : journal de contacts, décisions de l'agent, score obtenu.
- **Ce que la base sait après 100 utilisations** : l'atlas de propagation de chaque station (depuis chez soi, quelle bande ouvre vers où, à quelle heure, selon l'activité solaire), construit à partir de ses propres contacts, que personne ne publie.
- **Utilisateur à appeler demain soir** : responsable de concours d'un radio-club (réseau REF, clubs d'écoles d'ingénieurs).
- **% LLM** : 2 %
- **Risque principal** : l'univers est étrange pour le jury et le métier remplacé reste de niche ; il faut le raconter en trente secondes avec le globe.

### Directeur d'école de surf
- **Pour un ami (2 phrases, zéro jargon)** : chaque matin, le patron d'une école de surf regarde la mer et décide quels cours tenir, où, avec quels moniteurs. L'outil prépare la journée entière à sa place, prévient les clients de déplacer ou annuler, et apprend ce qui marche vraiment sur ce spot précis.
- **Ce qu'on voit à l'écran en démo** : à 6 h 40 simulées, la grille des cours se recompose, les messages aux clients partent, et la caméra de la plage montre l'image annotée par l'agent (nombre de surfeurs à l'eau, vagues qui cassent).
- **Le travail que l'agent remplace** : le chef d'école ou le moniteur-chef, qui juge la houle, la marée, le vent et la foule, puis réorganise. Les applis de prévisions donnent une note générique par spot ; elles ne savent pas que, sur cette plage-là, une houle de 1,5 m à 12 secondes avec vent de nord-est est parfaite pour des débutants à marée basse seulement.
- **Donnée** : Open-Meteo Marine (vagues, vent, sans clé, `[?]`) ; bouées NDBC de la NOAA en temps réel pour les spots américains (fichiers publics, `[?]`) ; une webcam de plage avec image accessible, à trouver demain matin (`[?]`, point faible). La note de chaque session donnée par les moniteurs en un geste est créée par l'usage.
- **Briques Aiven** :
  - Kafka : reçoit bouées, prévisions mises à jour et images de caméra de plusieurs spots.
  - ClickHouse : garde toutes les séries de mer et de vent pour les relier aux notes des moniteurs.
  - Valkey : tient l'état du spot et la grille du jour.
  - Postgres : élèves, moniteurs, réservations, décisions et notes.
  - OpenSearch : retrouve les journées passées les plus proches de celle d'aujourd'hui.
- **Ce que la base sait après 100 utilisations** : la carte de ce que vaut chaque condition de mer sur chaque spot pour chaque niveau, avec le jugement des moniteurs. Aucune application de prévisions ne l'a.
- **Utilisateur à appeler demain soir** : directeur d'école de surf (Hossegor, Lacanau, Biarritz, Bretagne) ; en octobre, la saison est encore ouverte.
- **% LLM** : 12 %
- **Risque principal** : démo de décision sur un spot que l'équipe ne connaît pas ; il faut qu'un vrai moniteur valide les règles avant midi.

### Monteur de best-of de stream
- **Pour un ami (2 phrases, zéro jargon)** : un streamer joue six heures en direct, et quelqu'un doit repérer les trois meilleurs moments et en faire des vidéos verticales sous-titrées. L'outil regarde le direct et le chat, découpe les moments, ajoute les sous-titres et prépare la publication, en apprenant ce que ce streamer garde.
- **Ce qu'on voit à l'écran en démo** : un flux de chat qui s'emballe, un trait rouge sur la frise du direct, et trente secondes plus tard le clip vertical sous-titré qui apparaît à côté.
- **Le travail que l'agent remplace** : le monteur ou community manager d'un streamer ou d'une structure esport. Une alerte de pic de chat ne produit pas le clip ; une requête SQL sur les messages ne sait pas si le pic était un moment drôle ou une polémique.
- **Donnée** : chat Twitch en lecture anonyme via IRC (sans compte, `[?]`) et vidéo du direct via streamlink (`[?]`) ; transcription sur Modal (crédits fournis). Les clips gardés ou rejetés par le streamer sont créés par l'usage.
- **Briques Aiven** :
  - Kafka : reçoit les chats de dizaines de chaînes en parallèle.
  - Valkey : compteurs glissants de messages et d'émotes par chaîne, pour repérer les pics à la seconde.
  - ClickHouse : garde chaque message de chat (des dizaines de milliers par minute sur une grosse chaîne) et calcule l'empreinte de réaction de chaque streamer.
  - OpenSearch : recherche dans les transcriptions (« le moment où il tombe du vélo »).
  - Postgres : clips produits, gardés, rejetés.
- **Ce que la base sait après 100 utilisations** : à quoi ressemble un bon moment pour chaque streamer, vu du chat (et non pour la moyenne des chaînes), et ce que son public partage.
- **Utilisateur à appeler demain soir** : community manager d'un streamer de taille moyenne ou d'une équipe esport.
- **% LLM** : 25 %
- **Risque principal** : les droits sur les extraits vidéo et la fragilité de l'accès aux flux Twitch sans compte ; l'idée est la plus classique de la liste.

### Régisseur général à la voix
- **Pour un ami (2 phrases, zéro jargon)** : sur un festival ou un gros événement, les équipes se parlent par radio et le régisseur décide qui envoie qui où. Ici, l'équipe parle dans son téléphone et l'agent écoute tout, tient l'état du site, envoie les bonnes personnes et prévient le régisseur seulement quand il faut trancher.
- **Ce qu'on voit à l'écran en démo** : trois d'entre nous jouent le personnel, parlent (« bar 3, plus de gobelets », « porte nord, file qui déborde ») ; le plan du site s'actualise, des tâches s'affectent, et un message vocal part vers la bonne personne.
- **Le travail que l'agent remplace** : le régisseur général ou le dispatcher radio de la sécurité et de la logistique. Une alerte ne ferait ni la réaffectation ni la priorisation entre cinq demandes simultanées.
- **Donnée** : voix des équipes via une page web push-to-talk que nous construisons, transcrite par ElevenLabs ; météo Open-Meteo (`[?]`). Tout est créé par l'usage ; en démo, l'équipe joue le terrain, ce qu'on dira franchement.
- **Briques Aiven** :
  - Kafka : reçoit chaque message vocal et chaque événement du site, dans l'ordre.
  - Valkey : tient l'état courant du site (qui est où, quelle tâche est ouverte, quels stocks sont bas).
  - Postgres : incidents, tâches, décisions, personnes.
  - ClickHouse : garde les journées d'événements précédentes pour dire « à 22 h, le bar 3 manque de gobelets dans X % des soirées » (chiffre à produire avec le premier vrai événement).
  - OpenSearch : retrouve par le sens les incidents passés (« qu'avait-on fait quand la scène 2 a perdu le courant »).
- **Ce que la base sait après 100 utilisations** : le déroulé réel de chaque lieu et de chaque soirée, avec ce qui casse et ce qui l'a réparé : un savoir qui part aujourd'hui avec le régisseur.
- **Utilisateur à appeler demain soir** : régisseur général ou responsable logistique d'un festival, d'un salon ou d'une salle de concert.
- **% LLM** : 30 %
- **Risque principal** : démo jouée, donc sans effet de réel, qui ressemble à un assistant vocal si l'état du site n'est pas visuellement fort.
