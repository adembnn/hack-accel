# 03 - Modèles 3D, images au sol et pipeline (Forum des Halles)

Règle : chaque affirmation porte une URL ; sinon « à vérifier ». Recherche faite le 22/10/2026 avec Keenable (extraits de recherche, pas de lecture intégrale des pages).

## Verdict en 5 lignes (à lire d'abord)
1. Pour 6 h : ne pas viser un modèle photoréaliste. Prendre les emprises de bâtiments avec hauteurs (OSM enrichi BD TOPO, ou BD TOPO direct) et les extruder dans deck.gl.
2. Le Forum est en grande partie souterrain : aucune source ouverte trouvée ne décrit finement les niveaux -1 à -4. Il faut modéliser la salle d'échange à la main (boîtes, escaliers) : à vérifier dans OSM (indoor=*, level=*).
3. Images au sol : Panoramax (ouvert, API STAC) pour documenter ; Google Street View uniquement en affichage, jamais stocké ni texturé.
4. Personnages et voitures : Quaternius, Kenney (CC0) via Poly Pizza ; Mixamo pour des animations (gratuit, usage commercial permis).
5. Foule : instancier (InstancedMesh ou ScenegraphLayer) ; ne pas faire de mesh animé par agent au-delà de quelques centaines.

## 1. Modèles 3D de ville ouverts

| Source | Accès, licence, format | Qualité autour du Forum |
|---|---|---|
| Maquette 3D de la Ville de Paris | Une liste de villes dans https://github.com/OloOcki/awesome-citygml et https://github.com/wonder-sk/3d-spatial-data ne cite pour Paris que l'emprise bâtie de l'Apur (128 k bâtiments avec hauteur) : http://opendata.apur.org/datasets/emprise-batie-paris. Je n'ai PAS confirmé l'existence d'une maquette 3D CityGML téléchargeable de Paris : à vérifier sur https://opendata.paris.fr/explore/ (recherche « maquette 3D ») | Emprise + hauteur : suffisant pour des volumes extrudés. LoD2/textures : à vérifier |
| IGN BD TOPO (bâtiments) | Données gratuites, sans clé d'API, via la Géoplateforme data.geopf.fr, licence ouverte Etalab 2.0 : https://fredericpallu.com/projets/geomatique_ouverte/ign_explorer. Attributs : hauteur, nombre d'étages, usage, altitudes de toit, prêt pour extrusion : https://icon-map.com/products/catalog/explore/europe/housing/france-bd-topo-buildings. Format : WFS/GeoJSON ou GeoPackage (à vérifier pour l'URL exacte du WFS) | Bonne pour le Paris extérieur ; la partie souterraine n'y figure pas (à vérifier) |
| OSM + hauteurs BD TOPO | Import communautaire qui ajoute `height` et `building:levels` aux bâtiments OSM de Paris : https://wiki.openstreetmap.org/wiki/Organised_Editing/Activities/TomTom/Global_-_Building_Height_Imports/France_-_IGN_BD_TOPO_Building_Heights_Import. Licence ODbL (https://www.openstreetmap.org/copyright). Le plus simple à récupérer par Overpass | Probablement la meilleure option 2 h. L'état réel de l'import sur le Forum : à vérifier |
| LiDAR HD IGN | Nuages de points ≥ 10 pts/m², licence Etalab 2.0 : https://topolia.fr/articles/lidar-hd-ign ; téléchargement : https://cartes.gouv.fr/telechargement/IGNF_NUAGES-DE-POINTS-LIDAR-HD (via https://lidarvisor.com/download-ign-france-lidar). Modèles numériques dérivés (MNS/MNT) : https://cartes.gouv.fr/aide/fr/partenaires/ign/generalites-ign/actualites/2025-03-lidarhd-et-produits-derives | Excellent en toiture, inutile sous la dalle. Dalles lourdes (taille : à vérifier) : à écarter pour 6 h, sauf MNS en raster |
| Tuiles 3D IGN | L'IGN fournit des bâtiments 3D à iTowns : https://github.com/IGNF/TP_iTowns (étape « buildings-3d »). Format et URL du tileset : à vérifier | Bâtiments 3D de Paris ; non intégrable simplement à deck.gl sans Tile3DLayer (à vérifier) |
| Overture Maps | Thème « buildings » avec hauteurs quand disponibles : https://docs.overturemaps.org/guides/buildings. Sources OSM, Microsoft, Esri : https://overturemaps.org/download/overture-july-alpha-release-notes. Licence ODbL pour les données dérivées d'OSM : https://overturemaps.org/download/overture-april-alpha-release-notes (la licence actuelle par sous-thème : à vérifier). Export GeoParquet/GeoJSON par DuckDB ou CLI : https://geodataviewer.com/blog/overture-maps-complete-guide | Quasi identique à OSM sur Paris (même source) ; peu d'intérêt ici |
| Service de tuiles 3D à la demande | Re:Earth Buildings génère du 3D Tiles 1.1 + glTF depuis Overture : https://github.com/reearth/reearth-buildings | Piste alternative, non testée |

