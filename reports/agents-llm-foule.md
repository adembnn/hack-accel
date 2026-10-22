# Agents LLM dans la foule : état de l'art et conception

Décision débloquée : comment concevoir une trentaine de personnages à rôle pilotés par Claude Haiku 5.5, qui influencent la foule du Forum des Halles, puis des projections T+1, T+5, T+10 min. Recherche du 22 oct. 2026, outils Keenable. Les chiffres marqués (snippet) viennent d'un extrait de moteur de recherche, pas d'une lecture du papier entier.

## Version simple (à lire en premier)
Les 3 200 personnes restent pilotées par les modèles publiés (forces sociales, choix de sortie logit, départ log-logistique). Les ~30 personnages à rôle sont des « cerveaux locaux » : toutes les 10 à 15 secondes simulées, ils lisent ce qu'ils voient et choisissent UNE action dans une liste fermée. Le moteur applique l'action avec des effets chiffrés sur des mesures de terrain. Le modèle de langage ne bouge jamais personne et n'écrit jamais de texte libre qui agit sur la simulation. Coût : environ 0,02 à 0,03 $ par minute simulée. Une projection T+10 de trois plans coûte quelques dollars, moins d'un dollar avec un cache de décisions.

Glossaire minimal. **Persona** : fiche de personnage donnée au modèle (rôle, but, caractère). **Agent LLM** : persona + modèle de langage qui choisit des actions. **Perception** : texte structuré décrivant ce que l'agent voit et entend. **Cache de décisions** : on mémorise « dans cette situation précise, l'agent a choisi X » pour ne pas repayer l'appel.


## 1. Artificial Societies : ce que c'est vraiment
| Point | Fait | Source |
|---|---|---|
| Société | Londres, fondée en 2024 (constituée le 18 sept. 2024) par James He (PDG) et Patrick Sharpe (produit). Passée par Y Combinator W25. | societies.notion.site ; eu-startups.com |
| Produit | Plateforme où l'on simule une audience (12 à 3 500 personas par « société ») pour tester un message, une campagne, une idée de produit, et lire des réactions individuelles et agrégées. Marché : étude de marché, communication, crise. | societies.ai/knowledge |
| Méthode | 3 étapes : (1) Persona Genesis, personas reconstruits à partir d'observations de vraies personnes (publications, avis, réseaux sociaux anonymisés, votes publics), avec des méthodes psychométriques ; (2) Society Assembly, personas groupés par traits et reliés par des relations d'influence ; (3) Simulation Engine, on expose la société à un stimulus et on lit l'opinion au niveau individu, segment, population. | societies.ai/knowledge/the-science-behind-artificial-societies |
| Validation (interne, non relue par des pairs) | 86 % de précision de distribution sur 1 000 enquêtes, contre 67 % pour des LLM « biographie inventée » et 91 % pour des humains qui se répètent. Moins de 2 % de contradictions internes. | rapport Survey Evaluation, janv. 2026, résumé sur societies.ai |
| Validation (relue par des pairs) | Une seule étude : 33 299 chatbots, ils forment des communautés par langue et contenu (homophilie). Elle ne valide PAS les 86 %. | He, Wallis, Gvirtz, Rathje, Brit. J. Psychology, déc. 2024 |
| Aveux de limites (sept. 2026) | La correspondance de distribution ne prouve pas les bonnes combinaisons d'opinions ; les LLM sont complaisants (sycophancy) ; l'écart entre ce que les gens disent et ce qu'ils font reste entier. | societies.ai/synthetic-validation ; arXiv 2609.30030 |
| Levée | Pré-seed ~1,5 à 1,7 M$ (Kindred Capital) + seed 3,35 M$ (Point72 Ventures, août 2025) = 5,35 M$ (≈4,5 M€). Les sources divergent légèrement sur le pré-seed. | Business Insider, 27 août 2025 ; Axios ; eu-startups |
| Cas d'usage crise | Étude pour un groupe de biens de consommation : 1 174 personas, 5 sociétés, 24 messages testés. | societies.ai/knowledge |

**Ce que ça nous apprend.** (a) Ils simulent des OPINIONS dans un réseau social, pas des corps dans un espace : rien sur le mouvement, la densité, les issues. Nous ne sommes pas concurrents ; la référence est une inspiration d'architecture (personas + influence + validation honnête), pas une preuve que notre approche marche. (b) Leur argument de vente est « personas ancrés dans des données réelles » contre « biographie inventée ». Pour nous : ancrer chaque rôle dans des documents réels (consignes SSIAP, fiche de poste BSPP, `reports/dispositif-securite-existant.md`). (c) Ils disent eux-mêmes « jamais un vrai substitut aux personnes ». Devant des investisseurs, notre phrase équivalente : « plausible et comparable entre plans, pas prédictif à la seconde ».

