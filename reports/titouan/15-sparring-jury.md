# 15. Sparring jury : 30 questions, réponses honnêtes, trame de pitch (22 oct. 2026)

Partenaire de sparring de Titouan. Angle défensif : on prépare les attaques, on n'enjolive rien. Lecture seule du dépôt, un seul fichier écrit (celui-ci). Aucun appel payant, aucune clé.

**Avertissements de méthode**
- Les noms des jurés ne sont pas sourcés (`reports/hackathon-terrain.md` : « Juges Paris : non trouvés »). Le raisonnement se fait donc par **profils** : A = investisseur Accel, B = ingénieur Aiven, C = fondateur/opérateur, D = expert sûreté/ERP, E = expert IA agents. Les critères officiels (PDF) : 1 problème client, 2 agent, 3 donnée, 4 preuve, 5 exécution/pitch. Les critères d'Amsterdam (« substance over showmanship », client nommé, preuve mesurable) sont un indice, pas une confirmation pour Paris.
- Les faits sont ceux de `recherche/12-jury-simule.md` (état de **fin de matinée** le 22 oct.) et de `pitch/questions-pieges.md`. Depuis, l'état a pu changer : toute réponse marquée **[VÉRIFIER]** dépend d'un fait à re-contrôler avant 15h30. Si le fait n'est plus vrai, on retombe sur la phrase de repli.
- Chiffres autorisés (tous sourcés dans le dépôt) : zone de danger 17 717,5 → 13 374,0 personnes-minutes pondérées (-24,5 %) ; t90 314,95 → 501,15 s (+186 s, +59 %) ; 20 graines, IC95 % ; écrasement 0 contre 0 et non-sortis 0 contre 0 (non discriminants) ; 51 tests verts sur les décideurs, mais sur `FauxSimulateur` ; mouvement réel à 21,65 ms/pas en moyenne contre un budget de 8 ms ; 3 M de lignes en 1,0 s sur PostgreSQL **local** ; écart entre modèles de foule publiés jusqu'à 30 % ; plus de 3 000 spectateurs évacués de l'UGC le 19 oct. (27 salles) ; 13 REX publics. **Aucun autre chiffre** : pas de marché, pas de temps gagné, pas de prix, pas de « 60 images/s » non re-mesuré.
- Probabilité (P) et dangerosité (D) notées de 1 à 5 ; score = P × D.

---

## 1. Les 30 questions, classées par score (P × D)

Chaque bloc : juré, critère, réponse en 2 phrases, preuve à montrer à l'écran.

### Zone rouge (score 20 à 25)

