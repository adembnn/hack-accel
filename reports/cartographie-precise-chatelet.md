# Cartographie précise de Châtelet-Les Halles : sources alternatives, testées le 22 oct. 2026

Décision débloquée : par quelle source rendre le jumeau 3D « précis » au niveau du Forum, quand OSM est pauvre aux niveaux -1/-2. Scripts dans `reports/maquettes/commun/cartographie/` (données générées ignorées par git).

## Version simple
Le plan interactif que Westfield affiche sur son site n'est pas une image : c'est un modèle de carte complet, servi à tous les visiteurs par un prestataire (Visioglobe). Il contient les boutiques nommées niveau par niveau, un graphe de cheminements, les escalators et ascenseurs. Je l'ai téléchargé, calé sur notre scène (72,7 % de ses points de passage tombent dans nos espaces OSM du bon niveau), et ses escalators coïncident avec ceux d'OSM à 5,6 m près. C'est la meilleure source trouvée, **mais elle appartient à Unibail-Rodamco-Westfield / Visioglobe, sans licence ouverte** : on s'en sert pour contrôler et compléter en interne, on ne la republie pas, et on ne la présente pas comme « donnée ouverte ».

## 1. Sources classées (ce qu'elles ajoutent, effort, droits)

| # | Source | Ce que ça ajoute (mesuré) | Import / effort | Droits |
|---|---|---|---|---|
| 1 | **Plan Westfield = Visioglobe** (`mapserver.visioglobe.com/.../map.json`, 5,6 Mo) | Niveaux 0 à -4 ; 210 polygones de boutiques/espaces (dont 110 nommés au -3, 26 au -2, 19 au -1, 12 au -4, 20 au 0) ; 1 151 nœuds et 2 896 arêtes de cheminement ; liaisons escalator/ascenseur/escalier par couple de niveaux ; maillage 3D des emprises par niveau ; géoréférencé (UTM 31N) | Script fait (`westfield_visioglobe.py`), 1 min d'exécution. Reste : intégrer les polygones comme « boutiques » dans `build_scene.py` (2-3 h) | **Privé** (URW/Visioglobe). Contrôle interne seulement. Demander l'accord à URW si on veut le montrer |
| 2 | **IDFM `acces` + `relations-acces`** | 26 accès dans 450 m, numéro, nom, lignes (19 pour Châtelet / Les Halles) | Script fait (`acces_idfm.py`) | ODbL, attribution |
| 3 | **Panoramax** (API publique, CC-BY-SA) | ≥ 1 000 photos dans la zone (limite de la requête atteinte), 706 de 2025 ; 362 ont leur position dans un espace OSM souterrain (GPS intérieur peu fiable) : vues réelles des couloirs, signalétique, issues | Pas de plan exploitable directement ; sert de vérité terrain à regarder (1 h pour trier les prises au -3/-4) | CC-BY-SA, citable |
| 4 | OSM Overpass frais | Aucun changement notable : voir §4 | Script fait (`osm_comptage.py`) | ODbL |
| 5 | GTFS `pathways.txt` (recherche précédente) | 175 cheminements chiffrés, sans niveaux | Test de cohérence de distances | ODbL |
| 6 | Plans d'évacuation photographiés sur place | Issues UGC, niveaux -1/-2 | 2-3 h terrain | Usage privé |

Testés et sans apport : Wikimedia Commons (500 fichiers géolocalisés à 400 m, un seul « panneau direction sortie », aucun plan) ; recherche presse/architectes (Berger/Anziutti, RATP : textes et images illustratives, aucun plan de niveau vectoriel ; une seconde recherche web a été bloquée par une limite d'usage de l'outil) ; transport.data.gouv.fr « cheminements piétons » (recherche API renvoie 807 jeux sans rapport direct ; Châtelet non confirmé, non téléchargé) ; plan RATP de surface déjà jugé raster.

## 2. Westfield / Visioglobe : ce qui a été fait

Trouvé en ouvrant la page `.../forumdeshalles/plan` dans le navigateur intégré et en listant les requêtes réseau : le script de la page charge `descriptor.json` puis `map.json` (aucune clé, un en-tête Referer suffit). Le champ `useMappedInMapFeature` de la page est faux : le prestataire est bien Visioglobe, pas Mappedin.

Étages : `outside`, `B1-LL4` (-4), `B1-LL3` (-3), `B1-LL2`, `B1-LL1`, `B1-UL0` (0). Les couples de niveaux de `extra_data` confirment la numérotation.

