# Évacuation de l'Accor Arena : quelles données du lieu charger demain à 9h

Décision débloquée : ce qu'on charge depuis des données publiques, ce qu'on saisit à la main.
Date de la recherche : 22 oct. 2026. `[?]` = non vérifié. Les requêtes marquées « testé » ont été lancées pendant cette recherche et ont répondu.

## En deux phrases
Les **bouches de métro, les arrêts de bus, les stations Vélib, la fréquentation des stations et les perturbations** sont publics, gratuits et chargeables en quelques lignes de code. Le **plan intérieur de la salle** (issues, escaliers, largeurs, gradins) n'est pas public : on le saisit à la main, avec des chiffres réglementaires et des hypothèses étiquetées comme telles.

Mots techniques, une fois chacun :
- **API** : une adresse web qui renvoie des données quand on l'interroge.
- **GTFS** : format standard de fichiers d'horaires de transports (arrêts, lignes, passages prévus).
- **GTFS-RT** : le même, en temps réel (retards, suppressions).
- **OSM (OpenStreetMap)** : carte collaborative libre ; **Overpass** est son moteur de requêtes.
- **ERP** : établissement recevant du public, catégorie réglementaire française.
- **Unité de passage (UP)** : largeur de référence pour un flux de personnes, 0,60 m.
- **Validation** : un passage de carte Navigo au portillon ; elle compte les entrées, pas les sorties.

## 1. Transports autour de l'Arena

