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
