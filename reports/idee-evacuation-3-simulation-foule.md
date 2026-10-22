# Idée « Évacuation 3D » : moteur de foule, rendu, calcul, rôle de l'agent

Recherche du 22 oct. 2026. Chaque fait a sa source ; `[?]` = non vérifié ; `[estimation]` = mon calcul, pas une mesure.

## Décision débloquée

Quel moteur de simulation de foule et quelle 3D choisir, et ce qui tient en 7 h à 4.

## Verdict (en clair)

**À réduire, puis faisable.** Image : on ne reconstruit pas Bercy, on construit une « maquette en carton » d'une grande salle (gradins, couloirs, 4 à 6 issues, une place devant avec une bouche de métro), on y lâche 1 000 à 3 000 petits volumes blancs, et un agent IA compare des plans quand une issue ou une station est bloquée.
- **Moteur : JuPedSim** (bibliothèque Python de simulation de piétons, du centre de recherche de Jülich).
- **3D : three.js** (bibliothèque 3D du navigateur) avec rendu « instancié » (un seul dessin répété des milliers de fois).
- **À ne pas promettre en démo : 10 000 agents.** Aucune source trouvée ne le prouve ni pour le moteur ni pour le rendu.
- **Risque n°1 :** la vitesse réelle de JuPedSim. Mon essai local a échoué (voir §1), donc **aucune mesure à ce jour**. Test d'arrêt à faire dans la première heure (§7).

## 1. Moteurs de simulation de piétons

Un « modèle de foule » est la règle qui dit à chaque personne comment avancer sans percuter les autres. « Social force » = les gens se repoussent comme des aimants. « Velocity-based » (ex. ORCA) = chacun choisit une vitesse qui évite les collisions prévues.

