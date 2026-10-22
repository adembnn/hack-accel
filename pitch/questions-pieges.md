# Questions pièges du jury et réponses honnêtes

Règle : on ne dit rien que la simulation ou une source ne soutient pas. Les chiffres viennent de `bench/resultats.csv` (lot foule-décision, 20 graines, scène illustrative, modèle simplifié non certifié). Ce qui n'est pas encore mesuré est dit « pas encore mesuré ».

## 1. Votre foule est-elle réaliste ?
Elle utilise des modèles publiés (forces sociales de Helbing, choix de sortie de Lovreglio, départ log-logistique), avec des poids tirés d'expériences de laboratoire. Mais la scène est illustrative et simplifiée : ce n'est pas un relevé de l'UGC des Halles, et nous n'avons pas calé le modèle sur des mesures du lieu. Ce que nous prétendons : comparer des plans entre eux dans le même modèle, pas prédire un nombre de personnes réel.

## 2. Pouvez-vous le certifier, ou un préfet peut-il s'y fier ?
Non. Le modèle est simplifié et non certifié ; l'outil est une aide à la décision et à l'entraînement, pas une étude réglementaire. Une validation sérieuse demanderait un calage sur des exercices d'évacuation réels et l'avis d'un bureau d'études agréé. Cet avertissement figure sur la slide et dans chaque sortie.

## 3. Votre benchmark montre-t-il que votre plan est meilleur ?
Les deux côtés, sans en cacher un : la zone de danger baisse de 17 718 à 13 374 personnes-minutes pondérées (environ -25 %), mais le temps pour évacuer 90 % passe de 315 s à 501 s, car le plan par étapes est plus lent. Non sortis (0 contre 0) et écrasement (0 contre 0) ne distinguent pas les deux plans. Les écarts sont stables sur 20 graines (l'intervalle à 95 % exclut zéro), mais « stable dans le modèle » ne veut pas dire « vrai dans la réalité ». Le choix entre sécurité de la zone et vitesse revient au directeur : l'outil le rend visible, il ne le tranche pas.

## 4. D'où viennent vos données, et sont-elles à jour ?
Géométrie et rues : OpenStreetMap (ODbL) et données publiques ; incident d'ancrage : presse du 20 oct. 2026 (plus de 3 000 spectateurs évacués). Les plans intérieurs du Forum sont stylisés, pas relevés. Le flux en direct (état des stations, manifestation) n'est pas branché : les contraintes sont saisies à la main pour l'instant. Pas d'extraction de géométrie Google ; Street View sert d'inspiration visuelle seulement.

## 5. Que fait Jev que la simulation ne fait pas ?
Jev est un modèle de décision de TypeSafe AI : il ne rédige rien, il répond par des probabilités à des questions typées (choix, score, oui/non). Il ne calcule pas la foule. Quatre décideurs choisissent leurs leviers (avec Jev, ou à défaut avec des règles déterministes), la simulation rejoue et note chaque plan, et Claude rédige l'ordre de service.

## 6. Qui paie, combien, et pourquoi pas un bureau d'études ?
Cible : responsables sûreté de centres commerciaux, salles de spectacle, sites recevant du public. Hypothèse : un exercice sur table rejoué en minutes remplace une partie d'une étude, et laisse une trace de décision. Nous n'avons pas de tarif ni de client signé ; aucun prix n'est affiché. Cette hypothèse reste à tester par entretiens.

## 7. Quelle est la route vers les premiers utilisateurs ?
Pas de client à ce jour. Semaine prochaine : un entretien avec un responsable sûreté de centre, et un second lieu chargé depuis OpenStreetMap pour montrer que le produit n'est pas câblé sur les Halles. Si l'entretien révèle que le besoin est ailleurs (formation, assurance, organisateurs d'événements), nous réorienterons. Un risque assumé : la confiance, car personne n'achète un outil de crise non certifié sans un partenaire reconnu.

## 8. Pourquoi Aiven, et pourquoi la donnée est-elle au cœur ?
PostgreSQL garde scènes, runs, décisions et mémoire des cas passés (les plans qui ont marché sont réutilisés pour les suivants). ClickHouse ne sert que si le volume de positions le justifie : à ce jour, utilisé ou non est à confirmer (champ à remplir sur la slide). L'URL hébergée sur Aiven Runtime n'est pas encore renseignée. L'amélioration au fil des exécutions est un objectif ; nous ne l'avons pas encore mesurée.
