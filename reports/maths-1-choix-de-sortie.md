# Maths 1 : le choix de sortie, du logit à l'équilibre (SUE / Wardrop / Nash)

Ticket #9, lot foule-decision. Recherche du 22 oct. 2026, aucun LLM payant, aucun code modifié. `[lu]` = chiffre lu dans la source ouverte. `[?]` = non vérifié. `[calcul]` = calculé ici (script du 22 oct., refait à la demande). Complète `instantane-4-decision-humaine.md` §2 sans le répéter.

## 0. Version simple

1. Le logit est une balance à raisons : chaque porte reçoit un score, la probabilité de la choisir est son score « exponentié » divisé par la somme. Le modèle est correct comme brique ; **on le garde**.
2. Deux défauts réels : (a) la normalisation de distance « 0 à 3 m équivalents » donne la même pénalité à un écart de 5 m et à un écart de 500 m ; (b) l'écart-type 0,08 du suivisme n'existe dans aucune des deux sources de Lovreglio.
3. Le lien avec l'équilibre est direct : logit + file d'attente = « équilibre stochastique de l'usager » (SUE). Quand les gens deviennent parfaitement rationnels (échelle θ → ∞), on retombe sur Wardrop/Nash : toutes les portes utilisées ont le même temps.
4. Avec 3 000 personnes, la file écrase le suivisme : l'équilibre est unique, pas de « tout le monde par une porte » (sauf petits groupes < 60 personnes ou suivisme > 2).
5. Correctif proposé : un seul paramètre d'échelle θ = 0,9 par minute pour la marche et l'attente (temps de trajet total), plus un test automatique qui compare la simulation à l'équilibre calculé.

## 1. Théorie de l'utilité aléatoire

**Idée.** La personne q juge chaque porte i par une utilité U = V + ε. V est la partie que le modèle voit (distance, consigne...). ε est la partie qu'il ne voit pas (humeur, vue sur la porte...), traitée comme un tirage au hasard. La personne prend la porte d'utilité maximale.

