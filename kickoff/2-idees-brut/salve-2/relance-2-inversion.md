# Relance 2 : angle Inversion (21 oct. 2026)

Point de vue pris : celui qui a intérêt à ce qu'on ne regarde pas (transporteur, joueur, sous-traitant, client, magasin), ou celui qui n'a plus le temps de regarder. Sept idées. Cinq sont sous 20 % de probabilité qu'un autre LLM les propose.

---

### Le quai qui chronomètre les camions
- **Pour un ami (2 phrases, zéro jargon)** : Un responsable d'entrepôt reçoit des camions, et certains transporteurs lui facturent des heures d'attente qu'ils n'ont pas faites tout en disant être arrivés à l'heure. L'outil regarde la vidéo du quai, note l'heure réelle de chaque camion, et conteste la facture à sa place avec la preuve.
- **Ce qu'on voit à l'écran en démo** : Une vidéo de quai défile avec un chrono au-dessus de chaque camion, et à droite une facture « 3 h 10 d'attente » est barrée par la frise vidéo « arrivé 1 h 22 après le créneau, attente réelle 24 min », avec la lettre de contestation déjà rédigée.
- **Le travail que l'agent remplace** : Le chef de quai qui note les heures sur un cahier, et le responsable transport qui épluche les factures de « détention » (frais d'attente de camion) un mois plus tard. Une alerte ne suffit pas : l'heure réelle n'existe dans aucune base, elle est dans les pixels, et il faut la rapprocher du créneau réservé et des clauses du contrat de transport (franchise de 2 h, tarif horaire).
- **Donnée** : Vidéo filmée par l'utilisateur (téléphone sur trépied face au quai, ou caméra déjà installée) ; créneaux et conditions de transport en tableur que nous créons demain matin. Aucune source externe nécessaire. Vidéo publique de quai pour la démo si on ne filme pas : `[?]` non cherchée.
- **Briques Aiven** : Kafka (les événements « camion entré / déchargé / sorti » arrivent de plusieurs quais en parallèle) ; PostgreSQL (créneaux, camions, factures contestées, preuves horodatées).
- **Ce que la base sait après 100 utilisations** : Pour chaque transporteur, chaque quai et chaque heure de la journée, le retard réel, la durée réelle de déchargement, et l'écart entre ce qui est facturé et ce qui s'est passé. Personne d'autre n'a ce palmarès de la ponctualité vraie.
- **Utilisateur à appeler demain soir** : Responsable d'exploitation d'un entrepôt d'e-commerce ou d'un grossiste en Île-de-France (zone Rungis, Gennevilliers).
- **% LLM** : 10 %
- **Risque principal** : Relier un camion filmé à son ordre de transport sur une vidéo de téléphone ; on limite la démo à un quai, un angle fixe, un transporteur dont le logo est lisible.

---

