# Script de démo (3 minutes, 8 équipes passent)

Produit : jumeau 3D d'un site (démo : Forum des Halles) pour la société de sécurité privée qui le garde (nom : voir `pitch/nom-et-pitch.md`). Mis à jour le 22 oct. avec les décisions d'Adem de la journée (`CLAUDE.md`).
Le critère unique : chaque ticket sert une étape numérotée ci-dessous. Une tâche qui ne sert aucune étape est coupée.

## Cible et récit (décision d'Adem du 22 oct. après échange avec un juré : remplace « exploitant + Martyn's Law »)
- **Acheteur** : les sociétés de sécurité privée (Securitas, Seris, Fiducial…) qui assurent la sécurité des bâtiments et gèrent les crises sur place. On leur vend l'outil.
- **Sites clients** : les lieux qu'elles gardent. Le Westfield Forum des Halles (URW) est le site de démonstration et un site client visé ; aucun contrat, aucun prix. Dire « site client visé », jamais « client » (`recherche/15-sparring-jury.md`).
- **Pourquoi elles achètent** : elles doivent déjà préparer et exercer les évacuations de leurs sites (exercice tous les 6 mois, `reports/qui-achete-synthese.md`) et n'ont aucun outil pour décider en direct. La Martyn's Law (Royaume-Uni, date d'application à vérifier) n'est plus l'argument central : au plus un marché d'extension.
- **Démo** : manifestations dehors, mouvements de foule, scénarios élargis (colis suspect, alarme incendie, alerte à la bombe, personne dangereuse, malaise, fuite de gaz). Une menace est une **zone dangereuse**, jamais un attaquant. Des personnages IA à rôle (sécurité, police, pompiers, RATP) reçoivent les consignes et guident la foule ; on clique une personne pour voir ce qu'on lui dit.
- **Qui guide** : les agents de sécurité humains guident la foule avec des **fiches mission** ; pas d'alerte au public en canal principal (la notification sur smartphone reste un canal secondaire, pas le produit).
- **Décideurs** : Claude seul (Haiku 5.5 pour les décideurs et personnages, Sonnet 5.5 pour expliquer et rédiger). Plus de Jev. **Dans les mesures ci-dessous, les décideurs tournent en règles et les textes sont rejoués : aucun appel Claude mesuré.** Ne pas dire « Claude décide ».
- **Seuils d'alerte** : orange à 3 personnes/m², rouge à 4. **Convergence** : la démo se joue sur `src/` (état : `reports/etat-convergence.md`).

## Chiffres mesurés (les seuls autorisés, avec leurs deux côtés)
Étiquette obligatoire à l'écran : **« modèle simplifié, non certifié, scène illustrative »**.

**Mesure A** : `bench/resultats.csv`, `bench/resultats-plans.csv`, `bench/PLANS.md` (branche `proto/foule-decision`). Scène illustrative de 3 000 personnes et 5 issues aux chiffres posés (pas un relevé du Forum), mouvement de test (modèle de file), 20 graines, intervalles à 95 %.
- Plan « décideurs » contre consigne du 19 oct. : zone de danger 17 718 → 13 374 personnes-minutes pondérées (-24,5 %), **mais** temps pour évacuer 90 % (t90) 315 → 501 s (+186 s).
- Meilleur de 9 plans candidats (C5, testé sur 20 autres graines, écart inférieur à 1 %) : zone de danger 8 296 (-53 %), **mais** t90 346 s (+31 s, +10 %). **Aucun plan ne bat la consigne sur t90.** Le gain vient surtout de la fermeture d'une issue qui mène au périmètre interdit, sous une hypothèse de la grille.
- Non-sortis (0 contre 0) et écrasement (0 contre 0) : ne départagent rien dans cette scène.

**Mesure B** : `bench/integration-adem/resultats.json` (branche `proto/integration-adem`, source : simulation). Moteur `sim.js` d'Adem sur la grille réelle du Forum, 2 000 personnes, 12 minutes simulées, graine 7, un seul tirage, décideurs en règles, textes en rejeu, sans réseau ni clé.
- Calcul : 12 minutes simulées en 6,1 s, sous Node (pas mesuré dans un navigateur).
- Sorties vers une zone de danger : 73 → 4 (-69). **Mais** t90 238 → 252 s (+14 s) et densité maximale 4 → 5 personnes/m² (une minute au-dessus de 5 après, zéro avant). Écrasement en personnes-minutes : 0 des deux côtés. Non-sortis à 12 min : 77 → 75.
- Un seul tirage : pas d'intervalle de confiance.

Les deux mesures disent la même chose : **le gain de sécurité se paie en temps d'évacuation**. L'outil rend l'arbitrage visible, le directeur le tranche.

## Étapes

| N | Temps | Écran (ce que le jury voit) | Voix | Lot |
|---|---|---|---|---|
| 1 | 0:00-0:20 | Paris en 3D, clic sur les Halles ; la scène se construit | Douleur, acheteur : la sécurité privée (texte 1) | socle, jumeau-3d |
| 2 | 0:20-0:50 | Le Forum, ses niveaux, ses sorties, bouches de métro ; bandeau de données (Aiven : `A_REMPLIR` tant que l'URL n'a pas répondu) | Donnée et sources (texte 2) | jumeau-3d, aiven |
| 3 | 0:50-1:30 | Foule simulée, densité en couleur (orange 3, rouge 4), clic sur une personne : sa consigne et son chemin | Ce qu'une requête ne fait pas (texte 3) | foule-mouvement, foule-decision |
| 4 | 1:30-2:00 | **Le jury agit** : le juré pose une perturbation (sortie fermée, bouche de métro fermée, colis suspect, malaise, fuite de gaz) ; la foule réagit | (texte 4) | jumeau-3d, foule-mouvement |
| 5 | 2:00-2:30 | Poste de crise (écran A « Synoptique ») : les quatre décideurs proposent, 2 à 3 plans rejoués, ordre de service ; ligne « cas précédent » | (texte 5) | decideurs, aiven |
| 6 | 2:30-3:00 | Écran avant/après avec les deux côtés (mesures A et B), puis la slide : cible, route, limites | (texte 6) | pitch |

## Minute par minute : voit / entend / clique

**0:00-0:20, étape 1.** Voit : Paris en 3D, zoom sur Châtelet. Clique : le présentateur clique sur les Halles. Entend : « Lundi 19 octobre, vers 20 h, plus de 3 000 spectateurs ont été évacués de l'UGC des Halles à cause du couvre-feu, selon la presse. Sur place, c'est la sécurité qui gère. Nous donnons aux sociétés de sécurité privée un entraînement et un conseiller. » Fait attribué à la presse du 20 oct. ; dire « nous y étions » seulement si Titouan confirme ce qu'il a vu (`recherche/15`, Q22).

**0:20-0:50, étape 2.** Voit : le Forum du niveau 0 au -5, sorties, escalators, bouches de métro, rues dans environ 1 km. Clique : rien (survol d'une sortie : largeur et état, avec la mention « estimé » quand elle l'est). Entend : « Le lieu vient de données publiques : OpenStreetMap, BD TOPO. Géométrie réelle, capacités et largeurs estimées. » Aiven : ne le dire que si `/sante` répond 200 ; sinon « base locale, même schéma », écrit à l'écran.

**0:50-1:30, étape 3.** Voit : la foule avec les modèles publiés (forces sociales, choix de sortie, départ log-logistique), la carte de densité qui passe à l'orange à 3 personnes/m² et au rouge à 4. Clique : lancer, puis une personne : la consigne que lui donne l'agent de sécurité qui la guide (fiche mission, chemin). Entend : « Ce n'est pas une requête : on rejoue la soirée minute par minute avec des personnes simulées. Deux mille personnes, douze minutes simulées en six secondes. Modèle simplifié, non certifié. »

**1:30-2:00, étape 4 (le jury agit).** Voit : un juré a la souris. Clique : il pose une manifestation dehors, ferme une sortie ou une bouche de métro, ou pose un colis suspect, un malaise, une fuite de gaz (zone d'exclusion). Voit : la foule se reroute, les indicateurs bougent. Entend : « Vous êtes le responsable de crise. Posez ce que vous voulez : issue bloquée, station fermée, colis suspect. La menace est une zone, pas un personnage. » Plan B : le présentateur le fait avec `?demo=1`.

**2:00-2:30, étape 5.** Voit : le poste de crise ; les décideurs (préfecture, RATP, sécurité du centre, directeur) et les personnages IA (sécurité, police, pompiers, RATP), plans rejoués côte à côte, fiches mission remises aux agents humains ; « cas précédent retrouvé ». Entend : « Le plan est choisi par la simulation, pas par le modèle de langage : Claude propose, explique et rédige, un vérificateur rejette tout chiffre absent de la simulation. » **Si la démo tourne en règles et textes rejoués, dire « enregistré » à voix haute** (`recherche/15`, Q5).

**2:30-3:00, étape 6.** Voit : tableau avant/après, puis la slide. Entend : « Résultat, avec ses deux côtés : moins de personnes envoyées vers la zone de danger, 73 contre 4 dans notre simulation de 2 000 personnes, mais quatorze secondes de plus pour évacuer. Dans la scène illustrative à 3 000 personnes, moins 25 % de personnes-minutes en zone de danger, mais plus de trois minutes de plus pour le plan décideurs. Le responsable de crise choisit. Nous vendons aux sociétés de sécurité privée, comme Securitas, Seris ou Fiducial, pour les sites qu'elles gardent : le Forum des Halles est le premier site visé. »

## Texte de voix off continu (à lire, à calibrer au chrono ; chaque phrase chiffrée a sa source ci-dessus)
1. Lundi 19 octobre, selon la presse, plus de 3 000 spectateurs évacués des Halles. Sur place, la sécurité gère. On l'entraîne.
2. Voici le Forum, du niveau 0 au -5, et les rues autour. Géométrie réelle, capacités estimées. Les données viennent d'OpenStreetMap et de la BD TOPO.
3. On rejoue la soirée avec des personnes simulées selon des modèles publiés. Deux mille personnes, douze minutes en six secondes. Cliquez une personne : voyez ce qu'on lui dit. Modèle simplifié, non certifié.
4. À vous : posez une manifestation, fermez une sortie, un colis suspect. La menace est une zone, pas un personnage. Les agents de sécurité guident la foule.
5. Quatre décideurs proposent, la simulation départage, Claude rédige l'ordre de service, chaque chiffre est vérifié. Ici, enregistré.
6. Mesuré : 73 sorties vers la zone de danger contre 4, mais 14 secondes de plus. Le responsable choisit. Nous vendons aux sociétés de sécurité privée ; premier site visé : le Forum des Halles.

## Garde-fous à l'écran
« Simulation générée, modèle simplifié, non certifié, scène illustrative, aide à la décision. » Attribution OpenStreetMap. Une menace = une zone dangereuse, jamais un attaquant. Libellé neutre : « incident d'ordre public ». Mention « généré par IA ». Pastille LIVE / ENREGISTRÉ sur chaque scène. Jamais « conforme Martyn's Law », « certifié », « validé par ». Jamais d'amélioration par la mémoire annoncée : non mesurée.

## À remplir seulement avec une mesure (A_REMPLIR)
URL Aiven Runtime ; latence de bout en bout ; lignes en base ; tarif (aucun prix n'est affiché) ; effectif du premier client ; date d'application de la Martyn's Law ; résultat de la démo avec décideurs Claude (appel payant non encore mesuré) ; mouvement réel (non simplifié) sur la scène du Forum.

## Plan B
- Réseau coupé : `?demo=1` (graine fixe, textes rejoués, données déjà chargées).
- Aiven indisponible : base locale en conteneur, même schéma, et on le dit.
- Vidéo de secours : `demo/secours.mp4`, enregistrée avant la répétition (voir `pitch/mp4-plan.md`).

## Répétition
Chronométrée, deux fois, avec `node tools/capture.mjs --demo` qui doit être tout vert avant (Playwright requis ; sinon la commande l'explique et sort sans rien vérifier).
