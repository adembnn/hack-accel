# Visuels 2 : Unity, Blender, Houdini, Omniverse et autres pistes

Décision débloquée : quel outil 3D (hors Unreal) donne le rendu le plus fort pour la démo d'évacuation, et sous quelle forme (en direct ou vidéo pré-calculée). Je ne tranche pas pour l'équipe.
Légende : `[?]` = non vérifié ou source faible. Les heures de travail sont mes estimations, pas des mesures.

## 1. Version simple et imagée

Pensez à un film d'animation contre un jeu vidéo.
- **Jeu vidéo (en direct)** : Unity. Tout est calculé à l'écran à chaque image. On peut cliquer, changer de plan, mais la belle image coûte cher et la machine peut craquer pendant le pitch.
- **Film d'animation (pré-calculé)** : Blender. On prépare tout avant, puis on « imprime » les images une par une. Le rendu peut être superbe, sans risque de ralentissement, mais on ne peut plus rien changer en direct.
- **Les poids lourds** : Houdini (effets spéciaux de cinéma, très puissant, difficile à apprendre en 7 h) et Omniverse (NVIDIA, exige une carte graphique NVIDIA, donc pas de Mac).
- **Le piège** : le Forum des Halles est surtout souterrain. Les données ouvertes (cartes) donnent bien les immeubles de la rue, mal les salles intérieures. Le plus beau rendu possible sera probablement une « maquette » stylisée (argile ou carton) plutôt qu'un copié-collé réaliste. `[?]` inférence de ma part, à vérifier sur OpenStreetMap pour le site.

Cela dit, un détail change la donne : la simulation de foule (qui calcule où va chaque personne) peut être faite en Python et exportée en simple fichier de positions. Les outils 3D ne servent alors qu'à **afficher**. C'est ce qui rend Blender très fort ici : un script Python (donc un agent) peut tout piloter sans interface.

## 2. Unity (moteur de jeu, gratuit sous 200 k$ de revenus)

