# Intégration des prototypes (branche proto/integration)

Question posée : les prototypes des lots s'assemblent-ils ? Réponse courte : **oui, la chaîne tourne de bout en bout en local, sans réseau ni clé**, mais avec des adaptateurs non triviaux et des écarts importants listés plus bas. Modèle simplifié, non certifié ; population réduite.

Lancer : `npm run demo:integration` (écrit `bench/integration/resultats.json` et affiche le résultat) ; tester : `npm run test:integration` (≈ 40 s) ou `npm run test:lots` (tous les tests node:test des lots).

## La chaîne

1. `grille.ts` : `src/scene/navgrid.json` (lot jumeau-3d, RLE, 6 niveaux de 0,5 m) devient une `NavGrid` du lot foule-mouvement : recadrage sur le Forum, agrégation 2x2 en cellules de 1 m, niveaux 0 à -4, 77 liens verticaux convertis en 154 liens orientés.
2. `issues.ts` : les sorties anonymes du navgrid (identifiants OSM) sont rattachées aux 10 portes nommées du lot decideurs (plus « metro »), ce qui donne la `Scene` du lot foule-decision à la place de `SCENE_UGC`.
3. `mouvement.ts` : `CrowdSim` (src/sim/motion) est branché derrière l'interface `Mouvement` du lot foule-decision. Le moteur est construit une fois (champs de potentiel) puis réinitialisé entre deux runs.
4. `simulateur.ts` : `simuler(plan, graine, durée)` est branché derrière `Simulateur`/`Grille` du lot decideurs : traduction du plan, historique des plans, état résumé par minute.
5. `chaine.ts` : boucle des décideurs (`DECIDER_BACKEND=rules`, leçons du REX en mémoire), puis explication et ordres de service par le rédacteur en rejeu (cache rempli par gabarit, chiffres vérifiés par le code).
6. `demo.ts` et `chaine.test.ts` : script et test. `fetch` est remplacé par une fonction qui échoue : aucun appel réseau n'est possible.

Les dossiers des lots n'ont **pas** été modifiés. Seuls fichiers racine touchés : `package.json` (scripts, voir écart 12) et `vite.config.ts` (écart 12).

## Écarts constatés (honnêtement)

Interfaces :

1. **Deux vocabulaires de plan.** Le `Plan` du lot decideurs (portes en dictionnaire, phasage en minute du jour, guidage multi-points, messages en texte libre, confinement par zones) n'est pas celui du lot foule-decision (portes datées en secondes, phasage en délai, un seul guidage, message avec `issue_id` et `clarte`, confinement booléen). `traduirePlan` convertit : le message est relié à une issue en cherchant son nom dans le texte (sinon `issue_id` nul, donc consigne sans direction), `clarte` = 0,7 (valeur posée par nous), plusieurs guidages fusionnés, confinement partiel ignoré. Ce qui est perdu est signalé dans `ecarts_constates` du JSON.
2. **`simuler()` rejoue tout depuis t = 0**, le lot decideurs avance minute par minute. L'adaptateur garde l'historique des plans et relance une simulation complète seulement quand le plan change (le plan est alors appliqué à partir de l'instant du changement, le passé est rejoué à l'identique à graine égale sauf le tirage du guidage). Coût : une simulation complète par changement de plan.
3. **Zones.** Les zones des décideurs (`scenario.population`) sont rattachées dans l'ordre aux 6 salles fixes du lot foule-decision (`salle-1` à `salle-6`, `creerPopulation` n'accepte ni nombre de salles ni effectifs inégaux) ; la population est répartie à parts égales. `par_zone[z].densite` = densité maximale au droit d'une personne de la salle (mesure de l'adaptateur) ; `JournalRun` ne donne que des densités par issue.
4. **`EtatResume` partiel.** `sortis_vers_zone_danger` est reconstruit (sorties par une issue « interdite » + sorties du métro après sa fermeture) ; `debit_portes` = sorties par minute ; `pression_max` vient de CrowdSim. Les leviers « hors plan » (heure de fermeture des stations, demande de fermeture, correspondances, renforts) ne sont pas transmis à la simulation : le plan ne les contient pas.
5. **Portes sans sortie réelle.** `lescot`, `berger` et `saint_eustache` n'ont aucune sortie de rue ouverte dans le navgrid (les entrées nommées de scene.json sont des bouches ou des portes dont la sortie correspondante est fermée ou hors cadre) : fermer ces portes n'a donc aucun effet. `canopee` n'a pas d'ancre nommée : on lui donne la sortie la plus proche du centre. Le rattachement porte nommée -> sortie est « la plus proche de l'ancre », pas un relevé.
6. **Issue fermée.** `CrowdSim` ne peut pas retirer un but sans recalculer ses champs (plusieurs secondes). Une issue fermée est donc détectée à l'arrivée : la personne est remise en marche sur place et signalée `devant_issue_fermee`, puis le comportement la fait hésiter et rechoisir. Les personnes en attente ou qui hésitent ont une vitesse désirée nulle (elles comptent dans la densité).
7. **Accès aux champs privés de `CrowdSim`** (`goals`, `fields`, `tokens`, `rand`...) par transtypage, pour poser 8 groupes de buts avec un seul calcul de champs et pour réinitialiser sans recalculer. C'est fragile : un renommage dans le lot casse l'adaptateur (le test le détecte).
8. **Scène.** Les `Issue` sont reconstruites : `distance_m` = potentiel moyen du centre des salles, `largeur_m` = somme des largeurs des sorties, `visible`, `porte_entree` (= issue de rue la plus proche) et `derriere` (`berger`, `rambuteau` = périmètre ; autres = sûr) sont des hypothèses. Les 6 salles sont posées sur les niveaux -3 et -4 (les mieux documentés), tranches égales en x : ce n'est pas la position de l'UGC.
9. **Liens verticaux.** Sens des escalators inconnu dans scene.json (deux sens posés), vitesses et débits = valeurs de démonstration du lot foule-mouvement (non calées).
10. **REX.** Le corpus public (`recherche/09-rex-seed.json`, non versionné dans ce dépôt) est copié dans `src/integration/donnees/`. Ses lignes sont rattachées à la zone « * » (toutes) : n'importe quelle décision peut donc citer les mêmes leçons.

