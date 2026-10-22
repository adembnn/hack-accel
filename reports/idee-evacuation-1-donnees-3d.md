# Idée « évacuation » : quelle source 3D prendre demain à 9h

Décision débloquée : d'où vient la géométrie 3D du quartier de l'Accor Arena, et ce qu'on a le droit d'en faire.
Légende : **[testé]** = j'ai appelé le service moi-même aujourd'hui ; **[?]** = non vérifié ; **[bloqué]** = le site a résisté après un essai de contournement.

## Verdict en 5 lignes

1. Ne pas reconstruire à partir de photos. Prendre les **bâtiments en 3D de l'IGN (BD TOPO)** : des emprises de bâtiments avec leur hauteur, gratuits, sans clé, testés sur Bercy.
2. Poser dessus la **photo aérienne IGN à 20 cm** (texture du sol, sans clé) et le relief IGN.
3. Les **bouches de métro** viennent d'OpenStreetMap (à tirer demain depuis le réseau de l'équipe, mon accès a été refusé) ; sinon on les place à la main.
4. Google (Street View, 3D photoréaliste) : autorisé comme **décor visuel** uniquement. Interdit d'en extraire de la géométrie pour la simulation de foule. Clé d'API requise.
5. Risque principal : l'Arena elle-même et ses issues ne sont pas dans les données ouvertes avec le niveau de détail voulu. Il faudra la modéliser à la main (une boîte avec ses portes).

## 1. Street View : ce que Google autorise

Explication : une « API » est une porte d'accès officielle qu'un programme appelle ; les « tuiles 3D photoréalistes » sont la maquette 3D texturée des villes que Google affiche dans Google Earth.

| Question | Réponse | Source |
|---|---|---|
| Extraire des images Street View pour reconstruire un modèle 3D ? | **Non**, pas dans les règles. Les conditions interdisent de copier/extraire du contenu Google, de le stocker hors cache autorisé, et citent même l'interdiction de bâtir des bases à partir d'images Street View. Texte exact de l'article « scraping » de la plateforme non récupéré : **[?]** | [Résumé des conditions](https://conductatlas.com/platform/google-maps/google-maps-platform-terms-of-service/no-scraping-or-content-extraction/) (source secondaire) ; [étude Utrecht citant les Geo Guidelines](https://research-portal.uu.nl/en/publications/to-use-or-not-to-use-proprietary-street-view-images-in-health-and/) |
| Tuiles 3D photoréalistes : usage permis ? | **Affichage seulement.** « Pas d'usage hors visualisation » : analyse d'image, détection d'objets, extraction de géodonnées, usage hors ligne, tout est interdit. | [Politiques Map Tiles API](https://developers.google.com/maps/documentation/tile/policies) |
| Tracer ou dériver des objets 3D à partir de ces tuiles ? | **Interdit** (« extracted, traced, or otherwise derived by hand or machine »). Superposer nos propres objets 3D est permis s'ils ne sont pas dérivés. | idem |
| Mettre en cache / télécharger la maquette ? | Interdit sauf les règles de cache HTTP ; seuls les identifiants de panorama se gardent. | idem |
| Moteur d'affichage | CesiumJS est nommé explicitement (avec les crédits Google affichés). Un moteur tiers comme three.js est admis si le logo et les attributions restent visibles. | idem |
| Vidéo de démo | Promotionnelle, 30 s max, sans Street View, mention « à but promotionnel ». Un enregistrement d'écran long de la démo est donc à éviter. | idem |

