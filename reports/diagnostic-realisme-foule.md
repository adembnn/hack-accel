# Diagnostic du réalisme de la foule (maquette 3D Châtelet, 22 oct.)

Décision débloquée : quels défauts corriger, dans quel ordre, avec quelle correction, avant de lancer les lots.
Mesures faites dans un vrai Chrome (rendu logiciel, 1400×860) sur `reports/maquettes/chatelet-3d/`, simulation avancée à la main par pas de 0,1 s,
3 200 personnes, une seule tirée aléatoire (marge : quelques points). Aucun fichier modifié. Les chiffres sont des mesures, sauf mention « calculé ».

## Version simple
Adem a raison sur les deux points. Les gens « volent » parce que **près de 3 personnes sur 10 sont dessinées là où aucun sol n'existe** : la grille de
marche et le dessin du Forum ne disent pas la même chose (deux sources de vérité). Les collisions entre personnes, elles, tiennent (moins de 0,3 %
de chevauchements) : ce qui manque, c'est que la foule **traverse des choses dessinées** (façades de boutiques, escalators, mobilier) et qu'elle va **12 fois
trop vite** à l'écran pendant l'évacuation. Le reste est le look « jouet ».

## Classement (gravité pour la démo)

| # | Défaut | Mesure | Gravité | Effort |
|---|---|---|---|---|
| 1 | Personnes sans sol dessiné | 27,6 % (calme), 30 % (évac. 30 s) | critique | M |
| 2 | Évacuation à ×12 du temps réel | 0,2 s simulée par image | critique | S |
| 3 | Façades de boutiques traversées | 3 247 franchissements en 90 s, 42 % des personnes | haute | M |
| 4 | Escalators : lien ≠ objet dessiné | 7,4 % inversés, 40 % des passagers hors de la boîte | haute | M |
| 5 | Statues : cinéma debout, files, gris d'attente | 60,6 % immobiles (calme) | haute | S/M |
| 6 | Silhouette « jouet », sans ombre ni animation | 52 triangles, rebond mort | haute | L |
| 7 | Ascenseurs : cabine figée, débit faux | 2,0 pers./s au lieu de 0,6 | moyenne | S |
| 8 | Passagers d'escalier qui se traversent | 27 paires < 0,48 m | moyenne | S |
| 9 | Mobilier posé au hasard, traversé | 26 personnes dedans | moyenne | S |
| 10 | Demi-tours et virages secs | 0,40 % des pas, 2,4 demi-tours/pers./min | moyenne | M |

## 1. « Les personnes volent » : sols absents ou à la mauvaise hauteur (critique)
**Mesure (cases de grille praticables, niveaux −1 à −5, 90 668 cases)** : 66 448 (73,3 %) ont un sol dessiné à la bonne hauteur ; **24 220 (26,7 %) non**.
- 8 178 (9,0 %) : polygone au niveau **fractionnaire** (−3,5, −2,5, −0,75…) dessiné entre deux étages. Exemple : −3,5 est dessiné à y = −46,2 m, la grille le range au niveau −4 (y = −52,8 m), donc les personnes flottent à 6,6 m. 7 716 cases au seul niveau −4.
- 3 746 (4,1 %) : polygone **multi-niveaux** (ex. `[-3,-2]`) dessiné au plus bas seulement, alors que la grille le rend praticable aux deux niveaux. 133 polygones sur 139 concernés sont dessinés ailleurs que là où la grille les met.
- 12 296 (13,6 %) : aucun sol dessiné à ce niveau (dilatation de 1 m de la grille, passages « estimés », zones empilées sans sol propre). Au niveau −4 : 77 % des cases sans polygone sont à plus de 3 m du sol dessiné le plus proche.

