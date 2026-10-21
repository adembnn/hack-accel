# Salve 3, agent 4 : le système qui fait wow

Angle : partir du moment de démo, remonter au produit. 7 idées. 5 recherches web faites. Aucun appel à une API payante.

Constats de recherche qui pèsent sur le choix :
- CER (évaluation clinique) : des outils d'automatisation de revue de littérature existent (DistillerSR, AiCE de LTTS, AIRA de HCLTech). Ils trient des articles ; je n'ai trouvé aucun outil qui rédige le rapport avec comparaison aux événements indésirables FDA.
- WAMEX (Australie-Occidentale) : plus de 120 000 rapports d'exploration, plus de 105 000 téléchargeables, gratuits, téléchargement en masse depuis 2024.
- Federal Register : API sans clé. Regulations.gov : clé gratuite api.data.gov (clé DEMO limitée à environ 30 requêtes/h, clé perso environ 1 000/h), 5 000 résultats max par recherche.
- Chiffrage sur plans : Togal.AI (environ 17 à 23 M$ levés selon les sources), Kreo, Constor existent. Ils mesurent ; je n'ai pas vu de prix appris sur des marchés réels attribués.
- openFDA (MAUDE) : limites sans clé contradictoires selon les sources (40 ou 240 requêtes/min). On prend une clé gratuite, ou le fichier en téléchargement massif.

---

### Évaluation clinique d'un dispositif médical

- **Pour un ami (2 phrases, zéro jargon)** : un fabricant de dispositifs médicaux (pompe, stent, capteur) doit prouver à l'Europe, avec un dossier de 100 pages mis à jour chaque année, que son appareil est sûr et utile. L'outil lit la littérature scientifique et les incidents déclarés et rédige ce dossier à sa place.
- **Le moment wow** : le jury choisit un dispositif au hasard (« cathéter de dialyse », « pompe à insuline »). « Il a lu 400 articles, trié 31, comparé aux 18 000 incidents déclarés à la FDA, et sorti un rapport de 60 pages en 3 minutes. » À l'écran : le sommaire du rapport qui se remplit, chaque phrase avec un numéro de source cliquable qui ouvre l'article, et un tableau « notre taux d'incidents contre celui de la catégorie, sur 10 ans ».
- **Le travail remplacé** : consultant réglementaire ou responsable affaires réglementaires. Un rapport d'évaluation clinique (CER) coûte 15 à 60 k€ chez un cabinet `[?]` et prend 2 à 3 mois ; il se refait à chaque cycle de mise à jour. Une requête SQL ne lit pas 400 articles ni ne juge leur qualité selon la grille du règlement européen ; une alerte ne rédige rien.
- **Qui paie, combien, combien de clients** : directeurs affaires réglementaires et qualité de fabricants de dispositifs. Environ 30 000 entreprises de technologies médicales en Europe, surtout des PME `[?]`. 20 à 60 k€ par an pour un portefeuille de 3 à 10 dispositifs. Si 3 000 clients paient 40 k€, on est à 120 M€ `[?]`.
- **Donnée disponible à 9h demain** : PubMed et PubMed Central (API NCBI, sans compte, clé gratuite pour monter en débit) ; base d'incidents FDA MAUDE via openFDA (clé gratuite instantanée, ou fichiers en téléchargement massif ; limites sans clé à confirmer sur la page officielle) ; ClinicalTrials.gov (API v2 sans clé) `[?]` pour ces deux derniers. Les données propres au fabricant (notice, essais maison) : on joue le fabricant avec la fiche publique d'un dispositif déjà autorisé (510(k) public).
- **Briques Aiven** : OpenSearch, recherche vectorielle sur les résumés d'articles pour trouver les dispositifs « équivalents » ; ClickHouse, taux d'incidents par catégorie de dispositif et par année sur plusieurs millions de rapports MAUDE ; PostgreSQL, piste d'audit exigée en réglementaire (quelle phrase vient de quelle source, quelle version).
- **Ce que la base sait après 1 000 clients** : pour chaque famille de dispositifs, l'état de l'art déjà validé par les organismes notifiés, les formulations acceptées ou rejetées, et les taux d'incidents de référence corrigés des biais de déclaration. Un concurrent qui part de zéro rédige des CER que l'organisme notifié renvoie.
- **Faisable en 7 h ?** On construit : la chaîne recherche, tri avec grille de qualité, tableau de comparaison aux incidents, rédaction avec sources. On simule : les données propres au fabricant, la mise en page réglementaire exacte. Point le plus risqué : tenir 3 minutes de bout en bout sur un dispositif tiré au hasard sans tomber sur un cas où PubMed ne renvoie rien d'utile ; on teste 15 dispositifs d'avance et le jury choisit dans une liste de 40.
- **% LLM** : 8 %

