# État de l'art 1 : les mathématiques de la dynamique de foule

Décision débloquée : quel(s) modèle(s) de foule, et que peut-on dire honnêtement en démo ?
Angle : sécurité et évacuation uniquement. Aucun choix n'est fait ici : ce sont des options.
Légende : chaque lien est une source ouverte pendant cette recherche. `[?]` = affirmation tirée de ma mémoire, non vérifiée en ligne. Avertissement : la recherche web a été courte (une dizaine de requêtes) ; les chiffres marqués `[?]` sont à confirmer avant d'être montrés à un jury.

## 0. Image d'ensemble (version simple)

Simuler une foule, c'est choisir entre trois façons de la regarder :
- **De près** (microscopique) : on suit chaque personne comme une bille qui veut aller quelque part et qui évite les autres. Précis dans le détail, lent quand il y a des dizaines de milliers de personnes.
- **De loin** (macroscopique) : on ne voit plus des gens mais une « nappe » dont l'épaisseur est la densité (personnes par m²), comme de l'eau qui s'écoule. Rapide, mais on perd l'individu.
- **Apprise** (apprentissage automatique) : un réseau de neurones imite un simulateur. Très rapide, mais il ne sait que ce qu'il a vu.

Règle d'or de la littérature : aucun modèle ne prédit un nombre exact pour une foule réelle ; ils comparent bien des scénarios entre eux quand le comportement reste « normal ».

## 1. Modèles microscopiques (une équation par personne)

Vocabulaire : **agent** = une personne simulée ; **vitesse souhaitée** = la vitesse à laquelle l'agent marcherait seul (environ 1,3 m/s) ; **goulot** = un passage étroit (porte, couloir) ; **arche** = voûte que forment les gens devant une porte et qui bloque le flux par intermittence.

