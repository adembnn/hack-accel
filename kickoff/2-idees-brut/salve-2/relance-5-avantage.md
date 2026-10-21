# Relance 5 : avantage injuste de l'équipe (21 oct. 2026)

Angle traité : quelle idée n'est crédible que parce que quatre étudiants à Paris ont des caméras, des rues, un jury dans la salle, Modal, ElevenLabs et Lovable.

## Vérifications de sources (4 recherches)
- Mapillary (photos de rues, API v4) : jeton gratuit avec un compte développeur, accès sans abonnement. L'endpoint images plafonne la taille de la zone interrogée (un utilisateur cite 0,001 degré carré) : il faut découper Paris en tuiles ou passer par les tuiles vectorielles. Couverture réelle du 8e/9e à tester [?].
- Chantiers perturbants de Paris : jeu de données ouvert, miroir data.gouv.fr en CSV/JSON/SHP, mis à jour chaque semaine, non exhaustif (travaux majeurs, plus d'une semaine, grands axes). Identifiant exact sur opendata.paris.fr [?]. Coordonnées en Lambert 93.
- Marchés de Paris : paris.fr/marches donne la liste actuelle (83 marchés alimentaires selon la page de juin 2026, 91 selon une autre page d'avril 2026 : chiffres en conflit). La copie data.gouv.fr date de 2014, inutilisable telle quelle. Quel marché ouvre jeudi matin près de la salle : à lire sur paris.fr/marches [?].
- OSM : Overpass public, pas de quota dur sous 10 000 requêtes/jour, compte non mentionné [?]. Le serveur de démo OSRM est « best effort » et retirable à tout moment : auto-héberger le calcul d'itinéraire sur Modal.

Sources : blog.mapillary.com (API v4), mapillary.com/developer/api-documentation, data.gouv.fr (chantiers perturbants, marchés), paris.fr/marches, wiki.openstreetmap.org/wiki/Overpass_API, github.com/Project-OSRM/osrm-backend/wiki/API Usage Policy.

---

### Réalisateur de plateau à quatre caméras
- **Pour un ami (2 phrases, zéro jargon)** : un organisateur de conférence, de meetup ou de remise de diplômes pose quelques téléphones dans la salle. Un réalisateur virtuel choisit à chaque seconde quelle image part à l'écran, souffle des consignes aux porteurs de téléphone (« zoome sur l'intervenante, tu es trop large ») et sort le montage final.
- **Ce qu'on voit à l'écran en démo** : un écran divisé en quatre flux, une bordure rouge qui saute d'un flux à l'autre, et à droite le programme que le jury regarde, avec un juré à l'écran dont l'image a été choisie par l'agent pendant qu'il posait sa question.
- **Le travail que l'agent remplace** : le réalisateur et le mélangeur d'images d'une régie de captation (équipe facturée plusieurs centaines d'euros la demi-journée). Une règle du type « change de plan toutes les 6 secondes » donne un résultat qu'on reconnaît aussitôt comme artificiel : il faut comprendre qui parle, qui réagit, quel cadre est net.
- **Avantage injuste exploité** : quatre téléphones, quatre personnes capables de cadrer, un jury vivant dans la salle au moment du pitch, une voix ElevenLabs dans l'oreillette de chaque cadreur. Une autre équipe a aussi des téléphones, mais aucune ne bâtit son produit autour de la salle elle-même.
- **Donnée** : flux vidéo et son des téléphones, créés par l'usage, disponibles dès que la première personne ouvre la page Lovable de capture (images à 1-2 par seconde + audio). Aucune source externe ; rien à obtenir (vérifié : aucune dépendance).
- **Briques Aiven** : Kafka (un sujet par caméra, images échantillonnées et transcription en flux) ; ClickHouse (journal de chaque coupe : plan choisi, durée, ce qui se disait) ; OpenSearch (retrouver un moment de la soirée par le sens, « quand la salle a ri ») ; PostgreSQL (fiche de l'événement et préférences de style de l'organisateur).
- **Ce que la base sait après 100 utilisations** : pour chaque salle, où se placer pour avoir un bon angle sur la scène ; pour chaque type de moment (question, blague, démo à l'écran), quel plan l'organisateur a gardé ou rejeté au montage ; la durée de plan qui plaît selon le genre d'événement.
- **Utilisateur à appeler demain soir** : responsable communication d'une école ou d'une association qui filme ses événements avec un stagiaire et un trépied.
- **% LLM** : 6 %
- **Risque principal** : latence et fiabilité du choix de plan en direct ; plan de repli : l'agent décide avec 2 à 3 secondes de retard et le montage final est refait à la sortie.

### Régulateur de coursiers, à la voix
- **Pour un ami (2 phrases, zéro jargon)** : une société de livraison à vélo ou à pied a dix coursiers dans la ville et une personne au téléphone qui leur dit où aller. L'outil tient ce poste : il parle à chaque coursier dans l'oreillette, réattribue les courses quand l'un est coincé, et sait que telle porte d'immeuble met quatre minutes à s'ouvrir.
- **Ce qu'on voit à l'écran en démo** : une carte de Paris avec deux points qui bougent (Titouan et Sullyvan, dehors, en direct), un juré qui scanne un code dans la salle pour commander un objet à faire livrer à l'autre bout du quartier, et la voix de l'agent qui dirige le coursier, le minuteur d'arrivée se mettant à jour.
- **Le travail que l'agent remplace** : le régulateur d'exploitation d'un coursier (transport de prélèvements, de documents, de repas). Une requête SQL ne suffit pas : il faut arbitrer en continu entre promesses faites au client, position réelle des coursiers et imprévus rapportés à voix haute.
- **Avantage injuste exploité** : l'équipe est la flotte, dans la rue en bas de la salle, et le jury peut passer commande lui-même. Une autre équipe devrait simuler des coursiers.
- **Donnée** : position GPS des téléphones de l'équipe (créée par l'usage), réseau routier OSM via Overpass (public ; compte non requis, non confirmé [?]) et calcul d'itinéraire OSRM auto-hébergé sur Modal. Obtenable demain matin : GPS dès le premier test dans la rue.
- **Briques Aiven** : Kafka (positions GPS et événements de course, en flux) ; ClickHouse (temps de trajet réels par rue, jour et heure) ; PostgreSQL (courses, coursiers, et la mémoire des immeubles : code, attente, entrée à utiliser).
- **Ce que la base sait après 100 utilisations** : combien de temps on perd vraiment à chaque adresse (interphone en panne, passage par la cour, étage sans ascenseur) et la vitesse réelle de chaque coursier selon l'heure et le trajet. Aucune application de cartographie ne connaît ce « dernier mètre ».
- **Utilisateur à appeler demain soir** : responsable d'exploitation d'une société de coursiers à vélo parisienne, ou chef de coursiers d'une pharmacie de garde.
- **% LLM** : 12 %
- **Risque principal** : le jour J, deux builders sur quatre dehors pendant que le reste de l'équipe code ; à planifier au quart d'heure.