---

### Faisabilité d'essai clinique qui se corrige

- **Pour un ami (2 phrases, zéro jargon)** : un laboratoire pharmaceutique qui prépare un test de médicament doit deviner dans quels hôpitaux recruter et combien de patients arriveront. L'outil l'estime en relisant tous les essais passés, puis compare sa prédiction à ce qui s'est vraiment passé et se corrige sous les yeux du public.
- **Le moment wow** : « L'agent a prédit le recrutement de 60 essais déjà terminés, a vu qu'il se trompait de 40 %, a écrit lui-même la règle qui lui manquait, et au 61e il se trompe de 12 %. » À l'écran : une courbe d'erreur qui descend run après run, et la liste des « leçons » en clair que la base a écrites (par exemple « les essais qui excluent les diabétiques recrutent 2,3 fois plus lentement »).
- **Le travail remplacé** : responsable faisabilité chez un sponsor ou une CRO (organisme de recherche sous contrat) ; une étude de faisabilité de sites coûte 20 à 80 k€ `[?]` et prend 3 à 6 semaines, et les estimations de recrutement sont connues pour être souvent fausses. Une requête SQL donne une moyenne ; elle ne sait pas lire des critères d'inclusion rédigés en texte libre ni expliquer pourquoi tel essai a échoué.
- **Qui paie, combien, combien de clients** : directions des opérations cliniques de biotechs et pharmas, et CRO. Quelques centaines de sponsors actifs en Europe, plus quelques dizaines de CRO `[?]`. 80 à 250 k€ par an. La couche faisabilité se compte en centaines de millions d'euros `[?]`.
- **Donnée disponible à 9h demain** : ClinicalTrials.gov, plus de 500 000 études, API v2 sans clé, résultats et dates de recrutement inclus `[?]` ; PubMed pour les publications d'échec ; registre européen CTIS en consultation publique `[?]`. Aucune installation.
- **Briques Aiven** : ClickHouse, historique complet des essais avec dates, sites, effectifs, durée réelle contre durée prévue ; OpenSearch, essais « voisins » par similarité de critères d'inclusion ; PostgreSQL, mémoire de l'agent (prédiction, réel, écart, leçon rédigée) avec date de chaque correction ; Valkey, cache des essais déjà vus pendant la démo.
- **Ce que la base sait après 1 000 clients** : les protocoles réels des clients, les taux d'inclusion mesurés par site et par pathologie, et l'historique des prédictions contre le réel. Aucune base publique ne contient la relation « ce qu'on avait prévu » contre « ce qui est arrivé » : c'est ce qui rend la copie difficile.
- **Faisable en 7 h ?** On construit : prédicteur par essais voisins, boucle de backtest (on masque les résultats d'un essai terminé, on prédit, on compare), journal des leçons. On simule : rien, les essais terminés servent de vérité. Point le plus risqué : montrer une amélioration réelle et non une fuite d'information (l'agent ne doit voir ni l'essai qu'il prédit ni ses jumeaux directs) ; on fige une date de coupure par essai.
- **% LLM** : 14 %

---

### Chiffrage d'un bâtiment sur plans

- **Pour un ami (2 phrases, zéro jargon)** : une entreprise du bâtiment qui répond à un appel d'offres doit compter chaque mètre de cloison, chaque porte, chaque tonne de béton sur les plans, puis chiffrer. L'outil lit le plan PDF et rend le métré et un prix, avec la fourchette de ce que des chantiers semblables ont réellement coûté.
- **Le moment wow** : le jury apporte le PDF d'un plan (un dossier public d'école ou d'immeuble) : « 40 secondes, 312 postes comptés, un prix à 6 % du marché attribué réel. » À l'écran : le plan se colorie pièce par pièce, le métré se remplit à côté, et pour chaque poste le prix est relié à 30 lignes de prix réels de chantiers comparables.
- **Le travail remplacé** : économiste de la construction ou conducteur d'études de prix ; 45 à 65 k€ de salaire, ou 5 à 20 k€ par dossier chez un cabinet de métré `[?]`. Une journée à deux semaines selon le bâtiment. Les outils de métré existants (Togal.AI, Kreo, Constor) mesurent des surfaces ; la partie prix appris sur des marchés réels attribués est ce qui manque. Une requête ne lit pas un plan.
- **Qui paie, combien, combien de clients** : entreprises générales et lots techniques du bâtiment ayant un bureau d'études, promoteurs, cabinets d'économistes. Environ 100 000 entreprises avec une fonction chiffrage en Europe `[?]`. 4 à 12 k€ par poste et par an. 20 000 clients à 6 k€ = 120 M€ `[?]`.
- **Donnée disponible à 9h demain** : plans PDF de dossiers publics (dossiers de consultation des entreprises sur la plateforme PLACE, retrait anonyme souvent possible ; appels d'offres de villes américaines avec plans et tableau des offres affiché publiquement) `[?]`, à vérifier avant 9h sur 5 dossiers réels ; prix : bordereaux de prix et décomposés joints aux mêmes dossiers, plus indices de prix du bâtiment INSEE en accès libre `[?]`.
- **Briques Aiven** : ClickHouse, des millions de lignes de prix unitaires par lot, région et date, avec statistiques et indexation ; OpenSearch, rapprocher « cloison BA13 sur ossature 72 mm » de lignes de prix libellées autrement ; PostgreSQL, versions de l'estimation et hypothèses retenues, utile quand l'entreprise défend son prix ; Valkey, cache des indices du jour.
- **Ce que la base sait après 1 000 clients** : le prix réel payé et l'écart entre estimé et attribué, par lot et par région. Un concurrent qui mesure les plans sans cette base donne des quantités, pas un prix.
- **Faisable en 7 h ?** On construit : lecture du plan par un modèle de vision (pièces, murs, ouvertures), métré simplifié sur 5 à 8 postes, rapprochement avec les prix. On simule : les lots techniques (chauffage, électricité). Point le plus risqué : la lecture de plans scannés ou mal cotés ; on choisit 3 plans propres d'avance et on dit au jury que le tirage se fait parmi eux.
- **% LLM** : 16 %

---

### Cible de forage sur 60 000 rapports

- **Pour un ami (2 phrases, zéro jargon)** : une petite société minière doit décider où forer pour trouver du lithium ou du cuivre. Cinquante ans de résultats de forage dorment dans des rapports PDF scannés ; l'outil les relit tous et dit où creuser et pourquoi.
- **Le moment wow** : le jury choisit un métal et un carré de 50 km sur une carte. « Il a relu 60 000 rapports de 1960 à aujourd'hui, retrouvé 40 000 trous de forage oubliés et en propose trois à forer. » À l'écran : la carte où les anciens trous apparaissent un à un pendant que l'agent lit le tableau d'analyses d'un rapport de 1987 (la page scannée et la ligne extraite côte à côte).
- **Le travail remplacé** : géologue d'exploration et étude documentaire de génération de cibles, 3 à 6 mois d'un géologue senior ou 100 à 300 k€ en cabinet `[?]`. Une requête SQL ne peut rien : la donnée est dans des tableaux scannés de 400 mises en page différentes.
- **Qui paie, combien, combien de clients** : sociétés d'exploration juniors cotées et filiales d'exploration de groupes miniers. Environ 1 500 juniors dans le monde, quelques centaines avec des projets en Europe (Suède, Finlande, Portugal, Espagne) `[?]`. 60 à 200 k€ par an et par région. Au mieux autour de 100 M€ `[?]` : c'est l'idée dont le marché est le plus juste ; l'argument est la loi européenne sur les matières premières critiques. Un concurrent très financé existe (KoBold Metals, connu d'avant, non cherché) `[?]`.
- **Donnée disponible à 9h demain** : WAMEX, plus de 105 000 rapports et données brutes téléchargeables gratuitement, sans compte, téléchargement en masse depuis 2024 (vérifié par recherche ; compatibilité navigateur à tester). Jeux de forages ouverts (DMIRS-046) et géochimie harmonisée sur data.gov.au (licence CC-BY pour la couche des rapports). Prendre un sous-ensemble de 3 000 à 5 000 rapports pour la démo.
- **Briques Aiven** : ClickHouse, tous les trous et analyses extraits avec coordonnées et profondeur, requêtes spatiales sur des dizaines de millions de lignes ; OpenSearch, recherche de passages textuels (« anomalie en lithium dans pegmatite ») sur les rapports ; PostgreSQL, trace page par page de ce que l'agent a extrait avec l'image source, car un géologue ne croira jamais un chiffre sans la page.
- **Ce que la base sait après 1 000 clients** : les données de forage propriétaires des clients ajoutées aux publiques, et pour chaque cible proposée, ce qui s'est passé quand elle a été forée.
- **Faisable en 7 h ?** On construit : extraction de tableaux de 200 rapports d'une zone, base ClickHouse, scoring d'une zone, note d'une page. On simule : la géophysique (cartes publiques déjà traitées). Point le plus risqué : la qualité de lecture des vieux tableaux scannés ; on mesure le taux d'erreur sur 30 lignes vérifiées à la main et on l'affiche.
- **% LLM** : 4 %

---

### Mémoire d'influence réglementaire

- **Pour un ami (2 phrases, zéro jargon)** : quand un gouvernement propose une règle, les entreprises concernées envoient des courriers pour obtenir des changements. L'outil a appris, sur des années de règles, quels arguments ont fait modifier le texte final, et rédige le courrier de l'entreprise en conséquence.
- **Le moment wow** : le jury choisit une règle américaine ouverte aux commentaires aujourd'hui. « Il a écrit la lettre de l'industrie, et chaque argument porte la mention "ce type d'argument a modifié la règle finale dans 31 % des cas passés". » À l'écran : la lettre se rédige, chaque paragraphe relié à une règle passée où un argument comparable a fait bouger une phrase, avec le projet et la règle finale côte à côte et la différence surlignée.
- **Le travail remplacé** : consultant en affaires publiques ou juriste réglementaire interne ; une réponse à une consultation, c'est 3 à 10 jours de travail, 5 à 30 k€ facturés `[?]`. Une requête ne sait pas dire quel argument a produit quel changement ; il faut lire les commentaires et comparer les deux versions du texte.
- **Qui paie, combien, combien de clients** : cabinets d'affaires publiques et associations professionnelles à Bruxelles et Paris, directions affaires publiques de grandes entreprises. Le registre de transparence de l'UE compte environ 12 000 organisations `[?]`, dont quelques milliers qui paient. 30 à 100 k€ par an. 2 000 clients à 50 k€ = 100 M€ `[?]`. Limite : les données d'apprentissage sont américaines ; l'extension aux consultations européennes est la route, mais leur donnée ouverte est plus pauvre.
- **Donnée disponible à 9h demain** : Federal Register API (vérifiée : sans clé, 2 000 résultats paginables, filtrer par dates) ; Regulations.gov API (vérifiée : clé gratuite api.data.gov, 5 000 résultats par recherche, un appel de plus par texte de commentaire) pour les commentaires et les dossiers. Commencer par 200 règles d'un seul secteur.
- **Briques Aiven** : OpenSearch, retrouver dans des milliers de commentaires l'argument voisin d'un argument donné ; ClickHouse, comparer des centaines de milliers de commentaires aux modifications du texte final ; PostgreSQL, la table « argument, règle, a-t-il fait bouger le texte » qui s'enrichit à chaque règle finalisée, avec trace.
- **Ce que la base sait après 1 000 clients** : les lettres réellement envoyées par les clients et si le texte a bougé ensuite, y compris pour les consultations européennes que personne n'a rassemblées. Aucune donnée ouverte ne contient les arguments qui n'ont jamais été publiés.
- **Faisable en 7 h ?** On construit : appariement projet de règle et règle finale pour 100 règles, étiquetage automatique « modifié suite à des commentaires », génération de la lettre avec statistiques. On simule : le lobbying direct (réunions). Point le plus risqué : prouver une causalité ; on affiche « corrélation observée », pas « cause ».
- **% LLM** : 9 %

---

### Enquête interne sur 500 000 e-mails

- **Pour un ami (2 phrases, zéro jargon)** : quand une entreprise soupçonne une fraude, des enquêteurs relisent des centaines de milliers de messages pendant des mois pour établir qui savait quoi et quand. L'outil rend ce récit en minutes, chaque affirmation reliée au message exact.
- **Le moment wow** : le jury choisit un nom dans la liste des 150 employés d'Enron. « Il a reconstitué ce que cet homme savait de la fraude, mois par mois, avec 14 messages clés et les 3 qu'il a essayé de cacher. » À l'écran : une frise du temps où chaque jalon ouvre le message d'origine, et une zone « ce qu'il ne pouvait pas ignorer à cette date ».
- **Le travail remplacé** : enquêteurs forensiques des cabinets (Big Four, cabinets d'avocats) à 300 à 700 € l'heure, plus relecteurs de documents ; une enquête interne coûte 100 à 500 k€ et dure 1 à 4 mois `[?]`. Une recherche par mots-clés (ce que fait l'e-discovery classique) renvoie 20 000 messages, pas un récit daté.
- **Qui paie, combien, combien de clients** : directions conformité et juridique de grands groupes, cabinets d'avocats d'enquête. Quelques milliers de grands groupes européens `[?]`. 100 à 250 k€ par an pour un volume donné d'enquêtes. Marché d'e-discovery et d'enquêtes très au-delà de 100 M€ en Europe `[?]`, mais Relativity, Everlaw et Reveal occupent le terrain et ajoutent de l'IA : le débouché est de vendre le récit, pas la relecture.
- **Donnée disponible à 9h demain** : corpus e-mails Enron (environ 500 000 messages, 150 comptes, jeu public de CMU, aussi sur Hugging Face et en version EDRM), sans compte `[?]` ; lien exact à confirmer. Rien à installer.
- **Briques Aiven** : OpenSearch, texte et vecteurs sur 500 000 messages pour retrouver les échanges voisins ; ClickHouse, graphe des échanges (qui écrit à qui, quand, à quel rythme) et ruptures de comportement ; PostgreSQL, piste d'audit : chaque affirmation du récit, message source, version, qui l'a validée (indispensable devant un tribunal).
- **Ce que la base sait après 1 000 clients** : des schémas de comportement frauduleux appris sur des enquêtes passées (changements de canal, messages supprimés), si les clients acceptent de contribuer sous forme anonymisée `[?]`.
- **Faisable en 7 h ?** On construit : index, reconstruction d'une frise pour 10 personnes préparées. On simule : l'anonymisation inter-clients. Point le plus risqué : la confidentialité côté acheteur (un cabinet ne mettra pas ses e-mails chez nous) ; la réponse est un déploiement dans le cloud du client, à dire au jury. Corpus très connu : le jury peut avoir déjà vu des démos dessus.
- **% LLM** : 28 %

---

### Audit cyber extérieur avant un rachat

- **Pour un ami (2 phrases, zéro jargon)** : un fonds qui veut racheter une entreprise ne peut pas, avant la signature, regarder l'intérieur de ses systèmes. L'outil dresse, uniquement à partir de ce qui est visible depuis l'extérieur, la liste de ses portes oubliées et de ses fragilités.
- **Le moment wow** : le jury donne le nom d'une entreprise (la sienne ou une société de portefeuille). « 40 secondes : 312 sites et services qu'on lui connaît, dont 3 oubliés avec un logiciel de 2019 qui a une faille connue et exploitée. » À l'écran : l'arbre de l'entreprise (filiales, domaines, serveurs) qui s'étend, les trois points rouges ouverts un par un avec la preuve publique.
- **Le travail remplacé** : consultants en cybersécurité des cabinets de conseil en transactions ; une revue cyber avant rachat coûte 15 à 40 k€ et prend 2 à 3 semaines `[?]`, et avant la lettre d'intention elle n'est souvent pas faite du tout. Une alerte ne rassemble pas filiales, domaines et vulnérabilités en un avis daté ; une requête ne sait pas dire quelle faille compte vraiment.
- **Qui paie, combien, combien de clients** : fonds de capital-investissement et de capital-risque, directions du développement des grands groupes, cabinets de conseil en transactions. Environ 3 000 fonds actifs en Europe `[?]`. 30 à 100 k€ par an pour un volume de revues, ou 3 à 8 k€ par revue. 3 000 fonds à 40 k€ = 120 M€ `[?]`. Concurrents : surveillance de surface d'attaque (Censys, SecurityScorecard) ; l'angle « avant rachat, avec les filiales » est moins occupé `[?]`.
- **Donnée disponible à 9h demain** : journaux de transparence des certificats (crt.sh, public, sans compte) ; DNS public ; GLEIF (liens de propriété entre entités, téléchargement gratuit) ; annexes des filiales dans les dépôts SEC ; catalogue CISA des failles exploitées et NVD, score EPSS (public) `[?]` pour l'ensemble. Collecte passive uniquement, rien n'est scanné chez la cible ; à valider juridiquement.
- **Briques Aiven** : ClickHouse, milliards de lignes de certificats pour retrouver tous les noms de sites d'un groupe ; OpenSearch, rapprocher un logiciel détecté de la liste des failles connues ; PostgreSQL, le dossier daté (ce qu'on a vu à quelle date), car le fonds peut avoir à le justifier ; Valkey, cache de requêtes DNS pendant la démo.
- **Ce que la base sait après 1 000 clients** : l'historique par entreprise (ses domaines au fil des ans, les failles ouvertes puis corrigées) et la corrélation entre un profil extérieur et les incidents réels déclarés ensuite.
- **Faisable en 7 h ?** On construit : découverte de domaines via certificats et GLEIF, détection de technologies visibles dans les en-têtes publics, croisement avec les failles connues, synthèse. On simule : le score final de risque financier. Point le plus risqué : l'exactitude du rattachement domaine à entreprise (faux positifs) ; on affiche un niveau de confiance et la preuve.
- **% LLM** : 24 %