Recalage (sortie réelle) :
```
recalage : rotation 20.22 deg, translation (-304, -52) m ; 72.7% des 1116 noeuds de cheminement
tombent a moins de 3 m d'un espace OSM du bon niveau
```
Les paramètres de géoréférencement du fichier (`geo_xref`, `pixel_xref`) ne suffisent pas : leur point de référence tombe à environ 60 m de l'ajustement. Je les ai donc remplacés par un ajustement par recouvrement avec OSM (angle fixé à 20,22° du fichier, translation cherchée sur ±27 m). Réserve : l'ajustement est sensible à l'angle (19° à 20,75° donnent 72,5 % à 72,9 %), donc le décalage résiduel est de l'ordre de plusieurs mètres, pas du décimètre. Comparer avec une vérification terrain avant toute affirmation de précision.

Comparaison avec la scène (sortie réelle) :
```
niveau | boutiques Westfield (dont nommees) | espaces OSM (dont nommes) | centre de boutique dans un espace OSM
 -4 | 15 (12)  | 104 (28) | 9/15
 -3 | 126 (110) | 81 (24) | 31/126
 -2 | 27 (26)  | 67 (17)  | 8/27
 -1 | 24 (19)  | 64 (15)  | 5/24
  0 | 22 (20)  | 57 (18)  | 8/22
liaisons verticales : n | apparies < 10 m | ecart median m
escalator | Westfield 18 (OSM 107) | 15/18 | 5.6
lift      | Westfield 22 (OSM 17)  | 12/22 | 8.8
stairs    | Westfield 1 (OSM 103)  | 0/1   | 11.4
```
Lecture : au niveau -3 (la « place basse » commerciale), OSM a 24 espaces nommés quand Westfield en a 110 ; 31 centres de boutiques sur 126 seulement tombent dans un espace OSM, donc les boutiques ne sont pas dessinées dans OSM (ce n'est pas un défaut de recalage : 15 escalators sur 18 s'apparient à moins de 10 m). Westfield ne couvre que la galerie marchande : 18 escalators contre 107 dans OSM, car le reste est la gare. Les ascenseurs (22 liaisons contre 17 objets) comptent chaque trajet entre deux niveaux, pas chaque cabine.

Noms que Westfield apporte aux niveaux pauvres d'OSM : -1 (H&M Home, Sandro, Lacoste, FNAC...), -2 (Muji, Darty, Zara Woman, Pull & Bear, H&M, Pharmacie...). Le cinéma UGC (id `RA1`) est au niveau -3 avec son polygone.

**Ce que le fichier ne donne pas** : sens des escalators (les liaisons sont bidirectionnelles ; deux modèles 3D « Up/Down » seulement), escaliers (1 seule liaison), issues de secours, murs et cloisons (maillage = emprises extrudées de 2,4 m, pas de murs fins), parkings, quais RER/métro.

## 3. IDFM : table accès / lignes / écart avec la scène

Commande : `python acces_idfm.py` (extrait). Repère : origine 48.8620, 2.3470 ; x est, z sud ; projection équirectangulaire. 26 accès IDFM dans 450 m, 59 bouches dans la scène. Zones : 42587 = Châtelet, 45102 = Châtelet - Les Halles, 417675 = Les Halles (noms vérifiés dans `zones-d-arrets`). Les 19 accès de ces trois zones :

| n° | Nom IDFM | Lignes | Zone | x, z (m) | Bouche scène la plus proche | Écart m |
|---|---|---|---|---|---|---|
| 1 | Porte Marguerite de Navarre | M1 M4 M7 M11 M14 RER A B D | 42587/45102 | -48, 173 | Porte Marguerite de Navarre | 9,8 |
| 2 | Forum Porte Berger | idem | 42587/45102 | -49, 68 | Porte Berger | 5,9 |
| 3 | Forum Pte Lescot | idem | 42587/45102 | 60, 35 | Porte Lescot | 7,1 |
| 4 | Forum Pte Rambuteau | M4 | 417675 | -5, -62 | Porte Rambuteau | 6,7 |
| 5 | Forum Pte Saint-Eustache | M4 | 417675 | -107, -92 | Porte Saint-Eustache | 14,4 |
| 6 | Forum Pte du Pont Neuf | M4 | 417675 | -139, 32 | Porte du Pont Neuf | 12,5 |
| 7 | Forum Pte du Jour | M4 | 417675 | -233, -129 | Porte du Jour | 4,8 |
| 8 | Forum Pte du Louvre | M4 | 417675 | -277, -31 | Porte du Louvre | 17,7 |
| 9 | r. Montorgueil | M4 | 417675 | -37, -89 | Rue Montorgueil | 8,0 |
| 10 | pl. Ste-Opportune | M1 M4 M7 M11 M14 | 42587 | -4, 269 | Place Sainte-Opportune | 8,3 |
| 11 | r. de Rivoli | idem | 42587 | -57, 310 | Rue de Rivoli | 5,1 |
| 12 | r. Bertin Poirée | idem | 42587 | -142, 296 | Rue Bertin Poirée | 8,3 |
| 13 | r. des Lavandières | idem | 42587 | -65, 336 | Rue des Lavandières | 8,8 |
| 14 | r. Saint-Denis | idem | 42587 | 10, 373 | Rue Saint-Denis | 6,6 |
| 15 | Théâtre du Châtelet | idem | 42587 | -19, 460 | Théâtre du Châtelet | 13,3 |
| 16 | pl. du Châtelet | idem | 42587 | 22, 481 | Place du Châtelet | 6,8 |
| 17 | Théâtre de la Ville | idem | 42587 | 64, 493 | Théâtre de la Ville | 6,3 |
| 18 | av. Victoria | idem | 42587 | 126, 520 | Avenue Victoria | 7,3 |
| 19 | r. Saint-Martin | idem | 42587 | 173, 539 | Rue Saint-Martin | 5,4 |