**Dérivation du logit** (Train, ch. 3 [lu] https://eml.berkeley.edu/books/choice2nd/Ch03_p34-75.pdf). Si les ε sont indépendants et suivent la loi de Gumbel (valeur extrême de type I, fonction de répartition F(ε) = exp(−exp(−ε)), variance π²/6), alors la probabilité que i soit le maximum est
`P(i) = exp(V_i) / somme_j exp(V_j)`.
C'est une propriété de cette loi : la différence de deux Gumbel suit une loi logistique, d'où la forme « sigmoïde ». C'est ce qu'écrit aussi le préprint de Lovreglio (éq. 1-3) [lu] https://arxiv.org/pdf/2110.11577v1.

**Sens des coefficients.** Un coefficient β est un gain d'utilité par unité de la variable ; il n'a de sens qu'avec l'échelle fixée par la variance π²/6. Doubler tous les β revient à diviser le bruit : le choix devient plus « raisonné » (Train §3.2, « scale parameter » [lu]). C'est exactement le rôle de θ plus bas.

**Rapport de coefficients = équivalent en mètres.** Valeur d'une variable x en mètres = β_x / |β_distance|. Avec les erreurs-types du préprint (covariance ignorée, méthode delta) [calcul] :
| Variable | β (erreur-type) [lu] | Équivalent en m |
|---|---|---|
| porte connue | 0,795 (0,206) | 2,10 ± 0,70 m de détour |
| fumée | −1,765 (0,161) | 4,67 ± 1,06 m (plus que toute la plage testée, 3 m) |
| une personne de plus vers la porte | 0,076 (0,015) | 0,20 ± 0,06 m |
Source des β : https://arxiv.org/pdf/2110.11577v1 (Tables 3 et 4). Les ± sont à ne pas surinterpréter : les 344 choix viennent de 86 personnes qui en font 4 chacune.

**IIA (indépendance vis-à-vis des alternatives non pertinentes).** Dans le logit, le rapport P(i)/P(j) ne dépend pas des autres portes (Train §3.3.2 [lu]). Problème du « bus rouge / bus bleu » : voiture et bus bleu à 50/50 ; on ajoute un bus rouge identique ; le logit répond 1/3 chacun, alors que le réel est 1/2, 1/4, 1/4. **Pour nous** : deux portes accolées (même couloir, même escalier) sont presque la même alternative ; le logit leur donne le double de poids d'une porte isolée. La file corrige en partie (les deux portes se partagent une file), mais le choix initial est biaisé.
**Correctifs** :
- *Logit emboîté* (nested logit) : on regroupe les portes voisines en un « nid » m. `P(i) = P(nid m) × P(i | m)` avec `P(i | m) = exp(V_i/λ) / somme_{j du nid} exp(V_j/λ)` et `P(m) = exp(λ·I_m) / somme_n exp(λ·I_n)`, `I_m = ln somme_{j du nid} exp(V_j/λ)`. λ entre 0 et 1 : λ = 1 redonne le logit ; plus λ est petit, plus les portes du nid sont corrélées (1−λ sert d'indicateur de corrélation) (Train ch. 4 [lu] http://eml.berkeley.edu/books/choice2nd/Ch04_p76-96.pdf). Aucune valeur de λ publiée pour des portes : **à fixer (0,5 ?) `[?]`**.
- *Correction de taille* (« path-size logit », Ben-Akiva et Bierlaire 1999, cité dans https://sciencedirect.com/science/article/pii/S0965856412000675 [lu], formule exacte non lue `[?]`) : on ajoute ln(1/n_i) à V_i, où n_i = 1 + somme_{j≠i} exp(−d_ij/d0) compte les portes voisines (d_ij = distance entre portes). Pour n portes identiques collées, la grappe pèse alors exactement une porte. Adaptation à vérifier `[?]` ; la plus simple à coder (6 lignes).
- *Logit mixte* : toute loi d'utilité aléatoire peut être approchée à volonté par un logit mixte (McFadden et Train 2000, Train ch. 6 [lu] http://eml.berkeley.edu/books/choice2nd/Ch06_p134-150.pdf). Notre logit mixte ne tire qu'**un** coefficient (le suivisme) : il traite la variété des goûts, **pas** la corrélation entre portes voisines. Les deux problèmes sont distincts. Dans la VR métro 2025, passer du logit simple au mixte améliore la vraisemblance (−485,12 → −477,54) mais ne change aucun choix prédit (77 % de bons choix dans les deux cas) [lu] https://link.springer.com/content/pdf/10.1007/s10694-025-01746-6.pdf.

## 2. Vérification des poids et transfert à 50-150 m

**Préprint arXiv 2110.11577v1** (Lovreglio, Dillies, Kuligowski, Rahouti, Haghani) [lu] : chiffres de `instantane-4` confirmés à l'identique. Contexte : 86 personnes, 4 scénarios chacune parmi 8 = 344 choix ; 3 portes ; distances 3,0 à 6,0 m ; nombre de personnes vers la porte 0/1/5/10 (PNJ) ; fumée 0/1 ; porte A seule connue ; casque HTC Vive, fausse alerte incendie. Modèle 2 (premier essai, personnes non prévenues) : suivisme 0,041 + 0,192 = 0,233 par personne ; distance −0,439 (+0,218 non significatif, p = 0,28) ; fumée −2,305 + 1,781 [lu]. Version publiée éventuelle : `[?]`.
**Point nouveau, important** : ce préprint n'estime **aucun** logit mixte. Il écrit explicitement ne pas étudier l'hétérogénéité par paramètres aléatoires [lu]. Donc « suivisme 0,076 ± 0,08 » mélange une moyenne du préprint et un écart-type **sans source**.
**VR métro, Fire Technology 2025** [lu] (131 personnes, 1 048 choix, 2 sorties, 0/1/10/20 évacuants virtuels, https://link.springer.com/content/pdf/10.1007/s10694-025-01746-6.pdf) :
| Modèle | Constante droite | β suivisme (NPC) | β personnel (I) | β pompier (FF) |
|---|---|---|---|---|
| Logit simple | 0,263 (0,115) | 0,035 (0,010) | 2,739 (0,225) | 0,559 (0,329) |
| Logit mixte | 0,284 (0,119) | 0,039 (0,011), écart-type 0,053 (0,015) | 3,276 (0,340), écart-type 1,027 (0,319) | 0,647 (0,361) |
Avec 0,039 ± 0,053, **23 %** des personnes ont un suivisme négatif (elles évitent la foule) [calcul]. Rapport écart-type/moyenne = 1,36. Appliqué à 0,076 : écart-type **0,10**, pas 0,08.
**Autres voisins** : Lovreglio, Fonzone, dell'Olio 2016, logit mixte sur 1 503 participants (vidéos non immersives) : fumée, éclairage, distance, gens près des portes et flux sont significatifs, forte incertitude de comportement [lu, résumé] https://trid.trb.org/View/1422558 ; coefficients derrière un accès payant `[?]`. Lovreglio et al. 2016 (221 répondants, 2 portes, vidéos) : le suivi de la porte la plus pleine **diminue** quand l'écart de foule entre portes est très grand [lu] https://sciencedirect.com/science/article/pii/S0925753515002763 : le suivisme est borné, pas linéaire. Haghani et Sarvi : voir `instantane-4` §2 (pas de coefficient lu ici `[?]`).

**Transférabilité.** Tous les poids viennent de pièces à 3-6 m, de gens qui regardent des PNJ et choisissent en quelques secondes. Aucune source ne couvre 50-150 m. Deux extensions de sens dans notre code : « issue connue fermée » reprend le poids de la **fumée** (une porte fermée n'est pas une porte enfumée) ; la consigne continue [0,1] interpole entre « personnel absent » et « personnel présent » (binaire en VR).

**La normalisation 0-3 m est-elle défendable ?** À moitié.
- Pour : l'écart maximal du préprint est 3 m ; la pénalité de toute la plage vaut −0,378 × 3 = −1,13 ; on garde l'ordre de grandeur des probabilités.
- Contre (1) : deux portes à 50 et 55 m reçoivent −1,13, comme 50 et 150 m. L'écart absolu disparaît. (2) Ajouter une porte lointaine inutilisée change la pénalité de toutes les autres : le résultat dépend de l'ensemble des portes.
- Les données ne tranchent pas : sur les 5 paires de distances du préprint, une forme en log du rapport (β = −1,64 × ln(d_i/d_min), calée sur 6 m contre 3 m) s'écarte de la forme linéaire de 0,1 au plus [calcul]. La VR ne peut pas distinguer « écart absolu » de « écart relatif ».
- Argument théorique pour une échelle qui suit la longueur du trajet : l'incertitude de perception grandit avec la distance (modèles « scaled » du logit SUE) [lu, résumé] https://sciencedirect.com/science/article/pii/S0965856412000675.

**Mieux : le temps de trajet.** `V_dist = −θ × t_marche` (minutes, vitesse 1,3 m/s = 78 m/min), avec le **même** θ que la file. Avec θ = 0,9 par minute (valeur déjà dans le code, hypothèse de réglage `[?]`) : 5 m d'écart = −0,06 ; 100 m = −1,15 [calcul], soit la pénalité de la plage VR (−1,13). La cohérence est une coïncidence de réglage, pas une validation. Le multiplicateur « attente = 2 × marche » n'est pas retenu : les deux sont comptés pareil dans la convention des transports (×2 sur le temps en véhicule), la méta-analyse 2026 propose 1,5 à 1,75 pour les deux [lu, transport public, transfert `[?]`] https://eprints.whiterose.ac.uk/id/eprint/239301/1/1-s2.0-S0965856426000662-main.pdf. Balayer θ dans {0,3 ; 0,9 ; 3}.

## 3. Suivisme comme interaction sociale (Brock et Durlauf)

**Modèle** (Review of Economic Studies 2001, https://hceconomics.uchicago.edu/sites/default/files/pdf/events/Brock_Durlauf_2001_REStud_v68-N2.pdf [lu]). Choix ω = ±1. Utilité = h·ω + J·ω·m_attendu + ε, avec ε de valeur extrême (différence logistique). Chaque personne anticipe la moyenne m des choix des autres, et l'équilibre est cohérent quand m = tanh(β·h + β·J·m) (éq. 12).
- Prop. 1 : un équilibre existe toujours (théorème du point fixe de Brouwer) [lu].
- Prop. 2 : si βJ > 1 et h = 0, il y a trois solutions (m > 0, m = 0, m < 0) ; si h ≠ 0, trois solutions tant que |βh| est sous un seuil H, une seule au-delà [lu]. Le biais privé (distance, porte connue) peut « casser » les équilibres multiples.
- Dynamique : m = 0 est instable dès que βJ > 1 ; les deux solutions extrêmes sont stables [lu].

**Traduction pour nous** [calcul, vérifié numériquement]. Notre terme est γ·part_foule avec γ = 10 × β_suivisme (part en 0-1, échelle 0-10 personnes du préprint). Pour 2 portes symétriques, p = σ(ΔV + γ(2s−1)) donne m = tanh(ΔV/2 + γ·m/2) : **βJ = γ/2**, donc équilibres multiples si γ > 2, soit **β > 0,2 par personne**. Pour K portes identiques (linéarisation du softmax) : γ > K.
| Cas | β | γ = 10β | K=2 | K=3 |
|---|---|---|---|---|
| préprint, moyenne | 0,076 | 0,76 | unique | unique |
| mixte : moyenne + 2 écarts-types (0,10) | 0,28 | 2,8 | multiple | unique |
| préprint, premier essai (non prévenus) | 0,233 | 2,33 | multiple | unique |
| VR métro, moyenne | 0,039 | 0,78 (échelle 20 pers.) | unique | unique |

**Avec la file.** La file est une rétroaction négative : plus une porte se remplit, moins elle attire. Condition de symétrie brisée avec congestion : **γ − θ·N/(60·débit) > K** [calcul]. Test numérique, 2 portes identiques de 2 m (débit 2,6 p/s), θ = 0,9/min, γ = 2,33 : équilibres multiples (0,27 / 0,5 / 0,73) pour N = 30, un seul (0,5) dès N = 60 ; avec γ = 5, multiple jusqu'à N = 400. Pour N = 3 000 : θ·N/(60·débit) ≈ 17, bien au-dessus de γ : un seul équilibre.
**Implications.** (i) Le « tout le monde par une porte » ne vient que d'un suivisme fort, de petits groupes ou d'un début d'évacuation où les files sont vides. (ii) La simulation étant séquentielle, les 100 premiers à choisir voient des files courtes : dépendance au chemin (graine) possible. **Rapporter la dispersion sur 30-50 graines** et tester β = 0,233 comme scénario « personnes surprises » (couvre-feu non annoncé). (iii) Pas de conclusion sur la réalité : aucune donnée n'est à cette échelle.

## 4. Lien avec l'équilibre : SUE, Wardrop, Nash

**Définitions.**
- *Wardrop* (1952) : chaque personne choisit la route de coût minimal ; à l'équilibre, tous les chemins utilisés ont le même coût et les autres sont plus chers.
- *SUE* (Daganzo et Sheffi 1977) : chaque personne perçoit le coût avec une erreur et prend le chemin qui **lui paraît** le moins cher ; avec des erreurs de Gumbel, les flux vérifient `x_k = N × exp(−θ·c_k(x)) / somme_j exp(−θ·c_j(x))` : logit où le coût dépend du flux. Cadre rappelé dans https://sciencedirect.com/science/article/pii/S0191261515301351 [lu, résumé].
- *Fisk 1980* : ce point fixe est le minimum d'un problème d'optimisation, avec Wardrop comme cas particulier [lu, résumé] https://econpapers.repec.org/article/eeetransb/v_3a14_3ay_3a1980_3ai_3a3_3ap_3a243-255.htm. Forme (portes disjointes, flux total N) : minimiser `Z(x) = somme_k ∫_0^{x_k} c_k(u) du + (1/θ) × somme_k x_k·ln(x_k)`. Dérivée : c_k + (ln x_k + 1)/θ = constante, donc x_k ∝ exp(−θ·c_k) [calcul]. La forme exacte du papier n'est pas lue `[?]` (accès payant).
- *Nash* : un SUE logit est un équilibre de réponse quantale (McKelvey et Palfrey 1995) : chacun joue la probabilité logit contre les autres ; quand λ (rationalité) → ∞, on tend vers Nash [lu] https://en.wikipedia.org/wiki/Quantal_response_equilibrium. Logit = maximisation perturbée, qui tend vers le maximum non perturbé quand le bruit → 0 (Hofbauer et Sandholm 2002 [lu] https://homepage.univie.ac.at/josef.hofbauer/02ec.pdf). **Notre θ est l'inverse du bruit : θ → ∞ = Wardrop/Nash.**

**Existence, unicité.** Existence : la fonction x → N·softmax(−θ·c(x)) est continue sur un ensemble compact : Brouwer. Unicité : Z est strictement convexe dès que les coûts c_k croissent avec la charge de leur porte, et le terme d'entropie x·ln x suffit même si c_k est seulement non décroissant [calcul]. Avec le suivisme, c_k perd γ/θ par unité de part : l'unicité tient tant que la pente de la file dépasse celle du suivisme (même condition qu'au §3).
**Vérification numérique** [calcul, 4 portes de 1,5 à 3 m, 50 à 120 m, N = 3 000] : trois points de départ extrêmes convergent vers les mêmes parts (0,251 / 0,235 / 0,346 / 0,168 pour γ = 0,76). Les temps totaux (marche + file) valent 5,49-5,92 min pour θ = 0,9 ; 5,47-5,56 pour θ = 5 ; 5,45-5,47 pour θ = 50 : on tend vers l'égalité de Wardrop.

**Résolution : moyennes successives (MSA).** À l'itération n : `y_n = N × softmax(−θ·c(x_n))` puis `x_{n+1} = x_n + (y_n − x_n)/n`. Convergence si le pas tend vers 0 et que la somme des pas diverge (1/n le fait) ; la condition de Powell et Sheffi 1982 demandait un objectif deux fois dérivable, la preuve de 2014 la relâche [lu] https://doi.org/10.1287/trsc.2014.0517 (auteurs non lus). Convergence parfois lente : variante à poids croissants (MSWA, Liu, He et He 2009 [lu, titre] https://doi.org/10.1007/s11067-007-9023-x). Notre simulation, qui fait choisir les gens un par un avec la file du moment, ressemble à une MSA de pas 1/N ; mais les départs étalés et les sorties en font une dynamique, pas un point fixe. Les échanges de porte après coup relèvent des dynamiques d'échange « jour après jour » (Smith et Watling 2016 [lu, titre] https://eprints.whiterose.ac.uk/id/eprint/93130/1/Smith%20%26%20Watling%202016.pdf).

**Intégrer proprement la file.** Hypothèse de file « verticale » (sans longueur physique) : aucun retard tant que le débit n'est pas atteint ; les retards sont les multiplicateurs de Lagrange du problème (Bell, Transp. Res. B 29, SUE avec files [lu] https://sciencedirect.com/science/article/pii/0191261594000304). Conditions pour que la simulation converge vers un SUE :
1. **La même fonction de coût** pour le choix et pour le test : `T_k(n_k) = max(t_marche_k, (n_k + 1)/débit_k)`, n_k = personnes déjà dirigées vers k, débit_k = 1,3 × largeur (p/s) comme dans le code. Le « +1 » compte la personne elle-même (négligeable à N = 3 000, vital à N < 50). Le max remplace la somme marche + attente : les gens devant moi se vident pendant ma marche. Somme = variante actuelle ; max = file fluide. À trancher par comparaison avec les `t_sortie_s` réels de la simulation de mouvement.
2. **Coût continu et croissant** en la charge : vrai ici.
3. **Un seul θ** pour marche et attente (§2).
4. **Test** : résoudre le SUE statique par MSA (20 lignes) et comparer les parts par porte aux premiers choix de 50 graines. Écart attendu faible tant que les départs sont groupés.

## 5. Formules à mettre dans le code

```
Utilité de la porte i (personne p) :
V_i = −θ·T_i                         θ = 0,9 / min  (hypothèse, balayer 0,3-3)   [?]
    + 0,795·connue_i                 [lu] arXiv 2110.11577 Table 3
    − 1,765·fumée_i                  [lu] id. (réutilisé pour « fermée visible » : extension [?])
    + 10·β_p·part_i                  β_p ~ N(0,076 ; 0,10)  [lu moyenne ; écart par ratio, calcul]
    + 2,739·consigne_i               consigne = confiance × clarté ∈ [0,1]  [lu] FT 2025, interpolation [?]
    + ln(1/n_voisines_i)             portes voisines, optionnel [?]
T_i = max(marche_i , (n_i + 1) / débit_i)  en minutes   (variante : somme)
P(i) = exp(V_i) / somme_j exp(V_j)
Équilibre (test) : x_k = N·P_k(x) ; MSA : x ← x + (N·P(x) − x)/n
Seuil de dérive vers une porte unique (K portes) : 10·β − θ·N/(60·débit) > K
```

## Ce qu'on change dans le code (`src/sim/behavior/sortie.ts`, `simuler.ts`)
| Constante / fonction | Ancienne valeur | Nouvelle valeur | Source |
|---|---|---|---|
| `POIDS.suivisme_ecart` | 0,08 | 0,10 (=0,053/0,039 × 0,076) | FT 2025 Table 4 [lu] + calcul ; 0,08 sans source |
| `POIDS.distance` (−0,378/m) et `normaliserDistances` | pénalité de plage 3 m eq | supprimés ; `V += −θ·marche_min` (marche = distance / 78 m·min⁻¹) | §2 ; ordre de grandeur cohérent avec la plage VR (−1,13 contre −1,15) |
| `POIDS.file_par_minute` | −0,9 « hypothèse » | renommer `theta_par_minute` = 0,9, appliqué à marche **et** attente ; balayage 0,3 / 0,9 / 3 | hypothèse `[?]`, §2-§4 |
| `attente_min` dans `candidats` | `n/débit/60` | `(n+1)/débit/60` ; option `T = max(marche, attente)` | §4 |
| Portes voisines (nouveau) | absent | `+ ln(1/n_voisines)`, rayon d0 = 15 m (`[?]`), option | §1 |
| Scénario « surpris » (nouveau) | absent | `suivisme_moyen = 0,233` en variante de sensibilité | préprint Table 4 [lu] |
| Commentaires de tête | « suivisme 0,076 ± 0,08 logit mixte » | corriger : écart-type issu de FT 2025, pas du préprint | §2 |
| Test (nouveau) | absent | solveur SUE par MSA + 50 graines ; dispersion des parts | §4 |
Inchangés : `connue` 0,795, `fermee_connue` −1,765, `personnel` 2,739, `suivisme_moyen` 0,076, `CHANGEMENT` (constante réglée, coefficients non publiés `[?]`).

## Ce qu'on dit au jury
1. « Le choix de porte suit un modèle de choix discret publié (logit mixte, 344 puis 1 048 choix en réalité virtuelle) ; ses poids viennent de portes à 3-6 m, nous les avons transférés à 50-150 m en passant par un temps de trajet, ce qui est un choix de modélisation et non une mesure. »
2. « La simulation converge vers un équilibre stochastique de l'usager (logit plus files d'attente), qui tend vers l'équilibre de Wardrop/Nash quand les gens sont parfaitement rationnels ; l'échelle θ = 0,9 par minute est une hypothèse que nous faisons varier. »
3. « Avec 3 000 personnes les files écrasent l'effet de troupeau et l'équilibre est unique ; nous montrons la dispersion sur 50 graines et nous ne prétendons pas prédire le 19 octobre. »
