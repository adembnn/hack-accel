# État de l'art 5 : reconstruire un lieu en 3D pour simuler des foules

Décision débloquée : comment obtenir un modèle 3D assez bon pour simuler des déplacements sur un lieu tiré au hasard en France, et comment combler le manque d'intérieurs.
Convention : chaque affirmation porte un lien ; `[?]` = non vérifié (mémoire du modèle ou sources contradictoires). Aucune décision n'est prise pour l'équipe.
Limite de la recherche : outil de recherche web simple, beaucoup de réponses partielles. Les chiffres de précision IGN sont à revérifier dans les notices officielles.

## 1. Version simple (l'image)

Imagine une maquette en carton d'un quartier.
- Les **boîtes** (bâtiments avec leur hauteur) : gratuites et fiables partout en France.
- Le **sol** (rue, trottoir, passages piétons, escaliers) : disponible, mais très inégal d'un endroit à l'autre. À Paris c'est bien dessiné, dans une petite ville souvent absent.
- L'**intérieur** (murs, portes, couloirs) : n'existe pas en open data. Il faut soit le recevoir d'un client, soit l'inventer en le disant clairement.

Conclusion courte : un « extérieur honnête » est faisable en quelques heures de dev. Un intérieur « estimé » est faisable mais c'est une illustration, pas une mesure. Reconstruire la géométrie depuis des photos de rue n'est pas réaliste en quelques heures pour un lieu au hasard.

## 2. Géométrie ouverte en France

Mini-glossaire (première mention) :
- **BD TOPO** : base vectorielle de l'IGN (bâtiments, routes, etc.), précision dite « métrique ».
- **LiDAR HD** : le ciel est scanné par laser depuis un avion ; chaque impact laser est un point 3D. On obtient un **nuage de points**.
- **MNS / MNT / MNH** : modèle numérique de surface (toits, arbres inclus) / de terrain (sol nu) / de hauteur (MNS moins MNT).
- **OSM** : OpenStreetMap, carte collaborative. **BAN** : base nationale d'adresses.