| Moteur | Licence | Maturité (fait sourcé) | Verdict |
|---|---|---|---|
| **JuPedSim** | LGPLv3 [GitHub](https://github.com/PedestrianDynamics/jupedsim) | Version 1.4.2 du 21 mai 2026, roues (paquets prêts à installer) macOS arm64/x86, Linux, Windows, Python 3.10 à 3.14 [PyPI](https://pypi.org/pypi/jupedsim/json). Modèles : Collision Free Speed, Generalized Centrifugal Force, une variante « V3 » et WarpDriver [doc](https://www.jupedsim.org/stable/). Parcours à étapes (journeys) et choix de route [doc](https://www.jupedsim.org/stable/). | **Choix principal** |
| Vadere | GPLv3 [GitLab](https://gitlab.lrz.de/vadere/vadere) | Cadre open source de l'Université de Munich, créé en 2016 [vadere.org](https://vadere.org/). Pilotage depuis Python : `[?]` | Plan B lointain (GPL, outil à interface graphique) |
| SUMO (piétons) | EPL `[?]` (la page ne le dit pas) | Piétons par défaut « striping » (couloirs en bandes de 0,65 m) ; couplage JuPedSim « en chantier », **à compiler soi-même sous macOS/Linux** ; import OSM de trottoirs et passages [doc SUMO](https://sumo.dlr.de/docs/Simulation/Pedestrians.html) | Utile pour le métro/la rue, trop lourd pour 7 h |
| Menge | Apache-2.0 [GitHub](https://github.com/MengeCrowdSim/Menge) | Aucune version publiée, 68 tickets ouverts, badge Travis (CI ancienne) | Écarté |
| RVO2 (ORCA) | Apache-2.0 [GitHub](https://github.com/snape/RVO2) | Bibliothèque C++98 d'évitement de collisions, parallèle OpenMP | Brique de secours |
| Mesa (Python « agent-based ») | Apache 2.0 [PyPI](https://pypi.org/pypi/mesa/json), v3.5.1 | Espace continu en « mode maintenance » [Tessl](https://tessl.io/registry/tessl/pypi-mesa/files/docs/spatial.md) ; pas de benchmark de foule trouvé | Écarté : agents en pur Python, pas conçu pour la foule |
| Implémentations TypeScript | non trouvées | Rien de maintenu et sourcé trouvé | Écrire à la main = risque |

Capacité, navigation, obstacles (JuPedSim) :
- Zone de marche = **un seul polygone** (Shapely, bibliothèque de géométrie Python), sans auto-intersection ; obstacles = trous ; un obstacle ne doit **pas couper** la zone en deux [doc géométrie](https://www.jupedsim.org/stable/concepts/geometry.html). Conséquence : une issue bloquée = on retire la sortie visée et on pose un obstacle devant, sans couper la salle.
- La doc dit que le coût monte avec le nombre d'agents et la taille de la zone, avec un pas de temps fin (typiquement 0,01 s, selon le texte SUMO) [SUMO-JuPedSim](https://sumo.dlr.de/docs/jupedsim.html). **Aucun chiffre de 10 000 agents publié** que j'aie trouvé. L'exemple officiel d'évacuation : 100 agents, pas de 0,05 s, 3 000 itérations = 150 s simulées, trajectoires écrites en SQLite [notebook](https://www.jupedsim.org/stable/notebooks/routing.html).
- 2D uniquement dans ce que j'ai lu ; escaliers/étages : `[?]`. En 7 h, on reste en 2D et on extrude en 3D pour l'affichage.
- Import d'un maillage OSM (OpenStreetMap, carte libre) : aucune source trouvée qui le fasse directement pour JuPedSim. SUMO importe des trottoirs OSM, pas des intérieurs [doc SUMO](https://sumo.dlr.de/docs/Simulation/Pedestrians.html). L'intérieur d'une salle n'est de toute façon pas dans OSM `[?]`.
- **Réserve officielle :** la doc dit « usage académique uniquement », modèles qui « peuvent ou non avoir une capacité prédictive », aucune validation affirmée pour des usages de sécurité [disclaimer](https://www.jupedsim.org/stable/disclaimer.html). C'est la phrase à reprendre pour rester honnête (§5).

**Mon essai local :** `pip install jupedsim` dans un environnement isolé est resté bloqué ~8 min sans rien installer (réseau restreint dans mon bac à sable `[?]`). Je l'ai arrêté. Le script de mesure est prêt : `/private/tmp/claude-501/-Users-adem--claude-spares-spare-hlugz3/538b6413-23c8-47e6-8e95-61722ac1129d/scratchpad/bench/bench.py` (salle 120 × 80 m, N agents, 200 pas). Son API (`CollisionFreeSpeedModelAgentParameters`, `add_exit_stage`) n'a pas été exécutée : à corriger à la première erreur.

## 2. Rendu 3D de 10 000 à 50 000 agents

« Instanced mesh » = on envoie à la carte graphique une seule forme (un cube/capsule) et une liste de positions ; elle la dessine N fois en un seul appel. C'est la bonne technique pour des volumes blancs.
- three.js a un exemple officiel d'`InstancedMesh` en WebGPU (le nouveau moteur graphique du navigateur) dont le nombre d'instances se règle par un curseur ; défaut 1 000 (10³) [exemple](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_instance_mesh.html). Pas de maximum codé ; **pas de chiffre d'images/seconde à 10 000+ sur du matériel connu**.
- Témoignages (anecdotes, pas des mesures) : un développeur voit l'exemple WebGPU à ~60 img/s contre ~40 en WebGL [forum three.js](https://discourse.threejs.org/t/three-js-instancedmesh-issue-when-using-webgpu-renderer/71219) ; un million d'instances avec niveaux de détail et bibliothèque tierce InstancedMesh2 [forum](https://discourse.threejs.org/t/instancedmesh-lod-1-million-instances/70748) ; une foule en un seul appel de dessin [forum](https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928).
- Bogue connu : en WebGPU, changer `mesh.count` peut dépasser la taille de buffer de 65 536 octets (selon la version) [forum](https://discourse.threejs.org/t/three-js-instancedmesh-issue-when-using-webgpu-renderer/71219). → **Rester en WebGL** (WebGPU inutile pour la démo).
- deck.gl, CesiumJS, Babylon : je n'ai trouvé aucun chiffre sourcé pour 10 000 à 50 000 agents animés. Babylon : un fil de forum dit « moins de ~2 000 meshes en WebGL » pour des meshes distincts, pas pour des instances `[?]` [forum](https://forum.babylonjs.com/t/instanced-meshes-and-performance/4794).
- **Pour « carton » : parfait.** Pas de personnages animés (qui coûtent cher : GPU Gems 3 ne rapporte qu'environ 10 000 personnages animés à 30 img/s sur du matériel de 2007 [NVIDIA](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch02.html)). Des boîtes blanches qui glissent suffisent.
- **Rejeu et 3 scénarios côte à côte** `[estimation]` : le moteur écrit des trajectoires à 5-10 images/s ; le navigateur interpole entre deux images. Trois vues = trois fenêtres de rendu (scissor) ou trois canvas, 3 × 3 000 = 9 000 instances, très en dessous de ce que l'instanciation encaisse. À vérifier à l'écran (§7).

## 3. Où calculer, où stocker

- **Modal** (exécution Python dans le nuage) : formule Starter gratuite, 30 $ de crédits mensuels, 100 conteneurs [modal.com/pricing](https://modal.com/pricing) ; CPU 0,0000131 $ par cœur physique et par seconde (un cœur physique = 2 vCPU), mémoire 0,00000222 $/GiB/s (même page). Nous avons 100 $ de crédits d'après `CLAUDE.md`.
- `[estimation]` 100 simulations × 5 min × 1 cœur = 30 000 cœur-secondes ≈ **0,40 $** (marge ×5 pour la mémoire et les relances : ~2 $). Le coût n'est pas le sujet ; **le temps** l'est : 100 sims en parallèle (`.map`) si chaque sim tient en < 3 min. À mesurer.
- Les « sandbox » Modal coûtent environ 3× plus cher [blaxel](https://blaxel.ai/blog/modal-pricing-alternatives-guide) `[?]` (source tierce) : utiliser des fonctions, pas des sandbox.
- **Aiven** (bases de données gérées). Plans gratuits : PostgreSQL, MySQL, OpenSearch, Kafka, Valkey ; pas de plan gratuit ClickHouse annoncé [aiven.io/pricing](https://aiven.io/pricing) · [ClickHouse](https://aiven.io/pricing/clickhouse). Montant de crédits Aiven par équipe : non trouvé (cf. `reports/hackathon-terrain.md`).

| Brique | Nécessaire ? | Une ligne |
|---|---|---|
| **PostgreSQL** | **Oui** | Scénarios, paramètres, résultats agrégés (temps d'évacuation, densité max), journal de ce que l'agent a décidé et pourquoi. |
| **ClickHouse** | **Utile, pas vital** | Base en colonnes, rapide pour agréger des millions de lignes : le seul endroit où « gros jeu de données » est vrai (3 000 agents × 2 pas/s × 300 s = 1,8 M de lignes par simulation `[estimation]`, ~180 M pour 100) et où l'agent interroge en SQL (« où la densité dépasse-t-elle 4 pers./m² ? »). Sans lui : fichiers Parquet/SQLite sur disque, ça marche pour la démo. |
| **Valkey** | Optionnel | File d'attente des 20-100 simulations et jauge de progression. Un champ « statut » dans PostgreSQL fait le même travail à cette taille. |
| **Kafka** | **Non** | Flux de positions en direct : inutile, le rejeu se lit dans un fichier. Seul intérêt : l'effet « en direct » ; coût en temps non justifié. |

Recommandation : PostgreSQL (obligatoire) + ClickHouse (si le temps le permet, pour les cartes de densité). Le brief Aiven valorise la donnée ; ClickHouse y répond sans surjouer.

## 4. Rôle réel de l'agent LLM

Une boucle de simulation fait : paramètres fixes → un résultat. L'agent apporte ce qu'elle ne sait pas faire :
1. **Traduire** une demande libre (« la station Bercy est fermée, concert de 18 000 personnes, 20 % de personnes à mobilité réduite ») en scénario valide (issues fermées, flux, répartition).
2. **Choisir les scénarios suivants selon les résultats** (recherche adaptative) : un balayage fixe de 100 cas gaspille ; l'agent lit le goulot du premier lot, puis teste les remèdes ciblés (rouvrir une issue, décaler la sortie par zones, balisage).
3. **Lire les résultats** (cartes de densité, files, temps du dernier arrivé) et nommer la cause (« l'issue Nord reçoit 41 % du flux pour 18 % de sa capacité »).
4. **Justifier** avec les chiffres tirés de la base, citer les scénarios, signaler les écarts entre graines aléatoires (relancer 3 fois, donner une fourchette).
5. **Refuser de conclure** quand l'écart entre plans est dans le bruit.

Ce qui reste du code déterministe : la simulation, les métriques, la base. L'agent n'invente aucun chiffre ; chaque phrase pointe une ligne de la base.

Exemples d'agents qui pilotent une simulation (tous pour la circulation, pas les piétons) :
- ChatSUMO : un LLM (Llama 3 8B) génère des scénarios SUMO depuis OSM, 96 % d'exactitude annoncée sur Albany [arXiv 2409.09040](https://arxiv.org/pdf/2409.09040).
- ChatSUMO-Agent : outils multiples, > 80 % d'effort de configuration en moins annoncé [TRB](https://trid.trb.org/View/2704119).
- SUMO-MCP : SUMO exposé via le Model Context Protocol (protocole d'outils pour agents) [arXiv 2506.03548](https://arxiv.org/html/2506.03548v1). AgentSUMO (planificateur → plan exécutable) est mentionné dans la même recherche ; le lien exact n'est pas confirmé `[?]` [arXiv 2511.06804](https://arxiv.org/html/2511.06804v1).
- Pour des piétons : je n'ai trouvé aucun exemple équivalent. C'est un espace libre, ou une raison de se méfier (prudence, §5).

## 5. Crédibilité : valider et affirmer honnêtement

« Valider » = montrer que la simulation reproduit le réel. « Vérifier » = montrer que le code fait ce qu'on croit.
- **Données publiées utilisables :** archive du centre de Jülich (expériences de goulots, évacuations, couloirs, escaliers ; trajectoires ; licence CC BY 4.0) [ped.fz-juelich.de](https://ped.fz-juelich.de/db/). Une thèse de Wuppertal dérive un diagramme fondamental (débit selon la densité) d'expériences dans une arène à Düsseldorf avec jusqu'à 300 personnes [thèse](https://elekpub.bib.uni-wuppertal.de/ubwhsmig/content/titleinfo/3553853) (contenu lu via extrait de recherche seulement `[?]`).
- **Cadres de tests :** NIST TN 1822 (tests de vérification d'un modèle d'évacuation : temps de pré-évacuation, déplacement, usage des issues, disponibilité des routes, contraintes de flux) [NIST](https://www.lunduniversity.lu.se/lup/publication/470b44d3-0956-497d-8c21-a52ad32c52b8) ; lignes directrices IMO (navires) et RiMEA (Allemagne), dont les cas de test servent souvent hors de leur contexte [Thunderhead](https://www.thunderheadeng.com/docs/2025-1/pathfinder/appendices/verification-validation/imo) · [RiMEA](https://traffgo-ht.com/en/pedestrians/validation/rimea/index.html). La numérotation des annexes IMO diffère selon les sources `[?]` : vérifier le texte avant de citer.
- **Stades :** une thèse (York, 2019) compare des temps de sortie simulés et mesurés ; elle conclut que l'architecture pèse plus que les profils d'occupants hors urgence [York](https://yorkspace.library.yorku.ca/handle/10315/36335) (extrait seulement `[?]`).
- **Accor Arena :** capacité de 7 000 à 20 300 selon l'événement ; station la plus proche Bercy, lignes 6 et 14 [Paris je t'aime](https://parisjetaime.com/eng/culture/accor-arena-p3602). **Aucune source publique trouvée sur ses issues ou son plan d'évacuation.** Notre salle sera donc « inspirée de », jamais « le vrai plan ».

Ce qu'on peut faire en 7 h (une seule preuve, pas plus) : reproduire un goulot de Jülich (débit à travers une porte de largeur donnée) et montrer la courbe simulation contre mesure. `[estimation]` 45 à 60 min si les données se téléchargent ; à couper si ça traîne.

**Ce qu'on peut dire en démo :**
- « Compare des plans entre eux sur la même salle et les mêmes hypothèses. »
- « Le classement des plans est le résultat ; les minutes absolues ne le sont pas. »
- « Modèle de recherche (JuPedSim), vérifié sur un goulot publié » (seulement si la preuve est faite).
- « Salle stylisée, pas le plan officiel. Outil d'aide à la réflexion, pas un avis de sécurité. »

**Ce qu'on ne dit pas :** « il faudra 11 min 40 pour évacuer l'Accor Arena », « validé », « conforme à la norme », « prédit la réalité ». Les foules en panique, les groupes, les escaliers, le métro réel : non modélisés.

## 6. Garde-fou

Le produit sert à **évacuer plus vite et plus sûrement**. Règles à écrire dans la consigne de l'agent et à tester :
- Les objectifs autorisés sont uniquement des métriques de sécurité : temps d'évacuation, densité maximale, durée de files, équité entre issues.
- L'agent ne reçoit aucun outil pour placer une menace, un point d'attaque ou une cible. Les « incidents » sont des **fermetures neutres** (issue ou station indisponible, panne, travaux).
- Une demande de scénario hostile (maximiser le nombre de victimes, trouver les points faibles pour nuire) est refusée et journalisée ; l'agent propose le cadrage sécurité à la place.
- Pas de données nominatives ; pas de lieu réel présenté comme « vulnérable ». Éviter de publier le classement des « pires issues » d'un site réel : ce serait une carte de risque. Côté démo : lieu stylisé.
- À faire passer par l'agent `red-team-agents` avant la répétition.

## 7. Plan en 7 h (4 builders)

Principe : un lot par builder, dossiers disjoints, une vérification par lot.

| Lot | Contenu | Vérification |
|---|---|---|
| A Moteur | Salle paramétrique (polygone + issues + obstacle d'issue bloquée) ; 1 000 puis 3 000 agents avec JuPedSim ; export des trajectoires (SQLite/Parquet) | `python bench.py 2000` : 300 s simulées en < 60 s |
| B Rendu | three.js, boîtes instanciées, lecteur de trajectoires, 3 vues côte à côte, caméra, légende des issues | 3 000 agents × 3 vues à ≥ 30 img/s dans un vrai navigateur |
| C Calcul + données | Fonction Modal qui lance N sims ; PostgreSQL (puis ClickHouse) ; métriques | 20 sims lancées en parallèle, résultats lus en base |
| D Agent | Boucle d'outils : créer scénario, lancer, lire métriques, relancer, justifier ; garde-fous ; texte de justification avec renvois à la base | Cas réel de bout en bout avec vrai moteur et vrai compte ; scénario hostile refusé |

Ordre : H+0 à H+1 : lot A seul fait son test d'arrêt (les autres préparent leur squelette). Avant de lancer en parallèle, **un cas réel traverse toute la chaîne** (règle d'Adem).

**À simplifier :** 2D extrudée ; une seule salle ; foule homogène (une vitesse, un rayon), puis 1 groupe lent (20 % de mobilité réduite) si le temps reste ; métro = une sortie lointaine avec débit limité ; 20 sims, pas 100, sauf si le test passe. **À couper :** import OSM, intérieur réel, escaliers, 10 000 agents, Kafka, panique.

**Point le plus risqué :** la vitesse de JuPedSim (jamais mesurée ici) et le premier lancement sur Modal. Plan B si le test d'arrêt échoue : descendre à 500 agents et montrer 3 scénarios plus lisibles, ou écrire un modèle simple (champ de vitesse vers l'issue + évitement ORCA via RVO2) : comptez 2 h de plus `[estimation]`.

**Verdict net : faisable réduit à ~1 000-3 000 agents, 1 salle stylisée, 3 scénarios comparés + une vingtaine de variantes lancées par l'agent.** 10 000 agents : non prouvé, ne pas l'annoncer.

## Risques pour le jury (une ligne)

« Company potential » : qui paie ? Candidats à tester auprès d'organisateurs d'événements et de gestionnaires de sites, `[?]` aucun entretien fait ; ne rien affirmer sur le marché.

## Questions pour Adem (à la fin, groupées)

Contexte : le moteur et la 3D sont tranchés par la recherche, mais deux choix d'outil et de périmètre sont les tiens.
1. Moteur : a) JuPedSim (ma reco, licence LGPL, usage « académique » à dire en démo) ; b) écrire un modèle maison simple, plus contrôlable mais 2 h de plus.
2. Lieu : a) salle stylisée « inspirée de Bercy » (ma reco, honnête) ; b) tenter l'Accor Arena avec des plans publics trouvés ce matin (risque : plan introuvable, et « carte de risque » d'un site réel, cf. §6).
3. Validation : a) une preuve sur un goulot de Jülich (ma reco, 45-60 min) ; b) aucune, on affiche « comparatif, non validé ».
Par défaut si pas de réponse : 1.a / 2.a / 3.a.