- **Foules** : DOTS/ECS = une façon d'organiser les données pour que le processeur traite des dizaines de milliers de personnages en parallèle. Un prototype d'évacuation annonce 50 000 agents à 60 images/s, mais c'est un texte marketing d'agence `[?]` : [Rush Hour](https://musketeerstech.com/for-ai/rush-hour-crowd-simulation). Un autre cas, 50 000 objets à 83 images/s (jeu, pas foule) : [dots-swarm-survivor](https://github.com/jarnik/dots-swarm-survivor). Un plugin payant de piétons annonce 100 000+ : [Reddit Traffic Engine](https://reddit.com/r/Unity3D/comments/1mys2oq/100k_pedestrian_crowd_simulation_in_unity_dots).
- **Monde réel** : Cesium for Unity charge des villes en 3D depuis Internet, y compris les « Photorealistic 3D Tiles » de Google : [guide Cesium](https://cesium.com/learn/unity/unity-photorealistic-3d-tiles), [exemples](https://github.com/CesiumGS/cesium-unity-samples).
- **Navigateur** : Cesium for Unity annonce WebGL et WebGPU, Unity 6 minimum, avec l'option multithread obligatoire : [doc Cesium](https://cesium.com/learn/cesium-unity/ref-doc/supported-platforms.html). Mais des utilisateurs ont dû bricoler (en-têtes serveur COOP/COEP, assets cassés) : [forum Cesium](https://community.cesium.com/t/enabling-unity-webgl/44554). WebGPU est sorti de l'état expérimental dans Unity 6.6 (1er sept. 2026), mais reste désactivé par défaut et exige HTTPS : [article Cinevva](https://app.cinevva.com/news/2026-09-01-unity-6-6-webgpu-production). Le doc officiel 6.6 dit encore « experimental » à un endroit : sources contradictoires `[?]`. Safari iOS plafonne la mémoire d'une page web à environ 300-500 Mo : [Bugnet](https://bugnet.io/blog/how-to-fix-unity-webgl-build-crashing-on-safari-ios) `[?]`.
- **Trajectoires externes** : lire un fichier JSON/CSV de positions et déplacer des personnages est un exercice classique en C#. Je n'ai pas de source dédiée `[?]`.
- **Apprentissage** : pour un non-développeur, Unity + DOTS + Cesium en 7 h est la pente la plus raide de ce rapport (estimation). Un agent peut écrire le C#, mais déboguer un build web sans connaître l'éditeur est risqué.
- **Avantage** : un seul outil donne l'interaction en direct (choisir le plan A/B/C). **Hébergement** : un build WebGL se sert comme un site statique, donc conteneur nginx sur Aiven Runtime ([doc Runtime](https://aiven.io/docs/products/runtime/deploy-apps)), avec les bons en-têtes.

## 3. Blender (gratuit, pilotable par script)

- **Bâtiments réels** :
  - Blosm / blender-osm importe les bâtiments d'OpenStreetMap avec hauteurs, et les « villes 3D de Google » : [wiki Blosm](https://github.com/vvoovv/blosm/wiki/Documentation). L'import Google demande une clé avec carte bancaire.
  - **Attention** : la politique de Google interdit de précharger, stocker ou mettre en cache ces tuiles hors cas limités : [Map Tiles API Policies](https://developers.google.com/maps/documentation/tile/policies). Importer Paris dans Blender pour un rendu vidéo est donc zone grise `[?]`. À éviter ou à faire valider.
  - Option propre : BD TOPO de l'IGN (bâtiments vectoriels avec hauteur, [data.gouv.fr](https://data.gouv.fr/datasets/bd-topo-r)), licence ouverte Etalab pour le LiDAR HD ([Topolia](https://topolia.fr/articles/lidar-hd-ign)). Je n'ai pas vérifié la licence exacte de la BD TOPO `[?]`.
- **Foule depuis un CSV** : depuis Blender 4.5, le nœud « Import CSV » lit un fichier et crée un nuage de points avec une colonne par attribut : [manuel](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/import/csv.html). Une ligne = un point, donc il faut un fichier par image ou un script qui pose des clés d'animation `[?]` : [exemple StackExchange](https://blender.stackexchange.com/questions/122891/animate-an-object-by-moving-it-according-to-a-list-of-coordinates/228201). Pour des silhouettes qui marchent : l'extension Procedural Crowds (18 à 45 $, [site](https://proceduralcrowds.com)), ou de simples capsules/cônes colorés, très lisibles dans un style maquette.
- **Pilotage par agent** : `blender --background scene.blend --python script.py` = rendu sans interface ([exemples](https://github.com/TMHSDigital/Blender-Developer-Tools/blob/main/skills/headless-batch-scripting/SKILL.md)). Il existe aussi des connecteurs MCP pour que Claude pilote Blender ouvert : [blender-mcp](https://github.com/owenpkent/blendmcp). Les deux demandent installation (hors périmètre de cette recherche).
- **Vitesse de rendu** : Eevee (rapide, approximatif) contre Cycles (physiquement exact, lent). Une séquence de 20 s à 24 i/s = 480 images. Estimations `[?]` : Eevee 1 à 5 s/image soit 8 à 40 min ; Cycles sur GPU Apple, une image 1080p à 128 échantillons : 6 à 10 s sur un service de rendu GPU ([Janction](https://render.janction.jp/blender-slow-on-macbook)), donc 1 à 2 h par plan sur un Mac probablement plus lent. Un tableau en ligne annonce des heures pour 30 s en Cycles : [source faible](https://convertintomp4.com/blog/blender-cycles-eevee-export-comparison). Blender utilise le GPU des Mac via Metal : [Blender](https://code.blender.org/2023/01/introducing-the-blender-metal-viewport). À multiplier par 3 plans.
- **Style maquette** : blanc cassé uni, ombres douces, éclairage de studio, personnages en couleur selon le plan. C'est faisable en Eevee sans textures. Aucune source nécessaire, c'est du choix artistique.
- **Apprentissage** : modéré si l'agent écrit les scripts ; la partie difficile est le cadrage caméra, que l'équipe peut juger à l'œil.

## 4. Houdini (SideFX, standard du cinéma pour les foules)

- **Foules** : outils « Crowds » intégrés, des agents (personnages avec animations) pilotés par des règles : [tutoriel Creative Bloq](https://creativebloq.com/3d/build-a-sell-out-stadium-crowd). On peut aussi y importer des points existants comme positions de départ.
- **Licence** : Apprentice gratuit, non commercial, rendus filigranés ; Indie environ 269 à 299 $/an. Sources divergentes sur la limite d'Apprentice (720p ou 1080p) : [SideFX Compare](https://sidefx.com/products/compare), [Artivoxa](https://artivoxa.com/houdini-apprentice-vs-indie-vs-core-which-license-do-you-need) `[?]`. Un hackathon n'est pas du commercial, mais le filigrane ruine un pitch.
- **Mac** : Apple Silicon supporté, mais Karma XPU (rendu GPU) ne tourne que sur CPU et cartes NVIDIA : [prérequis](https://sidefx.com/Support/system-requirements/20.5).
- **Réalisme en 7 h** : plafond le plus haut, plancher le plus bas. Pour un débutant, je juge qu'on n'obtiendrait pas mieux que Blender en 7 h (estimation). Utile seulement si quelqu'un l'a déjà pratiqué.

## 5. NVIDIA Omniverse / Isaac Sim / Cosmos

- **Matériel** : Isaac Sim exige une carte NVIDIA RTX (12 Go de mémoire vidéo minimum), sous Windows ou Linux. Pas de macOS : [prérequis NVIDIA](https://docs.isaacsim.omniverse.nvidia.com/latest/installation/requirements.html), [Strands](https://strands-labs.github.io/robots-sim/getting-started/installation).
- **Foule** : l'extension `omni.anim.people` anime des piétons (aller à, faire la queue, s'asseoir) pour entrepôts et commerces. C'est taillé pour tester des robots, pas pour des milliers de spectateurs `[?]` : [doc](https://docs.isaacsim.omniverse.nvidia.com/4.2.0/features/warehouse_logistics/ext_omni_anim_people.html).
- **Jumeau numérique de ville** : NVIDIA a publié un « blueprint » pour villes intelligentes (juin 2025) et des pilotes européens (oct. 2026) : [blog 2025](https://blogs.nvidia.com/blog/smart-city-ai-blueprint-europe), [blog 2026](https://blogs.nvidia.com/blog/european-cities-agents-urban-operations). Argument de pitch crédible, pas un outil prêt à l'emploi.
- **Cosmos** : modèles vidéo ouverts de NVIDIA, dont Transfer, qui habille une vidéo de simulation : [fiche](https://huggingface.co/nvidia/Cosmos-Transfer2.5-2B/blob/main/README.md?code=true). Il faut un GPU NVIDIA, donc un serveur loué `[?]`. Hors de portée en 7 h.
- **Verdict** : écarter, sauf si un coéquipier a un PC NVIDIA puissant ET a déjà utilisé Omniverse.

## 6. Autres pistes

| Piste | Ce que c'est | Ce que j'ai trouvé |
|---|---|---|
| Gaussian splatting | Reconstruction photoréaliste d'un lieu à partir de photos ou vidéo, affichée en nuage de points flous | Visionneuses web prêtes (PlayCanvas SuperSplat, 1 à 4 millions de points fluides sur PC récent : [Swyvl](https://swyvl.io/tools/gaussian-splat-viewer)). Un splat de l'Arc de Triomphe existe : [Reddit](https://www.reddit.com/r/GaussianSplatting/comments/1l1kvfg/arc_de_triomphe_paris_3dgs_with_postshot/). Aucun splat publié des Halles trouvé `[?]`. Filmer soi-même le Forum prendrait plus de 7 h avec l'entraînement. Les foules ne s'y mêlent pas facilement `[?]` |
| Godot | Moteur de jeu libre et léger | Export web en WebGL2 : [doc](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html). Démo de 500 agents seulement : [benchmark](https://github.com/Vav-Labs/godot-crowd-pathfinding-benchmark). Rendu moins spectaculaire que Unity, peu de ressources de villes réelles. Écarté |
| TouchDesigner | Outil de visuels en direct pour installations d'art | 5 000 agents en instances à 60 i/s : [leçon](https://pixels2genai.art/lessons/10.2.2). Très beau en abstrait (points lumineux, flux), mal adapté à un bâtiment fidèle. Licence gratuite non commerciale `[?]` |
| Spline | Outil 3D web | Non recherché, faute de temps ; probablement trop léger pour une foule `[?]` |
| Vidéo IA | Restyler un clip avec Runway Aleph (clips de 1 à 30 s, vidéo en entrée obligatoire) | [Aleph 2](https://openclips.ai/models/runway-aleph-2). Pratique pour habiller un rendu Blender brut en rendu « photo ». **Coût en crédits, appel payant** : à valider par Adem avant tout test. Risque : la foule change d'une image à l'autre (scintillement), ce qui trahit les chiffres de la simulation `[?]` |

## 7. Références publiques

| # | Exemple | Ce qui impressionne |
|---|---|---|
| 1 | [Rush Hour, Unity DOTS](https://musketeerstech.com/for-ai/rush-hour-crowd-simulation) | Même sujet que nous : 50 000 agents, stades, gares, plans d'évacuation. Texte d'agence, pas de preuve vidéo vue `[?]` |
| 2 | [Piétons 100 000+, Unity](https://reddit.com/r/Unity3D/comments/1mys2oq/100k_pedestrian_crowd_simulation_in_unity_dots) | L'échelle : 100 000 piétons qui suivent des couloirs |
| 3 | [Crowd-Evacuation-Simulation, Unity](https://github.com/JR-Morgan/Crowd-Evacuation-Simulation) | Carte de chaleur de densité et temps d'évacuation à la fin : exactement notre « comparer les plans » |
| 4 | [Cesium for Unity, villes Google](https://github.com/CesiumGS/cesium-unity-samples) | Une vraie ville photoréaliste en quelques clics (New York, Melbourne en photogrammétrie) |
| 5 | [Foule en boucle sous Blender](https://80.lv/articles/artist-presents-a-looping-procedural-crowd-simulation-with-collision-avoidance) | Foule qui s'évite, générée par nœuds, dans une ville procédurale |
| 6 | [Procedural Crowds, Blender](https://cgdive.com/crowd-simulation-with-procedural-crowds) | Foules animées dans Blender sans écrire de code |
| 7 | [Foule de stade, Houdini](https://creativebloq.com/3d/build-a-sell-out-stadium-crowd) | Des milliers de spectateurs animés avec états et déclencheurs |
| 8 | [Crowd Sim, Houdini vers UE5](https://kaleycho.com/work/crowd-sim-remaster) | 6 000+ spectateurs animés en direct, points générés dans Houdini (cas Unreal, pour l'autre agent) |
| 9 | [Arc de Triomphe en splat](https://www.reddit.com/r/GaussianSplatting/comments/1l1kvfg/arc_de_triomphe_paris_3dgs_with_postshot/) | Un monument parisien reconstruit à partir de photos |
| 10 | [Blueprint ville intelligente, Omniverse](https://blogs.nvidia.com/blog/smart-city-ai-blueprint-europe) | Le discours « jumeau numérique de ville » que le jury connaît |

Je n'ai pas visionné les vidéos : les « ce qui impressionne » viennent des descriptions des pages.

## 8. Tableau des outils

Heures = travail estimé pour un résultat montrable, agent inclus. Mac supposé Apple Silicon `[?]`.

| Outil | Rendu | Direct ou vidéo | Heures | Matériel | Risque principal |
|---|---|---|---|---|---|
| Unity + Cesium | Fort (ville réelle, foule dense) | Direct, web possible | 5 à 7 | Mac OK | Build web fragile, courbe d'apprentissage, licence Google |
| Blender | Très fort, style maquette maîtrisable | Vidéo pré-calculée | 3 à 5 | Mac OK (Metal) | Rien d'interactif ; temps de rendu ×3 plans |
| Houdini | Plafond le plus haut | Vidéo | 6 et plus | Mac OK, Karma XPU non | Apprentissage, filigrane si Apprentice |
| Omniverse / Isaac / Cosmos | Fort mais orienté robots | Direct sur PC NVIDIA | 7 et plus | GPU NVIDIA RTX obligatoire | Pas de Mac |
| Gaussian splat | Photoréaliste, statique | Direct (web) | 4 à 8 | Mac OK pour afficher | Pas de capture des Halles, foule non intégrée |
| Godot / TouchDesigner / Spline | Moyen ou abstrait | Direct | 3 à 5 | Mac OK | Rendu moins impressionnant pour ce sujet |
| Vidéo IA (en habillage) | « Photo » sur un rendu brut | Vidéo | 1 à 2 | Service payant | Scintillement, coût, accord d'Adem |

## 9. Trois combinaisons possibles (choix à l'équipe)

**A. Simulation → application web en direct + séquence Blender en ouverture.**
La simulation tourne en Python et enregistre les trajectoires dans une base Aiven ; l'application web (Three.js, déployée sur Runtime) rejoue 2 ou 3 plans côte à côte avec l'agent IA. Blender produit un plan de 20 s « maquette » pour l'ouverture du pitch.
Force : interaction réelle + beau plan de départ, répartition du travail. Faiblesse : deux chaînes à tenir.

**B. Tout dans Unity (+ Cesium ou fond OSM), exporté en web.**
Une seule application en direct, trois fenêtres de plans, foule en DOTS.
Force : le plus « produit » et le plus impressionnant s'il marche. Faiblesse : le plus grand risque technique ; prévoir une vidéo de secours enregistrée.

**C. Tout en vidéo : Blender + (option) restylage IA.**
Trois rendus synchronisés (un par plan), montés côte à côte, servis par l'application web avec boutons et données de l'agent par-dessus.
Force : le plus sûr à l'écran, rendu le plus beau pour un non-développeur. Faiblesse : « simulation rejouée » plutôt que « simulation calculée en direct » ; un jury sensible à l'interactivité peut le voir.

## 10. Ce que je n'ai pas pu établir

- Aucune preuve que Unity DOTS tourne bien en WebGL dans un cas Cesium + foule (un seul texte d'agence).
- Pas de licence confirmée pour les tuiles Google en rendu vidéo (politique d'interdiction de cache lue, pas de réponse juridique).
- Pas de test réel de temps de rendu sur le Mac d'Adem : à mesurer avec une image d'essai avant de choisir.
- Intérieur du Forum des Halles : qualité des données OSM/IGN non vérifiée.
