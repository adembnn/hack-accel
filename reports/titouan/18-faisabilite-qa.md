# 18 - Faisabilité de Refuge : 25 questions, réponses courtes et vraies

Mesures faites le 22 oct. 2026 sur la machine de Titouan (Node 24.18, Windows 11), en lecture/exécution locale, sans clé, sans réseau, sans appel payant, sans modifier le code (les exécutions ont tourné sur des copies dans le scratchpad). `[À CONFIRMER]` = seul l'équipe le sait. Le modèle est « simplifié, non certifié ».

## A. Faits mesurés (la base de toutes les réponses)

| Sujet | Fait | Où le revoir |
|---|---|---|
| Générer un lieu | `node src/scene/generer.ts` : **5,5 s et 6,7 s** (2 passages) pour scene.json 1,87 Mo + navgrid.json 1,02 Mo. Données déjà téléchargées. | wt-proto-jumeau-3d, `src/scene/generer.ts` |
| Contenu généré | 3 773 bâtiments (193 hauteurs estimées), 6 200 rues, 448 portes, 105 bouches métro/RER, 88 escalators, 69 escaliers, **2 ascenseurs**, 134 sorties. Grille : 327 portes et 77 liens retenus ; **226 portes et 83 liens ignorés** (non reliés). 61 sorties. | sortie du script |
| Ce qui est estimé | Niveaux -1, -2, -5 marqués « estimé » (peu d'objets OSM) ; 0, -3, -4 « documentés ». **448 portes sur 448, 105 bouches sur 105, 88 escalators sur 88 portent le drapeau `estime`** (largeur ou niveau absent d'OSM, valeur par défaut posée). | `scene.json` |
| Téléchargement | **Durée non documentée** dans SOURCES.md. Les 4 fichiers OSM sont horodatés 10:02 à 10:05 (3 fichiers sur 4 en ~3 min ; interieur.json à 10:05) ; batiments.json et BD TOPO réécrits à 10:48 (reprise). Dossier créé à 09:59. | `refuge-data/data/` |
| Poids des sources | OSM : 8,8 + 3,3 + 0,8 + 7,4 Mo ; BD TOPO : 7,3 Mo. | `refuge-data/data/` |
| Ce qui est codé en dur pour le Forum | Origine lat/lon, boîte de l'intérieur, 9 noms de portes (regex), 10 portes de `PORTES`, 6 salles, scène cinéma illustrative (`SCENE_UGC`). | `generer.ts`, `issues.ts`, `scene-ugc.ts` |
| Perturbations | **9 codes** : SORTIE, C1 (station fermée), B1 (porte bloquée), B3 (escalator arrêté), B5 (ascenseur en panne), D1/D2 (porte donnant sur zone à éviter), D5 (zone fermée 1-180 min), F1 (retard d'information 0-60 min). | wt-decideurs `src/agents/evenements.ts` |
| Leviers des décideurs | **62 leviers** (46 du catalogue + noyau), 6 acteurs (préfecture, RATP, sécurité du centre, directeur, UGC, BSPP) ; 55 « source », 7 « bon sens ». | `leviers.ts` |
| Scénarios de simulation | TS : **2 plans** (AVANT consigne du 19 oct., APRÈS « décideurs ») sur 20 graines ; **9 plans candidats** (C1 à C9), entraînement graines 1-20, test 101-120. Python JuPedSim : **3 scénarios JSON** (feu_sortie_est, ordre_public_parvis_nord, sortie_bouchee_e1) x 4 parades ; **un seul agrégé** : sortie_bouchee_e1, 80 runs (20 graines x 4). | `bench/`, `refuge-data/sim/` |
| Vitesse TS (mouvement) | `src/sim/motion/bench.ts` : **17,2 ms par pas de 0,1 s** pour 5 000 personnes (21,7 ms dans le fichier enregistré), p95 29,5 ms. Budget visé 8 ms : **non atteint**. Soit ~5x le temps réel. | `bench-resultats.txt` |
| Vitesse TS (comportement) | `bench/avant-apres.ts` : 40 simulations de 3 000 personnes x 4 h simulées en **16 s** (modèle de file, pas de 1 s). | wt-integration |
| Vitesse chaîne complète sur la vraie grille | `node src/integration/demo.ts` (600 personnes, 20 min) : **970 s (16 min) pour 6 simulations**, soit ~160 s par simulation. Version enregistrée (180 personnes, 6 min) : 176 s pour 3. | `bench/integration/resultats.json` |
| Résultat de cette chaîne | **t90 non atteint en 20 min** ; non sortis fin : 558 (AVANT) contre 323 (APRÈS) sur 600 ; densité max 0,75 pers./m². Les portes lescot, berger, saint_eustache n'ont **aucune sortie réelle rattachée**. | `ecarts_constates` |
| Vitesse Python JuPedSim | 1 run : **34 s** (300 agents, ordre public) et **35 s** (480 agents, sortie bouchée), traces écrites comprises. | `refuge-data/sim/run.py` |
| Pipeline données | 5 000 agents x 120 ticks x 2 runs = 1,2 M lignes ; Kafka vers ClickHouse **28 s**, producteur 7 s ; requêtes de métriques 0,04 à 0,18 s ; zéro perte. | `pipeline/data/e2e_report.json` |
| Résultats du banc (scène illustrative) | AVANT : zone de danger 17 718, t90 315 s. APRÈS « décideurs » : 13 374 (-24 %), **t90 501 s (+59 %)**. Meilleur plan C5 : 8 296 (-53 %), t90 346 s (+10 %). Non sortis et écrasement : 0 partout. Test = entraînement à moins de 1 %. | `bench/resultats.csv`, `bench/PLANS.md` |
| Appels payants | **Aucun fait.** Jev jamais appelé (pas de `fixtures/jev`), rédacteur Claude jamais appelé, décideurs en mode `rules`, textes en rejeu. Garde en code : accord explicite + clé + `MODE_PAYANT=oui`. | `garde-payant.ts` |

## B. Sources et calibrage

| Donnée | Source | Statut |
|---|---|---|
| Bâtiments, rues, intérieur, accès | OpenStreetMap via Overpass, ODbL, attribution « © les contributeurs d'OpenStreetMap » | Réel, mais incomplet en sous-sol |
| Hauteurs et emprises | IGN BD TOPO (WFS Géoplateforme), Licence Ouverte 2.0, attribution « Source : IGN, BD TOPO » | Réel (licence « à vérifier sur la fiche ») |
| Chronologie du 19 oct. | Presse : Le Parisien, BFM, HuffPost, La Dépêche, Télérama. Annonce ~19 h 20, ~3 000 personnes (BFM), couvre-feu 23 h-6 h, stations fermées 22 h | Réel, sources secondaires ; qui a ordonné quoi au cinéma : non établi |
| Capacité UGC | CNC / Région IDF : 27 écrans, 3 894 fauteuils | Réel, Licence Ouverte |
| Vitesse libre 1,34 m/s (0,97-1,65) | Weidmann 1993 (via Daamen et Hoogendoorn) | Calibré sur la littérature, pas sur le Forum |
| Débit de porte 1,3 pers/s/m (plage 1,2-1,8) | PD 7974-6 / SFPE ; ar5iv 0810.1945 | Calibré (valeur codée) |
| Pré-mouvement : log-logistique, médiane 40,5 s, forme 5,8 | Fire Technology 2019, 30 exercices de cinéma, 1 954 mesures | Calibré **sur des alarmes incendie**, pas sur un couvre-feu |
| Choix de sortie (logit) | Lovreglio et al., arXiv 2110.11577 (VR, 344 choix) ; distance normalisée 0-3 m = choix de modélisation | Poids de labo, transférés |
| 70 % en groupe, 4 % mobilité réduite | Article secondaire / « hypothèse à sourcer » | Faible |
| Effet « faster-is-slower » (-40 % au-delà de 4 pers/m²), attente -0,9/min, multiplicateurs des messages | « Hypothèse de réglage » dans le code | **Inventé, assumé** |
| Scène cinéma : 3 000 personnes, 500 par salle, 5 issues, distances et largeurs | « Scène illustrative, aucun de ces chiffres n'est un relevé » | **Inventé** |
| « Derrière la Ferronnerie = danger 2 » | Hypothèse de grille | **Inventé, et c'est lui qui fait le gain de C5** |
| Débit d'escalator, vitesses de liens | « Valeurs de démonstration non calées » | **Inventé** |

Ce qui n'existe pas : comparaison aux données de Jülich (aucune trace dans le code), conformité ISO 20414 (norme payante, non lue), validation par un exploitant ou un bureau de sécurité, validation sur un exercice réel.

---

## C. Les 25 questions

**1. Est-ce faisable techniquement ?**
Oui, pour un lieu : la chaîne OSM/IGN vers scène, grille, simulation, décideurs et explication tourne de bout en bout sans réseau ni clé. Elle donne un comparateur de parades, pas une prédiction.
Preuve : `node src/integration/demo.ts` (affichage « réseau : non ») et `bench/integration/resultats.json`.

**2. En combien de temps générez-vous un nouveau lieu ?**
6 secondes pour la scène et la grille une fois les données téléchargées (5,5 et 6,7 s mesurées). Avec téléchargement, relecture des portes et des niveaux : une demi-journée, pas une minute `[À CONFIRMER]`.
Preuve : lancer `node src/scene/generer.ts` en direct (compter 7 s).

**3. Et le téléchargement des données ?**
Non chronométré par l'équipe. Les fichiers OSM datent de 10:02 à 10:05, soit environ 3 minutes pour trois d'entre eux ; la BD TOPO a demandé une reprise (première requête à 0 objet, lat/lon inversés). Les requêtes Overpass ne sont pas versionnées avec les données.
Preuve : `refuge-data/data/SOURCES.md` (remarque BD TOPO) et horodatage des fichiers.

**4. Qu'est-ce qui reste manuel quand on change de lieu ?**
Tout ce qui est codé pour le Forum : origine lat/lon, boîte de l'intérieur, noms de portes, 6 salles, scène de cinéma, liste des 10 portes. S'ajoutent le contrôle des niveaux estimés, des portes et des largeurs.
Preuve : `generer.ts` (constantes `LAT0`, `FORUM`), `issues.ts` (`NOMS_ANCRES`), `scene-ugc.ts`.

**5. Combien de lieux la chaîne sait-elle faire sans intervention humaine ?**
Zéro autre que le Forum des Halles. Le générateur de scène est quasi générique ; l'adaptateur d'issues et la scène de comportement ne le sont pas. Un 2e lieu demanderait quelques heures de réglage `[À CONFIRMER]`.
Preuve : `grep` des noms « lescot », « berger » dans `src/integration/issues.ts`.

**6. Les données du lieu sont-elles complètes ?**
Non. Le niveau 0 est bien documenté ; les niveaux -1, -2 et -5 sont marqués « estimé » ; seulement 2 ascenseurs ; 226 portes et 83 liens du sous-sol ne sont pas reliés à la grille et sont ignorés.
Preuve : sortie du générateur (lignes `niveau -1 ... estime=true`) et `ignorés : 226 portes, 83 liens`.

**7. Les largeurs de portes sont-elles mesurées ?**
Non. Les 448 portes et les 105 bouches portent le drapeau « estimé » : largeur par défaut selon le type (principale 2,4 m, secours 1,4 m, boutique 1,8 m). Le temps de sortie dépend directement de ces largeurs.
Preuve : `scene.json`, champ `estime` ; table `LARG` dans `generer.ts`.

**8. Combien de scénarios existent vraiment ?**
Côté perturbations : 9 codes, plus 62 leviers de décision. Côté plans comparés : 2 (AVANT et APRÈS) et 9 candidats, chacun sur 20 graines d'entraînement et 20 de test. Côté Python : 3 scénarios définis, mais un seul a ses résultats agrégés (80 runs).
Preuve : `evenements.ts`, `bench/plans.ts`, `refuge-data/sim/results/agrege.csv`.

**9. Peut-on dire « des milliers de scénarios » ?**
Non. Les 9 perturbations se combinent en théorie ; en pratique, ce qui est testé se compte en dizaines de plans et quelques centaines de runs.
Preuve : `bench/resultats-par-graine.csv` (40 lignes) et `resultats-plans.csv`.

**10. Quelle est la vitesse de simulation ?**
Le moteur de mouvement fait 17 à 22 ms par pas de 0,1 s pour 5 000 personnes, soit ~5x le temps réel, et manque son budget de 8 ms. La chaîne complète sur la vraie grille prend 160 s par simulation de 600 personnes sur 20 min. Le modèle de file simple fait 40 simulations de 3 000 personnes en 16 s.
Preuve : `node src/sim/motion/bench.ts` ; `bench/integration/resultats.json` (`performance`).

**11. Peut-on simuler 3 000 personnes en direct devant le jury ?**
Pas sur la vraie grille : 600 personnes déjà 160 s par simulation. En direct, seul le modèle de file va assez vite ; le reste doit être précalculé.
Preuve : `performance.total_ms = 969588` pour 6 simulations.

**12. Que prouve le résultat « avant/après » ?**
Qu'une parade peut réduire le temps passé en zone de danger : -24 % pour le plan décideurs, -53 % pour C5. Le même plan décideurs **allonge le t90 de 315 à 501 s**. Il faut le dire.
Preuve : `bench/resultats.csv` et `bench/PLANS.md`.

**13. Le gain vient-il de la vraie géométrie du Forum ?**
Non. Le banc chiffré utilise une scène illustrative (5 issues, 500 personnes par salle). Le gain principal de C5 tient à une hypothèse : derrière la Ferronnerie, danger 2.
Preuve : en-tête de `scene-ugc.ts` ; `PLANS.md`, section « Ce qui n'est PAS prouvé ».

**14. Et sur la vraie grille, que donne la chaîne ?**
Aucun t90 : à 20 minutes, 558 personnes sur 600 sont encore dedans (AVANT) contre 323 (APRÈS). Trois portes n'ont aucune sortie réelle rattachée. La chaîne réelle n'est donc pas encore calibrée pour porter un chiffre de démo.
Preuve : `bench/integration/resultats.json` (`ecarts_constates`, `non_sortis_fin`).

**15. Sur quoi vous êtes-vous basés ?**
OpenStreetMap (ODbL) et BD TOPO IGN (Licence Ouverte 2.0) pour la géométrie ; la presse des 19-20 octobre pour la chronologie ; la littérature (Weidmann, SFPE, Fire Technology 2019, Lovreglio) pour les paramètres ; le rapport `contraintes-forum-des-halles.md` pour les 62 leviers.
Preuve : `refuge-data/data/SOURCES.md`, `recherche/06`, `reports/contraintes-forum-des-halles.md`.

**16. Comment calibrez-vous ?**
On ne calibre pas sur le Forum : on reprend des valeurs publiées (1,34 m/s, 1,3 pers/s/m, médiane de pré-mouvement 40,5 s, poids de choix de sortie) et on tire 20 graines. Aucun ajustement sur des mesures du site.
Preuve : `recherche/06` §1, `depart.ts`, `sortie.ts`.

**17. Les temps de pré-mouvement sont-ils adaptés à un couvre-feu ?**
Non. Ils viennent d'exercices d'alarme incendie dans des cinémas ; le code dit lui-même « plancher, pas prévision ». Un couvre-feu, moins urgent, donnerait plus lent `[À CONFIRMER avec un spécialiste]`.
Preuve : commentaire de tête de `src/sim/behavior/depart.ts`.

**18. Qu'est-ce qui est calibré, et qu'est-ce qui est inventé ?**
Calibré sur la littérature : vitesse libre, débit de porte, pré-mouvement, poids du logit. Inventé et assumé : scène cinéma, effet « faster-is-slower », multiplicateurs des messages, hypothèse « danger 2 », débit d'escalator, 70 % de groupes, 4 % de mobilité réduite.
Preuve : tableau B ci-dessus ; mots « hypothèse de réglage » dans `sortie.ts`, `depart.ts`, `mouvement-simple.ts`.

**19. Qu'est-ce qui est vrai, qu'est-ce qui est faux dans la démo ?**
Vrai : la géométrie OSM/IGN, la chronologie de presse, la capacité UGC, les règles de décision citées. Faux ou posé : les effectifs par salle, les largeurs, la scène du banc, les nombres de personnes. Aucune personne ni plaque réelle.
Preuve : `SOURCES.md` (« Règles d'usage pour la démo »), indicateur `estime` dans `scene.json`.

**20. Qu'est-ce qui est en direct, qu'est-ce qui est rejoué ?**
Presque tout est rejoué. Les données (Vélib', Open-Meteo, IDFM, Panoramax) sont des instantanés du 22 oct. ; les décideurs tournent en règles ; les textes viennent d'un cache de rejeu ; la simulation se précalcule. Est « live » : la clé de perturbation du juré (un clic) et le rendu.
Preuve : `resultats.json` → `backend_decision: rules`, `redacteur: rejeu`, `reseau: false` ; `complements/SOURCES.md`.

**21. Les décideurs sont-ils de vrais modèles de langage ?**
Pas dans les mesures : mode `rules` (règles déterministes). Jev (TypeSafe) n'a jamais été appelé ; tout est prêt côté code mais il manque l'activation des crédits Vercel et la clé.
Preuve : `src/agents/JEV.md`, absence de `fixtures/jev/`.

**22. Qui valide les résultats ?**
Personne d'extérieur à ce jour. La mention « non certifié » est portée par chaque sortie ; ISO 20414 n'est pas lue, aucune comparaison aux données de Jülich, aucun exploitant ni SDIS consulté `[À CONFIRMER]`.
Preuve : `recherche/06` §3 ; champ `avertissement` de chaque résultat.

**23. Quel est le coût ?**
Mesuré : zéro (aucun appel payant). Estimé : Jev à 0,04 $ par million de jetons d'entrée, démo complète ~0,02 $ ; 120 $ de crédits Vercel à activer auprès du staff ; plan PostgreSQL Aiven gratuit suffisant pour la démo. Coût d'un lieu supplémentaire : surtout du temps humain.
Preuve : `src/agents/JEV.md` ; `wt-aiven/infra/DEPLOIEMENT.md`.

**24. Quelle part du produit est réellement déployée ?**
Rien n'est confirmé comme déployé : le déploiement Aiven est décrit étape par étape, sans URL ni preuve d'un « 200 » `[À CONFIRMER]`. La chaîne se lance en local avec `npm run demo:integration`.
Preuve : `wt-aiven/infra/DEPLOIEMENT.md` (critère `curl /sante`).

**25. Quels sont les points qui peuvent faire douter le jury ?**
(a) Le plan « décideurs » est plus lent de 59 % sur t90. (b) Le gain principal repose sur une hypothèse de grille. (c) Le métro est fermé à 420 s dans la scène du banc, contre 22 h dans la chronologie de presse, et le commentaire de scène place T0 à 20 h alors que le rapport dit 19 h 20. (d) Le moteur réel n'atteint pas son budget de 8 ms.
Preuve : `bench/PLANS.md`, `scene-ugc.ts` (`devient_cul_de_sac_a_s: 7 * 60` et `ECHEANCES_UGC`), `contraintes-forum-des-halles.md` §0.

---

## D. Les 10 questions à poser à Titouan en premier

1. Quelle chronologie fait foi pour la démo : annonce à 19 h 20 (rapport de presse) ou T0 = 20 h (scène) ? Et le métro ferme-t-il à 420 s ou à 22 h dans le scénario montré ?
2. Montre-t-on le banc chiffré (scène illustrative, rapide) ou la chaîne sur la vraie grille (lente, sans t90 à 20 min) ? Lequel porte le chiffre dit au jury ?
3. Acceptes-tu de dire que le plan « décideurs » allonge le t90 de 59 % tout en réduisant la zone de danger de 24 % ? Ou veux-tu présenter C5 (-53 % de danger, +10 % de t90) ?
4. Combien de temps as-tu réellement mis pour télécharger OSM et la BD TOPO (la reprise de 10:48 incluse) ? Les requêtes Overpass et WFS exactes sont-elles sauvegardées quelque part ?
5. Y a-t-il un 2e lieu à montrer (ou promettre) ? Si oui, lequel et dans quel délai le fais-tu faire, sachant que le Forum est codé en dur dans 4 fichiers ?
6. Qui, côté équipe ou extérieur, a relu les niveaux -1, -2, -5 et les 448 largeurs de portes estimées ? Un exploitant, un pompier ou un architecte a-t-il été consulté ?
7. Le crédit Vercel de 120 $ est-il activé, une clé Jev existe-t-elle, et Adem autorise-t-il un appel payant avant la démo ? Sinon on dit « règles + rejeu », d'accord ?
8. L'URL Aiven existe-t-elle et répond-elle 200 ? Qui clique « Deploy latest commit » avant le gel de 15 h 30 ?
9. Quels chiffres du banc (3 000 personnes, 500 par salle, « danger 2 » derrière la Ferronnerie) peut-on présenter comme « hypothèses posées » et lesquels doivent être remplacés par un relevé avant la démo ?
10. Quelle promesse de validation faisons-nous : « comparateur de parades, non certifié » seulement, ou cite-t-on une comparaison à Jülich / ISO 20414 (non faite) ?