Prix (par millier de requêtes, au-delà du quota gratuit mensuel) : [grille officielle](https://developers.google.com/maps/billing-and-pricing/pricing)
- Photorealistic 3D Tiles : 1 000 gratuits/mois, puis 6 $ ; plafond de 10 000 « requêtes racine » par jour. Une requête racine ouvre une session d'environ 3 h de tuiles ([usage et facturation](https://developers.google.com/maps/documentation/tile/usage-and-billing)). Pour une démo, une session suffit.
- Street View Static (image fixe) : 10 000 gratuites/mois, puis 7 $. Métadonnées : gratuites.
- Il faut un compte de facturation actif même pour rester dans le gratuit.
- Variable pour `.env` : `GOOGLE_MAPS_API_KEY` (à restreindre au domaine de la démo). Variante via Cesium : `CESIUM_ION_TOKEN` ([forum Cesium : 1 000 requêtes racine/mois sur ion](https://community.cesium.com/t/cesium-ion-google-3d-tiles-api-limit/29307), chiffre de 2024 **[?]**).
- Zone EEA (nous sommes en France) : restrictions supplémentaires sur Street View Static depuis juillet 2025, notamment l'usage avec une carte ([Google](https://developers.google.com/maps/comms/eea/street-view-static)). Lire avant d'afficher Street View à côté d'une carte.

**Ce que ça veut dire pour nous** : Google ne peut être qu'une toile de fond (« voilà le vrai quartier »), jamais la source des murs que les agents de foule doivent contourner.

### Alternatives ouvertes aux photos de rue

| Source | Licence | Ce que j'ai vérifié |
|---|---|---|
| **Panoramax** (commun numérique français, soutenu par l'IGN) : service de photos de rue libre et fédéré | CC-BY-SA-4.0 sur les images testées ; instance IGN annoncée en Licence Ouverte Etalab **[?]** | **[testé]** : l'API publique renvoie des images dans la zone Bercy (5 résultats pour un cadre de 1 km, dates 2016 et 2020, CC-BY-SA-4.0). [API](https://api.panoramax.xyz/api/search?bbox=2.375,48.833,2.390,48.842&limit=5) ; [Wikipédia](https://en.wikipedia.org/wiki/Panoramax) ; [licences par instance](https://next.ink/125818/panoramax-lalternative-libre-et-francaise-a-google-street-view/) |
| **Mapillary** (photos collaboratives, propriété de Meta) | CC-BY-SA, attribution obligatoire ; jeton d'API requis | [aide Mapillary](https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data). Mon appel sans jeton a renvoyé une erreur 500 : couverture de Bercy **[?]**. Variable : `MAPILLARY_TOKEN` |
| **KartaView** | non vérifié | **[?]** |

Les photos Panoramax/Mapillary sont légales à réutiliser, mais clairsemées : bonnes pour **regarder** (afficher une vignette de la sortie), pas pour reconstruire.

## 2. Géométrie ouverte : ce qui marche sur Bercy

Explication : une « emprise » est le contour d'un bâtiment vu du dessus ; avec une hauteur, on la gonfle en boîte 3D (on appelle ça « extruder »).

### BD TOPO (IGN) : le meilleur point de départ **[testé]**
- BD TOPO est la base vectorielle de l'IGN : bâtiments, hauteur, étages, usage, stations de métro. Licence Ouverte Etalab 2.0 d'après la fiche régionale de [l'APUR](https://geocatalogue.apur.org/catalogue/srv/api/records/51355340-b819-47e0-92e1-05548c8d559e) (2023, version régionale **[?]** pour la version nationale actuelle).
- Accès sans clé par WFS (service qui livre les objets géographiques en JSON). Requête que j'ai exécutée :
  `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=BDTOPO_V3:batiment&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&BBOX=48.833,2.375,48.842,2.390,urn:ogc:def:crs:EPSG::4326&COUNT=2000`
- Résultat mesuré : **614 bâtiments** pour ce cadre d'environ 1,2 km x 1 km, 0,85 Mo, **572 avec une hauteur** (93 %). Champs utiles : `hauteur`, `nombre_d_etages`, `usage_1`, `altitude_maximale_toit`, `materiaux_des_murs`. Le plus haut du cadre atteint 90 m (tours voisines).
- Stations de métro : couche `equipement_de_transport` renvoie bien « Bercy », « Cour Saint-Émilion », « Dugommier » (**un point par station, pas par bouche**). La couche `point_d_acces` est vide ici, `erp` aussi.
- Limite : l'Arena apparaît comme un bâtiment de 8,5 m à son emplacement (61 sommets). C'est probablement la base ; son toit en pyramide et sa pente végétalisée ne sont pas fidèles. **[?]** à confirmer à l'écran.
- Mise à jour hebdomadaire depuis mai 2025 ([data.gouv](https://www.data.gouv.fr/datasets/bd-topo)).

### OpenStreetMap (OSM) : pour les détails fins **[bloqué]** pour moi
- OSM décrit des « parties de bâtiment » avec hauteur et étages ([wiki Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_buildings)), plus les entrées/sorties et bouches de métro (`railway=subway_entrance`, `entrance=*`). Licence ODbL : citer « © les contributeurs d'OpenStreetMap ».
- Mes requêtes Overpass (l'API de requête d'OSM) ont été refusées : erreur 406 puis délai dépassé sur `overpass-api.de`, 403 sur le miroir français, 504 sur un autre. **Je n'ai donc pas compté les bouches de métro ni les issues de l'Arena dans OSM** : **[?]**. Demain, tester depuis le Wi-Fi de l'équipe, ou télécharger un extrait de Paris-Île-de-France chez [Geofabrik](https://download.geofabrik.de/europe/france/ile-de-france.html) **[?]** (poids non vérifié, quelques centaines de Mo).
- Sur la demande de l'idée, c'est la seule source ouverte susceptible de donner des **bouches de métro individuelles et des portes**.

### Overture Maps : alternative de secours, **[?]** non testée
- Fusion mondiale de bâtiments (OSM, Microsoft, Google, etc.), champ `height` et `num_floors` ([schéma](https://docs.overturemaps.org/schema/reference/buildings/building/)). Licence thème bâtiments : ODbL ([attribution](https://docs.overturemaps.org/attribution/)).
- Accès par DuckDB (moteur de requête local) sur des fichiers hébergés chez Amazon, filtrés par rectangle ([exemple officiel](https://docs.overturemaps.org/examples/kepler-gl)). DuckDB n'est pas installé sur cette machine, je n'ai pas testé. En France, la donnée vient surtout d'OSM : pas mieux que BD TOPO.

### LiDAR HD et relief IGN
- LiDAR HD : relevé laser aérien de toute la France, environ 10 points/m² ; produits MNT (sol nu), MNS (sol + bâti + arbres) et MNH (différence = hauteur des objets), dalles de 1 km x 1 km ([article](https://www.it-connect.fr/france-vue-explorer-france-3d-ign/), [fiche data.gouv](https://www.data.gouv.fr/datasets/mnt-lidar-hd-ign-2025)).
- **[testé]** Le serveur d'images de l'IGN liste bien les couches `ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS` et `IGNF_LIDAR-HD_CLASS` ([WMS](https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities)). Le MNS donne la silhouette réelle des toits (utile pour la pyramide de l'Arena), mais en image de hauteurs à convertir. Le nuage de points brut (LAZ) est lourd : à éviter en 7 h.
- Altitude d'un point **[testé]** : `https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?lon=2.3787&lat=48.8386&resource=ign_rge_alti_wld&zonly=false` a répondu 33,1 m. Limite : 5 requêtes/seconde par IP ([fiche](https://www.data.gouv.fr/dataservices/api-geoplateforme-calcul-altimetrique)). Bercy est quasi plat : un sol plat suffit pour la démo.

### Paris Data, cadastre
- Maquette 3D de Paris en Open Data : **non trouvée** dans mes recherches **[?]**. Seul trouvé : emprises de Paris avec hauteurs (128 000 objets) chez l'[APUR](http://opendata.apur.org/datasets/emprise-batie-paris), qui est de la 2D + hauteur, donc équivalent à BD TOPO.
- Cadastre : parcelles 2D, aucun apport en hauteur. À ignorer.

## 3. Imagerie aérienne et satellite

- **Photos aériennes IGN (orthophotos, photo aérienne redressée comme une carte)** **[testé]** : `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX=18&TILEROW=90250&TILECOL=132900` a répondu 200, image JPEG de 17 Ko, sans clé. Le niveau de détail 20 cm n'a pas été mesuré tuile par tuile **[?]**.
- Ce que ça apporte : un **sol texturé réaliste** (rues, quais, esplanade, lignes de bus), et la possibilité de repérer à l'œil les passages piétons et les accès. Ce que ça n'apporte pas : de la hauteur ni les portes.
- **Sentinel** (satellite européen) : 10 m par pixel, donc une rue entière tient dans 1 pixel. Inutile ici.

## 4. Reconstruction par NeRF / Gaussian splatting / photogrammétrie : verdict net

Explication : la photogrammétrie recalcule une forme 3D à partir de nombreuses photos qui se recouvrent ; le NeRF et le « Gaussian splatting » apprennent une scène réaliste à regarder, sans garantir de formes solides.

**Non, pas en 7 h, et pas besoin.** Trois raisons :
1. **Les photos manquent légalement.** Street View est exclu (§1). Panoramax est libre mais clairsemé (5 images renvoyées pour un cadre de 1 km avec ma requête limitée à 5 ; photos de 2016 et 2020), pas des passages de 60 % de recouvrement.
2. **Le résultat n'est pas utilisable pour une foule.** Le splatting vise la cohérence visuelle plutôt que la précision géométrique ([étude comparative 2026](https://arxiv.org/pdf/2605.29452)) ; or l'évacuation exige des murs, des portes, des largeurs exactes. Les routes sans texture gênent aussi la reconstruction ([StreetSurfGS](https://arxiv.org/pdf/2410.04354)).
3. **Le temps.** Je n'ai trouvé aucune mesure fiable de durée pour une rue entière **[?]** ; la partie traitement s'étale sur plusieurs heures de GPU avec des essais, sans garantie de résultat.

Donc : s'appuyer sur des maillages existants (BD TOPO en boîtes), et modéliser à la main uniquement l'Arena (voir §5).

## 5. Recette pour demain à 9h

### Recette A (recommandée) : tout gratuit, sans clé, légale, sans surprise
1. **Bâtiments** : télécharger la requête WFS BD TOPO ci-dessus (un fichier JSON de 0,85 Mo), l'enregistrer en local dans le dépôt de la démo pour ne pas dépendre du réseau le jour J. Extruder chaque emprise selon `hauteur` avec three.js (bibliothèque d'affichage 3D dans le navigateur) ou deck.gl/MapLibre.
2. **Sol** : tuiles orthophotos IGN (WMTS) collées sur un plan, ou fond de carte plat.
3. **Bouches de métro et portes** : essayer Overpass depuis un autre réseau ; sinon extrait Geofabrik ; sinon placer à la main environ 6 points repérés sur la photo aérienne et sur Panoramax. Prévoir cette dernière option dès le départ.
4. **Arena** : remplacer le bâtiment BD TOPO par un volume à la main (ellipse/boîte, hauteur lue sur le MNS ou la fiche BD TOPO) et y poser ses portes d'après le [plan d'accès officiel](https://www.accorarena.com/en/faq/where-is-the-entrance-to-the-orchestra-pit) ; capacité de 20 300 personnes citée par une source secondaire **[?]**.
5. **Crédits à afficher** : « © IGN – BD TOPO, Licence Ouverte Etalab » et « © les contributeurs d'OpenStreetMap » si OSM est utilisé.
- Coût : 0 €. Variable `.env` : aucune.

### Recette B (en option, pour l'effet visuel) : décor Google 3D
- Ajouter dans CesiumJS (moteur de globe 3D) les Photorealistic 3D Tiles avec `GOOGLE_MAPS_API_KEY` (ou `CESIUM_ION_TOKEN`) comme **arrière-plan**. Les agents de la simulation marchent sur la géométrie de la recette A, pas sur celle de Google.
- Contraintes : compte de facturation Google, crédits affichés, pas de téléchargement, pas de vidéo longue de la démo, pas d'extraction de formes.
- Coût attendu en démo : moins de 1 000 requêtes racine, donc 0 € si le quota gratuit s'applique (grille actuelle de Google).

### Ce qui reste à vérifier demain avant 10h (30 min)
1. Bouches de métro et portes dans OSM (depuis un autre réseau).
2. Forme réelle de l'Arena dans BD TOPO, affichée à l'écran.
3. Texte exact des conditions Google sur Street View (article « scraping ») si l'équipe veut afficher des vignettes Street View.
4. Si Google 3D est gardé : vérifier à l'écran que les crédits Google s'affichent.

## Ce que je n'ai pas fait
- Aucun appel à un LLM payant, aucun `.env` lu, aucune clé utilisée. Les tests (BD TOPO, orthophoto, altitude, Panoramax) se sont faits sans clé.
- Pas de test Overture, Mapillary avec jeton, ni du rendu visuel dans un navigateur. Le rendu 3D reste à valider à l'écran avant d'annoncer que ça marche.