## 2. État de l'art LLM + foule / évacuation (2023-2026)
| Travail | Ce qu'il fait | Résultat utile | Limite |
|---|---|---|---|
| Generative Agents (Park et al., 2023, arXiv 2304.03442) | 25 agents, mémoire en langage naturel, réflexion, planification | Mémoire + réflexion + plan = comportements crédibles | Deux jours simulés = des milliers de dollars en 2023 ; coût linéaire en agents |
| Emergent Crowds from Language-Driven Interactions (arXiv 2508.15047, août 2025) | 30 à 50 agents, le LLM choisit but, trajet, paramètres de pilotage ; appel toutes les 100 images | Regroupement, bouche-à-oreille, dispersion émergent | ~5 s par appel ; pas de validation sur données réelles |
| LLM Agent Simulations for Policy (Li, Das, Shirado, arXiv 2509.21868) | 13 000 agents, un an de design avec une équipe de gestion de crise d'université | A servi à de vraies décisions (formation des bénévoles, protocoles) | Utile pour explorer, pas pour prédire |
| WhatIf (CMU, UIST 2026, arXiv 2604.17615) | 12 278 agents ; couche LLM (où aller, pourquoi, messages) séparée d'un moteur spatial déterministe ; appel LLM seulement quand le contexte de l'agent change ; appels groupés ; ~1 s par tour ; on peut rembobiner, brancher, comparer des lignes de temps | Exactement notre architecture ; 5 professionnels l'ont jugé utile pour faire surgir des angles morts (ex. rampes d'accès) | Foule trop ordonnée sous stress extrême, réponses parfois homogènes |
| Model Capacity Frontier (arXiv 2610.24168, oct. 2026) | ~12 000 agents, foule de cérémonie de remise de diplômes, calée sur des mouvements mesurés | Premier ajout de LLM : meilleur sens des flux mais pire occupation dans le temps et dans l'espace ; un 2e raffinement répare en gardant le gain | Montre qu'un LLM ajouté naïvement peut DÉGRADER le réalisme ; chiffres non publiés dans le résumé |
| Plaza à menace mobile (arXiv 2609.37009, sept. 2026) | Agents avec vue ASCII privée, mémoire par graphe, persona ; un « moteur de validation » exécute les routes seulement sur le terrain observé | 89,5 % des agents qui connaissent une sortie utilisable évacuent contre 1,05 % pour les autres : l'information gouverne le résultat | Réponses qui convergent dès que la menace est vue (99,6 % « danger ») |
| Alignement implicite, tireur actif (arXiv 2509.16457) | 80 civils, comparaison à une distribution d'experts ; les personas sont optimisés par boucle | Écart à la référence réduit de 83,8 % ; moins de 10 $ pour 15 itérations | Les LLM choisissent les actions « lisibles » (fuir, se cacher) et jouent mal la sidération ; un seul scénario |

**Ce qui marche.** Séparer décision (LLM) et physique (moteur déterministe), appeler le modèle seulement quand la situation change, garder une trace auditable de chaque décision, laisser l'utilisateur brancher et comparer des scénarios.

**Ce qui ne marche pas, sourcé.** (1) Les LLM sont trop rationnels et trop coopératifs : en dilemme d'évacuation ils répètent des scripts du type « aide les autres, évite la panique » sans lien avec le risque réel (Humanities & Social Sciences Communications, juin 2026). (2) Les distributions sont compressées et homogènes (WhatIf ; arXiv 2509.16457 ; benchmark Artificial Societies 2609.30030). (3) Un LLM ajouté sans calage peut dégrader l'occupation spatiale et temporelle (arXiv 2610.24168). (4) Les modèles « raisonneurs » sont de meilleurs solveurs mais de pires simulateurs : ils sur-optimisent (arXiv 2604.11840). Pour des personnages, un modèle rapide et un raisonnement borné suffisent, et c'est cohérent avec Haiku.

**Validation contre des données réelles : l'honnêteté.** À ma connaissance aucun papier ne valide un LLM-évacuation contre un exercice ou un incident réel au niveau individuel. Les meilleurs cas : calage sur des mouvements mesurés (arXiv 2610.24168) et sur une distribution d'experts (arXiv 2509.16457). Conséquence : le jury doit voir notre calage sur les mesures publiées (temps de départ, débits) et un test « avec/sans agents », pas une promesse de réalisme psychologique.

