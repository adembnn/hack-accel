# Accès aux stations de Châtelet - Les Halles : relier chaque bouche OSM à sa station

Décision débloquée : pour la perturbation C1 (bouche fermée), savoir à quelle station appartient chaque bouche et lesquelles étaient fermées le 19 oct. 2026.

## En deux lignes
Chaque bouche OSM a un équivalent dans le référentiel officiel d'Île-de-France Mobilités (IDFM), qui connaît le numéro de sortie et la station. 42 des 59 bouches OSM sont rattachées à moins de 25 m ; 2 de plus à 44-55 m (même numéro) ; 15 sont hors du périmètre interrogé (Hôtel de Ville, Étienne Marcel, Sébastopol, etc.), donc sans objet pour le Forum.

## Constat important : la fermeture du 19 oct. n'est pas décrite pareil partout
- Presse et RATP (Le Parisien, CNews, actu.fr, Sortir à Paris, 19 oct.) : accès fermés **à partir de 22 h** pour Châtelet (M1, 4, 7, 11, 14), Les Halles (M4) et la gare RER Châtelet-Les Halles (A, B, D) ; République aussi. Couvre-feu 23 h-6 h. Hôtel de Ville, Rambuteau, Pont Neuf, Louvre-Rivoli, Étienne Marcel : pas cités comme fermés.
- Archive ratpstatus : message « Station fermée » visible dès environ 20 h 07 (voir `reports/catalogue-contraintes.md`, point 4). Les deux sources divergent de près de 2 h : à trancher avec le CSV d'incidents avant de l'afficher comme fait.
- Conséquence pour le modèle : au niveau de la **station**, pas de la bouche individuelle. Aucune source ne dit que telle bouche était ouverte et telle autre fermée : toutes les bouches des 3 stations sont marquées `ferme_19oct = true`.
- Rappel : les 3 stations fermées partagent le même ensemble de bouches du Forum (Portes 1 à 8 du RER/métro 4).

## Tableau des accès (IDFM, 33 accès dans 600 m autour de Châtelet)
Colonnes : « Sortie » = numéro IDFM (champ `accshortname`). Équipements : seuls les 8 accès « Portes » du Forum sont documentés (source bonjour-ratp.fr) ; `?` = inconnu (le jeu ouvert IDFM ne contient aucun champ escalator/ascenseur).

| Station (IDFM) | Sortie | Nom de l'accès | Escalator | Ascenseur | OSM (bouches rattachées) | Fermé le 19 oct. |
|---|---|---|---|---|---|---|
| Châtelet | 10 | pl. Ste-Opportune | ? | ? | 602612813 | oui |
| Châtelet | 11 | r. de Rivoli | ? | ? | 677731262, 677731265 | oui |
| Châtelet | 12 | r. Bertin Poirée | ? | ? | 676821344 | oui |
| Châtelet | 13 | r. des Lavandières | ? | ? | 676872599 | oui |
| Châtelet | 14 | r. Saint-Denis | ? | ? | 677034819 | oui |
| Châtelet | 15 | Théâtre du Châtelet | ? | ? | 676795020 | oui |
| Châtelet | 16 | pl. du Châtelet | ? | ? | 676795021 | oui |
| Châtelet | 17 | Théâtre de la Ville | ? | ? | 699897450 | oui |
| Châtelet | 18 | av. Victoria | ? | ? | 698084308 | oui |
| Châtelet | 19 | r. Saint-Martin | ? | ? | 299668084 | oui |
| Châtelet + Châtelet - Les Halles (RER) | 1 | Porte Marguerite de Navarre | ? | ? | 5321652781, 9554596034, 9554596035 | oui |
| Châtelet + Châtelet - Les Halles (RER) | 2 | Forum Porte Berger | oui | non | 3753296381, 9554596030 | oui |
| Châtelet + Châtelet - Les Halles (RER) | 3 | Forum - Pte Lescot | oui | oui | 1713195678, 9554596027, 9554596028 | oui |
| Hôtel de Ville | 1 | r. de Rivoli | ? | ? | 320800100 | non |
| Hôtel de Ville | 2 | r. du Renard | ? | ? | 696674567 | non |
| Hôtel de Ville | 3 | r. de la Coutellerie | ? | ? | 2211556504, 10099270353 | non |
| Hôtel de Ville | 4 | av. Victoria | ? | ? | 697182972 | non |
| Les Halles | 4 | Forum - Pte Rambuteau | oui | non | 1272604556, 9547125104, 11549274675 | oui |
| Les Halles | 5 | Forum - Pte Saint-Eustache | oui | oui | 663713699, 9554596026 | oui |
| Les Halles | 6 | Forum - Pte du Pont Neuf | oui | non | 5954227359 | oui |
| Les Halles | 7 | Forum - Pte du Jour | oui | non | 5913737144 | oui |
| Les Halles | 8 | Forum - Pte du Louvre | oui | oui | 5914444314, 9545578222 | oui |
| Les Halles | 9 | r. Montorgueil | ? | ? | 5321652780 | oui |
| Louvre - Rivoli | 1 | r. de l'Amiral-de-Coligny | ? | ? | 831854851 | non |
| Pont Neuf | 1 | r. de la Monnaie | ? | ? | 676821310 | non |
| Pont Neuf | 2 | quai du Louvre | ? | ? | - | non |
| Pont Neuf | 3 | Pont Neuf | ? | ? | 831854832, 9701911585 | non |
| Rambuteau | 1 | r. Beaubourg | ? | ? | 697571534 | non |
| Rambuteau | 2 | r. Rambuteau | ? | ? | 697571365 | non |
| Rambuteau | 3 | r. Geoffroy l'Angevin | ? | ? | 2003145897 | non |
| Rambuteau | 4 | r. du Grenier Saint-Lazare | ? | ? | 667338297 | non |
| Réaumur - Sébastopol | 3 | r. Saint-Denis | ? | ? | 691614222 | non |
| Étienne Marcel | 1 | Rue de Turbigo | ? | ? | 681294134 | non |