Recommandation : OSM (hauteurs BD TOPO) pour la géométrie, BD TOPO WFS en secours, LiDAR en MNS seulement si le temps le permet.

## 2. Images au sol libres

- Panoramax : fédération d'images géolocalisées sous licences ouvertes, outils libres : https://wiki.openstreetmap.org/wiki/GeoVisio. Catalogue fédéré https://api.panoramax.xyz/ ; API conforme OGC Features et STAC : https://docs.panoramax.fr/how-to-contribute/use-panoramax. Licence : celle de chaque photo (à lire dans les métadonnées, souvent CC-BY-SA : à vérifier). Endpoints de recherche par bbox : à vérifier dans la doc de l'API STAC (typiquement `/api/search?bbox=...`).
- Mapillary : images sous CC BY-SA 4.0, avec permission spéciale pour en dériver des données pour OSM : https://wiki.openstreetmap.org/wiki/Mapillary. API et jeton : à vérifier.
- KartaView : images en CC BY-SA ; backend propriétaire : https://wiki.openstreetmap.org/wiki/KartaView. Couverture du Forum : à vérifier.
- Wikimedia Commons : photos du Forum avec licences variées (GFDL, CC), vérifier fichier par fichier, ex. https://commons.wikimedia.org/wiki/File:Forum_des_Halles_1.JPG. Réutilisation : https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- Flickr CC : licences variables par photo ; à vérifier (filtre « Creative Commons » de l'API Flickr).
- Google Street View : la politique de l'API Street View Static interdit en général le pré-chargement, l'indexation, le stockage et la mise en cache (hors place ID et pano ID) : https://developers.google.com/maps/documentation/streetview/policies?hl=en. Interdiction de scraper et de réhéberger : https://github.com/cwoodworth89/CFR-EVO-APP/blob/main/docs/standards/google-maps-platform-terms-excerpts.md (résumé tiers ; texte officiel : https://cloud.google.com/maps-platform/terms/maps-service-terms?hl=en). Conclusion : affichage en direct seulement, pas de texture, pas de dataset.

