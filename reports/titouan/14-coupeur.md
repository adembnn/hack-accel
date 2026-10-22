# Coupeur : périmètre de la démo (12h15, soumission 15h30)

Lecture seule. Sources : tickets #6 à #12 (corps et commentaires), plan-9h.md, `ls-remote origin`, `demo/SCRIPT.md` (wt-sync).

## Constats qui pèsent
- `demo/SCRIPT.md` est vide : aucune étape rédigée, et le moment où le jury agit n'est pas tranché. Les « étapes 1 à 6 » ne sont que la numérotation des tickets.
- Aucun lot n'est fusionné. Sur origin, seuls `lot/aiven` et `lot/decideurs` existent. Socle, jumeau-3d, foule-mouvement, foule-decision et pitch n'ont que des `proto/*` (ou rien).
- Aiven : aucun accès (#11). Sans URL Runtime, rien n'est hébergé. Bloquant humain pour Adem.
- Incohérence de périmètre : plan-9h.md (non commité) décrit Refuge (événement extérieur, ~3 000 personnes, incendie, Kafka et ClickHouse). Les tickets décrivent le Forum des Halles (intérieur, décideurs, contraintes RATP et préfecture, PostgreSQL seul, sans Kafka ni ClickHouse). Il faut un seul périmètre. Je retiens les tickets, à confirmer.
- Horaire : plan-9h donne gel 14h00 et soumission 14h45 ; ton message dit 15h30. Je garde gel 14h00 et soumission 14h45, avec marge jusqu'à 15h30.

## Par lot
| Lot | Étapes | INDISPENSABLE | BONUS | COUPER |
|---|---|---|---|---|
| #6 socle | 1 (+ plomberie) | /sante 200 sur Runtime ; Dockerfile testé (`docker build`) ; une écriture et relecture PostgreSQL | lint strict, e2e élargi | stubs des autres lots ; scène 3D de départ dans l'app (reprendre le jumeau) |
| #7 jumeau-3d | 1, 2, 4 | Forum affiché (reprendre proto/jumeau-3d, déjà texturé sur main) ; 1 niveau ; 1 porte cliquable qui émet `contrainte` | zone de trouble ; 2e type de contrainte | portage TS complet ; 4 styles ; menu de 7 perturbations (décision #13) ; 18 bouches IDFM ; multi-niveaux |
| #8 foule-mouvement | 2, 4 | replay précalculé : agents qui marchent sans traverser de mur sur la grille d'1 niveau | pression Helbing ; escalators ; 5 000 personnes en direct | 5 000 en direct ; ascenseurs ; bench 8 ms (le replay suffit) |
| #9 foule-decision | 3, 6 | benchmark avant/après chiffré (critère 4 du jury), 5 à 20 graines ; grille minimale (non sortis à 22h, écrasement) | suivisme, groupes, changement d'avis, hésitation, messages par zone | modèle complet ; garder un seul paramètre sourcé |
| #10 decideurs | 5 | boucle décider, simuler, noter sur rejeu ; 2 décideurs ; ~5 leviers ; vérificateur de chiffres ; 1 leçon mémorisée, réutilisée au 2e run | 4 décideurs ; 46 leviers ; 5 rédacteurs ; AnalysteLecons complet | appels Jev et Claude réels (payants, accord d'Adem) ; 3 conflits en événements |
| #11 aiven | 5, 6 | URL 200 ; tables runs, décisions, mémoire ; relecture au rechargement | tableau commun en SSE ; POST /rex ; rôle enseigne_ecriture ; embeddings réels | ClickHouse et Kafka (déjà écartés) ; 13 REX (garder 3 à 5 sourcés) |
| #12 pitch | 1 à 6 | demo/SCRIPT.md rempli ; MP4 de 3 min ou vidéo de secours ; nom et pitch d'une ligne | slide soignée ; TXT complet ; `capture.mjs --demo` vert | attendre `capture.mjs` pour la vidéo : enregistrer à la main si besoin |

Dépendance non déclarée : #8 consomme `navgrid` de #7, mais « Bloqué par » ne liste que #6. À corriger dans le ticket.

Le critère 3 du jury (donnée au cœur) est faible avec une seule base PostgreSQL. À traiter dans le TXT, sans ajouter de service.

## Ordre de fusion vers main
1. lot/socle (créé depuis proto/socle, Dockerfile vérifié en local). Socle d'abord : tout le reste en dépend.
2. lot/aiven : rebase sur socle. Dépend d'Adem pour le déploiement.
3. lot/jumeau-3d : fournit `navgrid`, à fusionner avant foule-mouvement.
4. lot/foule-mouvement : après jumeau.
5. lot/foule-decision : après foule-mouvement.
6. lot/decideurs : après foule-decision. Code déjà présent, tests verts sur faux simulateur. Valider avant l'ajout `allowImportingTsExtensions` dans le tsconfig du socle.
7. lot/pitch : en dernier. Mais fusionner demo/SCRIPT.md dès maintenant, pour figer les étapes.

## Chemin critique minimal (URL hébergée, parcours complet à 15h)
Chaîne bloquante : Adem (accès Aiven, service PostgreSQL, Deploy) puis socle en ligne (URL 200), navgrid minimal (#7), replay précalculé (#8), bench avant/après (#9), rejeu décideurs (#10), capture MP4 (#12), redeploy final.

- 12h15-12h30 : Adem fournit accès Aiven, service PostgreSQL, bouton Deploy. Titouan rédige SCRIPT.md (porte cliquée à 1:30).
- 12h30-13h00 : lot/socle, `docker build` local, déploiement Runtime, /sante 200.
- 12h30-13h30 (en parallèle, interfaces figées) : jumeau 1 niveau avec 1 porte ; replay foule ; rejeu décideurs à 2 décideurs.
- 13h30-14h00 : bench avant/après ; tables runs, décisions et mémoire remplies ; redeploy.
- 14h00 : gel. Plus rien d'ajouté.
- 14h00-14h30 : capture MP4 (ou vidéo de secours), 2 répétitions chronométrées.
- 14h30-14h45 : redeploy final, soumission (URL, dépôt, MP4, README de 10 lignes).

Non parallélisable : le socle avant tout déploiement ; navgrid avant replay ; replay avant rejeu décideurs.

## Risque n°1 et plan B
Accès Aiven et déploiement humain. Plan B à 13h si pas d'accès : rejeu statique (dist/ et JSON du run), sans serveur, et le dire dans le pitch. Poser la question aux organisateurs maintenant.

## Décisions à trancher
- Périmètre : Refuge (plan-9h) ou Forum (tickets) ?
- Moment où le jury agit (étape 4) : porte cliquée à 1:30 proposé.
- Soumission : 14h45 (plan) ou 15h30 (ton message) ?
- Écart tsconfig de decideurs (#10) : valider avec Adem.
