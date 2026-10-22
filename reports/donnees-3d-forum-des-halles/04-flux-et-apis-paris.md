# Flux et APIs ouverts autour du Forum des Halles / Châtelet-Les Halles

Recherche du 22/10/2026 pour l'équipe Accel AI Innovate Paris. Les appels marqués "testé" ont été exécutés le jour même sans clé et ont répondu. Tout ce qui n'a pas d'URL source est marqué "à vérifier".

## Ce qu'il faut retenir

- Il n'existe pas de flux ouvert des portiques ou des sorties de salle. Le plus proche : les validations (par jour et par heure, mais publiées avec retard) et les prochains passages en temps réel (PRIM).
- Ce qui est vraiment en direct et sans clé : Vélib GBFS, Open-Meteo, Open Data Paris (Opendatasoft). Tout le reste se charge en fichier, ou demande une clé gratuite.
- Pour la simulation : on calibre les arrivées aux quais avec les profils horaires de validations (fichier), et on rend la démo vivante avec les prochains passages et Vélib (flux). La fin de séance reste un paramètre du modèle.

## Tableau récapitulatif

| Source | Auth / clé | Quota | Format | Fraîcheur | Licence | Kafka |
|---|---|---|---|---|---|---|
| PRIM prochains passages (SIRI Lite) | compte PRIM, clé gratuite | 1 000 req/jour pour les clés récentes (5 req/s) | JSON SIRI Lite | temps réel | à vérifier (open data IDFM) | Direct (poll espacé) |
| PRIM messages info trafic | compte PRIM, clé gratuite | 1 000 req/jour | JSON | temps réel | à vérifier | Direct |
| IDFM validations réseau ferré, jour | aucune | à vérifier (Opendatasoft) | JSON / CSV | trimestriel | à vérifier | Fichier |
| IDFM profils horaires par jour type | aucune | idem | JSON / CSV | trimestriel | à vérifier | Fichier (rejouable) |
| GTFS IDFM (offre théorique) | aucune | n/a | zip GTFS | mis à jour régulièrement | à vérifier | Fichier |
| Navitia IDFM (PRIM) | compte PRIM, clé gratuite | 1 000 req/jour | JSON | temps réel | à vérifier | Pas utile |
| API SNCF (Navitia) | token à demander | à vérifier | JSON | Transilien en horaires prévus seulement | à vérifier | Non conseillé |
| Vélib GBFS | aucune | non documenté | JSON GBFS | 1 min | Licence Ouverte (Etalab) | Direct |
| Open Data Paris (Explore v2.1) | aucune | à vérifier | JSON / CSV / GeoJSON | selon le jeu | ODbL / Licence Ouverte, selon le jeu | Mixte |
| Comptages vélo / multimodal | aucune | idem | JSON / CSV | J-1 | à vérifier | Fichier, rejoué |
| Que faire à Paris | aucune | idem | JSON | quotidienne (à vérifier) | ODbL 1.0 | Fichier |
| Open-Meteo | aucune | 10 000 appels/jour | JSON | 15 min | CC BY 4.0, usage non commercial | Direct |
| Météo-France (portail API) | compte | à vérifier | GRIB / JSON | temps réel | Licence Ouverte 2.0 | Inutile pour la démo |
| Bison Futé | aucune / à vérifier | n/a | DATEX II | temps réel | licence de réutilisation Bison Futé | Hors sujet pour Paris centre |
| CNC fréquentation | aucune | n/a | tableaux / CSV | mensuelle | à vérifier | Fichier |

## Détail par source

### 1. PRIM d'Île-de-France Mobilités (temps réel)

