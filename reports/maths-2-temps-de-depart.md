# Maths 2 : le temps avant de partir (pré-mouvement), vérifié et corrigé

Lot foule-décision, ticket #9. Rien n'est modifié dans le code. [lu] = lu dans la page citée. [?] = non vérifié, ou hypothèse. [calcul] = refait ici à partir de chiffres lus.

## 0. Version simple

- Les nombres 40,5 s et 5,8 existent bien. Ils viennent de Forssberg, Kjellström, Frantzich, Mossberg, Nilsson (Fire Technology 2019, thèse de Lund 2017), pas de Lovreglio. Ils décrivent **891 spectateurs, 14 exercices d'alarme incendie avec message vocal préenregistré** dans de petites salles suédoises, pas 1 954 personnes.
- Le même article donne les autres alarmes : sonnerie 29,5 s, sirène 25 s. Le message vocal est donc **plus lent** que la sonnerie (on écoute le message jusqu'au bout), à l'inverse de notre multiplicateur « message clair = plus rapide ».
- La forme mathématique (log-logistique, multiplier le résultat par un facteur) est correcte. Ce qui est faux : le facteur « clarté » saute de 1,15 à 0,88 entre clarté 0,49 et 0,50, et aucun coefficient publié n'existe pour un couvre-feu.
- On garde 40,5 / 5,8 comme **plancher** (cas de référence), on multiplie par un facteur de contexte incertain (central 1,5, plage 1,15 à 2,5) tiré au hasard à chaque simulation, et on ajoute une part de gens qui ne partent pas (0, 5, 15 % en balayage, aucune source).
- Le jury doit voir une **fourchette**, jamais un chiffre unique.

## 1. D'où viennent 40,5 s et 5,8

**Source primaire** [lu] : Forssberg M., Kjellström J., Frantzich H., Mossberg A., Nilsson D., « The Variation of Pre-movement Time in Building Evacuation », Fire Technology 55(6), 2019, p. 2491-2513. https://link.springer.com/article/10.1007/s10694-019-00881-1 (texte et tableaux : https://link.springer.com/content/pdf/10.1007/s10694-019-00881-1.pdf). Version étudiante : https://lup.lub.lu.se/student-papers/record/8917982 [lu]. L'article reprend 40 exercices non annoncés filmés, faits à Lund : 2 486 temps individuels.

**Ce que dit exactement le Tableau 6** [lu, PDF ci-dessus] : « Cinéma (alarme vocale) : 891 observations, log-logistique γ = 0 ; β = 40,5 ; α = 5,8 ; moyenne 44,0 s (min 17, max 138), écart-type 18,0 s ».
- β = **échelle = médiane** (γ = 0 : pas de décalage). α = **forme**. Le texte ne définit pas β ; [calcul] : avec β = médiane, la loi donne moyenne 42,6 s et minimum plausible 17 s (F(17 s) = 0,6 %), cohérent avec 44,0 et 17 observés. L'interprétation est donc bonne.
- Tableau 3 [lu] : 900 personnes, **14 exercices**, sources Bayer & Rejnö 1999, Reinicke 2007 (Lund), https://lup.lub.lu.se/student-papers/search/publication/1767237 [lu]. Le chiffre « 1 954 / 30 exercices » est le total de **tous les cinémas** (voix + sirène + sonnerie). Le commentaire de `depart.ts` est à corriger.
- Salle : 135 places, 9 rangées de 15 (Malmö) pour les expériences Bayer-Rejnö [lu] https://sciencedirect.com/science/article/pii/S0379711215300023. Nous avons 3 000 spectateurs dans plusieurs salles : transfert non démontré.
- Ces 891 sont mesurés **depuis le début de l'alarme**. Le message dure plusieurs secondes et les gens l'écoutent en entier, parfois avec sa répétition (Purser 2010 [lu] https://link.springer.com/chapter/10.1007/978-3-642-04504-2_9). Durée du message dans l'expérience : non lue [?].

**Ajustement et choix de la loi** [lu] : candidates = lois sans valeur négative ni borne haute ; critère principal AIC, complété par BIC (« référence pondérée »). **Aucune valeur d'AIC, de BIC ni de test de Kolmogorov-Smirnov n'est publiée** ; la qualité d'ajustement est jugée sur des graphiques P-P (« raisonnablement exacte »). Les temps ne sont pas indépendants (les voisins s'imitent) ; les valeurs extrêmes n'ont pas été retirées ; les personnes restées assises sont exclues ou estimées (+5 à 10 s).

**Comparaison log-normale / log-logistique** [calcul, mêmes moyenne 44 et écart-type 18] : log-normale médiane 40,7 ; 95e centile 77,8 s ; 99e 101,7 s. Log-logistique ajustée : médiane 40,5 ; 95e 67,3 ; 99e 89,4. Écart de queue ~15 %. La loi ajustée sous-estime la dispersion (écart-type 14,2 contre 18,0 observé). Weibull : la même étude la retient pour restaurant et boîte de nuit, pas pour le cinéma. VR multijoueur Weibull k = 0,97 [lu en 1re passe, hors cinéma] https://linkinghub.elsevier.com/retrieve/pii/S0925753526003413.

**Autres lois du même tableau, utiles pour remplacer les multiplicateurs** [lu, Tableau 6] :
| Cas | n | Loi | Médiane/échelle | Moyenne (min-max) |
|---|---|---|---|---|
| Cinéma, message vocal | 891 | log-logistique β 40,5 ; α 5,8 | 40,5 | 44,0 (17-138) |
| Cinéma, sonnerie | 880 | log-logistique β 29,5 ; α 5,0 | 29,5 | 32,5 (11-224) |
| Cinéma, sirène | 89 | log-normale (μ 25,0 ; σ 6,2, paramétrage non précisé) | ~25 | 30,0 (14-179) |
| Bureau, sonnerie | 45 | log-logistique β 52,5 ; α 3,0 | 52,5 | 64,4 (12-201) |
| Boîte de nuit, personnel actif, voix | 62 | Weibull β 52,5 ; α 2,7 | | 46,6 (11-87) |
| Boîte de nuit, personnel passif, sirène | 84 | log-logistique β 50,6 ; α 2,3 | 50,6 | 65,4 (5-417) |

Lecture : plus le cas est ambigu ou hétérogène, plus α est petit (queue lourde). C'est la bonne façon de représenter « menace non visible » : baisser α, pas seulement allonger β.

## 2. Mathématiques

**Log-logistique** (échelle β = médiane, forme α), t en secondes [formules classiques, vérifiées par [calcul] ci-dessous] :
- Survie (part encore assise) : S(t) = 1 / (1 + (t/β)^α).
- Quantile : t_p = β · (p/(1−p))^(1/α). Avec p = u uniforme, c'est exactement le tirage du code. Vérifié : 5 % avant 24,4 s ; 50 % 40,5 ; 95 % 67,3 s.
- Risque instantané (chance de partir à la seconde t si on est encore assis) : h(t) = (α/β)(t/β)^(α−1) / (1 + (t/β)^α). Si α > 1 : **monte, atteint un pic à t* = β(α−1)^(1/α) = 53,1 s, puis redescend** comme α/t. Sens : au début tout le monde réagit de plus en plus (on comprend, on imite) ; ceux qui restent après le pic sont les hésitants, qui attendent les autres ou ne se sentent pas concernés. C'est le « rapide début, queue étirée » décrit par l'article [lu].
- Moyenne β·(π/α)/sin(π/α) n'existe que si α > 1 ; variance seulement si α > 2. **Imposer α ≥ 2,5 dans le code** (sinon moyennes infinies dans les scénarios lents).

**Modèle à temps de défaillance accéléré (AFT)** : un facteur m multiplie le temps : T = m · T₀, soit S(t | x) = S₀(t/m). Toute la loi est étirée : médiane, 95e centile, tout × m. Le code (`mediane × m × …`) est donc **un AFT correct**. Cas particulier utile : la log-logistique est aussi à « cotes proportionnelles » : la cote (encore assis / déjà parti) à l'instant t vaut (β·m/t)^α, donc multipliée par **m^α**.
- Conséquence [calcul] : un rapport de cotes publié RC se convertit en facteur de délai par **m = RC^(1/α)**. Avec α = 5,8 : agent qui guide RC 0,33 (régression) → m = 0,83 ; RC 0,35 → 0,83 ; menace perceptible RC 0,39 → 0,85, donc absence de menace = × 1,18 ; alarme seule RC 2,42 → × 1,17. Avec α = 3,0 : × 0,69, × 1,37, × 1,34. Lecture : ×0,8 pour le guidage est **cohérent** (0,69 à 0,83) ; il vient en fait du rapport de cotes, pas du 20,0/41,9 % du commentaire du code.
- Réserve : ces RC portent sur « réponse tardive » (plus de la moitié des gens visibles retardent, ou réponse > 30 s) dans 126 vidéos d'incidents réels, un indicateur binaire par incident, pas un temps [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC10620751. En régression conjointe, **seul le guidage est significatif (RC 0,33)** ; l'alarme et la menace perceptible ne le sont plus [lu]. Ne pas les traiter comme des coefficients certains.

**Coefficients publiés pour remplacer les facteurs ad hoc** (tous faibles, tous à citer avec leur limite) :
- Sonnerie vs message vocal, **même cinéma** : médiane 29,5 vs 40,5 s, soit × 0,73 pour la sonnerie [lu, calcul]. Mais dans les bâtiments variés, voix plus rapide que sonnerie : moyenne des maxima par évacuation 0,51 min contre 1,63 min, 95e centile 2,43 contre 2,57 min (Purser & Bensilum 2001, confondu avec la qualité de gestion) [lu] https://sciencedirect.com/science/article/pii/S0925753500000667. Revue Lovreglio 2019 citée par l'étude vidéo : message préenregistré 0,68 min, voix 0,87 min, sonnerie seule 1,68 min, aucune alarme 27,97 min [lu, secondaire] https://pmc.ncbi.nlm.nih.gov/articles/PMC10620751. **Le sens de l'effet « message » dépend donc du lieu** : ne pas coder « message = plus rapide ».
- Personnel : boîte de nuit, personnel actif contre passif : moyenne × 0,71, queue max 87 contre 417 s [lu, calcul] ; 1 expérience chaque, siren et voix confondus. Guidage vidéo : × 0,83 [calcul].
- Message court : réponse plus rapide mais moins fiable ; interactions de groupe : effet « majeur » (Purser 2010 [lu]). Pas de coefficient chiffré lu.
- Message incomplet pris pour une panne ou un exercice : allongement qualitatif (Forssberg 2019 [lu]). Clarté continue : **aucun coefficient trouvé** [?].
- Distance du siège à l'allée : le délai croît (théâtre de 1 200 personnes, Marlowe) [lu en 1re passe] https://onlinelibrary.wiley.com/doi/10.1002/fam.2424.
- Familier / non familier : moyenne 21 s (écart-type 12) contre 46 s (66), sommeil [lu en 1re passe] https://sciencedirect.com/science/article/pii/S037971122100120X ; hors cinéma.

## 3. Sans incendie, ordre public, annonce non obligatoire

**Cadre** : le PADM (Protective Action Decision Model, Lindell & Perry 2012) décrit trois étapes avant toute décision (recevoir, être attentif, comprendre), puis trois jugements (menace, actions de protection possibles, acteurs concernés/source), puis réponse, freinée ou aidée par des facilitateurs et des obstacles [lu] https://pubmed.ncbi.nlm.nih.gov/21689129. Mileti & Sorensen 1990 (revue de 200 études) : source, canal, **cohérence, crédibilité, exactitude, compréhensibilité**, fréquence pèsent fortement ; les « mythes » (garder simple, effet « au loup », panique) sont contredits [lu] https://osti.gov/biblio/6137387. La chaîne entendre → comprendre → croire → se sentir concerné → décider → agir est le schéma classique de ces auteurs [?, non lue en détail]. Kuligowski (NIST TN 1632) : perception, **interprétation (fausse alerte ou danger sérieux ?)**, décision, action [lu] https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=902507. Ici l'étape qui s'allonge est l'interprétation : sans fumée ni alarme sonore, la croyance et la personnalisation reposent sur le message et sur l'entourage.

**Ordres de grandeur** :
- Cue faible : réponse tardive 47,2 % sans menace perceptible contre 26,0 % avec (RC 0,39, univarié) [lu].
- Cas réels sans cue convaincant : jusqu'à 11 min (WTC1) et 25 min (WTC2) [lu, en 1re passe] ; moyenne « aucune alarme » 27,97 min dans la revue Lovreglio (incendies réels, très différent d'un couvre-feu) [lu, secondaire].
- Les gens attendent de voir les autres bouger (cinéma : certains se rassoient quand les voisins ne bougent pas) [lu] Forssberg 2019 ; effet d'imitation dans la salle : Nilsson & Johansson 2008 https://research-information.bris.ac.uk/en/publications/social-influence-during-the-initial-phase-of-a-fire-evacuation-an [lu].
- Ordre de grandeur de la hausse de délai, deux lignes d'indices : vidéos (RC → facteur) × 1,2 à 1,4 ; moyennes de cas (sonnerie seule contre voix) × 1,9 à 2,5 [calcul]. D'où central × 1,5, plage 1,15 à 2,5.
- **Part de personnes qui ne partent pas du tout** : **aucun pourcentage publié trouvé** pour cinéma ou ordre sans incendie [?]. Dans les exercices de Lund, certains restent assis jusqu'à l'arrêt de l'alarme ou se bouchent les oreilles ; ils sont exclus ou estimés, donc **la loi 40,5 / 5,8 suppose que tout le monde finit par partir** [lu]. Traiter p_reste comme un paramètre de scénario.
- Pas de texte français sur un ordre préfectoral sans incendie (déjà noté dans contraintes-forum-des-halles). Alerte « menace » : l'évacuation immédiate sur simple menace est discutée comme mauvaise pratique par certains auteurs de sûreté (chapitre ScienceDirect, https://sciencedirect.com/science/article/pii/B9780128177488000304 [lu, secondaire, hors sujet direct]).