Survol récent des modèles en temps continu : [arXiv 2308.07450](https://arxiv.org/pdf/2308.07450). Comparaison de modèles à base de forces : [Collective Dynamics, A191](https://collective-dynamics.eu/index.php/cod/article/view/A191).

### 1.1 Social force (Helbing et Molnár, 1995)
- Image : chaque personne est une bille tirée par un ressort vers sa sortie et repoussée par des ressorts invisibles autour des autres et des murs.
- Équation en clair : `m · dv/dt = m · (v0·e − v)/τ + Σ f_répulsion + Σ f_mur`.
  `m` masse ; `v` vitesse actuelle ; `v0` vitesse souhaitée ; `e` direction vers le but ; `τ` temps de relaxation (en secondes, la rapidité avec laquelle on rejoint sa vitesse souhaitée) ; `f_répulsion` décroît exponentiellement avec la distance entre personnes (`A·exp((r−d)/B)`, `d` distance, `r` somme des rayons, `A` et `B` des paramètres à régler). Source de la référence : [Phys. Rev. E 51, 4282 cité ici](https://arxiv.org/pdf/1207.1189) ; forme exacte de l'équation `[?]`.
- Reproduit : files spontanées dans un couloir à deux sens, oscillations aux portes, arches et « plus vite en étant plus lent » `[?]`.
- Rate ou fausse : les gens se chevauchent ou rebondissent (non physique) ; résultats très sensibles aux paramètres, calibrage délicat ([estimation de paramètres sur 235 piétons](https://publications.ait.ac.at/de/publications/validating-social-force-based-models-with-comprehensive-real-worl/)) ; ne gère pas les groupes ni les escaliers sans ajouts.
- Maturité : le plus connu, très utilisé en jeu vidéo et logiciels commerciaux `[?]`.

### 1.2 Generalized Centrifugal Force (GCF, Chraibi, Seyfried, Schadschneider, 2010)
- Image : comme la social force, mais chaque personne est une ellipse (épaules larges, poitrine étroite) et la répulsion augmente si on se rapproche vite de quelqu'un.
- Idée clé : la répulsion dépend de la vitesse relative et de l'ellipse, et décroît algébriquement et non exponentiellement ([arXiv 1008.4297](https://arxiv.org/abs/1008.4297)).
- Conçu pour mieux coller aux mesures dans plusieurs géométries (couloirs, goulots) ([même source](https://arxiv.org/abs/1008.4297)).
- Rate : paramètres nombreux, risques de chevauchement à forte densité `[?]`.

### 1.3 Modèles « à vitesse » : CFSM (Collision-Free Speed Model) et vitesse collective
- Image : on ne règle plus des forces, on règle directement la vitesse : « j'avance d'autant que l'espace devant moi me le permet ». Comme sur une autoroute où l'on ralentit selon la distance à la voiture de devant.
- Équation en clair : `vitesse = min(v0, max(0, (écart − taille)/T))` ; `écart` distance libre devant soi ; `taille` encombrement ; `T` temps de sécurité (secondes). Forme proche des modèles de trafic ; `[?]` pour la forme exacte du CFSM de Tordeur, Chraibi, Seyfried, et pour le « Collective Velocity Model » (aucune source trouvée pendant cette recherche).
- Avantage : pas de chevauchement par construction, stable, paramètres peu nombreux. C'est le modèle de base du simulateur libre JuPedSim `[?]`.
- Rate : les comportements émergents riches (arches, turbulence) sont moins naturels ; pas de pression.

### 1.4 ORCA / RVO (Reciprocal Velocity Obstacles, van den Berg et al., 2008, 2011)
- Image : chaque agent calcule l'ensemble des vitesses qui ne mènent à aucune collision dans les secondes à venir, et prend celle qui s'en écarte le moins ; tous les agents font de même et se partagent l'effort d'évitement.
- Maths : un programme linéaire (trouver un point dans une zone délimitée par des droites) par agent et par pas de temps ; garantie d'absence de collision si tous suivent la même règle ([description](https://arxiv.org/pdf/2308.14947) ; article d'origine ICRA 2008 : [?]).
- Bien : très rapide (centaines de milliers d'agents), fluide en espace ouvert, venu de la robotique.
- Rate : trop « poli » : pas de contact, pas de pression, peu de goulots réalistes ; calibré pour éviter, pas pour imiter le corps à corps. Inadapté aux fortes densités `[?]`.

### 1.5 Automates cellulaires et floor field
- Image : le sol est un damier ; chaque case contient 0 ou 1 personne ; à chaque tour, chacun tente de passer sur une case voisine. Le **floor field** (champ de sol) est une carte de « pente » qui indique la direction de la sortie, comme une colline dont le sommet serait la porte.
- Règle : probabilité de choisir une case ∝ `exp(k_S · S) · exp(k_D · D)` avec `S` champ statique (distance à la sortie), `D` champ dynamique (traces laissées par les autres), `k_S` et `k_D` des poids `[?]`.
- Bien : très rapide, facile à coder et à expliquer, bons goulots simples.
- Rate : mouvement discret (vitesses quantifiées), densités peu réalistes, groupes difficiles ; moins fidèle en quantités (temps d'évacuation) sauf calibrage serré.
- Comparaison sur les cas de test RiMEA (normes allemandes d'évacuation) : [Social Force, automate, ORCA donnent des temps de marche différents](https://elib.spbstu.ru/dl/2/k19-67.pdf/download?lang=en) `[?]` sur le détail des chiffres.

### Tableau comparatif (jugement qualitatif, à valider)
| Phénomène | Social force | GCF | CFSM | ORCA | Automate |
|---|---|---|---|---|---|
| Files, couloirs | oui | oui | oui | moyen | oui |
| Débit au goulot | à calibrer | bon | bon | faible | moyen |
| Arches aux portes | oui | oui | difficile | non | difficile |
| Panique / contacts | partiel | partiel | non | non | non |
| Groupes (famille) | ajout | ajout | ajout | ajout | ajout |
| Escaliers | non (sans ajout) | non | non | non | non |
| Coût de calcul | moyen | moyen | bas | bas | très bas |

Les groupes et les escaliers exigent des extensions dans tous les cas. Les modèles supposent des gens qui cherchent leur chemin de façon raisonnable ; la panique réelle n'a pas été validée quantitativement (voir §4).

## 2. Modèles macroscopiques (la foule comme un fluide)

Vocabulaire : **densité** `ρ(x,t)` = personnes par m² en un point et à un instant ; **équation de conservation** = personne ne naît ni ne disparaît, donc ce qui entre dans une zone moins ce qui en sort donne la variation de densité.

### 2.1 Équation de conservation et modèle de Hughes (2002)
- Image : une rivière qui descend vers la mer, mais où chaque goutte cherche le chemin le plus court en tenant compte de l'encombrement.
- Équations en clair : `∂ρ/∂t + div(ρ · v) = 0` (conservation), avec `v = −f(ρ) · ∇φ / |∇φ|` (vitesse ralentie par la densité, dirigée vers la sortie) et `|∇φ| = 1/f(ρ)` (équation eikonale : `φ` est le « temps restant jusqu'à la sortie », pondéré par l'encombrement ; `∇φ` sa pente ; `f(ρ)` la vitesse permise à la densité `ρ`).
- Source : [synthèse mathématique du modèle de Hughes](https://ar5iv.labs.arxiv.org/html/2305.10076). La théorie d'existence de solutions n'est établie qu'en 1 dimension ; en 2D elle reste ouverte (même source).
- Variantes numériques existantes : sur graphes ([arXiv 1604.05126](https://arxiv.org/pdf/1604.05126)) et avec un schéma semi-lagrangien ([Carlini et al.](https://ricerca.univaq.it/retrieve/e2188bfa-a41c-f28d-e053-d805fe0ac2bb/CarliniFestaSilWolf.pdf)).
- Rate : individus, groupes, hétérogénéité (vieux/jeunes), arches, comportements de contact.

### 2.2 Jeux à champ moyen (mean field games, Lasry et Lions, 2007) `[?]`
- Image : un million de joueurs rationnels, chacun optimise son trajet en anticipant l'état moyen de la foule, et le résultat est un équilibre (personne ne gagne à changer seul).
- Maths : deux équations couplées : une qui avance dans le temps (la densité) et une qui recule (le coût optimal restant pour chaque joueur). Cette dernière est une équation de Hamilton-Jacobi-Bellman.
- Application foule : Lachapelle et Wolfram (2011) ont proposé un modèle de congestion `[?]`. Aucune source ouverte trouvée pendant la recherche ; à vérifier.
- Quand c'est utile : anticipation intelligente (les gens contournent un bouchon prévu), optimisation de consignes à l'échelle d'un quartier.
- Limites : suppose des agents rationnels ; la panique ou l'ignorance du plan s'en écartent.

### 2.3 Transport optimal et mouvement de foule avec contact `[?]`
- Image : déplacer un tas de sable d'une forme à une autre en dépensant un minimum d'effort ; la foule est le sable, la contrainte « densité maximale » interdit de la comprimer au-delà.
- Maury, Roudneff-Chupin, Santambrogio (2010) : modèle où la densité reste sous un plafond, avec une vitesse projetée sur les mouvements permis `[?]`. Pas de source ouverte trouvée ici.
- Intérêt : garantit une densité plafonnée ; utile pour les contraintes de capacité.

### Quand le macroscopique est préférable
- Très grandes foules (stade, ville entière) : cout de calcul indépendant du nombre de personnes.
- Optimisation : trouver le meilleur plan parmi des milliers d'options, car les équations sont lisses et dérivables.
- Quand on se fiche de l'individu : débits, temps d'évacuation global.
- Moins bien : ce qui dépend du détail (un goulot de 3 portes, une bousculade), où le micro est plus fidèle.

## 3. Diagramme fondamental (densité → débit)

- Image : plus il y a de monde, moins on marche vite ; mais au début, plus de monde veut dire plus de gens qui passent par seconde. Il existe donc une densité qui donne le débit maximal, puis le flux s'effondre : c'est le diagramme fondamental.
- Définitions : **densité** `ρ` (personnes/m²) ; **vitesse** `v` (m/s) ; **débit spécifique** `J = ρ · v` (personnes par mètre de largeur et par seconde).
- Valeurs publiées :
  - Capacité (maximum de `J`) : de 1,2 à 1,8 pers./(m·s) selon les guides et études ; densité au maximum entre 1,75 et 7 pers./m² selon les sources ([Seyfried, revue et bilan](https://www.ipam.ucla.edu/abstract/?tid=13181) ; [Zhang et Seyfried](https://arxiv.org/pdf/1107.5246) ; [Thunderhead, courbes de référence](https://www.thunderheadeng.com/docs/2025-1/pathfinder/appendices/verification-validation/fundamental-diagrams/unidirectional)).
  - Vitesse libre : environ 1,3 à 1,4 m/s `[?]` ; la courbe de Weidmann (1993) rassemble 25 expériences antérieures et reste la plus citée ([source](https://arxiv.org/pdf/physics/0506170)).
- Dispersion : les causes évoquées sont la culture, la population, les flux à un ou plusieurs sens, la motivation, les groupes ([même revue](https://www.ipam.ucla.edu/abstract/?tid=13181)). Au-delà de 2 pers./m², de petits changements de l'installation expérimentale font varier fortement le débit mesuré ([Zhang, Seyfried](https://arxiv.org/pdf/1107.5246)).
- Données plus récentes à forte densité : [expériences à grande échelle](https://arxiv.org/pdf/1710.10263) ; données de goulots : [Seyfried et al.](https://arxiv.org/pdf/0810.1945).
- Conséquence pour la fiabilité : l'écart de 1,2 à 1,8 est de ±20 % autour du milieu. Tout temps d'évacuation chiffré hérite au moins de cet écart. On peut donc dire « 6 à 9 minutes », pas « 7 min 12 s ». C'est mon calcul, pas une mesure publiée.

## 4. Mouvements de foule dangereux

Vocabulaire : **turbulence de foule** = quand la densité est si forte que les gens sont poussés involontairement par la masse, en secousses irrégulières ; **onde de pression** = la poussée se propage dans la foule.

- Étude de référence : Helbing, Johansson, Al-Abideen, vidéo du drame de Mina (Hajj, 12 janvier 2006) : deux transitions soudaines, de l'écoulement laminaire à « stop-and-go » puis à « turbulent » ; cette seconde transition est mal comprise et s'accompagne de relâchements de pression brusques comparables à des séismes ([arXiv physics/0701203](https://arxiv.org/pdf/physics/0701203)). Suivi : [From Crowd Dynamics to Crowd Safety](https://arxiv.org/pdf/0810.4590).
- Mesure : plus de 1 000 personnes suivies automatiquement, densité locale estimée par noyau ([même série](https://arxiv.org/pdf/0810.4590)).
- Seuils de densité : aucune source ouverte ne donne un seuil unique. Valeurs citées dans la littérature de sécurité : 4 à 6 pers./m² = inconfort et danger croissant, au-delà de 6 à 7 = risque d'asphyxie `[?]`. Ne pas présenter un nombre comme « la limite ».
- Validité :
  - Un cas documenté par vidéo, pas des dizaines. Le reste est modélisation (social force « panique ») ; la validation quantitative d'un modèle de panique est faible `[?]`.
  - Les expériences en laboratoire ne peuvent pas atteindre ces densités pour des raisons éthiques.
  - Les modèles de la §1 simulent mal le contact et l'écrasement : ils ne doivent pas servir à prédire des blessés.
- Usage honnête : un indicateur « zone où la densité dépasse X » signale **où regarder**, sans prédire une catastrophe.

## 5. Incertitude : comment annoncer une fourchette honnête

Vocabulaire : **Monte Carlo** = répéter la simulation N fois avec des tirages aléatoires différents (départs, vitesses, hésitations) ; **analyse de sensibilité** = faire varier un paramètre à la fois (ou tous ensemble) pour voir lesquels changent le résultat ; **graine** = nombre qui fixe le hasard, pour rejouer exactement un tirage.

- Image : on ne lance pas un dé une fois, on le lance cent fois et on donne l'intervalle dans lequel tombent 90 % des résultats.
- Trois couches d'incertitude à distinguer :
  1. Hasard interne du modèle (rejouer N fois).
  2. Paramètres mal connus (vitesse, temps de réaction, débit de porte : balayer l'écart de §3).
  3. Choix du modèle (comparer au moins deux modèles de §1).
- Combien de répétitions ? Aucune source ouverte trouvée sur une valeur standard. Raisonnement : l'erreur sur une moyenne diminue en `1/√N`. Pour dire de manière stable que le plan A bat le plan B, il faut que l'écart soit grand devant l'écart-type / √N. Ordres de grandeur à tester (estimation, pas mesure) :
  - 30 à 50 répétitions par plan : souvent suffisant pour une moyenne (règle usuelle de statistiques) `[?]`.
  - 100 à 500 pour des queues de distribution (« 1 % des pires cas ») `[?]`.
  - Vérification pratique : recalculer le classement sur plusieurs sous-échantillons (bootstrap) ; s'il change d'un tirage à l'autre, N est trop petit.
- Pour économiser du calcul : tirage quasi-aléatoire (RQMC) ; un travail de TUM sur des simulateurs de foule signale R² supérieur à 0,95 avec environ une douzaine de simulations ([page du mémoire](https://www.cs.cit.tum.de/en/sccs/news/sccs-colloquium/article/cagatay-gueltekin-predicting-macroscopic-crowd-properties-using-the-swim-algorithm)).
- Validation : une méthode récente compare des modèles sur des analyses de composantes principales de trajectoires ([arXiv 1502.00528](https://arxiv.org/pdf/1502.00528)), et on rappelle qu'une validation quantitative est nécessaire avant tout usage de sécurité ([AIT](https://publications.ait.ac.at/de/publications/validating-social-force-based-models-with-comprehensive-real-worl/)).

## 6. Apprentissage automatique 2023-2026

Vocabulaire : **modèle substitut (surrogate)** = réseau de neurones entraîné sur des milliers de simulations pour prédire leur résultat sans refaire le calcul ; **hors distribution** = situation que le réseau n'a jamais vue.

- Image : un élève qui a mémorisé les corrigés de mille problèmes ; il répond vite sur des problèmes voisins, et bluffe sur un problème nouveau.
- Exemples récents (chiffres déclarés par les auteurs, non vérifiés indépendamment) :
  - CSIRO, émulateur du simulateur PiXIE : bonne précision sur temps d'évacuation et densités, en interpolation et extrapolation ([ModSim 2025](https://mssanz.org.au/modsim2025/files/C06.smith.pdf)).
  - CrowdSafeCritic : carte de densité et de pression à partir d'un plan, 7,2 ms sur GPU (738 fois plus vite), 470 ms sur CPU (11 fois), d'après un simulateur JuPedSim ([page NeurIPS](https://neurips.cc/virtual/2026/165346)) ; date de publication à confirmer.
  - TUM : temps d'évacuation total, plus d'un ordre de grandeur de gain ([source](https://www.cs.cit.tum.de/en/sccs/news/sccs-colloquium/article/cagatay-gueltekin-predicting-macroscopic-crowd-properties-using-the-swim-algorithm)).
  - Osaka (ICDCN 2026) : estimation rapide de l'effet de politiques, le meilleur étant un réseau de graphes spatio-temporel ([page](https://mc.net.ist.osaka-u.ac.jp/en/themes/topics/rapid-policy-impact-estimation-for-pedestrian/)).
  - Calibrage de modèles par substitut dans une boucle d'optimisation ([IEEE Access 2025](https://doaj.org/article/2cea30148868403983575c6d6bbefead)).
  - Comparaison micro avec ML : un arbre de décision a été plus stable qu'un réseau, sauf aux fortes densités ([CityU Hong Kong](https://scholars.cityu.edu.hk/en/publications/machine-learning-methods-in-microscopic-pedestrian-and-evacuation/)).
  - Simulateurs neuronaux génératifs : [revue de résumé](https://themoonlight.io/review/understanding-complex-crowd-dynamics-with-generative-neural-simulators) (source secondaire).
- Modèles appris sur trajectoires réelles (Social LSTM, Social GAN, 2016-2018 `[?]`) : conçus pour prédire une marche individuelle à quelques secondes, pas pour comparer des décisions de crise.
- Maturité réelle : prometteuse en recherche, **pas encore un outil de décision éprouvé**. Un substitut hérite des défauts du simulateur qu'il imite, plus une erreur propre ; il est fiable seulement près de ses données d'entraînement. Il faut donc d'abord un simulateur classique solide. Le substitut sert ensuite à explorer vite, pas à valider.

## 7. Ce que la littérature recommande (10 lignes)

1. Établi : les modèles micro reproduisent bien files, couloirs, débits de porte en conditions normales ; ils exigent un calibrage sur des données locales.
2. Établi : le débit maximal d'un passage varie de 1,2 à 1,8 pers./(m·s) selon les études ; toute prédiction chiffrée hérite d'au moins ±20 %.
3. Établi : il existe un seul cas vidéo documenté de turbulence de foule (Mina 2006) ; les seuils de danger ne sont pas universels.
4. Établi : on ne valide pas un modèle de panique contre des expériences, pour des raisons éthiques.
5. Option A : un modèle à vitesse (CFSM) ou GCF, stable et peu coûteux, pour le micro ; mettre ORCA si seule la vitesse de calcul compte.
6. Option B : un modèle macroscopique (Hughes, mean field games) pour de très grandes zones ou de l'optimisation ; moins précis dans le détail.
7. Option C : micro de référence plus substitut appris pour explorer mille variantes ; maturité faible, à présenter comme une accélération.
8. Ouvert : modélisation des groupes, des escaliers, du contact et de la panique ; pas de consensus.
9. Ouvert : nombre de répétitions nécessaire ; à mesurer sur nos cas (stabilité du classement) plutôt qu'à supposer.
10. Combiner deux modèles différents et montrer l'écart vaut mieux qu'un seul modèle « précis ».

## 8. Ce qu'on peut affirmer en démo (et ce qu'on doit éviter)

Peut s'affirmer :
- « Nous comparons des plans entre eux dans des conditions de marche normale, avec une fourchette issue de N répétitions. »
- « Les zones où la densité dépasse un seuil sont signalées comme à surveiller. »
- « Deux modèles indépendants donnent le même classement (ou pas) » : dire laquelle des deux.

À ne pas affirmer :
- Un temps d'évacuation exact, un nombre de blessés ou de morts, une probabilité de panique.
- Que la simulation « prédit » une foule réelle précise : elle n'est validée que sur des expériences de laboratoire.
- Qu'un substitut IA est aussi fiable que le simulateur.

## Questions à trancher (regroupées)

1. Priorité de la démo : A) fidélité du détail (micro seul), B) très grandes zones et vitesse (macro), C) exploration de nombreux plans (micro + substitut) ?
2. Combien de modèles montrer : A) un seul, B) deux pour afficher l'écart (ma lecture de la littérature le favorise) ?
3. Veut-on des seuils de densité affichés (A oui, avec la mention « indicatif », B non) ?
Choix par défaut si pas de réponse : 1.A, 2.B, 3.A.

Écartée en dernier : un micro seul avec quelques centaines de répétitions, plus simple à expliquer, mais sans mesure de l'incertitude de modèle.
