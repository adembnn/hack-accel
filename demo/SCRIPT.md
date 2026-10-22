# Script de démo (3 minutes, 8 équipes passent)

Produit : jumeau 3D du Forum des Halles pour le directeur du centre (nom : voir `pitch/nom-et-pitch.md`).
Le critère unique : chaque ticket sert une étape numérotée ci-dessous. Une tâche qui ne sert aucune étape est coupée.
Source des faits : `reports/`, `CLAUDE.md` (décisions du 22 oct.). Aucun chiffre mesuré n'est écrit ici : ils viennent de `bench/resultats.csv` et restent `A_REMPLIR` tant que le lot `foule-decision` ne les a pas écrits.
Hypothèse à confirmer par Adem (ticket #13, moment où le jury agit) : le juré joue le directeur et ferme une sortie à l'étape 4.

| N | Temps | Écran (ce que le jury voit) | Voix | Lot |
|---|---|---|---|---|
| 1 | 0:00-0:20 | Paris en 3D, le curseur clique sur les Halles ; la scène se construit | Douleur et utilisateur (texte 1) | socle, jumeau-3d |
| 2 | 0:20-0:50 | Le Forum, ses niveaux, ses sorties, bouches de métro ; le bandeau « données Aiven » montre les lignes qui arrivent | Donnée et sources (texte 2) | jumeau-3d, aiven |
| 3 | 0:50-1:30 | Situation du 19 oct. : foule simulée, densité en couleur, plan « avant » rejoué | L'agent fait ce qu'une requête ne peut pas (texte 3) | foule-mouvement, foule-decision |
| 4 | 1:30-2:00 | **Le jury agit** : un juré clique une sortie ou une bouche de métro pour la fermer ; la foule réagit en direct | (texte 4) | jumeau-3d, foule-mouvement |
| 5 | 2:00-2:30 | Les quatre décideurs proposent, comparent 2 à 3 plans rejoués, le meilleur est choisi ; ordre de service avec chiffres sourcés ; ligne « mémoire : cas précédent » | (texte 5) | decideurs, aiven |
| 6 | 2:30-3:00 | Écran avant/après (champs `A_REMPLIR`), puis la route clients | (texte 6) | pitch |

## Minute par minute : voit / entend / clique

**0:00-0:20, étape 1.** Voit : Paris en 3D, puis zoom sur Châtelet. Clique : le présentateur clique sur les Halles. Entend : « Lundi 19 octobre, vers 20 h, plus de 3 000 spectateurs ont été évacués de l'UGC des Halles à cause du couvre-feu. Le directeur du centre a décidé seul, avec ce qu'il savait, en quelques minutes. Nous lui donnons un entraînement et un conseiller. » (fait sourcé : presse du 20 oct., voir `CLAUDE.md`.)

**0:20-0:50, étape 2.** Voit : le Forum du niveau 0 au -5, sorties, escalators, bouches de métro, rues dans environ 1 km ; compteur de lignes qui entrent dans la base. Clique : rien (le présentateur survole une sortie : largeur et état). Entend : « Le lieu vient de données publiques réelles : OpenStreetMap, nos relevés des sorties. Chaque personne simulée est une ligne qui arrive dans PostgreSQL sur Aiven. » Chiffre à dire : `A_REMPLIR` lignes (sortie de `aiven`).

**0:50-1:30, étape 3.** Voit : la foule du 19 oct. avec les modèles publiés (forces sociales, choix de sortie, départ log-logistique) ; la carte de densité ; le plan « consigne réelle » avec ses indicateurs (écrasement, personnes non sorties, personnes sorties en zone de danger). Clique : lancer. Entend : « Ce n'est pas une requête : l'agent simule 600 puis des milliers de personnes minute par minute, observe la pression de foule, et décide. Une requête ne fait pas ça. » Chiffre : effectif simulé `A_REMPLIR`.

**1:30-2:00, étape 4 (le jury agit).** Voit : un juré a la souris. Clique : il ferme une sortie ou une bouche de métro. Voit : la foule se reroute, les indicateurs bougent en direct. Entend : « Vous êtes le directeur. Fermez ce que vous voulez : issue bloquée, station fermée. » Plan B : le présentateur le fait lui-même avec `?demo=1`.

**2:00-2:30, étape 5.** Voit : quatre décideurs (préfecture, RATP, sécurité, directeur) avec leurs leviers réels, 2 à 3 plans rejoués côte à côte, le plan retenu, l'ordre de service en trois lignes ; chaque chiffre cité renvoie à la simulation. Voit : « cas précédent retrouvé » (mémoire, lue en base). Entend : « Le plan est choisi par la simulation, pas par le modèle de langage : il explique et rédige, un vérificateur contrôle chaque chiffre. L'outil s'améliore : il se souvient de ce qui a marché. »

**2:30-3:00, étape 6.** Voit : tableau avant/après avec `A_REMPLIR` (lu dans `bench/resultats.csv`), puis la slide `pitch/slide.html`. Entend : « Avant : la consigne du 19 oct. Après : le plan choisi, mêmes graines, 20 tirages : `A_REMPLIR`. Premiers clients : gestionnaires de centres commerciaux et salles de spectacle, avec la sûreté comme porte d'entrée. Cette semaine : un entretien avec un responsable sûreté de centre. »

## Texte de voix off continu (à lire, environ 380 mots à calibrer au chrono)
1. Lundi 19 octobre, plus de 3 000 spectateurs évacués des Halles. Une seule personne décide : le directeur du centre. On l'entraîne.
2. Voici le Forum, réel, du niveau 0 au -5 et les rues autour. Les données arrivent dans Aiven : sorties, métro, personnes.
3. L'agent rejoue la soirée avec des personnes simulées selon des modèles publiés de mouvement de foule. Il mesure écrasement, personnes non sorties, sorties en zone de danger.
4. À vous : fermez une sortie. La foule réagit, les mesures bougent.
5. Quatre décideurs proposent chacun un plan. On les rejoue, on garde le meilleur. Claude explique et rédige l'ordre de service ; chaque chiffre est vérifié.
6. Résultat mesuré : `A_REMPLIR`. Clients : centres commerciaux, salles, villes. Prochaine semaine : un entretien sûreté.

## Garde-fous à l'écran
« Simulation générée, modèle simplifié, non certifié, aide à la décision. » Attribution OpenStreetMap. Fauteurs de trouble = zones ou issues impraticables, jamais des agents. Libellé neutre : « incident d'ordre public ». Mention « généré par IA ».

## Plan B
- Réseau coupé : `?demo=1` (graine fixe, réponses IA en cache, données déjà chargées).
- Aiven indisponible : base locale en conteneur, même schéma, et on le dit.
- Vidéo de secours : `demo/secours.mp4`, enregistrée avant la répétition (voir `pitch/mp4-plan.md`).

## Répétition
Chronométrée, deux fois, avec `node tools/capture.mjs --demo` qui doit être tout vert avant.