### Prospecteur de chantiers pour loueurs
- **Pour un ami (2 phrases, zéro jargon)** : un loueur de nacelles, d'échafaudages et de bennes envoie des commerciaux rouler dans la ville pour repérer les chantiers où vendre. L'outil regarde des vidéos de rue, comprend où en est chaque chantier, prévoit le matériel qui manquera dans trois semaines et prépare l'appel au conducteur de travaux.
- **Ce qu'on voit à l'écran en démo** : six vidéos de chantiers parisiens filmées le matin même sur le trottoir, chacune avec une fiche (phase, matériel visible, besoin à venir, qui appeler) et une fenêtre de vente affichée en compte à rebours.
- **Le travail que l'agent remplace** : le technico-commercial itinérant qui fait sa tournée en véhicule, ou le chargé de prospection chantiers. Une alerte dirait « il y a un chantier rue X » ; ici l'agent juge la phase, anticipe le besoin et rédige la visite.
- **Avantage injuste exploité** : les quatre téléphones peuvent filmer six chantiers entre 8 h et 9 h en venant à la salle ; Modal fait tourner un modèle de vision ouvert sur les images. Les équipes qui prennent la piste chantier (la référence SiteSync est connue de tout le monde) partiront de caméras de chantier qu'elles n'auront pas.
- **Donnée** : vidéos de rue filmées par l'équipe (créée par l'usage) + liste des chantiers perturbants de Paris pour trouver où filmer (mise à jour hebdomadaire, non exhaustive ; miroir CSV sur data.gouv.fr, identifiant opendata.paris.fr [?]).
- **Briques Aiven** : OpenSearch (images et fiches retrouvables par le sens : « chantiers en ravalement dans le 9e ») ; PostgreSQL (un chantier = une ligne, une chronologie de phases à chaque nouvelle vidéo) ; ClickHouse (durées de phases agrégées par type de bâtiment).
- **Ce que la base sait après 100 utilisations** : combien de semaines un chantier parisien de ce type passe en gros œuvre avant de réclamer des échafaudages, donc à quelle date appeler. Personne n'a cette chronologie, car personne ne repasse devant le même chantier chaque semaine.
- **Utilisateur à appeler demain soir** : responsable d'agence d'un loueur de matériel de chantier (type Loxam, Kiloutou, Boels) en Île-de-France.
- **% LLM** : 22 %
- **Risque principal** : une seule vidéo ne dit pas la durée d'une phase ; le chantier doit être revu, donc la démo tient sur la promesse plus que sur la preuve.

