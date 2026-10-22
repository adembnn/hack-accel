# 12. Jury simulé : Refuge, état réel du 22 oct. (fin de matinée)

Lecture seule. Sources lues : PDF du challenge, `plan-9h.md`, README et bench de `wt-proto-foule-decision`, `bench-resultats.txt` de `wt-proto-foule-mouvement`, `infra/couche-de-donnees.txt` et `DEPLOIEMENT.md` de `wt-aiven`, `JEV.md` et tests de `wt-decideurs` (51 tests lancés : 51 verts), `wt-proto-pitch` (`pitch/slide.html`, `demo/SCRIPT.md`), `wt-proto-jumeau-3d`, `wt-proto-socle`, `wt-integration`. Une note de jury simulé n'est pas une validation.

## 0. Ce que le jury verrait AUJOURD'HUI (fait, pas promis)

| Brique | État réel | Preuve |
|---|---|---|
| Benchmark avant/après | Tourne, 20 graines, IC95 %. **Sur un mouvement de test simpliste** (file à 1,3 pers./s/m), pas sur le vrai modèle de foule | `wt-proto-foule-decision/bench/resultats.csv`, README : « mouvement de test » |
| Modèle de mouvement réel | Existe en prototype, pas branché au bench. Budget de 8 ms/pas pour 5 000 personnes **non atteint** : moyenne 21,65 ms, p95 45,89 ms, max 121,82 ms | `bench-resultats.txt` |
| Décideurs (4 agents) | Boucle, 46 leviers, vérificateur de chiffres, red team : 51 tests verts. **Testée sur `FauxSimulateur`** (débit « valeur inventée »), pas sur la vraie simulation | `src/agents/fausse-sim.ts` |
| Jev | **Jamais appelé.** Défaut `DECIDER_BACKEND=rules` (règles déterministes, aucun modèle). Test de fumée jamais lancé (`--oui-payant`), pas de clé, pas de `fixtures/jev` | `JEV.md` |
| Couche Aiven | Schéma 11 tables, SSE, REX, garde-fous testés **sur PostgreSQL local Docker**. Le TXT l'écrit lui-même : « pas encore sur le PostgreSQL Aiven », `[A FAIRE]` schéma sur Aiven, 200 de `/sante`, `pg_available_extensions` | `couche-de-donnees.txt` |
| Déploiement | Dockerfile du socle existe. **Aucune URL hébergée**, aucun « Deploy latest commit » fait. Le Dockerfile du socle ne lance pas encore le serveur de `wt-aiven` (couture non traitée) | `DEPLOIEMENT.md` |
| Scène 3D | Scène réelle (OSM + BD TOPO, 1000+ bâtiments, rues), niveaux 0 à -5, grille 0,5 m, 60 images/s annoncés au commit. **Niveaux intérieurs estimés** (`estime: true`, test exige au moins un niveau estimé) | `scene.test.ts`, `types.ts` |
| Bench : scène | « Illustrative, pas un relevé du Forum » : distances, largeurs, 3 000 personnes en 6 salles | README foule-decision |
| Slide | Squelette. **6 lignes `A_REMPLIR`** de preuves, URL Aiven `A_REMPLIR`, tarif `A_REMPLIR`. Aucun entretien client fait ( « semaine prochaine ») | `pitch/slide.html` |
| MP4 de secours | Planifié (`mp4-plan.md`), non enregistré | `SCRIPT.md` |
| Intégration | `wt-integration` : fusions faites, `src/integration/` non commité. `wt-ui`, `wt-adaptateurs` : squelettes seulement | `git status` |

Lecture honnête du bench (`resultats.csv`, avant = consigne du 19 oct., après = plan des décideurs, même 20 graines) :

