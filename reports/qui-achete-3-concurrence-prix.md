# Qui achète, face à qui, à quel prix : concurrence et grille de prix

Date : 22 oct. 2026. Complète `idee-evacuation-4-marche.md` et `etat-art-6-acheteurs-et-marches-publics.md` (non refaits). Règle : un lien par chiffre, sinon `[?]`.
Décision débloquée : notre prix par site et par an, et l'angle face à ce qui existe.

## Version simple (3 lignes)
Trois familles de produits existent et ne se parlent pas : ceux qui **simulent** la foule (pour un ingénieur, à froid), ceux qui **alertent et coordonnent** (pour le jour J, sans simuler), ceux qui **détectent** (caméras, portiques). Personne ne relie « je pose un incident, la foule réagit, un agent recommande, le responsable décide à la voix ». C'est le trou. Le concurrent français le plus proche (Onhys) a disparu faute de financement en 2023 : à lire comme un avertissement, pas comme un champ libre.

Mini-glossaire : *licence* = droit d'usage d'un logiciel ; *SaaS/abonnement* = on paie chaque année, sans installer ; *poste* = un ordinateur d'ingénieur ; *notification de masse* = envoyer en même temps SMS, appels, applis à beaucoup de gens ; *CEM* = critical event management, coordination d'une crise ; *ARR* = revenu récurrent annuel.

## 1. Tableau des concurrents et voisins