### Chasseur de locaux commerciaux
- **Pour un ami (2 phrases, zéro jargon)** : quelqu'un qui veut ouvrir un bar à jus ou une boulangerie ne sait pas quelle rue choisir. L'outil lit les façades d'un quartier entier, compte le passage devant quelques points filmés et propose les rues et les locaux à visiter en premier, avec la raison.
- **Ce qu'on voit à l'écran en démo** : une carte du 8e et du 9e colorée par type de commerce, avec les vitrines vides repérées sur photo, et un client fictif qui dit à voix haute « boulangerie bio, 40 m² » ; l'agent répond avec une tournée de visite.
- **Le travail que l'agent remplace** : le chargé d'implantation d'un réseau de franchise, ou le chasseur de locaux d'une agence de commerces. Une requête SQL sur la liste des commerces ne voit ni les rideaux baissés, ni l'ambiance de la rue, ni qui passe à 8 h.
- **Avantage injuste exploité** : Modal traite toute la nuit des milliers de photos de rue ; les téléphones filment ce soir et cette nuit quatre trottoirs depuis des fenêtres (comptage de passants, visages floutés, images brutes effacées). Personne d'autre n'aura de comptage horaire à ces adresses.
- **Donnée** : photos de rue Mapillary via l'API v4 (jeton gratuit avec compte, zone limitée par requête donc découpage en tuiles ; couverture 8e/9e à tester [?]), commerces OSM via Overpass (public ; compte non confirmé [?]), vidéos de fenêtre filmées par l'équipe.
- **Briques Aiven** : OpenSearch (façades indexées par le sens et par adresse) ; ClickHouse (passages par minute et par point, séries longues) ; PostgreSQL (briefs des clients et locaux visités).
- **Ce que la base sait après 100 utilisations** : pour chaque rue, le rythme horaire du passage et ce qui a fermé ou ouvert depuis trois mois, plus les retours des clients sur chaque local visité (trop cher, mal exposé), ce qui calibre le conseil.
- **Utilisateur à appeler demain soir** : responsable développement d'une chaîne de boulangeries ou de cafés qui ouvre dix points par an à Paris.
- **% LLM** : 14 %
- **Risque principal** : quatre points de comptage ne suffisent pas à noter un quartier ; l'extrapolation repose sur les façades, donc la qualité de l'analyse d'images décide de tout. Le RGPD impose de ne garder que les comptages.

### Gouvernante de locations courtes
- **Pour un ami (2 phrases, zéro jargon)** : une conciergerie qui gère quarante appartements Airbnb à Paris envoie une personne vérifier chaque logement après le ménage. À la place, la femme de ménage filme son tour de l'appartement et l'outil lui dit à voix haute ce qui cloche (coussin manquant, trace sur le canapé, serviettes comptées).
- **Ce qu'on voit à l'écran en démo** : un juré déplace trois objets dans un coin de la salle de pitch pendant que l'écran est tourné ; on filme 20 secondes ; l'agent affiche les trois écarts entourés avec la phrase correspondante, puis les annonce de vive voix.
- **Le travail que l'agent remplace** : la gouvernante ou le contrôleur qualité d'une conciergerie. Une règle ou une alerte ne sait pas qu'un tableau a changé de place ni qu'une tache d'huile est apparue sur le sol.
- **Avantage injuste exploité** : l'équipe peut filmer ce soir l'état de référence de ses propres logements et d'une pièce de la salle, et le jury devient le saboteur en direct. Une autre équipe n'a rien à comparer.
- **Donnée** : parcours vidéo de référence et parcours après passage, créés par l'équipe (ce soir, quatre logements) puis par l'usage. Obtenable demain matin : déjà filmé.
- **Briques Aiven** : OpenSearch (images clés de chaque pièce, cherchées par le sens pour aligner « avant » et « après ») ; PostgreSQL (logements, pièces, listes de contrôle, historique des anomalies par prestataire).
- **Ce que la base sait après 100 utilisations** : les endroits où chaque logement se dégrade (joint de douche, bord de canapé), les anomalies qui reviennent selon l'équipe de ménage, la vitesse à laquelle un objet disparaît d'un appartement.
- **Utilisateur à appeler demain soir** : gérant d'une conciergerie Airbnb parisienne de 30 à 60 logements.
- **% LLM** : 17 %
- **Risque principal** : deux vidéos du même lieu ne se superposent jamais exactement (lumière, angle) ; l'agent risque de signaler à tort des différences de cadrage.