Sortie globale : `ecart median 7.9 m, max 17.7 m, >10 m : 7/26` (sur les 26 accès, dont 7 hors du Forum : Étienne Marcel, Pont Neuf, Louvre-Rivoli, Hôtel de Ville, sans lignes attribuées par construction). Sur les 19 accès de Châtelet : médiane 7,3 m, max 17,7 m, 4 au-dessus de 10 m. **Biais systématique** : les bouches de la scène sont en moyenne à +6,1 m en x (est) et -2,0 m en z par rapport aux points IDFM. Deux explications possibles, non départagées : OSM place la bouche en haut de l'escalier, IDFM un point de rue ; ou un décalage global de la scène. À trancher avec une photo satellite ou un relevé.

Limites : les lignes sont déduites de la zone d'arrêt (les accès 1 à 3 touchent RER et métro, pas distinguables par accès) ; les noms de la scène sont déjà ceux d'IDFM, donc l'appariement par nom serait exact, l'écart ici est purement positionnel.
Correctif fait dans le script : fichier écrit en UTF-8 (premier jet en cp1252, caractères cassés).

## 4. OSM Overpass frais (bbox 48.8600,2.3440,48.8640,2.3500)

Commande : `python osm_comptage.py`. Résultat : 1 625 éléments ; escalators 94 (conveying), ascenseurs 16 (`highway=elevator`), escaliers 80, portes/entrées 254, `indoor=*` : area 68, room 84, corridor 61, yes 56, wall 17. Par niveau (tag `level` simple) : -1 : 18 espaces ; -2 : 24 ; -3 : 43 ; -4 : 52 ; -5 : 8. Comparé à la scène (334 espaces, 107 escalators, 17 ascenseurs, 528 portes) : même ordre de grandeur, aucune évolution depuis la construction de la scène. Les écarts de comptage (94 contre 107) viennent de la façon de compter (objets à plusieurs niveaux), pas d'un manque. Vérification visuelle `indoorequal.org` non faite.

## 5. Plan de mise en œuvre recommandé
1. Garder IDFM comme preuve des accès (fait, script). Corriger/valider le biais de 6 m est.
2. Utiliser Westfield comme calque de contrôle et de complément interne pour les niveaux -1 à -3 : ajouter les boutiques nommées (polygones) à la scène, avec un champ `source: "plan Westfield (contrôle interne)"`. Décision à prendre par Adem : avoir l'accord d'URW avant de montrer ces polygones au jury, ou ne les utiliser que dans la simulation sans les afficher.
3. Panoramax : regarder les prises du -3/-4 autour du cinéma UGC pour trouver les escaliers de secours.
4. Ne pas dire « fidèle aux plans officiels ».

## 6. Ce qui reste impossible sans photos sur place
- Escaliers de secours du cinéma UGC et issues de chaque salle : absents d'OSM, absents du plan Westfield (1 escalier seulement). Panoramax peut aider, pas garantir.
- Sens réel des escalators (montée/descente selon l'heure) : aucune source ouverte.
- Murs, cloisons et portes des boutiques à l'échelle du mètre ; le maillage Westfield donne des emprises, pas des murs.
- Parkings, locaux techniques, quais RER/métro détaillés : hors périmètre du plan commercial.
- Précision absolue du recalage Westfield : mesurée à ~5-9 m (escalators/ascenseurs), pas mieux, tant qu'aucun point de contrôle terrain n'est pris.

## 7. Limites de cette recherche
Non fait : plan RATP PDF (Cloudflare), jeu « cheminements piétons » (Châtelet non confirmé), indoorequal, essai Mapillary (jeton requis), inspection des tuiles Panoramax. La recherche web a été limitée (un outil a atteint sa limite d'usage). Aucune de ces données n'a été committée ; rien n'a été modifié dans `chatelet-3d/`.
