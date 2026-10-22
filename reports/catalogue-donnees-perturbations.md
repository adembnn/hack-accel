# Catalogue des flux de perturbations pour le jumeau Forum des Halles / Châtelet

Décision débloquée : quelles perturbations l'outil détecte en direct ou rejoue, avec quelle source, quel délai, quel format.
Mesures du 22 oct. 2026 depuis cette machine. « testé » = j'ai appelé l'URL et elle a répondu. `[?]` = non vérifié. `[clé]` = compte requis (variable `.env` indiquée, jamais demandée dans le chat).
Mots expliqués : **API** = adresse web qui renvoie des données ; **JSON** = format texte de données structurées ; **GTFS-RT / SIRI** = formats standard de transport en temps réel ; **PRIM** = la plateforme d'API d'Île-de-France Mobilités (IDFM) ; **ODS** = « OpenDataSoft », le moteur des portails ouverts de la Ville et d'IDFM (même syntaxe de requête partout) ; **ODbL** = licence qui autorise la réutilisation en citant la source.

## Version simple

- Le flux qui compte le plus existe déjà et se rejoue : le site communautaire **ratpstatus.fr** enregistre toutes les 2 minutes les messages de trafic IDFM depuis avril 2024, et publie les archives. J'y ai retrouvé, mot pour mot, les messages « Mesures de sécurité demandées par la Préfecture de Police – Station fermée » de Châtelet, Les Halles et République, le 19 oct. (soir) et le 20 oct. (22 h). On peut donc rejouer la vraie soirée, sans compte.
- Le temps réel officiel (PRIM) exige un compte : une seule étape humaine, à faire par Adem.
- La Ville de Paris donne sans clé : chantiers, fermetures de voirie (dont le tunnel souterrain des Halles), événements, Vélib en direct. Météo et air : sans clé aussi.
- Ce qui n'existe pas en ouvert : la liste des bouches fermées une à une, l'état des issues du cinéma, les manifestants en direct, les pannes mobiles. Ce sera saisi par le juré (section 7).

## 1. Transports