### 1.1 Bouches de métro : chargeable, deux sources qui se recoupent
- Île-de-France Mobilités (IDFM) publie le jeu **« Référentiel des arrêts : Accès »** : 2 529 accès, avec nom, numéro, coordonnées, et deux indicateurs entrée / sortie. Licence Ouverte v2.0, mis à jour le 19 oct. 2026 (testé). Page : https://data.iledefrance-mobilites.fr/explore/dataset/acces/
- Requête testée (rayon 600 m autour de l'Arena) : **11 accès RATP**, sans aucune largeur ni débit. Exemple utile : « r. Henri Desgrange n° 4 » et « pont de Bercy n° 2 » sont **entrée seule** (pas de sortie par là) ; les 9 autres sont entrée et sortie. C'est une contrainte réaliste pour un scénario « station fermée ».
- OSM donne 34 bouches `railway=subway_entrance` dans 700 m (testé via Overpass), dont des ascenseurs et un tag `wheelchair` (oui / non). Les 6 accès de la station Bercy portent le numéro 1 à 6, dont « Place du Bataillon du Pacifique - Bercy Arena » (n° 1) et « bd de Bercy (elevator) ». Les doublons non nommés autour de Villiot / Ministère sont ceux de la station Bercy-Ministère, hors périmètre `[?]`.
- Les deux sources ne se superposent pas parfaitement : prendre IDFM comme vérité, OSM pour l'accessibilité fauteuil.
- Lignes par station : Bercy (6 et 14), Cour Saint-Émilion (14), Gare de Lyon (1, 14, RER A et D), Quai de la Rapée (5) `[?]` — connaissances générales, à confirmer dans le jeu « Arrêts et lignes associées » (même portail).
- Limite : l'accès n'a pas de **capacité** ni de **débit**. Les portillons, escaliers mécaniques et quais sont à estimer.

### 1.2 Fréquentation des stations : chargeable, sur les entrées seulement
- Jeu « Validations sur le réseau ferré : nombre par jour » (1 ligne par jour, station, type de titre). Testé, semaine du 1er au 7 juin 2026, total journalier :
  - **Bercy** : de 17 277 à 25 465 validations / jour.
  - **Gare de Lyon** : de 154 669 à 170 220 / jour.
- « Profils horaires par jour type » (part de validations par tranche d'une heure) : utile pour la forme de la journée. Le jeu testé contient des lignes en double pour une même tranche (plusieurs réseaux dans une même zone) : il faut filtrer avant d'utiliser `[?]`.
- Cour Saint-Émilion : présente sous le nom « COUR ST-EMILI. » (testé). Quai de la Rapée : introuvable sous ce nom dans le jeu des validations du 2e trimestre 2026 (testé) — nom différent ou absente `[?]`.
- Lecture clé pour le scénario : Bercy voit environ 20 000 entrées par jour ; l'Arena peut vider jusqu'à 20 300 personnes en une heure. **La station n'absorbe pas une sortie de salle complète** : une partie ira à pied vers Gare de Lyon, Cour Saint-Émilion ou en bus. (Comparaison faite par moi, ordres de grandeur.)

### 1.3 Horaires et temps réel
- Horaires prévus : jeu « GTFS Datahub » IDFM, rafraîchi chaque nuit (modifié le 22 oct. 2026, 06:00). C'est le fichier à charger pour la fréquence des rames et bus. Le détail du format de téléchargement n'a pas été ouvert `[?]`.
- Temps réel et **messages de perturbation** : plateforme **PRIM** (https://prim.iledefrance-mobilites.fr). Gratuite dans la limite de quotas, **compte et jeton d'API requis** ; la doc publique est déjà ancienne (2021-2023) et la page des API a répondu 403 à mon outil, donc le détail actuel est `[?]`. Source : documentation fonctionnelle https://prim.iledefrance-mobilites.fr/content/files/2023/03/Documentation-fonctionnelle-PRIM----Donn-es-disponibles-.pdf
- Le jeu « Périmètre des données temps réel disponibles » liste quels arrêts et lignes sont couverts (mis à jour le 22 oct. 2026). Accès du jeu lui-même : bloqué par mon outil (403) `[?]`.
- Piège connu : les identifiants de courses du fichier d'horaires et ceux du temps réel ne coïncident pas toujours (rapport IDFM 2021 cité dans la doc PRIM). Pour la démo, un incident « station fermée » se **simule** ; le flux réel sert d'habillage.
- Conséquence pour l'équipe : créer le jeton PRIM est la seule étape de compte du projet. Ne pas le coller dans le chat ; le mettre dans un `.env`.

### 1.4 Bus, vélos
- **Bus** : zones d'arrêt « Bercy - Arena (Boulevard de Bercy) » et « Bercy - Arena (Rue de Bercy) » dans le référentiel des arrêts (testé). Lignes 24 et 87 citées par Paris je t'aime https://parisjetaime.com/culture/accor-arena-p3602 `[?]`.
- **Vélib** : API ouverte de la Ville de Paris, temps réel, 1 519 stations. Dans 500 m de l'Arena : **6 stations, 257 places** (testé, en direct). Source : https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/
- Parkings : le site Yespark mentionne un parking à proximité ; non utilisé ici.

## 2. Le lieu

### Public et vérifié
| Fait | Valeur | Source |
|---|---|---|
| Capacité maximale | 20 300 (concert avec fosse debout) ; environ 15 000 pour du sport ; 7 000 en configuration réduite | Pages de billetterie, pas l'exploitant : https://www.fnacspectacles.com/place-spectacle/paris-12-accor-arena-salpopb-lt.htm ; https://www.offi.fr/concerts/palais-omnisports-de-paris-bercy-2913.html |
| Écart | Paris je t'aime dit « jusqu'à 20 000 places assises » ; Michelin 20 000 | https://parisjetaime.com/culture/accor-arena-p3602 |
| Rénovation | Rouverte en oct. 2015 après 18 mois de travaux ; DVVD, avec Populous en conseil | https://populous.com/?p=35783 |
| Exploitant | Société d'exploitation du Palais omnisports de Paris-Bercy, délégation de service public de la Ville de Paris | Idem (Populous / Michelin) |
| Événements par an | 130 à 140 ; fréquentation annuelle annoncée 1,5 million (billetterie, non audité) | https://www.fnacspectacles.com/city/paris-369/venue/accor-arena-77914/ |

- Aucune source ouverte trouvée donnant le nombre d'issues, les largeurs de portes, les escaliers ou les plans intérieurs. Ne pas inventer un chiffre précis : voir la section 6.
- Plans et permis : un permis de construire existe forcément (travaux de 2015) mais je n'ai trouvé aucun plan en ligne `[?]`. Piste à 9h : Pop.culture.gouv, archives de Paris, presse d'architecture (Populous / DVVD) pour des **images de principe**, pas pour des cotes.
- **Emprise du bâtiment dans OSM** : les requêtes Overpass ont échoué (502) en fin de recherche, je n'ai pas pu confirmer le contour et la hauteur du bâtiment `[?]`. À retenter sur https://overpass-turbo.eu ou via un extrait Geofabrik. OSM ne contient en général que le contour extérieur.
- Étanchéité : le **plan de sécurité interne** (plan d'évacuation détaillé, effectifs de personnel, registre de sécurité) est un document confidentiel de l'exploitant et de la préfecture. Je ne l'ai pas cherché et on ne le cherchera pas. Le produit se montre comme **modèle générique calé sur des règles publiques**, pas comme réplique du plan réel.

## 3. Règles d'évacuation utilisables dans la simulation

### Droit français (ERP)
Texte de référence : règlement de sécurité contre l'incendie et la panique dans les ERP (arrêté du 25 juin 1980 modifié), à lire sur Légifrance. Les chiffres ci-dessous viennent de la fiche n° 11 du ministère de la Culture et d'un recoupement FFB.
- **Unité de passage (UP)** : 0,60 m. Source : fiche ministère de la Culture https://www.culture.gouv.fr/fr/Media/Thematiques/Securite-Surete/Fichiers/securite-incendie/fiche-n-11-effectifs-et-issus-de-secours-2022 (page cachée par un 503 pendant ma vérification directe ; contenu vu via la recherche) `[?]`
- Un dégagement d'1 ou 2 UP est élargi à **0,90 m** ou **1,40 m** respectivement.
- Largeur calculée à raison d'**1 UP par tranche de 100 personnes** ; sous 501 personnes, une UP de plus.
- Au-delà de 200 personnes, pas de dégagement normal de moins de 2 UP.
- Type L = salles d'audition, de réunion et de spectacle. 1re catégorie = au moins 1 500 personnes (donc l'Arena). Source : classement cité par Eduscol / Legrand https://www.legrand.fr/pro/normes-et-reglementations/eclairage-de-securite/eclairage-de-securite-les-erp-de-type-l
- Les articles CO 36, CO 38, CO 39 (nombre minimal d'issues, répartition) et les dispositions L propres au nombre de sorties : **texte exact non retrouvé** `[?]`. Pour la démo, une règle simple : au moins 2 sorties, beaucoup plus pour 20 000, et la largeur totale = effectif / 100 × 0,60 m (soit 120 m pour 20 000, ordre de grandeur à confirmer, c'est un calcul à moi).
- Le code du travail (R4216-8) a la même logique mais ne vaut que pour les locaux de travail.
- Aucun **temps d'évacuation réglementaire** chiffré trouvé dans les sources ouvertes lues `[?]`. Le chiffre britannique ci-dessous est la meilleure référence disponible.

### Foules (guides et science)
- **Green Guide (SGSA, Royaume-Uni, stades)** : débit maximal **82 personnes par mètre de largeur et par minute** sur sol plat, **66** sur marches. Source : https://sgsa.org.uk/physical-factors/circulation/egress/ (testé, lu directement). Le dimensionnement traditionnel suppose une sortie en 8 minutes, chiffre absent de cette page mais cité dans les notes du Parlement nord-irlandais https://www.niassembly.gov.uk/globalassets/documents/cal/inquiry/casement-park/research-papers/an-outline-of-stadium-safety-legislation-and-guidance-9.6.15.pdf `[?]`. Pour l'évacuation d'urgence, le guide dit que la contrainte de temps peut être mise de côté.
- **Fruin** (niveaux de service piétons, 1971) : relation flux = vitesse × densité. À partir d'environ 3 personnes par m², le débit baisse (congestion). Les valeurs fines (4 pers./m², 1,3 pers./m/s) ne sont **pas** confirmées par mes sources `[?]`. Sources : https://gkstill.com/Support/crowd-flow/DensityFlow.html ; SFPE Handbook à consulter.
- Conversion utile : 82 pers./m/min = **1,37 pers./m/s**. Une UP de 0,60 m = environ 49 pers./min en sol plat (calcul).
- Moteurs libres : JuPedSim, Pathfinder (licence), MomenTum : non évalués ici.

## 4. Flux réels pour caler un scénario
- Fréquentation de Bercy : voir 1.2 (17 000 à 25 000 entrées par jour).
- Profil horaire de la station : jeu IDFM « profils horaires par jour type » (part des validations par tranche d'une heure, pour jour ouvré, samedi, dimanche), à dédoublonner.
- **Événements de l'Arena** : l'agenda est public (site de la salle et billetterie) mais je n'ai trouvé **aucune série horaire de sortie de salle**. À saisir : pic de départ dans les 30 min après la fin du spectacle.
- Pas de comptage public de l'affluence à pied ; les estimations pour la démo (répartition métro / bus / vélo / à pied) sont **à poser comme hypothèses** et à le dire à l'écran.
- Chiffre sans lien avec la démo mais utile à citer : 423 000 billets entre janvier et juin 2018 (Pollstar, via https://www.chartsinfrance.net/actualite/news-107858.html).

## 5. Garde-fou
Le produit sert à **améliorer l'évacuation**. Rien cherché ni documenté sur des scénarios d'attaque ou des points faibles exploitables. Une donnée a été volontairement laissée de côté : le **plan interne de sécurité et les positions précises des issues de service**, qui serviraient surtout à nuire et sont confidentiels. Les scénarios de démo restent : issue bloquée, station fermée, mouvement de foule, incendie, évacuation d'urgence, avec des chiffres génériques.

## 6. Verdict en deux colonnes

| Chargeable demain à 9h (public, testé) | À saisir à la main (ou à estimer) |
|---|---|
| 11 accès de métro dans 600 m, avec entrée / sortie (IDFM Accès) | Nombre, largeur et emplacement exact des issues de la salle |
| 34 bouches OSM avec ascenseurs et accessibilité fauteuil | Escaliers, couloirs, gradins, fosse : géométrie intérieure |
| Arrêts de bus « Bercy - Arena » (référentiel IDFM) | Largeur réelle des portillons et escaliers des stations |
| 6 stations Vélib (257 places) en temps réel | Capacité d'un quai ou d'une rame au moment du pic |
| Validations par jour, Bercy et Gare de Lyon (IDFM) | Part de public par mode de départ (métro / bus / pied) |
| Horaires prévus (GTFS Datahub) | Heure et rythme réels de sortie après un concert |
| Perturbations et temps réel (PRIM, après création d'un compte et d'un jeton) | Le scénario d'incident lui-même (script de démo) |
| Capacité maximale 20 300 et types de configuration (billetterie, `[?]` exploitant) | Contour 3D et hauteur : à retenter dans OSM, sinon extrusion du contour `[?]` |
| UP 0,60 m, 0,90 / 1,40 m, 1 UP pour 100 personnes (ministère de la Culture) | Texte exact CO 36 / 38 / 39 et règles L (Légifrance) |
| Débits 82 / 66 pers./m/min (Green Guide) | Densité critique et vitesse (SFPE / Fruin) |

**Principal risque** : demain, le « 3D du lieu » se limite à un contour et à des bouches de métro réelles ; l'intérieur est un modèle générique. Il faut l'annoncer d'emblée au jury, avec les valeurs réglementaires affichées, plutôt que de laisser croire à une réplique du bâtiment.

**À faire avant 9h (ordre d'effort croissant)** : créer le compte et le jeton PRIM (dans un `.env`), tester une fois la requête Overpass du bâtiment, décider de la source unique pour les bouches (IDFM recommandé).
