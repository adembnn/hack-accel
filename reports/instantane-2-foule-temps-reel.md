# Instantané 2 : foule temps réel, comparaison de plans, réalisme vérifiable

Décision débloquée : quels algorithmes et bibliothèques font réagir la foule en moins d'une seconde quand on ferme une issue, comparent plusieurs plans en quelques secondes, et restent crédibles face à un jury.
Légende : lien = source ouverte pendant cette recherche ; `[?]` = non vérifié ; « estimation » = mon raisonnement, pas une mesure. Aucun benchmark n'a été lancé (rien installé). Étoiles et licences lues sur l'API GitHub le 22 oct. 2026.

## 0. Version simple et imagée

Une foule qui se réorganise « instantanément », c'est une **carte de pentes** : chaque case du sol sait de quel côté se trouve la sortie la plus proche, comme une colline dont le sommet serait la porte. Quand un juré ferme une porte, on ne recalcule pas le trajet de 10 000 personnes ; on recalcule **une seule carte** (quelques millisecondes à quelques dizaines de ms, estimation), et chacun redescend la nouvelle pente.
Trois étages : (1) la carte de pentes (**navigation**), (2) comment les gens s'évitent et se bousculent (**évitement**), (3) un « mode accéléré » qui joue 5 à 20 plans sans dessin pour les classer (**comparaison**).
Constat qui change le plan : les bibliothèques de jeux vidéo « prêtes à l'emploi » (DetourCrowd) sont faites pour quelques dizaines de personnages, pas pour 10 000. Et aucun moteur ne sait seul faire familles, suivisme ou hésitation : il faut une **couche de comportement** par-dessus, calée sur des mesures publiées (§6 et §7).

## 1. Étage 1, navigation : carte de pentes et maillage

Vocabulaire : **navmesh** = maillage de polygones qui dit où l'on peut marcher ; **Dijkstra / fast marching** = deux façons de calculer, depuis les sorties, la distance de chaque case (la seconde est plus lisse, résout l'équation « eikonale » `|∇T| = 1/vitesse`) ; **flow field** = la carte de directions qui en découle, technique de jeux de stratégie.

