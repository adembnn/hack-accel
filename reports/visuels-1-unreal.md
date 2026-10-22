# Unreal Engine 5 pour la démo : bon moteur de rendu, et sous quelle forme ?

Décision débloquée : choisir ou écarter UE5, et en quelle forme (direct, vidéo, diffusion).
Légende : `[?]` = non vérifié ; `[estim.]` = mon estimation, pas une mesure. Je n'ai lu que des extraits de pages (pas regardé les vidéos).

## La version simple et imagée

UE5 est un studio de cinéma de poche : il fait des images très belles, mais il pèse lourd (une centaine de Go sur le disque) et il demande un métier à part. Pour une équipe qui n'a jamais ouvert le logiciel et qui a 7 h, le risque est de passer la journée à apprivoiser l'outil et de n'avoir rien de montrable. Trois faits changent la donne :

1. **Le serveur d'Aiven n'a probablement pas de carte graphique.** Aiven Runtime fait tourner des conteneurs (une application emballée dans une boîte standard) à côté des bases de données. Ses docs parlent de code et de données, jamais de GPU (la puce graphique) `[?]`. Or la diffusion en direct d'UE5 dans un navigateur exige une GPU côté serveur. Donc « UE5 en direct sur Aiven » est quasi exclu ; ce qui est compatible : un site Aiven qui sert **une vidéo** faite avec UE5.
2. **Le Forum des Halles est surtout sous terre.** Les tuiles 3D de Google (une maquette photo de la ville, vue du dessus) montrent l'extérieur, pas les couloirs ni la salle de ciné `[?]` (déduction de ma part, non testée). L'intérieur sera à modéliser à la main quel que soit le moteur. Le gain « monde réel gratuit » d'UE5 ne vaut donc surtout que pour l'option Accor Arena (extérieur).
3. **Un morceau existe déjà** : un projet public, Project Mobius, rejoue des trajectoires de piétons (fichiers JSON ou HDF5) dans UE5 avec 5 000 personnages dans un immeuble à étages. C'est exactement « simulation Python dehors, rendu UE5 dedans ».

**Lecture brute** : UE5 est un excellent moteur d'image, un mauvais moteur de démo en direct pour cette équipe et cet hébergement. Les formes B (vidéo des scénarios) et C (ouverture seulement) restent ouvertes ; elles dépendent de qui sait faire quoi (voir questions en bas).

## 1. Foules dans UE5

