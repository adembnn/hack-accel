# Rendu d'une foule animée et crédible dans le navigateur

Décision débloquée : quelle technique et quels modèles pour 3 000 à 5 000 personnes animées en three.js r128 à 60 images/s, et quoi changer aux sols, escaliers et escalators. Recherche faite le 22 oct. 2026 (Keenable). Rien n'a été téléchargé. Les chiffres d'images/s ci-dessous viennent des auteurs, sur leurs machines : ce ne sont PAS des mesures sur notre maquette. Je n'ai pas relu le code de la maquette : les points « à vérifier chez nous » sont marqués.

## 1. En deux phrases (version simple)
Au lieu de 3 200 acteurs qu'on fait bouger un par un, on enregistre une fois la marche d'un acteur « sur un disque » (une texture), puis on dit à la carte graphique : « dessine 3 200 copies, chacune lit le disque à un instant différent ». Le processeur ne fait presque rien, la carte graphique fait tout, d'où la fluidité.

## 2. Techniques (état de l'art)
Termes : *draw call* = ordre de dessin envoyé à la carte graphique (en avoir peu = rapide). *InstancedMesh* = un modèle dessiné N fois en un seul ordre. *Shader* = petit programme qui tourne sur la carte graphique. *LOD* = niveau de détail, modèle plus simple quand c'est loin.

| Technique | Principe | Coût | Verdict pour nous |
|---|---|---|---|
| Un SkinnedMesh par personne | un squelette animé par le processeur pour chacun | 3 200 draw calls + calcul processeur par image | Écarté. Trop lent. |
| Mesures d'un InstancedMesh simple | 10 000 « Suzanne » : 39-43 i/s instanciées contre 13-23 clonées (machine de l'auteur) | 1 draw call | Montre l'ordre de grandeur, pas d'animation. [charles-masse/portfolio] |
| **VAT** (vertex animation texture) | on cuit l'animation : chaque sommet, à chaque image, est stocké dans une texture ; le shader relit | 0 calcul processeur par image, 2 lectures de texture par sommet | **Recommandé.** Utilisé en Unity/Unreal pour les foules. |
| VAT « rig » (texture d'os au lieu de sommets) | on stocke la pose des os (2 texels par os et par image), le shader déforme le maillage | texture ~100 fois plus petite, cuisson en millisecondes, plus de lectures par sommet | Variante la plus économe en mémoire. [three-vat] |
| Skinning instancié par texture d'os | la texture d'os porte une ligne par instance (`texelFetch(boneTexture, ivec2(j, gl_InstanceID))`) | calcul des poses encore côté processeur | Possible, mais le processeur recalcule 3 200 squelettes. Écarté. |
| InstancedMesh2 (agargaro) | bibliothèque avec skinning instancié, 5 LOD générés par meshoptimizer, animation seulement dans le champ de la caméra, cadence d'animation réduite avec la distance | démo de 3 000 instances animées (aucun chiffre d'i/s donné dans la source) | Bonnes idées à copier (cadence selon distance). |
| Imposteurs animés (sprites en atlas, octaédriques) | à distance, un carré texturé remplace le modèle 3D | le moins cher | Pour la foule lointaine seulement. |
| Calcul GPU (WebGPU) | exemple officiel three.js « skinning instancing individual » | nécessite WebGPURenderer | Hors r128 et fragile en salle de démo. Écarté. |

