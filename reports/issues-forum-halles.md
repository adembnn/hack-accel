# Sorties et issues du Forum des Halles (décision : lesquelles ajouter au modèle)

Données : `scratchpad/chatelet/data/issues.json` (40 entrées, coordonnées uniquement quand OpenStreetMap les donne). Requête Overpass du 22 oct. 2026, bbox 48.8605,2.3430,48.8640,2.3490.

## En deux lignes
Le modèle a 7 portes ; les sources en montrent 9 portes publiques Westfield + 2 accès métro voisins + au moins 9 issues de secours repérées (dont 3 côté piscine et 1 niveau -2 près du UGC). **Aucune source publique ne donne une largeur ni un nombre d'unités de passage** (0 nœud OSM avec `width`). Les largeurs sont à estimer par le règlement ERP (tableau plus bas), à marquer « estimé ».

## 1. Portes publiques (certitude : source)
| Porte | Niveau | Repère | lat, lon (OSM) | Largeur |
|---|---|---|---|---|
| Porte Lescot | 0 → -4 | rue Pierre Lescot | 48.86162, 2.34778 | inconnue |
| Porte Berger | 0 | rue Berger | 48.86137, 2.34641 | inconnue |
| Porte Rambuteau | 0 | rue Rambuteau | 48.86262, 2.34704 | inconnue |
| Porte du Pont Neuf | 0 (escaliers 19 marches vers -1) | angle rue Berger / rue du Pont-Neuf | 48.86164, 2.34523 | inconnue |
| Porte Saint-Eustache | 0 | rue Rambuteau, près de l'église | 48.86244, 2.34566 | inconnue |
| Porte Marguerite de Navarre | 0, portes coulissantes | place Marguerite de Navarre | 48.86059, 2.34653 | inconnue |
| **Porte du Jour** (hors modèle) | 0 | rue de la Porte du Jour | 48.86318, 2.34388 | inconnue |
| **Porte du Louvre** (hors modèle) | 0 et -3 | devant la Bourse de Commerce, rue du Louvre | 48.86242, 2.34394 (niv. 0) ; 48.86234, 2.34344 (niv. -3) | inconnue |
| **Entrée Canopée** (hors modèle) | 0 | entre le jardin Nelson Mandela et le centre | pas de nœud | inconnue |

Source : page Accès de Westfield (liste officielle des « 7 accès piétons » qui en nomme en fait 9) et OSM `railway=subway_entrance` ref 1 à 9. La Porte du Louvre, la Porte du Jour et l'entrée Canopée manquent au modèle actuel : **à ajouter**, surtout la Porte du Louvre, qui touche le cinéma.
Accès métro voisins (hors Westfield, mais ouvrent sur la rue) : Rue de Turbigo (48.86371, 2.34899) et Rue Montorgueil (48.86285, 2.34659).

## 2. Issues de secours (certitude : source OSM, sans largeur)
| Issue | Niveau | lat, lon | Remarque |
|---|---|---|---|
| 3 issues « clients » (nœuds 5914443920/23/24) | -1 | 48.86236, 2.34427 ; 48.86233, 2.34436 ; 48.86231, 2.34438 | Pied des escaliers vers la rue, côté piscine / Porte du Louvre |
| Issue niveau -2 ouest (5913768893) | -2 | 48.86277, 2.34372 | À côté des escaliers -2 → rue (626410276/277) et de l'emprise UGC |
| Issue « ref 824 » (10054908598) | ? | 48.86201, 2.34319 | Extrême ouest |
| Issue nord (4111880719) | ? | 48.86275, 2.34699 | Près de l'accès Rambuteau |
| 4 sorties rue Berger n° 11, 15, 19, 21 | ? | 48.86108, 2.34729 → 48.86121, 2.34673 | `exit=emergency`, `survey=yes` : relevées sur le terrain |

## 3. Cinéma UGC (niveau -3 / -2) : ce qu'on sait
- OSM : emprise `amenity=cinema` « UGC », niveaux -3;-2, centre 48.86260, 2.34355 (zone ouest, côté Porte du Louvre et piscine).
- **Aucune issue de secours ni aucun escalier de secours étiqueté « UGC » dans OSM ni dans la presse.** Les candidats les plus proches du UGC : escalators Porte du Louvre (-3 → 0, nœuds way 626482711/712), escaliers fixes Porte du Louvre (20 marches), escaliers -2 → rue (626410276/277), escalators ouest -3;-2 (1036049973/974) et les issues du tableau 2.
- Taille : les sources se contredisent (19, 27, 35 ou 37 salles). Presse du 20 oct. : évacuation lundi 19 oct. « en pleine séance » après l'annonce du couvre-feu (Le Parisien, Yahoo). Le chiffre « plus de 3 000 spectateurs » vient du contexte du dépôt (CLAUDE.md), je ne l'ai pas retrouvé dans les extraits lus.
- Parking : un site tiers (naboo.app) dit l'accès voiture « unique par la rue de Turbigo » ; OSM montre en plus les accès Saint-Eustache et Berger. Source faible, à ne pas figer.

