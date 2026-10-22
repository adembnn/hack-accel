# État de l'art 7 : le Forum des Halles / Châtelet est-il modélisable avec des données publiques ?

Décision débloquée : choisir entre le Forum des Halles / Châtelet et l'espace public autour de l'Accor Arena.
Mesures faites le 22 oct. 2026 (accès réseau depuis cette machine). Légende : `[?]` non vérifié, `[bloqué]` accès refusé malgré un contournement.

## Version simple

- Le Forum des Halles est un grand centre commercial enterré, collé à la plus grande gare souterraine du monde. Les cartes ouvertes (OpenStreetMap, « OSM », la carte libre et collaborative) le décrivent déjà beaucoup mieux que l'Accor Arena : sur une zone de 600 m x 500 m autour du Forum, j'ai compté 1 782 objets portant un niveau ou un marquage « intérieur », contre environ 44 à l'Accor Arena.
- Ce que OSM ne dit pas : la capacité de chaque couloir, la largeur utile des issues, ce qui est réellement ouvert ou fermé. Il faudra saisir ces valeurs à la main, avec des hypothèses annoncées comme telles.
- Les données de transport (accès des stations, passagers par jour) se chargent sans compte, en quelques minutes. L'historique des fermetures de stations n'existe pas en jeu de données : seul le fil de presse et les comptes RATP/préfecture le racontent. À saisir à la main pour un scénario.
- L'incident existe dans la presse, mais les sources donnent le lundi 19 oct. 2026 (pas le dimanche 18) : voir section 5.
- Lecture rapide : le Forum a la géométrie la plus riche et le scénario le plus ancré dans le réel ; l'Accor Arena est plus simple (un seul bâtiment, pas de sous-sol imbriqué) mais plus pauvre en données. Le choix reste à l'équipe.

## 1. Le lieu