Les Portes du Forum (équipements selon bonjour-ratp.fr) : 1 Marguerite de Navarre (ascenseur + escalators), 2 Berger (escalators), 3 Lescot (ascenseur + escalators), 4 Rambuteau (escalators), 5 Saint-Eustache (ascenseur + escalators), 6 Pont Neuf (escalators), 7 Jour (escalators), 8 Louvre (ascenseur + escalators).

Attention à la numérotation : IDFM numérote 1 à 8 les Portes du Forum, 10 à 19 les sorties du métro Châtelet (OSM `ref` identique). Les panneaux sur place et Wikipedia utilisent d'autres numéros (« sortie 6 Place Sainte-Opportune », « 4 avenue Victoria »). Utiliser le numéro IDFM = `ref` OSM.

## Spécificités des accès
- Gare RER Châtelet-Les Halles : accès par Porte Lescot (3), Porte Berger (2), Porte Rambuteau (4), Porte Marguerite de Navarre (1, grande nouvelle entrée, 4 escalators, 2 escaliers, 2 ascenseurs vers niveaux -3 et -4), Porte Saint-Eustache, Porte du Pont Neuf, Porte du Jour, Porte du Louvre. Dans IDFM, les Portes 1, 2, 3 sont reliées à la fois à Châtelet et à Châtelet-Les Halles RER ; 4 à 9 à Les Halles.
- Ligne 4 « Les Halles » : sorties 4 à 9 (Forum et rue Montorgueil).
- Métro Châtelet (L1, 7, 11, 14, 4) : sorties 10 à 19, de Sainte-Opportune à Saint-Martin, sous la place du Châtelet.

## Méthode
1. API Opendatasoft explore v2.1 (sans clé), jeu `acces` (2 529 accès, champs : nom, n° `accshortname`, lat/lon, sens entrée/sortie) filtré à 600 m de 48.8618 N, 2.3468 E : 33 accès.
2. Jeu `relations-acces` : accès -> zone d'arrêt `zdaid` ; jeu `zones-d-arrets` : `zdaid` -> nom et type (36 relations, 9 zones).
3. OSM : les 59 `railway=subway_entrance` de la bbox déjà téléchargés (`chatelet/data/abords.json`). L'API Overpass publique répondait 502 pendant ma tentative : pas de nouveau téléchargement.
4. Appariement : pour chaque bouche OSM, l'accès IDFM le plus proche. < 25 m = fiabilité forte (médiane environ 8 m) ; 25-60 m avec même numéro de sortie = faible (Porte du Louvre 8, Porte Saint-Eustache 5, nœuds de niveau -3 ou d'ancien tracé). Résultat bouche par bouche : `chatelet/data/osm_vers_station.json`.

## Limites
- Pas d'adresse postale dans le jeu IDFM : le champ `adresse` reprend le nom de l'accès.
- Pas d'escalator ni d'ascenseur par accès dans les données ouvertes. Le jeu « État des ascenseurs » existe mais l'API a refusé l'accès (403). Équipements métro (sorties 10 à 19) à relever sur plan RATP ou à poser par le juré.
- Plusieurs nœuds OSM décrivent une même Porte (niveau 0 et -3, portes multiples) : jusqu'à 3 bouches OSM pour un accès IDFM ; le noeud OSM 1841593352 (niveau -3, sans nom) est à 60 m de Porte Berger : non rattaché.
- Le jeu IDFM a été modifié le 19 oct. 2026 (champ `accchanged`) : il peut refléter un état temporaire.
- 15 bouches OSM hors périmètre (Hôtel de Ville 5 et 6, Beaubourg 4, Turbigo 5, Réaumur, Sébastopol, Sentier, Petits Carreaux, Place Louis Lépine, Rue du Temple, etc.) non rattachées car l'interrogation IDFM s'arrêtait à 600 m ; elles n'appartiennent pas aux 3 stations fermées.
- Le plan de quartier RATP officiel (PDF) n'a pas été trouvé en ligne ouvert ; la numérotation vient des données IDFM et d'OSM, confirmée par bonjour-ratp.fr pour les Portes 1 à 8.

## Sources
- IDFM, Référentiel des arrêts : Accès / Relations accès / Zones d'arrêts : https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/acces/records
- OpenStreetMap (ODbL) via fichier local `chatelet/data/abords.json`.
- Bonjour RATP, Forum des Halles : https://bonjour-ratp.fr/en/lieux/forum-des-halles (sorties 1 à 8 et équipements)
- Wikipedia, Châtelet (métro de Paris) : https://en.wikipedia.org/wiki/Ch%C3%A2telet_(Paris_M%C3%A9tro) (autre numérotation)
- Le Parisien, 19 oct. 2026 (couvre-feu, stations fermées) ; CNews, actu.fr, Sortir à Paris, 19 oct. ; Le Parisien/actu.fr 20 oct. (reconduction)
- Fichiers : `chatelet/data/acces.json`, `chatelet/data/osm_vers_station.json`, `chatelet/data/idfm_acces.json`, `rel.json`, `zda.json`.
