# Statistiques du benchmark avant/après et validation du simulateur

Lot foule-decision, ticket #9. Recherche du 22 oct. 2026. `[lu]` = lu à la source (page ou PDF ouvert) ; `[?]` = vu dans un résultat de recherche seulement, ou reconstitué. « Calcul » = fait par moi sur `bench/resultats-par-graine.csv` (20 graines), à refaire à la main. Aucun code modifié, aucun LLM appelé.

## 0. Version simple
1. Nos 20 graines mesurent le hasard des personnes (vitesses, retards). Ce hasard est minuscule (0,2 à 1,2 % d'écart-type, calcul) : 20 graines suffisent largement pour une moyenne, même 5 suffiraient. Mais l'intervalle étroit [314,4 ; 315,5] s de t90 est une fausse précision : il ne dit rien sur l'erreur du modèle, qui peut atteindre 30 % entre logiciels.
2. La comparaison « mêmes graines » est juste sur le papier mais, chez nous, elle ne réduit pas le bruit : la corrélation avant/après est proche de 0 (calcul). À corriger si on veut le bénéfice (§2).
3. 20 graines ne suffisent pas pour les « 5 % de pires cas » (CVaR 95 %) du rapport critères : c'est une seule simulation. Il en faut 100 à 500 ; chaque simulation coûte environ 0,3 s (estimé depuis PLANS.md : ~2 min pour 360 runs), donc c'est gratuit.
4. Il faut ajouter une deuxième barre d'incertitude : « si les paramètres sont faux dans leurs fourchettes publiées, le verdict tient-il ? » (1 heure de calcul, §3).
5. Le jury doit lire : « le plan APRÈS gagne sur la zone de danger, perd sur t90, dans ce modèle simplifié ; ce verdict tient (ou non) sous N variations de paramètres ; ce n'est pas une prédiction ».

## 1. Combien de simulations (question 1)

**Correction de référence.** Ronchi, Reneke, Peacock, « A method for the analysis of behavioural uncertainty in evacuation modelling », Fire Technology, DOI 10.1007/s10694-013-0352-7 : le NIST la date de **2013** (en ligne) ; le volume imprimé est `[?]`. Ne pas écrire 2014 devant un jury ([page NIST](https://nist.gov/publications/method-analysis-behavioural-uncertainty-evacuation-modelling) [lu]). Elle est aussi reprise dans [NIST TN 1822 §4.1](https://nvlpubs.nist.gov/nistpubs/technicalnotes/NIST.TN.1822.pdf) [lu].

**Le critère (Ronchi 2013, résumé par l'article de 2014).** On répète le même scénario ; chaque run donne une courbe « personnes sorties en fonction du temps » (OETC). Cinq mesures de convergence sont suivies run après run : moyenne et écart-type du temps total d'évacuation (TET), et trois mesures « d'analyse fonctionnelle » de la courbe moyenne ([Lovreglio, Ronchi, Borri 2014 (noms déduits des affiliations) `[?]`, §2.1](https://sciencedirect.com/science/article/pii/S0951832014001628) [lu]). On s'arrête quand les cinq restent sous un seuil pendant *b* runs de suite. Le principe repose sur le théorème central limite ; les seuils sont choisis par l'utilisateur (par ex. incertitude d'un calcul d'incendie ou d'essais répétés) [lu].
- **ERD** (différence euclidienne relative) : 0 si les deux courbes sont identiques ; petit = proches. Forme usuelle ‖x−y‖/‖y‖ `[?]` (annexe de l'article illisible après extraction).
- **EPC** (coefficient de projection) : produit scalaire normalisé x·y/‖y‖² ; vaut 1 si identiques [lu pour le sens, forme `[?]`].
- **SC** (cosinus des sécantes) : compare la forme (pente) des courbes ; paramètre « skip » *s* qui lisse le bruit ; *s/n* conseillé 0,03 à 0,05 (Galea) [lu].
- Exemple publié : 30 agents, FDS+Evac, arrêt automatique à **52 runs** ; ERD converge à 20, SC à 29, EPC à 41, TET et écart-type à 42 [lu].

**Nombres proposés dans la littérature (pour situer 20).** Train à grande vitesse : 10 runs ; IMO (navires) : minimum 500 pour le 95e centile du TET ; aviation : 1000 ; bâtiments : 2000 pour tracer une distribution. « Pas de consensus, peu de justification » ([Fire Technology 2020, introduction](https://link.springer.com/article/10.1007/s10694-020-00968-0) [lu]).

**Intervalles de confiance à n fixé (même article 2020).**
- La largeur de l'IC de la moyenne et de l'écart-type diminue en 1/√n (table 8, [lu]) ; pour l'écart-type c'est lent : à 10 runs l'erreur est de −24 % à +60 %, à 40 runs de −19 % à +30 % [lu].
- Il propose un minimum de **40 runs** avant de tester la convergence, et pour la moyenne une tolérance typique de 0,02 en largeur normalisée (≈ ±1 %) [lu].
- Plus récent : [Smedberg, Kinsey, Ronchi 2021](https://link.springer.com/content/pdf/10.1007/s10694-021-01134-w.pdf) [lu] : critères « multifactoriels » (densité, débits, usage des sorties, files) sur un bâtiment de 1855 personnes, parce que le seul temps total peut converger alors que le reste non.

**Nos 20 graines, verdict (calcul).** Écart-type relatif de chaque critère par plan : t90 0,35 % (avant) et 0,43 % (après) ; t99 0,8 % et 1,0 % ; continuité 0,8 % ; zone de danger 1,15 % ; note 0,17 %. Nombre de graines pour une demi-largeur de ±1 % de la moyenne : n = (1,96·CV/0,01)² ≤ 5. La moyenne a convergé dès 10 graines (écart de la moyenne glissante à 10 graines par rapport à celle à 20 : 0,02 à 0,26 %). Donc **oui pour la moyenne**.
**Non pour** : (a) le CVaR 95 % et tout percentile élevé (5 % de 20 = 1 run) ; (b) l'écart-type (±30 % d'erreur à 40 runs) ; (c) la courbe entière (ERD/EPC/SC, jamais testés chez nous) ; (d) les critères à 0 (non-sortis, écrasement) : un IC [0 ; 0] n'est pas un résultat, c'est un plafond.

**Vérification automatique (à brancher dans `bench/`).**
1. Graines par lots : 1-20 déjà fait, puis jusqu'à N = 100 (final) ou 500 si on affiche un percentile.
2. Après chaque graine ≥ 20, pour chaque critère : demi-largeur IC/|moyenne| ≤ 1 % **et** moyenne glissante des 10 dernières graines stable à ±0,5 %. Si un critère échoue, la colonne `converge` vaut `non`.
3. Pour la courbe : exposer les « sortis cumulés » toutes les 5 s (`JournalRun.minutes` est au pas d'une minute, trop gros pour t90 ≈ 315 s), calculer ERD/EPC/SC de la courbe moyenne à *k* graines contre celle à *k*−1, seuil proposé 0,02 pendant *b* = 5 graines `[?]` (seuil à nous, non publié).
4. Pour un percentile : IC bootstrap du 95e centile (§2) et refus d'afficher si moins de 100 graines.
Coût : 100 graines × 2 plans ≈ 1 min ; 500 ≈ 3 min `[?]` (extrapolé).

## 2. Comparer deux plans (question 2)

**Nombres aléatoires communs.** On donne la même graine aux deux plans pour que « les mêmes personnes » vivent les deux plans. La variance de la différence est Var(d̄) = (σA² + σB² − 2ρ σA σB)/n : le gain n'existe que si la corrélation ρ entre plans est positive (principe de Law & Kelton, lu seulement via les titres de [ScienceDirect](https://sciencedirect.com/science/article/pii/037722179090378O) `[?]`).
**Chez nous (calcul)** : population identique par graine (`creerPopulation`) mais ρ vaut −0,13 (zone de danger), −0,04 (t90), 0,10 (t99), −0,21 (continuité), −0,17 (note). Demi-largeurs appariée vs non appariée : t90 1,15 vs 1,10 s ; zone de danger 103,5 vs 96,8. **Aucun gain.** Cause probable (lecture de `simuler.ts` ligne 79) : un seul flux `rng(graine ^ 0x9e3779b9)` pour toutes les décisions ; dès que les plans diffèrent (messages, guidage), le nombre de tirages consommés diverge et les flux se décalent. Correctif : un tirage dérivé de (graine, id de la personne, usage), indépendant de l'ordre. Gain attendu : seulement si les décisions personnelles dominent la variance `[?]` ; à tester, sans engagement.

**Différence appariée et IC (formules).** Pour *n* graines, dᵢ = Bᵢ − Aᵢ (après − avant) :
- d̄ = (1/n)Σdᵢ ; s_d = √[Σ(dᵢ − d̄)²/(n−1)] ; IC 95 % = d̄ ± t(n−1 ; 0,975)·s_d/√n.
- t(19 ; 0,975) = 2,093 (vérifié, calcul) ; t(99 ; 0,975) = 1,984. **Défaut du code** : `stats()` met 1,96 dès que n ≠ 20 (par ex. 19 différences, 18 ddl, si une valeur manque). Utiliser une petite table ou une fonction ; 1,96 au lieu de 2,101 rend l'IC 7 % trop étroit.
- Bootstrap percentile : tirer *n* différences avec remise, recalculer d̄, 5000 fois, prendre les 2,5 % et 97,5 %. Test sur t90 (calcul) : bootstrap [185,2 ; 187,3] contre t [185,0 ; 187,4] : identiques. Le bootstrap sert pour les critères asymétriques et les percentiles ; BCa seulement au-delà de ~30 graines `[?]` ([comparatif, snippet](https://brandon-behring.github.io/eval-toolkit/methodology/bootstrap.html)).
- Plusieurs critères = plusieurs tests : Bonferroni sur 10 critères, IC à 99,5 % : t(19 ; 0,9975) = 3,17 (calcul).

**Taille d'effet.** d_z = d̄/s_d (différence standardisée appariée ; [Lakens 2013](https://frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00863/pdf) `[?]` extrait de recherche). Chez nous d_z = 75,6 (t90), 32 (t99), −19,6 (zone de danger), 12,5 (note), −2,3 (continuité) : énorme, car le bruit est minuscule. Donc d_z ne doit pas être mis en avant seul : **afficher la différence relative** d̄/Ā en %, car c'est elle qu'on compare aux 30 % du modèle. Calcul : zone de danger −24,5 % ; t90 +59 % ; t99 +52 % ; continuité −2,2 % ; note +2,4 %. Continuité (−2,2 %), note (+2,4 %) et zone de danger (−24,5 %) sont **sous 30 %** ; seuls t90 et t99 (+52 à +59 %) la dépassent. Si on appliquait le 30 % tel quel, la zone de danger serait « indistincte ». Réserve : le 30 % vient d'un temps de déplacement dans un amphi, pas d'une exposition cumulée à une zone ; c'est la sensibilité (§3) qui doit trancher, et le jury doit voir les deux chiffres.

**Quand dire « pas de différence ».** Ne jamais conclure sur « l'IC contient 0 ». Règle : fixer avant de lancer une marge Δ (plus petite différence qui compte), puis test d'équivalence TOST : équivalent si l'IC à **90 %** de d tient dans [−Δ ; +Δ] ([Lakens 2017](https://journals.sagepub.com/doi/abs/10.1177/1948550617697177) `[?]` résumé de recherche). Proposition de Δ : 5 % de la moyenne « avant » pour le bruit ; et un second drapeau « sous l'incertitude de modèle » si |diff relative| < 30 %. Verdicts possibles dans le CSV : `mieux`, `pire`, `equivalent`, `indistinct` (ni l'un ni l'autre), `plafond` (écart-type nul).

**Bonne pratique déjà présente.** `bench/PLANS.md` choisit sur les graines 1-20 et rapporte sur 101-120 : à garder (écart train/test < 1 %, [lu] dans PLANS.md). Pour avant-apres, faire de même : plans figés, rapport sur 101-200.

## 3. Incertitude de modèle et de paramètres (question 3)

**Quatre composantes** (Ronchi 2014, [lu]) : incertitude des paramètres d'entrée ; de mesure ; **intrinsèque** (formulation du modèle) ; **comportementale** (le hasard). Nos 20 graines ne couvrent que la dernière.
**Ordre de grandeur de l'écart de modèle.** Huit logiciels sur un même amphithéâtre (640 places + 360 debout) donnent jusqu'à **30 %** d'écart sur le temps de déplacement ; causes : débits dans les escaliers, choix d'issue, géométrie, hypothèses non documentées ; « pas de comparaison à des données réelles » ([RiMEA 2025](https://rimea.de/wp-content/uploads/2025/10/2025-10-15-rimea-workshop-vortrag-hoersaalbeispiel.pdf) [lu]). Cette diapositive dit aussi que la norme **DIN 18009-2** tient compte de ces écarts et recommande une **analyse de sensibilité** [lu]. Le 30 % vient donc d'un cas d'amphi, pas du Forum : à dire.
**Un écart concret dans NOTRE modèle.** `DEBIT_PAR_METRE = 1,3` pers/s/m (SFPE, 1,30 pour 1 m). Les mesures de Jülich donnent une débit spécifique de ≈ **1,9 /(m·s)** (1,6 à 2,3 pour 0,8 à 1,2 m de largeur, table 2) et SFPE donne 1,30 pour 1 m (table 1 : 1,04 pour 0,8 m) ([Seyfried et al. 2007](https://arxiv.org/pdf/physics/0702004v2) [lu]). Notre débit est donc ~32 % sous la mesure de laboratoire (1,3/1,9 = 0,68, calcul), c'est-à-dire le même ordre que le 30 %. Vitesse libre : Weidmann 1,34 m/s ([Seyfried 2005](https://arxiv.org/pdf/physics/0506170) [lu]) contre N(1,2 ; 0,2) tronquée à [0,8 ; 1,6] chez nous.

**Méthode réaliste en 1 heure, dans l'ordre.** La sortie à surveiller n'est pas la valeur absolue mais **la décision** : le plan APRÈS reste-t-il meilleur en zone de danger et pire en t90 ?
1. **Un paramètre à la fois (15 min).** 8 paramètres × {bas, haut} × 2 plans × 20 graines = 640 runs ≈ 3,5 min `[?]`. Candidats et fourchettes : débit/m [1,0 ; 1,9] (SFPE à Jülich, lu ci-dessus) ; vitesse moyenne [1,0 ; 1,4] ; médiane du délai de départ 40,5 s ×/÷2 (aucune source de fourchette : `[?]`) ; part qui connaît la sortie de secours 0,25 [0,10 ; 0,50] `[?]` ; clarté du message 0,9 vs 0,5 (déjà dans les plans) ; part PMR ; poids `POIDS` de `sortie.ts` ±1 écart ; tau de reprise 5-30 s (code : « paramètre balayé, pas une mesure »). Sortie : tableau « paramètre → variation de la différence » ; c'est un diagramme en tornade.
2. **Monte-Carlo sur les paramètres (25 min).** Tirer 200 jeux dans les fourchettes (hypercube latin), 5 graines communes × 2 plans = 2000 runs ≈ 11 min `[?]`. Rapporter : plage 5-95 % de la différence relative, **part des jeux où APRÈS bat AVANT** sur la zone de danger, et corrélation de rang partielle (PRCC) de chaque paramètre avec la différence = indice de sensibilité bon marché.
3. **Morris (optionnel, 10 min).** r·(k+1) = 10 × 9 = 90 jeux, 5 graines, 2 plans = 900 runs ; donne μ* (poids) et σ (interactions) par paramètre ; méthode de criblage OAT par trajectoires ([Wikipédia, méthode des effets élémentaires](https://en.wikipedia.org/wiki/Elementary_effects_method) [lu] ; original Morris 1991, Campolongo 2007 `[?]`).
4. **Sobol : non.** Estimateur de Saltelli ≈ N(k+2) évaluations ; avec k = 8, N = 256, 2 plans, 5 graines ≈ 25 000 runs ≈ 2 h+ `[?]` : hors budget. À mentionner comme « suite », pas à promettre.
Chaque run est un modèle simplifié : le résultat dit « le verdict est robuste (ou pas) à ces fourchettes », jamais « le modèle est exact ».

## 4. Validation (question 4)

**Cadres.**
- **NIST TN 1822** ([Ronchi et al.](https://nvlpubs.nist.gov/nistpubs/technicalnotes/NIST.TN.1822.pdf) [lu, extrait]) : 5 composantes à tester : pré-évacuation, mouvement et navigation, choix des sorties, disponibilité des routes, contraintes de flux. Quatre formes de vérification (composants, fonctionnelle, qualitative, quantitative) puis validation quantitative contre des données expérimentales, avec l'incertitude comportementale (§4.1 de la note).
- **ISO 20414:2020** : protocole de vérification et validation des modèles d'évacuation de bâtiments ; liste de composants, méthode d'évaluation de l'exactitude et des critères d'acceptation, modèle de rapport (annexe A), exemples (annexe B). Norme payante (204 CHF), **texte non lu**, seulement le résumé ([ISO](https://iso.org/cms/%20render/live/en/sites/isoorg/contents/data/standard/07/83/78348.html?browse=ics) [lu, résumé]). Hors champ : trains et navires.
- Citer seulement : « nos tests suivent la logique de NIST TN 1822 et du protocole ISO 20414 ; nous n'avons pas fait une validation ISO ».

**Cas RiMEA (guide v2.2.1 : 14 tests ; la v3 est à vérifier `[?]`).** Tolérances ci-dessous lues dans ([Crowd Control/Siemens, Springer](https://link.springer.com/article/10.1007/978-3-319-27753-0_8) [lu]) et, pour les composants, ([IMO MSC.1/Circ.1533](https://imorules.com/GUID-9EC122B0-DBCC-405B-8650-82D745790F54.html) [lu]).

| Test | Ce qu'il vérifie | Faisable chez nous ? |
|---|---|---|
| 1 | Une personne à 1,33 m/s dans un couloir de 40 m : temps 26-34 s | **Oui**, test unitaire sur `mouvement-simple.ts` : 40/1,33 = 30,1 s |
| 2, 3 | Vitesse en escalier montant/descendant (10 m) | Non (pas de géométrie) |
| 4 | Diagramme fondamental (débit selon la densité, anneau 70-74 m) | **Non** : modèle de file, sans relation vitesse-densité (déjà dit dans PLANS.md) |
| 5 | Délais de départ 10-100 s : chaque personne part à son heure | **Oui** (délai déjà tiré par personne) |
| 6 | 20 personnes tournent à un angle sans traverser un mur | Non |
| 7 | 50 personnes : vitesses conformes à la table d'âge | Partiel (table non lue `[?]` ; nos vitesses sont N(1,2 ; 0,2)) |
| 8 | Changer un paramètre individuel change le temps total dans le bon sens | **Oui** (3 niveaux ; sens attendu) |
| 9 | 1000 personnes, 4 sorties puis 2 : rapport des temps entre 0,4 et 0,6 | **Oui** (file proportionnelle au débit : ≈ 0,5) |
| 10 | Les personnes suivent leur issue assignée | **Oui** (messages/guidage) |
| 11 | Choix d'issue : plus de monde sur la proche, au moins 20 % sur l'autre | **Oui, important** : teste le choix et le délestage |
| 12 | Goulot : la densité monte avant, pas après | Partiel : densité de zone d'approche seulement |
| 13, 14 | Escalier et goulot multi-niveaux ; choix de route entre étages | Non |
| IMO 4 | 100 personnes, sortie de 1 m : débit ≤ 1,33 pers/s | **Oui**, mais **c'est une tautologie** (débit = 1,3 par construction) : à le dire |
Donc 6 à 7 tests sur 14 sont faisables. Ils vérifient que le code fait ce qu'on dit (vérification), pas que le Forum sera évacué comme prévu (validation). Ne pas écrire « conforme RiMEA » ; écrire « 7 tests RiMEA/IMO de composants passés ».

**Données ouvertes de Jülich.** [Archive de données](https://ped.fz-juelich.de/db) (DOI 10.34735/ped.da) [lu] : vidéos et trajectoires d'expériences, utilisables à condition de citer la source [lu]. Je n'ai pas ouvert les fiches de chaque expérience `[?]`. Deux jeux utiles et déjà décrits dans des articles lus : (a) goulots (largeurs 0,8-1,2 m, 20-60 personnes) → débit spécifique ≈ 1,9 /(m·s) ([Seyfried et al.](https://arxiv.org/pdf/physics/0702004v2) [lu]) ; (b) file indienne, diagramme fondamental, vitesse libre 1,34 m/s ([Seyfried 2005](https://arxiv.org/pdf/physics/0506170) [lu]). **Test de validation réaliste (1/2 journée)** : reproduire (a) avec notre mouvement, comparer le débit (attendu : 1,3 contre 1,9, soit −32 % : l'écart est le résultat et il est publié, pas caché). Ne pas valider l'écrasement : aucun jeu de données lu ne le permet pour un souterrain.

## 5. Ce qu'on change dans le code et le CSV

**Défauts constatés (à corriger, `bench/avant-apres.ts`).**
1. **CSV cassé** : la colonne `avertissement` contient une virgule (« modèle simplifié, non certifié ») non entre guillemets ; l'en-tête a 14 champs, chaque ligne 15 (calcul `awk`). Un tableur décale les colonnes. Entourer de guillemets ou remplacer la virgule.
2. `stats()` : 1,96 si n ≠ 20 (voir §2) ; remplacer par une fonction de quantile de Student.
3. Critères à variance nulle (non-sortis 22 h/23 h, écrasement) : afficher `plafond`, pas un IC [0 ; 0].
4. t90 et t99 sont des entiers (pas de 1 s) : le dire.

**Colonnes à ajouter à `resultats.csv`** : `n_graines`, `jeu_graines` (entrainement 1-20 / rapport 101-200), `ecart_type_avant`, `ecart_type_apres`, `ecart_type_diff`, `cv_pct`, `rho_apparie`, `diff_relative_pct`, `d_z`, `ic95_diff_t_bas/haut`, `ic95_diff_boot_bas/haut`, `converge` (oui/non), `n_requis_1pct`, `verdict` (mieux/pire/equivalent/indistinct/plafond), `seuil_modele_pct` (30), `sous_incertitude_modele` (oui/non), `plage_sensibilite_bas/haut`, `part_jeux_apres_meilleur_pct`, `commit`, `date`. Colonne `avertissement` conservée, entre guillemets.

**Phrase d'avertissement (README et en-tête du CSV).** « Modèle simplifié, non certifié, scène illustrative. Les intervalles à 95 % ne mesurent que le hasard des personnes (20 graines) ; ils ne comprennent pas l'erreur du modèle, qui atteint 30 % entre logiciels de référence (RiMEA) ni l'incertitude des paramètres, étudiée à part. Ces chiffres comparent des plans, ils ne prédisent pas un temps d'évacuation. »

**Section README « Validation »** : tableau §4 (tests passés / non applicables), écart de débit 1,3 contre 1,9, résultat de la sensibilité (§3), limites (aucune donnée du Forum, aucun écrasement), mention « ISO 20414 non appliqué ». Tests à ajouter dans `comportement.test.ts` : RiMEA 1, 5, 8, 9, 10, 11, IMO 4 (7 tests courts).

**Ordre de travail (≈ 2 h).** 1) corriger CSV + `stats()` (15 min) ; 2) 100 graines + colonnes (20 min) ; 3) 7 tests (40 min) ; 4) sensibilité §3 étapes 1-2 (45 min) ; 5) CRN par personne seulement s'il reste du temps.

## 6. Ce qu'on dit au jury
« Sur 20 populations simulées identiques pour les deux plans, le plan décideurs réduit l'exposition à la zone de danger d'environ 25 % mais allonge t90 d'environ 60 % ; le hasard des populations pèse moins de 1 %. Ce n'est pas la vraie incertitude : les logiciels de référence s'écartent jusqu'à 30 % entre eux, c'est pourquoi nous avons fait varier nos paramètres dans leurs fourchettes publiées et indiquons la part des cas où le verdict tient. [À dire seulement une fois les 7 tests écrits et passés.] Le simulateur a passé sept tests de composants RiMEA/IMO et son débit de porte (1,3) est 32 % sous les mesures de laboratoire de Jülich (1,9) : nous comparons des plans, nous ne prédisons pas une évacuation. »
