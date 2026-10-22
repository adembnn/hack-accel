# Le moteur du Forum (sim.js) depuis Node

`moteur-simjs.ts` charge `reports/maquettes/chatelet-3d/sim.js` tel quel dans un bac à sable (`node:vm`), sans navigateur : `fetch` lit `navgrid.json`, `SCN` est `scene.json`, `Math.random` est notre générateur à graine (mêmes entrées = mêmes sorties). `simDraw` (le rendu 3D) n'est jamais appelé. Modèle simplifié, non certifié.

## Données (générées, jamais commitées)
`navgrid.json`, `scene.json` et `data/` sont ignorés par git (`reports/maquettes/chatelet-3d/.gitignore`). Pour les produire : `./recuperer-osm.sh` puis `python3 build_navgrid.py` dans ce dossier (Overpass est souvent saturé : réessayer, ou rejouer les mêmes requêtes sur un miroir). Sans elles, les tests du Forum réel sautent et seul le test sur grille synthétique tourne.

## Utilisation
```ts
const moteur = await chargerMoteurSimJs();           // une fois (charge la grille, calcule les cartes de distances)
const r = moteur.jouer(plan, graine, { personnes: 3200, duree_s: 900 });
// r = { t_s, sortis, sortis_par_porte, sortis_zone_danger, exposition_5ppm2_s, densite_max, t90_s, t95_s, non_sortis }
```
Le bac à sable est réutilisé d'une partie à l'autre (état remis à zéro ; seules les cartes des portes dont l'état change sont recalculées).

## Plan interne -> sim.js
| Plan | sim.js |
|---|---|
| `portes[].ouverte=false` (à t=0) | `SIM.groups[k].open=false` puis `simField(k)` |
| `portes[]` avec `a_partir_de_s` | idem, appliqué quand le temps simulé l'atteint (fermeture ou réouverture) |
| `guidage` (personnel > 0) | `G.agent=true` sur la porte visée (attire à moins de 40 m) |
| `messages_par_zone` (clarté >= 0,5) | `G.annonce=true` sur la porte conseillée, à `a_partir_de_s` ; sim.js n'a pas de zones : un message vaut pour tout le monde |
| annonce tardive | option `retard_alerte_s` -> `SIM.delay` |

Non pris en compte (sim.js n'a pas l'équivalent) : `phasage_salles`, `confinement`, `mode`, la clarté au-delà du seuil 0,5.
Un id d'issue du Plan se traduit en groupe(s) sim.js par la table `CORRESPONDANCE_DEFAUT` (surchargeable via `options.correspondance`) ; un id qui est déjà un nom de groupe passe tel quel.

### Table des portes (NON VÉRIFIÉE sur la vraie grille)
`navgrid.json` n'a pas pu être généré (Overpass saturé : `abords.json` jamais reçu complet). La table par défaut vient du code de sim.js (groupes « Porte <nom> » issus de `exits[].n`, « Issues de secours », « Quais RER et métro ») et du ticket (« Porte Lescot »), pas d'une exécution : à contrôler avec `moteur.groupes` dès que les données existent, puis corriger `CORRESPONDANCE_DEFAUT`. Une issue sans groupe fait lever une erreur explicite qui liste les groupes réels.

| Issue du Plan | Groupe(s) sim.js supposé(s) |
|---|---|
| principale | Porte Lescot |
| secours | Issues de secours |
| escalators | Porte Berger |
| metro | Quais RER et métro |
| ferronnerie | Porte Rambuteau |

## Limites connues
- Quelques personnes restent parfois coincées contre un coin de mur (le moteur sépare les axes et glisse mal dans les angles) : `non_sortis` n'est pas toujours 0 même tout ouvert.
- Pas de phase « calme » avant l'alerte : on pose la foule puis `simAlert()` tout de suite (départ log-logistique tiré par personne).
