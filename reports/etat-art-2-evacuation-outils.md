# État de l'art 2 : outils de simulation d'évacuation et de foule

Décision débloquée : où l'équipe est originale, où elle réinvente.
Méthode : une recherche web par thème (extraits de recherche, rarement les pages complètes). `[?]` = non vérifié ou source unique/commerciale. Aucun choix pour l'équipe.

## 1. Version simple

- Un simulateur de foule, c'est un jeu vidéo sans joueur : des milliers de « personnages » (agents) suivent des règles de déplacement dans un plan. Les outils existent depuis 25 ans et sont solides pour un bâtiment ou une gare.
- Ce qui coûte cher n'est pas la simulation. C'est de **construire le décor** à la main (murs, portes, escaliers) à partir de plans CAO/BIM, souvent « enrichis à la main » [source 2a].
- Peu de choses prouvées pour « n'importe quel lieu en France à partir de données ouvertes » : la recherche le fait en prototype (OSM, IFC), les vendeurs le promettent en conceptuel (Esri, juillet 2026) [?].
- Ce qui est établi pour justifier un résultat devant l'administration : des **tests de vérification** (NIST TN 1822, RiMEA, IMO 1533, ISO 20414). Une démo « jolie » sans cela n'est pas défendable en bureau d'études.
- Les cas réels (Hajj, Itaewon, Stade de France) montrent que la simulation sert surtout à **décider un plan** (horaires, sens uniques, filtrage), pas à prédire un chiffre exact.
- Côté IA/LLM : des démos 2024-2026, sur des mondes synthétiques (grille, ville fictive), **non validées sur des données de terrain**.
- Espace libre probable : le pont « lieu réel automatique » + « comparer des décisions » + « justifier le résultat ». À discuter, voir §7.

Mini-lexique (1re mention) : **agent** = personnage simulé. **BIM/IFC** = maquette numérique du bâtiment et son format d'échange. **CAO/DWG/DXF** = plans dessinés. **OSM** = OpenStreetMap, carte libre. **LiDAR** = scan laser 3D. **V&V** = vérification (le code fait ce qu'on croit) et validation (le modèle ressemble au réel). **Modèle de forces sociales** = les agents sont « poussés » par des forces (but, voisins, murs).

## 2. Les outils (ce qu'ils simulent, entrée, prix, clients)