## 4. Liaisons verticales (OSM, certitude : source ; largeurs inconnues)
- Ascenseurs : Lescot (-4 → 0), Rambuteau (0 → -3), Porte du Louvre (0 ; -3), Saint-Eustache ×2 (0 ; -2 ; -3), Marguerite de Navarre (-4 ; -3 ; 0).
- Escalators par chaîne : Lescot (-4 → 0, uniquement montants), Rambuteau, Saint-Eustache, ouest, Marguerite de Navarre, Porte du Louvre. Ce sont des tronçons `conveying=forward/backward/yes` : 59 montants, 18 descendants, 11 réversibles sur les 174 `highway=steps` de la zone.
- Escaliers fixes de sortie : Porte du Pont Neuf (19 marches, -1 → 0 ; 32 marches estimées -2 → -1), Porte du Louvre (20), escaliers côté piscine (-1 → 0, 3 volées).
- Attention modèle : un escalator arrêté devient un escalier fixe étroit ; en cas d'incendie ou de panne il n'est pas une issue sûre.

## 5. Estimation des largeurs (règlement ERP, certitude : estimé)
Source : CO 36 et CO 38, arrêté du 25 juin 1980 (Légifrance, SiteSécurité, Agence culturelle Grand Est).
- 1 unité de passage (UP) = 0,60 m, portée à 0,90 m si le dégagement n'a qu'1 UP et à 1,40 m pour 2 UP. Au-delà : n × 0,60 m.
- Nombre de dégagements : 2 jusqu'à 500 personnes, +1 par tranche de 500 au-dessus. Largeur : 1 UP pour 100 personnes (majorée de 1 UP sous 501 personnes).
- Escalier mécanique : 1 UP si 0,80 m entre mains courantes, 2 UP si 1,20 m ; au plus 50 % des escaliers mécaniques comptent dans les dégagements.
- Niveau en sous-sol à plus de 2 m en contrebas : effectif théorique arrondi à la centaine puis majoré de 10 % par mètre au-delà de 2 m (donc le -3 compte plus que son effectif réel).
- Sorties vers l'extérieur : 1 UP pour 300 personnes (guide Grand Est, exemple 1 707 personnes = 6 UP).
- Exemple UGC à 3 000 personnes : au moins 7 dégagements et 30 UP (18 m) ; avec la majoration sous-sol, plus.
- Proposition d'hypothèses pour la maquette : porte à double vantail = 1,40 m (2 UP) ; porte simple de secours = 0,90 m ; escalator = 0,80 ou 1,20 m selon modèle ; escalier de secours = 1,40 m. Toutes marquées « estimé », à confirmer par le directeur du centre.

## 6. Ce qui manque
1. Plan officiel Westfield (PDF/plan interactif) : non récupéré (seule la page Accès texte l'est). Le plan montrerait les issues de secours signalées au public.
2. Largeurs et nombre d'UP réels : le registre de sécurité et le plan de sécurité du Forum (document du gestionnaire, non public).
3. Issues propres au UGC, à la piscine, au Forum des Images, à la médiathèque et au conservatoire : seul un plan d'évacuation (affichage dans le lieu) les donne. Ils ne sont pas dans OSM.
4. Niveaux des issues nord, « ref 824 » et rue Berger : non renseignés.
5. Dossier SemPariSeine / Ville de Paris (permis, notice de sécurité de la Canopée) : recherche web sans résultat exploitable sur les sorties.
6. Précision : OSM est participatif ; ce qui est étiqueté « emergency » peut être une porte de service ou de secours non utilisable par le public.

## Recommandation
Ajouter au modèle : Porte du Louvre, Porte du Jour, entrée Canopée, les 3 issues -1 et l'issue -2 près du UGC, les escalators/escaliers Porte du Louvre. Pour les 4 sorties rue Berger et les issues sans niveau : ajouter en « estimé, niveau 0 ». Pour le UGC, demander un plan d'évacuation au directeur plutôt que d'inventer les issues.

## Sources
OpenStreetMap via Overpass (ODbL) ; westfield.com/en/france/forumdeshalles/access ; Légifrance (CO 34 à CO 42) ; sitesecurite.com ; culturegrandest.fr ; leparisien.fr et fr.news.yahoo.com (20 oct. 2026) ; naboo.app ; sortiraparis.com.