**Q1. « Qui paie, et à qui avez-vous parlé ? »** (A, C ; critère 1) P5 × D5 = 25
- Réponse : « Personne n'a payé et nous n'avons aucun client signé ; [VÉRIFIER : l'entretien avec X tenu/planifié le …]. Cible : responsables sûreté de centres commerciaux et de salles recevant du public, et nous n'affichons aucun prix tant qu'un entretien ne l'a pas testé. »
- Preuve : la slide, ligne « utilisateur » avec le nom du contact **s'il existe** (sinon la ligne « entretien à tenir cette semaine » écrite telle quelle). Jamais « validé par ».

**Q2. « Votre plan évacue plus lentement (315 → 501 s). En quoi est-ce meilleur ? »** (D, E, A ; critère 4) P5 × D5 = 25
- Réponse : « Il n'est pas meilleur partout : il réduit de 24,5 % le temps passé en zone de danger (17 718 → 13 374 personnes-minutes pondérées, 20 graines), mais le temps pour évacuer 90 % passe de 315 à 501 s. L'outil ne tranche pas, il rend l'arbitrage visible au directeur, qui le fait. »
- Preuve : le tableau complet de `resultats.csv`, t90 inclus, sur la slide. **[VÉRIFIER avant de défendre]** que le +186 s n'est pas un artefact de `PLAN_APRES` (portes fermées ou phasage forcé) ; sinon dire « à expliquer, nous l'avons vu ».

**Q3. « Un LLM décide-t-il vraiment, ou ce sont des règles avec un habillage ? »** (E ; critère 2) P5 × D5 = 25
- Réponse (cas Jev non testé) : « Le plan est choisi par la simulation, pas par un modèle de langage ; aujourd'hui les décideurs proposent des leviers par règles déterministes, Jev est branché mais pas validé. Le modèle de langage rédige l'ordre de service et un vérificateur de code rejette tout chiffre absent de la simulation. »
- Preuve : `DECIDER_BACKEND=rules` visible, la sortie du vérificateur sur un chiffre refusé, les 51 tests verts (en précisant « sur simulateur de test »). Ne dire « Jev décide » que si le test de fumée a réussi **[VÉRIFIER]**.

**Q4. « Si je coupe votre PostgreSQL Aiven, qu'est-ce qui casse ? »** (B ; critère 3) P5 × D5 = 25
- Réponse (si déployé **[VÉRIFIER]**) : « Les décisions, les chiffres et la mémoire des cas passés ne se rechargent plus ; les positions des personnes vivent dans le navigateur, nous l'avons choisi après mesure. » Repli si non déployé : « La base tourne en local avec le même schéma ; l'URL Aiven Runtime n'est pas en ligne et nous le disons. »
- Preuve : `curl -i` sur `/sante` (200) et une ligne qui entre dans la base pendant la démo ; sinon l'écran « base locale, même schéma » écrit, sans bandeau « Aiven ».

**Q5. « Qu'est-ce qui est live et qu'est-ce qui est enregistré ? »** (tous ; exigence du PDF) P5 × D4 = 20
- Réponse : « Live : [la simulation rejouée sur graine fixe, la fermeture d'une sortie] ; enregistré : [les réponses du modèle mises en cache, la vidéo de secours]. » Ne remplir les crochets qu'avec ce qui est vrai à 14h30.
- Preuve : une pastille « LIVE / RECORDED » à l'écran sur chaque scène, et la légende « vidéo de secours, graine fixe » sur le MP4.

**Q6. « C'est le vrai Forum des Halles ou une salle imaginée ? »** (D, C ; critères 1 et 4) P5 × D4 = 20
- Réponse : « La géométrie vient d'OpenStreetMap et de la BD TOPO ; les niveaux -1 à -5 sont en partie estimés et marqués comme tels. Le bench tourne sur une scène illustrative (6 salles, 3 000 personnes) : ce n'est pas un relevé du Forum. »
- Preuve : la 3D avec la couleur « estimé » visible, et un seul libellé identique partout : « géométrie réelle, capacités et largeurs estimées ».

**Q7. « Votre foule est calée sur quoi ? Le bench utilise-t-il le vrai modèle de mouvement ? »** (D, E ; critère 4) P4 × D5 = 20
- Réponse (état de fin de matinée) : « Le bench utilise un mouvement de test simplifié ; le modèle de mouvement réel existe en prototype mais n'est pas branché au bench, et il dépasse le budget (21,65 ms par pas en moyenne contre 8 ms). Nous comparons des plans entre eux dans le même modèle ; les écarts entre modèles publiés vont jusqu'à 30 %, donc c'est un ordre de grandeur, pas une prévision. »
- Preuve : le libellé « mouvement simplifié » sur la slide si le bench n'a pas été rejoué **[VÉRIFIER]** ; sinon le nouveau `resultats.csv` avec le vrai mouvement.

**Q8. « Si votre plan est faux et qu'il y a des blessés, qui est responsable ? »** (D, A ; critère 1) P4 × D5 = 20
- Réponse : « L'outil est une aide à la décision et à l'entraînement, non certifié ; il ne remplace ni l'étude réglementaire d'un bureau agréé ni le responsable d'établissement, qui garde la décision. Cet avertissement figure sur la slide et dans chaque sortie. »
- Preuve : la mention « non certifié » à l'écran dans l'ordre de service, et la phrase « le directeur décide, l'outil montre le prix de chaque choix ».

### Zone orange (score 15 à 16)

**Q9. « Pourquoi ne pas demander directement à un LLM ? Avez-vous comparé ? »** (E, A ; critères 2 et 4) P4 × D4 = 16
- Réponse : « Nous n'avons pas mesuré un LLM seul contre notre boucle ; ce que nous pouvons dire, c'est que dans notre architecture le modèle ne choisit pas, la simulation note chaque plan, et un chiffre non retrouvé est rejeté. [Si fait : sur le même scénario, le plan du LLM seul donne X en zone de danger.] » Ne rien affirmer sinon.
- Preuve : aucune aujourd'hui (voir section 3, trou n°3).

**Q10. « Écrasement à 0 et non-sortis à 0 des deux côtés : votre scénario mesure-t-il quelque chose ? »** (E, D ; critère 4) P4 × D4 = 16
- Réponse : « Non, sur ces deux critères il ne distingue pas les plans : notre scénario actuel n'est pas assez dur pour les départager. Un seul critère clair bouge (zone de danger), et nous le disons plutôt que de le cacher. »
- Preuve : les lignes « 0 contre 0 » laissées dans le tableau, avec la mention « non discriminant ». Si un scénario plus dur a été rejoué **[VÉRIFIER]**, le montrer.

**Q11. « Votre outil "apprend" ? Montrez-moi la mesure avec et sans mémoire. »** (E, B ; critères 2 et 3) P4 × D4 = 16
- Réponse : « Nous stockons les décisions et des leçons issues de retours d'expérience publics, relues avant décision, mais nous n'avons pas mesuré d'amélioration avec et sans mémoire, et les leçons sont au statut non vérifié. Nous ne prétendons donc pas qu'il s'améliore. »
- Preuve : la table des leçons avec son champ `non_verifiee` et sa source. Retirer toute phrase « il s'améliore » tant qu'il n'y a pas d'avant/après mémoire.

**Q12. « Quelles données arrivent en direct et fraîches ? »** (B, E ; critère 3) P4 × D4 = 16
- Réponse : « Le flux en direct (état des stations, manifestation) n'est pas branché : les contraintes sont saisies à la main. Ce qui est vivant, ce sont les décisions et chiffres écrits en base pendant la démo, notifiés à l'écran. »
- Preuve : l'écran du tableau commun qui se met à jour (SSE) si c'est exercé **[VÉRIFIER]** ; sinon ne pas dire « temps réel ».

**Q13. « Vos positions de personnes vivent dans le navigateur : la donnée est-elle décorative ? »** (B ; critère 3) P4 × D4 = 16
- Réponse : « C'est un choix mesuré : 3 M de lignes en 1,0 s sur notre PostgreSQL local, sur un plan gratuit limité à 1 Go, donc nous ne stockons pas chaque position. Ce qui dépend de la base, c'est la mémoire des cas passés et la traçabilité des décisions. » (Le chiffre est local, pas Aiven : le dire.)
- Preuve : le schéma de flux « qui vit où » (navigateur / Aiven), à la demande du PDF (« where it lives and how it flows »).

**Q14. « Un directeur de centre utiliserait-il ça en pleine crise, en 30 secondes ? »** (C, D ; critère 1) P4 × D4 = 16
- Réponse : « Pas en pleine crise aujourd'hui : notre hypothèse est l'exercice sur table et l'entraînement, avec une trace des décisions, qu'un ERP doit pouvoir justifier. L'usage en direct viendrait après un entretien et un calage. »
- Preuve : la scène « le juré ferme une sortie » en moins de 2 s, présentée comme un exercice.

**Q15. « Pourquoi pas un bureau d'études ou les logiciels d'évacuation qui existent ? »** (D, A ; critères 1 et 5) P4 × D4 = 16
- Réponse : « Hypothèse non testée : un exercice rejoué en minutes remplace une partie d'une étude et laisse une trace de décision ; nous n'avons ni tarif ni client qui l'ait confirmé. Nous ne prétendons pas remplacer une étude réglementaire. »
- Preuve : la ligne « hypothèse à tester par entretien » sur la slide, sans comparatif chiffré (aucun n'existe dans le dépôt).

**Q16. « Quatre agents, ou un seul prompt déguisé ? Qu'est-ce qui est autonome ? »** (E ; critère 2) P4 × D4 = 16
- Réponse : « Quatre décideurs (préfecture, RATP, sécurité du centre, directeur) proposent des leviers parmi 46, un vérificateur et une red team contrôlent, et la boucle propose-simule-note tourne sans intervention. Mais elle n'a pas encore tourné sur la vraie simulation, seulement sur un simulateur de test. » [VÉRIFIER l'état de `wt-integration`]
- Preuve : une trace de la boucle (propose, simule, note, retient) sur graine fixe ; sinon dire « enregistré ».

**Q17. « Combien ça coûte, quel modèle économique ? »** (A, C ; critère 5) P5 × D3 = 15
- Réponse : « Nous n'avons pas de tarif et nous n'en inventons pas ; la forme probable est un abonnement par site, à valider en entretien. » (« Probable » est une hypothèse : le dire.)
- Preuve : la ligne tarif de la slide **supprimée** plutôt que `A_REMPLIR`.

**Q18. « Vos 90 premiers jours : comment atteignez-vous un premier utilisateur ? »** (A, C ; critère 5) P4 × D4 = 16
- Réponse : « Un entretien avec un responsable sûreté de centre cette semaine, un second lieu chargé depuis OpenStreetMap pour montrer que l'outil n'est pas câblé sur les Halles, puis un pilote d'exercice sur table. Si l'entretien montre que le besoin est ailleurs (formation, assurance, organisateurs d'événements), nous réorientons. »
- Preuve : trois lignes sur la slide, datées, sans promesse de client.

### Zone jaune (score 9 à 12)

**Q19. « Pourquoi seulement PostgreSQL, pas ClickHouse ni Kafka ? »** (B ; critère 3) P4 × D3 = 12
- Réponse : « Décision assumée : le volume mesuré ne le justifie pas, et ClickHouse n'a pas de plan gratuit ; cocher des services sans raison technique est un mauvais signal. Nous les ajouterions si le volume de positions stockées le demandait. »
- Preuve : le calcul de volume (3 M lignes / 1,0 s en local) dans le TXT de la couche de données.

**Q20. « Votre vérificateur de chiffres : quel taux de chiffres retrouvés ? »** (E ; critère 4) P3 × D4 = 12
- Réponse : « Le taux n'est pas encore mesuré. Ce qui est testé : il rejette un chiffre écrit autrement ou pris dans la mauvaise zone (cas de test), et le modèle écrit des références vers le journal plutôt que des nombres libres. »
- Preuve : la sortie du vérificateur sur un faux chiffre, en direct ou en capture.

**Q21. « Quelle taille de marché ? »** (A ; critère 1) P4 × D3 = 12
- Réponse : « Nous n'avons pas de chiffre de marché sourcé et nous n'en donnons pas. Ce que nous savons : la catégorie d'établissement visée (ERP de type M ou L) est soumise à des visites de commission de sécurité périodiques. »
- Preuve : la ligne de réglementation de `05-reglementation-erp...` (commission tous les 3 ou 5 ans selon la catégorie, source citée), rien d'autre.

**Q22. « Pourquoi vous, pourquoi maintenant ? »** (A ; critère 5) P4 × D3 = 12
- Réponse : « Pourquoi maintenant : le 19 oct., plus de 3 000 spectateurs ont été évacués de l'UGC Ciné Cité Les Halles sur couvre-feu préfectoral, avec un responsable qui décide dans un contexte de stations fermées. Pourquoi nous : [VÉRIFIER : à compléter par Titouan, voir questions]. »
- Preuve : la dépêche presse de l'événement (source citée), pas de commentaire sur le détail minute par minute.

**Q23. « Le juré ferme une sortie : c'est instantané ? »** (C, D ; critère 5) P3 × D4 = 12
- Réponse : « Le rendu rejoue une simulation sur graine fixe, et le modèle de mouvement réel n'a pas atteint son budget (21,65 ms par pas en moyenne contre 8 ms visés), donc nous réduisons le nombre de personnes ou nous rejouons un calcul précalculé et nous le disons. »
- Preuve : la démo `?demo=1` avec le présentateur qui ferme la sortie ; le nombre de personnes affiché à l'écran.

**Q24. « Vos niveaux intérieurs sont-ils exacts ? »** (D ; critère 4) P3 × D4 = 12
- Réponse : « Non : les niveaux -1 à -5 sont estimés (drapeau `estime` dans les données, testé), ascenseurs et escalators sans largeur reconnue. Un relevé de plans ou le plan de l'exploitant serait nécessaire avant tout usage réel. »
- Preuve : la couleur « estimé » sur la 3D.

**Q25. « D'où viennent les poids de votre note globale (86,81 → 88,85) ? »** (E, D ; critère 4) P3 × D4 = 12
- Réponse : « Les poids sont une hypothèse dans le code, donc la note totale ne prouve rien ; nous mettons en avant les critères pris un par un, y compris ceux où le plan est pire. »
- Preuve : ne pas afficher la note totale en gros sur la slide. Le tableau critère par critère suffit.

**Q26. « Licences, Street View, usage malveillant : c'est légal et sûr ? »** (D, A ; critère 1) P3 × D4 = 12
- Réponse : « Géométrie : OpenStreetMap (ODbL) et données publiques ; Street View n'est qu'une inspiration visuelle, aucune géométrie extraite. Les perturbations (issues bloquées) sont des contraintes, jamais un scénario d'attaque optimisé : l'outil optimise la sécurité et l'évacuation. »
- Preuve : la ligne « non certifié, aucun lieu sensible détourné » et les licences sur la slide.

**Q27. « Votre outil est-il câblé sur les Halles ? »** (A, C ; critère 5) P3 × D3 = 9
- Réponse : « Aujourd'hui oui pour la scène soignée ; un second lieu chargé depuis OpenStreetMap est le test prévu, il n'est pas fait. » [VÉRIFIER : si une adresse libre fonctionne, le montrer.]
- Preuve : une seconde adresse chargée, ou l'absence assumée.

**Q28. « Latence et coût de bout en bout ? »** (E, B ; critère 4) P3 × D3 = 9
- Réponse : « Non mesurés de bout en bout. Nous connaissons le coût par pas de la simulation (21,65 ms en moyenne, p95 45,89 ms) et rien d'autre de chiffré. »
- Preuve : aucune ; ne pas inventer de coût par décision.

**Q29. « Qu'avez-vous construit aujourd'hui, et qu'est-ce qui existait ? »** (A, C ; critère 5) P3 × D3 = 9
- Réponse : « [À compléter par Titouan, voir question 7.] Ce que nous pouvons dire de façon vérifiable : le dépôt, les commits et les tickets, et la recherche (corpus de 13 REX publics, réglementation, science des foules) faite avant la fenêtre de code. »
- Preuve : l'historique git. Ne pas gonfler la part « construite aujourd'hui ».

**Q30. « Qui fait quoi dans l'équipe ? »** (A ; critère 5) P3 × D2 = 6
- Réponse : « Quatre builders (Adem, Titouan, Sullyvan, Alexandre) : lots répartis par tickets (socle, jumeau 3D, foule, décideurs, couche de données, pitch). » Les rôles exacts sont dans `CLAUDE.md`.
- Preuve : une ligne sur la slide, noms et lots.

---

## 2. Index par profil de juré et par critère

| Profil | Questions (par ordre de score) |
|---|---|
| A investisseur Accel | Q1, Q2, Q17, Q18, Q21, Q22, Q15, Q8, Q27, Q29, Q30 |
| B ingénieur Aiven | Q4, Q12, Q13, Q19, Q11, Q28 |
| C fondateur/opérateur | Q1, Q6, Q14, Q17, Q18, Q23, Q27, Q29 |
| D expert sûreté/ERP | Q2, Q6, Q7, Q8, Q10, Q14, Q15, Q23, Q24, Q25, Q26 |
| E expert IA agents | Q3, Q9, Q10, Q11, Q16, Q20, Q25, Q28, Q7 |

| Critère | Questions |
|---|---|
| 1 Problème client | Q1, Q6, Q8, Q14, Q15, Q21, Q26 |
| 2 Agent | Q3, Q9, Q11, Q16 |
| 3 Donnée | Q4, Q11, Q12, Q13, Q19 |
| 4 Preuve | Q2, Q5, Q7, Q9, Q10, Q20, Q24, Q25, Q28 |
| 5 Exécution/pitch | Q5, Q17, Q18, Q22, Q23, Q27, Q29, Q30 |

---

## 3. Les 5 questions sans bonne réponse aujourd'hui, et que faire en 2 heures

1. **Q4, Aiven en direct (+ Q12).** Tant que l'URL Runtime n'a pas de `/sante` à 200 et que le schéma n'est pas chargé sur la vraie base, la réponse est « local ». *En 2 h :* résoudre la couture Dockerfile du socle vers le serveur de `wt-aiven`, cliquer « Deploy latest commit », coller `curl -i /sante` et `pg_available_extensions` dans le TXT en remplaçant les `[A FAIRE]` par `[MESURE]`, puis faire écrire une ligne dans la base **visible à l'écran** pendant la démo. Si ça échoue à 13h00 : écrire « base locale, même schéma » et retirer tout bandeau Aiven.

2. **Q1 (+ Q15, Q17, Q18), aucun contact utilisateur.** C'est le trou du critère 1 et du critère 5. *En 2 h :* envoyer 3 messages avant 13h00 (un responsable sûreté de centre ou de salle, un SSIAP, un exploitant de cinéma ou d'ERP via le réseau d'ESSEC/des coéquipiers), et demander 10 minutes aux mentors présents sur place (organisateurs et sponsors) sur « un directeur de centre aurait-il ce besoin ? ». Ce qu'on peut écrire ensuite : « entretien tenu le 22 oct. : [ce qu'il a dit] » ou « planifié le [date] ». Rien d'autre.

3. **Q9, aucune comparaison à un LLM seul.** Le PDF demande une comparaison à un « naïf ou sans donnée ». *En 2 h :* sur le **même scénario** et les mêmes 20 graines, demander à un LLM (cache, crédits déjà donnés, accord d'Adem pour l'appel) de choisir un plan sans simulation, puis **évaluer ce plan dans le simulateur** (gratuit) et comparer zone de danger et t90. Annoncer le résultat quel qu'il soit, y compris si le LLM seul fait aussi bien. Si impossible : supprimer toute allégation de supériorité.

4. **Q11, mémoire sans avant/après.** « Il s'améliore » n'est soutenu par rien. *En 2 h :* faire deux passages sur le même scénario, l'un sans mémoire, l'autre avec une leçon promue (rejouée en simulation et meilleure, règle A3 de `10-red-team`), et mesurer la zone de danger. Si le gain est nul ou non reproductible : retirer la phrase de la voix off et du TXT, et dire « mémoire en place, non mesurée ».

5. **Q7 + Q10, le bench ne porte ni le vrai mouvement ni un scénario qui discrimine.** *En 2 h :* rejouer le bench avec le vrai mouvement (réduire à 600 personnes si le budget de pas n'est pas tenu, et l'écrire), garder les 20 graines, ajouter un scénario où écrasement et non-sortis ne sont pas à zéro (issue fermée, couvre-feu à 23h) et publier `resultats.csv` complet, t90 compris. Vérifier aussi que le t90 plus lent n'est pas un artefact de `PLAN_APRES`. Si non fait : le libellé « mouvement simplifié, non discriminant sur écrasement et non-sortis » devient la phrase officielle.

(Q3 sur Jev n'est pas dans cette liste : la réponse honnête existe, « règles, Jev branché non validé ». Elle devient mauvaise seulement si on dit « Jev décide » sans test de fumée.)

---

## 4. Cinq contre-questions à poser nous-mêmes au jury pour reprendre la main

Elles se posent en réponse à une attaque, pas en pitch. Chacune déplace le débat vers un terrain où l'on a une réponse.

1. *(après Q2)* « Pour un directeur de centre, quel est l'arbitrage à voir en premier : moins de monde en zone de danger ou une évacuation plus rapide ? C'est exactement ce que l'outil lui met sous les yeux. »
2. *(après Q4 ou Q19)* « Avez-vous un seuil de volume de positions à partir duquel vous basculeriez de PostgreSQL vers ClickHouse ? Nous avons mesuré 3 M de lignes en 1,0 s en local et choisi de ne pas les stocker. »
3. *(après Q1)* « Connaissez-vous, dans votre réseau, un responsable sûreté d'un centre ou d'une salle à qui nous pourrions montrer l'outil cette semaine ? Un entretien vaut plus qu'une hypothèse de marché. »
4. *(après Q3 ou Q16)* « Qu'est-ce qui, pour vous, distingue un agent qui décide d'un agent qui propose à un simulateur qui décide ? Notre choix de conception est que le modèle ne choisit jamais le plan. »
5. *(après Q7 ou Q10)* « Préférez-vous un chiffre unique flatteur ou un tableau où l'on voit aussi les critères où nous sommes pires ? Nous avons choisi le second. »

---

## 5. Trame de pitch de 3 minutes en 6 temps (réponses d'avance aux 5 plus dangereuses : Q1, Q2, Q3, Q4, Q5)

Durées indicatives. Phrases entre crochets = à n'écrire que si le fait est vrai à 14h30.

| Temps | Durée | Contenu | Répond à |
|---|---|---|---|
| 1. Accroche | 0:00 à 0:25 | « Le 19 octobre, plus de 3 000 spectateurs ont été évacués de l'UGC des Halles sur un couvre-feu. Le responsable a décidé presque seul. Nous lui donnons un jumeau où il essaie ses décisions avant de les prendre. » | Q22, Q6 (une seule phrase sourcée, pas de minute par minute) |
| 2. Utilisateur et honnêteté | 0:25 à 0:50 | « Utilisateur : le directeur du centre, le responsable sûreté. Nous n'avons pas de client signé ; [un entretien tenu/planifié avec X]. Pas de prix affiché. Outil d'aide à la décision, non certifié. » | **Q1, Q8, Q17** |
| 3. Démo, avec étiquette | 0:50 à 1:30 | Une sortie est fermée (le présentateur ou le juré). Le plan est rejoué ; pastille « LIVE » ou « RECORDED » à l'écran. « Géométrie réelle, capacités estimées, niveaux -1 à -5 en partie estimés. » | **Q5, Q6, Q24** |
| 4. Preuve : on annonce le pire d'abord | 1:30 à 2:10 | « Résultat sur 20 graines : zone de danger -24,5 % (17 718 → 13 374), mais t90 plus lent de 315 à 501 s. Écrasement et non-sortis : 0 des deux côtés, ils ne distinguent rien. L'outil ne tranche pas, il montre l'arbitrage. Mouvement [simplifié / réel]. » | **Q2**, Q10, Q7 |
| 5. Agents et données | 2:10 à 2:40 | « La simulation choisit, pas le modèle de langage. Les décideurs proposent des leviers par [règles / Jev], un vérificateur rejette tout chiffre absent de la simulation. Aiven : [décisions, chiffres, REX en direct sur PostgreSQL / base locale, même schéma]. Les positions restent dans le navigateur, après mesure. » | **Q3, Q4**, Q13, Q19, Q20 |
| 6. Route et limites | 2:40 à 3:00 | « Cette semaine : un entretien avec un responsable sûreté, un second lieu depuis OpenStreetMap. Pas encore mesuré : l'amélioration par la mémoire. Nous préférons le dire. » Puis une contre-question (section 4, n° 3). | Q18, Q11, Q27 |

Règles de la scène : jamais « Jev décide » sans test de fumée ; jamais « hébergé sur Aiven » sans `/sante` à 200 ; jamais « il s'améliore » ; pas de note globale 88,85 ; pas de « 60 images/s » sans mesure sur la machine de démo ; montrer 3 ou 4 leviers, pas 46.

---

## 6. Huit questions à Titouan (faits que seul toi connais)

1. Contact utilisateur réel : as-tu parlé (ou peux-tu parler avant 14h00) à quelqu'un qui gère la sûreté d'un centre commercial, d'un cinéma ou d'une salle ? Nom, rôle, ce qu'il a dit exactement, et acceptes-tu qu'on le cite ?
2. Qui serait le tout premier client, selon toi, et pourquoi lui : un centre (URW, exploitant du Forum), une salle, un organisateur d'événements, un assureur ? As-tu un nom précis ?
3. Tarif : as-tu une idée de ce que le directeur paierait (par site, par exercice, par an) et sur quoi elle repose ? Sinon on supprime la ligne tarif.
4. Qu'as-tu personnellement vu du Forum des Halles : visité, cinéma, sorties connues ? Ce que tu as constaté (portes, escalators, niveaux) peut servir à marquer ce qui est exact ou faux dans la 3D.
5. Le matin du 19 oct. : étais-tu sur place ou as-tu un témoin direct de l'évacuation de l'UGC ? Cela change l'accroche (témoignage vs presse).
6. Jev : le test de fumée a-t-il été lancé, par qui, avec quel résultat ? Et Adem a-t-il autorisé des appels payants (Claude pour la comparaison de la section 3, n° 3) ?
7. Qu'est-ce qui a été codé aujourd'hui et qu'est-ce qui existait avant 9h ? Réponds-moi avec les commits, pour que Q29 soit exacte.
8. Aiven : qui a l'accès à la console (admin d'organisation), l'URL Runtime existe-t-elle, et quelle est la dernière sortie de `/sante` que tu as vue ? De cela dépendent Q4, Q5 et le bandeau « Aiven » de la démo.

---

*Limite : ce fichier n'est pas une validation. Les réponses supposent l'état du dépôt à la fin de matinée du 22 oct. ; les points marqués [VÉRIFIER] doivent être re-contrôlés avec les sorties de commande avant 15h30.*