## 3. Comment les professionnels modélisent personnel et meneurs
Rappel : le temps avant de bouger (pré-mouvement) est souvent la plus grosse part du temps d'évacuation. Dans les cinémas, 1 954 points de mesure sur 30 exercices s'ajustent à une loi log-normale ou log-logistique (Fire Technology, 2019) : c'est le modèle déjà dans notre foule.

| Effet | Chiffre | Source |
|---|---|---|
| Alarme seule contre voix | Réponse moyenne : 1,68 min (sonnerie seule), 0,87 min (alarme vocale), 0,68 min (message préenregistré) ; 27,97 min sans alarme | Réanalyse de Lovreglio et al. 2019 dans Safety Science 2021 (PMC10620751) |
| Station de métro, exercice | Jusqu'à 9 min avec sonnerie seule ; 1 à 7 min avec voix, consignes du personnel ou affichage | Proulx & Sime 1991, cité dans PMC10620751 |
| Guidage par le personnel | Les chances de réponse retardée sont multipliées par 0,33 (régression sur vidéos réelles) ; le guidage en personne est la communication la plus efficace | PMC10620751 |
| Hôpital, personnel qui balaie | Les patients ne bougent qu'après l'instruction : 36 à 59 s après l'arrivée du personnel | Purser/Gwynne et al., Fire Technology 2003 |
| Université, même procédure | Plus de 50 % partent sans y être invités ; moyenne 65 s sans incitation, 81 s quand c'est le personnel qui invite (invitation plus tardive à ceux qui étaient restés) | IAFSS 2004 (fss_7-877) |
| Revue systématique 78 études | Voix, expérience préalable, présence d'une autorité raccourcissent le délai ; contexte inattendu, tâche prenante, récupération d'affaires l'allongent | Revue 2026 « From alarm to action » (snippet) |
| Informés qui guident | Moins de 5 % d'informés suffisent à orienter un groupe de 200 ; ~50 % pour un groupe de 10 | Couzin et al., Nature 2005 ; vérifié sur humains (Anim. Behav. 2008) |
| Ratio de meneurs | Simulation : 1 meneur pour 20 évacués proche de la recommandation fédérale ; GUIDER (donner la direction) bat MENER (emmener) d'environ 25 % car mener crée des grappes ; 5 % de meneurs formés = jusqu'à 40 % de temps en moins (simulation, pas mesure de terrain ; extraits qui se contredisent sur 1:5 et 20:1, à lire avant de citer) | AAMAS « Optimizing Leader Proportion » (snippet) |
| Guides statiques | Un guide posé devant chaque sortie améliore l'évacuation ; effet plus fort sur les personnes qui sont LOIN de la bonne sortie ; au-delà d'un certain nombre, les zones d'influence se chevauchent | Zhang et al., Fire 2025 (MDPI 8/1/30), modèle validé sur expérience |

**Traduction en règles de moteur.** (1) Un message vocal ou une consigne en personne réduit le paramètre d'échelle du départ log-logistique pour les personnes à portée d'audition et de vue ; ordre de grandeur de calage : odds de retard × 0,33 pour un guidage en personne. (2) Une direction donnée (« sortie B ») ajoute un terme dans l'utilité logit de la sortie pour ceux qui entendent ; plus fort pour les personnes loin de la bonne sortie. (3) Un meneur qui emmène devient un point d'attraction et crée une grappe (effet négatif au-delà du ratio) ; un guide statique n'emmène pas. (4) Une personne qui panique augmente la pression de foule locale et abaisse le seuil de départ de ses voisins ; une personne qui filme réduit la vitesse et attire l'attention (retard de ses voisins). Ces deux derniers effets sont des hypothèses de modélisation, pas des mesures : à étiqueter comme telles.

## 4. Proposition pour notre outil
### 4.1 Principe : le LLM choisit une intention, le moteur fait le reste

```
perception (JSON) -> Haiku 5.5 -> action (JSON, liste fermée) -> validateur -> moteur de foule
                                                                    |-- refuse si impossible (porte fermée, hors portée)
                                                                    '-- action de repli par règle si refus ou erreur
```

Même séparation que WhatIf et que le « moteur de validation » de arXiv 2609.37009.

