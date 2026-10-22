# Benchmark avant/après : comment lire et relancer

**Modèle simplifié, non certifié, scène illustrative.** Le hasard seul (les graines, c'est-à-dire les populations tirées au sort) est couvert par l'intervalle de confiance à 95 %. L'écart entre modèles, lui, n'est pas couvert : des logiciels de référence s'écartent jusqu'à 30 % entre eux (RiMEA 2025, cas d'amphithéâtre). Ces chiffres comparent des plans, ils ne prédisent pas un temps d'évacuation. Détail et sources : `reports/maths-5-statistiques-validation.md`.

## Lancer
- `npm run bench:avant-apres` : jeu « rapport », 100 graines (101 à 200), une dizaine de secondes. Écrit `resultats.csv` (une ligne par critère) et `resultats-par-graine.csv`.
- Options : `node bench/avant-apres.ts --jeu=reglage` (graines 1 à 20, pour régler les plans) ; `--graines=N` change le nombre de graines (défaut 100 pour le rapport, 20 pour le réglage).
- `node bench/sensibilite.ts [--jeux=N]` : le verdict tient-il si les paramètres varient dans leurs fourchettes ? Hypercube latin (échantillonnage qui couvre régulièrement l'espace des paramètres), 100 jeux x 5 graines x 2 plans, environ 1 min 30. Écrit `sensibilite.csv` (un jeu par ligne) et `sensibilite-resume.csv` (part des jeux où APRÈS reste meilleur, plage 5-95 %, corrélations de rang).
- `node --test bench/stats.test.ts` : tests du module `stats.ts`.
- `node bench/plans.ts` : recherche de plans (voir `PLANS.md`).

## Règles
- Deux jeux de graines séparés : on règle les plans sur « reglage » (1-20), on rapporte sur « rapport » (101-200), jamais l'inverse.
- Colonnes de `resultats.csv` : intervalle de Student exact selon le nombre de graines (jamais 1,96 fixe), écart-type et coefficient de variation, différence appariée (après − avant, mêmes graines) avec intervalle de Student et intervalle bootstrap (2 000 rééchantillonnages, graine fixe), `difference_relative_pct`, `d_z` (taille d'effet), `rho_avant_apres`.
- `sous_incertitude_modele` vaut `vrai` si l'écart relatif est inférieur à 30 % : l'écart est alors dans l'incertitude de modèle, il ne suffit pas pour conclure ; `verdict` (mieux, pire, equivalent, indistinct, plafond) ne parle que du hasard des graines.
- `plafond` : variance nulle (par exemple 0 non-sorti partout) ; ce n'est pas un intervalle [0 ; 0], c'est une borne.
- `converge` : critère de Ronchi et al. (Fire Technology 2013, DOI 10.1007/s10694-013-0352-7) : moyenne et écart-type cumulés stables à 1 % pendant 5 runs de suite. `n_requis_1pct` : nombre de graines pour une demi-largeur d'intervalle de 1 % de la moyenne.
- Les colonnes `commit` et `date` identifient le code et le moment du calcul. Le CSV met entre guillemets tout champ qui contient une virgule (dont l'avertissement).
- t90 et t99 sont des entiers (pas de 1 s).

## Sensibilité : ce qui varie, ce qui manque
Varient aujourd'hui (options déjà acceptées par `simuler()`) : débit des issues (via les largeurs, 1,0 à 1,9 pers./s/m, SFPE à Jülich), distances aux issues, part de groupes, part de personnes à mobilité réduite, heure de fermeture du métro. Les autres fourchettes sont de bon sens, non sourcées.
Pas encore injectables dans `simuler()` : vitesse moyenne de marche, médiane du délai de départ, part qui connaît la sortie de secours (0,25 codé en dur), constante de débit par mètre (1,3 codé en dur), poids de `sortie.ts`, temps de reprise après hésitation, clarté du message.

## Validation : notre modèle reproduit-il des résultats publiés ?
`npm run bench:validation` (environ 3 s) compare le modèle à des résultats publiés, test par test, et écrit `validation.csv` (id, titre, ce qui est vérifié, valeur de référence, source, url, valeur simulée, tolérance, verdict, explication). C'est l'inverse du benchmark de plans : on ne compare pas deux plans, on vérifie que le modèle fait ce que la science mesure. Verdicts : `passe`, `échoue`, `non applicable`. Un test qui échoue reste affiché comme échoué, avec sa raison ; on ne règle ni le modèle ni la tolérance après avoir vu le résultat.

| Test | Référence | Verdict à la date du calcul |
|---|---|---|
| 1 RiMEA 1 (couloir 40 m à 1,33 m/s) | 26 à 34 s | passe (30,1 s) |
| 2 RiMEA 5 (délais fixés) | chaque personne part à son heure | passe |
| 3 RiMEA 8 (vitesse, sens du temps total) | temps décroissant avec la vitesse | passe |
| 4 RiMEA 9 (1 000 personnes, 4 puis 2 sorties) | rapport 0,4 à 0,6 | passe (0,54) |
| 5 RiMEA 10 (issue assignée) | grande majorité (seuil du test : 70 %) | passe (84 %) |
| 6 RiMEA 11 (choix de l'issue) | proche > lointaine, lointaine >= 20 % | passe (64 / 36 %) |
| 7 RiMEA 12 (partiel) | densité forte en amont du goulot | passe, partiel : l'aval n'existe pas dans le modèle |
| 8 IMO 4 (sortie de 1 m) | <= 1,33 pers./s | passe, mais tautologie (1,3 fixé par construction) |
| 9 Jülich (Seyfried et al.) | 1,9 pers./(m·s) | **échoue** (1,3, écart −32 %) : valeur SFPE prudente |
| 10a Weidmann 1993 (fonctions de `pression.ts`) | v(1,75) = 0,70 ; débit max 1,22 | passe (vérification de formule) |
| 10b Weidmann (mouvement de test) | diagramme fondamental | **non applicable** : modèle de files, sans relation vitesse-densité |
| 11a-c Forssberg 2019 (délais de départ) | médiane 40,5 ; moyenne 44,0 ; écart-type 18,0 s | médiane et moyenne passent ; écart-type **échoue** (14,2, −21 %) |
| 12a-b Moussaïd 2010 (groupes) | 30 % de seuls ; paires 31 %, trios 12 %… | passe (la loi codée est bien tirée) |
| 13 Changement d'avis | 3 à 12 % (Liao 2017, Bode et Codling 2013) | passe (7 à 9 %), mais la constante a été recalée sur cette cible |
| 14 Personnel de guidage | environ 90 % (Fire Technology 2025) | passe (86 %) |

Tolérances : choisies avant la mesure et écrites dans le CSV. Quand aucune tolérance publiée n'existe, on prend ± 30 % (incertitude entre logiciels de référence, RiMEA) pour un débit et ± 10 % pour les moments d'une loi ajustée.

**Ce que cela prouve et ne prouve pas.** C'est une vérification de composants (logique de NIST TN 1822 et du protocole ISO 20414), pas une validation ISO : le Forum n'est pas évacué pour autant comme prévu. Plusieurs tests sont partiellement circulaires (8, 10a, 12, 13 : la valeur testée est fixée par construction ou recalée), ils le disent dans leur explication. Non faisables chez nous, donc absents : RiMEA 2, 3, 4, 6, 7, 13, 14 (escaliers, angles, multi-niveaux, diagramme fondamental). Aucune donnée du Forum, aucun écrasement validé.

## Preuve multi-situations
`npm run bench:preuve` (environ 1 min 10) joue 22 situations x 10 graines x 2 plans et compare « sans » notre solution à « avec ». Options : `--graines=N` (défaut 10, graines 101 et suivantes), `--situations=B1-secours,C1-metro` (liste d'identifiants, voir `SITUATIONS` dans `preuve-lib.ts`), `--moteur=test|simjs`. Écrit `bench/out/preuve.csv` (une ligne par situation) et `bench/out/preuve-resume.json` ; `bench/out/` est ignoré par git (données générées, jamais commitées).
- **Sans** = `PLAN_AVANT` (consigne du 19 oct. : un message flou, tout le monde en même temps, aucune porte gérée). **Avec** = `classement[0].plan` de `src/explorateur/resultats.json` (meilleur plan de l'explorateur, #24) s'il existe et si ses issues existent dans la scène ; sinon `PLAN_APRES` (le résumé JSON et la sortie disent lequel a servi). Le plan « avec » est le même dans toutes les situations : il n'est pas re-calculé pour chacune.
- **Situation** = un lieu du problème (l'issue touchée) x une perturbation du catalogue (`reports/catalogue-contraintes.md`) : B1 issue bloquée (porte fermée dès 0 s dans le plan, aucune sortie possible), C1 bouche de métro fermée, B3 escalator arrêté (largeur divisée par 2), D1/D2 troubles devant une issue (ce qui est derrière devient zone interdite), F1 annonce tardive (messages décalés de 10 min), plus les préréglages de départ `central` et `lent` de `depart.ts` et 10 % de personnes à mobilité réduite. Les combinaisons ajoutent plusieurs perturbations.
- **Colonnes** par critère : `_sans` et `_avec` (moyenne sur les graines), `_ecart_pct` ((avec − sans) / sans ; négatif = amélioration, vide si « sans » vaut 0), `_ic95_bas_pct` et `_ic95_haut_pct` (intervalle de Student 95 % de la différence appariée, en % de « sans »), `_verdict` (`mieux`, `pire`, `equivalent`, `indistinct`, `plafond`, voir `stats.ts`), `_sous_incertitude_modele` (vrai si l'écart est sous 30 %). Critères : `non_sortis_22h`, `zone_danger`, `t90`, `t99`, `ecrasement`, `pmr_non_sortis`. Puis les réactions moyennes par run (`hesitations_issue_fermee`, `part_ayant_change`, `tentatives_sans_issue`, `culs_de_sac`, sans et avec) et les sorties moyennes par issue (`sorties_<issue>_sans` et `_avec`, report de la charge sur les autres issues ; le JSON donne aussi l'écart avec la situation `base`).
- **Ligne pour le jury** : médiane de l'écart relatif sur les situations où « sans » n'est pas nul. Critère vedette : les non-sortis à 22 h si au moins la moitié des situations en ont, sinon l'exposition en zone de danger. « Meilleure dans k/N » compte les situations où l'intervalle de confiance exclut 0 du bon côté.
- **Limites** : scène illustrative, mouvement de test (files d'attente aux issues, sans relation vitesse-densité) tant que le moteur `sim.js` n'est pas branché ; les intervalles ne couvrent que le hasard des graines, pas l'erreur du modèle (30 %). Un plan fixe, jouable dans toutes les situations, peut y être mauvais (par exemple un plan qui ferme le métro et la Ferronnerie n'a plus que deux issues quand la principale est bloquée) : ce n'est pas un bogue du benchmark, c'est ce que mesure la comparaison. `tentatives_sans_issue` explose quand plus aucune issue n'est ouverte (chacun réessaie toutes les 10 s). `--moteur=simjs` est un point d'entrée vide (`creerMoteur` dans `preuve-lib.ts`) : il doit rendre le journal (même forme que `simuler()`) et les sorties par issue.
