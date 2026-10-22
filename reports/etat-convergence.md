# État de convergence de l'équipe (22 oct. 2026, mis à jour par l'orchestrateur d'Adem)

Décision d'Adem (PR #33) : tout converge dans `src/`. Ce fichier dit qui a quoi, où, et dans quel ordre on rejoint `main`.
Commande pour le rafraîchir : `git fetch --all && git for-each-ref refs/remotes/origin` (branches en avance sur main).

## Ce qui est sur `main` aujourd'hui
Harnais, rapports (recherches, catalogues, « qui achète ? »), décisions, maquette de démo `reports/maquettes/chatelet-3d/`
(vue 3D texturée, foule `sim.js` sur la vraie grille, leviers, cortèges, alertes, dispositif existant, directeur à la voix). Pas encore de `src/`.

## Ce qui attend hors de `main`
| Qui | Branche | Contenu | Ticket | Prochaine étape |
|---|---|---|---|---|
| Titouan | `proto/integration-adem` (+59) | socle Vite/TS, `src/scene` (scene.json, vue3d), `src/sim/motion` et `behavior`, `src/server` (PostgreSQL, SSE), décideurs branchés sur `sim.js` d'Adem | #6, #7, #10, #11 | **base de la convergence** : la faire entrer dans `main` lot par lot via `tools/fusionner.mjs` |
| Titouan | `lot/decideurs` (+23), `lot/aiven` (+23), `proto/memoire` (+39) | décideurs Claude, 46 leviers, schéma PostgreSQL Aiven, mémoire des crises | #10, #11 | fusion après le socle (#6) |
| Titouan | `proto/lieu-3d` (+2) | vue 3D du 5 rue La Boétie (lieu du hackathon), style D | — | idée de démo : jouer le scénario dans la salle du jury |
| Alexandre | `lot/foule-decision` (+17) | décision humaine en TS (départ, Lovreglio, groupes, changement d'avis), grille de critères, benchmark avant/après | #9 | fusion ; ses paramètres corrigés (Haghani, groupes Poisson) à reprendre dans le moteur commun |
| Sullyvan | aucune branche poussée | — | #8 foule-mouvement | **à vérifier avec lui** : le mouvement existe déjà (`sim.js`, `src/sim/motion` chez Titouan) ; proposer qu'il porte `sim.js` en TS dans `src/sim/motion` plutôt que d'en écrire un autre |
| Session Arena (Adem) | `lot/explorateur` (+1), `maquette/arena-3d` (+13) | explorateur de ~70 plans × 8 variantes sur `sim.js`, vue Arena, `regie-ui.js` / `plans-ui.js` communs | #24 | fusion de l'explorateur ; ses plans alimentent `plans.js` |
| Orchestrateur d'Adem | `lot/maquette-ordres` (+1), lots #26, #29, #31 en cours | ordres multiples par Claude, trains et quais, 3 plans comparés, personne cliquable | #26, #28, #29, #31 | finir, fusionner, puis porter dans `src/` |

## Doublons à éviter
- Moteur de foule : `sim.js` (maquette), `src/sim/motion` (Titouan), `mouvement-simple.ts` (Alexandre, test). Un seul moteur doit rester : `sim.js` est celui que décideurs et explorateur utilisent déjà.
- Comportement : `sim.js` (Lovreglio, départ log-logistique) et `src/sim/behavior` (Alexandre, plus complet et testé). Cible : le comportement d'Alexandre pilote le mouvement de `sim.js`.
- Vue 3D : `reports/maquettes/chatelet-3d/index.html` et `src/scene/vue3d.html`. Cible : une seule vue dans `src/`, avec les modules de la maquette.
- Plans comparés : `plans.js` (#29) et l'explorateur (#24) : réglé (l'un rejoue en direct, l'autre explore hors ligne).

## Ordre proposé pour rejoindre `main`
1. Titouan : socle (#6) depuis `proto/integration-adem`, puis scène (#7) et serveur/Aiven (#11).
2. Alexandre : `lot/foule-decision` (#9).
3. Décideurs (#10) et mémoire.
4. Lots de la maquette en cours, puis portage des modules de la maquette dans `src/` (un lot par module).
