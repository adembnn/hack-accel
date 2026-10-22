# Instantané 4 : comment une personne simulée décide (modèles publiés, chiffres, preuves)

Décision débloquée : quel modèle de décision humaine, publié et calibré, on applique à chaque personne, avec quels paramètres. Complète `etat-art-1-dynamique-foule.md` (le mouvement). Recherche faite le 22 oct. 2026 ; aucun LLM payant appelé. `[?]` = non vérifié dans la source. `[lu]` = chiffre lu dans le texte de la source.

## 1. Version simple et imagée

Imaginez chaque spectateur avec **un petit cerveau en trois étages** :
1. **« Je pars ou j'attends ? »** Un chronomètre personnel tiré au sort dans une loi mesurée sur de vrais cinémas. Les gens ne partent pas tous ensemble : quelques-uns tout de suite, la masse après un délai, quelques traînards.
2. **« Par quelle porte ? »** Une balance qui pèse des raisons (distance, porte déjà connue, fumée, monde qui y va, consigne du personnel). Chaque raison a un poids chiffré, mesuré en demandant à des centaines de vraies personnes de choisir. Le résultat est une probabilité (70 % la porte A, 30 % la B), pas une certitude : deux personnes identiques ne choisissent pas pareil.
3. **« Je change d'avis ? »** Un test rare (7 à 15 % des gens dans les expériences) déclenché par une file trop longue ailleurs ou par le voisin qui change.

Les LLM (assistants de langage) ne servent pas pour les 3 000 : trop lents, payants, et non prouvés sur ce point. Ils servent pour quelques personnages-clés, si Adem le décide.

Point d'honnêteté : ces poids viennent d'expériences de laboratoire, de réalité virtuelle et de cinémas en exercice, **pas du couvre-feu du 19 oct.**. Le modèle est un point de départ défendable, pas une prédiction.

## 2. Choix de sortie : le logit (la « balance à raisons »)

