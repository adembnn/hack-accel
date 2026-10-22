# Outils pilotés par IA pour une scène 3D de lieu réel + foule

Décision débloquée : existe-t-il des outils qu'un agent IA pilote pour avoir en quelques minutes une scène 3D d'un lieu réel avec une foule, sans installation lourde ?
Recherche faite le 22 oct. 2026. `[?]` = non vérifié sur la source primaire. Aucun LLM payant appelé, rien installé.

## 1. Version simple

Oui, et ce qu'Adem pressent existe, mais sous une forme précise. Deux familles :

- **Piloter un logiciel 3D depuis l'extérieur** (Unreal, Blender, Unity) via un « serveur MCP » (une prise standard qui laisse Claude appuyer sur les boutons d'un logiciel). Ça marche, mais le logiciel doit être installé, et le résultat n'est pas instantané à l'affichage.
- **Faire écrire le monde en code à Claude**, directement pour le navigateur (bibliothèque three.js, qui dessine de la 3D dans une page web). Un projet l'a fait pour un vrai quartier : fable51-worlds. C'est la famille qui colle à « instantané, sans lourdeur ».

Constat clé : personne n'a publié (trouvé) un outil clé en main « lieu réel souterrain + évacuation + issue qu'on ferme ». Mais tous les morceaux existent en open source (décor réel généré par agent, foule dans le navigateur, simulateur d'évacuation multi-étages). Le trou : le sous-sol du Forum des Halles n'est pas dans les données ouvertes habituelles, il faudra le dessiner.

## 2. Unreal Engine + MCP

| Outil | Ce que ça fait | Maturité |
|---|---|---|
| MCP officiel d'Epic, intégré à Unreal 5.8 | Un plugin « Unreal MCP » : l'agent place des acteurs, règle la lumière, crée des matériaux, lance des tests. Marqué **Expérimental**, local uniquement. [vrealmatic](https://vrealmatic.com/unreal-engine/mcp) | Nouveau (été 2026) |
| ChiR24/Unreal_mcp (« EngineWire ») | Plugin C++ + serveur Node, 400+ capacités, UE 5.0 à 5.8. [GitHub](https://github.com/ChiR24/Unreal_mcp) | 945 étoiles, MIT, créé 2025-09 ; 28 releases ; date du dernier commit `[?]` |
| flopperam/unreal-engine-mcp | Construit villes, châteaux, labyrinthes ; démos vidéo « 4 000 objets depuis un prompt ». [GitHub](https://github.com/flopperam/unreal-engine-mcp), [démos](https://lobehub.com/ko/mcp/gingerol-unreal-engine-mcp) | 1 102 étoiles, mais **racheté par Aura** : le suivi passe par un produit hébergé [tryaura.dev](https://www.tryaura.dev/) |
| Sentari (dans l'éditeur) | Assistant + serveur MCP, 265 outils. [forum Epic](https://forums.unrealengine.com/t/sentari-sentari-ai-assistant-mcp-server-local-cloud-llm-blueprint-automation/2750038) | Produit tiers, 2026-08 |

Retour de terrain mitigé : « Claude est très mauvais pour faire quoi que ce soit dans l'éditeur via le MCP, il brûle des tokens » (utilisateur, [r/aigamedev](https://reddit.com/r/aigamedev/comments/1vd55gb/unreal_engine_58_mcp_connected_to_claude_code), 2026-08). Une démo positive existe sur le même fil, mais avec un circuit de course préexistant.

**Taille d'Unreal.** Le chiffre « 100 Go » est exagéré pour une installation de base, vrai pour une installation complète :
- 30 à 40 Go pour le minimum, plus de 100 Go avec tous les composants, et jusqu'à 120-130 Go libres requis pendant l'installation ([TechSpot](https://techspot.com/downloads/6697-unreal-engine.html)).
- « 40 Go et plus par version » ([free-mac.online](https://free-mac.online/blog/mac-storage-for-game-developers)).
- Mac : Sonoma 14.5 minimum pour la version actuelle (5.8), 16 Go de RAM mini, 32 Go conseillés ([techdows](https://techdows.com/download-unreal-engine-for-pc-windows-11-10-mac.html)). Pas de chiffre officiel Epic lu : `[?]`.
- Il faut en plus le Launcher, et la compilation du plugin MCP communautaire demande un projet C++ (donc Xcode) `[?]`.

**Alternatives légères.** UEFN (Unreal Editor for Fortnite) tourne sur Windows et Mac, c'est un éditeur de cartes Fortnite : [source](https://uefncentral.com/can-you-make-a-fortnite-map-on-mobile). Pas de MCP trouvé ; importer son propre simulateur de foule y passe par le langage Verse. Verdict : non adapté. Le « Unreal pour le web » direct n'existe plus, la voie web est le Pixel Streaming (Unreal tourne sur un serveur GPU, la vidéo est envoyée au navigateur) : [10n.tech](https://10n.tech/solutions/pixel-streaming). Il faut donc un serveur GPU : l'inverse de « léger ». Date d'abandon de l'export HTML5 : `[?]`.

## 3. Blender, three.js, Unity, Godot, Cesium

- **Blender** : [mcp-for-blender / ex-blender-mcp](https://github.com/ahujasid/blender-mcp), 30 541 étoiles, MIT, créé 2025-03. L'agent crée objets, matériaux, lance du Python dans Blender, récupère des modèles Poly Haven / Sketchfab, peut appeler Hunyuan3D ([description](https://whatisgithub.com/ahujasid/blender-mcp)). Temps observé : « environ 45 min à 1 h » avec un seul prompt, rendu sur processeur ([r/ClaudeAI](https://reddit.com/r/ClaudeAI/comments/1v6pvby/opus_5_is_very_good_at_blender_3d), 2026-07). Ce sont des images, pas une scène interactive : mauvais pour « fermer une issue en direct ». Blender pèse quelques centaines de Mo `[?]`.
- **three.js / navigateur** : [maige-3d-mcp](https://glama.ai/mcp/servers/m-ai-geXR/mcp-webgpu) pilote en direct une scène three.js, A-Frame, Babylon ou React Three Fiber depuis un client MCP (23 outils, avril 2026) ; maturité (étoiles) `[?]`. [threejs-devtools-mcp](https://glama.ai/mcp/servers/TerryMyers44263/threejs-devtools-mcp) : 69 outils pour inspecter et modifier une scène three.js dans le navigateur (2026-10-16, très récent). Aucune installation lourde (Node).
- **Unity** : [unity-mcp](https://andrew.ooo/posts/unity-mcp-ai-game-development-bridge), MIT, v10.2.0 (sept. 2026), « 13 800+ étoiles » selon cet article de blog `[?]` (à confirmer sur GitHub). Éditeur 5 à 15 Go par version ([free-mac.online](https://free-mac.online/blog/mac-storage-for-game-developers)). Plus léger qu'Unreal, mais encore un éditeur à installer et un export WebGL à faire.
- **Godot** : [godot-mcp](https://mcp.tc/i/godot) (Coding-Solo, npx) crée scènes et nœuds ; [YasiruRF/godot-mcp](https://glama.ai/mcp/servers/YasiruRF/godot-mcp) pilote l'éditeur en direct. Godot est léger (taille `[?]`), export web possible `[?]`. Pas de démo de foule trouvée.
- **Cesium** : [Cesium ion MCP Server](https://cesium.com/blog/2026/10/12/introducing-the-cesium-ion-mcp-server), annoncé le 12 oct. 2026, gère vos données d'un compte Cesium (chercher un jeu de données, vérifier un tuilage), ne construit pas une scène. [cesium-mcp (gaopengbin)](https://glama.ai/mcp/servers/gaopengbin/cesium-mcp?locale=zh-CN) : un agent pilote un globe 3D dans le navigateur (« vole vers la Tour Eiffel, pose un marqueur ») ; démo en ligne, il faut une clé d'API OpenAI-compatible, donc payant.
- **Tuiles 3D photoréalistes de Google** (la vue 3D de Google Maps) : intégrables en three.js ou Cesium, démo dans [three.js](https://github.com/mrdoob/three.js/commit/ff00fc2681b36349eade439f4558320fd485ab56). Attention : un guide les dit « non disponibles dans l'EEE » pour l'usage hors API native ([spatialized.io](https://spatialized.io/insights/google-maps/data-layers-and-overlays/immersive-3d-maps)). Paris est dans l'EEE : **risque à vérifier tôt** `[?]`. Et ça ne montre aucun sous-sol.

## 4. Mondes 3D générés par IA

| Outil | Délai | Réutilisable pour un lieu précis ? |
|---|---|---|
| World Labs Marble | monde ~5 min, brouillon ~20 s, maillage de qualité ~1 h ([docs](https://docs.worldlabs.ai)) | Part d'un texte, d'images, d'une vidéo. Exports : splats SPZ/PLY gratuits, maillage GLB avec collision 100-200 k triangles ([specs](https://docs.worldlabs.ai/marble/export/specs)). API : PLY gratuit, maillage 3 500 crédits ≈ 2,80 $ ([atlasworldmodel](https://atlasworldmodel.com/marble-api)). Payant. |
| HunyuanWorld (Tencent, open source) | non mesuré | Texte ou image vers panorama puis maillage, exports obj/ply/drc ([guide](https://xugj520.cn/en/archives/generative-3d-world-hunyuanworld.html?amp=1)). La partie reconstruction demande 12 à 24 Go de VRAM, 80 Go de disque ([Clore](https://docs.clore.ai/guides/3d-generation/hunyuan-world-2)) : GPU Nvidia, pas un Mac. |
| Genie 3 / Project Genie (Google) | temps réel | Réservé aux abonnés AI Ultra aux États-Unis ([Google](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie)). Monde non exportable, aucune API trouvée. Inutilisable. |
| Meshy / Tripo | 88 à 195 s par objet ([HackerNoon](https://hackernoon.com/how-i-stress-tested-3-ai-3d-generators-on-the-same-inputs-what-the-numbers-actually-show)) | Génère un objet (un kiosque, un escalator), pas un lieu. Utile pour décorer. |
| Polycam / Luma (splats depuis photos ou vidéo) | cloud, minutes | Reconstruit un lieu **réel** mais il faut des photos de l'endroit ([Polycam](https://learn.poly.cam/hc/en-us/articles/30549121659412-How-to-Create-Photogrammetry-and-Gaussian-splats-from-Existing-Images-and-Videos)). |

Ce qu'un « splat » est : un nuage de millions de petites taches colorées qui donne un rendu photo mais n'a ni murs ni sol utilisables pour guider des personnages. Pour la foule, il faut quand même un plan de circulation séparé. Aucun de ces outils ne restitue le Forum des Halles « tel quel » depuis un simple nom de lieu : le résultat serait plausible mais inventé. Ce point découle des descriptions des outils, pas d'un essai `[?]`.

## 5. Ce que la communauté fait déjà (10 exemples)

1. **fable51-worlds** (PhiloLabs). Des essaims d'agents Claude reconstruisent un quartier réel en three.js : Union Square SF, 453 bâtiments depuis OpenStreetMap, 220 piétons sur un graphe de 1 398 nœuds, 109 véhicules, feux de circulation ; ~2 h, ~8 M de tokens, 33 $ ([explainx](https://explainx.ai/blog/fable51-worlds-philolabs-agent-swarm-union-square-2026)). Aussi Kyoto. **MIT, 521 étoiles, créé 2026-09-02**, `npm run dev` ([GitHub](https://github.com/PhiloLabs/fable51-worlds)). Page d'accueil de Hacker News le 2 sept. 2026. Réutilisable : oui, c'est le plus proche. Limite : extérieur, pas de sous-sol.
2. **Masjid al-Haram** (alzin). Foule de 5 000 agents dans le navigateur : entrées, sorties par portes, rangées de prière ([forum three.js](https://discourse.threejs.org/t/masjid-al-haram-real-time-3d-crowd-tawaf-prayer-simulation/94156), 2026-09-08). **MIT**, Node 20, aucune clé ni serveur, démo en ligne ([GitHub](https://github.com/alzin/The-Great-Mosque-of-Mecca-Masjid-al-Haram), 14 étoiles). Très proche de « foule + portes ».
3. **Evacuation Simulator** (Devpost, 2026-09). Dessine pièces, couloirs, escaliers sur plusieurs étages, place des sorties, lance l'évacuation en direct, mesure les goulots, ajoute feu / inondation ([Devpost](https://devpost.com/software/evacuation-simulator)). Pile : React, FastAPI, moteur en Python, calcul par graphe de visibilité. Licence et dépôt `[?]`. Utile pour la méthode (portes étroites = embouteillages), pas le visuel : 2D.
4. **Shinjuku Station Indoor** (satoshi7190). Gare multi-niveaux en 3D three.js à partir des données officielles japonaises, étages que l'on affiche/masque, réseau piéton animé ([article](https://googlemapsmania.blogspot.com/2026/07/the-5-best-3d-subway-maps.html), [discussion HN](http://news.ycombinator.com/item?id=48978792), juillet 2026). Démo : [satoshi7190.github.io](https://satoshi7190.github.io/Shinjuku-indoor-threejs-demo/). Même problème que Châtelet. Licence `[?]`. Là-bas la donnée existe ; à Paris, non `[?]`.
5. **three-vat** (npm, 2026-09-27). Anime des centaines à des milliers de personnages identiques avec un seul appel de dessin, sans coût processeur par image ([npm](https://npmjs.com/package/three-vat), [démo](https://mikefernandez-pro.github.io/three-vat/)). Brique pour des foules denses fluides. Licence `[?]`.
6. **map3d** (cartesiancs). Dessine un rectangle sur une carte, obtient bâtiments et routes extrudés depuis OpenStreetMap en quelques secondes, tout dans le navigateur ([article](https://tmfnk.com/use/tools/map3d), [GitHub](https://github.com/cartesiancs/map3d)). Licence `[?]`. Donne l'extérieur (Accor Arena) vite.
7. **Simulateur de logement de Chicago** (r/ClaudeAI, 2026-10-13). Urbaniste sans code, 481 000 bâtiments en 3D, fait avec Claude Code en quelques jours ([Reddit](https://reddit.com/r/ClaudeAI/comments/1x4lqfl/urban_planner_here_no_coding_experience_built_a)). Preuve de faisabilité « vibe-codée » à l'échelle d'une ville ; code `[?]`.
8. **Simulation d'évacuation de tsunami à Kamakura** (note.com, 2026-06). Multi-agents en Python, développé « plus d'un an » avec Claude Code ([note](https://note.com/limber_oxalis376/n/n602003b5d43f?hl=en)). Sérieux mais lent : contre-exemple de rapidité. Code `[?]`.
9. **Éclipse au ras du sol sur OSM** (forum OpenStreetMap, 2026-08-10). Bâtiments et forêts via Overpass, extrudés sur le relief, une seule page HTML + three.js, « libre à réutiliser » ([source](https://community.openstreetmap.org/t/eclipse-wednesday-a-ground-level-simulator-built-on-osm-buildings-and-forests/146325)). Modèle de page unique facile à copier.
10. **Foule de 100 000 piétons dans Unity DOTS** (r/Unity3D, 2025-08). Navigation sur graphe de voies ([Reddit](https://reddit.com/r/Unity3D/comments/1mys2oq/100k_pedestrian_crowd_simulation_in_unity_dots)). Vendu comme extension payante pour Unity ; non réutilisable librement `[?]`.

Pas trouvé : aucun projet public « Châtelet-Les-Halles / évacuation + MCP » ; recherche X/Twitter non couverte par l'outil (pas de filtre par site efficace). Un modèle 3D de la gare Châtelet existe ([r/transit](https://www.reddit.com/r/transit/comments/1ng8mcs/a_3d_model_of_the_ch%C3%A2teletles_halles_transit_hub/), 2025-09), mais sa licence et son format sont `[?]`.

## 6. Verdict : trois chemins sous 2 h

Aucun choix pour l'équipe. Les durées sont des estimations, non mesurées.

**Chemin A : tout dans le navigateur, code écrit par Claude (three.js).**
- Principe : partir de fable51-worlds (méthode + code) pour l'extérieur depuis OpenStreetMap, dessiner les niveaux du Forum comme volumes simples, et brancher une foule type Masjid al-Haram / three-vat. Les « issues » sont des portes dans un graphe de circulation recalculé quand on en ferme une.
- Installation : Node et un navigateur, quelques centaines de Mo `[?]`.
- Instantané : oui, tout tourne en local, sans serveur, 5 000 agents démontrés.
- Risque : le sous-sol réel n'existe pas dans les données ; il sera approximatif et dessiné à la main. Le recalcul des trajets à la fermeture d'une porte n'a pas été vu dans un exemple trouvé (le Evacuation Simulator le fait en Python avec un serveur) : c'est l'inconnue technique n°1 `[?]`.

**Chemin B : extérieur réel par tuiles + foule en surimpression (Cesium / three.js).**
- Principe : Accor Arena et alentours depuis les tuiles photoréalistes de Google ou OSM, foule posée par-dessus, issues = barrières sur le graphe des rues.
- Installation : navigateur, clé d'API Cesium gratuite à créer `[?]`.
- Risque : disponibilité des tuiles Google en Europe `[?]` ; pas de sous-sol ; rendu d'une foule sur des tuiles photo mal documenté. Convient seulement à l'option Accor Arena.

**Chemin C : décor généré (Marble) + foule dans un moteur web.**
- Principe : photos du Forum / vidéo, monde généré (~5 min), export en maillage de collision, dans lequel on lâche la foule. Décor photoréaliste.
- Installation : compte World Labs payant, navigateur ; HunyuanWorld local écarté (GPU Nvidia).
- Risque : le résultat est une approximation plausible, pas le vrai plan ; un splat ne sert pas à guider des personnages ; maillage de qualité jusqu'à 1 h. Plus risqué pour une démo « lieu réel » devant un jury, mais le plus beau visuellement.

Écartés pour cette contrainte : Unreal MCP (40 à 100+ Go, retours négatifs, pas de web direct), Blender (images, pas interactif), Genie (inaccessible), Unity/Godot (éditeur plus export web, sans gain sur le navigateur direct).

## 7. Questions pour l'équipe

1. Lieu de la démo : a. Forum des Halles (sous-sol à dessiner) / b. Accor Arena (extérieur, données ouvertes) ? Recommandation : b si le temps manque, a pour l'effet mémorable.
2. Budget d'API pour la construction par agents (fable51 : ordre de grandeur 33 $ pour un quartier) : a. oui / b. non ? Rien n'a été lancé ici.
3. Un membre de l'équipe peut-il photographier / filmer le Forum pour le chemin C ? a. oui / b. non.