### Vérificateur de records de speedrun
- **Pour un ami (2 phrases, zéro jargon)** : Les records de jeux vidéo sont validés par des bénévoles qui doivent regarder chaque vidéo en entier, parfois pendant des heures, et la file d'attente dure des semaines. L'outil regarde la vidéo à leur place, contrôle le chronomètre et les règles du jeu, puis rend un verdict avec les minutes précises à revoir.
- **Ce qu'on voit à l'écran en démo** : Une soumission arrive en direct sur le site des classements, l'agent la visionne en accéléré, affiche la frise des temps intermédiaires comparée aux autres records, entoure un raccord de montage suspect à 14:32 et pose « à rejeter : coupure » avec la raison rédigée comme le ferait un modérateur.
- **Le travail que l'agent remplace** : Le modérateur bénévole d'un classement (verifier). Une requête SQL ne suffit pas : la preuve est dans la vidéo (chrono affiché à l'écran, sauts d'image) et les règles sont du texte libre, différent pour chaque jeu et chaque catégorie.
- **Donnée** : API publique de speedrun.com v1, sans clé. Vérifié aujourd'hui : `runs?status=new` renvoie des soumissions du jour avec lien vidéo YouTube et durée ; `runs?status=rejected` renvoie la raison du rejet écrite par un modérateur, soit des étiquettes gratuites pour mesurer l'agent (c'est l'« avantage mesurable du modèle » demandé à Amsterdam). Téléchargement des vidéos (yt-dlp) : `[?]` peut être bloqué selon l'IP, prévoir un jeu de vidéos téléchargées ce soir.
- **Briques Aiven** : Kafka (flux des nouvelles soumissions et des verdicts) ; ClickHouse (tous les temps intermédiaires historiques d'un jeu, pour dire si une progression est plausible) ; OpenSearch (règles des jeux et raisons de rejet passées, pour citer le précédent dans le verdict) ; PostgreSQL (dossiers et décisions). Modal pour extraire les images.
- **Ce que la base sait après 100 utilisations** : Pour chaque jeu et catégorie, la forme d'une progression honnête, les signatures de triche déjà vues, et les cas où le modérateur humain a corrigé l'agent. Ce jeu de jugements annotés n'existe nulle part.
- **Utilisateur à appeler demain soir** : Modérateur d'un grand classement (Super Mario Bros., Celeste, Minecraft), joignable sur le Discord du jeu ; plus tard un organisateur de marathon caritatif de speedrun à cagnotte.
- **% LLM** : 7 %
- **Risque principal** : Lire un chrono de jeu sur 10 minutes de vidéo coûte cher en tokens et la route vers un client payant est floue (les modérateurs sont bénévoles) ; on choisit un seul jeu et une catégorie courte.

---

### Arbitre de tournois d'échecs en ligne
- **Pour un ami (2 phrases, zéro jargon)** : L'organisateur d'un tournoi en ligne avec de l'argent à gagner soupçonne des joueurs de se faire aider par un programme, mais ne peut pas rejouer 400 parties. L'outil suit les parties en direct, enquête sur les suspects et rend un dossier d'arbitrage qu'on peut défendre devant le joueur accusé.
- **Ce qu'on voit à l'écran en démo** : Des parties du monde entier défilent en direct, un joueur passe au rouge, et l'agent ouvre un dossier d'une page : taux de coups identiques au moteur comparé à des joueurs du même niveau, rythme de réflexion trop régulier, lien avec un compte déjà banni.
- **Le travail que l'agent remplace** : L'arbitre chargé du fair-play. Une requête ne suffit pas, car la décision doit être motivée et croise des signaux de nature différente, avec un jugement sur les cas limites (un très bon joueur naturel contre un moteur). Honnêtement, le score statistique en lui-même est de la requête ; l'agent apporte l'enquête et la rédaction.
- **Donnée** : API de Lichess, sans compte. Vérifié aujourd'hui : `/api/tv/channels` et `/api/user/{id}` répondent sans clé ; le flux de parties en direct fait partie de la même API (non testé, c'est un flux continu). Le dump mensuel de septembre 2026 existe (29 Go compressés, réponse 200 vérifiée) et sert de référence « jeu humain par niveau ». Le champ `tosViolation` (comptes marqués par Lichess, donc des étiquettes) : `[?]` non vérifié. Stockfish à lancer dans un conteneur sur Modal.
- **Briques Aiven** : Kafka (flux de parties) ; ClickHouse (les coups du dump comme base de normalité par niveau et par cadence) ; PostgreSQL (dossiers, jugements) ; Valkey (état des parties en cours).
- **Ce que la base sait après 100 utilisations** : La courbe du jeu naturel par niveau et par cadence, les verdicts d'arbitres humains sur les cas limites, et le réseau de comptes qui se ressemblent.
- **Utilisateur à appeler demain soir** : Organisateur de tournois en ligne à prix d'une ligue ou d'un club (ou d'une communauté de streamers d'échecs).
- **% LLM** : 22 %
- **Risque principal** : Lichess et Chess.com ont déjà leurs détecteurs internes, le marché d'un arbitre indépendant est étroit, et une accusation à tort coûte cher en réputation.

---