| Outil | Ce qu'il simule | Entrée | Prix connu | Clients cités |
|---|---|---|---|---|
| Pathfinder (Thunderhead) | Évacuation, agents, comportements | Import IFC, DXF, DWG, FBX, OBJ, glTF ; extraction de sol assistée [1] | Abonnement annuel ~2 350 à 3 750 USD selon page (les pages se contredisent) [2] | [?] non relevés |
| MassMotion (Oasys, filiale d'Arup) | Flux piétons, gares, aéroports, stades | Modèle 3D importé | Anciens chiffres : ~20 000 £ perpétuel ; Flow ~5 000 £ [3] ; à confirmer | Arup cité pour transport, stades, Hajj [4] ; pas de client précis trouvé |
| LEGION (Bentley) | Flux piétons denses, gares | Model Builder (plans) | À partir de 16 330 USD / 12 mois [5] | SYSTRA pour la gare du Nord (Paris) [5] |
| Vadere | Recherche, modèles interchangeables | Fichier texte `.scenario` (JSON), dessiné à la main [6] | Gratuit, open source (LGPL) | Académique (Munich) |
| JuPedSim | Bibliothèque Python, 2 modèles de mouvement | Géométrie en code | Gratuit (LGPLv3) [7] | Jülich ; recherche |
| SUMO | Trafic (voitures) + piétons | Import OSM direct (`netconvert`, option piétons) [8] | Gratuit | DLR ; [?] |
| AnyLogic | Simulation généraliste, bibliothèque piétons | Dessin des murs sur un fond de plan [9] | Édition payante [?] | [?] |
| buildingEXODUS (Greenwich) | Évacuation + feu et toxicité | Plans | ~3 900 USD chez un revendeur [10] | [?] |
| Simulex (IES), STEPS (Mott MacDonald) | Évacuation de bâtiments | Plans | Non trouvé | Non trouvé |
| Esri + uCrowds (SimCrowds) | Foule d'événement dans un jumeau 3D ArcGIS | Données 2D d'événement → 3D | Non public | Pays-Bas : Crowdcom, Nijmegen Quatre Jours ; Esri, juil. 2026, workflow « conceptuel » [11][12] |
| Hexagon, Siemens, Cityzenith | Rien de précis sur la foule trouvé | | | [?] Non vérifié, à ne pas affirmer |
| Fujitsu « répétition numérique » | Démo d'évacuation de festival (CEATEC 2026) | | | Démo, pas un produit déployé [13] |

Remarque : les prix sont des ordres de grandeur trouvés sur des pages parfois contradictoires. Aucun client public français précis n'est établi hors SYSTRA / gare du Nord (étude de conception, pas de crise).

**Lecture** : tous ces outils sont des **moteurs**. Aucun trouvé qui promette « un lieu réel en 3D automatique + comparaison de décisions de crise » en grand public.

## 3. Le goulot d'entrée : modéliser le lieu

- Chiffre en heures d'ingénieur : **non trouvé** dans mes recherches [?]. Ne pas annoncer « X heures » sans mesure. Pistes pour le mesurer : webinaires Thunderhead FEMTC, études de cas bureaux d'études.
- Ce qui est documenté : l'import BIM vers un simulateur est « un sens unique », avec perte d'information ; les IFC doivent être « enrichis à la main » dans Pathfinder [14]. Les modèles d'évacuation sont encore le plus souvent construits à la main [15].
- Importeurs existants :
  - IFC/BIM : le plus mûr. Pathfinder lit l'IFC [1] ; Evac4BIM (complément Revit, open source) [14] ; conversion IFC vers réseau pour EVACNET4 (2018) [15].
  - OSM : SUMO importe OSM, avec trottoirs [8] ; prototype de recherche à Osaka avec modèle de champ de potentiel (2025) [16]. Mais OSM ne décrit pas les entrées de bâtiments ni les marches en détail [?].
  - CAD/plans : Pathfinder, LEGION, AnyLogic, avec travail manuel.
  - LiDAR/cadastre vers simulation : **rien de convaincant trouvé** [?].
  - Plan en image vers temps d'évacuation par réseau de neurones : recherche 2024-2025, prototype ; revendication « 95 % de précision » à lire avec prudence [17].
- Start-ups promettant l'import automatique : **aucune identifiée avec preuve**. Seulement des projets de hackathon [18] et des outils de conformité (lecture de plans pour distances et largeurs, source commerciale non vérifiée) [19]. Lacune de ma recherche : pas de base Crunchbase/PitchBook consultée.
- Précédent le plus proche : Itaewon reconstruit en 3D à partir d'un scan du lieu (Ewha, 2025), mais pour un seul lieu, fait par un laboratoire [20].

## 4. Vérification et validation (comment défendre un résultat)

- **NIST TN 1822** (2013, Ronchi et al.) : cadre de tests pour modèles d'évacuation de bâtiments : 5 volets (temps de pré-évacuation, mouvement, usage des sorties, disponibilité des routes, contraintes de flux), plus une méthode pour l'incertitude due à l'aléatoire. Le document dit lui-même qu'il n'est pas une norme définitive [21].
- **RiMEA** : guide germanophone avec environ 14 scénarios de test (annexe 2) [22]. Version actuelle : [?] non vérifiée.
- **IMO MSC.1/Circ.1533** (2016) : évacuation des navires à passagers, cas de test en annexe [23]. Pathfinder publie ses résultats contre ces tests [24].
- **Tests de Jülich** : données expérimentales de laboratoire (goulots, flux) utilisées pour valider les modèles ; JuPedSim s'y inscrit [7] [?] détail non relu.
- **ISO 20414:2020** : protocole de V&V des modèles d'évacuation en bâtiment, version française existe [25]. Référence pour un dossier de justification.
- En France : je n'ai **pas trouvé** de texte précisant la place de la simulation dans un dossier ERP ou une demande de dérogation [26]. Cadre à vérifier : règlement de sécurité ERP (arrêté du 25 juin 1980) et ingénierie de la sécurité incendie [?]. À demander à un bureau d'études.
- Logique pratique : un bureau d'études montre (1) que l'outil passe les tests de référence, (2) des hypothèses documentées (vitesses, densités, temps de réaction), (3) une étude de sensibilité sur le hasard. Tout nouvel outil doit au minimum passer ces tests.

## 5. Cas réels documentés

| Cas | Qui a simulé quoi | Ce qui a changé | Niveau de preuve |
|---|---|---|---|
| Hajj, Mina 2006 | Helbing et Johansson analysent la vidéo (« turbulence de foule ») [27] | Pont de Jamarat reconstruit ; chaque pèlerin reçoit un horaire et un itinéraire ; sens uniques [27][28] | Presse et articles ; peu d'évaluation indépendante. Critique : le problème peut se déplacer ailleurs [27] |
| Hajj, planification | « Pilgrim scheduler » (programmation mathématique des horaires de lapidation) [28] | Horaires attribués | Article scientifique [28] |
| Kumbh Mela | Modèles AnyLogic des créneaux de bain ; expérience Indo-néerlandaise (capteurs + modèles) [29] | Planification, mais décisions précises [?] | Recherche |
| Marathon (Londres) | Marcel Altenburg (Manchester Met) : modèle de départ « Start Right » ; +30 % de coureurs et -40 % de densité aux points durs, d'après un profil de presse [30] | Vagues de départ | Source secondaire [?] ; pas de lien trouvé avec Arup ou Crowd Dynamics |
| JO Paris 2024 | Île-de-France Mobilités : modélisation initiale « rustique » sur tableur, puis application d'itinéraires ; SNCF : poste de commandement [31] ; cérémonie : plan B Trocadéro / Stade de France décidé par le politique [32] | Plan B, jauges, périmètres | Aucune source trouvée sur un simulateur de foule précis (Systra, Egis, Arup : non établi) [?] |
| Stade de France 2022 | Pas de simulation trouvée. Rapport du Sénat : filtrage inédit, signalétique de la FFF refusée par la préfecture de police, mauvaise coordination RATP / police [33] | Réformes du dispositif | Rapport officiel ; ce cas montre un trou de **décision**, pas de modèle |
| Itaewon 2022 | Reconstruction après coup, avec scan 3D, agents hybrides, et 3 scénarios de prévention [20] | Aucun effet trouvé sur des décisions | Académique, après l'événement |
| Liverpool | Non identifié (finale 2022 vue côté Stade de France ; autre événement ?) [?] | | À préciser avec Adem |

Constats : (a) les modèles servent à **fixer un plan et le répéter avec les opérateurs** (cas Crowdcom / uCrowds : séances communes organisateurs et sécurité [11]) ; (b) les échecs viennent souvent de l'organisation et non du manque de modèle (Stade de France).

## 6. IA et LLM : démontré ou annoncé ?

| Travail | Ce que c'est | Démontré |
|---|---|---|
| Xie et al. 2025 (Chaos, Solitons & Fractals) | Apprentissage par renforcement multi-agent (QMIX) pour orienter une signalétique dynamique, avec modèle de foule mésoscopique et feu (PyroSim) [34] | Résultats en simulation, pas sur le terrain |
| Extension métro (PolyU/BUAA) | Même cadre appliqué à des stations de métro [35] | Simulation |
| Tokyo, optimisation multi-objectifs (2024) | Guidage dans les passages souterrains d'une gare [36] | Simulation |
| LLM « Commandant » AAMAS 2026 (démo) | Un LLM envoie des consignes d'itinéraire : 150 agents, ville synthétique ; zéro-tir 67,1 % à 74,2 %, 82,5 % avec mémoire [37] | Monde synthétique, petite échelle |
| Étude 2025 « simulations LLM utiles pour les politiques » (arXiv 2509.21868) | Rassemblement de campus, 13 000 agents ; a servi à la formation de bénévoles et aux procédures, pas à prédire [38] | Plus mûr sur l'usage, qualitatif |
| Shall We Team Up (2024) | Agents LLM communicants répartis sur 3 sorties (grille 33x33, 100 agents) [39] | Jouet |
| LLM et personnalités / agents génératifs hiérarchiques (2026) | Agents LLM aux traits OCEAN dans Unity ; agents génératifs en ville [40] | Démos ; manque de données de décision pas à pas [40] |

Lecture : il existe des démonstrations de **signalétique par apprentissage** et de **commandant LLM**, mais toutes sur des mondes fictifs ou en simulation. Une méta-analyse (81 articles, 2020) constatait déjà l'absence de méthode de validation standard pour les simulations multi-agents d'évacuation [41]. Une note de LLM-sur-LLM n'est pas une validation.

## 7. Synthèse

### Tableau résolu / partiel / ouvert

| Sujet | État |
|---|---|
| Moteur de mouvement d'une foule dans un bâtiment | Résolu (outils industriels, 20 ans) |
| Tests de référence et normes (NIST, RiMEA, IMO, ISO 20414) | Résolu pour les bâtiments ; pas adapté à la rue ou à la ville [?] |
| Import depuis IFC/BIM | Partiel (une seule direction, enrichissement manuel) |
| Import depuis OSM / cadastre / LiDAR | Partiel pour la rue (SUMO, prototypes) ; ouvert pour l'intérieur |
| Heures d'ingénieur par modèle | Non mesuré dans mes sources, à mesurer |
| Jumeau 3D + foule d'événement | Partiel (Esri/uCrowds : 2026, conceptuel, pas de preuve publique de précision) |
| Comparer des décisions de crise (fermeture de métro, rue fermée) | Partiel (utilisé en gare, Hajj ; rarement automatisé et partageable) |
| Comportement réel en panique ou en crise | Ouvert (turbulence de foule mal modélisée) [27] |
| Guidage par IA | Partiel (démos synthétiques), ouvert sur le terrain |
| LLM comme agents d'évacuation | Ouvert (non validé) |
| Données de terrain France (densités, trajectoires) | Ouvert [?] |

### 5 angles possibles pour 4 personnes (sans choisir)

Probabilité qu'un autre LLM le propose : estimation, pas une mesure.

1. **Lieu réel en 3D automatique, avec « scan de confiance »** : OSM/cadastre/LiDAR vers décor simulable, avec une carte de ce qui est mesuré, déduit ou deviné. Peu d'équivalent trouvé. Probabilité ~30 %.
2. **Comparateur de décisions côte à côte avec barre d'incertitude** (rue fermée contre métro fermé) : même foule, N tirages aléatoires, écart affiché, selon l'esprit de la méthode NIST sur le hasard [21]. ~25 %.
3. **Rejouer un incident documenté sur un lieu réel français** (Stade de France 2022, avec les décisions du rapport du Sénat), « et si la signalétique FFF avait été acceptée ? » C'est un test de validation sur du réel et un récit fort. ~15 %.
4. **Le LLM sert de traducteur, pas d'agent** : il transforme une consigne en langage naturel (« fermez la ligne 13 ») en paramètres du simulateur, et traduit le résultat ; le moteur reste classique et vérifiable. Contraste avec les démos « LLM-agents » non validées [37][40]. ~35 %.
5. **Dossier de justification automatique** : après chaque run, export des hypothèses, des tests NIST/RiMEA passés et des limites, au format d'un bureau d'études. Aucun outil trouvé qui le fasse [?]. ~10 %.

Points d'honnêteté : l'angle 4 est le plus faisable en 7 h ; l'angle 1 est le plus large et le plus risqué. Un angle combinant 3 + 5 est le plus défendable devant un jury technique. Décision pour l'équipe.

## 8. Lacunes de cette recherche (à ne pas affirmer)
- Heures d'ingénieur par modèle : non trouvé.
- Hexagon, Siemens, Cityzenith : non trouvé.
- Start-ups 2024-2026 avec preuve d'import automatique : non trouvé (pas de base de financement consultée).
- Rôle de simulateurs dans les JO 2024 (Systra, Egis, Arup) : non trouvé.
- Cas « Liverpool » : ambigu. Prix récents : à confirmer par devis.
- RiMEA version 4, tests de Jülich : détails non relus.

## Sources
[1] https://www.thunderheadeng.com/docs/2026-1/pathfinder/geometry/generating-from-cad
[2] https://www.thunderheadeng.com/pathfinder/licensing ; https://store2.thunderheadeng.com/cart
[3] https://architosh.com/2015/06/aia-show-floor-reports-oasys-massmotion-and-massmotion-flow/amp ; https://aecmag.com/news/massmotion-flow/
[4] https://aecmag.com/news/oasys-enhances-pedestrian-simulation-tool-massmotion/
[5] https://www.bentley.com/en/products/legion/ ; https://de.bentley.com/cs-systra-ltr-en-lr
[6] https://arxiv.org/pdf/1907.09520
[7] https://pypi.org/project/jupedsim ; https://helmholtz.software/software/jupedsim
[8] https://sumo.dlr.de/docs/Networks/Import/OpenStreetMap.html
[9] https://anylogic.help/markup/pedestrian-markup.html
[10] https://fseg.gre.ac.uk/fire/build_evac_simulation.html (prix : revendeur, via https://www.forum8.co.jp/ENGLISH/shokai/ex-sf-e.htm [?])
[11] https://crowdcom.nl/en-gb/solution/simulation ; https://ioplus.nl/archive/en/nijmegen-has-a-digital-twin-during-the-four-days-marches/
[12] https://www.esri.com/arcgis-blog/products/arcgis/public-safety/from-2d-plans-to-3d-intelligence-how-a-digital-twin-can-transform-safety-at-a-special-event
[13] https://www.ubergizmo.com/2026/10/fujitsu-fun-godzilla-demo-shows-how-cities-could-rehearse-a-real-disaster/
[14] https://mediatum.ub.tum.de/doc/1755625/1755625.pdf ; https://tore.tuhh.de/bitstreams/217a665f-02e4-4b04-ac9f-304113a7b47b/download
[15] https://doaj.org/article/0b73e57744d747489465e02c98792a2e
[16] https://www.epj-conferences.org/10.1051/epjconf/202533404002
[17] https://research.polyu.edu.hk/en/publications/ai-powered-safe-egress-time-assessment-for-complex-building-fire-/
[18] https://www.fossunited.org/hack/fosshack26/p/b5vq427vl1
[19] https://www.nomic.ai/glossary/egress-analysis-ai
[20] https://graphics.ewha.ac.kr/Crowd/ ; https://pure.ewha.ac.kr/en/publications/virtual-reenactment-of-the-itaewon-crowd-crush-using-kinodynamic-/
[21] https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1822.pdf
[22] https://traffgo-ht.com/en/pedestrians/validation/rimea/index.html
[23] https://www.traffgo-ht.com/downloads/pedestrians/downloads/documents/MSC.1,Circ.1533,2016.pdf
[24] https://www.thunderheadeng.com/docs/2025-1/pathfinder/appendices/verification-validation/imo
[25] https://iteh.es/catalog/standards/iso/aa2f373f-b4e7-479a-98cf-17d746f3f8db/iso-20414-2020
[26] (aucune source française trouvée)
[27] https://arxiv.org/abs/physics/0701203 ; https://physicsworld.com/a/crowd-turbulence-has-deadly-consequences/
[28] https://pubsonline.informs.org/doi/pdf/10.1287/opre.2018.1798 ; https://www.informs.org/Impact/O.R.-Analytics-Success-Stories/Safe-and-Effective-Crowd-Control
[29] https://environment.leeds.ac.uk/events/event/192/the-kumbh-mela-experiment-kme-measuring-and-understanding-the-dynamics-of-mankinds-largest-crowd---experiences-from-kumbh-mela-2016-in-ujjain
[30] https://wmmajors.shorthandstories.com/majors-issue-9/crowd-pleaser/ ; https://mmu.ac.uk/news-and-events/news/story/science-managing-crowds-biggest-ever-london-marathon
[31] https://www.lalibre.be/economie/conjoncture/2023/07/27/jo-2024-comment-paris-compte-gerer-le-flux-de-milliers-de-voyageurs-JFID2UI6KJFSXLBMRTXYJAFYMU/ ; https://www.europe1.fr/societe/jo-de-paris-2024-pour-gerer-les-15-millions-de-voyageurs-attendus-la-sncf-a-organise-sa-tour-de-controle-4259311
[32] https://www.nbcnews.com/sports/olympics/paris-olympics-plan-b-opening-ceremony-river-seine-security-threat-rcna147790 ; https://ghd.com/insights/crowd-planning-with-creativity-rethinking-the-opening-ceremony
[33] https://www.senat.fr/rap/r21-776/r21-7760.html ; https://en.wikipedia.org/wiki/2022_UEFA_Champions_League_final_chaos
[34] https://ideas.repec.org/a/eee/chsofr/v194y2025ics0960077925002590.html
[35] https://research.buaa.edu.cn/en/publications/enhancing-fire-evacuation-safety-in-metro-stations-multi-agent-re/
[36] https://collective-dynamics.eu/index.php/cod/article/view/A174
[37] https://ifaamas.org/Proceedings/aamas2026/pdfs/SEYR5220.pdf
[38] https://arxiv.org/html/2509.21868v2
[39] https://arxiv.org/pdf/2402.12327
[40] https://arxiv.org/pdf/2606.14989 ; https://arxiv.org/pdf/2606.31038
[41] https://bspace.buid.ac.ae/items/7ffbf313-2b24-41ff-9f44-b9427d07ea25