Résultats et performance :

11. **Performance : le critère de 8 ms par pas du lot foule-mouvement n'est pas tenu sur la vraie grille.** Le coût d'un pas de `CrowdSim` dépend de la surface de la grille (seaux de 1 m sur tous les niveaux), pas du nombre de personnes : 12 à 87 ms par pas sur 620 x 630 m x 5 niveaux (1,95 million de cellules) avec 300 personnes, dont ~75 ms pour un recalcul de densité. Pour tenir, on a agrégé la grille à 1 m, pris un pas de 0,25 s, recalculé la densité tous les 50 pas. Un run de 10 minutes simulées coûte de l'ordre de plusieurs minutes de calcul : **trop lent pour une démo en direct**, il faut préparer les résultats ou réduire la zone.
12. **`npm test` (vitest) échouait sur la fusion** : les tests des lots jumeau-3d, foule-mouvement et foule-decision utilisent `node:test` et vitest les ramasse (« No test suite found »). Correctif côté racine : `vite.config.ts` ne garde que `src/app`, et `npm run test:lots` (appelé par `npm test`) lance les tests node:test. Le `package.json` de chaque lot (qui entrait en conflit à la fusion) n'a pas été repris : les scripts `test:scene`, `test:motion`, `test:behavior`, `bench:*`, `test:decideurs`, `test:db` sont réécrits au niveau racine.
13. **Population réduite.** 600 personnes (100 par salle) au lieu des ~3 000 de l'incident du 19 octobre, et horizon de 10 minutes simulées au lieu d'une soirée : faute de temps de calcul. À cet horizon peu de personnes sont sorties (délais de départ log-logistiques de plusieurs minutes), t90 n'est donc pas atteint et les comparaisons avant/après sont **peu significatives** ; ne pas les présenter comme un gain mesuré.
14. **Les décideurs en mode `rules` restent ouverts** tant que la densité et les sorties vers le danger sont faibles (ce qui est le cas ici) : le « plan choisi » est surtout une annonce, sans fermeture de porte. Les règles répètent aussi les mêmes leviers à chaque minute (affichés dédupliqués avec le nombre de répétitions). Pour voir un plan différencié, il faut un scénario plus chargé (plus de monde, horizon plus long) ou le backend Jev (non utilisé ici : payant).
15. **Non fait** : Jev et Claude réels, serveur Aiven (le lot aiven n'est pas appelé), vue 3D branchée sur les résultats, le pitch (`demo/`, `pitch/`) n'est pas lié à la chaîne.

## Fichiers

- `bench/integration/resultats.json` : avant/après, t90, zone de danger, pression, leviers choisis, décisions citées, textes vérifiés, écarts, performance.
- `bench/integration/rejeu-textes.json` : cache de rejeu du rédacteur (texte fabriqué par gabarit puis relu par `RedacteurRejeu`).