**Logit multinomial** (MNL) : on donne à chaque porte i un score V_i = somme de (poids × variable). La probabilité de choisir la porte i est
`P(i) = exp(V_i) / somme sur toutes les portes j de exp(V_j)`
(l'exponentielle rend tout positif ; une porte meilleure prend plus de part, sans jamais prendre 100 %). **Logit mixte** : pareil, mais un poids peut varier d'une personne à l'autre (certains suivent la foule, d'autres l'évitent), tiré dans une loi normale.

**Coefficients publiés, VR immersive** (344 choix, 3 portes, Lovreglio, Dillies, Kuligowski, Rahouti, Haghani) [lu, version préprint arXiv, la version publiée peut différer `[?]`] : https://arxiv.org/pdf/2110.11577v1
| Variable | Poids | Lecture |
|---|---|---|
| Distance (par mètre, portes à 3-6 m) | −0,378 | plus loin = moins probable |
| Porte déjà connue (0/1) | +0,795 | vaut ≈ 2,1 m de détour (0,795/0,378) |
| Fumée sur la porte (0/1) | −1,765 | vaut ≈ 4,7 m de détour |
| Nb de gens qui y vont (NP, niveaux 0, 1, 5, 10) | +0,076 par personne | 10 personnes ≈ 2 m de détour |
Au premier exercice (non prévenus), le suivisme est plus fort : 0,041 + 0,192 = 0,233 par personne, la sensibilité à la fumée plus faible (−2,305 + 1,781) [lu, même source]. Les gens surpris suivent davantage.

**Consigne du personnel** (VR métro, 131 personnes, 1 048 choix, MNL puis mixte) [lu] : https://link.springer.com/content/pdf/10.1007/s10694-025-01746-6.pdf
- Un agent qui indique une sortie : +2,739 ; équivaut à ≈ 78 évacués allant à l'autre porte (suivisme 0,035/personne). Habit de pompier : +0,559 en plus (seuil de confiance 10 %). Constante côté droit : +0,263.
- Le modèle retrouve 77 % des choix réels (806/1 048) : c'est l'ordre de grandeur de « bon » pour ce type de modèle.
- Mixte : l'effet du personnel est positif pour tout le monde, l'effet de la foule change de signe selon les personnes (la plupart suivent, certains évitent).

**Suivisme : les sources se contredisent, il faut un paramètre aléatoire.**
- Réel, essais avec foules mimées (Haghani et Sarvi) : les gens tendent à éviter la majorité ; suivre augmente le temps d'évacuation en simulation [lu via Kinateder 2021] https://pmc.ncbi.nlm.nih.gov/articles/PMC8319842
- VR (Kinateder et Warren) : on suit les petites foules (≈10) ; avec 20 personnes, le choix reste au hasard (≈50 %) tant que toute la foule n'est pas du même côté [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC8319842. Le suivisme est donc **non linéaire**, pas un simple « plus on est nombreux ».
- Sondages vidéo (Lovreglio 2014-16) : préférence pour la porte moins fréquentée [lu via le préprint].
- Pont expérience/réel : des choix hypothétiques sur images et des essais physiques avec foule donnent des probabilités qui diffèrent de **moins de 10 %** en moyenne (Haghani, Sarvi, Shahhoseini, Boltes, 2016) [lu] https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0166908

**Porte familière (affiliation, Sime 1985)** : on repart par où on est entré. Confirmé en VR (+0,795 ci-dessus) et en cinéma : les visiteurs préfèrent la porte principale (la plus utilisée) à la sortie de secours inconnue ; des feux verts clignotants peuvent déplacer ce choix [lu] https://publications.iafss.org/publications/fss/9/341/view/fss_9-341.pdf. Sime : https://journals.sagepub.com/doi/abs/10.1177/0013916585176003 (titre vu, texte non lu). **La consigne « sortez par où vous êtes rentrés » est donc cohérente avec la littérature** : elle renforce un biais déjà fort.

**Règle de trajet dans une salle de spectacle** (exercices en théâtre, trajectoires mesurées) [lu] https://link.springer.com/article/10.1007/s10694-018-0783-2 : on lève, on cherche la sortie la plus proche visible ou connue (porte d'entrée), on avance quand celui de devant avance ; face à une file trop longue, on quitte pour une porte libre si le chemin est dégagé.

Autres modèles : Duives et Mahmassani 2012 (MNL calibré sur 100 répondants × 20 choix : distance, déviation angulaire, suivi du groupe) https://trid.trb.org/View/1130113 ; ses coefficients n'ont pas pu être lus `[?]`. CellEVAC (2021) en reprend des valeurs mais le tableau n'est pas lisible ici `[?]`.

**Limite de transfert (importante).** Les distances testées sont de 3 à 6 m dans une pièce virtuelle. Aux Halles on parle de dizaines de mètres : appliquer −0,378 par mètre écraserait tout. Il faut **normaliser** (distance relative entre portes) et recaler `[?]` : c'est un choix à ne pas faire « au doigt mouillé » ; voir §7.

## 3. Partir ou attendre : le temps avant de bouger

**Pré-mouvement** = délai entre le signal et le premier pas vers une sortie. Il se décompose en reconnaissance (comprendre qu'il se passe quelque chose) puis réponse (finir sa scène, ramasser ses affaires, attendre un proche).

**Données cinéma** : 40 exercices non annoncés (bureaux, cinémas, restaurants, magasins, boîtes), 2 486 personnes, dont 1 954 dans 30 exercices de cinéma [lu] https://link.springer.com/article/10.1007/s10694-019-00881-1 (Fire Technology 2019, auteurs à vérifier `[?]`).
- Cinéma, alarme vocale enregistrée, pré-mouvement total : **loi log-logistique**, échelle β = 40,5 s (médiane), forme α = 5,8 [lu]. Tirage : `t = 40,5 × (u / (1−u))^(1/5,8)`, u aléatoire entre 0 et 1. Résultat : 5 % partent avant 24 s, 50 % à 40 s, 95 % à 67 s (calcul d'après les paramètres). Reconnaissance : log-logistique β = 25,6 ; α = 5,3. Réponse : loi gamma α = 3,5 ; β = 4,2 [lu].
- Base mondiale : 112 cas (9 incendies, 103 exercices), 13 591 évacués, 16 pays [lu] https://sciencedirect.com/science/article/abs/pii/S0379711218302212
- Une expérience VR multijoueur récente donne une loi de Weibull k = 0,97 ; λ = 26,89 s (contexte jeu, à ne pas prendre comme référence cinéma) [lu] https://linkinghub.elsevier.com/retrieve/pii/S0925753526003413
- Grand théâtre en direct (1 200 personnes, Marlowe) : la loi log-normale tient, mais **le délai grandit avec la distance du siège à l'allée et à la sortie** : à représenter dans une salle de cinéma en gradins [lu] https://onlinelibrary.wiley.com/doi/10.1002/fam.2424
- Modèle d'évaluation du risque : mêmes familles de lois, ajustements par familier/non familier : moyenne 21 s (écart-type 12) vs 46 s (66) [lu] https://sciencedirect.com/science/article/pii/S037971122100120X

**Incidents réels** (126 vidéos) [lu] https://pmc.ncbi.nlm.nih.gov/articles/PMC10620751 : réponse tardive chez 35 % des cas. Présence d'un agent qui guide : 20,0 % de retard contre 41,9 % sans (rapport de cotes 0,35). Alarme seule : 48,8 % de retard contre 28,2 % (rapport 2,42, donc **pire**). Menace perceptible : 26,0 % contre 47,2 %. Course : 32,5 % avec guidage contre 54,7 %. Filmer : 56 % des incidents.

**PADM** (Lindell et Perry 2012, Risk Analysis) : la décision passe par exposition au signal, attention, compréhension, puis évaluation du risque, des actions possibles et de ses propres moyens, avant d'agir [lu en résumé] https://ideas.repec.org/a/wly/riskan/v32y2012i4p616-632.html. C'est un schéma, pas une formule chiffrée : il dit quoi mettre dans le pré-mouvement (cue, perception de menace, confiance dans la source, présence d'autrui), pas combien.

**Modèle EDM** (Evacuation Decision Model, NIST IR 7914, https://nvlpubs.nist.gov/nistpubs/ir/2013/NIST.IR.7914.pdf) et modèle de décision de la Lund (risque perçu, influence sociale, incertitude comportementale, https://lup.lub.lu.se/search/publication/23947f5c-5213-414d-9f25-d71770805248) : pistes pour une probabilité de départ par pas de temps, non lus en détail `[?]`. Modèles de survie (« hazard ») pour comparer attente et départ immédiat : https://sciencedirect.com/science/article/pii/S0925753518306581 `[?]`.

**Écart au cas Halles.** Ces lois viennent d'alarmes incendie. Un couvre-feu avec manifestation dehors n'est pas une alarme : la menace n'est pas visible, la consigne vient d'un message, et d'après les vidéos réelles l'absence de menace perceptible allonge le retard. Les 40 s du cinéma sont un plancher, pas une valeur à utiliser telle quelle.

## 4. Changer d'avis

- VR (Bode et Codling 2013) : **7 à un peu plus de 15 %** des sujets changent leur choix initial ; moins s'ils se sentent sous pression ou en compétition [lu] https://sciencedirect.com/science/article/pii/S0968090X18307393
- Haghani et al. 2020, expériences à forte et faible urgence [lu] https://sciencedirect.com/science/article/pii/S092575352030076X : le changement suit un **logit binaire** (changer / ne pas changer). Pousse à changer : déséquilibre des files (facteur principal) et imitation. **Un changement déclenche une rafale** d'autres changements sur la même porte. À forte urgence : on bouge plus vite, on évite davantage la foule, on change plus souvent. Coefficients exacts non lus `[?]`.
- Deux étages (Haghani et Sarvi 2019) : un module « je change ?» puis le logit de choix sans la porte quittée.

## 5. Groupes, famille, personnel, contagion

- **Groupes** : la plupart des piétons marchent en groupe (Moussaïd et al. 2010, cité [lu] https://sciencedirect.com/science/article/pii/S2352146514000581). Prendre des petits groupes en compte **allonge** le temps d'évacuation dans plusieurs études (cité en synthèse [lu] https://sciencedirect.com/science/article/pii/S2212420923003965). Modèle de force de groupe + règle « chercher un membre perdu » à partir d'un coût d'intention (SIGGRAPH/ACM 2016, https://dl.acm.org/doi/10.1145/2915926.2919325, paramètres non lus `[?]`). Pour les enfants et la mobilité réduite : vitesse du groupe = celle du plus lent. Pas de chiffre publié trouvé pour « probabilité d'attendre un proche » `[?]`.
- **Personnel** : effet fort, voir §2 (+2,739) et §3 (retard divisé par deux).
- **Contagion de la peur** : trois familles comparées par Tsai et al. : thermique déterministe (ASCRIBE), seuil probabiliste (Durupinar), « on hérite de la peur maximale du voisin » (ESCAPES) [lu] https://link.springer.com/article/10.1007/s10458-013-9220-6. Paramètres à calibrer, aucune valeur de consensus trouvée `[?]`.
- **Panique** : « panique, irrationalité, herding » sont trois termes ambigus (revue critique) https://research-information.bris.ac.uk/en/publications/panic-irrationality-herding-three-ambiguous-terms-in-crowd-dynami (titre vu `[?]`). Le suivisme peut être un choix rationnel (Lovreglio et al. 2016, https://sciencedirect.com/science/article/pii/S0925753515002763). Ne pas coder de « panique aveugle ».

## 6. Cadres cognitifs et LLM

| Cadre | Ce que c'est | Utilisé en évacuation | Calibrable ? |
|---|---|---|---|
| **BDI** (croyance, désir, intention) | structure : l'agent croit, veut, planifie | oui (Cho ; GT-BDI 2025 https://ieeexplore.ieee.org/ielx8/6287639/10820123/10945300.pdf?arnumber=10945300&isnumber=10820123&tp= ; ACM 2010 https://dl.acm.org/doi/10.1145/1842722.1842728) | non en soi : c'est un squelette, pas un jeu de poids ; les chiffres viennent du logit/pré-mouvement placés dedans |
| **PECS**, deux processus (rapide/réfléchi), heuristiques de Gigerenzer | cadres théoriques | je n'ai trouvé aucune application calibrée sur des données d'évacuation `[?]` | non démontré |
| **Logit/lois de pré-mouvement** | formules ajustées sur données | oui, §2-§3 | oui, avec intervalles d'erreur |

LLM (2024-2026) :
- FLARE (Xu et al.) : LLM guidé par des théories du comportement + apprentissage ; **+20,47 %** sur les modèles classiques fondés sur la théorie, sur trois sondages après feux de forêt (décision de partir, pas choix de porte) [lu] https://arxiv.org/abs/2502.17701. Les auteurs rappellent que les LLM seuls s'alignent mal sur les théories comportementales et sur-ajustent les petits sondages.
- ACM 2025 « Predictability of Disaster Evacuation Behavior using LLM Agent Simulations » : confrontation à des données réelles de mobilité, conclusion des auteurs « réalistes et interprétables » ; chiffres non lus (page inaccessible) `[?]` https://dl.acm.org/doi/pdf/10.1145/3764925.3770907
- Place publique, menace mobile, 2026 : l'agent qui connaît une sortie utilisable s'évacue à 89,5 %, celui qui n'en connaît pas à 1,05 % ; mouvement choisi dans 99,8 % des décisions : l'**information** domine, pas la « personnalité » [lu] https://arxiv.org/abs/2609.37009. C'est un résultat de simulation, non comparé à des humains.
- **Aucune étude trouvée qui compare un LLM à des choix de sortie humains en VR ou en essais réels.** Fiabilité inconnue, non reproductible d'un tirage à l'autre, payant, lent. Usage prudent : quelques personnages (directeur, agent de sécurité, un parent paniqué), l'appel LLM **propose** une action parmi une liste fermée, et le modèle logit reste le garde-fou. Appeler un LLM payant demande l'accord d'Adem.

## 7. Verdict : la fiche décision d'une personne simulée

```
# Fiche de la personne p (tirée au démarrage)
profil: groupe_id (1 à 5 membres), familier(porte_entrée)=OUI, mobilité (vitesse), 
        beta_social ~ Normale(m, s)   # certains suivent, d'autres évitent  [VR métro mixte]
        sensibilité_menace (faible/moy./forte)

# Pas de temps (1 s) :
SI état == ATTEND :
   cue = annonce_entendue | personnel_vu | gens_qui_partent_autour | menace_perçue
   SI cue : t_depart = t_cue + tirage_loglogistique(β=40,5 s, α=5,8)           # cinéma [1954 pts]
            × facteur_distance_allée (salle gradins)                           # [Marlowe]
            × facteur_menace_perçue  (sans menace : retard x2 ?)               # [vidéos réelles: 41,9 % vs 20 %]
   SI groupe : t_depart = max(t_depart des membres) # on attend les siens [?]
   SI t >= t_depart : état = CHOISIT

SI état == CHOISIT :
   pour chaque porte j accessible :
       V_j = −0,378·distance_norm_j + 0,795·[porte_entrée] − 1,765·[fumée/blocage]
             + beta_social·f(nb_gens_vers_j)   # f non linéaire: suit si petit groupe
             + 2,739·[personnel_indique_j]     − pénalité_file_j [?]
   P(j) = exp(V_j) / somme exp(V)  ; tirer j ; état = MARCHE

SI état == MARCHE, toutes les 5-10 s :
   p_change = logit(a + b·déséquilibre_files + c·nb_changements_voisins)   # [Haghani 2020, coeffs ?]
   (base 7-15 % sur l'épisode)  SI tirage < p_change : exclure la porte actuelle, retourner à CHOISIT
   SI groupe disloqué : coût de recherche > seuil → attendre/revenir      [ACM 2016, seuil ?]
```
Source de chaque ligne : voir §2 à §5. Les `?` sont des paramètres sans valeur publiée trouvée.

**Trois niveaux** (N = 3 000, K ≈ 6 à 10 portes ; coût par pas de temps) :
1. **Minimum crédible** : délai log-logistique + logit à 4 variables (distance relative, porte d'entrée, personnel, nb de gens vers la porte), poids du préprint VR. ≈ 30 000 évaluations par seconde simulée : < 1 ms, instantané.
2. **Bon** : niveau 1 + suivisme aléatoire par personne (logit mixte) + groupes (le plus lent donne le rythme, attendre les siens) + changement d'avis (logit binaire, rafales) + contagion d'information par voisinage (recherche de voisins par grille spatiale, ≈ 3 000 requêtes). Quelques millisecondes par pas.
3. **Ambitieux** : niveau 2 + 10 à 30 personnages-clés pilotés par LLM (liste d'actions fermée, appelés seulement aux moments de décision, en arrière-plan, avec repli sur le logit). Le simulateur reste instantané ; coût en euros et latence de quelques secondes côté personnages. Accord d'Adem requis.

**Preuves à montrer au jury** (ce qui rapproche le simulé du vrai, sans prétendre à la prédiction) :
- Courbe des départs simulés superposée à celle des 1 954 personnes de cinéma (même loi : test de Kolmogorov-Smirnov, qui mesure l'écart entre deux courbes).
- Probabilités de choix simulées vs choix observés : ratio de bons choix, à comparer à 77 % (VR métro). Jeux ouverts : dataset Snopková et al. 2025 (208 répondants, choix de couloir en T, libre d'usage académique et commercial) https://pmc.ncbi.nlm.nih.gov/articles/PMC11747338 ; trajectoires de salle de spectacle (Fire Technology 2018) ; Jülich pedestrian archive `[?]` non vérifiée. Les jeux de Lovreglio et Haghani ne sont pas confirmés ouverts `[?]`.
- Taux de retard et de course comparés aux 126 vidéos réelles (35 % de retard, 48 % de course).
- Analyse de sensibilité : montrer que les conclusions ne tiennent pas à un seul poids.

**Modèle le plus défendable** : logit mixte pour la porte + loi de pré-mouvement mesurée en cinéma + test de changement d'avis, avec LLM seulement pour quelques personnages. Risque principal : tous les poids viennent de petites pièces (3 à 6 m) et d'alarmes incendie, jamais d'un couvre-feu en centre commercial.

## Questions pour Adem (avec mon choix par défaut)
1. Niveau visé : a) minimum crédible, b) bon (par défaut), c) ambitieux.
2. LLM pour 10 à 30 personnages-clés : a) non, b) oui après un test sur un cas réel avec ton accord sur le coût (par défaut b si niveau c).
3. Le délai de départ après la consigne : a) loi cinéma telle quelle, b) la même, multipliée selon la menace perçue, à vérifier avec des témoignages du 19 oct. (par défaut b).