| Critère | Avant | Après | Verdict |
|---|---|---|---|
| Zone de danger (personnes-minutes pondérées) | 17 717,5 | 13 374,0 | mieux, -4 343,5 (-24,5 %), IC de la différence [-4 447 ; -4 240] |
| t90 (s) | 314,95 | 501,15 | **pire**, +186,2 s (+59 %) |
| t99 (s) | 362,15 | 549,60 | **pire**, +187,45 s |
| Sorties vers lieu sûr | 1 699,3 | 1 662,6 | légèrement pire (-36,7) |
| Pression de Helbing (proxy) | 0,00 | 0,05 | légèrement pire |
| Non sortis 22 h / 23 h / mobilité réduite | 0 | 0 | **non discriminant** (0 des deux côtés) |
| Écrasement > 5 pers./m2 | 0 | 0 | **non discriminant** |
| Note totale (poids = hypothèse) | 86,81 | 88,85 | +2,05, mais les poids sont « hypothèse » dans le code |

Donc : un seul critère clair (zone de danger) bouge en faveur du plan, deux critères de sécurité sont à zéro des deux côtés (le test ne mesure rien dessus), et la vitesse d'évacuation se dégrade de près de 60 %. Sur un jumeau d'« évacuation », une preuve où l'évacuation est plus lente après est le premier trou que le jury trouvera.

## 1. Notes par critère (sur 5)

| Critère | Note | Preuves réelles | Non prouvé |
|---|---|---|---|
| 1. Problème client et valeur | **3** | Événement réel et daté (19 oct., plus de 3 000 spectateurs, décision seul), utilisateur nommé (directeur du centre, responsable sûreté), garde-fous légaux bien posés (non certifié, aucun lieu sensible détourné) | Aucun entretien. Aucun client nommé. Aucun tarif. Aucun test avec un humain du métier. « Le directeur adopterait » est une hypothèse |
| 2. Capacité agent | **3** | 4 décideurs avec 46 leviers, conflits entre rôles, vérificateur de chiffres, red team (51 tests verts), le modèle ne choisit pas le plan, la simulation le fait (bon principe) | Aucun LLM n'a décidé quoi que ce soit en réel (Jev jamais appelé, défaut = règles). La boucle n'a jamais tourné sur la vraie foule. « Équipe de 4 agents » = risque que ce soit 4 jeux de règles |
| 3. Donnée au cœur | **2,5** | Données publiques réelles pour la scène (OSM, BD TOPO), REX publics avec URL de source, mémoire lue avant décision, NOTIFY vers SSE, volume mesuré (3 M lignes en 1,0 s, local) | Rien n'est mesuré sur Aiven. Les positions de la simulation vivent dans le navigateur : retirer la base ne casse pas la démo. Leçons du corpus au statut `non_verifiee`. Embeddings factices (dim. 8). « Mémoire qui améliore » : aucune mesure avant/après de la mémoire |
| 4. Preuve que ça marche | **2** | Bench reproductible, 20 graines, IC95 %, graine fixe (rejouable), -24,5 % en zone de danger | Mouvement réel jamais benché dans la boucle. t90 +59 % pire. Écrasement et non-sortis à 0. Aucune latence ni coût de bout en bout mesurés. Aucune validation contre un cas réel (écart entre modèles jusqu'à 30 % cité par vos propres sources) |
| 5. Exécution et pitch | **2** | Script de démo minuté, garde-fous d'écran, plans B écrits | Pas d'URL, pas de MP4, slide pleine de `A_REMPLIR`, UI pas faite, intégration non commitée, moment « le jury agit » dépend d'un ticket encore ouvert |

Total : 12,5 / 25. Avec les mêmes fondations, 17 à 18 / 25 est atteignable en 3 h si les actions de la section 5 sont faites ; au-delà, c'est de la flatterie.

Prix sponsor Aiven : PostgreSQL seul (pas de ClickHouse ni Kafka, décision assumée). C'est honnête, mais le jury Aiven voit un seul service utilisé comme une base ordinaire (tables, LISTEN/NOTIFY, pgvector si l'extension existe). Probabilité de gagner le prix : faible sans URL Runtime vivante.

## 2. Les trois juges

**Partner Accel.** Décroche à 0:20, quand la slide ou la voix dit « directeur du centre » sans un seul nom d'acheteur ni un prix. Retient : l'événement du 19 oct. est un bon accroche, daté et vérifiable. Note 5/10. Piège : « Qui paie, et à qui avez-vous parlé ? » Vote pour vous si vous avez un nom (même un seul entretien passé ou un rendez-vous fixé) et une phrase de prix honnête.