### Acheteur du marché, pour chefs
- **Pour un ami (2 phrases, zéro jargon)** : un chef de restaurant envoie son second faire le marché tous les matins. L'outil marche à côté de lui via la caméra du téléphone, lit les prix sur les étals, juge si les produits ont l'air frais et lui dit à l'oreille où acheter quoi pour tenir la carte du jour au meilleur coût.
- **Ce qu'on voit à l'écran en démo** : une vidéo filmée à un vrai marché ce matin, les étiquettes de prix qui s'incrustent sur les étals, une liste d'achats qui se recompose chaque fois qu'un étal est filmé, et la voix de l'agent qui lit « artichauts, troisième étal, 0,60 € de moins au kilo ».
- **Le travail que l'agent remplace** : l'acheteur ou le second qui fait la tournée des étals (une à deux heures par jour). Une table de prix ne dit pas lequel des étals a de la belle marchandise aujourd'hui, ni où le chef s'est déjà fait avoir.
- **Avantage injuste exploité** : un des quatre est à Paris jeudi matin, téléphone en main, devant de vrais étals. Aucun prix de marché parisien n'existe en données ouvertes : seule la caméra le produit.
- **Donnée** : étiquettes et produits filmés dans un marché de Paris, jeudi 22 oct. avant 9 h (quel marché ouvre jeudi près d'eux : à lire sur paris.fr/marches [?]) ; la liste officielle des marchés sert de référence, pas de source de prix (la copie data.gouv.fr date de 2014).
- **Briques Aiven** : ClickHouse (séries de prix par produit, étal, marché et date) ; PostgreSQL (carte du chef, étals de confiance, notes de qualité) ; OpenSearch (retrouver un produit saisi en langage libre, « les petits cèpes » ou « la burrata »).
- **Ce que la base sait après 100 utilisations** : l'évolution des prix du jour dans des dizaines de marchés, quels étals ont eu de la qualité quel jour, et les habitudes d'achat de chaque chef. Aucune base publique ne contient cela.
- **Utilisateur à appeler demain soir** : chef ou second d'un restaurant parisien de moyenne gamme qui travaille avec des produits frais.
- **% LLM** : 9 %
- **Risque principal** : juger la fraîcheur à l'image est fragile ; la valeur doit tenir d'abord sur la lecture des prix et le plan d'achat.

### Ouvreur de salle d'escalade
- **Pour un ami (2 phrases, zéro jargon)** : dans une salle de bloc, des ouvreurs changent les parcours chaque semaine à l'instinct. L'outil regarde les vidéos que les grimpeurs filment eux-mêmes, voit quels parcours ne passent jamais ou passent toujours, et dit aux ouvreurs quoi démonter et quoi créer, avec les prises à utiliser.
- **Ce qu'on voit à l'écran en démo** : une vidéo d'un grimpeur qui tombe au troisième mouvement, la prise fautive entourée, puis le planning de remplacement de la semaine pour la zone concernée.
- **Le travail que l'agent remplace** : le chef ouvreur d'une salle, qui décide des parcours à retirer et des nouveaux à poser. Une requête sur les entrées de la salle ne dit rien d'un parcours précis ni du mouvement où tout le monde échoue.
- **Avantage injuste exploité** : des personnes capables de filmer des essais ce soir dans une salle de bloc à Paris, et Modal pour estimer les poses des grimpeurs. Une autre équipe n'a pas de grimpeur ; le coût de collecte est le vrai verrou, levé chez nous seulement si l'un des quatre grimpe [?].
- **Donnée** : essais filmés par les grimpeurs, créés par l'usage (un code collé sur chaque bloc ouvre la page Lovable de dépôt). Accord de la salle à obtenir ce soir [?].
- **Briques Aiven** : ClickHouse (chaque essai : bloc, réussite, point de chute, durée) ; PostgreSQL (plan de la salle, historique des parcours posés par ouvreur) ; OpenSearch (retrouver des essais semblables par le mouvement, pour comparer les chutes).
- **Ce que la base sait après 100 utilisations** : le taux de réussite réel de chaque parcours, les mouvements qui bloquent la plupart des gens et le profil de grimpeur (taille, style) associé, donc la répartition de difficulté que la salle devrait viser.
- **Utilisateur à appeler demain soir** : chef ouvreur ou gérant d'une salle d'escalade de bloc à Paris.
- **% LLM** : 3 %
- **Risque principal** : l'accès à une salle et le consentement des grimpeurs filmés ; sans salle ce soir, la démo n'a pas de matière.

---

## Mon classement (brut)
1. Réalisateur de plateau à quatre caméras : démo en direct sur le jury, la plus visuelle, la plus rare (6 %).
2. Prospecteur de chantiers pour loueurs : la plus proche du goût d'Adem (SiteSync), avec un angle commercial.
3. Régulateur de coursiers : l'équipe est la flotte, mais le jour J coûte du temps.
Les quatre autres dépendent d'un accès ou d'une collecte que seule la soirée peut confirmer.