- Principe : un flow field se calcule une seule fois pour tout le monde, quel que soit le nombre d'agents (coût en O(cases), contre O(agents × recherche) pour A* par personne) : [explication](https://epheria.github.io/en/posts/FlowFieldPathfinding.en), [Game AI Pro, chap. 23 (Emerson)](https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf).
- Fast marching : O(M log M), M = nombre de cases ([Sethian/PNAS](https://pnas.org/doi/10.1073/pnas.090060097)). Temps rapportés sur grille 2D de plusieurs étages : **aucune mesure trouvée**. Estimation : 3 étages de 200×200 cases = 120 000 cases, soit quelques ms à 30 ms en WebAssembly ; à confirmer par un test de 30 minutes.
- Accélérations si besoin : version GPU de l'équation eikonale annoncée 30 à 300 fois plus rapide que Dijkstra CPU ([dépôt, auto-déclaré, sans étoile fiable](https://github.com/Agnuxo1/Optical-Neuromorphic-Computing-for-Real-Time-Pathfinding-A-GPU-Accelerated-Eikonal-Solver)) `[?]` ; solveur CUDA (non navigateur) [fastsweep](https://github.com/rgl-epfl/fastsweep).
- Pour un recalcul « partiel » : on ne recalcule que depuis l'issue fermée jusqu'aux cases dont la meilleure sortie change `[?]` (non trouvé tel quel ; classique en jeu, voir le [flow field Rust/WASM interactif de F. Kunc](https://filipkunc.com/posts/rts-flow-fields)).
- Navmesh importé d'une géométrie 3D : [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js) (port WebAssembly de Recast/Detour, intégration three.js via `@recast-navigation/three`, génération depuis un GLTF glissé dans un [site de génération](https://navmesh.isaacmason.com/)). Alternative 100 % JavaScript, même algorithmes : [navcat](https://github.com/isaac-mason/navcat). Obstacles temporaires (porte qui se ferme) : [TileCache](https://mintlify.wiki/recastnavigation/recastnavigation/guides/tile-cache-dynamic-obstacles) ne reconstruit que 1 à 4 tuiles (doc tierce).
- **Piège central** : le module de foule de Detour (`dtCrowd`) est décrit « adapté à 20 à 30 agents ; au-delà, l'évitement dépasse 0,5 ms par image » ([doc tierce](https://mintlify.wiki/recastnavigation/recastnavigation/guides/crowd-simulation)) ; un forum Unreal cite une limite codée en dur à 50 agents ([2014](https://forums.unrealengine.com/t/ucrowdfollowingcomponent-51st-bot-does-not-move/294053)). Le README de recast-navigation-js ne donne aucun chiffre ([exemple : maxAgents = 10](https://github.com/isaac-mason/recast-navigation-js)). Donc : navmesh oui pour **construire la carte de marche** ; DetourCrowd non pour 10 000 personnes `[?]` (à mesurer).
- Conclusion étage 1 : le navmesh sert à **extraire la zone marchable** ; la navigation de masse se fait sur une **grille par étage** avec carte de pentes, reliée par des « liens » aux escaliers (§4).

## 2. Étage 2, évitement entre personnes

Vocabulaire : **ORCA/RVO2** = chaque agent choisit la vitesse qui n'entraîne aucune collision à court terme, en partageant l'effort avec l'autre ; **PBD** (Position-Based Dynamics) = les agents sont des billes déplacées directement de position et repoussées si elles se chevauchent, comme en physique de jeu ; **WebGPU compute** = calculs en parallèle sur la carte graphique depuis le navigateur ; **Continuum Crowds** = la foule traitée comme un fluide guidé par un champ de potentiel.

| Option | Nombre d'agents rapporté | Source | Contact/pression |
|---|---|---|---|
| ORCA en WebAssembly (RVO2) | 3 200 agents en démo 2D, fluidité « bien meilleure » ; pas de fps chiffré | [forum Babylon.js, janv. 2026](https://forum.babylonjs.com/t/improved-rvo2-wasm-port-performance-3200-agents-demo/62025) | non |
| ORCA sur GPU | jusqu'à 30× un CPU multi-cœur | [arXiv 1908.10107](https://ar5iv.labs.arxiv.org/html/1908.10107) | non |
| PBD (Weiss 2017) | « centaines de milliers » d'agents interactifs (CUDA) | [arXiv 1802.02673](https://arxiv.org/abs/1802.02673) | oui : contact et friction type granulaire |
| PBD en WebGPU | pas de fps chiffré trouvé `[?]` | [wayne-wu](https://github.com/wayne-wu/webgpu-crowd-simulation) | oui, hérité |
| Continuum Crowds (Treuille 2006) | « milliers d'individus », interactif | [PDF](https://grail.cs.washington.edu/projects/crowd-flows/continuum-crowds.pdf) ; version GPU : [Shopf/AMD 2009](https://chrisoat.com/papers/Shopf-Oat-Barczak-GPUCrowdSimulation_SLIDES.pdf) | non ; « pour des groupes à but commun » |
| Social force GPU | accélérations de dizaines de fois (OpenCL) | [arXiv 1803.04782](https://arxiv.org/abs/1803.04782) | oui |
| JuPedSim (C++/Python, modèle CFSM) | « ~10 000 agents en temps réel » : source faible, `[?]` à mesurer | [comparatif](https://inferensys.com/differences/world-model-and-simulation-platforms-for-agent-risk-testing/human-behavior-simulators/vadere-vs-jupedsim-open-source-pedestrian-dynamics) | non |
| Boids WebGPU (référence de vitesse, pas des piétons) | 10 000+ à 60 i/s | [Svelte](https://sveltethemes.dev/LowWeiLin/Boids), [Babylon, grille spatiale](https://github.com/jtsorlinis/BoidsWebGPU) | non |

Lecture : 60 images/s avec 3 000 à 5 000 agents « physiques » sur CPU WebAssembly est plausible (estimation) ; 10 000 et plus passe par GPU ou par réduction (ne simuler finement que l'étage visible, les autres en mode simple).

## 3. Étage 3, comparer des plans plus vite que le temps réel

Vocabulaire : **Web Worker** = tâche JavaScript qui tourne sur un autre cœur du processeur sans bloquer l'écran ; **macroscopique** = on calcule des flux (personnes par seconde par porte), pas des individus.

- Pré-tri macroscopique (millisecondes) : pour chaque plan, temps d'évacuation ≥ max(distance/vitesse, foule ÷ (débit × largeur des portes)), avec le débit de 1,2 à 1,8 pers./(m·s) du rapport 1 ; sert de borne basse et élimine les mauvais plans. Appui : [couplage macro-micro, TUM](https://mediatum.ub.tum.de/download/1160223/1160223.pdf) (les modèles macro donnent des bornes basses d'évacuation, [source](https://doi.org/10.1080/10286608.2015.1022729)).
- Micro « sans dessin » en parallèle : même code que l'affichage, sans rendu, un scénario par Web Worker. Un portable moderne a 8 à 12 cœurs `[?]` : 8 plans simultanés plausibles ; la durée dépend de la vitesse de la simulation, **non mesurée**. Test de 30 min à faire : nombre d'agent-secondes simulées par seconde réelle sur son propre portable.
- Plusieurs répétitions par plan (hasard) : 30 à 50 pour une moyenne (rapport 1, `[?]`) ; c'est ce qui limite la vitesse, donc ne les lancer que sur les 2 ou 3 meilleurs plans du pré-tri.
- Serveur : Python/NumPy ou JAX (`vmap` lance des milliers de simulations identiques en lot, [article](https://robocloudhub.tech/learn/blog/jax-stack-robotics)) ; outils JuPedSim : [jupedsim-scenarios](https://github.com/PedestrianDynamics/jupedsim-scenarios) lance des balayages avec graines et travailleurs parallèles. Écrire un modèle d'évitement en JAX = travail neuf, aucun dépôt trouvé pour la foule `[?]`.
- Modèle appris (surrogate) : 7,2 ms sur GPU rapporté pour une carte de densité ([rapport 1, §6](etat-art-1-dynamique-foule.md)), mais immature : à citer comme piste, pas à bâtir aujourd'hui.

## 4. Plusieurs niveaux : escaliers, escalators

- Detour/Recast : les étages superposés se maillent séparément ; si l'escalier ne se mesh pas (pente, marche max, rayon d'agent), le bâtiment devient des « îles » déconnectées, cas vécu sur 3 étages ([devlog](https://secondchancegame.com/devlog/2026-08-26-pub-filled-up-nobody-walked-in)). Remède standard : **liens hors maillage** (off-mesh connections) = lien à deux points, polygone spécial ([doc dtNavMesh](https://mintlify.wiki/recastnavigation/recastnavigation/api/detour/navmesh), [Unity](https://docs.unity3d.com/450/Documentation/Manual/OffMeshLinks.html)). Escalator = lien à sens unique avec vitesse imposée.
- Réserve `[?]` : l'évitement de DetourCrowd compare surtout les positions au sol ; deux étages superposés peuvent se « voir » (à vérifier avant d'utiliser).
- Pour notre cas : une grille et une instance d'évitement **par étage**, reliées par un graphe de liens (escalier, escalator, ascenseur) avec capacité et vitesse propres. Une file se forme au pied de l'escalier parce que le lien a un débit limité.
- Un seul outil commercial documenté pour le multi-étage : [SimCrowds 2025](https://ucrowds.com/blog/2024-07-30-simcrowds-2025-a-user-friendly-realistic-and-high-performance-crowd-simulation-tool) (fermé). Même éditeur annonce 150 000 piétons dans un navigateur (2022, annonce commerciale, non vérifiable : [page](https://ucrowds.com/blog/2022-12-26-real-time-crowd-simulation-of-150000-pedestrians-in-a-browser)).

## 5. Code prêt (12 pistes)

| # | Dépôt | Licence · étoiles | Ce qu'il montre | À modifier |
|---|---|---|---|---|
| 1 | [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js) | MIT · 433 · maj juil. 2026 | navmesh WASM, crowd, obstacles, three.js | ne pas utiliser son crowd pour 10 000 |
| 2 | [navcat](https://github.com/isaac-mason/navcat) | MIT · 296 · sept. 2026 | navmesh en JS pur, JSON, multi-tuiles | pas de module foule intégré `[?]` |
| 3 | [recastnavigation](https://github.com/recastnavigation/recastnavigation) | Zlib · 7 977 | référence C++ (dtCrowd, TileCache, off-mesh) | lecture/compilation WASM |
| 4 | [RVO2 (snape)](https://github.com/snape/RVO2) | Apache-2.0 · 980 · actif | ORCA de référence C++ | porter en WASM ; le port de la démo 3 200 n'a pas de dépôt public vérifié |
| 5 | [rvo2-js](https://github.com/palmerabollo/rvo2-js) | aucune licence · 40 · 2018 | ORCA en JS, démo en ligne | ancien, « alpha » ; seulement comme exemple |
| 6 | [webgpu-crowd-simulation](https://github.com/wayne-wu/webgpu-crowd-simulation) | BSD-3 · 68 · mars 2026 | PBD sur GPU, grille de hachage, projet étudiant | exige WebGPU ; ajouter murs, sorties, champ de pentes |
| 7 | [BoidsWebGPU](https://github.com/jtsorlinis/BoidsWebGPU) | MIT · 44 | grille spatiale en compute, millions de boids | remplacer la règle par évitement piéton |
| 8 | [yuka](https://github.com/Mugen87/yuka) | MIT · 1 444 · actif | navmesh, steering, three.js | pas de foule dense |
| 9 | [three-pathfinding](https://github.com/donmccurdy/three-pathfinding) | MIT · 1 376 | chemin A* sur navmesh three.js, multi-zones | un chemin par agent : trop lent à 10 000 |
| 10 | [JuPedSim](https://github.com/PedestrianDynamics/jupedsim) | licence non lue (GitHub : « autre ») · 97 · actif | CFSM/GCFM, géométries, sorties, balayages | serveur de référence ; vitesse non mesurée |
| 11 | [CrowdEgress](https://github.com/godisreal/CrowdEgress) | Apache-2.0 · 11 | social force + champ d'issue façon FDS+Evac, Python | prototype lent, utile pour les idées |
| 12 | [Flow field Rust/WASM (Kunc)](https://filipkunc.com/posts/rts-flow-fields) | licence `[?]` | flow field en direct dans la page, WebGL2 instancié | lire le principe, réécrire |

Données/analyse : [archive Jülich](http://ped.fz-juelich.de/db) (DOI 10.34735/ped.da), [PedPy](https://pedpy.readthedocs.io) (analyse commune expérience et simulation), [jupedsim-scenarios](https://scenarios.jupedsim.org/cookbook.html).

## 6. Réalisme : comment chaque option reproduit les comportements réels

Règle d'or (Sargent, cité par [JuPedSim](https://pedestriandynamics.org/notes/dakota-calibration)) : un modèle n'est valide que pour un usage précis. Presque aucun comportement ci-dessous n'est fourni par un moteur : on l'ajoute par une **couche de comportement** au-dessus de n'importe quelle option des §1 à 3.

| Comportement | Ce que la science dit | Comment on le met (valable pour toutes les options) | Option qui aide |
|---|---|---|---|
| Groupes, familles | jusqu'à 70 % des gens marchent en groupe ; ils ralentissent et s'alignent ([Moussaïd 2010](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0010047)) | lien d'attache entre 2 à 5 agents, vitesse du groupe = la plus lente, force de rappel | PBD : contraintes de cohésion natives ([Weiss](https://arxiv.org/abs/1802.02673)) ; ORCA : à coder |
| Ressortir par son entrée | « movement to the familiar » : on préfère l'issue connue ([Sime 1983 cité ici](https://sciencedirect.com/science/article/abs/pii/S0925753516306038)) | chaque agent a une connaissance des issues ; coût d'issue = distance − bonus de familiarité (choix probabiliste type logit) | carte de pentes **par agent-type** (une carte par sortie, mélange pondéré) |
| Suivisme | influence de la taille et de la proportion des gens qui se dirigent vers une issue ([PMC8319842](https://pmc.ncbi.nlm.nih.gov/articles/PMC8319842), [herding](https://sciencedirect.com/science/article/pii/S0925753515002763)) | probabilité de changer d'issue augmentée par la part des voisins qui vont vers elle | toute option (voisins déjà calculés par la grille) |
| Hésitation devant une issue fermée | cas peu documenté en données ouvertes `[?]` ; choix de sortie en exercice réel : [497 choix, bibliothèque](https://mro.massey.ac.nz/bitstreams/33315a49-02d6-4060-b007-e553516194ee/download) | délai de réaction tiré au hasard ; l'agent ne « sait » que la porte est fermée qu'en la voyant ou en voyant ses voisins faire demi-tour ; puis re-choix | demande une **carte de pentes par agent** (connaissance différente) ou deux cartes (avant/après) |
| Poussées, densités dangereuses | la panique n'explique pas les drames ; ce sont des instabilités mécaniques de foule ([Chatagnon, PLOS Complex Systems, via article presse](https://scienmag.com/when-particles-get-legs-balance-recovery-may-drive-the-hidden-waves-of-ultra-dense-crowds)) ; Mina : [arXiv physics/0701203](https://arxiv.org/pdf/physics/0701203) ; Love Parade : [analyse vidéo](https://sciencedirect.com/science/article/pii/S1077314211002037) | ne pas prédire des blessés : afficher la **densité locale** (cartes de Voronoï ou noyau) et alerter au-delà d'un seuil indicatif | PBD (contact), social force ; **pas** ORCA ni DetourCrowd (pas de contact) |
| Escalators, escaliers | vitesse sur escalier selon le sens et la densité : [Eindhoven, an de données](https://research.tue.nl/en/publications/high-statistics-pedestrian-dynamics-on-stairways-and-their-probab-2), [diagramme montée/descente](https://iopscience.iop.org/article/10.1088/1742-5468/aa79ad) ; escalator : 74,9 % restent debout à Londres ([2013, via Wikipédia](https://en.wikipedia.org/wiki/Escalator_etiquette)), capacité réelle < théorique ([Springer 2021](https://link.springer.com/article/10.1007/s11116-020-10160-6)) | lien à débit limité, vitesse = f(densité) ; 25 % marchent sur l'escalator | liens hors maillage (§4) |
| Mobilité réduite | données NIST sur 14 bâtiments, aidés/non aidés ([NIST](https://nist.gov/publications/stair-evacuation-people-mobility-impairments)) ; peu de données de portes `[?]` | part de la population à vitesse réduite et rayon plus grand (fauteuil), étiquette sur la carte | toutes (vitesse et rayon par agent) ; CFSM/social force le gèrent bien |

## 7. Réalisme vérifiable en démo : les preuves chiffrées à montrer

À montrer au jury, chacune avec une courbe « simulation contre mesure » et la donnée ouverte :
1. **Diagramme densité-débit** (vitesse en fonction de la densité) sur un couloir : superposer la simulation à la courbe de Weidmann et aux expériences ; données : [archive Jülich](http://ped.fz-juelich.de/db), [revue de Seyfried](https://www.ipam.ucla.edu/abstract/?tid=13181). Chiffre à citer : débit max 1,2 à 1,8 pers./(m·s) (rapport 1).
2. **Débit à un goulot selon la largeur** : expérience Hermes, [Seyfried et al.](https://arxiv.org/pdf/0810.1945). Méthode honnête déjà publiée : tolérance fixée avant, 6 % sur le débit, 10 % sur densité et vitesse, largeurs mises de côté pour tester ([note JuPedSim](https://pedestriandynamics.org/notes/dakota-calibration)). Leur résultat : les réglages par défaut ratent le débit d'un **facteur 2** ; après calage, écart ≤ 10 % presque partout, mais pas à 3,0 m (excès) ni à 5,0 m (déficit). Le même modèle **échoue** sur une porte de 0,5 m et une entrée sans guidage (partie 2 de la note) : à annoncer comme limite.
3. **Tests RiMEA** (cas d'école de validation allemande des évacuations) : un tableau vert/rouge ; [guide](https://imorules.com/GUID-9EC122B0-DBCC-405B-8650-82D745790F54.html), [exemple de rapport](https://traffgo-ht.com/en/pedestrians/validation/rimea), [mise à jour 2025](https://rimea.de/wp-content/uploads/2025/10/2025-10-15-rimea-workshop-vortrag-hoersaalbeispiel.pdf). Jeu : 1 personne dans un couloir garde sa vitesse, etc.
4. **Groupes** : part de personnes en groupe et vitesse réduite à comparer à Moussaïd 2010 (jeu de données de l'article, pas téléchargé ici `[?]`).
5. **Escaliers** : vitesse montée/descente à une densité donnée contre [Eindhoven](https://research.tue.nl/en/publications/high-statistics-pedestrian-dynamics-on-stairways-and-their-probab-2) et [NIST](https://nist.gov/publications/stair-evacuation-people-mobility-impairments).
6. **Exercices réels** : temps de départ et choix de sortie contre [Roxborough](https://ncbi.nlm.nih.gov/pmc/articles/PMC9977886) (jeu publié, quartier, pas bâtiment) et les exercices de bibliothèque ([497 choix](https://mro.massey.ac.nz/bitstreams/33315a49-02d6-4060-b007-e553516194ee/download)) ; temps de réaction : [exercices d'hôpital](https://sciencedirect.com/science/article/pii/S092575352030151X).
7. **Vidéos de catastrophes** : Mina, Love Parade servent à montrer qu'on **détecte la montée de densité**, pas qu'on la reproduit : Jülich a un [jeu pour gestion de foule (CroMa, ~1 000 participants)](https://juser.fz-juelich.de/record/1007469).
Garde-fou : une seule courbe qui colle ne valide rien (la littérature le dit : bon débit, mauvaise densité, [même note](https://pedestriandynamics.org/notes/dakota-calibration)). Montrer **trois grandeurs** (débit, densité, vitesse) sur au moins un cas non utilisé pour le calage.
Non trouvé : une mesure ouverte de l'évacuation du 19 oct. 2026 au Forum des Halles `[?]` ; on ne peut donc pas dire « validé sur les Halles », seulement « calé sur des mesures publiées ».

## 8. Verdict : architecture en 3 étages, options classées

Je ne choisis pas pour l'équipe ; classement par sécurité de mise en œuvre aujourd'hui.

**Étage 1, navigation**
1. Grille par étage + Dijkstra/fast marching en WebAssembly (ou TypeScript) + liens d'escaliers/escalators ; navmesh (recast-navigation-js ou navcat) seulement pour extraire la zone marchable. Navigateur. Fermer une issue = relancer le calcul (estimation : 5 à 30 ms, à mesurer).
2. Navmesh seul avec chemin par agent (three-pathfinding, Detour) : simple à poser, trop lent au recalcul de masse.
3. Continuum Crowds : élégant (le flux se réorganise comme un fluide) mais plus lourd à coder, conçu pour groupes à but commun.

**Étage 2, évitement**
1. Modèle à vitesse type CFSM codé maison en TypeScript/Rust-WASM avec grille spatiale (c'est le modèle de JuPedSim, le seul avec une calibration publiée contre Hermes) : réalisme le mieux documenté, 2 000 à 5 000 agents en CPU (estimation).
2. ORCA en WASM (RVO2, 3 200 agents démontrés) : rapide et fluide, mais sans contact ni poussée.
3. PBD en WebGPU (wayne-wu, Weiss) : contact et grande échelle, mais WebGPU requis, projet étudiant, calibration publiée absente `[?]`.
4. DetourCrowd : à écarter pour la foule dense (§1).

**Étage 3, comparaison**
1. Pré-tri macroscopique (ms) puis micro headless en Web Workers sur les 2 à 3 meilleurs plans, avec 30 à 50 graines si le temps le permet.
2. Serveur JuPedSim (Python) comme **arbitre** indépendant : deux modèles qui donnent le même classement valent mieux qu'un seul (rapport 1).
3. JAX/NumPy vectorisé : plus rapide en théorie, mais tout est à écrire.

**Navigateur vs serveur** : navigateur = étages 1 et 2 + rendu + pré-tri ; Workers du navigateur = comparaison rapide ; serveur = JuPedSim pour l'arbitrage et les cas lourds (10 000 sans GPU).
**Nombre d'agents réaliste** (estimations) : 1 000 fluide partout ; 3 000 à 5 000 en micro CPU 60 i/s ; 10 000 en micro seulement avec GPU, ou en mode « un étage détaillé, les autres simplifiés ».

**Principal risque** : aucune des vitesses annoncées n'est mesurée sur notre cas (3 étages, 10 000 agents, escaliers à débit limité, couche de comportement) ; si la boucle micro dépasse 16 ms par image à 5 000 agents, la promesse « moins d'une seconde partout » ne tient qu'avec la carte de pentes (qui, elle, est sûre). Deuxième risque : le réalisme demandé (groupes, hésitation, poussées) n'existe pas en bibliothèque ; chaque comportement est du code neuf à caler.
Test de 30 minutes qui lève le doute (sans appel à un LLM) : un script qui mesure (a) ms pour recalculer la carte sur 3×200×200 cases, (b) ms par pas à 1 000, 3 000, 5 000, 10 000 agents, (c) simulations par seconde en Workers.

## Questions (regroupées, défaut si pas de réponse)
1. Priorité de la démo : A) fermeture d'issue instantanée sur 10 000 points rendus, B) classement de 5 plans en quelques secondes, C) preuve de réalisme chiffrée ? Défaut : A+B, C sur un cas.
2. Puis-je lancer le test de 30 minutes de vitesse (gratuit, en local) ? Défaut : oui.
3. WebGPU acceptable pour le poste de démo (A oui, B non) ? Défaut : B, CPU d'abord.
Option écartée en dernier : PBD en WebGPU, la plus forte en échelle et en contact, trop incertaine sur la calibration et la compatibilité du poste de démo.