Exemples utiles :
- **three-vat** (MIT, MikeFernandez-Pro) : cuit un clip glTF en texture à l'exécution, « centaines à milliers » d'instances, 1 draw call par matériau, ombres correctes, clips mélangés dans une même foule, décalage de départ par personne. Limites : pas de fondu entre clips (donc marche → attente = coupure sèche), pas d'IK, mémoire = sommets × images × 16 o × 2 textures (mode sommets). **Exige three >= 0.186 : incompatible avec r128 sans montée de version.**
- Le portfolio de foule de charles-masse (three.js + bibliothèque Yuka) : VAT + variations de textures dans le fragment shader + arbre spatial (KdTree) pour les voisins. Il choisit volontairement un style pictogramme plutôt que réaliste (« la vallée de l'étrange vieillit mal »).
- Fil three.js « One Draw Call, Massive Crowd » : foule dessinée en un seul InstancedMesh, détail réduit dans le shader selon la distance et l'orientation, mises à jour étalées sur plusieurs images ; l'auteur annonce 240 i/s jusqu'à 100 000 silhouettes très simples sur son poste (silhouettes procédurales, pas des modèles animés).
- Imposteurs : `three-octahedral-impostor` (Ctrlmonster, expérimental, « très bricolé »), `sweriko/Horde` (WebGPU, TSL). Aucun n'est prêt pour r128.

### Compatibilité r128 (important)
- r128 sait faire : InstancedMesh, InstancedBufferAttribute, `onBeforeCompile` (injecter son code dans le shader standard), DataTexture flottante RGBA32F, WebGL2 par défaut donc `texelFetch` disponible.
- r128 ne sait pas : les paquets modernes (three-vat >= 0.186, WebGPU). Deux chemins :
  - **A. Rester en r128** et écrire nous-mêmes la lecture de VAT (environ 80 à 120 lignes de shader + un script de cuisson hors ligne ou au chargement). Plus de contrôle, plus de travail.
  - **B. Monter three** (r160 ou plus) via importmap, puis utiliser three-vat. Risque : le reste de la maquette (matériaux, ACES, éclairage) peut changer d'aspect ; à tester sur une copie. Non vérifié chez nous.
  - Recommandation : A pour la démo si on garde r128 « sans build » ; B seulement si Adem accepte un test de non-régression visuelle d'une heure.

## 3. Modèles humains libres de droits
| Source | Licence | Contenu | Poids | Pour nous |
|---|---|---|---|---|
| **Kenney – Mini Characters** | CC0 | personnages mini, 7 os, 32 clips ; exemple : 876 triangles, 267 Ko (+ colormap.png séparée) | très léger | **Meilleur rapport poids/animation**, style simple, nombreux clips d'attente/marche/course. Variété : à vérifier (nombre de personnages dans le pack). |
| Kenney – Animated Characters Retro / Survivors | CC0 | 8 personnages chacun, clips idle/walk/run partagés | léger | Variété de silhouettes, style ludique. |
| **Quaternius – Ultimate Animated Characters** | CC0 | exemple Casual_Female : 6 624 triangles, 23 os, 17 clips, couleurs de matériau, 1,7 Mo | moyen | Plus réaliste mais trop lourd tel quel : 3 200 × 6 600 = 21 M triangles. Utilisable en LOD proche seulement. |
| Quaternius – Ultimate Modular Men/Women | CC0 (femmes : CC0 ou CC-BY selon fichier, à vérifier) | 10-11 personnages de 4 pièces interchangeables, 24 animations | léger | **Variété par assemblage** (tête, torse, jambes, pieds) : bon pour varier les tenues. |
| Quaternius – Universal Base Characters | CC0 | 6 corps (adulte, ado, formes homme/femme) + 20 coiffures, ~13 000 triangles | version gratuite 122 Mo | Trop lourd pour la foule ; à décimer (réduire les triangles dans Blender) si on veut du réalisme proche. |
| Quaternius – Universal Animation Library 1 et 2 | CC0 | 120+ et 130+ animations sur un squelette humanoïde universel (marche, course dans 8 directions, assis…) | version gratuite 15 Mo (Standard, partielle) ; complète 41 Mo à 9,99 $ | Bibliothèque de mouvements pour varier les démarches. La version gratuite contient une partie seulement. |
| KayKit (Kay Lousberg) | CC0 | personnages stylisés bas poly, 75-90 animations, atlas 1024² réductible à 128² | léger | Style « jeu d'aventure », pas urbain. |
| **Mixamo** (Adobe) | gratuit, usage commercial libre selon la FAQ Adobe ; interdit de redistribuer ou vendre les fichiers bruts, d'entraîner une IA | personnages et animations humanoïdes à télécharger un par un, compte Adobe requis | léger à moyen | **Licence utilisable pour une démo**, mais ce n'est pas du CC0 : on ne met pas les fichiers bruts dans un dépôt public ni en téléchargement libre. Les animations (marche, course) sont de bonne qualité réaliste. Le dépôt est-il public ? À trancher. |
| Ready Player Me | service arrêté le 31 janv. 2026 (racheté par Netflix) | — | — | **Écarté**, n'existe plus. |
| Poly Pizza | agrégateur ; licence par fichier (CC0 ou CC-BY) | — | — | Vérifier la licence modèle par modèle. |

Variété (couleurs, tailles, genres) sans multiplier les modèles : 3 à 5 corps de base × une teinte de vêtement et de peau par instance (attribut par instance lu dans le shader) × échelle de taille 0,92-1,08 × 2-3 familles d'accessoires (sac, manteau) en pièces séparées. Le shader modulant la couleur est précisément ce que la recherche cite pour masquer les clones.

## 4. Ce qui rend une foule crédible (preuves)
Études de perception (ACM, SCA/SIGGRAPH) :
- **Clones d'apparence** : plus faciles à repérer que les clones de mouvement. La modulation de couleur et la séparation spatiale les masquent bien (« Clone attack! », 2008).
- **Variété de mouvement** : il faut au moins 3 démarches distinctes par genre ; 2 ne suffisent pas (« Perceiving human motion variety », 2011). Le facteur dominant est le nombre de mouvements clonés, pas la taille de la foule ni la vitesse.
- **Glissement de pieds** (foot sliding, le pied qui patine sur le sol) : perceptible dès moins de 21 mm dans la plupart des conditions (SCA 2011). Donc : lier la cadence des pas à la vitesse réelle de la personne.
- **Collisions** : des spectateurs perçoivent des interpénétrations jusqu'à ~0,6 m d'écart entre deux personnes qui se croisent ; des mouvements d'épaules à l'approche réduisent nettement la perception de collision et augmentent le naturel (Pettré et al., 2016). Cet effet s'estompe en foule dense.
- **Collisions relâchées** : la caméra inclinée (vue de dessus) et la distance changent ce que l'œil détecte ; on peut tolérer plus de chevauchement loin de la caméra (2011).
- **Imposteurs** : deux imposteurs ne s'interpénètrent pas ; un croisement de face se voit comme un changement brutal d'ordre de profondeur, donc ils trahissent la collision (même article).

Traduit en règles pour nous :
1. Cadence de pas = vitesse / longueur de foulée ; une vitesse nulle déclenche l'animation d'attente, une vitesse élevée la course. Fondu manuel entre clips (plateau de 0,2 s) ou, à défaut, changer de clip à un moment où les pieds sont au sol.
2. Orientation lissée vers la direction de déplacement (rotation limitée en degrés par seconde), jamais de rotation instantanée.
3. Décalage de phase aléatoire par personne et vitesse de lecture ±8 %.
4. Petits groupes (2 à 4 personnes) avec même vitesse et espacement : on en voit dans toute vraie foule et ils lisent comme « des vraies personnes ». Flag de groupe dans la simulation de Sullyvan.
5. Ombre de contact : un disque sombre flou sous chaque personne (une seule texture de 64 px, mêmes instances), bien moins coûteux que des ombres projetées pour 3 200 personnes.
6. Occlusion ambiante au sol le long des murs et sous les escaliers (peinte dans la texture ou en dégradé).
7. Épaules et tête : léger roulis et balancier des bras proportionnels à la vitesse (déjà cuit dans l'animation de marche).

## 5. Ce qui donne l'impression de collision réelle à l'écran
- Ce n'est pas l'absence de chevauchement qui compte, c'est que les gens **réagissent** : ralentir, dévier, se tourner d'épaule à l'approche (voir étude 2016).
- Distance minimale visuelle entre centres : rayon d'épaule ~0,22 m, donc deux personnes ne devraient jamais approcher à moins de ~0,4 m sans réaction visible. Vérifier que le rayon de la simulation et celui du modèle sont les mêmes (sinon on voit des corps fusionnés alors que la physique dit « pas de contact »). À vérifier chez nous.
- Aucune personne ne traverse un mur ni ne reste collée : contrainte déjà exigée par Adem ; côté rendu, afficher le modèle un peu en retrait du mur (0,15 m).
- En forte densité (écrasement), animation de « bousculade » : ralentissement de la cadence, tête qui se tourne, léger balancement du torse, pas de bond vertical.
- Le rebond vertical actuel doit disparaître : le balancement vient de l'animation cuite, pas d'un mouvement d'ensemble du corps.

## 6. Sols, escaliers et escalators : que changer pour que les gens soient « posés »
(Fondé sur les principes ci-dessus et sur la demande d'Adem ; je n'ai pas relu les matériaux de la maquette.)
- **Hauteur de pied exacte** : la position verticale de chaque personne lit la hauteur du sol en ce point (carte de hauteurs ou liste de rampes/escaliers/escalators), jamais une hauteur de niveau constante. Un pied qui flotte ou s'enfonce de 3 cm se voit.
- **Escaliers** : modéliser de vraies marches (ou une rampe + texture de marches) ; la personne monte avec une hauteur qui suit la marche (lissée), animation de montée si disponible (clip « stairs » de la bibliothèque Universal Animation) sinon marche normale inclinée très légèrement.
- **Escalators** : marches mobiles visibles (texture défilante sur une bande + nez de marche en métal), personne **immobile** sur la marche ou qui marche lentement, posée à la hauteur de la rampe, orientée dans le sens du mouvement ; garde-corps (balustrades) avec main courante. Aujourd'hui, si les gens glissent sur un plan incliné sans marches, c'est ce qui trahit la maquette.
- **Sols** : textures CC0 Poly Haven à vraie échelle (carrelage 0,6 m ; béton ; bitume), normal map légère, joints visibles ; décalques sous les piliers ; bandes podotactiles et lignes jaunes de quai ; reflet léger (roughness 0,6-0,8) sans réflexions en temps réel.
- **Ombres** : lumière directionnelle faible avec une seule carte d'ombres de bâtiment ; ombres de contact pour les personnes (point 5 de la section 4).
- **Éclairage de nuit « Synoptique »** : lumières ponctuelles émissives fictives (bandes lumineuses) plutôt que de vraies lumières dynamiques ; bloom léger. ACES est déjà retenu.

## 7. Plan recommandé
### Objectif de performance (budget, estimations à valider par mesure)
- Triangles à l'écran : viser < 3 M par image. 3 200 × 876 (Kenney) = 2,8 M : limite haute, d'où le LOD.
- Mémoire de texture VAT : environ 600 sommets × 90 images (3 clips × 30 images) × 16 o × 2 = 1,7 Mo en mode sommets, quelques dizaines de Ko en mode os. Estimation de calcul d'après la formule de three-vat, pas une mesure.
- Poids de téléchargement : 3 à 5 modèles + textures ≈ 3 à 6 Mo.
- Temps d'image : cible 60 i/s = 16,6 ms. Budget indicatif : foule 4 ms, décor 6 ms, simulation (autre fil) 3 ms, réserve 3 ms. **À mesurer ; je n'ai aucune mesure sur notre scène.**

### Étapes
1. **Spike d'une heure** : un modèle Kenney, VAT maison en r128, 3 200 copies sur la scène existante. Mesurer i/s et ms GPU (outil Stats + `renderer.info`). Point de décision : si ≥ 55 i/s sur le portable de démo, on continue.
2. Ajouter 3 clips (attente, marche, course) ; cadence liée à la vitesse ; décalage de phase.
3. Variété : 3-5 corps, couleur de vêtement/peau/taille par instance, 2 familles d'accessoires.
4. LOD à 2 niveaux : proche (≤ 25 m) modèle complet ; loin, modèle à ~300 triangles (même VAT réduit) ou capsule teintée sans animation au-delà de 80 m.
5. Ombres de contact ; réaction d'épaule aux croisements serrés (petit clip additionnel ou inclinaison de torse par shader) ; groupes.
6. Sols/escaliers/escalators (section 6).
7. Vérification dans un vrai navigateur sur la machine de démo, à 3 200 puis 5 000 personnes, avec capture.

### Risques
- Pas de fondu entre clips en VAT simple : on voit un saut de pose. Parade : changer de clip aux moments pieds-au-sol, ou cuire des clips de transition.
- Cuisson de l'animation : si les clips ont des échelles d'os non uniformes, les normales sont approximatives (signalé par three-vat).
- Textures flottantes sur un GPU intégré : plafond de taille (souvent 4096 à 8192 sur mobile) ; prévoir peu d'images par clip.
- Mélange de styles : un Mixamo réaliste dans un décor cartoon jure. Choisir un registre.
- Licence Mixamo si le dépôt est public (voir section 3).
- Effet « vallée de l'étrange » : plus le modèle est réaliste, plus les défauts se voient.

## 8. Option « 2,5D / schématique propre » (si le réalisme complet coûte trop)
- **Silhouettes stylisées type pictogramme** : corps unique de ~300 triangles, couleur unie par instance (teinte de statut : rapide, lent, bloqué), VAT de marche/attente, ombre de contact. Rend lisible un mouvement de foule à 5 000 personnes et reste très fluide.
- Avantage décisif pour la démo : on lit tout de suite l'**information** (densité, blocage, flux) ; chaque personne reste visiblement vivante, sans le risque de défauts réalistes. Cohérent avec le premier écran « Synoptique ».
- Variante mixte (celle que je recommande si le spike échoue) : réalisme moyen pour les 300 personnes les plus proches de la caméra, silhouettes propres pour le reste. Le LOD de l'étape 4 le permet déjà.

## 9. Ma recommandation (une ligne)
Rester en r128, VAT écrit par nous, modèles Kenney Mini Characters (variété par shader) pour la foule, 3 démarches de la bibliothèque Quaternius ou Mixamo selon décision de licence, ombres de contact, hauteur des pieds lue sur le sol réel ; spike d'une heure avant de s'engager. Option écartée la plus forte : monter three à >= 0.186 pour utiliser three-vat tel quel (moins de code, mais risque de régression visuelle).

## Sources
- three-vat : https://github.com/MikeFernandez-Pro/three-vat (MIT, v3, three >= 0.186)
- charles-masse/portfolio : https://github.com/charles-masse/portfolio
- Fil three.js « One Draw Call, Massive Crowd » : https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928
- Fil three.js skinning instancié + démo InstancedMesh2 : https://discourse.threejs.org/t/animated-instanced-skinned-meshes-gltf/41958?page=2
- Exemple three.js WebGPU skinning instancié : https://github.com/mrdoob/three.js/blob/9813ee76/examples/webgpu_skinning_instancing_individual.html
- Imposteurs : https://github.com/Ctrlmonster/three-octahedral-impostor ; https://github.com/sweriko/Horde
- Quaternius : https://quaternius.com/packs/universalanimationlibrary.html ; https://quaternius.com/packs/universalbasecharacters.html ; https://quaternius.itch.io/universal-base-characters ; https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ ; https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN
- Kenney : https://kenney.nl/assets/mini-characters ; https://kenney.nl/assets/animated-characters ; tailles et triangles via https://app.cinevva.com/game-assets/free-3d-character-models
- KayKit : https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
- Mixamo FAQ : https://helpx.adobe.com/ee/creative-cloud/faq/mixamo-faq.html ; https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775
- Ready Player Me arrêté : https://techcrunch.com/2025/12/19/netflix-acquires-gaming-avatar-maker-ready-player-me
- Perception : https://dl.acm.org/doi/10.1145/1399504.1360625 (clones) ; https://dl.acm.org/doi/10.1145/2077451.2077468 (variété) ; https://dl.acm.org/doi/10.1145/2019406.2019444 (glissement de pieds) ; https://dl.acm.org/doi/10.1145/2070781.2024172 (collisions) ; https://dl.acm.org/doi/10.1145/2897824.2925931 (épaules)