Usage : texturer (façades) = Panoramax/Mapillary/KartaView en respectant CC BY-SA (partage à l'identique, à valider avec le jury si la démo est publique : à vérifier). Documenter (slides, README) = tout ce qui précède avec attribution. Les photos de passants posent un enjeu de vie privée : à vérifier (flou automatique de Panoramax).

## 3. Pipeline technique en 6 h

Options, de la plus rapide à la plus lourde :
- A (recommandée) : deck.gl `PolygonLayer`/`GeoJsonLayer` extrudé sur MapLibre, hauteurs en propriété. Aucun passage par Blender. Doc ScenegraphLayer (modèles glTF instanciés) : https://deck.gl/docs/api-reference/mesh-layers/scenegraph-layer. SimpleMeshLayer pour des primitives : https://ts.anymap.dev/deckgl/simplemesh_layer (SimpleMeshLayer = géométries simples, ScenegraphLayer = glTF externes).
- B : OSM2World convertit OSM en glTF/OBJ, utilisable en bibliothèque JVM : https://osm2world.org/docs/library et https://wiki.openstreetmap.org/wiki/OSM2World (export glTF/OBJ).
- C : Blender + Blosm, export glTF. Piège documenté : l'option « Single object » est activée par défaut et fusionne toute la ville en un seul mesh ; la décocher avant l'import : https://blenderartists.org/t/cityship-a-city-exports-as-one-giant-file-so-i-made-it-split-into-zones-that-snap-back-together/1652332. Utiliser seulement pour le Forum lui-même.

### Recette pas à pas (≈ 2 h, option A + quelques glTF)
1. (10 min) Bbox du Forum, environ lon 2.343-2.352 / lat 48.859-48.864 (valeurs approchées, à vérifier sur la carte). Requête Overpass : `[out:json];(way["building"](48.859,2.343,48.864,2.352);relation["building"](48.859,2.343,48.864,2.352););out geom;` puis convertir en GeoJSON (`osmtogeojson` en npm). Ajouter aussi `highway`, `indoor`, `level` pour les circulations (couverture souterraine : à vérifier).
2. (10 min) Hauteurs : lire `height`, sinon `building:levels` x 3 m, sinon 12 m par défaut. Pour comparer, interroger le WFS de la Géoplateforme BD TOPO (couche des bâtiments ; nom exact de la couche : à vérifier sur https://data.geopf.fr).
3. (15 min) Initialiser `npm create vite@latest`, installer `maplibre-gl @deck.gl/core @deck.gl/layers @deck.gl/mesh-layers @deck.gl/mapbox`. Utiliser `MapboxOverlay` (interleaved) avec une carte MapLibre inclinée (pitch 60).
4. (20 min) `GeoJsonLayer` extrudé : `extruded: true, getElevation: f => f.properties.h, getFillColor: [200,200,210]`. Ajouter un éclairage et un fond sombre pour la lisibilité.
5. (30 min) Modèle du Forum : dessiner à la main 4 à 6 zones (salle d'échange, escaliers, sorties) en GeoJSON, avec un niveau (z) par couche ; afficher les niveaux souterrains en transparence (`opacity`) plutôt qu'en vrai 3D (pas de vrai sous-sol dans MapLibre ; à vérifier).
6. (30 min) Agents : tableau de positions mis à jour par `requestAnimationFrame` (flocking/pathfinding simple sur un graphe de nœuds de sortie). Rendu avec `ScenegraphLayer` : `scenegraph: 'person.glb'`, `getPosition`, `getOrientation`, `sizeScale`. Appeler `new Deck`/`setProps` avec `updateTriggers` pour redessiner.
7. (15 min) Interface : curseur du nombre d'agents, bouton alarme, compteur de sortie. Capturer des vidéos.
8. Export optionnel de la scène vers three.js : si un rendu plus fin est souhaité, exporter le GeoJSON via OSM2World (option B).

Pièges :
- deck.gl attend des coordonnées lon/lat ; le glTF s'oriente avec `getOrientation` [pitch, yaw, roll] ; un modèle Mixamo peut apparaître couché (rotation de 90°) : tester dès la minute 1.
- Les glTF animés dans ScenegraphLayer : l'animation est possible mais coûteuse (`_animations`, à vérifier) ; instancier des modèles statiques ou en pose neutre pour 1 000+ agents.
- Respecter les limites de l'API Overpass (requête petite, bbox serrée).
- Garder une copie locale du GeoJSON : ne pas dépendre du réseau le jour J.
- Hauteur nulle ou manquante dans BD TOPO/OSM : prévoir la valeur par défaut.
- La sortie de foule de ce site est un sujet sensible (sécurité) : rester sur un scénario fictif et sourcé.

## 4. Modèles 3D libres (personnages, voitures, agents de sécurité)

- Kenney : CC0 (domaine public), OBJ/glTF, via Poly Pizza : https://poly.pizza/m/fJsz9IVM8f ; site https://kenney.nl (licence CC0 rappelée par https://vxlversel.com/credits).
- Quaternius : CC0, via Poly Pizza (modèles crédités « licenced under CC0 1.0 ») : https://poly.pizza/l/tPmGkkYVaM/credits ; site https://quaternius.com. Packs de personnages rigged low poly disponibles : https://poly.pizza/l/hB5nfaruiI/credits (CC0 pour l'élément cité ; chaque modèle à vérifier).
- Poly Pizza : une partie est en CC BY 3.0, donc attribution obligatoire : https://vxlversel.com/credits ; vérifier la licence par modèle.
- Sketchfab : plus de 700 000 modèles téléchargeables sous licences Creative Commons ; la plupart autorisent l'usage commercial ; crédit de l'auteur et de Sketchfab requis pour CC BY : https://sketchfab.com/developers/download-api/guidelines ; formats de téléchargement dont glTF/GLB : https://help.sketchfab.com/en/articles/16152217-downloading-3d-models ; modèle de mention : https://help.sketchfab.com/en/articles/16152215-crediting-users-for-3d-model-downloads. Filtrer CC0 / CC BY ; éviter CC BY-NC si démo publique (inférence, à vérifier).
- Mixamo : personnages, auto-rigging et animations gratuits pour projets commerciaux ou non, sans redevance ; interdiction de revendre exclusivement les données d'animation : https://helpx.adobe.com/ee/creative-cloud/faq/mixamo-faq.html et https://community.adobe.com/t5/mixamo-discussions/the-license-to-use-mixamo/m-p/13222648. Pas disponible pour les ID Enterprise/Federated (donc ne pas utiliser un compte d'entreprise ou d'école fédéré) : même FAQ.
- Agents de sécurité : prendre un personnage générique et le recolorer en gilet jaune (matériau) ; modèle dédié : à chercher (non vérifié).
- Voitures : packs Kenney (« car kit ») : à vérifier sur https://kenney.nl/assets.
- Format : glTF/GLB uniquement ; réduire les textures ; compresser avec `gltf-transform optimize in.glb out.glb --compress draco` (outil : https://gltf-transform.dev ; à vérifier).

## 5. Exemples et dépôts de foule 3D dans le navigateur

- Portfolio three.js + Yuka avec foule : https://github.com/charles-masse/portfolio (comparatif InstancedMesh vs clones).
- Simulation de station de métro avec évacuation d'urgence, three.js, un seul fichier HTML, agents passagers : https://github.com/studio-public-demos/metro-station-simulator (très proche du besoin ; licence : à vérifier).
- Foule WebGL pure three.js, 3 400+ agents à 60 FPS, instanciation, quadtree : référencé sur https://github.com/topics/crowd-simulation?l=javascript&o=desc&s=updated (nom du dépôt : à vérifier).
- Masjid al-Haram, jusqu'à 5 000 agents, sorties de portes : https://discourse.threejs.org/t/masjid-al-haram-real-time-3d-crowd-tawaf-prayer-simulation/94156 (dépôt open source annoncé ; licence : à vérifier).
- Animer des milliers de personnages instanciés par textures de sommets (VAT) : https://github.com/MikeFernandez-Pro/three-vat (important si les agents doivent marcher, avec un seul draw call par matériau).
- Intégration three.js dans une carte : deck.gl documente les deux voies (couches mesh vs three.js) ; choisir three.js seulement si le rendu deck.gl est insuffisant (inférence).

## Décisions à prendre dans l'heure 1
1. Une scène deck.gl uniquement, ou deck.gl pour la carte et three.js pour l'intérieur du Forum ? (recommandé : deck.gl uniquement.)
2. Qui récupère les données (Overpass + WFS), qui prépare les glTF, qui code les agents, qui produit la vidéo de démo.
3. Quelle attribution afficher à l'écran : « © OpenStreetMap contributors » (https://www.openstreetmap.org/copyright), « © IGN, Licence ouverte Etalab 2.0 », crédits des modèles 3D.

## Points restant « à vérifier » (par priorité)
- Existence d'une maquette 3D Paris ouverte (CityGML) et son périmètre.
- Niveaux souterrains du Forum dans OSM (`level`, `indoor`).
- Nom de la couche WFS BD TOPO et URL du tileset 3D IGN.
- Endpoints STAC Panoramax par bbox et licences des photos du Forum.
- Licence exacte des projets de foule cités avant réutilisation du code.