- **Mass Entity** = la méthode d'UE5 pour des milliers de personnages : chacun est une simple ligne de données, pas un « objet » lourd. Il sert aux foules et au trafic de City Sample. [Epic, doc City Sample](https://dev.epicgames.com/documentation/unreal-engine/city-sample-project-unreal-engine-demonstration)
- **City Sample (Matrix Awakens)** : 35 000 piétons dans une ville de 4 x 5 km, selon la conférence d'Epic. [YouTube](https://youtube.com/watch?v=usJrcwN6T4I) Sur PC musclé ; le projet pèse très lourd `[?]`.
- **ZoneGraph** = un réseau de « couloirs » invisibles sur lesquels les foules Mass marchent. Mass gère aussi l'évitement entre personnes. [vrealmatic](https://vrealmatic.com/unreal-engine/city-sample/crowd)
- **Personnages** : proches de la caméra, des MetaHumans (humains réalistes d'Epic) animés ; au loin, des figurines instanciées avec animation « cuite » dans la texture. [vrealmatic](https://vrealmatic.com/unreal-engine/city-sample/crowd) UE 5.8 ajoute les « MetaHuman Collections » pour des foules de milliers de MetaHumans. [Medium, juin 2026](https://medium.com/@irenderofficial/crowds-in-unreal-engine-how-mass-and-metahuman-fill-a-city-with-believable-people-62a0e866b66f)
- **Vue « carton/argile »** : des figurines blanches sans visage sont l'option la plus réaliste en 7 h. Le mode de visualisation de City Sample remplace les gens par des silhouettes blanches. [Epic](https://dev.epicgames.com/documentation/unreal-engine/city-sample-project-unreal-engine-demonstration) Un plugin tiers rend des cubes dès l'installation, sans aucun asset. [GitHub](https://github.com/DigiLogicLabs/ue5-mass-units-plugin)
- **Plugins de foule** : TerraCrowds annonce 100 000 agents simulés et affichés en temps réel sur une carte graphique grand public, pour UE 5.5. [ucrowds](https://ucrowds.com/blog/2025-09-17-introducing-terracrowds-for-unreal-engine) OverCrowd existe sur Fab (la boutique d'Epic). [Fab](https://fab.com/listings/51ea6e75-30bd-495e-aac0-e05f79f345c5) Prix et licence de chacun : non vérifiés. Anima et Houdini Engine : rien de concluant trouvé dans ma recherche `[?]`.
- **Piège** : Mass est exigeant à configurer (traits, processeurs, StateTree). Un tutoriel annonce 20 minutes pour un exemple minimal avec un plugin tiers. [tutoriel](https://lcmnav3d.github.io/mass-entity-crowds.html) Un tutoriel ne mesure pas un lieu réel avec murs, portes et sorties. Statut « expérimental » de Mass en 5.8 : `[?]`.

## 2. Monde réel dans UE5

- **Cesium for Unreal** (plugin gratuit) fait entrer des tuiles photo de Google dans la scène, positionnées sur le globe (« géoréférencement »). [Cesium](https://cesium.com/learn/unreal/unreal-photorealistic-3d-tiles) Une ville entière sans modéliser, avec en main une clé Google Maps (API Map Tiles) ou un compte Cesium ion. [guide NYC](https://github.com/per-simmons/unreal-agent-harness/blob/master/docs/NYC-CESIUM-WALKTHROUGH.md)
- **Coûts et quotas** : l'accès gratuit via Cesium ion est limité à 1 000 requêtes « tuile racine » par mois ; Google facture 6 $ par 1 000. [forum Cesium](https://community.cesium.com/t/google-tiles-limitations/31034), [forum Cesium](https://community.cesium.com/t/google-3d-tiles-cost/27625/5) Ces chiffres datent de 2023-2024 `[?]`. Le guide NYC dit que l'ancien asset Google gratuit sur Cesium ion ne l'est plus : clé Google directe. [GitHub](https://github.com/per-simmons/unreal-agent-harness/blob/master/docs/NYC-CESIUM-WALKTHROUGH.md)
- **Conditions d'usage Google** ([policies](https://developers.google.com/maps/documentation/tile/policies)) :
  - logo « Google Maps » et mentions de sources visibles en permanence ;
  - interdit de pré-charger, stocker ou mettre en cache hors usage normal ;
  - on peut poser ses propres objets 3D par-dessus, à condition de ne pas les tracer à partir des tuiles : on ne peut donc **pas** en tirer les murs ou sols pour la simulation ;
  - une vidéo qui montre les tuiles : « promotionnelle » au plus 30 s, mention « for promotional purposes only », sans Street View. Une séquence d'ouverture de 15 s entre dans ce cadre ; une vidéo des scénarios entière, c'est à clarifier `[?]`.
- **Bâtiments OSM / IGN / CityGML** : Cesium a des tutoriels pour importer des bâtiments 3D. [Cesium](https://cesium.com/docs/tutorials/import-3d-buildings) La filière IGN → glTF/3D Tiles vers UE : je n'ai rien vérifié `[?]`. Un projet public génère des bâtiments 3D Tiles à partir d'Overture Maps. [GitHub](https://github.com/reearth/reearth-buildings)
- **Intérieurs** : Datasmith (le pont d'Epic pour importer des modèles Revit, Rhino, etc.) existe. Project Mobius importe FBX, OBJ, Datasmith, IFC, WKT. [GitHub](https://github.com/sir306/ProjectMobius) Aucun modèle 3D du Forum des Halles trouvé `[?]`.

## 3. Brancher une simulation externe

C'est la partie la plus favorable à UE5.
- **JuPedSim** (moteur Python de foule) écrit lui-même les trajectoires en SQLite, ou dans le format que l'on veut (CSV, JSON, HDF5, API distante). [JuPedSim](https://jupedsim.org/stable/concepts/custom_serialization.html)
- **Project Mobius** (UE 5.5, licence MIT) lit ces trajectoires (JSON/HDF5, formats Mobius et Jülich) et les rejoue avec Mass + Niagara (système d'effets de particules d'Epic) : 5 000 agents, lecture, pause, curseur, cartes de chaleur de densité. Windows est la cible principale, macOS « partiel ». [GitHub](https://github.com/sir306/ProjectMobius) Il pourrait être notre point de départ ; ce n'est pas un produit fini pour un jury.
- **Remote Control API** : UE embarque un serveur web (HTTP et WebSocket) qui permet à une page web de lire et écrire des propriétés et d'appeler des fonctions. [Epic](https://docs.unrealengine.com/en-US/Engine/Editor/ScriptingAndAutomation/WebControl) On peut s'en servir pour lancer le plan A, B ou C depuis l'interface web. Il est désactivé par défaut dans un projet empaqueté ; on l'active avec des options de lancement.
- **Python dans l'éditeur** : permet de créer des acteurs et des séquences en script. [Epic](https://dev.epicgames.com/documentation/unreal-engine/python-scripting-in-sequencer-in-unreal-engine) Utile pour automatiser, mais rien d'« instantané » pour quelqu'un qui débute.
- **Simuler directement dans UE** (Mass + évitement) : possible, mais l'équipe aurait alors deux moteurs de vérité (Python et UE) qui divergent. À éviter si JuPedSim est le moteur du produit.

## 4. Montrer au jury, et compatibilité Aiven Runtime

| Forme | Faisable sur Mac ? | Compatible Aiven Runtime ? |
|---|---|---|
| Rendu en direct sur un portable | Oui sur Apple Silicon (voir §5) | Oui en tant que **démo locale** ; l'app déployée Aiven reste le produit, UE est une fenêtre à côté. Le brief veut une app déployée : le jury doit voir autre chose qu'un exécutable local `[?]` |
| Pixel Streaming | Le plugin tourne sur Windows, Linux, Mac (la doc précise « Mac testé sur Ventura 13.5.1 ») et exige une GPU NVIDIA (NVENC) ou AMD (AMF) pour encoder la vidéo. [Epic](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-pixel-streaming-reference?lang=en-US) | **Très improbable** : il faut un conteneur Linux GPU NVIDIA, et les docs Aiven lues ne mentionnent aucune GPU `[?]`. Les modèles de déploiement d'Epic/Microsoft passent par des machines GPU Azure. [Microsoft](https://learn.microsoft.com/en-us/gaming/azure/reference-architectures/unreal-pixel-streaming-deploying) |
| Vidéo pré-rendue (Movie Render Queue, l'outil d'export d'Epic en images de haute qualité) | Oui, plus lent qu'un PC à carte NVIDIA | **Oui** : un fichier MP4 servi par le conteneur de l'app. Aiven Runtime accepte tout ce qui se met dans une Containerfile/Docker Compose. [Aiven](https://aiven.io/docs/products/runtime/manifest-files/containerfiles) |

Précisions : Aiven Runtime est décrit comme « stateless » (sans disque durable) [Aiven](https://aiven.io/blog/introducing-aiven-apps). Les vidéos doivent donc être dans l'image Docker (poids à garder petit) ou sur un stockage externe `[?]`. Le résultat des scénarios (pour la cohérence avec l'agent IA) vit dans la base Aiven, pas dans UE.

## 5. Coût d'entrée réel

- **Taille** : un guide annonce 35 à 60 Go de téléchargement et au moins 80 à 120 Go d'espace. [unrealdocs](https://unrealdocs.win/pages/installation.html) Des témoignages de 2022 parlent de 115 Go une fois déployé. [forum Epic](https://forums.unrealengine.com/t/unreal-eating-up-115-gb-of-disk-space/606521/3) Mesure sur Mac non faite.
- **Mac Apple Silicon** ([doc Epic 5.8](https://dev.epicgames.com/documentation/unreal-engine/macos-development-requirements-for-unreal-engine?lang=en-US)) :
  - Lumen (éclairage global) en mode logiciel : M1 et plus ;
  - Nanite (géométrie massive) : M2 et plus, statut bêta ;
  - Lumen avec lancer de rayons matériel : « expérimental » à partir du M2 en 5.8, absent en 5.7 ;
  - recommandé : M3 et 32 Go de RAM ; minimum 16 Go (doc 5.4). [Epic](https://dev.epicgames.com/documentation/en-us/unreal-engine/hardware-and-software-specifications-for-unreal-engine?application_version=5.4)
  - l'éditeur sur Apple Silicon reste signalé « expérimental » dans l'historique des versions. [Epic](https://dev.epicgames.com/documentation/unreal-engine/macos-development-requirements-for-unreal-engine?lang=en-US)
  - Project Mobius : macOS « partiel » ; un guide Cesium conseille de désactiver le lancer de rayons sur Mac pour la stabilité. [GitHub](https://github.com/per-simmons/unreal-agent-harness/blob/master/docs/NYC-CESIUM-WALKTHROUGH.md)
  - Puce et RAM des Mac de l'équipe : `[?]`.
- **Courbe d'apprentissage** : pour un débutant motivé, 2 à 4 semaines à raison de 7-10 h/semaine juste pour ne plus être perdu dans l'éditeur. [reactdom](https://reactdom.com/learn-unreal-engine) Un créateur qui a tenté un jeu en 14 jours sans expérience dit avoir « fait presque rien » avant d'ajouter 2 jours. [lilys](https://lilys.ai/notes/en/unreal-engine-5-20260826/unreal-game-14-days-beginner) Ces sources sont des blogs, pas des mesures ; elles vont dans le même sens que mon intuition.
- **Hackathons / jumeaux numériques en un jour** : je n'ai trouvé aucun témoignage fiable de jumeau numérique urbain construit en UE5 en 7 h par une équipe novice `[?]`. Le seul cas « ville » trouvé (Camden) est un projet de plusieurs mois. [Cesium](https://cesium.com/blog/2026/08/31/hopeworks-camden-digital-twin-cesium-for-unreal)
- **Pilotage par un agent IA** : un dépôt public montre Claude/Unreal contrôlé par un serveur MCP pour poser des acteurs Cesium sans clics. [GitHub](https://github.com/per-simmons/unreal-agent-harness) Ça réduit le coût d'apprentissage mais ajoute une pièce fragile ; jamais testé par nous.
- **Piège de version** : UE 5.8 est sorti après les versions de plugins disponibles ; le même dépôt a dû compiler Cesium depuis les sources en 5.8. Choisir 5.5 ou 5.7 est plus sûr `[?]`.

## 6. Références visuelles (extraits lus, vidéos non regardées)

1. **The Matrix Awakens / City Sample** : 35 000 piétons, 18 000 véhicules, ville entière en direct. [Tech Talk Epic](https://youtube.com/watch?v=usJrcwN6T4I) Impressionne par l'échelle ; irréaliste à reproduire en 7 h.
2. **Project Mobius** : 5 000 agents dans un bâtiment à étages, murs transparents, carte de chaleur de densité. [GitHub](https://github.com/sir306/ProjectMobius) Le plus proche de notre besoin.
3. **TerraCrowds** : annonce 100 000 agents en temps réel. [ucrowds](https://ucrowds.com/blog/2025-09-17-introducing-terracrowds-for-unreal-engine) Impressionne par le nombre ; produit commercial, prix `[?]`.
4. **Cesium for Unreal, ville réelle** : survol de New York par tuiles Google. [guide](https://github.com/per-simmons/unreal-agent-harness/blob/master/docs/NYC-CESIUM-WALKTHROUGH.md), [vidéo](https://youtube.com/watch?v=5TKP3Hsrovk) L'effet « on est dans la vraie ville » en 5 minutes de réglage.
5. **Hopeworks, jumeau de Camden** : bâtiments projetés posés dans la ville Google. [Cesium](https://cesium.com/blog/2026/08/31/hopeworks-camden-digital-twin-cesium-for-unreal) Modèle Blender dans un contexte réel : même schéma que le nôtre.
6. **Arup MassMotion, aéroport Fiumicino** : 25 000 passagers simulés, 250 comptoirs. [Arup](https://arup.com/projects/massmotion-digital-passenger-model-for-fiumicino) **MassMotion n'est pas UE5** `[?]` (logiciel propre) ; c'est la référence de crédibilité métier. Arup utilise aussi UE pour la visualisation. [Epic](https://unrealengine.com/spotlights/design-and-engineering-firm-arup-embraces-an-interactive-3d-technology-shift?lang=fr)
7. **Oasys MassMotion, centre événementiel au Canada** : étude de cas stade. [Oasys](https://oasys-software.com/case-study/event-centre-canada-oasys-massmotion) Même remarque : pas UE5, bonne référence de langage pour un directeur de lieu.
8. **PSCS-I** : jeu de données synthétique de foules en panique dans des intérieurs photoréalistes. [GitHub](https://github.com/stefanos50/PSCS-I) Moteur utilisé : `[?]`.
9. Thunderhead (Pathfinder) : docs lues, aucune démo UE5 identifiée `[?]`.

Peu de vidéos d'évacuation « UE5 » publiques trouvées par ma recherche ; cette liste est probablement incomplète.

## 7. Verdict : trois façons d'utiliser UE5 (je ne choisis pas pour l'équipe)

| | A. Tout en direct | B. Scénarios rendus en vidéo | C. UE5 seulement pour l'ouverture |
|---|---|---|---|
| **Principe** | App UE5 packagée, lancée sur un portable, pilotée par Remote Control | Python simule ; UE5 rejoue les 2-3 plans côte à côte ; export en MP4 ; l'app Aiven affiche les vidéos | 10-15 s de plan large (Châtelet / Arena) en UE5, le reste de la démo en 3D web |
| **Effet sur le jury** | Maximal si ça marche : on voit la foule bouger en vrai | Fort mais « film » : pas d'interaction, risque de paraître pré-calculé | Un « waouh » d'ouverture, puis la suite doit tenir sans UE5 |
| **Heures `[estim.]`** | 30 h+ pour une équipe novice ; hors de portée en 7 h | 15 à 20 h sans expert (installation, scène, import, rejeu, rendu) ; 8 à 10 h avec un expert UE | 3 à 6 h pour un plan Cesium + caméra + export ; faisable en parallèle |
| **Risque principal** | Plantage ou lenteur sur la machine, UE non déployable sur Aiven | Le rendu d'un seul plan prend trop de temps ; incohérence entre la vidéo et les chiffres de l'agent | Conditions Google (vidéo promotionnelle, 30 s max) ; l'ouverture n'a pas de lien avec le produit |
| **Compat. Aiven Runtime** | Non (démo locale) | Oui (MP4 dans l'app) | Oui (MP4) |

Ce qui change les trois : savoir si quelqu'un dans l'équipe a déjà ouvert UE (sinon A est éliminé d'avance), et si l'on renonce à l'intérieur du Forum au profit de l'Accor Arena (là, Cesium rend A ou C beaucoup plus rentable).

## Questions pour Adem

Décor : tout dépend de ce que l'équipe sait faire avec UE et de ce que le jury doit voir tourner sur Aiven.
1. Quelqu'un dans l'équipe a-t-il déjà utilisé UE ? a) oui, à l'aise ; b) oui, un peu ; c) non, personne. Ma recommandation : si c), éviter A et B ; viser C ou rester en 3D web.
2. Quelle puce et quelle RAM pour chaque Mac ? (a) M3 ou plus et 32 Go ; (b) M1/M2 ou 16 Go ; (c) je ne sais pas.
3. Lieu de démo : a) Forum des Halles (intérieur à modéliser à la main) ; b) Accor Arena (extérieur déjà donné par Cesium). Par défaut si pas de réponse : a), puisque l'événement réel l'ancre.

## Ce que je n'ai pas pu vérifier

- Existence d'une GPU sur Aiven Runtime (docs lues muettes) ; à confirmer auprès d'Aiven sur place.
- Statut actuel de Mass (expérimental ou stable) en 5.8.
- Poids réel de l'installation sur macOS et temps de rendu sur Apple Silicon.
- Tuiles Google : usage dans une vidéo de démo de plus de 30 s.
- Données 3D de l'intérieur du Forum des Halles.