- URL : https://prim.iledefrance-mobilites.fr/ (offre : https://prim.iledefrance-mobilites.fr/fr/notre-offre).
- Accès : il faut un compte PRIM pour interroger les APIs temps réel (https://transport.data.gouv.fr/datasets/reseau-urbain-et-interurbain-dile-de-france-mobilites). Le header d'authentification est `apikey` (https://github.com/princefr/transit/blob/main/docs/IDFM_VEHICLE_MONITORING.md, source secondaire).
- Quotas : "0 à 1 000 requêtes quotidiennes", gratuit, pour les prochains passages (globale, ligne, unitaire) et les messages info trafic (https://prim.iledefrance-mobilites.fr/fr/notre-offre). Pour la requête unitaire : 5 req/s et 1 000 req/jour pour les clés créées entre le 13 mars et septembre 2024 (https://prim.iledefrance-mobilites.fr/fr/apis/idfm-ivtr-requete_unitaire). Les quotas se réévaluent sur la page "Ma consommation API" après connexion.
- Format : SIRI Lite, endpoint `GET /stop-monitoring/{MonitoringRef}` (même page). Le temps réel ne couvre qu'une partie du réseau.
- Apport pour la simulation : l'attente réelle au quai de la ligne A, B, D ou 4 à 22h, utilisable comme "capacité de débit" des accès transport (fréquence des trains = vitesse d'évacuation).
- Piège : 1 000 req/jour = 1 requête toutes les 90 s au mieux pour un seul arrêt. Demandez les quotas supérieurs dès ce matin ou interrogez un seul arrêt.
- Identifiants d'arrêt (MonitoringRef) de Châtelet-Les Halles : à vérifier dans le référentiel arrêts (https://data.iledefrance-mobilites.fr/explore/dataset/arrets-lignes/). La zone de validation "CHATELET" porte `id_zdc` 71264 (testé, voir recette 2).

### 2. Validations IDFM (fichier, pour calibrer)

- Validations par jour et par arrêt, 3e trimestre 2025 : https://data.iledefrance-mobilites.fr/explore/dataset/validations-reseau-ferre-nombre-validations-par-jour-3eme-trimestre/. Colonnes : jour, code_stif_arret, id_zdc, libelle_arret, categorie_titre, nb_vald (même page). Jour d'exploitation de 04:00 à 03:59.
- Profils horaires par jour type (jeu par trimestre, dont le 1er trimestre 2026) : https://data.iledefrance-mobilites.fr/explore/dataset/validations-reseau-ferre-profils-horaires-par-jour-type-1er-trimestre. Ils donnent la forme de la courbe horaire, donc la pointe de 22h-23h pour un soir de semaine ou de week-end.
- Historique 2015-2025, mis à jour fin février et fin août : https://prim.iledefrance-mobilites.fr/en/catalogue-data.
- Limites : ce sont des entrées (validations), pas des sorties, et il n'y a aucun filtre cinéma. Ordre de grandeur réseau : environ 10 millions de validations un jour plein (https://iledefrance-mobilites.fr/en/le-sidv-et-les-specificites-des-donnees-de-validation). Données par accès/entrée de station : à vérifier (non trouvé).
- Licence : non précisée sur la page lue, donc à vérifier.

### 3. GTFS et offre théorique IDFM

- Fiche : https://transport.data.gouv.fr/datasets/reseau-urbain-et-interurbain-dile-de-france-mobilites (GTFS, NeTEx, SIRI Lite). Fichier zip à charger une fois : lignes, arrêts, horaires prévus de Châtelet-Les Halles. Sert à générer les départs de trains théoriques pour le modèle quand le temps réel manque.
- GTFS-RT dédié IDFM : à vérifier (non confirmé dans mes sources).

### 4. SNCF / Navitia

- Doc : https://github.com/SNCFdevelopers/API-trains-sncf/blob/master/source/integration.rst, API `api.sncf.com/v1`. Transilien n'y apparaît qu'en horaires prévus (https://fibric.io/integrations/c/sg-api-sncf, source secondaire). Quota et délai d'obtention du token : à vérifier. Peu utile ici, l'API PRIM est préférable. Navitia IDFM : https://prim.iledefrance-mobilites.fr/en/apis/idfm-navitia-general-v2 (1 000 req/jour). L'itinéraire en transports depuis le Forum vers les quartiers donne les destinations de sortie.

### 5. Vélib GBFS

- URL : https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json, actualisé chaque minute, Licence Ouverte (https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole). Testé le 22/10, réponse JSON avec vélos mécaniques et électriques par station.
- Variante Opendatasoft : jeu `velib-disponibilite-en-temps-reel` sur https://opendata.paris.fr. Filtre géographique non validé : le test avec `within_distance` n'a rien renvoyé, à vérifier.
- Apport : des agents qui sortent à vélo, et la saturation des stations proches comme signal de pression de mobilité à 22h.

### 6. Open Data Paris (Opendatasoft)

- Base : https://opendata.paris.fr/api/explore/v2.1/ (https://c0mm0.com/entry/paris-data-ville-de-paris). Sans clé, testé. Quota : à vérifier.
- Comptage vélo, compteurs horaires, 13 mois glissants, mis à jour J-1 : https://opendata.paris.fr/explore/dataset/comptage-velo-donnees-compteurs/.
- Comptage multimodal (vélo, trottinette, 2RM, VL, PL, bus) : https://opendata.paris.fr/explore/dataset/comptage-multimodal-comptages/api/.
- Comptages routiers permanents, J-1 sur 13 mois : https://opendata.paris.fr/explore/dataset/comptages-routiers-permanents.
- Un jeu "Comptages routiers et piétons 2025" existe (champs pedestrian_count, bike_count, car_count : https://c0mm0.com/entry/comptages-routiers-et-pietons-2025) mais son identifiant exact sur opendata.paris.fr n'a pas été trouvé : le nom que j'ai testé renvoie "n'existe pas". À vérifier. C'est le meilleur candidat pour une vraie courbe de piétons.
- Que faire à Paris : jeu `que-faire-a-paris-`, 3 400 enregistrements (testé), licence ODbL 1.0 avec attribution (https://plaqat.app/en/legal/sources). Utile pour savoir si un grand événement coïncide avec la soirée.
- Le recensement des cinémas/ERP en données ouvertes de la Ville : à vérifier (la recherche "cinema" sur le catalogue n'a renvoyé que "Lieux de tournage").

### 7. Cinémas

- Le Forum abrite l'UGC Ciné Cité Les Halles, niveau -3 (https://www.ugc.fr/cinema.html?id=10).
- Les séances et horaires ne sont pas en open data : à vérifier. Ne scrapez pas le site de l'exploitant sans accord ; ne comptez pas dessus pour le live.
- CNC : fréquentation mensuelle nationale (https://www.cnc.fr/cinema/etudes-et-rapports/statistiques/frequentation-cinematographique) et jeu data.gouv (https://www.data.gouv.fr/datasets/frequentation-des-salles-de-cinema). Pas de granularité par séance. Sert à pondérer le remplissage (par exemple le mois, le jour de la semaine). Jauges de salles : à vérifier.
- Hypothèse de modèle (non sourcée, à assumer comme telle) : fin de séance = début + durée du film + pubs, avec plusieurs salles qui finissent à 22h-23h30.

### 8. Météo

- Open-Meteo : https://open-meteo.com/, sans clé, CC BY 4.0, moins de 10 000 appels/jour, 5 000/heure, 600/minute, usage non commercial (https://open-meteo.com/en/terms). Un hackathon rentre en non-commercial, à confirmer pour la suite. Testé : température et précipitation actuelles, pas de 15 min.
- Météo-France : portail https://portail-api.meteofrance.fr/ ; données sous Licence Ouverte v2.0 (https://publicwiki.deltares.nl/spaces/FEWSDOC/pages/308413256/MeteoFranceDPObs). Inscription requise, quotas à vérifier. Open-Meteo suffit.
- Apport : pluie ou froid font accélérer la marche et réduisent le temps de stationnement dans la galerie. Hypothèse de modèle.

### 9. Bison Futé / trafic routier

- Licence de réutilisation des données temps réel : https://m.bison-fute.gouv.fr/IMG/pdf/Licence_reutilisation_donnees_action_b_EN.pdf. Orientée réseau routier national. Pour Paris intra-muros, préférez les capteurs permanents de la Ville (section 6). Point d'accès et format exacts : à vérifier.

## Direct dans Kafka, ou en fichier ?

| Mode | Sources |
|---|---|
| En direct (polling, topic dédié) | Vélib GBFS (60 s), Open-Meteo (15 min), prochains passages PRIM (toutes les 2 à 3 min pour tenir 1 000 req/jour), messages info trafic PRIM |
| Fichier chargé puis rejoué en accéléré | profils horaires et validations IDFM, GTFS, comptages vélo/piétons/routiers (J-1), Que faire à Paris, CNC |

Dans Kafka, il reste utile de rejouer les fichiers avec des timestamps ré-alignés sur "ce soir" : le jury voit un flux homogène, et vous pouvez le dire (mention "rejoué").

## 5 recettes prêtes à copier

Toutes sauf la 4 ont été testées le 22/10/2026 sans clé.

**1. Vélib en direct (flux Kafka)**
```bash
curl -s "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json" \
 | jq -c '.data.stations[] | {station_id, bikes:.num_bikes_available, docks:.num_docks_available}'
```

**2. Validations Châtelet (calibrage en fichier)**
```bash
curl -s "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/validations-reseau-ferre-nombre-validations-par-jour-3eme-trimestre/records?limit=100&where=libelle_arret%3D%27CHATELET%27&order_by=jour%20desc"
```

**3. Profils horaires par jour type (courbe du soir)**
```bash
curl -s "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/validations-reseau-ferre-profils-horaires-par-jour-type-1er-trimestre/records?limit=100&where=libelle_arret%3D%27CHATELET%27"
```
Les noms de champs du jeu horaire n'ont pas été lus : listez-les avec `.../catalog/datasets/<id>` avant de filtrer. Le filtre `libelle_arret` est à vérifier sur ce jeu.

**4. Prochains passages PRIM (clé gratuite requise, pas testé)**
```bash
curl -s -H "apikey: $PRIM_KEY" -H "Accept: application/json" \
 "https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:XXXXX:"
```
Le chemin exact et l'identifiant `STIF:StopPoint:Q:XXXXX:` sont à vérifier sur la page de l'API (https://prim.iledefrance-mobilites.fr/fr/apis/idfm-ivtr-requete_unitaire). La doc lue indique `GET /stop-monitoring/{MonitoringRef}` et le header `apikey`.

**5. Météo du Forum toutes les 15 minutes**
```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=48.8606&longitude=2.3466&current=temperature_2m,precipitation,wind_speed_10m&timezone=Europe%2FParis"
```

## Ce qui manque (à dire franchement au jury)

- Pas de sorties de salle ni de comptage dans le Forum en open data.
- Pas de validations en temps réel ouvertes.
- La loi de sortie de foule reste un modèle : utilisez des paramètres (taille des salles, fin de séance, répartition RER / métro / à pied / Vélib) et indiquez quelle part est calée sur les profils IDFM.

## Résumé

1. Les seuls flux vraiment en direct et sans clé : Vélib GBFS (60 s) et Open-Meteo (15 min) ; Open Data Paris répond aussi sans clé.
2. Les prochains passages PRIM demandent une clé gratuite et sont limités à 1 000 requêtes par jour : polling toutes les 2 à 3 minutes sur un seul arrêt.
3. Les profils horaires de validations IDFM (fichier, sans clé) sont la meilleure base pour caler l'affluence du soir à Châtelet-Les Halles.
4. Séances de cinéma et sorties de salle : aucune source ouverte trouvée, donc paramètres de modèle (UGC Ciné Cité Les Halles, niveau -3).
5. À vérifier : identifiant exact du jeu piétons de la Ville, MonitoringRef de Châtelet, licences IDFM, GTFS-RT, quotas Opendatasoft.
