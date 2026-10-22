# 06 - Science des foules et calibrage de la simulation

Périmètre : défensif uniquement (dimensionner et comparer des parades d'évacuation). Aucune modélisation de nuisance. Règle : chaque valeur porte une URL ; sinon « à vérifier » ou « choix de démo ».

## 1. Valeurs par défaut de la démo (à figer dans un fichier `params.yaml`)

| Paramètre | Valeur démo | Plage de sensibilité | Source / statut |
|---|---|---|---|
| Vitesse libre moyenne | 1,34 m/s | 0,97 à 1,65 | Weidmann 1993, cité par Daamen et Hoogendoorn : http://vigir.missouri.edu/~gdesouza/Research/MobileRobotics/Free%20Speed%20Distributions%20for%20Pedestrian%20Traffic,%20Winnie%20Daamenl%20and%20Serge%20P.%20Hoogendoorn,%20TRB%202006%20Annual%20Meeting.pdf |
| `v0` par défaut JuPedSim | 1,2 m/s | tirer en loi normale autour de 1,2 à 1,34 (écart-type choix de démo) | https://jupedsim.org/v1.0.3/api/jupedsim/models |
| Rayon d'agent (CFSM) | 0,2 m (défaut) ; tutoriels utilisent 0,12 | 0,15 à 0,25 | https://jupedsim.org/v1.0.3/api/jupedsim/models ; https://www.jupedsim.org/stable/notebooks/getting_started.html |
| `time_gap` (CFSM) | 1,0 s | 0,8 à 1,2 | https://jupedsim.org/v1.0.3/api/jupedsim/models |
| Répulsion voisins CFSM : force / portée | 8,0 / 0,1 | ne pas toucher avant calibrage | idem |
| Répulsion géométrie CFSM : force / portée | 5,0 / 0,02 | idem | idem |
| Débit spécifique de porte (capacité de calcul) | 1,3 pers/s/m de largeur utile | 1,2 à 1,8 selon études | PD 7974-6 cité : https://firestrategy.ai/tools/aset-rset-calculator ; fourchette 1,2 à 1,8 : https://ar5iv.labs.arxiv.org/html/0810.1945 |
| Débit de référence en pers/min/m | 80 (soit 1,33 pers/s/m) | | https://thefpa.co.uk/news/turn-of-events |
| Densité statique max dans escalier/couloir (dimensionnement) | 3,8 pers/m² | | https://thefpa.co.uk/news/turn-of-events |
| Densité critique (débit max) | ne pas fixer : la littérature va de 1,75 à 7 pers/m² | utiliser la mesure de la démo | https://ar5iv.labs.arxiv.org/html/0810.1945 |
| Densité où la vitesse tend vers 0 | 3,8 à 10 pers/m² selon études | | idem |
| Pré-mouvement cinéma, alarme vocale | total moyen 44 s (min 17, max 138, écart-type 18) ; loi log-logistique | | https://link.springer.com/content/pdf/10.1007/s10694-019-00881-1.pdf |
| Pré-mouvement cinéma, sirène | moyenne 30 s (14 à 179, ET 28) ; log-normale | | idem |
| Pré-mouvement cinéma, cloche | moyenne 32,5 s (11 à 224, ET 17) ; log-logistique | | idem |
| Vitesse de descente d'escalier | à vérifier (plus faible que le plat ; ne pas réutiliser 1,34) | | piste : https://sciencedirect.com/science/article/pii/S0925753523000103 |
| Part de groupes (familles, trois personnes) | 20 à 30 % des agents (choix de démo, à vérifier) | | effet qualitatif : https://pmc.ncbi.nlm.nih.gov/articles/PMC4364745 |

Remarque importante : l'alerte du scénario est une alerte « trouble à l'ordre public », pas un incendie. Les temps de pré-mouvement ci-dessus viennent d'exercices d'évacuation incendie en cinéma ; ils servent de point de départ prudent, pas de vérité. Le pré-mouvement réel dépend de la crédibilité perçue du signal (à vérifier, aucune source obtenue). Documenter cette hypothèse dans la démo.

## 2. Notions à maîtriser (réponse en 30 secondes pour le jury)

- **ASET / RSET** : on est en sécurité si RSET (temps requis) est inférieur à ASET (temps disponible), avec une marge. RSET = détection + alarme + pré-mouvement + déplacement : https://magnus-opifex.co.uk/blog/evacuation-modelling-pedestrian-dynamics-uk-2026. Pour un scénario ordre public, ASET n'est pas calculable comme pour un feu : le présenter comme « seuil de temps fixé par hypothèse » (à vérifier avec un spécialiste).
- **Diagramme fondamental** : relation densité, vitesse, flux. Les valeurs publiées divergent fortement à haute densité, en partie à cause de la méthode de mesure (moyenne dans le temps ou dans l'espace) : https://ar5iv.labs.arxiv.org/html/0810.1945. Conséquence : ne jamais prétendre « le » bon diagramme ; comparer le modèle à une courbe de référence et à l'archive Jülich.
- **Goulot** : le débit croît presque linéairement avec la largeur au-delà de 0,6 m (même source ar5iv). Conséquence directe pour la démo : le temps d'évacuation est dominé par la largeur utile des sorties et par la file qui se forme devant, pas par la vitesse de marche.
- **Densité et risque** : environ 5 pers/m² l'espace est cramponné mais gérable ; 8 à 10 pers/m² les personnes sont pressées les unes contre les autres : https://kiwix.enszfarms.org/content/wikipedia_en_all_maxi_2025-08/Crowd_collapses_and_crushes. Seuils par niveau de service (Fruin, limite A à F, F au-delà d'environ 5,4 pers/m²) : https://crowdmanagementindia.com/post/crowd-density-and-level-of-service-the-science-behind-safe-crowd-management. Les décès par compression viennent de la pression des corps, pas du piétinement : https://scienceinsights.org/what-is-a-crowd-crush-and-why-is-it-so-deadly (source secondaire, à vérifier). Seuil d'alerte conseillé pour la démo : 4 pers/m² = mouvement restreint (Still, relayé par https://survipedia.com/security/crowd-dynamics, secondaire) ; 5 pers/m² = zone rouge.
- **Comportement** : on suit les autres (herding) et on est attiré par la porte où d'autres vont : https://pmc.ncbi.nlm.nih.gov/articles/PMC8319842 ; https://www.sciencedirect.com/science/article/abs/pii/S0925753515002763. Les groupes sociaux (trois personnes) ont des pré-mouvements plus longs et des trajets plus longs, mais pas de vitesse moyenne différente ni de différence devant la porte : https://pmc.ncbi.nlm.nih.gov/articles/PMC4364745. Les familles reviennent chercher leurs proches (retour en arrière) : https://sciencedirect.com/science/article/pii/S0379711219305521.
- **Itinéraire connu ou non** : les occupants préfèrent les lieux familiers (entrée d'origine) : https://ieeexplore.ieee.org/document/7053147. Proposition de modélisation : 70 % des agents vont vers la sortie qu'ils connaissent (celle de l'entrée), 30 % vers la plus proche ou vers la foule (choix de démo, à vérifier).

## 3. Normes et validation

| Sujet | Contenu utile | URL |
|---|---|---|
| ISO 20414:2020 | Protocole de vérification et validation des modèles d'évacuation de bâtiments ; vise surtout les modèles microscopiques (agents) | https://iso.org/cms/%20render/live/en/sites/isoorg/contents/data/standard/07/83/78348.html?browse=ics |
| Texte complet de l'ISO | payant (environ 215 USD) ; ne pas prétendre l'avoir lu | https://pdfnorm.com/product/categories/13/13-220/13-220-01/bs-iso-204142020 |
| Méthode du débit en PD 7974-6 | exemple de calcul : 200 personnes, porte 0,75 m, 1,3 pers/s/m donne 205 s ; Approved Document B (1,33 pers/s/m) donne 143 s sur 1 050 mm | https://firestrategy.ai/tools/aset-rset-calculator |
| Données de référence | archive ouverte Jülich (DOI 10.34735/ped.da), expériences de goulots, couloirs, croisements | http://ped.fz-juelich.de/db ; description : https://juser.fz-juelich.de/record/874883/files/50-394-1-PB.pdf?subformat=pdfa&version=1 |
| Diagrammes comparés | thèse J. Zhang (Jülich) | http://juser.fz-juelich.de/record/128157/files/FZJ-2012-01052.pdf |
| Données de théâtre (exercices) | route choice et débit par porte | https://link.springer.com/article/10.1007/s10694-018-0783-2 |

Ce que la démo peut honnêtement affirmer : « modèle vérifié sur des cas simples (vérification) et comparé qualitativement aux données Jülich (validation partielle) ; non certifié ISO 20414 ». Ne pas écrire « validé conforme ».

## 4. Moteurs

| Moteur | Rôle | Paramètres / usage | URL |
|---|---|---|---|
| JuPedSim | moteur principal Python | `pip install jupedsim` ; `jps.Simulation(model=jps.CollisionFreeSpeedModel(), geometry=..., trajectory_writer=jps.SqliteTrajectoryWriter(...))` ; `add_exit_stage(polygone)` ; agents via `CollisionFreeSpeedModelAgentParameters(journey_id, stage_id, position, radius)` | https://www.jupedsim.org/stable/notebooks/getting_started.html |
| CFSM (défauts) | voisins 8,0 / 0,1 ; géométrie 5,0 / 0,02 ; `v0` 1,2 ; rayon 0,2 ; `time_gap` 1,0 | idem | https://jupedsim.org/v1.0.3/api/jupedsim/models |
| GCFM | `tau` 0,5 ; `v0` 1,2 ; `mass` 1 ; `a_min` 0,2 ; `b_min` 0,2 ; `b_max` 0,4 ; répulsion voisins 0,3 | modèle à forces, plus de paramètres à régler | idem |
| Variantes | CollisionFreeSpeedModelV2 et V3 (direction et vitesse découplées) | | https://jupedsim.org/stable/pedestrian_models/collision_free_speed_model_v3.html |
| Géométrie | polygones `shapely` (aire praticable moins obstacles) ; goulots et files dans les tutoriels | https://jupedsim.org/stable/notebooks/getting_started.html ; https://jupedsim.org/v1.0.3/notebooks/double-bottleneck.html |
| Files d'attente | tutoriel d'attente à des portes | https://jupedsim.org/v1.1.1/notebooks/queues_waiting.html |
| Mesure | PedPy (WalkableArea, analyses de densité et de flux) cité dans les tutoriels | https://jupedsim.org/v1.0.3/notebooks/double-bottleneck.html |
| Vadere | alternative Java open source, plusieurs modèles de locomotion | https://vadere.org ; https://github.com/pedestrian-dynamics-HM/vadere |
| SUMO | piétons dans les rues extérieures, couplé aux véhicules ; non pertinent pour l'intérieur | http://sumo-sim.org/userdoc/Simulation/Pedestrians.html |

Installation sous Windows : `pip install jupedsim` est la commande documentée ; les versions de Python supportées et la disponibilité des wheels Windows n'ont pas été confirmées par la page lue : à vérifier (essayer Python 3.11 ou 3.12 dans un venv ; prévoir `pip install shapely pedpy matplotlib`). Faire ce test dans les 10 premières minutes. Plan B : modèle maison (agents + vitesse libre + file à chaque sortie avec débit 1,3 pers/s/m), qui reproduit déjà l'effet goulot.

## 5. Protocole de benchmark avant/après en une heure

Principe : une seule variable change entre « avant » et « après » (la parade), 20 graines aléatoires par scénario, mêmes foule et géométrie.

| Minute | Action |
|---|---|
| 0-10 | Installer, lancer l'exemple « getting started », figer `params.yaml` |
| 10-20 | Test de vérification : une porte de 1 m, 200 agents. Débit attendu entre 1,2 et 1,8 pers/s/m (https://ar5iv.labs.arxiv.org/html/0810.1945). Hors plage : corriger avant d'avancer |
| 20-30 | Scénario « avant » : sorties actuelles, pré-mouvement tiré des lois cinéma, 20 graines |
| 30-45 | Scénario « après » : une parade à la fois (élargir une sortie, ouvrir une sortie fermée, alerte échelonnée par salle, fléchage vers la sortie sous-utilisée, personnel de guidage) |
| 45-55 | Calculer, tracer, comparer (médiane et intervalle sur 20 graines) |
| 55-60 | Rédiger : hypothèses, limites, non-certification |

Métriques :

| Métrique | Définition | Seuil de lecture |
|---|---|---|
| Temps total d'évacuation | instant où le dernier agent sort | à comparer au RSET fixé |
| T90 | instant où 90 % des agents sont sortis | plus robuste que le dernier agent (traînards) |
| Densité maximale | max de la densité locale (cellules de 1 m² ou 2 m, lissées sur 1 s à 2 s) | alerte 4 pers/m², rouge 5 pers/m² |
| Goulots | zones où densité supérieure à 4 pers/m² pendant plus de 10 s (seuil de démo) et flux saturé | liste classée |
| Flux par sortie | pers/s et pers/s/m, courbe cumulée par sortie | comparer à 1,3 pers/s/m |
| Équilibre des sorties | part des agents par sortie | détecte une sortie ignorée |

Rapporter pour chaque métrique : médiane, 5e et 95e centile, gain relatif en % entre avant et après. Choisir la mesure de densité une fois pour toutes, car la méthode change les valeurs de façon importante (https://ar5iv.labs.arxiv.org/html/0810.1945).

## 6. Erreurs qui rendent une simulation non crédible

1. Tout le monde bouge à t = 0 : pas de pré-mouvement. Utiliser les lois du tableau 1.
2. Une seule vitesse pour tous : tirer une distribution (0,97 à 1,65 m/s).
3. Sorties sans débit limité ou largeur ignorée : le goulot disparaît. Vérifier 1,2 à 1,8 pers/s/m.
4. Géométrie trop simplifiée (pas d'escaliers, de portes réelles, de piliers) : cotes sans source = à vérifier sur plan.
5. Même vitesse dans les escaliers qu'à plat.
6. Tous les agents choisissent la sortie la plus proche : ignorer suivi de foule, itinéraire connu et groupes.
7. Pas de graines multiples : un seul run n'est pas un résultat.
8. Densité mesurée sans méthode déclarée, ou grille trop fine (valeurs absurdes).
9. Agents qui se chevauchent à haute densité sans le signaler : le modèle CFSM évite les collisions, il ne modélise pas la pression des corps ni les chutes ; ne pas conclure sur des blessures à partir de lui.
10. Comparaison avant/après avec deux changements simultanés.
11. Affirmer une certification ISO 20414 ou une prédiction réelle : à éviter, annoncer « outil de comparaison de parades ».
12. Importer des hypothèses incendie sans le dire (voir remarque section 1).
13. Aucune comparaison à une donnée empirique (Jülich) ni test de sensibilité sur `v0`, rayon, pré-mouvement.

## 7. Garde-fous défensifs

Le livrable compare des parades de gestion de sortie (largeur, signalisation, échelonnement, guidage). Il ne contient ni scénarios de nuisance ni positionnement d'un agresseur ; l'alerte est une entrée de pré-mouvement uniquement. Les résultats ne remplacent pas une étude de sécurité par un bureau agréé.

## Résumé en 5 lignes

1. Valeurs de départ : vitesse 1,34 m/s (0,97 à 1,65), `v0` JuPedSim 1,2, rayon 0,2, `time_gap` 1,0, débit 1,3 pers/s/m, pré-mouvement cinéma de 30 à 44 s en moyenne (cloche, sirène, voix).
2. Le goulot (largeur des sorties) domine le temps d'évacuation ; densité d'alerte 4 pers/m², rouge 5 pers/m².
3. Validation : ISO 20414 (payant, non lu) et archive Jülich ouverte ; annoncer « non certifié ».
4. Protocole d'une heure : test de porte à 10 min, avant/après à 20 graines, métriques temps total, T90, densité max, goulots, flux par sortie.
5. Points à vérifier : installation Windows de `jupedsim` (version Python), vitesse en escalier, pré-mouvement pour une alerte de type ordre public (données incendie utilisées), parts de groupes et de connaissance de l'itinéraire.
