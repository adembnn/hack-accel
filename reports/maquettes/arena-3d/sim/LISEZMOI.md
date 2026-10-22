# Moteur de foule de l'Adidas Arena (sim/)

Module ES sans dépendance (navigateur et Node) : `arena-sim.js`. Banc d'essai : `node sim/bench.mjs` (depuis `reports/maquettes/arena-3d/`, après `sh recuperer-osm.sh` qui produit `scene.json`). Repère : mètres, x vers l'est, z vers le sud, origine au centre de l'Arena. Niveaux 0 (sol), 1 (coursive + tribune basse), 2 (tribune haute + galerie).

## API
```js
import { buildWorld, Sim, TARGETS } from './sim/arena-sim.js';
const world = buildWorld(scene);            // ~0,25 s ; partagé entre runs
const sim = new Sim(world, { seed: 22102026, fill: 0.85 });
sim.step();                                 // DT = 0,1 s
const s = sim.snapshot();                   // {T, people[{x,z,level,y,state}], stewards, counters, alerts}
```
`counters` : `inside` (dans l'Arena), `outside` (= total - inside, cumulé, absorbés compris), `byTarget`, `queueByLink`, `queueByGate` (personnes à moins de 0,5 m/s dans un rayon de 8 m d'un escalier, 6 m d'une porte), `maxDensity`, `densityHotspot`, `exposure` (personnes·s au-dessus de 4 pers./m²). `alerts` = nouvelles alertes depuis le dernier `snapshot()` ; `sim.alertLog` garde tout. Types : `densite>4`, `densite>5`, `lien_sature` (>= 40 en file, estimé), `porte_fermee_file` (>= 15 devant une porte fermée, estimé). `sim.view()` donne des tableaux typés pour le rendu.

Commandes (toutes renvoient la mesure de recalcul `{ms, fields, invalidatedByField,...}`, aussi dans `sim.lastRecalc` / `sim.recalcLog`) :
`setGate(id|nom, open)`, `setVomitoire(1..8|nom, open)`, `setMetroEntrance(i, open)`, `setMetroStation(open)`, `setTramStop(nom, open)`, `setTramHeadway(s)`, `setBarrage('bd Ney est'|'av. de la Porte de la Chapelle nord'|'rue de la Chapelle sud', on)`, `addDangerZone({level,x,z,r | poly, closed, minutes})` / `removeDangerZone(id)`, `holdSector('basse'|'haute', untilT)`, `announce(zone, cible)` (zone : `'tout'|'parvis'|'hall'|'coursive'|'tribune_basse'|'tribune_haute'|'galerie'` ou `{x0,z0,x1,z1,level}` ou `{x,z,r,level}` ; `clearAnnounce(id)`), `addSteward({x,z,level,team})`, `orderSteward(id|équipe, {type:'goto',x,z,level} | 'hold' | {type:'redirect',target,radius=15} | {type:'close'|'open',element})`.

`sim.apply(levier, on=true)` : applique (ou lève avec `false`) un objet du catalogue `scene.leviers`, par-dessus les méthodes ci-dessus : C1 station / bouche / arrêt de tram (le plus proche), B1 porte ou vomitoire le plus proche (sinon `applied:false` + raison), B3 escalier du hall le plus proche à 0,7 m/s (durée et écart x1,86), B5 enregistré mais sans effet (pas de profil PMR dans la population), D1/D2 zone à éviter (polygone ou rayon, coût x5), D5 zone fermée (murs) levée seule après `duree_min`, F1 retard `retard_min` ajouté aux annonces et aux ordres radio.

Les fermetures recalculent les cartes de pentes **de façon incrémentale** (cellules dont le chemin passait par le changement) : le bench compare au recalcul complet, écart 4e-13.

## Hypothèses (estimé = inventé par l'équipe)
Publié, repris du moteur Châtelet : départ log-logistique (médiane 40,5 s ; forme 3,5 = estimé), logit de sortie (distance -0,08/m, familiarité +0,795, guidage +2,739), forces sociales de Helbing (tau 0,5 s, v0 ~ N(1,34 ; 0,26), A=25, B=0,08), murs par champ de distance.
Estimé : remplissage 85 % (7 014 personnes sur 8 263 places) ; groupes de 1 à 3 (60/24/16 %) ; préférences 55 % métro, 12,5 % chaque tram, 20 % à pied (sud 35, est 30, nord 35 %) tirées au départ et prises comme cible initiale ; distance du logit multipliée par 0,1 (sinon elle écrase tout à 500 m) ; obéissance 80 % à la sono, 70 % à un agent ; 10 % de re-choix toutes les 10 s ; débit des escaliers 1,3 pers./m/s, 8 s, largeur 4 m (hall) et 3 m (galerie) ; vomitoires ouverts sur 3 mailles (3 m) au lieu de 2,4 m ; mur tribune/coursive de 1,3 m ; tribune à vitesse x0,5 ; spectateurs assis non bloquants tant qu'ils ne sont pas partis ; bruit de ±0,5 m/s² (casse les voûtes de blocage) ; coupure des forces à 1 m ; absorption métro 4 pers./s par bouche (zone de 3x3 m) ; rame de 300 personnes toutes les 240 s par arrêt (premières à 90 et 150 s), embarquement instantané, arrêt de tram = quai des données OSM ; barrages de 80 m de long ; zone à éviter coût x5 ; délai radio 5 à 15 s ; agent posté = obstacle de rayon 0,5 m ; seuil de file 0,5 m/s ; densité = voisins à moins de 1 m / pi, moyennée sur 0,5 s.
Géométrie : seules 4 portes sont percées (3 portes du parvis + porte Chapelle ; « Accès gymnases » et « Accès logistique » ne donnent sur rien de praticable). Escaliers 1->0 placés à 4,5 m derrière chaque porte, pas aux positions de `scene.escaliers`. Les coins de la coursive non couverts par les 4 bandes sont rendus praticables.

## Chiffres du bench (graine 22102026, 3 min de calcul pour les deux runs)
| | (a) aucune réaction | (b) Parvis -> tramEst + 180 s |
|---|---|---|
| dans l'Arena à 5 / 10 / 15 min | 2593 / 8 / 0 | 2574 / 8 / 0 |
| 95 % sortis de l'Arena | 485 s | 482 s |
| densité max, personnes·s > 4 | 3,9 (niv. 2, galerie ouest, t=105 s), 0 | 3,9, 0 |
| absorbés à T=1800 : tramOuest / tramEst / sud / est / nord / métro | 2100 / 1300 / 928 / 529 / 1727 / 0 | 1547 / 2409 / 626 / 632 / 1613 / 0 |
| file max au quai ouest / est | 1825 / 822 | 692 / 1613 |
| personnes·s d'attente aux quais | 2,32 M | 1,75 M |
| ms par pas (moyenne / pire fenêtre) | 3,1 / 8,5 | 3,3 / 8,9 |

Le métro n'absorbe personne : à T=120 s la tête de foule n'a pas encore parcouru les 250 m (le run (c) du bench ferme une seule bouche à T=200 s pour vérifier la règle). L'écart entre (a) et (b) est dans les quais, pas dans la vidange de l'Arena (limitée par les escaliers). Recalcul à la fermeture de la station : ~50 ms ; porte : 3 à 15 ms ; barrage : ~50 ms.

## Limites connues
Aucune densité > 4 pers./m² n'apparaît avec les paramètres publiés (la répulsion garde les gens à ~0,55 m) : les alertes de densité ne se déclenchent pas dans ce scénario, seules les files d'escalier le font. À rediscuter avant la démo. La géométrie intérieure est celle de `interieur_estime.py` ; elle devra être remplacée par `scene['reel']` (plan NP2F) : à refaire dans `buildWorld` les emprises coursive/tribunes/vomitoires (aujourd'hui rectangle arrondi + `sdRR`), les positions des portes, escaliers et sièges, et la correspondance de `apply` (B1/B3/B5 par plus proche voisin).