| Source | Ce qu'on en tire | Niveau de détail réel | Lien |
|---|---|---|---|
| BD TOPO (IGN) | emprises de bâtiments + hauteur, routes, voies ferrées, équipements ; version 3.5 | « métrique », échelles 1:5 000 à 1:50 000 ; pas de chiffre sur la précision de la hauteur trouvé `[?]` | [data.gouv BD TOPO](https://www.data.gouv.fr/datasets/bd-topo-r/), [fiche Apur](https://geocatalogue.apur.org/catalogue/srv/api/records/51355340-b819-47e0-92e1-05548c8d559e) |
| Licence BD TOPO | Licence Ouverte Etalab 2.0 (une fiche signale des mentions contradictoires : vérifier) | | [fiche Lorient](https://geocatalogue.lorient-agglo.bzh/les-donnees-isogeo/Constructions-surfaciques-BD-TOPO-de-Lorient-Agglomeration/22b821d0d6a24ea4a2c26b579075a68c) |
| LiDAR HD (IGN) | nuage de points classé : sol, 3 niveaux de végétation, bâtiment, eau, tablier de pont, sursol pérenne… (11 classes) | cible 10 impulsions/m² (5 au-dessus de 3 200 m) ; précision visée 10 cm en altitude, 50 cm en plan | [data.gouv LiDAR HD](https://www.data.gouv.fr/fr/datasets/lidar-hd/), [IGN atelier 2025](https://www.openig.org/sites/default/files/2025-12/IGN-ATELIER%20LIDAR-2025.pdf) |
| Classification LiDAR | hybride : algos géométriques + BD TOPO + prédictions IA | pas de taux de réussite par classe publié (trouvé) | [exemple Isère](https://www.data.gouv.fr/datasets/semis-de-points-lidar-hd-classe-isere-2021-2022/informations) |
| MNS / MNH LiDAR HD | grille de hauteurs, dalles 1 km x 1 km, pas de 50 cm, GeoTIFF (~24 Mo/dalle) | zones sensibles (ZICAD) masquées | [MNS](https://www.data.gouv.fr/datasets/mns-lidar-hd/), [MNH](https://www.data.gouv.fr/datasets/mnh-lidar-hd-ign-2025) |
| OSM | trottoirs, passages piétons, escaliers, largeur si renseignée | très variable ; en France les trottoirs sont souvent absents ou dessinés partiellement, débat ouvert sur la façon de les dessiner | [wiki highway](https://wiki.openstreetmap.org/wiki/Key:highway), [discussion](https://lists.openstreetmap.org/pipermail/accessibility/2021-January/000443.html) |
| OSM, détails | `highway=steps` (+ `step_count`), `highway=crossing` / `footway=crossing`, `footway=sidewalk` ou `sidewalk=*` sur la route, `width=` | | [wiki highway](https://wiki.openstreetmap.org/wiki/Key:highway) |
| Cheminements Paris | exemple de graphe piéton OSM, ne couvre pas tout l'exigence légale LOM | | [data.gouv](https://www.data.gouv.fr/datasets/cheminements-pietons-dans-paris-dapres-openstreetmap/informations) |
| Overture | emprises de bâtiments, hauteurs « quand disponibles » ; couche bâtiments sous ODbL (clause de partage : à lire) | hauteurs partielles ; en France probablement dérivées d'OSM `[?]` | [release notes](https://overturemaps.org/overture-december-2023-release-notes/), [docs](https://docs.overturemaps.org/release/page/15) |
| BDNB (CSTB) | 32 M de bâtiments, croisement de ~20 bases ; usage, énergie… ; champ « nombre d'étages » à vérifier `[?]` | version open data = sous-ensemble ; 3 mises à jour/an | [data.gouv BDNB](https://www.data.gouv.fr/fr/datasets/base-de-donnees-nationale-des-batiments/) |
| Cadastre, BAN, RPG, base permanente des équipements | parcelles, adresses, parcelles agricoles, équipements publics | non vérifiés dans cette passe : licence Etalab probable, géométrie 2D seulement `[?]` | à vérifier |

### Ce qu'on peut automatiser pour des déplacements piétons

- **Boîtes de bâtiments** : directes depuis BD TOPO (emprise + hauteur). Fiable pour l'extérieur.
- **Zone praticable approximative** : emprise de la rue (route BD TOPO ou espace entre bâtiments) moins les bâtiments. Donne un « vide entre façades », pas un trottoir.
- **Sol et obstacles** : le LiDAR distingue sol / végétation / bâti, donc on peut repérer arbres, ponts, murets hauts. Les petits obstacles (mobilier, poteaux) sont à la limite de 10 pts/m² `[?]` (déduction, non mesurée).
- **Trottoirs** : par OSM quand présents. Sinon la détection auto depuis des photos aériennes existe (outil [Tile2Net](https://www.its.dot.gov/research-areas/artificial-intelligence/transportation-planning-design/projects/curbs-aid-intelligent-design/), entraîné sur villes nord-américaines), mais précision moyenne : 40 % global vs OSM, 75 % dans les zones bien annotées ; moins bon hors Amérique du Nord ([étude Amsterdam](https://bnaic2024.sites.uu.nl/wp-content/uploads/sites/986/2024/11/Where-Not-to-Cross-the-Street.pdf)).
- **Largeur de rue** : calculable en 2D (distance façade à façade), donc fiable à ±1 m environ `[?]` ; largeur de trottoir réelle : aucune source open fiable trouvée, à traiter comme estimée.
- **Portes d'entrée** : l'OSM a des `entrance=*` dans certaines villes, pas partout `[?]`.
- **Escaliers / dénivelé** : MNT 5 m trop grossier pour des marches ; les `steps` OSM sont la seule source directe.

Honnêteté d'affichage : « emprise réelle, trottoirs OSM, reste estimé » suffit.

## 3. Génération de plans d'intérieur

Glossaire : un **modèle génératif** produit un résultat plausible à partir d'exemples appris ; il ne connaît pas le bâtiment réel. **Diffusion** : famille de modèles qui partent de bruit et le raffinent jusqu'à obtenir un plan.

| Travail | Idée | Limites relevées | Lien |
|---|---|---|---|
| Graph2Plan (2020) | retrouve un plan existant dans une base, selon contour + graphe des pièces | une seule sortie par entrée, post-traitement lourd | [synthèse](https://arxiv.org/pdf/2411.12279v3) |
| HouseGAN++ (2021) | réseau GAN, plans vectoriels avec portes | ancien, souvent sans meubles ni fenêtres | [synthèse](https://arxiv.org/pdf/2411.12279v3) |
| HouseDiffusion (CVPR 2023) | diffusion sur les coins de pièces et de portes | pièces qui se chevauchent ou laissent des trous ; il faut donner types et nombre de pièces ; sans contrainte de contour | [paper](https://ar5iv.labs.arxiv.org/html/2211.13287) |
| ChatHouseDiffusion (2024) | idem + texte libre via un LLM, édition locale | mêmes défauts : pièces déconnectées, pas de post-traitement | [paper](https://arxiv.org/html/2410.11908v1) |
| Travaux 2025-2026 | diffusion avec contrainte de contour (compromis réalisme / diversité), Gaussian Room Embeddings | résultats chiffrés par les auteurs seulement | [2602.01949](https://arxiv.org/pdf/2602.01949), [GRE-Diff](https://arxiv.org/pdf/2607.08086) |

- Maturité : recherche, pas produit. Entraînés surtout sur de petits logements (jeux type RPLAN, plans américains/asiatiques) `[?]` ; très loin d'un ERP (école, gare, commerce) français.
- Aucune source trouvée qui mesure la conformité à la réglementation incendie (largeur d'issues, distances) des plans générés. Donc **risque d'inventer des murs, des couloirs trop étroits, des portes absentes** : réel, non quantifié.
- **Détection de fenêtres / portes sur façade photo** : rien de concluant trouvé dans cette passe (recherche à refaire sur les jeux de données de façades) `[?]`. Utile seulement pour deviner les niveaux et les ouvertures extérieures.
- **Extraction depuis plans papier scannés** : possible. Jeu de référence CubiCasa5K (4 200 plans d'entraînement). Un papier de 2023 donne un IoU (recouvrement) de 0,74 en masque mais 0,53 après vectorisation, 0,78 à 0,80 avec sa méthode ([paper](https://arxiv.org/pdf/2306.01642) ; autres [1](https://arxiv.org/pdf/2408.01526), [2](https://arxiv.org/pdf/2609.25615)). Chiffres des auteurs. Il faut quand même que le client fournisse un plan : c'est du L3, pas du L2.
- **Alternative sans IA générative** : gabarits par usage (couloir central + pièces, grille d'escaliers) paramétrés par l'emprise. Moins impressionnant, plus honnête et plus contrôlable `[?]` (jugement, non sourcé).

### Utilité pour une évacuation « honnête »

- Les simulations d'évacuation sont sensibles à la topologie des plans et à la politique de routage ([2026](https://www.frontiersin.org/journals/built-environment/articles/10.3389/fbuil.2026.1850477/abstract)) ; la validation est un sujet central ([revue](https://www.lovreglio.info/uploads/1/1/4/4/11442559/validation_and_verification.pdf)).
- Donc un plan estimé donne une **illustration du comportement de foule** (goulots plausibles, effet d'un nombre de sorties), pas un **temps d'évacuation réglementaire**.
- Bandeau obligatoire proposé : « Plan estimé, non réel. Résultats indicatifs. » avec murs estimés en pointillés ou couleur distincte.

## 4. Reconstruction depuis photos (Gaussian splatting, etc.)

Glossaire : **NeRF** et **Gaussian splatting (3DGS)** reconstruisent une scène à partir de nombreuses photos, en la représentant par un champ de lumière ou des millions de petites « taches » 3D. Très beau à regarder ; la géométrie propre (murs droits) n'est pas leur point fort.

- **Calcul** : méthodes ville entière actuelles : 4 à 7 h sur plusieurs GPU pour les références CityGS-X / Momentum-GS, 30 à 40 min annoncées par [BlitzGS (mai 2026)](https://arxiv.org/pdf/2605.13794), chiffres des auteurs, sur jeux de données standard et multi-GPU. [A LoD of Gaussians](https://arxiv.org/html/2507.01110v1) : 60 M+ gaussiennes sur GPU grand public 24 Go. [CityGaussian](https://www.arxiv.org/pdf/2404.01133v2) : découpage en blocs.
- **Géométrie** : le passage « nuage de gaussiennes » à « maillage utilisable » reste difficile quand les vues sont rares ([Sparse2DGS](https://arxiv.org/pdf/2504.20378), [MeshSplat](https://arxiv.org/html/2508.17811v2)). Rien trouvé sur la qualité en rue avec photos communautaires inégales `[?]`.
- **Images ouvertes** :
  - Panoramax : instance IGN en licence ouverte Etalab 2.0 selon [Wikipédia](https://en.wikipedia.org/wiki/Panoramax) et [linuxfr](https://linuxfr.org/users/fernando-2/liens/la-cote-d-or-lance-une-alternative-souveraine-a-google-street-view) ; un exposé FOSDEM 2025 parle de CC BY (source contradictoire : vérifier) ; autres instances souvent CC-BY-SA ; API de type STAC ([doc](https://docs.panoramax.fr/backend/dev/STAC_compatibility/)) ; 14 M d'images, couverture inégale ([Next.ink](https://next.ink/125818/panoramax-lalternative-libre-et-francaise-a-google-street-view/)).
  - Mapillary : CC-BY-SA 4.0 ; KartaView : CC-BY-SA ([Wikipédia Mapillary](https://en.wikipedia.org/wiki/Mapillary), [KartaView](https://en.wikipedia.org/wiki/KartaView)). Conditions d'usage de l'API et usages « entraînement IA » à lire `[?]`.
  - Photos aériennes obliques IGN : non vérifié `[?]`.
- **Verdict** : pour un lieu au hasard, pas assez de photos (couverture rue par rue très variable) et plusieurs heures de calibrage/entraînement avec risque d'échec. Utile au mieux en **visuel** sur un lieu pré-choisi et testé à l'avance. **Pas de la géométrie utilisable** pour la simulation (murs, largeurs). Rappel de la consigne : Google Street View et tuiles Google 3D exclus.
- Aucune source trouvée sur Google Earth Studio / reconstructions chinoises dans cette passe `[?]`.

## 5. Formats et moteurs

Glossaire : **glTF** = format 3D web léger (le « JPEG de la 3D »). **3D Tiles** = glTF découpé en dalles chargées à la demande, pour de grandes zones. **CityGML / CityJSON** = formats de maquettes de ville avec attributs (usage, hauteur) ; CityJSON est la version JSON, plus simple.

| Outil | Rôle | Licence / statut | Lien |
|---|---|---|---|
| 3DTilesRendererJS | affiche 3D Tiles (et glTF) dans three.js, aussi Babylon / React Three Fiber | Apache-2.0, NASA-AMMOS ; Google/Cesium Ion demandent une clé (variable : à nommer côté équipe) | [GitHub](https://github.com/NASA-AMMOS/3DTilesRendererJS) |
| cjio | manipule CityJSON, exporte en .glb | MIT | [GitHub](https://github.com/cityjson/cjio) |
| py3dtiles | LAS/XYZ (nuages de points) vers 3D Tiles ; pas d'OBJ/glTF/CityJSON annoncé | Apache 2 ; dépôt migré sur GitLab | [GitHub](https://github.com/VCityTeam/py3dtiles) |
| cityjson-to-3d-tiles | CityJSON vers 3D Tiles, 3 niveaux de détail | npm, communautaire | [README](https://unpkg.com/@csi-foxbyte/cityjson-to-3d-tiles@0.0.22/README.md) |
| citygml-to-3dtiles | converti seulement les « Building », sans textures, 3D Tiles 1.0 | expérimental | [README](https://github.com/njam/citygml-to-3dtiles/blob/master/README.md) |
| UD-Viz (VCityTeam) | visionneuse web de données urbaines 3D (Lyon) | non précisé ici | [GitHub](https://github.com/VCityTeam/UD-Viz) |
| CesiumJS, deck.gl, MapLibre | globe 3D / couches data / carte ; chargent 3D Tiles ou extrusions de polygones | non vérifié dans cette passe `[?]` | à vérifier |
| Blender-OSM, Kepler.gl, giscus | Blender-OSM : import OSM dans Blender (payant pour certaines options `[?]`). Kepler.gl : carte de données. « giscus » est un module de commentaires GitHub : probablement une confusion de la demande | `[?]` | |

Chemin le plus court imaginable (à valider, pas une décision) : BD TOPO (GeoPackage/GeoJSON) vers extrusion de polygones à la hauteur (script Python ou JS) vers glTF vers three.js. Aucune conversion lourde n'est nécessaire pour L1 : l'extrusion de ~1 000 bâtiments se fait à la volée dans le navigateur. 3D Tiles ne devient utile que pour un quartier entier.
Je n'ai pas trouvé d'outil « BD TOPO vers maillage prêt à l'emploi » tout fait `[?]` (à chercher : dépôts de VCityTeam, Oslandia, IGN).

## 6. Synthèse : trois niveaux de fidélité

| | L1 extérieur seul | L2 extérieur + intérieur estimé | L3 intérieur réel fourni par client |
|---|---|---|---|
| Données | BD TOPO (emprise, hauteur) ; option : LiDAR MNS/MNT, OSM trottoirs et passages | L1 + usage (BDNB/OSM) + gabarit ou modèle de plan | L1 + plan du client (DXF, IFC, PDF scanné, ou plan vectorisé) |
| Dev (ordre de grandeur, mon jugement, non mesuré) | 4 à 8 h pour 1 builder : extrusion + graphe piéton OSM + foule dehors | +8 à 16 h : gabarit par usage (sûr) ou diffusion (risqué, maturité recherche) ; + moteur de foule intérieur | +6 à 12 h : import + nettoyage plan + moteur ; plus si PDF scanné (vectorisation incertaine) |
| Ce que la foule fait | circule dans la rue, entre/sort aux entrées estimées, goulots de trottoir | idem + simule dans un intérieur inventé | simule dans le vrai bâtiment |
| Risque principal | trottoirs absents d'OSM hors grandes villes | murs et issues inventés, mal interprétés | plan client incomplet, formats variés, confidentialité |
| Honnêteté à afficher | « Emprises et hauteurs IGN ; trottoirs OSM quand présents ; le reste est estimé » | « Plan estimé, non réel » en permanence, résultats indicatifs, pas de chiffre réglementaire | « Plan fourni par X, non vérifié par nous » |
| Ce qu'on peut défendre | une couverture France entière, zéro saisie | un aperçu pour avant-projet | un résultat utilisable |

Points qui restent à trancher par l'équipe (questions, pas des choix) :
1. Jury-test : lieu pré-choisi (testé à l'avance) ou lieu vraiment aléatoire à la demande ? (le « au hasard » dégrade surtout les trottoirs)
2. L2 : gabarit simple par usage, ou modèle de diffusion ? Le gabarit est plus honnête et prévisible ; la diffusion est plus « wow » mais peut produire des plans absurdes.
3. L3 : a-t-on un vrai plan client de démo (format DXF/IFC/PDF ?) avant l'événement ?

## 7. Ce qui reste non vérifié

- Précision de hauteur BD TOPO, champ « étages » BDNB, licences exactes cadastre / BAN / RPG / équipements.
- Couverture LiDAR HD France entière à ce jour (état d'avancement du programme) : page IGN officielle non lue (redirigée vers cartes.gouv.fr).
- Logiciels : CesiumJS, deck.gl, MapLibre, Blender-OSM, Kepler.gl non vérifiés ici.
- Détection de fenêtres/portes sur façades photo ; Google Earth Studio ; reconstructions chinoises.
- Compatibilité licence ODbL (Overture bâtiments) avec un produit commercial : à lire par quelqu'un qui décide.