| Perturbation | Source (accès) | Fréquence, format | Statut | Exemple |
|---|---|---|---|---|
| Station fermée, ligne coupée, RER non desservi (messages de trafic) | PRIM « Messages Info Trafic – Requête globale » `https://prim.iledefrance-mobilites.fr/marketplace/disruptions_bulk/disruptions/v2` [clé `PRIM_API_KEY`] | quasi continu, JSON ; champs `title`, `message`, `severity` (BLOQUANTE / PERTURBEE / INFORMATION), `cause`, `applicationPeriods` ([doc PRIM](https://prim.iledefrance-mobilites.fr/fr/apis/idfm-disruptions_bulk)) | testé : 401 « No API key found » sans clé, donc l'URL existe | voir ligne suivante (même contenu, archivé) |
| Idem, **historique rejouable** | ratpstatus.fr, code sur [GitHub wincelau/ratpstatus](https://github.com/wincelau/ratpstatus), licence ODbL pour les données, AGPL pour le code (libre) | photo toutes les 2 min depuis le 23 avr. 2024 ; un fichier JSON par photo ; exports `https://ratpstatus.fr/export/historique_incidents.csv` (76 Mo) et `historique_statuts.csv` (24 Mo) | testé : photos du 19 et 20 oct. lues, en-têtes CSV lus (non téléchargés en entier) | `Les Halles : Mesures de sécurité demandées par la Préfecture de Police - Station fermée (sans correspondances)`, gravité BLOQUANTE |
| Messages affichés sur les écrans des stations | PRIM `idfm-ivtr-info_trafic` (`/general-message`), format SIRI Lite [clé] | quasi continu, JSON | `[?]` non appelé | texte voyageur |
| Prochains passages, retards, suppressions | PRIM `estimated-timetable` et `stop-monitoring` [clé] | temps réel, SIRI Lite | `[?]` non appelé ; un tiers rapporte que les flux GTFS-RT « Alerts » et SIRI-SX répondent 403 sur une clé standard ([source](https://github.com/princefr/transit/blob/main/docs/IDFM_VEHICLE_MONITORING.md)) | |
| Accès (bouches) existants, avec entrée / sortie | IDFM ODS `acces` (libre) | mise à jour ponctuelle, JSON ODS | testé : 2 529 accès, `accisentry` / `accisexit` | `av. de Friedland`, entrée+sortie |
| Horaires théoriques | GTFS Datahub IDFM (libre) | 3 fois par jour (8 h, 13 h, 17 h), fichiers zip `[?]` format du lien | non téléchargé | |
| Ascenseurs des stations IDFM (en panne ?) | IDFM ODS `etat-des-ascenseurs`, modifié le 22 oct. | JSON | testé : 403 sur `/records`, `[]` (vide) sur `/exports/json` : inutilisable en l'état | `[?]` clé ou jeu vide |
| RATP / SNCF directes | `api.sncf.com` (Navitia) [clé `SNCF_API_TOKEN`] ; `data.ratp.fr` : jeu « trafic » introuvable | | testé : 401 « no token » ; 404 pour le jeu RATP | |

Comment brancher : un adaptateur « messages de trafic » lit PRIM (direct) ou une photo ratpstatus (rejeu), repère les titres contenant « Station fermée », « Trafic interrompu », « non desservi », puis ferme dans le graphe piéton les bouches de la station (via `acces`, rayon 150 m autour des coordonnées de la station). Rejeu = lire la photo dont l'horodatage est le plus proche de l'heure simulée.
Précision d'archive : une photo ne donne pas la durée réelle d'une fermeture ; les champs `begin`/`end` des messages « Mesures de sécurité » durent parfois 1 minute, ce qui ressemble à un artefact de publication (annonce puis mise à jour) et non à la durée de fermeture `[?]`. Utiliser le CSV d'incidents pour les durées.

Faits tirés des photos (testé) :
- 19 oct., photo de 21 h : Les Halles, Châtelet, République « fermée (sans correspondances) », début affiché autour de 20 h 07 puis 20 h 31 ; ligne 11 « trafic interrompu » dès 20 h 50. Cela colle à l'évacuation de l'UGC vers 20 h (presse, rapport précédent).
- 20 oct., photo de 23 h : Châtelet, Les Halles, Châtelet / Les Halles (RER), République fermées de 22 h à 4 h 30 ; ligne 11 interrompue ; lignes 3 et 5 « arrêt non desservi » ; RER B et D « Châtelet-Les Halles non desservie ».
- Les messages ne disent jamais quelle bouche est fermée : c'est une station entière.

## 2. Ordre public et événements

| Perturbation | Source | Accès, délai, format | Statut |
|---|---|---|---|
| Couvre-feu, interdiction de manifester, périmètres | Préfecture de police : arrêtés sur le site et sur X `@prefpolice` (ex. n° 2026-01403 et 01404 du 21 oct.) | libre mais site protégé par un script (aucune lecture automatique simple) ; arrêtés en PDF, périmètres annexés en carte ; recueil des actes administratifs en PDF mensuel | testé : le site renvoie une page de redirection JavaScript, donc lecture par navigateur seulement |
| Délai de publication | Le tribunal administratif a ordonné le 21 oct. de publier les arrêtés de couvre-feu au moins 12 h avant leur entrée en vigueur ([Le Parisien](https://leparisien.fr/paris-75/couvre-feux-a-paris-la-justice-demande-au-prefet-de-publier-ses-arretes-au-moins-12-heures-avant-lentree-en-vigueur-22-10-2026-5X24ZZN5BNDU3NB5DSCCSKWNCA.php)) | à partir de maintenant, un arrêté est lisible 12 h avant : utile pour une alerte anticipée | à suivre |
| Manifestations déclarées | Déclaration en préfecture, 1 mois avant à Paris ([service-public](https://service-public.gouv.fr/particuliers/vosdroits/F21899)) ; pas de jeu ouvert ; presse et collectifs (paris-luttes.info) | aucune API | `[?]` pas de flux machine trouvé |
| Niveau Vigipirate | Ministère de l'Intérieur : « vigilance renforcée » depuis le 22 juin 2026, trois stades (vigilance / vigilance renforcée / alerte attentat) ([interieur.gouv.fr](https://www.interieur.gouv.fr/actualites/actualites-du-ministere/mise-en-oeuvre-du-plan-vigipirate-2026)) | page web, change rarement ; saisir une valeur | un site de voyage affiche encore l'ancien « urgence attentat » : ne pas s'y fier |
| Agenda de la ville | Paris ODS `que-faire-a-paris-` (libre) | mis à jour chaque jour, JSON ; champs `title`, `date_start`, `date_end`, `lat_lon` | testé : 596 événements dans 1 km autour du Forum (ex. Sunset Sunside, 28 oct., 20 h 30) |
| Séances de cinéma UGC | aucune API publique trouvée ; pages UGC et agrégateurs (offi.fr, cinefil.com) | HTML, 159 séances / semaine selon cinefil | testé : l'URL Ajax UGC devinée répond 404 ; à saisir (jauge : 27 salles, plus de 3 800 sièges) |

Comment brancher : un « événement d'ordre public » = un polygone + une plage horaire + un effet (rassemblement interdit, couvre-feu). Dans la démo, le polygone des arrêtés réels du 19 oct. (secteur Halles : rue Berger, bd Sébastopol, rue Rambuteau, allée André Breton, d'après [Le Parisien](https://leparisien.fr/paris-75/couvre-feu-a-paris-secteurs-heures-personnes-ce-que-lon-sait-du-dispositif-deploye-face-aux-violences-urbaines-19-10-2026-LVGEYQYDN5DRNCBNCJEWKGDDUM.php)) est dessiné une fois à la main.

## 3. Ville de Paris (portail `opendata.paris.fr`, sans clé, ODS v2.1)

Base : `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/<jeu>/records`. Filtre géographique : `where=within_distance(champ, geom'POINT(2.347 48.8606)', 800m)`. Limite observée par un tiers : 10 000 requêtes par jour par IP `[?]`.

| Perturbation | Jeu | Fréquence, format | Statut (appels du 22 oct.) |
|---|---|---|---|
| Fermeture de voirie programmée | `fermetures-voirie` | quotidien, JSON + tracé GeoJSON | testé : 4 résultats dans 1 km, tous « FORUM (VOIRIE SOUTERRAINES DES HALLES) », dont « Du lundi 19/10/2026 23:00 au mardi 20/10/2026 06:00 » (terminé) et « jeudi 12/11 23:00 au 13/11 06:00 » (planifié). Ce sont des fermetures de nuit du tunnel routier, programmées avant les événements : à ne pas confondre avec le couvre-feu. |
| Chantiers perturbants | `chantiers-perturbants` (107 au total) | quotidien ; champs `niveau_perturbation`, `impact_circulation_detail` | testé : 10 dans 800 m (ex. RATP, entretien station Saint-Michel jusqu'au 26 févr. 2027) |
| Ascenseurs / escalators de la voirie | `ascenseurs-escalators-tele-surveillance-temps-reel` | temps réel (horodatage du matin), champ `statut` | testé : 33 équipements, aucun dans 1,5 km du Forum : inutile pour la démo |
| Vélib | `velib-disponibilite-en-temps-reel` ; flux standard GBFS `.../Velib_Metropole/station_status.json` | environ 1 min, JSON | testé : 20 stations dans 500 m du Forum (ex. Pont Neuf - Rivoli) ; GBFS 1 519 stations |
| Passage de vélos (proxy de fréquentation) | `comptage-velo-donnees-compteurs` | horaire, J-1 environ | testé : totem Sébastopol, 244 / 409 passages à l'heure de 21 h UTC le 21 oct. |
| Trafic routier | `comptages-routiers-permanents` | J-1, 13 mois glissants | trouvé, non appelé |
| Éclairage public, passages piétons, accès métro (plan de voirie) | `eclairage-public`, `plan-de-voirie-*` | statiques (mise à jour oct. 2026) | pas de panne publiée : l'éclairage est un inventaire, pas un état `[?]` |
| Comptage piéton | aucun jeu piéton trouvé | | non trouvé |

Brancher : fermeture de voirie / chantier = arête du graphe de rues coupée ou ralentie (champ `geo_shape` fournit le tracé). Vélib = signal de « les gens repartent à vélo » (stations vides ou pleines autour du Forum).

## 4. Environnement

| Flux | URL | Accès, fréquence | Statut |
|---|---|---|---|
| Météo actuelle et prévision | Open-Meteo `https://api.open-meteo.com/v1/forecast?latitude=48.8606&longitude=2.3470&current=temperature_2m,precipitation,wind_speed_10m,weather_code` | libre, pas de clé, 15 min, JSON | testé : `temperature_2m 11,7 °C, precipitation 0,0, vent 17,1 km/h` à 11 h 15 |
| Qualité de l'air | Open-Meteo `https://air-quality-api.open-meteo.com/v1/air-quality?...&current=pm2_5,european_aqi` | libre, horaire | testé : indice européen 23 |
| Vigilance Météo-France | `https://public-api.meteofrance.fr/public/DPVigilance/v1/cartevigilance/encours` | clé gratuite (portail-api.meteofrance.fr) [`METEOFRANCE_API_KEY`], carte à 6 h et 16 h minimum, 5 jours de profondeur, pas d'archive ([doc](https://confluence-meteofrance.atlassian.net/wiki/spaces/OpenDataMeteoFrance/pages/854065180/API+Bulletin+Vigilance+EN)) | testé : 401 sans clé |
| Pluie intense, crue | APIC / Vigicrues Flash (abonnement) | | `[?]` non vérifié, hors besoin immédiat |

Pluie, canicule ou orage changent le comportement de la foule (qui se réfugie dans le Forum au lieu de dehors) : un seul paramètre « météo » dans la simulation.

## 5. Réseaux mobiles

- Pannes en direct : aucun flux officiel. Downdetector et zoneadsl.com comptent des signalements d'utilisateurs, sans API ouverte `[?]`. Cas réel récent : panne nationale d'Orange le 21 oct. 2026, pic de près de 12 000 signalements à 11 h 50, rétablie vers 21 h 40, appels d'urgence non touchés ([Le Monde](https://lemonde.fr/pixels/article/2026/10/21/orange-annonce-le-retablissement-de-son-reseau-mobile_6798249_4408997.html)).
- Couverture en souterrain : l'ARCEP publie des cartes de couverture en open data sur data.gouv.fr, mises à jour chaque trimestre, mais elles décrivent l'extérieur (simulations des opérateurs), pas le sous-sol du Forum `[?]`.
- Conséquence : « réseau mobile en panne » est un interrupteur saisi à la main (effet : la foule ne peut plus se retrouver ni lire les alertes).

## 6. Ce qui n'existe pas en ouvert

- Quelle bouche de métro précise est fermée, et l'état des issues du cinéma.
- Position et taille des manifestations en direct.
- Jauge réelle du Forum à l'instant T, et séances en cours à l'UGC.
- Exploitation de lecture : `etat-des-ascenseurs` d'IDFM renvoie vide ou interdit.

## 7. Verdict : 8 flux à brancher en priorité

1. **Messages de trafic PRIM** (direct) + **archive ratpstatus** (rejeu du 19 et 20 oct.) : le cœur du scénario. Compte PRIM = action d'Adem.
2. **Référentiel `acces` IDFM** : bouches existantes, entrée / sortie (déjà utilisé).
3. **Fermetures de voirie Paris** : tunnel des Halles (testé).
4. **Chantiers perturbants Paris** (testé).
5. **Agenda « Que faire à Paris »** : foule attendue autour (testé).
6. **Vélib temps réel** : proxy de report modal (testé).
7. **Météo Open-Meteo** (testé, sans clé).
8. **Arrêtés de la préfecture**, saisis une fois sous forme de polygones (pas de flux machine).

Saisi à la main par le juré ou l'opérateur : bouches fermées (parmi les 18 accès IDFM), issues du cinéma bloquées, couvre-feu / manifestation (polygone + horaires), niveau Vigipirate, panne du réseau mobile, jauge de salle, ascenseur hors service, foule initiale.

Variables `.env` à prévoir (noms seulement) : `PRIM_API_KEY`, `METEOFRANCE_API_KEY`, `SNCF_API_TOKEN` (facultatif). Les autres flux testés ne demandent rien.

## 8. Risques

- Piège de date : le rapport précédent cite le 19 oct. pour l'évacuation ; les photos ratpstatus le confirment (fermetures annoncées le soir du 19).
- Le CSV ratpstatus pèse 76 Mo : à télécharger une fois avec accord d'Adem (règle : téléchargement soumis à autorisation), sinon lire les photos JSON une à une (126 Ko chacune).
- Dépendance à un site communautaire (ratpstatus.fr) : prévoir de copier les photos utiles du scénario dans le dépôt du lot, licence ODbL respectée (citer la source).
- Garde-fou : tout est lecture de données publiques ; aucun point faible de sécurité n'est documenté.
