# Rendu dans le navigateur : jusqu'où aller en « wow »

Décision débloquée : quelle bibliothèque et quelle direction visuelle pour un rendu web.
Convention : `[?]` = je n'ai pas pu le vérifier. Aucun LLM payant appelé, rien installé, aucun autre fichier touché.

## 1. Version simple et imagée

Le navigateur sait faire une maquette de ville très lumineuse, avec des milliers de petits points de lumière qui courent dans les couloirs. Il sait moins bien faire un film de cinéma photoréaliste (lumière qui rebondit, matières crédibles).

Le truc qui marche en web : une « salle de contrôle ». Fond noir, bâtiments en verre sombre, foule en traînées lumineuses, zones qui rougissent quand ça se bouscule. C'est un style assumé, donc il ne paraît jamais « moins bien qu'Unreal ». Il paraît différent.

Trois faits qui comptent pour décider :
- Compter la foule n'est pas le problème. 3 000 à 10 000 personnes par scénario, ça passe sur un portable récent si on les dessine « en lot » (voir §4). Le vrai goulot : calculer leurs déplacements quand le juré ferme une issue.
- Les tuiles 3D photoréalistes de Google (CesiumJS) donnent un effet immédiat pour l'extérieur, mais leurs conditions d'usage interdisent d'en extraire de la donnée ou de les stocker (§3). Elles ne montrent de toute façon pas le sous-sol.
- L'hébergement imposé (Aiven Runtime) fait tourner des conteneurs lancés depuis Git ([doc Aiven](https://aiven.io/docs/products/runtime)). Un site statique dans un petit serveur nginx y a sa place (l'annuaire [templates.aiven.io](https://templates.aiven.io) en est un). Aucune des bibliothèques ci-dessous ne pose de problème d'hébergement.

## 2. Glossaire express (une phrase par terme)

- WebGL / WebGPU : les deux « langues » que le navigateur parle à la carte graphique. WebGPU est la plus récente et la plus rapide.
- Draw call : un ordre de dessin envoyé à la carte graphique. Trop d'ordres = ça rame.
- InstancedMesh (« instances ») : dessiner 10 000 fois le même personnage avec un seul ordre.
- Post-traitement : filtres appliqués à l'image finie (halo lumineux « bloom », flou de profondeur « DOF », vignette).
- Compute shader : petit programme exécuté par la carte graphique pour calculer (ici : bouger des milliers d'agents) au lieu du processeur.
- Gaussian splatting (splats) : scène capturée par photos et rendue en millions de taches colorées semi-transparentes.
- Tuiles 3D : maillage 3D de la ville découpé en morceaux qui se chargent à la demande.
- TripsLayer : couche de deck.gl qui anime des trajets avec une traînée qui s'estompe derrière chaque point.
- VAT (vertex animation texture) : l'animation de marche « cuite » dans une image, pour animer des milliers de silhouettes sans calcul côté processeur.

## 3. Bibliothèques : ce que chacune sait faire

| Bibliothèque | Plus fort atout | Objets animés rapportés | Facilité en 7 h |
|---|---|---|---|
| three.js (WebGL/WebGPU) | Contrôle total, tous les effets, énorme écosystème | 100 000 instances à ~147 i/s sur un PC de bureau RTX 3060 (tutoriel, [source](https://mysimulator.uk/content/tutorials/instancedmesh-guide.html)) | Moyenne, la plus flexible |
| react-three-fiber (R3F) | three.js en composants React, bon pour l'interface | Même moteur que three.js | Bonne si l'équipe connaît React ; sinon surcoût |
| Babylon.js | Moteur complet, éditeur, « thin instances » | ~2 000 instances animées à 60 i/s dans un essai forum, ~20 000 avec réglages (forum, [1](https://forum.babylonjs.com/t/baked-animation-performance/32023)) | Moyenne |
| PlayCanvas | Éditeur web, très bon pour splats | Pas de chiffre trouvé `[?]` | Moyenne, orienté éditeur |
| CesiumJS + tuiles Google | Ville photoréaliste instantanée | Peu d'objets animés (ce n'est pas son rôle) | Facile à brancher, contraint par les conditions d'usage |
| deck.gl | Traînées (TripsLayer), chaleur, colonnes 3D, très rapide sur carte | 1 M d'éléments à 60 i/s sur un MacBook Pro 2015 (doc officielle, [source](https://deck.gl/docs/developer-guide/performance)) | La plus facile pour un effet « carte vivante » |
| MapLibre GL JS | Bâtiments extrudés, base de carte libre ; ombres AO possibles via [plugin](https://github.com/wallabyway/maplibre-building-shadows) | Sert de fond, deck.gl dessine la foule | Facile |
| Mapbox GL | Style « Standard » avec lumière et ombres ([doc](https://docs.mapbox.com/map-styles/guides/standard-styles)) | idem | Facile, mais jeton et licence propriétaire `[?]` |
| Kepler.gl | Outil Uber, bâti sur deck.gl, sans code | Données statiques surtout | Bon pour explorer, pas pour une démo interactive sur mesure |
| Spark (splats, World Labs) | Splats dans three.js, MIT, jusqu'à 40 M de splats fluides même sur téléphone ([blog](https://worldlabs.ai/blog/spark-2.0)) | Décor seulement | Facile à charger, mais il faut une capture du lieu |
| gsplat.js, Luma | Visionneuses de splats plus anciennes ([Luma](https://github.com/lumalabs/luma-web-examples)) | Décor seulement | Spark est le choix actuel `[?]` |

Précisions utiles :
- three.js : le rendu WebGPU est considéré prêt pour la production depuis r171, avec repli automatique sur WebGL 2 si le navigateur ne suit pas ([guide](https://threejs.org/manual/en/webgpurenderer.html)). Bloom et profondeur de champ ont des exemples officiels ([bloom](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_postprocessing_bloom.html), [DOF](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_postprocessing_dof.html)). Soutien WebGPU : environ 87 % des usages mondiaux en septembre 2026 selon un blog qui cite caniuse ([source](https://webcodingcenter.com/webgpu/why-webgpu-exists-and-where-it-stands--browser-support-in-2026.html)) ; Safari 26 et Chrome oui, Firefox pas encore complet. Conséquence : tester la machine du jury, garder le repli WebGL 2.
- Google Photorealistic 3D Tiles : logo Google Maps et attributions obligatoires ; mise en cache, usage hors ligne, analyse d'image ou extraction de géodonnées interdits ([Google](https://mapsplatform.google.com/resources/blog/commonly-asked-questions-about-our-recently-launched-photorealistic-3d-tiles)). Il faut une clé et un compte de facturation ([Google](https://developers.google.com/maps/documentation/tile/3d-tiles)). Via Cesium ion, 1 000 requêtes de racine par mois sur l'offre d'entrée ([forum Cesium](https://community.cesium.com/t/google-tiles-limitations/31034)). Verdict : décor d'arrière-plan possible, mais la simulation ne doit rien lui emprunter (hauteurs, mesures). Le sous-sol n'y existe pas. Dépendance réseau en démo = risque.
- Splats : très beau pour un lieu capturé en photos, mais personne dans l'équipe n'a (à ma connaissance) de capture de l'UGC ou du Forum. Hors périmètre, sauf si un splat public existe `[?]`.

## 4. Performance : combien d'agents, sur un portable récent

Aucune mesure directe sur un MacBook M-series trouvée. Voici ce qui existe, du plus solide au moins solide :
- deck.gl : 1 M de points à 60 i/s sur un MacBook Pro de 2015, 10 à 20 i/s vers 10 M (doc officielle, [lien](https://deck.gl/docs/developer-guide/performance)). Un portable 2026 fait nettement mieux `[?]`.
- three.js : des milliers d'objets séparés ruinent les performances (un « mesh » = un ordre de dessin) ; la règle donnée est moins de 100 draw calls par image ([guide](https://github.com/robcost/gameforge/blob/main/docs/research/threejs-best-practices-100-tips.md)). Avec instances : 1 ordre pour toute la foule.
- Animation de marche en masse : [three-vat](https://github.com/MikeFernandez-Pro/three-vat) cuit une animation dans une texture et anime « des centaines à des milliers » de personnages en un draw call, sans coût processeur par image (affirmation de l'auteur).
- Calcul sur carte graphique : [abm.gl](https://github.com/kai-erlenbusch/abm.gl) annonce plus de 1 000 000 d'agents à haute cadence en WebGPU (affirmation de l'auteur, pas de matériel précisé). [webgpu-crowd-simulation](https://github.com/wayne-wu/webgpu-crowd-simulation) fait une simulation de foule sur GPU. Un guide donne ~50 000 particules comme limite pratique côté processeur contre « des millions » sur GPU ([source](https://github.com/robcost/gameforge/blob/main/docs/research/threejs-best-practices-100-tips.md)).
- Babylon.js : ~2 000 instances animées à 60 i/s dans un essai ancien du forum ; 20 000 dans un autre avec réglage ([forum](https://forum.babylonjs.com/t/baked-animation-performance/32023)). Chiffres de forum, machines inconnues.

Lecture pour nous : le rendu de 3 scénarios × 3 000 à 5 000 personnes (9 000 à 15 000 silhouettes) est tenable en instances. Les 3 vues en écran partagé trois fois plus de rendu : prévoir de dessiner des points/capsules en dessous d'un seuil de zoom.
Le vrai risque est ailleurs : qui calcule les déplacements. Soit le serveur calcule et envoie des trajectoires (le navigateur les rejoue comme un TripsLayer : peu coûteux), soit le navigateur recalcule en direct quand le juré ferme une issue (Web Worker ou WebGPU compute). À trancher avec l'équipe simulation.
Test à faire tôt : 30 min pour afficher 15 000 instances sur la machine de démo réelle. C'est la mesure qui manque à ce rapport.

## 5. Grammaire visuelle de la foule

- Traînées lumineuses : chaque personne laisse une traîne qui s'estompe. Natif dans deck.gl ([TripsLayer](https://deck.gl/docs/api-reference/geo-layers/trips-layer)) ; en three.js, des lignes avec dégradé ou des sprites additifs. Très lisible dès 2 000 points.
- Carte de densité qui rougit : HeatmapLayer de deck.gl ([doc](https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer)), ou en three.js une texture de densité plaquée au sol (le sol devient rouge). Peu coûteux, très parlant pour un directeur de lieu. Seuil de danger repérable : le Washington Post a cité 1,85 pied² par personne comme densité critique à Astroworld ([article](https://washingtonpost.com/investigations/interactive/2021/what-happened-astroworld-travis-scott)), donc un vrai repère de couleur.
- Particules / points : un point par personne, couleur selon la vitesse (blanc fluide, orange ralenti, rouge bloqué). Le plus robuste.
- Silhouettes : capsules ou petites figurines instanciées (VAT). Plus « humain », plus coûteux, utile seulement en gros plan.
- Niveaux souterrains : trois techniques, à combiner.
  1. Vue éclatée : chaque niveau est une dalle séparée, empilée avec un écart vertical, reliée par des lignes lumineuses aux escaliers/escalators. Lisible, la plus fiable en web.
  2. Coupe : un plan de coupe réglable (curseur) qui rend invisibles le toit et les murs au-dessus d'une hauteur. Facile en three.js par « plan de découpe ». Demande des murs fermés pour paraître solides.
  3. Rayons X : les bâtiments sont en verre sombre à contours lumineux ; on voit à travers. Le plus simple, très « salle de contrôle ».
  Combien de niveaux a le Forum ? Non vérifié `[?]` ; il faut le plan réel avant de choisir. Référence de rendu de stations en 3D : [Aeracode](https://aeracode.org/projects/stations) `[?]` (je n'ai pas vu le rendu).
- Trois scénarios côte à côte : trois vues synchronisées d'une même horloge, même caméra. En three.js : un seul rendu avec `scissor` (le canvas découpé en trois fenêtres) ; en deck.gl : trois instances ou plusieurs vues `[?]`. Un chiffre clé en incrustation : « temps pour évacuer 90 % ».
- Ralenti / accéléré : un seul curseur de temps qui pilote la simulation et les traînées ; rien de plus.
- Avant / après : le plan actuel à gauche, le plan recommandé à droite, ou un curseur de comparaison sur la même vue. Pour le moment juré : fermer une issue la teinte en rouge, et les traînées se reroutent sous les yeux du juré.

## 6. Exemples de référence en ligne

1. [deck.gl TripsLayer : taxis de Manhattan](http://deck.gl/examples/trips-layer) : des milliers de traînées lumineuses sur des bâtiments 3D, c'est le langage visuel exact pour une foule.
2. [Washington Post : Astroworld](https://washingtonpost.com/investigations/interactive/2021/what-happened-astroworld-travis-scott) : vidéos géolocalisées, analyse de densité par des chercheurs de Carnegie Mellon ; l'enquête fait confiance au chiffre (je n'ai pas vérifié si la page contient une vue 3D `[?]`).
3. [New York Times : Itaewon, « How a Festive Night in Seoul Turned Deadly »](https://nytimes.com/2022/10/30/world/asia/south-korea-itaewon-crowd-crush-victims.html) : référence de reconstitution d'une ruelle ; je n'ai pas pu confirmer le détail visuel `[?]`.
4. [Reconstitution d'Itaewon en simulation (Ewha)](https://graphics.ewha.ac.kr/Crowd) : un lieu scanné (Matterport) puis une foule dense simulée ; recherche, pas du web, mais la cible en réalisme de foule.
5. [metro-station-simulator](https://github.com/studio-public-demos/metro-station-simulator) : station de métro en three.js, évacuation en un clic, éclairage rouge pulsé ; limite : routage « sortie la plus proche », sans congestion.
6. [stadium-digital-twin](https://github.com/studio-public-demos/stadium-digital-twin) : jumeau numérique de stade avec interrupteurs de couches, zones colorées et vues caméra préréglées ; capteurs simulés.
7. [abm.gl](https://github.com/kai-erlenbusch/abm.gl) : plus d'un million d'agents sur WebGPU (affirmation de l'auteur) ; preuve de plafond, pas de décor.
8. [webgpu-crowd-simulation](https://github.com/wayne-wu/webgpu-crowd-simulation) : simulation de foule par positions sur GPU, avec grille de voisinage ; piste si on recalcule dans le navigateur.
9. [Spark 2.0](https://worldlabs.ai/blog/spark-2.0) : des mondes capturés en splats, fluides même sur téléphone ; l'effet « presque réel » si on avait une capture.
10. [CAE avec Cesium : environnement urbain dense](https://cesium.com/blog/2022/02/15/cae-simulates-a-complex-dense-urban-environment) : simulation sur jumeau urbain 3D ; montre le côté « sérieux industriel ».
11. [maplibre-building-shadows](https://github.com/wallabyway/maplibre-building-shadows) : ombres et occlusion ambiante sur bâtiments MapLibre ; donne du relief au rendu carte.
12. [Zippy Town (forum three.js)](https://discourse.threejs.org/t/title-zippy-town-a-toy-city-with-live-traffic-day-night-lighting-and-a-) : ville-jouet avec trafic et lumière jour/nuit ; référence de maquette (lien tronqué par la recherche, à rouvrir `[?]`).

Journalisme 3D : pour Reuters Graphics j'ai trouvé les outils ([composants Svelte](https://reuters-graphics.github.io/graphics-svelte-components/components/scroller)) mais aucune reconstitution 3D confirmée. Pour Le Monde, uniquement la présentation de sa cellule d'enquêtes visuelles ([page](https://www.lemonde.fr/le-monde-et-vous/video/2024/12/18/80-ans-dans-les-coulisses-des-enquetes-videos-du-monde_6454832_60658)). Si le jury se compare à ce niveau, une recherche ciblée reste à faire.

## 7. Ce que le web ne fait pas, et comment le compenser

- Lumière globale (rebonds, ombres douces de partout) : en temps réel, le web fait des ombres directes et de l'occlusion ambiante approchée, pas de rebonds crédibles. Compensation : cuire l'ombrage dans les textures à l'avance, ou choisir un style où la lumière ne se joue pas dans la matière (verre sombre, contours émissifs).
- Matériaux réalistes (béton mouillé, cuir, peau) : possibles en PBR, mais coûteux en temps de travail. Compensation : matière mate unique + une couleur d'accent.
- Foule en haute définition (visages, vêtements variés) : hors de portée en 7 h. Compensation : silhouettes ou points ; ne jamais montrer un humain de près.
- Poids de chargement : bâtiments IGN à simplifier (tuiles ou fichier binaire compressé) avant de les servir.
- Style assumé, trois cibles précises :
  - Salle de contrôle : fond #05070A, cyan #3DE0E8 pour fluide, orange #FF9F1C pour ralenti, rouge #FF3B30 pour bloqué ; bloom léger, grille fine au sol.
  - Maquette d'argile : bâtiments gris-beige #D8CFC2, sol #B9AE9E, silhouettes rouille #C85C3A, ombre douce, flou de profondeur façon maquette (« tilt-shift »).
  - Schéma technique : fond papier #F2EFE8, traits #1B1B1B, un seul aplat rouge pour le danger.
  Une seule audace par direction (la traînée de lumière, ou la coupe éclatée, ou le curseur avant/après) : ne pas cumuler.

## 8. Trois directions visuelles (je ne choisis pas)

Heures : heures-personne de développeur front, rendu seul, hors simulation et hors agent IA.

### A. « Salle de contrôle » — three.js + bloom

- Bibliothèque : three.js (WebGPURenderer, repli WebGL 2), bloom, instances, VAT facultatif. Pas de React obligatoire.
- Palette : fond noir bleuté, cyan / orange / rouge sur les flux. Bâtiments IGN en verre sombre à contours lumineux.
- Ce que voit le jury : le Forum en vue éclatée (chaque niveau flotte au-dessus de l'autre), des centaines de traînées qui convergent vers les issues, le sol qui rougit aux goulots, trois cadres côte à côte avec un chrono par plan. Il ferme une issue : la zone devient rouge, les traînées se redéploient.
- Heures : 18 à 28.
- Risque : moyen. Demande un modèle des niveaux souterrains (donnée à trouver) ; l'éclairage cinéma disparaît mais le style le couvre. Test de perf à faire tôt.

### B. « Carte vivante » — deck.gl + MapLibre

- Bibliothèque : deck.gl (TripsLayer, HeatmapLayer, couche de colonnes 3D) sur MapLibre ; photo aérienne IGN en fond, bâtiments BD TOPO extrudés avec leur hauteur.
- Palette : photo aérienne légèrement assombrie, traînées jaune chaud et magenta, chaleur rouge-orangé.
- Ce que voit le jury : le vrai quartier vu du ciel, caméra inclinée, la foule qui s'écoule en traînées dans les rues autour de l'Accor Arena ou de Châtelet, trois cartes synchronisées. Le plus lisible pour l'espace public extérieur.
- Heures : 10 à 16.
- Risque : faible sur la technique ; fort sur le sujet si la démo reste dans le Forum souterrain : le sous-sol est difficile (empilement possible via altitudes `[?]`, mais moins élégant qu'une vraie vue éclatée). Convient mieux à l'Accor Arena qu'au Forum.

### C. « Maquette d'argile à coupe éclatée » — three.js + ombres + flou de profondeur

- Bibliothèque : three.js, ombres douces, flou de profondeur façon tilt-shift, silhouettes instanciées avec VAT, plan de coupe réglable.
- Palette : argile beige, silhouettes rouille, un seul rouge vif de danger, lumière chaude basse.
- Ce que voit le jury : un diorama du Forum ouvert par une coupe qu'il peut faire glisser, des petites figurines qui marchent, un décor qui paraît tangible. Il ferme une issue : une barrière apparaît, les figurines font demi-tour. Le plus « mémorable » en scène, le moins « données ».
- Heures : 28 à 40.
- Risque : élevé. Demande des modèles de murs fermés, de la patience sur les ombres et les performances à trois vues. Si ça glisse, on retombe sur A avec des matériaux plus mats.

Variante possible, hors des trois : un splat (Spark) du hall réel comme prologue de 5 s. Exige une capture photo sur place ; je ne la compte pas.

## 9. Ce que cela change pour le plan

- A, B et C partagent 70 % du travail : un format de trajectoires, une horloge de lecture, l'import des bâtiments IGN. Commencer par ce socle ne ferme aucun choix.
- Si la démo reste dans le Forum : A ou C. Si elle va à l'Accor Arena : B devient fort, A fonctionne aussi.
- Aucun de ces rendus ne dépend de Google 3D Tiles ; ils peuvent rester en option de décor.

## 10. Questions (ma recommandation en premier, choix par défaut si pas de réponse)

Contexte : la direction dépend du lieu de la démo et de qui calcule la foule.

1. Lieu principal de la démo ?
   a. Forum des Halles / UGC (sous-sol, vue éclatée) — recommandé
   b. Accor Arena (extérieur, carte)
   c. Les deux, un lieu en démo et l'autre en repli
2. Où calcule-t-on les déplacements quand le juré ferme une issue ?
   a. Serveur Aiven, le navigateur rejoue — recommandé, défaut
   b. Navigateur (Web Worker ou GPU)
   c. Je ne sais pas, à trancher avec l'équipe simulation
3. Machine de démo : portable du jury ou le nôtre ?
   a. Le nôtre, branché sur grand écran — recommandé, défaut
   b. Celui du jury (alors repli WebGL 2 impératif)
   c. Les deux

Ensuite, avec ta direction choisie, je prépare le test de 30 min (15 000 instances) et les 2 ou 3 références visuelles à valider sur un premier écran.