### 4.2 Répartition des ~30 personnages
| Rôle | Nombre | Pourquoi |
|---|---|---|
| Agent de sécurité SSIAP (service de sécurité incendie) | 8 | Postes aux issues et paliers ; le plus gros levier mesuré |
| Pompier BSPP (Brigade de sapeurs-pompiers de Paris) | 4 | Arrivent après un délai ; prennent la zone, demandent des moyens |
| PC sécurité (relais du directeur) | 3 | Centralisent, diffusent les ordres du directeur humain |
| Agent RATP | 4 | Gèrent bouches et quais, fermetures, rediffusion |
| Police | 4 | Barrages, cordons, manifestation dehors |
| Meneur de groupe | 2 | Entraîne 8 à 20 personnes |
| Personne qui panique | 2 | Contagion locale |
| Parent qui cherche son enfant | 1 | Va à contre-courant |
| Personne qui filme | 2 | Ralentit, attire |
| **Total** | **30** | |

Le directeur du centre est l'utilisateur humain : son plan arrive aux agents comme des ORDRES, qu'ils reçoivent avec un délai et peuvent mal exécuter. Aucun agent ne joue le directeur. Premier palier de démo : 12 agents (4 SSIAP, 2 RATP, 2 police, 2 meneurs, 1 panique, 1 filmeur) puis monter.

