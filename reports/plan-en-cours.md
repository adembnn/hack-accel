# Plan : lots précis par personne et harnais en boucle de 5 minutes

## Contexte
Hack Accel AI Innovate Paris (22 oct. 2026). Produit : jumeau 3D du Forum des Halles (vrai Forum 0 à -5 + rues à ~1 km,
OSM), foule simulée comme de vraies personnes, contraintes cliquables, quatre décideurs Jev qui choisissent le meilleur plan
pour le directeur du centre, explication et ordre de service par Claude. Cas d'ancrage : couvre-feu du 19 oct. 2026.
Acquis : vue 3D poussée (`origin/maquette/chatelet-3d`, commit 825e576), 25 rapports + grille de critères + contraintes réelles
et canaux de diffusion (`reports/`), plan précédent (`reports/plan-en-cours.md`). Adem veut maintenant des lots précis pour
chacun (exécution, grill, décision) et un harnais où les agents se parlent toutes les 5 minutes, relayé sur Discord.

## Ce qu'on crée sur GitHub (tickets « Lot » du harnais : branche `lot/<nom>`, dossiers à soi, vérification bloquante)
Chaque ticket d'exécution commence par un critère de grill : « session `grill-with-docs` sur les coutures avec les lots
voisins, décisions consignées en commentaire du ticket ». Étapes de démo provisoires : 1 Paris en 3D, clic sur les Halles ;
2 le Forum, ses niveaux et ses contraintes ; 3 la situation du 19 oct. ; 4 une contrainte posée en direct ; 5 les
décideurs choisissent, expliquent, ordre de service ; 6 avant/après chiffré et route vers les premiers clients.

| # | Type | Lot (branche) | Qui | Dossiers | Livre | Vérification | Étapes | Bloqué par |
|---|---|---|---|---|---|---|---|---|
| 1 | Exécution | `socle` | Adem | config partagée, `src/app/` | Vite + TypeScript, scripts lint/typecheck/test/build, Dockerfile Aiven Runtime, PostgreSQL Aiven branché, un cas réel de bout en bout (une porte fermée enregistrée en base et visible) | `node tools/verif.mjs` + `npm run e2e:socle` | 1 | rien |
| 2 | Exécution | `jumeau-3d` | Adem | `src/scene/` | vue 3D portée en TypeScript ; `scene.json` + `navgrid` (grille praticable 0,5 m par niveau, liens escaliers/escalators/ascenseurs, portes avec largeur et état) ; contraintes cliquables émettant un événement `contrainte` ; styles A/B/C/D et caméras ; ≤ 800 appels de dessin | `npm run test:scene` (grille connexe, portes sur la grille) | 1, 2, 4 | 1 |
| 3 | Exécution | `foule-mouvement` | Sullyvan | `src/sim/motion/` | déplacement et collisions (forces sociales ou modèle à vitesse) sur la grille multi-niveaux, escalators à débit et arrêtables, ascenseurs interdits en évacuation, densité et pression de foule par cellule, 5 000 personnes | `npm run test:motion` (0 traversée de mur ; débit de porte 1,2 à 1,8 pers./m/s) + `npm run bench:motion` (≤ 8 ms par pas) | 2, 4 | 1, couture `navgrid` |
| 4 | Exécution | `foule-decision` | Alexandre | `src/sim/behavior/`, `src/sim/metrics/`, `bench/` | départ log-logistique (cinéma), choix de sortie logit (Lovreglio), groupes, suivisme, changement d'avis, hésitation devant une issue fermée, effet des messages par zone ; grille de critères ; benchmark avant/après (consigne du 19 oct. contre plan des décideurs, mêmes graines, 20 graines) | `npm run test:behavior` + `npm run bench:avant-apres` (écrit `bench/resultats.csv`) | 3, 6 | 1, 3 (couture « cible → mouvement ») |
| 5 | Exécution | `decideurs` | Titouan | `src/agents/` | quatre décideurs Jev (préfecture, RATP, sécurité, directeur) sur leurs vrais leviers (rester ouvert, fermer par étapes, portes, phasage des salles, guidage, messages par zone) ; boucle décider → simuler → noter chaque minute simulée ; explication et ordre de service par Claude, vérificateur de chiffres ; mode rejeu sans appel payant | `npm run test:decideurs` (avec cache : leviers respectés, 100 % des chiffres retrouvés) | 5 | 1, 4 |
| 6 | Exécution | `aiven` | Titouan | `src/server/`, `infra/` | déploiement Aiven Runtime (URL hébergée), schéma PostgreSQL (scènes, runs, décisions, mémoire, tableau commun), ClickHouse pour les positions si le volume le demande, brouillon du TXT « couche de données » | `npm run test:db` + URL qui répond 200 | 5, 6 | 1 |
| 7 | Exécution | `pitch` | Adem | `demo/`, `pitch/` | script de 3 min (`demo/SCRIPT.md`), slide, MP4, TXT couche de données final, nom et pitch d'une ligne | `node tools/capture.mjs --demo` vert | 1 à 6 | 2 à 6 (pour le MP4) |
| D1 | Décision | — | Adem | — | moment où le jury agit, et script minute par minute | réponse en commentaire | 4 | rien |
| D2 | Décision | — | Adem | — | textures CC0 (Poly Haven, ambientCG) : liste, tailles, accord de téléchargement | réponse | 1, 2 | rien |
| D3 | Décision | — | Adem | — | seuils de la grille (durée d'écrasement, ordre des critères déjà validé) et leviers du directeur (rester ouvert / fermer par étapes / fermer) | réponse | 5, 6 | rien |
| D4 | Décision | — | Adem | — | récit exact du 19 oct. (lundi ou dimanche, issues et bouches fermées, souvenir contre presse) pour le scénario « avant » | réponse | 3, 6 | rien |
Les tickets de décision portent l'étiquette `bloque` et une recommandation ; ils débloquent les lots indiqués.

## Harnais : les agents se parlent toutes les 5 minutes
- Bus de discussion : les commentaires des tickets GitHub (règle 4 du harnais). Le hook de début de session montre déjà
  les nouveaux commentaires ; on ajoute une boucle active.
- Chaque coéquipier lance dans sa session Claude Code : `/loop 5m` avec le prompt standard écrit dans `LISEZMOI.md`
  « Point de 5 min : 1) lis les nouveaux commentaires des tickets où tu es assigné ou mentionné et réponds-y ; 2) coche
  les critères passés avec la sortie de commande ; 3) un besoin sur un autre lot = un commentaire sur son ticket ; 4) poste
  sur ton ticket un point de 3 lignes : fait, bloquant, prochain ».