### État des lieux d'un bateau loué
- **Pour un ami (2 phrases, zéro jargon)** : Un loueur de voiliers doit décider au retour du client s'il garde la caution (2 000 à 5 000 €) sans savoir ce qui s'est passé en mer : zone dépassée, ancre jetée sur un herbier protégé, échouement discret. L'outil reconstitue la sortie à partir du signal du bateau et décide de la retenue avec les preuves.
- **Ce qu'on voit à l'écran en démo** : La trace d'un voilier sur une semaine se dessine sur une carte, un arrêt de 3 h tombe sur une zone d'herbier, une décélération brutale sur un haut-fond, et l'agent affiche « retenue proposée 800 € » avec les deux extraits de carte et le message au client.
- **Le travail que l'agent remplace** : Le chef de base qui fait le débriefing au retour, croise ce que dit le client avec ce qu'il voit sur la coque, et décide de la caution. Une alerte ne suffit pas : il faut reconstituer une histoire de huit jours à partir de milliers de points, la croiser avec des cartes, puis négocier.
- **Donnée** : Flux AIS en direct, mondial, via aisstream.io (WebSocket). Vérifié dans la documentation : le flux inclut les messages des petits bateaux de plaisance (`StandardClassBPositionReport`), la clé se crée depuis un compte ; la gratuité du compte n'est pas écrite explicitement dans ce que j'ai lu, donc `[?]`. Cartes d'herbiers et de profondeurs : EMODnet (public) `[?]` non vérifié. Démo avec un bateau de plaisance réel qui passe dans le flux demain matin.
- **Briques Aiven** : Kafka (messages de position en continu) ; ClickHouse (historique de toutes les traces, pour dire si un comportement est normal sur cette zone) ; PostgreSQL (locations, cautions, décisions).
- **Ce que la base sait après 100 utilisations** : Les mouillages qui abîment les bateaux, les hauts-fonds où l'on s'échoue, le comportement réel des clients par zone, et le taux de contestation de caution gagné avec preuve.
- **Utilisateur à appeler demain soir** : Chef de base d'une société de location de voiliers (Marseille, Hyères, Lorient) ou d'un loueur de bateaux sans permis.
- **% LLM** : 10 %
- **Risque principal** : Beaucoup de bateaux de location n'émettent pas en AIS ; il faudra un traceur GPS à 30 € à bord, et la démo repose sur un bateau qui n'est pas le nôtre.

---