**Effet sur les personnes (hauteur dessinée comparée au sol dessiné sous elles, seuil 0,3 m)** :
- calme : 677 flottent (21,8 %) + 178 sans aucun sol dessiné dessous (5,7 %) = **27,6 %** ; évac. 30 s : 687 + 217 = **30,2 %** ; évac. 60 s : 37 % ; évac. 120 s : 28 %.
- niveau −2 (cinéma UGC) : 632 sur 952 flottent (66 %), écart médian **13,14 m** (un étage entier) ; niveau −4 : 105 sur 312 sans sol (34 %).
- 0 personne enfoncée dans un sol (aucun sol dessiné au-dessus d'elles à moins de 2 m). Niveau 0 : écart ≤ 0,2 m (plan de sol à −0,2, chaussée à 0,05) : correct. Rebond : 4 cm, négligeable.
- Capture : `/private/tmp/claude-501/-Users-adem-Accel/538b6413-23c8-47e6-8e95-61722ac1129d/scratchpad/diag/shot1.png` (foule suspendue au-dessus du vide, niveau −2).

**Cause** : `build_navgrid.py:21-27,55-62` (`lvl_list` remplit **tous** les niveaux d'un polygone ; arrondi `floor(v+0,25)`), `build_navgrid.py:76` (dilatation) ; dessin : `index.html:275,279` (`yOf = alt(min(o.l))`, un seul niveau, hauteur brute fractionnaire ; `vis` exclut les `l` > 0) et `index.html:81` (`alt`).
**Correction** : une seule source de vérité. Dans `build_navgrid.py`, exporter la couche « sol » = les cases praticables par niveau (déjà dans `navgrid.json`), et dans `index.html` dessiner le sol **depuis la grille** : rectangles fusionnés par niveau à `alt(niveau)+0,02`, texture choisie par type (couloir/zone/boutique) ; supprimer le dessin par polygone OSM à `index.html:277-280`. Garder les polygones OSM seulement pour les murs. Fichiers : `index.html`, `build_navgrid.py`. Effort M.

## 2. Vitesse d'affichage : ×12 pendant l'évacuation (critique)
**Mesure (lecture de code, calculé)** : la boucle `index.html:387` fait 2 `simStep(.1)` par image en évacuation = 0,2 s simulée par image, soit **×12 à 60 i/s** (×6 à 30 i/s) : une marche de 1,3 m/s s'affiche à ~16 m/s (≈ 57 km/h). En calme : `simStep(min(.1,dt*2))` = ×2. Aucun réglage de vitesse dans l'interface. (Cadence réelle non mesurable ici : rendu logiciel à 0,5 i/s.)
**Cause** : `index.html:387`. **Correction** : avancer la simulation de `dt réel × facteur`, facteur 1 par défaut, boutons ×1 / ×2 / ×5 / ×10, sous-pas fixes de 0,05 s ; le chronomètre « T+ » garde le temps simulé. Les plans comparés (`plans.js`, 10 min en accéléré) ne changent pas. Fichier : `index.html`. Effort S.
C'est très probablement la première cause du ressenti « ils volent » dès que la foule bouge.

## 3. Façades de boutiques traversées (haute)
**Mesure** : 92 salles (`room`) dessinées avec des façades pleines de 3,4 m ; **23,8 % des personnes naissent dans une boutique** ; en 90 s (30 s calme + 60 s évac.) : **3 247 franchissements** de façade par 1 349 personnes (**42 %** en traversent au moins une).
**Cause** : `build_navgrid.py:55-62` (`room` est praticable), `index.html:281` (`wallsGeo(rooms,3.4)` sans porte). 0 centre de personne hors grille : la simulation respecte sa grille, c'est la grille qui est trop permissive.
**Correction** : `room` non praticable, sauf (a) pièces du cinéma UGC et (b) une porte OSM à ≤ 2 m (ouvrir alors 2 m de passage dans la grille et dans `wallsGeo`) ; faire naître les clients dans couloirs et zones. Fichiers : `build_navgrid.py`, `index.html`, `sim.js:36` (apparition). Effort M.

## 4. Escalators et escaliers : lien de grille ≠ objet dessiné (haute)
**Mesure (149 liens escalator/escalier, appariés à l'objet dessiné le plus proche)** :
- **11 liens inversés** (7 escalators) : le haut du lien est au bout bas du dessin. Exemple (lien 43, −2 → −3) : haut de grille (−106,5 ; −39,5), haut dessiné (−116,2 ; −35,4). Les 3 passagers relevés finissent à y = −39,6 sur le sol, sans escalator dessous (capture : `…/scratchpad/diag/shot2.png`).
- écart entre bout de lien et bout dessiné : médiane 0,4 m, p90 4,1 m, max 15,7 m ; 27 liens > 3 m.
- passagers hors de la boîte de l'escalator (> 0,8 m de l'axe) : **760 sur 1 886 (40 %)** ; > 3 m : 130 (7 %).
- pente dessinée : médiane **58°**, 134 liens sur 149 > 45° (réel : 30-35°), car un étage fait 13,2 m (`spread` 2,2 × 6 m) pour 8-10 m de course. Vitesse apparente 0,75 m/s médiane (correcte).
- niveaux fractionnaires : 1 lien sur 149 avec décalage vertical > 1 m (6,6 m).
**Cause** : `build_navgrid.py:104-109` (essaie (A,B) puis (B,A), `snap` jusqu'à 6 m), `index.html:264,299` (haut = `pts[0]` toujours), `sim.js:89` (trajet en ligne droite du point de départ au centre de case d'arrivée).
**Correction** : (a) dans `build_navgrid.py`, orienter le lien comme le dessin (haut = `pts[0]`) et écrire dans le lien les deux extrémités exactes (x, z) ; (b) dans `sim.js:89`, trajet en 3 temps : marche jusqu'au bout du lien, glissement le long du segment dessiné (position et hauteur interpolées entre les extrémités dessinées), sortie ; (c) décision à prendre : `spread` par défaut à 1 (6 m par étage, pente ~30-45°) et 2,2 seulement en vue éclatée. Fichiers : `build_navgrid.py`, `sim.js`, `index.html:81`. Effort M.

## 5. Statues : immobilité (haute)
**Mesure** : calme : **60,6 % immobiles** (< 0,1 m/s) = 1 741 spectateurs UGC debout figés (`a.vx*=.5` à chaque pas) + 140 pauses. Évacuation à 30 s : 50 % (46 % attendent leur délai log-logistique, légitime mais affiché en **gris uniforme** `0x8E928F`, `sim.js:92`) ; à 60 s, 441 en attente sur 2 562. Parmi ceux qui devraient marcher (60 s) : 21 % à l'arrêt, dont 308 sur 447 en file d'escalier (légitime) et 88 « autres » ; **34 % des actifs avancent de moins de 3 m en 30 s** (vitesse moyenne sur 30 s : médiane 0,29 m/s, p90 1,20) ; 100 sont à plus de 6 m de tout lien (poches : 6-8 pers. agglutinées devant une porte à 11 m, ou personne seule à 65 m de sa sortie, vitesse 0,03).
**Cause** : `sim.js:57` (cinéma figé), `sim.js:92` (gris), `sim.js:73-75` (file aux liens), `sim.js:77` (descente du gradient, minima locaux).
**Correction** : (a) spectateurs : sièges (grille de 0,9 × 1,0 m dans les salles UGC, pose assise = silhouette plus basse) ; (b) l'état « en attente » ne doit pas changer la couleur du vêtement : le montrer par le halo de `individu.js`, légende dans le panneau ; (c) bloqués isolés : si vitesse < 0,1 pendant 5 s hors file, retirer le choix de sortie et un pas aléatoire ; (d) files d'escalator matérialisées (couloir de file) plutôt qu'un amas. Fichiers : `sim.js`, `index.html`, `individu.js`. Effort S/M.

## 6. Rendu des personnes : l'effet « jouet » (haute)
**Mesure** : corps = 2 jambes (tubes à 4 faces, ouverts) + torse (cylindre à 6 faces) fondus en une pièce de **40 triangles** + tête (sphère 6×4) de **12 triangles** ; 0,36 × 0,40 m, 1,76 m pour tous (`ONE`, aucune variation de taille) ; 1 couleur par personne pour jambes + torse (`setColorAt`), 10 couleurs ; pas de bras, pas de texture (`MeshStandardMaterial`, rugosité 0,8) ; **aucune ombre** (`castShadow=false`, `receiveShadow=false`, `shadowMap.autoUpdate=false`) donc aucun ancrage au sol ; **rebond mort** : `walkT` ne bouge que dans `movePeople`, appelé seulement quand `SIM.on` est faux (valeur relevée 7,22 avant et après 6 s de simulation) ; amplitude prévue 4 cm de toute façon ; orientation `atan2(vx,vz)` invisible car le corps est symétrique. À la caméra par défaut (250 m), une personne mesure 8 px de haut sur 2 px de large (calculé). Capture : `…/scratchpad/diag/shot3.png`.
**Cause** : `index.html:346-354` (géométrie, matériaux, ombres), `index.html:355-356` (`walkT`), `sim.js:90` (matrice).
**Correction** : remplacer par un mannequin low-poly (~1 500 triangles) animé : marche par texture d'animation de sommets (vertex animation texture) sur `InstancedMesh`, 3 morphologies, tailles 1,55-1,90 m, 6 tenues texturées, vitesse du cycle liée à la vitesse réelle, immobile à l'arrêt ; ombre de contact (disque flou instancié sous chaque personne, bon marché) ; orientation lissée (rotation max 360°/s). Besoin d'un modèle : voir question 1. Fichiers : `index.html`, `sim.js`, nouveau `mannequin.js`. Effort L.

## 7. Ascenseurs (moyenne)
**Mesure** : débit **2,0 pers./s** pour les ascenseurs (`sim.js:10`, `k.k==='escalator'?1.25:2.0` s'applique aussi aux cabines) alors que le constructeur de grille prévoit 0,6 (`build_navgrid.py:121`) : jusqu'à 40 personnes en même temps dans une cabine de 13 ; 4 liens sur 26 ont une extrémité à plus de 1,2 m de la cage dessinée (écart max 5,8 m) ; cabine **figée** à une hauteur tirée au hasard (`index.html:257`) ; 4 passagers seulement observés en 60 s (l'ascenseur est évité par le coût +20 m).
**Correction** : `sim.js:10` lire `k.debit` du fichier ; capacité 13 par cycle de 20 s ; animer la cabine entre niveaux selon les trajets ; caler la cage sur la case du lien (`build_navgrid.py:118`). Effort S.

## 8. Passagers d'escalier qui se traversent (moyenne)
**Mesure** : sur 60 s, **33 paires de passagers à moins de 0,48 m** (27 sur escalier, 6 sur escalator), distance min 0,35 m. Escalier : débit 2,0 pers./s × 0,55 m/s = un passager tous les 0,275 m (< 0,48 m). Les deux sens utilisent la même droite (`k.free[dir]` séparé), donc ils se croisent sans se voir.
**Correction** : `sim.js:75` débit escalier ≤ 0,55 / 0,48 ≈ 1,1 pers./s par sens, deux couloirs décalés de 0,6 m. Effort S.

## 9. Mobilier posé au hasard (moyenne)
**Mesure** : 401 objets (221 bancs, 101 bacs, 79 bornes) tirés au hasard à chaque reconstruction (`index.html:289-291`) sans lien avec la grille : **26 personnes (1 %)** se tiennent dedans.
**Correction** : tirer le mobilier dans les cases praticables, le marquer non praticable dans `navgrid.json`, ou le placer le long des murs. Effort S.

## 10. Mouvement : demi-tours, virages, tremblements (moyenne)
**Mesures** : vitesses (personnes qui bougent) : calme p10 0,58 / médiane 0,89 / p90 1,14 / max 1,56 m/s ; évacuation p10 0,35-0,50 / médiane 1,04-1,14 / p90 1,51-1,55 / max 2,45 m/s : plausible (cible 1,34 ± 0,26, plafond 1,3× `v0`). Demi-tours > 120° d'un pas à l'autre (sur 0,1 s, personnes > 0,3 m/s) : calme 0,00 % (10 cas), évac. 0-30 s 0,02 %, 30-60 s 0,11 %, 60-150 s **0,40 %** (≈ 2,4 par personne et par minute en foule) ; virages > 45° : 0,04 → 1,4 % ; bascules d'orientation > 90° d'une image à l'autre : 0,15 → 1,8 % (invisibles, corps symétrique).
**Cause** : `sim.js:77` (gradient sur 8 voisins), `sim.js:67` (10 % de changer de sortie toutes les 8 s), `sim.js:80` (force de contact `25·exp((2R−d)/0,08)`, très raide).
**Correction** : lisser la vitesse désirée (filtre 0,3 s), changement de sortie avec hystérésis (écart de coût > 15 %), adoucir le contact (portée 0,12). Effort M.

## 11. Collisions : ce qui tient et ce qui n'est pas lisible
- **Tient** : paires < 0,48 m : calme **0** sur 3 103 ; évac. 30 s 5 paires (min 0,00 m, apparition), 60 s 4 (min 0,36), 120 s 9 sur 1 117 actifs (min 0,23) : ≤ 1,5 % des personnes (17 sur 1 117 à 120 s). 0 personne dont le centre est hors grille ; 46-52 (1,5 %) ont un coin du corps dans une case non praticable (appui contre un mur, toléré).
- **Pas lisible** : les silhouettes (épaules 0,36 m) sont plus étroites que l'espacement de contact (0,48 m) : 8-12 cm de vide en permanence, jamais de contact visuel, aucune réaction de corps (pas de pas de côté, pas de recul). À 5 pers./m² la foule a l'air de fantômes qui glissent. Correction : lié au mannequin (défaut 6), épaules 0,45 m de large, rotation vers la direction de poussée, ralentissement visible dès 3 pers./m².
- **Hors de la grille de voisinage** : pendant un trajet, l'agent n'est plus dans `H` (`sim.js:51`) : rien ne l'empêche de croiser un marcheur sur la droite de son trajet ; effet mesuré : voir défaut 8.

## Lots de correction proposés (disjoints)
1. `sol-grille` (défauts 1, 3, 9) : `build_navgrid.py`, `index.html` (bloc `buildIndoorParis`). Vérification : 0 personne sans sol dessiné, 0 franchissement de façade, mesurés avec le script de ce diagnostic.
2. `horloge` (défaut 2) : `index.html:387`. Vérification : T simulé / temps réel = facteur choisi à ±5 %.
3. `liens-verticaux` (défauts 4, 7, 8) : `build_navgrid.py`, `sim.js`. Vérification : 0 lien inversé, 95 % des passagers à < 0,8 m de l'axe dessiné.
4. `mannequin` (défauts 5b, 6, 11) : `mannequin.js`, `index.html`. Vérification : capture rapprochée, 60 i/s à 3 200 personnes.
5. `cinema-assis` + `mouvement` (défauts 5a, 5c, 10) : `sim.js`.
Ordre : 1 et 2 d'abord (ensemble ils règlent le ressenti « ils volent »), puis 3, puis 4 ; 5 en parallèle de 4.

## Questions pour Adem (recommandations par défaut)
1. Mannequin : (a) modèle gratuit sous licence CC0 (à vérifier, ex. packs Quaternius), (b) modèle généré par nous en code, (c) payant. Recommandation : a. Défaut si pas de réponse : a.
2. Écartement des étages : (a) 1,0 par défaut et 2,2 en vue éclatée seulement, (b) garder 2,2. Recommandation : a (pente d'escalator réaliste, étages à 6 m). Défaut : a.

## Reproduire
Scripts de mesure (hors dépôt) : `/private/tmp/claude-501/-Users-adem-Accel/538b6413-23c8-47e6-8e95-61722ac1129d/scratchpad/diag/` (`m2.js` collisions/vol/vitesses, `m3.js` liens, `m4.js` couverture de grille, `m5.js` rendu/mobilier, `m6.js` immobiles, `m7.js` façades). Captures : `shot1.png` (vol), `shot2.png` (escalator), `shot3.png` (jouet) dans le même dossier. Limite : une seule tirée aléatoire, rendu logiciel (cadence réelle non mesurée), niveaux supérieurs (> 0) non simulés.