- Discord : la machine d'Adem lance `node tools/journal-push.mjs` (`ETAT_BUILD=1` dans `.env`). Changement demandé :
  l'« État du build » passe de 10 à 5 minutes (constante dans `tools/journal-push.mjs`), décision inscrite dans `CLAUDE.md`.
- Sessions sur la même machine : messages directs entre sessions (comme avec la session « Adidas Arena »).

## Ordre d'exécution après approbation
1. Fusionner `maquette/chatelet-3d` dans `main` (rapports, vue 3D, skills ajoutés, décisions) par une PR.
2. Harnais : cadence de l'État du build à 5 min, prompt de boucle dans `LISEZMOI.md`, décision dans `CLAUDE.md`.
3. Créer les 7 tickets d'exécution et les 4 tickets de décision avec le modèle « Lot », coutures écrites, assignés
   (adembnn, LaRacine23, SullyBck, alexandre692), étiquettes `ready-for-agent` ou `bloque`.
4. Lancer `socle` en premier ; un cas réel traverse toute la chaîne avant le travail en parallèle.
5. Prévenir l'équipe (message prêt à coller sur Discord) : lien des tickets, commande `/loop 5m`, ordre de démarrage.

## Vérification
- `gh issue list --label ready-for-agent` et `--label bloque` : 7 + 4 tickets, chacun assigné, avec dossiers et vérification.
- `node tools/etat-build.mjs` : chaque lot apparaît avec ses étapes de démo.
- `node tools/journal-push.mjs --une-fois` : un message arrive sur Discord.
- Chaque lot : `node tools/verif.mjs` vert avant fusion par `node tools/fusionner.mjs`.