### 4.3 Ce que l'agent perçoit (≈400 à 700 jetons)
Tout est calculé par le moteur dans le rayon de vue (≈30 m, coupé par les murs) et d'écoute (≈15 m, voix) : jamais la vérité globale. Si l'agent n'a pas vu l'information, il ne la connaît pas (c'est ce qui fait 89,5 % contre 1,05 % dans arXiv 2609.37009).

```json
{ "t": "T+04:20", "role": "ssiap", "poste": "issue_B2", "zone": "niveau -2 couloir est",
  "ordres": [{"id":"O7","age_s":40,"texte_id":"EVAC_VERS_SORTIE","param":"S3"}],
  "issues_visibles": [{"id":"S3","etat":"ouverte","densite":3.8,"flux_pers_min":55},
                      {"id":"B2","etat":"bloquee"}],
  "foule_proche": {"n":140,"vitesse_moy":0.6,"vers":{"S3":0.7,"B2":0.3},"densite_max":4.9},
  "evenements_entendus": [{"age_s":15,"type":"cri","direction":"nord"}],
  "memoire": ["B2 bloquee depuis T+02:10","a deja redirige 40 personnes vers S3"],
  "derniere_action": "DIRIGER S3" }
```

Pas de texte libre venant d'un utilisateur ou d'une donnée externe dans la perception : cela ferme la porte à l'injection de consignes.

### 4.4 Liste fermée d'actions
Sortie obligatoire : `{"action":"<ID>","cible":"<id>","urgence":1..3,"pensee":"<15 mots max, affichage seul>"}`.

| Famille | Actions | Effet moteur |
|---|---|---|
| Tous | `ATTENDRE`, `RAPPORTER(code)` | Rien / message codé au PC |
| Personnel | `DIRIGER(sortie)`, `BLOQUER(zone)`, `ANNONCER(modele_id)`, `ESCORTER(groupe)`, `ALLER(zone)`, `DEMANDER_MOYEN(type)` | Terme de guidage dans le logit des personnes à portée ; réduction du délai de départ ; barrage = obstacle ; annonce = modèle de message prédéfini diffusé dans le rayon |
| RATP | `FERMER_BOUCHE(id)`, `OUVRIR_BOUCHE(id)`, `ANNONCER` | Change l'état des bouches (dans les limites des perturbations du catalogue) |
| Meneur | `MENER(sortie)`, `RESTER`, `CHERCHER(personne)` | Groupe suiveur attiré vers la cible (grappe) |
| Panique | `CRIER`, `COURIR(direction)`, `SE_CALMER` | Pression locale et seuil des voisins |
| Parent | `CHERCHER(zone)`, `RESTER` | Mouvement à contre-courant |
| Filmeur | `FILMER`, `PARTIR(sortie)` | Ralentit, retarde ses voisins |

Les `ANNONCER` utilisent des modèles préécrits (3 à 4 unités d'information : lieu, danger, chemin). Le texte est donc maîtrisé et chiffré.

### 4.5 Cadence
- Périodique : personnel toutes les 10 s simulées, influents toutes les 15 s, PC toutes les 20 s.
- Sur événement : nouvel ordre, changement d'état d'une issue ou d'une bouche, densité > 4 pers./m² dans le champ de vue, cri proche. Au plus un appel déclenché toutes les 3 s par agent.
- Saut : si la perception (arrondie) n'a pas changé depuis le dernier appel, on réutilise l'action précédente sans appeler (principe « n'appeler que si le contexte change » de WhatIf).
- Moyenne attendue : 5 appels par agent et par minute simulée, soit ~150 appels/min pour 30 agents.

### 4.6 Prompt système type (rôle SSIAP) et variantes
```
Tu es {nom}, agent de sécurité incendie (SSIAP) au poste {poste} du Forum des Halles.
Formation : tu guides vers la sortie sûre la plus proche, tu ne laisses personne à contresens
dans un flux dense, tu appliques les ordres du PC sécurité, sauf danger immédiat.
Tu ne vois que ce que décrit la perception. Si une information manque, tu ne l'inventes pas.
Choisis UNE action dans la liste. Réponds en JSON seul, selon le schéma.
Caractère : {calme_0_1} calme, {obeissance_0_1} obéissance aux ordres, {fatigue_0_1}.
```

Variantes (une phrase de rôle + un jeu d'actions) :
- **Pompier BSPP** : priorité vies, délai d'arrivée imposé par le moteur, prend la direction d'une zone, demande des moyens.
- **PC sécurité** : relaie fidèlement l'ordre du directeur ; peut le retarder de 20 à 60 s selon sa charge (fait modélisé côté moteur).
- **RATP / police** : exécutent consignes de fermeture ou de cordon, protocoles propres.
- **Meneur** : « tu veux garder ton groupe de {n} personnes ensemble ; tu suis une personne en uniforme si tu en vois une, sinon la sortie que tu connais ».
- **Panique** : « tu as peur, ton attention se réduit ; tu choisis souvent la sortie par laquelle tu es entré ». Comme les LLM jouent mal l'irrationnel, la panique est en partie TIRÉE AU SORT par le moteur (probabilité calée), le LLM ne fait que choisir la forme.
- **Parent / filmeur** : motivation unique, très simple.

Les paramètres de caractère sont tirés par le moteur selon des lois (diversité imposée) plutôt que laissés au LLM, car les LLM compressent la variabilité.

### 4.7 Mémoire
Pas de réflexion ni de flux de mémoire à la Generative Agents (coût et dérive). Une mémoire de 3 lignes maximum, tenue par le moteur : état connu des issues, dernière action, ordre en cours. Injectée dans la perception. Gain : prompt court, comportement reproductible.

### 4.8 Garde-fous
1. Aucun agent hostile. Les fauteurs de trouble existent seulement comme zone impracticable, obstacle ou issue bloquée (déjà dans les décisions du dépôt). Aucun rôle ne cherche à nuire ni à choisir où nuire.
2. Pas d'action qui crée un danger : la liste ne contient aucun « bloquer volontairement une issue » pour un civil, aucun « déclencher ». `BLOQUER` est réservé au personnel et validé par le moteur.
3. Sortie JSON validée par schéma ; hors liste ou hors portée = rejet et action de repli par règle.
4. Le prompt n'accepte aucun texte libre externe ; `pensee` n'a aucun effet sur le moteur.
5. Journal de chaque décision (perception, action, validation) : audit et fonction « interroger un agent » (idée de WhatIf).
6. Ligne dans l'interface : « Les agents simulent des rôles plausibles, ils ne prédisent pas des personnes réelles. » (alignée sur la prudence d'Artificial Societies.)

### 4.9 Coût avec Haiku 5.5
Hypothèse donnée : 0,10 $/M jetons en entrée, 0,50 $/M en sortie (non vérifié par moi : les pages publiques que j'ai trouvées citent Haiku 4.5 à 1 $ / 5 $ par M ; si le tarif réel est 10 fois plus haut, multiplier tout par 10).

| Poste | Calcul | Résultat |
|---|---|---|
| Un appel | 1 200 jetons d'entrée (prompt 600 + perception 600) + 80 de sortie : 1 200 × 0,10/M + 80 × 0,50/M | ≈ 0,00016 $ |
| Une minute simulée | 150 appels | ≈ 0,024 $ |
| Projection de 3 plans, 5 graines chacun, 10 min | 150 min simulées × 0,024 | ≈ 3,6 $ sans cache |
| Même projection avec 70 % de succès du cache de décisions | 30 % × 3,6 $ | ≈ 1,1 $ |

Latence : environ 0,5 à 1,5 s par appel ; en parallèle (30 appels par tick) c'est invisible pour le direct. Pour les projections plus rapides que le temps réel, limiter la concurrence selon les quotas de l'API et prévoir une file.

### 4.10 Projections T+1, T+5, T+10 : comment ne pas payer cent fois
1. **Une seule simulation de 10 min par (plan, graine)**, dont on lit les états à T+1, T+5, T+10. Ce ne sont pas trois simulations.
2. **Branchement depuis un instantané** (idée WhatIf) : tous les plans partent du même état à T0 ; seuls les ordres diffèrent. Avant l'ordre, les décisions sont identiques et réutilisées.
3. **Cache de décisions** : clé = (rôle, caractère arrondi, perception arrondie : états des issues, densités par tranches de 0,5 pers./m², ordre en cours). Valeur = action. Température 0 pour que la valeur soit reproductible. Deux plans qui mènent un agent dans la même situation partagent l'appel.
4. **Cache de prompt de l'API** : lecture à 10 % du prix d'entrée, mais les modèles de la famille Haiku imposent un minimum de jetons cachables (≈4 096 sur Haiku 4.5, non vérifié pour 5.5) ; nos préfixes de ~600 jetons n'en bénéficieraient pas. Donc ne comptons pas dessus, et mettons la partie statique (rôle, schéma) en tête de prompt au cas où. L'API par lots (−50 %) est asynchrone jusqu'à 24 h : inutilisable en direct.
5. **Graines multiples** = éventail d'incertitude. On affiche une plage (ex. personnes-minutes au-dessus de 5 pers./m², médiane et bornes), pas un chiffre unique, ce qui désarme l'objection « c'est faux au dixième près ».
6. **Réutiliser un plan d'agents pour d'autres plans** : décisions à contexte égal = même action ; sinon nouvel appel.

### 4.11 Ce qu'on montre au jury pour que ça soit crédible
- **Avec/sans agents** : même scénario, même graine, indicateur du ticket #15 (personnes-minutes > 5 pers./m², pression de foule). C'est notre « avant/après » mesurable.
- **Sensibilité** : retirer les 8 SSIAP, ou retarder le PC de 60 s, et montrer l'effet chiffré. Cela prouve que les agents comptent et reste cohérent avec la littérature (staff = levier principal).
- **Interroger un agent** : cliquer un SSIAP, voir sa perception, son action, sa « pensée ». C'est ce que les professionnels ont aimé dans WhatIf.
- **Calage visible** : courbe de départ simulée contre loi log-logistique mesurée en cinéma, avec et sans voix.
- **Phrase d'honnêteté** : validé sur les chiffres publiés, pas sur un incident réel ; le LLM sert à explorer des décisions, pas à prédire.

### 4.12 Risques
LLM trop sage : panique tirée par le moteur. LLM qui dégrade le réalisme (arXiv 2610.24168) : mesure avec/sans agents avant d'activer. Lenteur en démo : cache précalculé du scénario, direct limité à 12 agents. Tarif réel inconnu : compteur de coût et plafond en config.

Décisions à valider par toi (recommandation en premier) :
1. Portée de la démo : (a) 12 agents au direct puis 30 en projection précalculée, recommandé ; (b) 30 au direct ; (c) 6 seulement.
2. Panique : (a) tirée au sort par le moteur, le LLM choisit la forme, recommandé ; (b) tout par le LLM.
3. Affichage de l'incertitude : (a) plage sur 5 graines, recommandé ; (b) un chiffre.

## Sources principales
Artificial Societies : societies.notion.site ; societies.ai/knowledge/* ; arXiv 2609.30030 ; eu-startups.com (29 août 2025) ; businessinsider.com (27 août 2025). LLM + foule : arXiv 2304.03442, 2508.15047, 2509.21868, 2604.17615, 2610.24168, 2609.37009, 2509.16457, 2606.31038, 2606.14989, 2608.19778, 2604.11840 ; s41599-026-07194-z. Personnel et meneurs : PMC10620751 ; Fire Technology 2003 (10.1023/A:1024212214120) et 2019 (10.1007/s10694-019-00881-1) ; IAFSS fss_7-877 ; Couzin, Nature 433:513 ; MDPI Fire 8(1):30 ; AAMAS 10.5555/2665049.2665062 ; IJDRR 2022 S2212420922002382. Tarifs : docs.anthropic.com pricing (Haiku 4.5 : 1 $ / 5 $ ; cache 0,1 ×) ; tarif Haiku 5.5 non recoupé.