### Le court de padel vide
- **Pour un ami (2 phrases, zéro jargon)** : Un gérant de club de padel perd de l'argent chaque fois qu'un joueur réserve un terrain et ne vient pas. L'outil regarde le terrain par caméra, voit qu'il est vide dix minutes après l'heure, propose le créneau aux joueurs en attente, encaisse, et note qui ne vient jamais.
- **Ce qu'on voit à l'écran en démo** : Une vidéo de terrain vide à 18 h 10, six SMS partent vers la liste d'attente, le premier qui répond paie par Stripe en mode test, la vignette du terrain passe de « vide » à « revendu », et une ligne s'affiche : « Léa a manqué 3 de ses 5 dernières réservations, prochaine réservation sur acompte ».
- **Le travail que l'agent remplace** : L'accueil du club qui fait le tour des terrains et téléphone, et le responsable de la tarification d'une compagnie aérienne qui pratique le surbooking. Une requête ne suffit pas : le logiciel de réservation sait qui a réservé, jamais qui est venu ; seule la caméra le sait, et il faut ensuite relancer, encaisser et fixer le prix.
- **Donnée** : Vidéo de terrain filmée au téléphone (terrain vide puis occupé, 5 minutes demain matin) ; créneaux et joueurs en tableur que nous créons ; paiements Stripe test. Aucune source externe. Donnée créée par l'usage.
- **Briques Aiven** : Kafka (détections de présence par terrain) ; Valkey (verrou de créneau pour ne pas revendre deux fois, et file d'attente) ; PostgreSQL (joueurs, présences, paiements).
- **Ce que la base sait après 100 utilisations** : Pour chaque joueur, chaque horaire et chaque météo, la probabilité de ne pas venir ; le prix qui remplit le dernier créneau ; le niveau de surbooking sans risque pour ce club.
- **Utilisateur à appeler demain soir** : Gérant d'un club de padel indoor en Île-de-France.
- **% LLM** : 8 %
- **Risque principal** : Un terrain vide est facile à détecter, donc la démo peut sembler mince ; la profondeur vient de la boucle revente plus le modèle de non-venue, à montrer en premier.

---

### Le sous-traitant qui n'est pas venu
- **Pour un ami (2 phrases, zéro jargon)** : Un conducteur de travaux perd ses matinées à savoir qui est vraiment sur le chantier et à rappeler ceux qui ne sont pas venus. L'outil regarde la caméra du chantier, voit quelle équipe manque, l'appelle avec une voix de synthèse, et refait le planning de la journée.
- **Ce qu'on voit à l'écran en démo** : À 8 h, la caméra du chantier montre deux équipes sur trois ; l'agent téléphone au plombier absent (Adem joue le plombier), obtient « j'arrive à 10 h », et décale l'équipe de carrelage à l'étage libre.
- **Le travail que l'agent remplace** : Le conducteur de travaux et l'assistant d'ordonnancement qui pointent les présences et replanifient. Une alerte ne suffit pas : replanifier suppose les dépendances entre lots et le contrat (pénalités), et le coup de téléphone a lieu pour obtenir un engagement daté.
- **Donnée** : Caméra de chantier. Recherche web faite aujourd'hui : des webcams de chantier existent (CERN Prévessin, siège de santé du comté de Multnomah, campus Edge Hill) mais sur des pages de projet sans flux stable ni licence claire, donc `[?]` pour la démo ; plan réaliste : vidéo filmée sur un chantier d'un proche ou time-lapse. Planning et sous-traitants : tableur créé par nous. Voix : ElevenLabs (crédits fournis) ; l'appel téléphonique réel demande un numéro, sinon la démo passe par le navigateur.
- **Briques Aiven** : Kafka (détections d'équipes par heure et par chantier) ; PostgreSQL (planning, dépendances, engagements pris au téléphone).
- **Ce que la base sait après 100 utilisations** : Pour chaque sous-traitant, présence réelle contre présence annoncée, jour par jour, et le délai réel entre « j'arrive » et l'arrivée. Une fiabilité mesurée que le promoteur n'a nulle part.
- **Utilisateur à appeler demain soir** : Conducteur de travaux d'une entreprise générale de rénovation ou d'un petit promoteur.
- **% LLM** : 30 %
- **Risque principal** : Le jury a primé SiteSync et verra la parenté ; la différence à défendre est l'angle absence et engagement obtenu par la voix, et la démo reste jouée tant qu'on n'a pas de vrai flux de chantier.

---

### Le rayon qui cache ma marque
- **Pour un ami (2 phrases, zéro jargon)** : Une petite marque de bière vend dans 300 magasins de Paris, ses commerciaux filment les rayons et personne ne regarde ces vidéos ; certains magasins cachent la marque en bas ou la remplacent par un concurrent. L'outil regarde chaque vidéo, corrige le commercial sur place par la voix, et prépare la tournée du lendemain.
- **Ce qu'on voit à l'écran en démo** : Une vidéo de rayon filmée le matin même se transforme en grille, notre canette est entourée en rouge tout en bas à gauche, le concurrent est à hauteur d'yeux, un message au chef de rayon est rédigé et une visite de contrôle est ajoutée au planning.
- **Le travail que l'agent remplace** : Le chef de secteur sur le terrain et la personne au siège qui dépouille les photos. Une requête ne suffit pas : la donnée est dans les pixels, aucun flux n'existe.
- **Donnée** : Vidéos filmées par les commerciaux (donnée créée par l'usage), on filme un rayon demain matin. Catalogue d'emballages concurrents : Open Food Facts (base ouverte avec API sans clé, d'après ma connaissance) `[?]` non vérifié aujourd'hui.
- **Briques Aiven** : PostgreSQL (magasins, visites, position de chaque produit) ; OpenSearch (reconnaître un emballage inconnu par similarité image et texte) ; ClickHouse seulement quand l'historique des faces par magasin et par semaine devient volumineux.
- **Ce que la base sait après 100 utilisations** : La cartographie des rayons de Paris : qui place quoi à quelle hauteur, quel magasin déplace nos produits, quel jour tombent les ruptures. Cette carte a de la valeur pour les autres marques aussi.
- **Utilisateur à appeler demain soir** : Responsable commercial d'une marque de boisson ou de snack artisanale distribuée en supérettes.
- **% LLM** : 15 %
- **Risque principal** : Reconnaître un produit sur une vidéo de mauvaise qualité, et des sociétés établies de reconnaissance de rayons existent déjà, le jury demandera la différence.

---

## Vérifications faites (4 sur 4 autorisées)
1. speedrun.com API v1 : accessible sans clé, soumissions du jour avec vidéo, rejets avec raison. Vérifié.
2. Lichess : API de chaînes et de profils accessible sans clé, dump de septembre 2026 présent (29 Go). Vérifié. Champ `tosViolation` et flux de parties en direct : non testés.
3. aisstream.io : documentation lue, WebSocket avec clé créée depuis un compte, messages de bateaux de plaisance inclus. Gratuité du compte non confirmée.
4. Recherche de webcams de chantier : pas de flux public stable trouvé. D'où `[?]` sur l'idée du chantier et le choix de la vidéo filmée par l'utilisateur pour les autres.

Probabilités sous 20 % : le quai (10), le speedrun (7), le bateau (10), le padel (8), le rayon (15). Les trois idées les plus loin du typique : le speedrun, le padel et le bateau.