## 4. Formules à mettre dans le code

Tirage par spectateur i, une fois au démarrage :

    M = M_canal · M_clarté · M_guide · M_contexte          (chaque facteur incertain : voir ci-dessous)
    α = α_contexte                                            (≥ 2,5)
    t_i = M · β₀ · ( u / (1 − u) )^(1/α)    avec β₀ = 40,5, u uniforme ]0,1[
    si u_reste < p_reste : t_i = +∞ (ne part pas avant l'horizon)

Facteurs, tirés une seule fois **par simulation** (incertitude de modèle), pas par personne : ln M_k ~ Normale(ln m_k, s_k²).

| Facteur | m_k central | s_k | Plage 90 % | Source / statut |
|---|---|---|---|---|
| Canal : message vocal | 1,00 | 0,10 | 0,85-1,2 | par construction (β = 40,5) |
| Canal : sonnerie | 0,73 | 0,15 | 0,57-0,93 | Tableau 6 cinéma, 29,5/40,5 [calcul] |
| Clarté c ∈ [0,1] | 1,3^(1−c) · 0,75^c | 0,15 | | extrémités de l'ancien code ; **hypothèse**, continue |
| Guidage | 0,83 | 0,12 | 0,68-1,0 | RC 0,33 → RC^(1/5,8) [calcul] |
| Contexte sans menace visible | 1,5 | 0,35 | 1,15-2,5 | deux lignes d'indices §3 ; **hypothèse** |

Trois préréglages [calcul] (secondes ; 5 %, 50 %, 90 %, 95 %, 99 %) :
- **Plancher** (M = 1, α = 5,8) : 24, 40, 59, 67, 89 ; moyenne 43.
- **Central Halles** (M = 1,5, α = 4,0) : 29, 61, 105, 127, 192 ; moyenne 67.
- **Lent** (M = 2,5, α = 2,5, p_reste 15 %) : 31, 101, 244, 329, 636 ; moyenne 134.

### Ce qu'on change dans le code (`src/sim/behavior/depart.ts`)
| Élément | Ancien | Nouveau | Source |
|---|---|---|---|
| Commentaire d'en-tête | « 30 exercices, 1 954 mesures » ; « Lund, Fire Technology 2019 » | « 14 exercices, 891 personnes, alarme vocale ; Forssberg et al. 2019 » | Tableaux 3 et 6 |
| `MEDIANE_CINEMA_S` | 40,5 | 40,5 (renommer `MEDIANE_PLANCHER_S`, **plancher**) | idem |
| `FORME_CINEMA` | 5,8 | 5,8 en plancher ; 4,0 en central Halles ; 2,5 en lent | Tableau 6 (α 2,3 à 5,8) ; hypothèse |
| Facteur clarté | `c ≥ 0,5 ? 1−0,25c : 1+0,3(1−c)` (saute de 1,15 à 0,88 à c = 0,5) | `1,3^(1−c) · 0,75^c` (continu, 1,3 à c = 0 ; 0,75 à c = 1) | hypothèse, extrémités conservées |
| Facteur guidage | 0,8 | 0,83 | RC 0,33^(1/5,8) [calcul] ; différence faible |
| Facteur contexte | absent | 1,5 (incertain, plage 1,15-2,5) | §3 |
| `×30` si aucun ordre | 30 | **à retirer** ou remplacer par `p_reste` : aucune source pour 30 [?] | |
| Part qui ne part pas | absente | `p_reste` ∈ {0 ; 0,05 ; 0,15}, balayage | aucune source [?] |
| Garde | aucune | `forme ≥ 2,5` | variance finie |
| Instant de départ | depuis l'alarme | `+ durée_message` si le message est plus long qu'un bip : à mesurer [?] | Purser 2010 |

Test minimal à ajouter : `quantileLogLogistique(0.05)` ≈ 24,4 ; `quantile(0.95)` ≈ 67,3 ; clarté 0,49 et 0,50 donnent des facteurs voisins (écart < 3 %).

### Comment annoncer l'incertitude
- Toujours montrer la **fourchette** (plancher / central / lent), pas la moyenne.
- Dire : « les chiffres de base viennent de 891 spectateurs en exercice incendie ; ceux du couvre-feu sont des hypothèses encadrées ».
- Rejouer la simulation 100 fois avec les facteurs tirés (§4) et afficher médiane et 5e-95e centile de l'heure de sortie du dernier spectateur.
- Marge de modèle ≥ 30 % entre simulateurs (RiMEA, déjà dans criteres-jugement-crise §1) : toute décision qui gagne moins que cela est du bruit.

## Ce qu'on dit au jury
1. « Notre temps avant de partir suit une loi publiée sur 891 spectateurs de cinéma lors d'alarmes incendie (Fire Technology 2019) : c'est un plancher, pas une prévision pour un couvre-feu. »
2. « Pour un ordre sans fumée ni alarme, aucun coefficient n'existe : nous allongeons les délais de 15 % à 150 % et épaississons la queue, et nous montrons la fourchette de résultats, pas un chiffre. »
3. « Nous testons aussi 0, 5 et 15 % de personnes qui ne partent pas, parce que la littérature ne donne aucun chiffre pour ce cas. »

## Trous restants
- AIC, BIC et KS du Tableau 6 : à recalculer depuis le tableur de données (https://lup.lub.lu.se/student-papers/search/publication/8917982) ; téléchargement non fait faute d'accord.
- Durée du message vocal des expériences Bayer-Rejnö/Reinicke/Holmström ; tableaux d'effets sonnerie contre voix dans Purser 2010 ; proportions de non-départ ; intervalles de confiance des rapports de cotes.