| Fait | Valeur | Source |
|---|---|---|
| Exploitant du centre commercial | Unibail-Rodamco-Westfield (URW) ; la Caisse des Dépôts a acheté 15 % en 2025 | [Wikipedia](https://en.wikipedia.org/wiki/Forum_des_Halles), [FashionNetwork](https://bh.fashionnetwork.com/news/Urw-sells-15-stake-in-forum-des-halles-to-caisse-des-depots,1689846.html) |
| Exploitant de la gare / pôle d'échanges | RATP (hub Châtelet-Les Halles) | [Wikipedia](https://en.wikipedia.org/wiki/Forum_des_Halles) |
| Cinéma | UGC Ciné Cité Les Halles : 27 salles, plus de 3 800 sièges, 2,6 millions d'entrées en 2025 (n° 1 mondial) | [Le Bonbon](https://en.lebonbon.fr/paris/news/cinema-more-frequented-world) |
| Accès piéton au cinéma | Place Carrée, niveau -4 | [UGC](https://ugc.fr/cinema.html?id=10) |
| Autres cinémas | Forum des Images (même ensemble, rue du Cinéma) ; Gaumont Les Halles a fermé `[?]` (page « The Last Show », non relue) | [Silverscreens](https://silverscreens.com/en_hal.html) |
| Niveaux | 3 à 5 niveaux souterrains selon la source (62 100 m² de commerce sur 3 niveaux, ou 75 000 m² sur 5 niveaux : sources non concordantes) | [malls.com](https://malls.com/malls/le-forum-des-halles), [aroundus](https://aroundus.com/p/10429094-westfield-forum-des-halles) |
| Fréquentation | environ 50 millions de visiteurs par an ; environ 750 000 voyageurs par jour sur le pôle | [Wikipedia](https://en.wikipedia.org/wiki/Ch%C3%A2telet%E2%80%93Les_Halles) |
| Capacité réglementaire du Forum (jauge ERP, établissement recevant du public) | introuvable en public ; la jauge relève de la commission de sécurité | introuvable |

Entrées publiques connues (jeu IDFM « Accès », 18 accès à moins de 400 m du centre du Forum, tous marqués entrée et sortie, fournisseur RATP), dont les portes du Forum : Porte du Louvre, Porte Rambuteau, Porte Lescot, Porte Berger, Porte Saint-Eustache, Porte du Pont-Neuf, Porte du Jour, Porte Marguerite de Navarre (8 portes). Les autres : rue de Turbigo, Théâtre de la Ville, place du Châtelet, rue de Rivoli, rue Saint-Denis, rue Bertin-Poirée, rue des Lavandières, rue Montorgueil, Théâtre du Châtelet, place Sainte-Opportune.
Attention : ce sont des accès de la station, pas la liste des issues de secours du cinéma. L'accès « place Carrée » n'apparaît pas sous ce nom. Les issues de secours réelles ne sont pas publiques et ne sont pas documentées ici (garde-fou respecté).

Station : métro 1, 4, 7, 11, 14 et RER A, B, D `[sourcé]` ([IDFM](https://iledefrance-mobilites.fr/actualites/visite-pape-leon-xiv-paris-itineraires-transports)). Châtelet-Les Halles désigne officiellement la gare RER ; Châtelet (1, 4, 7, 11, 14) et Les Halles (ligne 4) sont des stations de métro contiguës ([Wikipedia](https://en.wikipedia.org/wiki/Ch%C3%A2telet%E2%80%93Les_Halles)).

## 2. Géométrie ouverte (OpenStreetMap)

Méthode : requête Overpass (le moteur de requête public d'OSM) sur la boîte 48.8590-48.8640 N, 2.3435-2.3505 E (Forum + station + abords immédiats), depuis le point `overpass-api.de`.
Ce qui marche et ce qui ne marche pas :
- `overpass-api.de` : refuse (erreur 406) les requêtes sans identifiant de client ; accepte avec un `User-Agent` renseigné. Parfois saturé (erreur 502) ou limité en débit : attendre 6 à 15 s entre deux requêtes.
- `overpass.kumi.systems` et `overpass.private.coffee` : injoignables depuis cette machine (code 000, pas de connexion) `[bloqué]`.
- Extraits Geofabrik, osm.org : non essayés, inutiles puisque le premier point répond.

Comptages Forum / Châtelet (boîte ci-dessus, nœuds + chemins + relations) :

| Objet OSM | Nombre |
|---|---|
| `level=*` (niveau) | 1 719 |
| `indoor=*` (intérieur), tout type | 725 |
| dont `indoor=area` (zone) | 129 |
| dont `indoor=room` (pièce) | 88 |
| dont `indoor=corridor` (couloir) | 82 |
| escaliers `highway=steps` | 177 |
| escalators (`conveying=*`) | 102 |
| ascenseurs `highway=elevator` | 17 |
| portes `door=*` | 189 |
| entrées `entrance=*` | 381 |
| bouches de métro `railway=subway_entrance` | 23 |
| `layer` négatif (souterrain) | 94 |
| issues/équipement `emergency=*` | 91 (contenu non lu : ne pas supposer que ce sont des issues de secours) |
| objets « cinéma » `amenity=cinema` | 2 |
| nom contenant « UGC » | 1 |

Union indoor ou level : 1 782 objets (1 100 nœuds, 668 chemins, 14 relations). Les comptages sont des mesures à l'instant T (base OSM du 22 oct. 2026, 07 h 28 UTC). Je n'ai pas vérifié la qualité : un `level` présent ne prouve pas que les couloirs sont connectés entre eux, ni que les largeurs sont notées.

Pour comparaison, Accor Arena (boîte 48.8350-48.8420 N, 2.3740-2.3850 E) : `indoor` 44, `steps` 90, `entrance` 79, bâtiments 193, bouches de métro 8. Les comptages `level`, ascenseurs et chemins piétons ont échoué (limite de débit) : non mesurés.

Plans officiels (RATP, plan du Forum, mairie de Paris) : je n'ai trouvé aucun plan de niveau téléchargeable sous licence ouverte pour l'intérieur de la station ou du Forum `[?]` (recherche faite, rien de pertinent remonté). Les plans des stations RATP restent des documents de communication, non réutilisables sans accord `[?]`. Conséquence : OSM est la seule géométrie intérieure chargeable sous licence connue (ODbL, c'est-à-dire réutilisable en citant OSM et en partageant les données dérivées).

## 3. Données de transport

Source : portail ouvert IDFM (Île-de-France Mobilités), interface de requêtes sans compte.

- Jeu `acces` (« Référentiel des arrêts : Accès ») : 2 529 accès au total en Île-de-France ; 18 à moins de 400 m du Forum (liste en section 1), 10 à moins de 500 m de l'Accor Arena (rues Henri Desgrange, de Bercy, Paul Belmondo, Corbineau, bd de Bercy, pl. du Bataillon du Pacifique, pont de Bercy, av. de France). Chaque ligne donne un nom, des coordonnées, entrée/sortie, une date de mise à jour (plusieurs mises à jour le 19 oct. 2026). Pas de niveau ni de largeur.
- Jeu `relations-acces` (2 573 lignes) relie accès et zones d'arrêt ; non exploité.
- Validations par jour, 2e trimestre 2026 (1er avril au 30 juin) : Châtelet 13 634 835 validations sur 91 jours, soit environ 150 000 par jour ; Les Halles 4 063 052 sur 82 jours, soit environ 50 000 par jour ; Bercy 2 027 626 sur 91 jours (environ 22 000 par jour) ; Cour Saint-Émilion 1 503 550 (environ 16 500 par jour) ; Gare de Lyon 13 253 744 (environ 146 000 par jour). Une validation = un passage de portique ou un titre validé : ce n'est pas le nombre de personnes présentes, et le périmètre exact (RER inclus ou non) n'est pas vérifié `[?]`. Données ouvertes 3e et 4e trimestres : publiées après coup, pas encore d'octobre 2026.
- Perturbations : le jeu « Messages info trafic » de PRIM (la plateforme d'API d'IDFM) est une API en temps réel qui exige un compte (« Log in required »), pas un historique ([PRIM catalogue](https://prim.iledefrance-mobilites.fr/en/catalogue-data)). Je n'ai trouvé aucun jeu ouvert d'archive des fermetures de stations pendant des manifestations `[?]`. Compte PRIM : création de compte = action d'Adem, pas faite. Historique reconstituable par la presse (section 4). Pas chargeable à 9 h : introuvable en jeu de données.
- Jeu `etat-des-ascenseurs` : accès refusé (ForbiddenAccess) par l'interface ; pas de clé : non essayé autrement `[bloqué]`.

## 4. Fermetures de stations pendant les manifestations

Qui décide : la préfecture de police de Paris demande, la RATP exécute. Source : « les fermetures de stations n'étaient pas de la décision de la RATP mais de la préfecture de police » ([Sortir à Paris, 29 sept. 2026, relayé par recherche](https://www.sortiraparis.com/en/news/in-paris/articles/344090-may-day-demonstration-in-paris-11-metro-stations-closed-this-friday-from-noon) `[?]` page non relue en détail) ; « à la demande de la préfecture de police, la RATP a annoncé une série de fermetures » ([actu.fr, 17 oct. 2026](https://actu.fr/ile-de-france/paris_75056/manifestations-du-17-octobre-a-paris-parcours-metros-fermes-quartiers-interdits-tout-ce-qu-il-faut-savoir_64937431.html)).

Comment c'est annoncé : arrêtés d'interdiction de manifester (publiés sur le compte X de la préfecture), puis communiqué RATP et messages sur les comptes de ligne ([Le Monde, 16 oct.](https://lemonde.fr/societe/article/2026/10/16/mobilisation-du-17-octobre-la-prefecture-interdit-de-manifester-dans-plusieurs-secteurs-de-paris-autour-de-l-elysee-et-matignon-notamment_6795587_3224.html), [franceinfo, 21 oct.](https://franceinfo.fr/societe/mobilisation-du-17-octobre/les-rassemblements-et-les-manifestations-interdits-dans-plusieurs-secteurs-de-paris-jeudi-entre-8-heures-et-20-heures-annonce-la-prefecture-de-police_8247910.html)).

Exemples datés (pour calibrer un scénario « moitié des bouches fermées ») :
- 10 sept. 2025 : Châtelet-Les Halles fermée en début d'après-midi par la préfecture, perturbation sur métro 1, 4, 7, 11, 14 et RER A, B ([Le Bonbon](https://www.lebonbon.fr/paris/news/greve-10-septembre-chatelet-halles-fermee/), [Sortir à Paris](https://www.sortiraparis.com/en/news/in-paris/articles/332549-demonstration-strike-paris-station-chatelet-closed)).
- 1er mai 2026 : 11 stations, 4 lignes, dès midi, surtout à l'est ([Sortir à Paris](https://www.sortiraparis.com/en/news/in-paris/articles/344090-may-day-demonstration-in-paris-11-metro-stations-closed-this-friday-from-noon)).
- 17 oct. 2026 : 25 stations fermées, en deux vagues (dès 8 h : Étoile, Concorde, Opéra, Madeleine, etc. ; dès 12 h : Bastille, Barbès, Pigalle, Bourse, etc.) ; Châtelet-Les Halles figure parmi les secteurs interdits de manifestation mais pas dans la liste de fermetures citée ([actu.fr](https://actu.fr/ile-de-france/paris_75056/manifestations-du-17-octobre-a-paris-parcours-metros-fermes-quartiers-interdits-tout-ce-qu-il-faut-savoir_64937431.html), [Sortir à Paris](https://sortiraparis.com/en/news/in-paris/articles/353970-protests-in-paris-on-october-17-the-list-of-25-metro-stations-closed-this-saturday)).
- 20 oct. 2026, dès 22 h : accès fermés à Châtelet (métro 1, 4, 7, 11, 14), Les Halles (ligne 4), Châtelet-Les Halles (RER A et B, trains sans arrêt), République ; ligne 11 coupée entre Hôtel de Ville et Châtelet ([Le Parisien](https://leparisien.fr/info-paris-ile-de-france-oise/transports/violences-urbaines-a-paris-plusieurs-stations-de-metro-et-rer-une-nouvelle-fois-fermees-ce-mardi-soir-20-10-2026-3SNZXQVZDZHLBOY6CJOYODAWCM.php)).

Fréquence : plusieurs fois en 2026 (au moins 1er mai, 29 sept., 17, 19, 20 oct.) ; Châtelet est fermée en entier quand la préfecture le décide. Un scénario « moitié des bouches fermées » est donc plausible mais reste une hypothèse : aucune source publique ne donne la liste des bouches fermées une à une `[?]`.

## 5. L'incident aux Halles

Écart avec la consigne : les sources datent l'évacuation du lundi 19 oct. 2026, pas du dimanche 18. Je garde la date des sources ; à confirmer avec Adem s'il parle bien du même soir.

1. Cause : un couvre-feu préfectoral sur les secteurs République et Châtelet-Les Halles, après les violences en marge des manifestations du 17 oct. ; l'UGC a évacué sur consigne liée à la fermeture du centre commercial ([actu.fr](https://actu.fr/ile-de-france/paris_75056/vous-nous-avez-quand-meme-fait-payer-la-colere-des-spectateurs-apres-l-evacuation-de-l-ugc-de-chatelet_64948689.html), [HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html)).
2. Horaire : séances interrompues vers 20 h ; le centre commercial a prévenu le cinéma vers 19 h 30 à 19 h 45 pour 20 h (témoignage de spectateur cité par actu.fr). Le couvre-feu lui-même court de 23 h à 6 h (interdiction de manifester dès 20 h) ; l'annonce est tombée vers 19 h 20 ([HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html), [Le Parisien](https://www.leparisien.fr/paris-75/on-etait-tous-degoutes-le-cinema-ugc-des-halles-evacue-avant-le-couvre-feu-a-paris-des-projections-coupees-en-pleine-seance-20-10-2026-JOMZGKARC5GLJMLFROO4YPS5PU.php)).
3. Nombre de personnes : « plus de 3 000 » pour le seul cinéma, chiffre d'un spectateur sur X cité par actu.fr, non officiel.
4. Déroulé : films coupés en pleine séance, sortie « par où vous êtes rentrés », billets à conserver pour remboursement ; colère sur les réseaux (« vous nous avez quand même fait payer »). Aucun mouvement de foule ni blessé mentionné dans les extraits lus `[?]`.
5. Suite : le couvre-feu a été renouvelé le 20 oct. et des stations refermées à 22 h (section 4) ; question de droit sur la fermeture en cours de séance traitée par [Sortir à Paris](https://www.sortiraparis.com/en/news/in-paris/articles/355276-curfew-in-paris-can-cinemas-and-theatres-shut-down-in-the-middle-of-a-showing).

Limite : la presse parle d'une évacuation ordonnée et d'un agacement, pas de panique. Le récit d'Adem (une seule issue, mouvement de foule) n'est confirmé par aucune source publique `[?]`.

## 6. Verdict

| Lieu | Ligne | État | Détail |
|---|---|---|---|
| Forum / Châtelet | Géométrie extérieure | chargeable demain à 9 h | OSM : rues, entrées, bouches (23) ; 18 accès IDFM |
| Forum / Châtelet | Géométrie intérieure | chargeable demain à 9 h, **avec trous** | 725 objets `indoor`, 1 719 `level`, 177 escaliers, 102 escalators ; largeurs, jauges et issues de secours à saisir à la main |
| Forum / Châtelet | Transports | chargeable demain à 9 h | accès IDFM + validations T2 2026 (environ 150 000/jour Châtelet, 50 000 Les Halles) ; temps réel : compte PRIM requis |
| Forum / Châtelet | Fermetures de stations | à saisir à la main | pas d'archive ouverte ; 4 épisodes datés en presse (section 4) |
| Espace public Accor Arena | Géométrie extérieure | chargeable demain à 9 h | OSM : 193 bâtiments, 90 escaliers, 79 entrées, 8 bouches de métro ; 10 accès IDFM |
| Espace public Accor Arena | Géométrie intérieure | introuvable | 44 objets `indoor` dans la boîte ; plan de salle non public `[?]` |
| Espace public Accor Arena | Transports | chargeable demain à 9 h | Bercy (22 000/jour), Cour Saint-Émilion (16 500/jour) ; grande salle de concert : l'arrivée en foule est le sujet |
| Espace public Accor Arena | Fermetures de stations | à saisir à la main | mêmes sources de presse ; épisodes Bercy non recherchés `[?]` |

Lequel est le plus faisable en 7 h : sur les données seules, le Forum / Châtelet offre plus de matière (géométrie intérieure ouverte, cas réel documenté par la presse, fermetures de stations bien datées). L'Accor Arena est plus simple à modéliser (un quartier ouvert, pas de sous-sol imbriqué), mais l'intérieur n'existe pas en ouvert et aucun incident documenté ne l'ancre. Le Forum demande de décider un périmètre étroit (par exemple un trajet cinéma - niveau -4 - sorties) pour que 7 h suffisent, car le réseau intérieur est dense et n'a pas de contrôle qualité. Décision à l'équipe.

## Risques et suites

- Risque principal : confondre « présent dans OSM » et « utilisable pour une décision de sécurité ». Les largeurs, jauges et état réel des issues manquent ; à afficher comme hypothèses.
- Risque secondaire : l'incident de référence est un couvre-feu, non une panique ; le scénario doit partir de la fermeture de centre commercial et de stations, pas d'un événement non sourcé.
- Hors périmètre respecté : aucun point faible exploitable, aucun plan de sécurité confidentiel, aucune personne privée recherchée. Aucun LLM payant, aucun fichier du dépôt autre que ce rapport.
- Fichiers de travail (hors dépôt) : `/private/tmp/claude-501/-Users-adem--claude-spares-spare-hlugz3/538b6413-23c8-47e6-8e95-61722ac1129d/scratchpad/halles/`.