### A. Simulation de foule (étude à froid, pour un ingénieur)
| Acteur | Modèle et prix | Clients connus | Ce qu'il ne fait pas |
|---|---|---|---|
| Pathfinder (Thunderhead) | Licence annuelle 2 640 USD (fixe) ou 3 960 USD (flottante) ; rabais jusqu'à 50 % en volume. https://www.thunderheadeng.com/pathfinder/pricing | bureaux d'incendie `[?]` | Pas de décision, pas de temps réel, plans à importer à la main |
| LEGION (Bentley) | À partir de 16 330 USD / 12 mois / licence ; machine 64 Go RAM. https://www.bentley.com/en/products/legion | Wembley, Jeux de Londres 2012 via Movement Strategies. https://movementstrategies.com/case-studies/the-football-association-wembley-stadium-2020 | Modèle construit à la main par l'expert ; pas d'agent qui recommande |
| MassMotion (Arup, vendu par Oasys) | Ancien prix : 20 000 £ perpétuel, 20 % par an ensuite (https://aecmag.com/news/massmotion). Version Flow : 3 461 à 8 547 USD (liste 2022, https://oasys-software.com/products/mass-motion-flow). Prix actuel du plein produit `[?]` | stades, gares | Idem : outil d'ingénieur |
| AnyLogic (bibliothèque piétons) | Professional autour de 18 990 USD par poste selon une source tierce, devis sur demande. https://checkthat.ai/brands/anylogic/pricing (les pages « licence à vie 50 $ » sont du piratage, ignorées) | industrie, logistique | Généraliste ; le piéton est un module |
| Vadere / PedSim | Gratuit, recherche. https://github.com/pedestrian-dynamics-HM/vadere | universités | Pas de produit, pas de support |
| Movement Strategies (GHD) | **Étude au forfait** (cabinet, Londres, depuis 2005) ; tarif non publié `[?]` | Olympiques 2012, Wembley, O2, Wimbledon, Eiffel Tower. https://linkedin.com/company/movement-strategies | Étude livrée en semaines ; chaque nouvelle question = nouvelle mission |
| Crowd Dynamics / Still | Conseil ; prix `[?]` ; activité actuelle non prouvée | Keith Still, auteur du modèle LEGION | idem |
| Onhys (Sophia Antipolis) | Logiciel + études. **Fin de l'aventure faute de financement, nov. 2023**. https://www.sophianet.com/article/startup-faute-financement-court-terme-aventure-onhys-terminee ; première levée 500 k€ en 2018 (même source) | SNCF Saint-Charles, OM/Vélodrome | Avait déjà jumeau temps réel + prédiction ; n'a pas trouvé de modèle économique assez large `[?]` |
| uCrowds (Utrecht) | Moteur + appli ; 250 k€ de subvention publique 2018 ; levée `[?]` ; partenaire d'Esri sur un jumeau d'événement (juil. 2026, cf. rapport 4) | Schiphol, Tour de France à Utrecht | Pas de recommandation par agent `[?]` |
| Crowd Vision, Still (société) | Introuvables ou sans prix `[?]` | | |

### B. Notification de masse et gestion de crise (le jour J, sans simulation)
| Acteur | Modèle et prix | Clients / taille | Ce qu'il ne fait pas |
|---|---|---|---|
| Everbridge (Thoma Bravo, 1,8 Md$, clos juil. 2024) | Abonnement annuel par nombre de contacts. Exemples : comté américain 145 401 $ la 1re année (https://agenda.gilacountyaz.gov/docs/2016/REGULAR/20160105_256/3518_Pinal,%20Gila,%20Greenlee,%20Graham%20County,%20AZ%20-%2012_8_2015%20-%20181,733HH.pdf) ; ATF 73 234 $ la 1re année (https://cleat.ai/government/contracts/replacement-notification-system-tyqa) ; ministère britannique 92 216 £ sur 2 ans (https://seo.sandbox.stotles.com/tenders/2026/W27/mass-notification-system) ; État du Michigan ~1,19 M$ de valeur totale (https://michigan.gov/dtmb/-/media/Project/Websites/dtmb/Procurement/Contracts/MiDEAL/001/250000000156.pdf) | des milliers d'organisations | N'a pas de jumeau du lieu ni de foule : il envoie le message, il ne dit pas quoi décider |
| Genasys | CA exercice 2025 : 40,8 M$ dont 8,9 M$ de logiciel, 31,8 M$ de matériel (sirènes). https://sec.gov/Archives/edgar/data/924383/000119312525312747/gnss-ex99_1.htm | Porto Rico, sites nucléaires | Le logiciel pèse peu (22 % du CA) ; module « zones d'évacuation » statique |
| Rave (Motorola) | Racheté 553 M$ net en 2022. https://seedtable.com/exits/ravemobilesafetycom | écoles, hôpitaux, villes US | Alerte et 911, pas de simulation |
| AlertMedia, Singlewire | Prix non publics `[?]` | entreprises, écoles | Alerte |
| D4H, Noggin, Veoci (CEM) | Fourchettes d'un blog éditeur tiers : Everbridge 10 à 60 k$/an, Noggin/AtHoc 25 à 150 k$, Veoci/D4H 15 à 120 k$. https://shadowhq.io/blog/the-complete-guide-to-crisis-management-systems (source concurrente, indicatif) ; D4H affiche « 1 000 $/an » d'entrée sur Slashdot. https://slashdot.org/software/comparison/D4H-Technologies-vs-Genetec-Mission-Control | Noggin repris en juil. 2024 (montant `[?]`) | Listes de tâches et journaux de crise ; pas de simulation du lieu |

### C. Plateformes de commandement et jumeaux
| Acteur | Modèle | Ce qu'il ne fait pas |
|---|---|---|
| Palantir | Contrats sur mesure, pas de prix public. https://www.palantir.com/platforms/foundry/digital-twin/ | Jumeau de chaîne logistique, pas de foule ni de plan d'évacuation |
| Genetec Mission Control, Milestone, Hexagon | Licence par taille de bâtiment et nombre de capteurs ; prix non publiés (Slashdot donne une ligne « 10 000 $ » ambiguë, non retenue `[?]`) | Procédures et vidéo, pas de simulation de foule |
| Cityzenith | Jumeau de bâtiment ; 11 M$ en crowdfunding, repris par Twinmaster en 2023. https://pitchbook.com/profiles/company/51190-48 | Immobilier et carbone, rien sur la foule |
| Cesium | Brique 3D (open source/cloud) ; achetée par Bentley (confirmation écrite `[?]`) | Fournit le globe, pas le raisonnement |
| Esri + uCrowds | Voir rapport 4 | Concurrent frontal sur la démo |

### D. Sécurité IA vidéo et détection
| Acteur | Modèle et prix | Taille | Ce qu'il ne fait pas |
|---|---|---|---|
| Evolv | Abonnement 4 ans par portique : 28 650 $ de matériel + 50 160 $ de logiciel = 78 810 $ pour une voie (proposition publique de Buffalo), soit ~12 500 $/an de logiciel par voie. https://yespress.io/evolv-technology | CA 2025 : 145,9 M$ (+40 %), ARR 120,5 M$, 1 200 clients, 8 000 systèmes. https://sec.gov/Archives/edgar/data/1805385/000180538526000018/nhic-20260430.htm | Détecte une arme à l'entrée ; ne dit pas quoi faire après |
| ZeroEyes | Abonnement par caméra, prix `[?]` | 53 M$ série B (2024) | Détection d'armes uniquement |
| Wintics (France) | Logiciel, prix `[?]` | 160 sites, 20 000 caméras, fournisseur officiel Paris 2024. https://wintics.com/en/home ; seul prestataire testé par la préfecture de police, la SNCF et la RATP (rapport public https://vie-publique.fr/files/rapport/pdf/297322.pdf) | Compte et alerte ; pas de scénario |
| XXII (France) | SaaS XXIICORE | 22 M€ série A (2023) ; valorisation 88 à 132 M€ | Détection sur caméras existantes |
| Videtics | Prix `[?]` | membre du consortium Serenity avec Onhys | idem |

### E. Formation et exercices
| Acteur | Ce qu'il vend | Ce qu'il ne fait pas |
|---|---|---|
| XVR Simulation (Pays-Bas) | Formation VR pour pompiers et commandants, 20 ans d'existence ; prix non publics `[?]`. https://xvrsim.com | Scénarios écrits à la main ; pas de foule calculée |
| RealTime Immersive | Prix et levées non trouvés `[?]` | |
| Chaps Crisis (ChapsVision, France) | Exercices de crise, e-learning, plateforme de cellule de crise. https://www.chapsvision.com/fr/solution/gestion-de-crise/ | Pas de simulation spatiale |

### F. Acteurs français de la sécurité civile
| Acteur | Fait | Lecture |
|---|---|---|
| Nexsis 18-112 (ANSC, État) | Système unique des pompiers ; coût global 300 M€ de 2018 à 2031 ; 9 SDIS en exploitation complète et 49 déployés à l'été 2025. https://senat.fr/rap/l25-139-328-2/l25-139-328-2_mono.html | Client potentiel, pas concurrent : c'est l'alerte et le dispatch. Redevances payées par les SDIS |
| Systel (La Rochelle) | Logiciel START pour 48 SDIS ; CA 13 M€ en 2022, redressement judiciaire sorti en oct. 2023. https://www.lesechos.fr/pme-regions/nouvelle-aquitaine/systel-sauvetage-reussi-pour-le-gestionnaire-des-plateformes-dalerte-des-pompiers-2025694 | Un acteur de 13 M€ de CA, fragilisé par Nexsis : le marché public français du logiciel de crise est étroit |
| CS Group (Crimson TACTIC) | Commandement des interventions, adopté par la majorité des SDIS. https://www.cs-soprasteria.com/fr/offres-solutions/systemes-de-surveillance-commandement/gestion-de-crise/ | Voisin, intégration possible |
| Geosafe | Rien de vérifiable trouvé `[?]` | |

## 2. La carte « qui fait quoi »

Axe horizontal : à froid (préparer) vers temps réel (le jour J). Axe vertical : simuler vers décider.

```
                    À FROID (préparer, exercer)                 TEMPS RÉEL (le jour J)
 DÉCIDER      |  XVR, Chaps Crisis : exercices écrits     |  Noggin, D4H, Veoci, Genetec :
 (recommander)|  à la main, sans foule calculée           |  listes de tâches, sans simulation
              |                                           |  Everbridge, Genasys, Rave : envoient
              |                                           |  le message, ne disent pas quoi décider
              |      >>> NOTRE PLACE : le pont <<<        |  Evolv, ZeroEyes, Wintics : détectent
 SIMULER      |  LEGION, MassMotion, Pathfinder, AnyLogic |  Rien d'établi (Onhys l'avait tenté,
 (prévoir)    |  + cabinets (Movement Strategies, Ingérop |  disparu ; Esri + uCrowds en démo)
              |  Explain) : semaines, par un expert       |
```

Lecture : le bas gauche est mûr et cher en heures (20 k€ l'espace chez la RATP, rapport 6). Le haut droit est mûr et cher en licences (10 à 150 k$/an). **Le bas droit, la simulation en direct qui nourrit une décision, est vide ou fragile.** Et la diagonale (simuler à froid ET décider en direct avec le même modèle) n'est tenue par personne.

## 3. Le trou que nous occupons (et ses limites)

1. **Un seul modèle du lieu sert deux usages.** Le jumeau construit pour préparer (étude, exercice, dossier de commission) sert aussi le jour J. Aujourd'hui l'étude LEGION finit dans un PDF, l'alerte Everbridge ne sait rien du lieu.
2. **Le temps de construction.** Les marchés publics paient la modélisation (279 k€ RATP, 14 espaces ; 2 mois de la Ville de Paris, rapport 6). Un modèle en minutes attaque la ligne la plus chère.
3. **La recommandation expliquée.** Les outils de simulation donnent des courbes ; les outils de crise donnent des listes. Un plan comparé à 2 ou 3 alternatives rejouées est absent du marché `[?]` (à vérifier produit par produit, je n'ai pas lu toutes les démos).
4. **Le client qui n'a pas de bureau d'études** : un directeur de cinéma, un centre commercial, un exploitant de salle moyenne. Les logiciels de A coûtent peu, mais exigent un expert ; les cabinets coûtent des dizaines de milliers d'euros par étude.

Limites honnêtes :
- **Onhys a fait presque la même chose en France et n'a pas tenu** : une quinzaine de salariés, clients nommés (SNCF, OM), deux levées visées (500 k€ en 2018, 3 M€ en 2023), liquidation fin 2023. Cause exacte `[?]` ; à demander à son fondateur Sébastien Paris avant le jury (la leçon vaut plus que le prix).
- Les gros (Bentley, Everbridge, Axon) peuvent greffer un agent. Prepared, assistant IA du 911, a été racheté par Axon (annoncé sept. 2025, environ 640 M$ selon l'acheteur ; un agrégateur écrit 800 M$) : https://multiples.vc/private-comps/prepared . Les gros rachètent plutôt que de construire : bon pour la sortie, mauvais pour l'indépendance.
- L'intérieur des bâtiments reste saisi ou importé, pas deviné (rapport 4).

## 4. Grille de prix proposée, par site et par an

Principe : on ne vend pas un logiciel de plus (3 à 16 k$ la licence), on vend **un site couvert**, préparation et direct compris. L'ancrage vient de ce que les clients paient déjà : 13 à 20 k€ pour une étude complète d'un espace (RATP, rapport 6), ~12,5 k$/an de logiciel par voie de portique Evolv, 10 à 60 k$/an d'Everbridge, 3 à 16 k$/poste de simulation. Tous les montants ci-dessous sont des **hypothèses à tester en 3 appels**, pas des mesures.

| Formule | Pour qui | Contenu | Prix proposé | Justification |
|---|---|---|---|---|
| **Étude** (ponctuelle) | Exploitant moyen, dossier de commission, événement | 1 jumeau, 10 scénarios, rapport exportable, 1 mise à jour | 2 500 € l'étude | ~1/8 de l'étude RATP (20 k€/espace) ; moins qu'une licence Pathfinder annuelle, sans expert à embaucher |
| **Site Essentiel** (à froid) | Cinéma, centre commercial, salle jusqu'à ~3 000 personnes | Jumeau + scénarios illimités + exercice et formation du personnel | 9 000 €/an | ≈ MassMotion Flow en haut de fourchette (8,5 k$) mais avec le jumeau déjà construit ; moins qu'une étude de cabinet |
| **Site Pro** (à froid + direct) | ERP de 1re/2e catégorie, centre type Forum des Halles | Tout Essentiel + incidents posés en direct, recommandation de l'agent à la voix, journal de décision | 24 000 €/an | Entre Everbridge « entrée de gamme » (10 à 60 k$/an) et LEGION (16 k$/poste) ; ~2 voies Evolv |
| **Grand site** (stade, gare, événement) | Plus de 5 000 personnes, plusieurs bâtiments | Pro + multi-bâtiments, rues autour, intégration alerte (Everbridge, SMS), assistance d'astreinte | 60 000 à 90 000 €/an | Un stade a 10+ voies de contrôle d'accès (≈125 k$/an chez Evolv) ; contrat comté Everbridge ≈145 k$ ; reste sous le plafond SGP (167 k€/an) |
| **Bureau d'études** (revente) | Ingérop, Explain, Socotec, Egis | Licence multi-sites, marque blanche, 20 jumeaux/an | 18 000 €/an | Vend de la productivité (jours économisés), pas de la conformité (rapport 4) ; reste proche d'une licence AnyLogic |

Ce qui reste à décider (par Adem) : vendre d'abord au site (Pro) ou au bureau d'études ; les rapports 4 et 6 penchent pour le bureau d'études, la démo parle au directeur de site. Ma recommandation : **un seul prix affiché, Site Pro à 24 000 €/an, avec un pilote d'un événement à 2 500 €**, car c'est la formule qui montre le pont (froid + direct) et celle que le jury de la démo (Forum des Halles) peut imaginer signer. Je n'ai pas de preuve que 24 k€ passe ; la vérification est de poser la question à 3 responsables sûreté.

Non-prix : jamais d'offre « grand public » ni de rapport des points faibles accessible hors exploitant (garde-fou du rapport 4).

## 5. Levées de fonds et rachats qui prouvent l'appétit

| Entreprise | Événement | Montant, investisseurs | Source |
|---|---|---|---|
| Prepared (IA pour le 911) | Série C mai 2025, puis rachat par Axon sept. 2025 | 80 M$, General Catalyst, a16z, First Round, Radical ; rachat ~640 M$ | https://prweb.com/releases/prepared-lands-80m-series-c-led-by-general-catalyst-to-bring-ai-to-emergency-response-nationwide-302472837.html |
| Firefly (sécurité physique IA, écoles, hôpitaux) | Série A 20 oct. 2026 (il y a 2 jours) | 20 M$, Definition Capital, BoxGroup, Susa. Fondateur venu de Verkada | https://siliconangle.com/2026/10/20/ai-startup-firefly-secures-20m-to-make-the-physical-world-a-safer-place |
| Flock Safety | Série 2025 | 275 M$, valorisation 7,5 Md$, CA 2024 de 300 M$ | https://cnbc.com/2025/06/10/flock-safety-cnbc-disruptor-50.html |
| Evolv (coté) | Résultats 2025 | CA 145,9 M$, ARR 120,5 M$, guidance 2026 : 180 à 185 M$ | https://evolv.com/resources/press-releases/evolv-technology-reports-fourth-quarter-financial-results |
| Everbridge | Rachat par Thoma Bravo, juil. 2024 | 1,8 Md$ | https://everbridge.com/newsroom/article/thoma-bravo-completes-acquisition-of-everbridge |
| ZeroEyes | Série B juin 2024 | 53 M$, Sorenson, Intel Capital, BroadLight | https://securitysales.com/zeroeyes-53m-series-b-funding-growth-expansion/159858 |
| Rave Mobile Safety | Rachat par Motorola, déc. 2022 | 553 M$ net | https://seedtable.com/exits/ravemobilesafetycom |
| XXII (France) | Série A mars 2023 | 22 M€ ; Bpifrance (Fonds Innovation Défense), 574 Invest (SNCF), Colas, Kima | https://tech.eu/2023/03/24/xxii-accelerating-video-analysis-with-raise-22-million-in-series-a |
| Eagle Eye Networks (vidéo cloud) | Série E 2020 | 40 M$ d'Accel ; série F de 100 M$ en 2023 (liste d'investisseurs par agrégateur : Accel) | https://en.wikipedia.org/wiki/Eagle_Eye_Networks ; https://thecompanycheck.com/company/b/eagle-eye-networks/de06n4y2jxdhgwnmb |
| Onhys (France) | Première levée juil. 2018 : 500 k€ ; liquidation 2023 | | https://www.sophianet.com/article/startup-faute-financement-court-terme-aventure-onhys-terminee |
| Cityzenith | Crowdfunding jusqu'en 2022, repris 2023 | 11 M$ cumulés | https://fundediq.co/cityzenith-cityzenith-com-funding |

**Accel** : je n'ai trouvé aucune participation d'Accel dans la simulation de foule ou la gestion de crise. Seul lien physique-sécurité : Eagle Eye Networks (vidéosurveillance cloud, série E 2020). Ses paris récents de sécurité sont cyber (Cyera, Vega 120 M$ en févr. 2026, Armadin 189,9 M$ en mars 2026 : https://prnewswire.com/news-releases/armadin-secures-record-breaking-189-9m-in-seed-and-series-a-funding-to-combat-the-era-of-ai-driven-hyperattacks-302709318.html). À dire au jury sans détour : pour Accel, c'est un terrain neuf.

Lecture pour le jury : l'appétit est réel côté **sécurité physique pilotée par IA** (Prepared, Firefly, Flock, Evolv) et côté **sorties** (Axon, Motorola, Thoma Bravo achètent). Il est faible côté **simulation de foule seule** : aucune levée récente trouvée, une faillite (Onhys), des licences à 3 à 16 k$. Notre récit doit se placer dans la première famille (décision en direct, abonnement par site), la simulation étant le moteur, pas le produit. Trou de preuve : aucun client ne nous a encore payé.

## 6. À vérifier avant le jury (3 appels et 2 lectures)
1. Poser le prix Site Pro (24 k€) à un responsable sûreté de salle ou de centre commercial : « signeriez-vous ? sinon à partir de quel prix ? ».
2. Appeler Sébastien Paris (ex-Onhys) : pourquoi l'arrêt, qui a refusé d'acheter, à quel prix vendait-il.
3. Demander à un cabinet (Ingérop, Explain) le prix d'une étude de foule et des jours de modélisation.
4. Prix actuel de MassMotion, de Genetec Mission Control, de Wintics, de XVR : tous `[?]`.
5. Lire la démo Esri + uCrowds pour savoir si une recommandation est proposée (point 3 du §3).
