# 17. Metafore Boétie – St Augustin : géodonnées libres et scène 3D (22/10/2026)

Adresse : 5 rue La Boétie, 75008 Paris. Tout vient de sources libres, sans clé ni appel payant.
Fichiers dans `refuge-data\data\metafore\` (hors git). Script réutilisable : `refuge-data\pipeline\lieu\lieu.mjs`.

## 1. Résultat en trois lignes
- Scène produite : `data\metafore\scene-metafore.json` (82 Ko) et `navgrid-metafore.json` (55 Ko), même format que `wt-proto-jumeau-3d\src\scene\scene.json`.
- Bâtiment extrudé à 15,3 m (BD TOPO), 168 bâtiments, 188 rues, 6 niveaux intérieurs **tous estimés**.
- « Combien de temps pour générer un lieu ? » : **35 s à 60 s de bout en bout à froid, 0,3 s à 2,5 s avec cache**, dont 95 % d'attente d'Overpass. Voir section 5.

## 2. Géocodage
Géoplateforme `data.geopf.fr/geocodage/search` : « 5 Rue La Boëtie 75008 Paris », score 0,97, lat 48,874291, lon 2,318655, identifiant BAN `75108_5194_00005`. Réponse en 0,6 à 0,9 s.
Le point tombe dans l'emprise d'un bâtiment BD TOPO (distance 0 m). Le nom « Metafore » n'apparaît nulle part dans OSM ni la BD TOPO : on ne peut pas prouver par la donnée que ce bâtiment héberge le lieu du hackathon, seulement que c'est celui du numéro 5.

## 3. Contenu réel des données (rayon 150 m, vérifié)
| Source | Contenu | Volume |
|---|---|---|
| OSM Overpass (requête unique) | bâtiments, entrées, portes, voies, indoor, escaliers, ascenseurs, métro | 332 éléments |
| BD TOPO `batiment` | emprises avec `hauteur`, `nombre_d_etages`, `usage_1` | 190 entités (168 gardées après filtre) |
| BD TOPO `parcelle` (couche `CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle`) | parcelles, champ `idu` | 137 |
| BD TOPO `troncon_de_route` | voirie | 34 |
| BD TOPO `construction_surfacique` | rien dans la zone | 0 |

Bâtiment du 5 rue La Boétie :
- BD TOPO `BATIMENT0000000245199886` : hauteur **15,3 m**, **7 étages**, usage Résidentiel + Commercial et services, 1 logement, apparu en 1880, emprise **371 m²**, 17 points. Précision planimétrique 3 m, altimétrique 2,5 m (hauteur interpolée, donc approximative).
- OSM `way/67411562` : `building=apartments`, `building:levels=6`, **aucun nom, aucune adresse, aucun usage détaillé**.
- Contradiction à connaître : 7 étages (IGN) contre 6 (OSM). La scène retient 6 (OSM prioritaire), mais 6 × 3,2 m = 19,2 m dépasse les 15,3 m extrudés : le dernier niveau est au-dessus du toit. À corriger à la main (choisir 5 étages à 3 m, ou 15,3 m / 6).
- **Aucune entrée OSM sur ce bâtiment**, aucun niveau `indoor`, aucun escalier, aucun ascenseur. Seules 6 entrées OSM existent dans le rayon (autres immeubles).
- Voisinage notable (OSM) : église Saint-Augustin, hôtels, Cercle national des armées (9 niveaux), ambassade du Cap-Vert.

Fichiers validés : tous les JSON se relisent, les 4 requêtes WFS rendent `numberMatched` = nombre d'entités (pas de troncature à 5000). La boîte WFS fonctionne en longitude, latitude avec le suffixe `,EPSG:4326`.

## 4. Images géolocalisées (liste d'URL, rien téléchargé) : `data\metafore\run\images.json`
- **Panoramax** (STAC, `api.panoramax.xyz/api/search?bbox=`, sans clé) : 100 résultats (plafond de la requête), dont 4 à moins de 30 m et 10 à moins de 60 m du point. Dates 2025-02 à 2026-09. Licences : CC-BY-SA-4.0 (majorité) et etalab-2.0. Attribution obligatoire, partage à l'identique.
- **Wikimedia Commons** (geosearch rayon 150 m, 40 fichiers) : surtout des plaques de rues et l'église Saint-Augustin (CC BY-SA 2.0 à 4.0, CC0, domaine public). Rien du 5 rue La Boétie lui-même. À ne pas utiliser pour une démo sans afficher auteur et licence de chaque fichier.
- **Mapillary** : l'API répond HTTP 500 sans jeton. Non exploité, aucune clé utilisée. Non disponible dans ces conditions.
- Limite : ces photos ne donnent ni plan intérieur ni texture exploitable sans traitement ; elles servent de référence visuelle pour la façade.

## 5. Temps de génération (mesures réelles, `journal.json` de chaque dossier)
Machine de Titouan, réseau habituel, 22/10/2026 entre 12h et 13h.

| Lieu (rayon 150 m) | À froid (sans cache) | Avec cache | Détail du froid |
|---|---|---|---|
| 5 rue La Boétie | **34,7 s** | **0,3 s** | géocodage 0,7 · BD TOPO 3 requêtes 0,2 à 0,4 · images 0,7 · **Overpass 33,5** · scène 0,05 · grille 0,4 |
| Forum des Halles (48,862 ; 2,347) | **60,8 s** | **2,5 s** | BD TOPO 0,7 à 1 · **Overpass 57,7** · scène 0,4 · grille 2,7 |

- Première version du téléchargement (Python, 5 requêtes Overpass l'une après l'autre) : **203 s**, dont 197 s d'Overpass (32 à 48 s par requête).
- Une autre exécution à froid de la même adresse a pris 49,6 s (Overpass 48 s). La variation est celle du serveur Overpass public.
- Tout ce qui n'est pas Overpass (géocodage, BD TOPO, images, scène, grille) tient en **moins de 5 s** pour 150 m.
- **Pannes constatées** : à deux reprises dans l'heure, Overpass a répondu « at capacity » (HTTP 502/504) : les deux miroirs ont échoué en 60 s. Une requête minuscule (3 entrées) a mis 37 s : la lenteur vient de la file d'attente du serveur, pas de la taille de la requête. Le script bascule alors sur la BD TOPO seule (bâtiments, voirie, parcelles) et le dit dans le journal : scène en 61 s, sans entrées ni intérieur OSM, avec une seule entrée estimée.
- Le chiffre à annoncer : « une minute à froid, quelques secondes avec cache », sous réserve d'un Overpass disponible. Ne pas promettre « moins de 2 minutes » sans cache préchauffé : en cas de saturation on ne dispose que de la BD TOPO.

## 6. Ce que fait `lieu.mjs` et ce qui a été sacrifié
Commande : `node pipeline\lieu\lieu.mjs --adresse "5 rue La Boétie 75008 Paris" --rayon 150 --nom metafore [--images] [--sans-cache]` (ou `--lat --lon`). Sortie : `scene.json`, `navgrid.json`, `journal.json` (temps par étape), `images.json` avec `--images`.
- Optimisations : une seule requête Overpass au lieu de cinq ; Overpass en course sur deux miroirs (2 requêtes, 60 s maximum) ; géocodage, 3 couches BD TOPO, images et Overpass lancés en parallèle ; cache par hachage de l'URL ; rayon par défaut 150 m.
- Sacrifié : mobilier urbain (arbres, bancs, lampadaires : récupérés dans la première phase, plus demandés) ; pas de `construction_surfacique` ; BD TOPO seule quand Overpass tombe ; Mapillary absent.
- Grille de 0,5 m conservée (360 000 cellules, 0,4 s pour 150 m) : inutile de la grossir.
- Portage : `construireNavgrid` de `navgrid.ts` fige les niveaux 0 à -5 et la boîte du Forum ; je ne pouvais pas le modifier, donc la grille est **réimplémentée en JavaScript** dans `lieu.mjs` (mêmes valeurs : 0 bloqué, 1 praticable, 2 estimé). Les tests de `scene.test.ts` ne tournent pas sur ces fichiers (ils attendent le Forum) ; ils n'ont pas été exécutés. Je les ai remplacés par `data\metafore\verifier.mjs` (format, identifiants uniques, portes sur cellule praticable, connexité, atteignabilité des niveaux).

## 7. Vérification de la scène Metafore (`verifier.mjs`, 15 contrôles sur 15 passés)
- Clés du format `Scene` toutes présentes, sources OSM et IGN citées, identifiants uniques.
- 6 niveaux (0 à 5, altitude n × 3,2 m), tous `estime: true`, avec raison. Rez-de-chaussée : rue documentée, intérieur estimé.
- Chaque niveau intérieur = 371 m² (l'emprise entière, sans cloisons), une composante connexe, tous reliés à la rue par 5 escaliers et 1 ascenseur **supposés** au centre du bâtiment (point le plus éloigné des murs, 7,6 m).
- Entrée : une porte principale **estimée** (point adresse projeté sur la façade, `P-EST-ADRESSE`, 1,8 m) et une sortie rue. Cinq portes sur sept sont posées sur la grille ; les deux autres (immeubles voisins) tombent hors cellule praticable.

## 8. Écarts avec la scène du Forum (à connaître pour la vue 3D)
- Niveaux positifs (0 à 5) au lieu de 0 à -5 ; `etage` = 3,2 m au lieu de 6 m. Les scripts de la vue 3D qui supposent des niveaux négatifs sont à vérifier.
- Clés ajoutées (sur-ensemble du format) : `lieu` (adresse, métadonnées du bâtiment cible), `parcelles`, `cible: true` sur le bâtiment, `estime: true` sur les étages de `interieur`. Les clés d'origine sont intactes ; une lecture stricte qui refuse les clés inconnues échouerait.
- Défaut de la scène du Forum constaté en passant : les textes de `scene.json` sont en double encodage (« IndiffÃ©renciÃ© »). `lieu.mjs` écrit de l'UTF-8 correct.
- Le même script, appliqué au Forum (rayon 150 m), donne 129 bâtiments, 115 portes, 8 niveaux (-5 à 2). Les niveaux -5 et -4 n'y sont pas reliés : l'étape « liaison estimée d'un niveau isolé » de `navgrid.ts` n'a pas été portée. Le Forum reste généré par `generer.ts`.

## 9. Ce qui reste manuel
Rien de l'intérieur n'est automatique. Pour une démo crédible à Metafore : plan réel des étages (visite, plan d'évacuation affiché), position réelle des escaliers et ascenseurs, entrée réelle (photo Panoramax à 30 m), nombre d'étages (6 ou 7), nom « Metafore » ajouté à la main. Tant que cela n'est pas fait, afficher « intérieur estimé ».

## 10. Licences à afficher
© les contributeurs d'OpenStreetMap (ODbL, base dérivée à repartager sous ODbL) ; Source : IGN, BD TOPO et adresse Géoplateforme/BAN (Licence Ouverte 2.0) ; photos Panoramax CC-BY-SA-4.0 ou etalab-2.0 et Commons selon fichier, avec auteur. Usage Overpass : 1 à 2 requêtes par lieu, avec cache, conforme à une démonstration sans scraping.

## 11. Fichiers
`data\metafore\` : `scene-metafore.json`, `navgrid-metafore.json`, `run\` (sortie complète + `images.json` + `journal.json`), `run_froid\` (mesure à froid), `lieux\forum-halles\`, bruts `osm_*.json` et `bdtopo_*.json`, `panoramax.json`, `commons.json`, `geocodage.json`, `telecharger.py` (version séquentielle de 203 s), `verifier.mjs`, caches `cache_lieu\` et `cache_froid\`. Script : `pipeline\lieu\lieu.mjs`.
