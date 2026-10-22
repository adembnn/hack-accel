# État de l'art 3 : comment choisir (et justifier) le meilleur plan de crise

Décision débloquée : quelle méthode mathématique sert à CHOISIR le plan (pas seulement à simuler), avec quelle garantie, et quel rôle pour un LLM (agent IA). Aucun choix n'est fait ici.
Convention : chaque affirmation sourcée porte un lien ; `[?]` = non vérifié par moi (connaissance générale ou source non ouverte) ; « calcul » = je l'ai fait moi-même, vérifiable à la main.

## 0. Version simple et imagée

Un plan, c'est une recette (« ouvrir l'issue Nord, fermer la rue X, poster 2 gardes »). Le simulateur, c'est un four d'essai : on enfourne la recette, on goûte le résultat (temps d'évacuation, pression de la foule). Choisir le meilleur plan = goûter beaucoup de recettes sans cramer le budget de fours.

Trois outils, trois rôles :
- **Le plan sur papier (flots)** : on traite la foule comme de l'eau dans des tuyaux. Résultat exact et prouvé, instantané, mais l'eau ne panique pas et ne se bouscule pas. Il donne le meilleur temps théorique (une borne basse).
- **Le goûteur (simulation + choix statistique)** : on enfourne plusieurs plans, plusieurs fois (car chaque essai est un peu différent), et on dit « A bat B » avec une marge d'erreur chiffrée.
- **Le conteur (LLM)** : il traduit la demande en scénario et met le résultat en phrases. Il ne doit jamais fabriquer un chiffre : chaque chiffre vient d'un calcul, vérifié à la sortie.

Réponse courte à la décision : la combinaison la plus défendable aujourd'hui est « simulation + sélection statistique + LLM limité à traduire/expliquer » (détail section 8). Le RL (apprentissage par renforcement) et les modèles substituts sont des accélérateurs, pas des fondations.

## 1. Flots dynamiques (la foule comme de l'eau)

Termes : un **réseau** = nœuds (salles, carrefours) et arcs (couloirs, rues) avec une capacité (personnes/minute) et un temps de parcours. Un **flot dynamique** = un flot qui évolue dans le temps. **Réseau déplié dans le temps** (time-expanded) = on recopie le réseau à chaque pas de temps (t=0, 1, 2, ...) et on relie les copies ; un problème dynamique devient un problème statique classique, résolu par des algorithmes éprouvés.

- Problème « quickest flow » (flot le plus rapide) : minimiser le temps T pour faire passer tout le monde. Équation : on cherche le plus petit T tel que flot_total(T) >= nombre_de_personnes, où flot_total(T) est ce que le réseau déplié sur T pas de temps peut écouler. [Hamacher & Tjandra, état de l'art](https://kluedo.ub.rptu.de/frontdoor/index/index/docId/1477) présente quickest flow, flot dynamique maximal et flot dynamique de coût minimal.
- Garantie : optimum PROUVÉ pour le modèle. Le réseau déplié ramène l'évacuation à un max-flow, mais il compte O(T) copies du réseau, donc il gonfle avec la durée [(Kyoto, thèse)](https://repository.kulib.kyoto-u.ac.jp/server/api/core/bitstreams/bbaf2869-58d7-441e-b6e8-58e5f87c4e53/content). Hoppe et Tardos (1995) ont donné le premier algorithme fortement polynomial (le temps de calcul ne dépend que de la taille du réseau, pas du nombre de personnes) mais peu pratique car basé sur de la minimisation sous-modulaire paramétrique [(Schlöter, Skutella, Tran 2021)](https://www.arxiv.org/pdf/2108.06239). Leur méthode plus récente annonce Õ(m²k⁵ + m³k³ + m³n) (m arcs, n nœuds, k sources/puits) ; c'est polynomial, pas « instantané ».
- En pratique : des algorithmes spécialisés (plus courts chemins successifs adaptés au dépliage) servent aux évacuations réelles [(TU Berlin)](https://depositonce.tu-berlin.de/items/5ff97e3e-d6d9-4a6c-965f-8d6eae75c76a/full). Échelle de bâtiments/quartiers : je n'ai pas trouvé de chiffre fiable (nombre de nœuds, secondes de calcul) `[?]`.
- Ce que ça ignore : les modèles macroscopiques « produisent des bornes basses du temps d'évacuation et ignorent le comportement individuel » ; ce sont des plans statiques sans retour du terrain ; la solution optimale peut envoyer des gens du même nœud par des chemins différents, difficile à faire suivre [(Hamacher & Tjandra)](https://kluedo.ub.rptu.de/files/1477/bericht24.pdf), [(ETH, LBS 2018)](https://www.research-collection.ethz.ch/server/api/core/bitstreams/c8f4951e-4881-4518-90c1-dbaf246911d9/content). Un couplage flot + automate cellulaire réduit la sous-estimation [(TUM)](https://mediatum.ub.tum.de/doc/1160223/document.pdf).
- Mon bilan : excellent pour un premier score, pour trouver le goulot et pour borner (« aucun plan ne peut faire mieux que T* »). Insuffisant seul pour une foule dense (poussées, refus d'obéir). Pas de benchmark flot vs simulation microscopique à grande échelle trouvé `[?]`.

## 2. Optimisation par simulation (la simulation est une boîte noire coûteuse)

Terme : **boîte noire** = on ne voit que « plan en entrée, score en sortie », sans formule. **Budget** = nombre de simulations qu'on peut payer.

Quatre familles :
1. **Recherche aléatoire** : tirer des plans au hasard. Calcul : si on veut au moins un plan parmi les q meilleurs (fraction q de l'espace) avec probabilité p, il faut n tirages avec 1 - (1-q)^n >= p, soit n >= ln(1-p) / ln(1-q). Pour q = 5 % et p = 95 % : n = 59 (calcul). Indépendant du nombre N d'options, point clé. Argument popularisé par [Bergstra & Bengio 2012](https://www.jmlr.org/beta/papers/v13/bergstra12a.html) (la page confirme l'efficacité de la recherche aléatoire, mais PAS le chiffre 60, qui est mon calcul). Limite : sans bruit seulement ; avec bruit, ajouter les répétitions (section 3).
2. **Optimisation bayésienne** : on ajuste un modèle statistique (souvent un processus gaussien, voir section 5) aux essais déjà faits, et on choisit le prochain plan là où le gain espéré est le plus grand. Efficace quand 1 essai coûte cher et que l'espace a peu de réglages (en gros moins de 20 `[?]`). Preuve de supériorité sur le hasard dans notre cas : non trouvée.
3. **Algorithmes évolutionnaires / génétiques** : une population de plans, on garde et mute les meilleurs. Bon pour les espaces combinatoires (quelles portes ouvrir), pas de garantie de finesse, besoin de milliers d'essais `[?]`.
4. **Sélection et classement (ranking and selection, R&S) et bandits** : le bon outil quand les options sont peu nombreuses (disons 5 à 200 plans) et bruitées. Le [tutoriel WSC 2014](https://informs-sim.org/wsc14papers/includes/files/005.pdf) la présente comme la classe la plus fondamentale de l'optimisation par simulation. Procédure OCBA (optimal computing budget allocation) : donner plus de répétitions aux plans proches du meilleur, aucune aux plans clairement mauvais ; allocation asymptotiquement optimale [(synthèse)](https://www.informs-sim.org/wsc19papers/416.pdf) et réduction notable du calcul vs la procédure de Rinott [(Chen, Chen, Kelton)](https://homepages.uc.edu/~keltonwd/Paper-OptimalComputingBudget.pdf). Procédure KN (Kim-Nelson) : élimine pas à pas les plans dominés, avec garantie « probabilité >= 1-α de choisir un plan à moins de δ du meilleur » `[?]` (énoncé classique, non rouvert). Les bandits (UCB, successive halving) font la même chose avec une logique voisine.

Combien de simulations pour N options ? Règle d'ordre de grandeur (calcul + savoir classique `[?]`) : n répétitions par plan avec n ≈ 2 (z · σ / δ)², où σ = écart-type d'un plan d'une exécution à l'autre, δ = écart minimal qu'on veut distinguer, z ≈ 2-3 selon la confiance. Si σ/δ = 2 et z = 2, n ≈ 32 par plan ; sur 10 plans, 320 simulations sans OCBA, nettement moins avec. Le coût vient de σ/δ, pas de N.

## 3. Décider quand les résultats varient

Terme : **scénario** = une tirage de l'incertain (foule plus dense, issue bloquée, retard d'alerte). Un plan a un résultat par scénario et par graine aléatoire.

Critères pour comparer des plans (la formulation comte autant que l'algorithme) :
- **Moyenne** : bon en moyenne, mauvais le jour J. Insuffisant pour la sécurité.
- **Pire cas (minimax, optimisation robuste)** : minimiser max sur scénarios du temps. Garantie « jamais pire que X sur l'ensemble de scénarios choisi » ; trop prudent, et dépend entièrement de la liste de scénarios.
- **Regret minimax** : regret(plan, scénario) = temps(plan) - temps du meilleur plan pour ce scénario. On minimise le regret maximal : « on ne regrettera jamais plus de Y minutes ». Parle bien aux décideurs.
- **Percentile 95 et CVaR** : CVaR_95 = moyenne des 5 % pires résultats. Formule de Rockafellar-Uryasev : CVaR_a(X) = min sur c de [ c + (1/(1-a)) · E(max(X - c, 0)) ], où X = temps d'évacuation, a = 0,95, c = seuil. La formule est convexe et se calcule directement sur des échantillons de simulation [(Rockafellar-Uryasev)](https://risk.net/journal-risk/2161159/optimization-conditional-value-risk). Lien CVaR / regret : un portefeuille optimal pour la CVaR l'est aussi pour un regret espéré avec le bon seuil, résultat lu seulement dans un résumé [(Handbook of Computational and Numerical Methods in Finance 2004)](https://sbsuny.academia.edu/StanUryasev) `[?]` (non transposé à l'évacuation). Le [regret robuste distributionnel](https://arxiv.org/pdf/2412.15406) utilise la CVaR du regret.

Dire « A est meilleur que B » :
1. **Mêmes aléas pour les deux** (common random numbers, CRN) : on rejoue A et B avec les mêmes graines et scénarios ; la différence D = temps_A - temps_B varie moins que chaque temps seul. CRN et comparaisons par paires sont standard en R&S [(Chick & Inoue 2001)](https://ideas.repec.org/a/inm/ormnsc/v47y2001i8p1133-1149.html).
2. **Test apparié** : intervalle de confiance de la moyenne de D : mean(D) ± t · sd(D)/sqrt(n). Si l'intervalle exclut 0, A bat B au niveau choisi. Nombre de graines nécessaire : n ≈ ((z_α/2 + z_β) · sd(D) / δ)² `[?]` (formule de puissance classique).
3. **Si distributions asymétriques** (queue lourde, typique des foules) : test de Wilcoxon ou bootstrap (rééchantillonnage) sur D, plus sûr que le test t `[?]`.
4. **Probabilité de meilleur choix** : annoncer P(A meilleur que B) estimée par la fraction de graines où A gagne, avec son intervalle. Plus parlant qu'une p-valeur.
5. Comparer plusieurs plans à la fois : corriger les tests multiples (Bonferroni) ou utiliser KN/OCBA ci-dessus `[?]`.

Piège principal : la garantie statistique porte sur le simulateur et la liste de scénarios, pas sur le monde réel.

## 4. Apprentissage par renforcement multi-agents (MARL) pour guider la foule

Terme : **RL** = un programme apprend par essais/erreurs une politique (règle « dans tel état, fais telle action »). **Multi-agents** = plusieurs décideurs (panneaux, gardes, portes) qui apprennent à se coordonner.

- Maturité : recherche académique, pas d'outil de planification opérationnel trouvé `[?]`. Exemple récent : coordination de signalétique dynamique avec QMIX (algorithme MARL coopératif), couplée à un modèle de foule mésoscopique (Cell Transmission Model) et à PyroSim (feu), optimisant temps, congestion et risque d'incendie [(Xie et al., 2025)](https://pure.bit.edu.cn/zh/publications/coordinating-dynamic-signage-for-evacuation-guidance-a-multi-agen/) ; extension aux stations de métro à plusieurs niveaux [(BUAA, 2026)](https://research.buaa.edu.cn/en/publications/enhancing-fire-evacuation-safety-in-metro-stations-multi-agent-re/). Plus ancien : guidage par deep RL à action combinée (Xue et al., Algorithms, 2021, mieux que le guidage statique) [(HIT)](https://scholar.hit.edu.cn/en/publications/%E7%BB%84%E5%90%88%E5%8A%A8%E4%BD%9C%E7%A9%BA%E9%97%B4%E6%B7%B1%E5%BA%A6%E5%BC%BA%E5%8C%96%E5%AD%A6%E4%B9%A0%E7%9A%84%E4%BA%BA%E7%BE%A4%E7%96%8F%E6%95%A3%E5%BC%95%E5%AF%BC%E6%96%B9%E6%B3%95/). Je n'ai pas trouvé de résultat 2023-2024 correspondant exactement ; les chiffres de gain de ces papiers ne sont pas relevés `[?]`.
- Pièges : le **sur-apprentissage au simulateur** (la politique exploite les défauts du simulateur ; en robotique, la politique se dégrade au déploiement). Parades : randomisation de domaine (varier les paramètres à l'entraînement) et adaptation de domaine [(revue sim-to-real, 2025)](https://arxiv.org/abs/2502.13187). Pas de revue sim-to-real propre à l'évacuation trouvée `[?]`. Autres limites (savoir général `[?]`) : une politique apprise est une boîte noire, difficile à justifier ; entraînement lent et par lieu ; aucune garantie formelle.
- Rôle possible : optimiser la politique de guidage à l'intérieur d'un plan, après qu'une méthode des sections 1-3 a fixé le cadre.

## 5. Modèles substituts (surrogates)

Terme : un **substitut** est un modèle rapide, entraîné sur des paires (plan, résultat de simulation), qui imite le simulateur. Types : processus gaussien (donne aussi une incertitude, bon avec peu de données), réseau de neurones (plus de données, plus rapide).

- Pour piétons : émulateur par réseau de neurones profond du simulateur PiXIE (modèle de forces sociales) : bonne précision sur temps d'évacuation et densités, en interpolation et extrapolation, accélération non donnée dans le résumé [(Smith et al., ModSim 2025)](https://mssanz.org.au/modsim2025/files/C06.smith.pdf). Forêt aléatoire vs LSTM : les deux bons, le LSTM généralise mieux quand le nombre d'agents varie [(Kieu et al., 2024)](https://www.informahealthcare.com/doi/abs/10.1080/17477778.2022.2080008). Substituts graphe pour politiques de mobilité [(Osaka, 2026)](https://mc.net.ist.osaka-u.ac.jp/en/themes/topics/rapid-policy-impact-estimation-for-pedestrian/).
- Pas de chiffre d'erreur relative ou de facteur de vitesse vérifié ; pas d'étude de processus gaussien trouvée `[?]`.
- Usage prudent : (a) entraîner sur quelques centaines de simulations, (b) tester 10 000 plans sur le substitut, (c) RE-SIMULER les 5 à 10 meilleurs avec le vrai simulateur avant de conclure. Le substitut sert à filtrer, jamais à certifier. L'erreur du substitut est pire hors de la zone d'entraînement (extrapolation).

## 6. Rôle d'un LLM

- Les LLM déjà publiés pilotent un simulateur de trafic (SUMO) en langage naturel : [SUMO-MCP](https://arxiv.org/abs/2506.03548) (outils SUMO exposés via le Model Context Protocol : scénarios OpenStreetMap, demande, lots de simulations, rapports comparatifs ; le résumé affirme « accessible et fiable » sans détailler les mesures, code « à venir »), [ChatSUMO](https://arxiv.org/abs/2409.09040) (mots-clés tirés de la demande qui lancent des scripts ; 96 % de précision déclarée sur Albany, d'après l'auteur ; le « 15 min à 30 s » vient d'une synthèse secondaire non vérifiée [(survey)](https://arxiv.org/pdf/2503.21411)), [AgentSUMO](https://arxiv.org/abs/2511.06804) (buts flous traduits en scénarios, Séoul et Manhattan ; en cours de relecture, gains non chiffrés). Ce sont des préimpressions, sans validation comparable à nos besoins.
- Autres usages 2025-2026 : LLM comme agents-habitants (13 000 agents pour un grand rassemblement, [arXiv 2509.21868](https://arxiv.org/abs/2509.21868) ; personnalités OCEAN en évacuation incendie, [arXiv 2606.31038](https://arxiv.org/abs/2606.31038)). Cela change le modèle de foule, pas le choix du plan ; validation face au réel non établie `[?]`.
- Utile : transformer « et si la rue X fermait ? » en scénario structuré ; proposer des remèdes à tester ; rédiger l'explication. Dangereux : inventer ou arrondir un chiffre.
- Cas documenté : dans Grid-Mind (réseau électrique), l'architecture a empêché de fausses sorties de simulation, mais le modèle a quand même donné des chiffres sans appeler l'outil (une capacité d'environ 30 fois la limite vérifiée) ; un validateur après-coup a été ajouté, sans garantie formelle [(Grid-Mind)](https://arxiv.org/pdf/2602.20683). Pas de papier évacuation de ce type trouvé.
- Garantir que chaque chiffre vient d'un calcul (pratiques recoupées, aucune n'est une garantie absolue) : (1) le LLM n'écrit jamais de nombre libre, il remplit des champs `{{result.T_Nord}}` ; (2) un état de vérité unique que toute réponse d'outil doit respecter [(arXiv 2606.16307)](https://arxiv.org/pdf/2606.16307) ; (3) vérificateur de sortie : extraire tous les nombres du texte et les comparer au journal de calcul, rejeter sinon [(arXiv 2607.17883)](https://arxiv.org/pdf/2607.17883) ; limite : un nombre reformulé en toutes lettres peut passer (cf. Grid-Mind). Journal de calcul signé : plan, graine, version du simulateur, résultat.

## 7. Le « pourquoi »

- **Analyse de sensibilité globale (indices de Sobol)** : part de la variance du temps d'évacuation due à chaque entrée (formule : S_i = Var(E[Y | X_i]) / Var(Y), où Y = temps, X_i = une entrée). Appliquée aux modèles d'évacuation : la largeur des escaliers domine dans un benchmark Thunderhead, le temps de pré-mouvement pèse environ 5 % [(Jullien 2022)](https://files.thunderheadeng.com/femtc/2022_d2-07-jullien-presentation.pdf) ; analyse Sobol d'un goulot en modèle « optimal steps » [(Algorithms 2021)](https://www.mdpi.com/1999-4893/13/7/162). Coûteux en simulations : un substitut aide.
- **Attribution du goulot** : dans le modèle de flots, la coupe minimale (min cut : l'ensemble d'arcs saturés qui limite le flot) pointe le goulot avec preuve. En simulation, repérer les arcs à densité et temps d'attente maximaux `[?]`.
- **Contrefactuels** : « si on avait ouvert l'issue Nord, le temps baisse de X » = rejouer la même graine avec un seul changement et lire la différence (CRN, section 3), avec intervalle de confiance. Cette méthode simple est la plus fiable car le chiffre est le résultat d'un calcul. Aucun papier évacuation sur les contrefactuels trouvé `[?]`.

## 8. Trois architectures possibles (sans choisir)

**A. Simple : scénarios fixes + flots + simulation + test statistique.**
Le LLM n'intervient pas ou seulement pour la mise en forme. Un petit catalogue de plans (5 à 50) est évalué par flot (borne basse, goulot) puis par simulation répétée avec mêmes graines ; classement par CVaR_95 ou regret maximal avec intervalle de confiance.
Garantie : « A bat B avec confiance 95 % sur ces scénarios et ce simulateur » ; borne T* du flot. Limites : catalogue fixé à la main, ne découvre pas de plan inattendu, dépend de la qualité du simulateur.

**B. Intermédiaire : A + recherche automatique + LLM encadré.**
Le LLM traduit la demande en scénario structuré et propose des plans candidats ; une optimisation (aléatoire, bayésienne ou OCBA) explore l'espace ; un vérificateur impose que chaque chiffre du texte vienne du journal ; les « pourquoi » viennent de contrefactuels rejoués.
Garantie : celles de A sur les plans retenus ; traçabilité des chiffres (probabiliste : le vérificateur peut rater une reformulation). Limites : les plans proposés par le LLM peuvent être irréalistes (filtre de faisabilité à écrire), coût en simulations plus élevé.

**C. Ambitieuse : B + substitut + RL/MARL pour le guidage + incertitude.**
Un substitut filtre 10 000 plans, le vrai simulateur re-vérifie les meilleurs, un MARL optimise la signalétique/gardes à l'intérieur du plan, robustesse distributionnelle sur l'incertitude des scénarios.
Garantie : seulement celle de la re-vérification finale par simulation ; le substitut et le RL n'ont pas de garantie formelle. Limites : sur-apprentissage au simulateur, justification difficile des politiques apprises, plus de travail de validation, risque de promettre plus qu'on ne peut prouver.

## 9. Points d'attention pour l'équipe (faits, pas décisions)

- Aucune des trois architectures ne garantit la vérité terrain : tout repose sur la fidélité du simulateur au comportement humain. Une validation contre des données réelles (vidéos de foule, exercices) reste à trouver.
- Les papiers LLM-SUMO sont des préimpressions ; aucun n'est évalué sur des crises.
- Trous de recherche : échelle réelle des solveurs de flots, vitesse/erreur des substituts, gains chiffrés des MARL d'évacuation, contrefactuels en évacuation.