**Architecte Aiven.** Décroche à 0:30 : le bandeau « données Aiven » n'affiche rien de réel si la base n'est pas sur Aiven. Retient : le schéma propre, les garde-fous (rôle d'écriture limité, SSE avec reprise), le raisonnement sur ClickHouse (calcul du volume plutôt que du jargon). Note 4/10 sans URL, 6/10 avec. Piège : « Si je coupe PostgreSQL, qu'est-ce qui casse ? » Vote pour vous si vous montrez une ligne qui entre dans l'Aiven en direct pendant la démo.

**Directeur du centre.** Décroche à 1:30, si le « juré qui ferme une sortie » ne produit pas de réaction visible en moins de 2 secondes (le moteur réel n'a pas tenu son budget de pas). Retient : la 3D du Forum et la vérification des chiffres. Note 5/10. Piège : « C'est mon Forum, ou une salle imaginée ? » (la scène du bench est « illustrative »). Vote pour vous si le plan retenu dit clairement pourquoi, en citant ce qu'il sacrifie.

## 3. Les 10 plus gros risques pour 15h30

1. **Benchmark mitigé : t90 passe de 315 à 501 s (+59 %) après le plan.** Le jury lit « avant/après » comme « mieux ». Parade : annoncer soi-même l'arbitrage (« moins de monde en zone de danger -24,5 %, évacuation plus lente de 186 s, voici pourquoi ») et le montrer comme un compromis que l'outil rend visible. Ne jamais cacher t90. Vérifier aussi que ce n'est pas un artefact de PLAN_APRES (portes fermées ou phasage forcé) avant de le défendre.
2. **Preuve produite par un mouvement de test, pas par le vrai modèle.** Le bench utilise `mouvement-simple.ts` ; le vrai mouvement coûte 21,65 ms/pas (budget 8 ms non atteint). Si le bench final n'est pas rejoué avec le vrai modèle, la phrase « modèles publiés de foule » est fausse à l'écran. Parade : rejouer le bench avec le vrai mouvement, ou écrire « mouvement simplifié » sur la slide.
3. **Scène illustrative.** Le bench est sur 6 salles inventées pour 3 000 personnes ; la 3D porte un vrai Forum. Le jury confond les deux, puis découvre l'écart. Parade : un seul libellé partout, « géométrie réelle (OSM/BD TOPO), capacités et largeurs estimées ».
4. **Pas de déploiement.** Aucune URL, `Deploy latest commit` jamais cliqué, couture Dockerfile socle/serveur Aiven non traitée, premier déploiement annoncé 3 à 8 min `[supposé]`. Livrable n°1 à 14:00 (URL hébergée) : zéro aujourd'hui.
5. **Niveaux intérieurs estimés** (-1 à -5 : `estime: true`, ascenseurs et escalators sans largeur reconnue). Le directeur du Forum reconnaîtra l'erreur en 5 secondes. Parade : afficher la couleur « estimé » sur la 3D, et le dire.
6. **Jev non prouvé.** Aucun appel, aucune clé, activation des 120 $ non faite, endpoint non testé, repli sur règles. Si Jev est dans le pitch sans avoir tourné, c'est du mensonge ; s'il est absent, la ligne « modèle de décision » disparaît. Parade : ne le dire que si le test de fumée a réussi avant 13:00 ; sinon dire « règles déterministes, Jev prévu ».
7. **Décideurs jamais testés sur la vraie simulation.** `FauxSimulateur` ne produit pas les mêmes effets (débit 60 pers./min/porte inventé). L'intégration (`src/integration/`, non commitée) est le chemin critique ; si elle casse à 13:30, la scène 5 du script est un enregistrement.
8. **Couche Aiven jamais exercée sur Aiven.** pgvector, rôle `enseigne_ecriture` (`CREATEROLE`), 20 connexions max sans pooling, service gratuit qui s'éteint : tout est `[DOC]` ou `[SUPPOSE]`. Un échec au schéma le jour J enlève la mémoire (critère 3).
9. **Slide et vidéo vides.** 6 `A_REMPLIR`, pas de MP4, la démo « live » exige le réseau, des WebGL et un juré volontaire. Parade : MP4 enregistré avant 14:15 sur graine fixe, `?demo=1`.
10. **Allégation « l'outil s'améliore » non mesurée.** La mémoire est lue, jamais comparée (avec et sans). Le challenge demande « mesurablement mieux » et « mémoires qui se contredisent ». Les leçons sont `non_verifiee`. Sans un avant/après mémoire, la phrase doit être retirée de la voix off.

## 4. Les 5 questions pièges et la meilleure réponse honnête

1. **« Votre plan évacue plus lentement (t90 +186 s). En quoi est-ce meilleur ? »**
   Réponse : « Il est plus lent sur ce scénario. Il réduit de 24,5 % le temps passé en zone de danger, sur 20 tirages. L'outil ne dit pas lequel est meilleur : il rend l'arbitrage visible au directeur, qui le fait. Notre grille n'a pas détecté d'écrasement ni de personnes non sorties dans aucun des deux cas, donc le scénario actuel n'est pas assez dur pour les départager sur ces points. »

2. **« Ce n'est pas le vrai Forum, vos chiffres valent quoi ? »**
   Réponse : « La géométrie vient d'OSM et de la BD TOPO ; les niveaux -1 à -5 sont partiellement estimés et marqués comme tels. Les capacités du bench sont illustratives. Les écarts entre modèles publiés atteignent 30 % : lisez nos chiffres comme un ordre de grandeur pour comparer des décisions entre elles, pas comme une prévision. Non certifié. »

3. **« Qu'est-ce qui est live et qu'est-ce qui est enregistré ? »**
   Réponse (à vérifier avant de la dire) : « Live : la simulation rejouée sur graine fixe et la fermeture d'une sortie par le juré. Enregistré : [les réponses du modèle, mises en cache]. La base Aiven reçoit [décisions, chiffres, REX] en direct ; les positions des personnes restent dans le navigateur, nous l'avons choisi après avoir mesuré (3 M de lignes en 1 s en local, 1 Go de disque gratuit). » Ne remplir les crochets qu'avec ce qui est vrai à 14:30.

4. **« Un LLM décide-t-il vraiment, ou ce sont des règles avec un habillage ? »**
   Réponse : « Le plan est choisi par la simulation, pas par un modèle de langage. Les décideurs proposent des leviers à partir de règles et, [si le test de fumée passe,] de Jev, un modèle de probabilités typées ; Claude rédige l'ordre de service et un vérificateur de code rejette tout chiffre absent de la simulation (cas testés : chiffre écrit autrement, chiffre de la mauvaise zone). » Si Jev n'a pas tourné : « Aujourd'hui les décideurs sont à base de règles ; Jev est branché, pas validé. »

5. **« Qui paie, et à qui avez-vous parlé ? »**
   Réponse : « Personne n'a payé et nous n'avons parlé à aucun responsable sûreté avant ce hackathon. Cible : gestionnaires de centres commerciaux et de salles (un ERP de type M ou L doit s'entraîner et garder trace de ses décisions). Prochaine étape cette semaine : un entretien avec un responsable sûreté de centre. Aucun prix n'est inventé. » (Si un contact est obtenu d'ici 14:00, le nommer.)

## 5. Ce qu'il faut COUPER

- **Tout nouvel élément visuel** : textures supplémentaires, deuxième lieu OSM, vue « carton », animations d'ordre de service. Rien de cela ne sert une étape du script ni un critère.
- **Kafka et ClickHouse** : déjà écartés ; ne pas les remettre « pour le prix Aiven » (non mesuré, pas de plan gratuit pour ClickHouse). Le dire une fois, au bon endroit.
- **Embeddings pgvector réels** : coupés. Garder les étiquettes + Jaccard (mesuré). Les vecteurs factices ne doivent pas être montrés comme de la recherche sémantique.
- **Les 46 leviers à l'écran** : en montrer 3 ou 4 dans la scène 5. Le catalogue complet est un détail technique, pas une preuve.
- **Mention de Jev sur la slide et dans la voix off** tant que le test de fumée n'est pas vert. Mieux vaut une ligne en moins qu'une ligne fausse.
- **Le paragraphe « mémoire qui s'améliore »** tant qu'il n'y a pas de mesure avec/sans mémoire.
- **Scénario du 19 oct. en détail minute par minute** dans la voix off : garder une phrase d'accroche sourcée, le reste vaut un panneau de lecture.
- **Le rôle PostgreSQL `enseigne_ecriture` branché au serveur, la sécurité SSE avancée, les tests red team en dehors d'une phrase** : acquis, les laisser dormir.
- **Le « juré joue le directeur » en live si le ticket #13 n'est pas clos avant 12:30** : le présentateur ferme la sortie lui-même (`?demo=1`). Une démo pilotée par le jury sans filet est un risque pur.

## 6. Les 5 actions à plus fort effet sur la note, en 3 heures

1. **Faire exister l'URL Aiven Runtime avec 200 sur `/sante`, puis charger le schéma et le corpus de 13 REX dans la vraie base** (+1 critère 3, +1 critère 5, ouvre le prix Aiven). Régler la couture Dockerfile du socle vers `src/server/serveur.mjs`. Coller la sortie de `curl -i` et de `pg_available_extensions` dans le TXT en remplaçant les `[A FAIRE]` par `[MESURE]`. Si ça échoue à 13:00, écrire « base locale, même schéma » dans la démo, et le dire.
2. **Refaire tourner le bench avec le vrai mouvement et dans une version qui discrimine** (+1 critère 4). Ajouter un scénario où l'écrasement et les non-sortis ne sont pas à zéro (issue fermée, couvre-feu à 23 h), garder les mêmes 20 graines, publier `resultats.csv` complet y compris t90 plus lent. Écrire la formulation d'arbitrage (zone de danger -24,5 %, t90 +59 %) en tête de la slide. Si le vrai mouvement est trop lent pour 3 000 personnes, réduire à 600 personnes et le dire.
3. **Faire passer UN cas de bout en bout : décideurs → vraie simulation → vérificateur de chiffres → ordre de service**, sur une graine fixe, avec la sortie en cache (+1 critère 2). Branche `wt-integration` d'abord ; c'est le chemin critique. Faire le test de fumée Jev une seule fois si Adem l'autorise ; sinon assumer « règles ».
4. **Remplir la slide et enregistrer le MP4 sur graine fixe** (+1 critère 5). Tous les `A_REMPLIR` viennent de `resultats.csv`, du TXT Aiven et de la sortie de l'intégration ; ceux sans source disparaissent au lieu d'être inventés. Enregistrer le MP4 avant 14:15 avec `?demo=1`, légende « vidéo de secours, graine fixe ».
5. **Obtenir un vrai contact utilisateur avant 14:00 et le mettre sur la slide** (+0,5 à +1 critère 1). Un appel, un message à un responsable sûreté de centre commercial ou de salle, même 10 minutes ; on écrit « un entretien tenu le 22 oct. : [ce qu'il a dit] » ou « un entretien planifié le [date] », jamais « validé par ». Sans cela, la route vers les premiers utilisateurs reste une intention.

Gel des fonctionnalités à 14:00 (règle du plan). Après : seulement redéploiement manuel, captures et répétition.

## 7. Marqué « non prouvé » à ne pas écrire sans mesure

- Toute phrase « s'améliore », « apprend », « mémoire efficace » (aucun avant/après mémoire).
- « Jev décide » ou « modèle de décision » (aucun appel réel).
- « Hébergé sur Aiven », « données arrivent en direct dans Aiven » (aucune instance Aiven exercée).
- « Modèles publiés de foule » si le bench final reste sur le mouvement de test.
- « 60 images/s » : annoncé par le commit du jumeau-3d, à re-mesurer sur la machine de démo.
- Tout chiffre de temps gagné, de coût évité ou de marché : aucun n'existe dans le dépôt.
