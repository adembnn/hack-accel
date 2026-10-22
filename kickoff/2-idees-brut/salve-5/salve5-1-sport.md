# Salve 5, domaine sport, compétition et jeu (agent 1)

Cinq recherches web faites. Trouvé et sourcé : Second Spectrum racheté environ 200 M$, Sportradar à 1,29 Md€ de revenu 2025, 9,76 Md$ de transferts de joueurs en 2025, rachat de StatsBomb par Hudl (prix non publié). Non trouvé : budget d'une cellule stratégie de course, prix d'un abonnement club, prix des droits d'une ligue. Ces points sont marqués `[?]` et restent à vérifier avant de retenir l'idée. Aucune idée n'est un assistant tactique pour coach.

Sources utilisées :
- Second Spectrum : https://sbcamericas.com/2021/05/07/genius-sports-to-acquire-second-spectrum-in-data-deal-worth-200m/
- Sportradar 2025 : https://www.sportcal.com/financial/sportradar-hits-record-revenue-in-2025-financial-results/ et https://www.sec.gov/Archives/edgar/data/1836470/000110465926035485/srad-20251231x20f.htm
- Hudl rachète StatsBomb : https://www.hudl.com/blog/hudl-statsbomb-press-release-en
- Transferts 2025 : https://www.goal.com/en-sg/category/transfer/78/k94w8e1yy9ch14mllpf4srnks
- OpenF1 (test communautaire, historique 2023+ gratuit) : https://glama.ai/mcp/servers/@Panth1823/formula1-mcp/blob/b44b4b76a8666677b0071cb506c78d347cc31dff/TESTING_SUMMARY.md
- StatsBomb 360 gratuit : https://blogarchive.statsbomb.com/news/statsbomb-announce-the-release-of-free-statsbomb-360-data-euro-2020-available-now/

---

### Réécrire le règlement, saison rejouée
- **Preuve de paiement** : le règlement est le levier le plus cher du sport et personne ne le teste sur 70 ans de résultats. Preuve indirecte : les contenus de paris de Sportradar pèsent 817 M€ en 2025, et ils dépendent du nombre de matchs à enjeu (https://www.sportcal.com/financial/sportradar-hits-record-revenue-in-2025-financial-results/). Preuve directe d'un budget de conseil en format de compétition : `[?]` (pistes à vérifier : la réforme de la Ligue des champions à 36 clubs en 2024, les cabinets Two Circles, Nielsen Sports, Deloitte Sports Business Group). Preuve faible, à dire au jury.
- **Pour un ami** : l'utilisateur est le responsable des compétitions d'une ligue ou d'une fédération. L'agent teste ses idées de règlement (barème de points, barrages, sprints) sur toutes les saisons passées et lui dit laquelle garde le titre ouvert le plus longtemps sans fausser le résultat.
- **Le moment wow** : « Le juré a doublé les points de la dernière course, et le titre 2021 de F1 a changé de main sous nos yeux. » Il voit la course au titre rejouée en courbes animées, vingt saisons côte à côte, le champion qui bascule quand il glisse un curseur ou dicte une règle à voix haute.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit les saisons réelles (résultats course par course) et on fabrique un modèle de force de chaque pilote ou club. L'agent écrit des variantes de règlement, les fait jouer sur les saisons passées et sur 10 000 saisons simulées, mesure trois choses (suspense : probabilité que le titre soit encore ouvert à N manches de la fin ; équité : le plus fort gagne-t-il ; spectacle : changements de leader), garde la variante qui domine et écrit pourquoi.
- **Donnée disponible à 9h demain** : Jolpica-F1 (successeur d'Ergast, résultats F1 depuis 1950) `[?]` ; FastF1 `[?]` ; football-data.co.uk (résultats et cotes de ligues européennes en CSV) `[?]` ; ClubElo (notes de force des clubs) `[?]`.
- **Qui paie, combien, combien de clients** : ligues et fédérations (environ 50 ligues pro européennes, 55 fédérations UEFA), diffuseurs, FIA. Prix estimé 80 à 250 k€ par an et par organisme `[?]`. Marché européen réaliste : 10 à 25 M€ par an. Il ne dépasse 100 M€ qu'en ajoutant les ligues américaines et l'esport. À dire franchement.
- **Briques Aiven** : ClickHouse pour agréger des millions de saisons simulées en temps réel ; PostgreSQL pour les résultats historiques ; Valkey pour mettre en cache les simulations déjà jouées pendant la démo.
- **Concurrent le plus proche et la différence** : cabinets de conseil en sport business, qui livrent un rapport en six semaines. Les prédictions de Stats Perform décrivent l'avenir, elles ne testent pas une règle.
- **Faisable en 7 h ?** On construit le simulateur de saison, la mesure de suspense, la boucle de l'agent qui écrit les règles, et l'animation. On simule la force des pilotes à partir des résultats. Risque : la mesure de « spectacle » sera contestée par le jury.
- **% LLM** : 8 %

### Les rivaux cachés d'un muret F1
- **Preuve de paiement** : suivi sportif racheté : Second Spectrum, environ 200 M$ (https://sbcamericas.com/2021/05/07/genius-sports-to-acquire-second-spectrum-in-data-deal-worth-200m/). Pour la stratégie de course en F1 : budget des équipes et ingénieurs stratégie `[?]` (aucune source trouvée en cinq recherches ; pistes : plafond budgétaire de la FIA, partenariats techniques d'Oracle et d'AWS avec la F1). Preuve à compléter avant de retenir.
- **Pour un ami** : l'utilisateur est le stratège d'une écurie ou le diffuseur qui raconte la course. Il ne connaît pas les plans de pneus des rivaux. L'agent les devine à partir des temps au tour publics, puis cherche l'arrêt aux stands qui rapporte le plus de points.
- **Le moment wow** : « On a changé l'arrêt au tour 44 et la course s'est rejouée autrement sous nos yeux. » Le juré choisit le tour de l'arrêt, les voitures repartent comme des points lumineux sur un tracé 3D, avec les 2 000 futurs possibles en halo derrière.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit la course tour par tour et l'usure cachée de chaque pneu de chaque rival. Les scénarios : 2 000 courses simulées avec voiture de sécurité aux tours aléatoires, avec les arrêts de la voiture choisie en variante. L'agent estime la dégradation de chaque rival, choisit l'arrêt de plus forte espérance de points et mesure le regret s'il se trompe sur la voiture de sécurité.
- **Donnée disponible à 9h demain** : OpenF1, historique 2023 et après gratuit sans compte d'après un test communautaire ; points d'accès laps, stints, pit, weather vus fonctionnels, `location` (positions) `[?]` à tester ; FastF1 (bibliothèque Python, temps officiels) `[?]`. Choisir une course 2023 à 2025 pour OpenF1 ; une course d'avant (Abu Dhabi 2021) passe par FastF1.
- **Qui paie, combien, combien de clients** : 10 écuries F1, une trentaine d'équipes en endurance et monoplace de formation, diffuseurs. Prix `[?]`. Marché petit en nombre de clients ; le prix unitaire élevé doit être prouvé.
- **Briques Aiven** : Kafka pour rejouer la course comme un flux en direct ; ClickHouse pour stocker les milliers de simulations ; PostgreSQL pour les tours et relais de pneus.
- **Concurrent le plus proche et la différence** : les outils internes des écuries, fermés. Les simulateurs publics donnent des estimations sans deviner l'usure cachée des rivaux.
- **Faisable en 7 h ?** On construit l'estimation d'usure, le Monte Carlo, la vue 3D du tracé. Les trajectoires sont lissées à partir du tour, pas de télémétrie fine. Risque : `location` d'OpenF1 absent ou incomplet ; repli : points animés sur une carte 2D du tracé.
- **% LLM** : 35 %

### Recruter, vu sur un vrai match
- **Preuve de paiement** : les clubs ont dépensé près de 9,76 Md$ en transferts en 2025, +50 % (https://www.goal.com/en-sg/category/transfer/78/k94w8e1yy9ch14mllpf4srnks). StatsBomb racheté par Hudl en 2024, prix non publié (https://www.hudl.com/blog/hudl-statsbomb-press-release-en). Second Spectrum, environ 200 M$.
- **Pour un ami** : l'utilisateur est le directeur sportif d'un club de milieu de tableau qui hésite entre trois joueurs. L'agent rejoue un vrai match de son équipe avec chacun des trois et montre ce qui change.
- **Le moment wow** : « Le juré a mis un joueur de l'Euro 2020 dans l'équipe d'un autre pays, et on a rejoué la phase de jeu. » Il voit les 22 joueurs d'une vraie action, l'un d'eux remplacé, et la valeur de la situation (menace de but) avant et après.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit les positions de tous les joueurs sur les actions d'un match réel (photos à 360° de chaque action). Scénario : on remplace un joueur par un autre dont on a appris les déplacements habituels, et l'agent rejoue les actions en changeant la zone qu'il occupe. Il classe les candidats par gain de menace dans les phases où le club est faible.
- **Donnée disponible à 9h demain** : StatsBomb Open Data sur GitHub, avec le format 360 pour l'Euro 2020 et d'autres compétitions `[?]` (liste exacte des compétitions avec 360 à vérifier) ; bibliothèque statsbombpy.
- **Qui paie, combien, combien de clients** : cellules de recrutement des clubs (environ 700 clubs pro en Europe `[?]`). Prix `[?]` ; ordre de grandeur à vérifier : 20 à 100 k€ par an pour un outil de recrutement. Taille du marché visible via Hudl, Stats Perform, Genius.
- **Briques Aiven** : OpenSearch pour retrouver les joueurs au profil similaire ; PostgreSQL (PostGIS) pour les positions sur le terrain ; ClickHouse pour agréger la menace par phase de jeu.
- **Concurrent le plus proche et la différence** : Wyscout (Hudl), SkillCorner, StatsBomb IQ. Eux comparent des statistiques ; ici le joueur est inséré dans un match réel.
- **Faisable en 7 h ?** On construit la vue du terrain, le remplacement, le score de menace. On simule le déplacement du joueur inséré avec un modèle simple (sa zone moyenne). Risque : le jury juge le modèle de déplacement trop naïf ; l'échantillon libre ne couvre que quelques compétitions.
- **% LLM** : 30 %

### Le tirage d'une draft esport
- **Preuve de paiement** : `[?]`. Aucune source trouvée en cinq recherches. Pistes : GRID et Bayes Esports (fournisseurs de données de matchs), analystes et coachs salariés dans les équipes de League of Legends et Valorant. Preuve faible, à vérifier ou à abandonner.
- **Pour un ami** : l'utilisateur est le coach d'une équipe pro qui choisit ses champions à bannir et à prendre avant le match. L'agent explore l'arbre des choix, que le coach ne peut parcourir qu'en partie.
- **Le moment wow** : « Le juré a banni un champion et la probabilité de victoire a basculé de 41 à 58 %. » Il voit l'arbre de la draft se déplier, les parcours gagnants allumés, et le même match décidé autrement.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit la draft d'un vrai match pro (10 interdits, 10 choix, dans l'ordre) et on apprend ce que chaque équipe prend dans quelle situation. Scénarios : les 1 000 drafts possibles à partir d'un état donné, avec les réponses probables de l'adversaire. L'agent choisit la séquence qui maximise la victoire attendue contre l'adversaire réel, d'après son historique.
- **Donnée disponible à 9h demain** : Oracle's Elixir (CSV de matchs pros, drafts incluses) `[?]` licence à vérifier ; Leaguepedia `[?]` ; Riot API avec clé développeur gratuite `[?]` (la clé doit être mise dans le `.env` par Adem).
- **Qui paie, combien, combien de clients** : équipes pro (environ 80 en Europe sur LoL, Valorant, CS `[?]`). Prix à vérifier. Marché européen plausiblement sous 20 M€ : filtre 3 faible.
- **Briques Aiven** : PostgreSQL pour les matchs ; Valkey pour le cache des états de draft déjà explorés ; ClickHouse pour agréger les victoires par état.
- **Concurrent le plus proche et la différence** : Mobalytics, Blitz, outils internes des équipes. Eux affichent un taux de victoire par champion ; ici l'agent joue un arbre de réponses de l'adversaire.
- **Faisable en 7 h ?** Oui : la draft est tour par tour, on la simule entièrement avec un modèle de victoire appris sur les CSV. Point risqué : trop peu de matchs pros pour une équipe donnée.
- **% LLM** : 12 %

### La course au large, plan rejoué
- **Preuve de paiement** : `[?]`. Aucune source trouvée. Pistes : budgets des équipes IMOCA du Vendée Globe (plusieurs millions d'euros par bateau, à confirmer), logiciels de routage météo payants (Adrena, Expedition, PredictWind). Marché petit, le dire.
- **Pour un ami** : l'utilisateur est le navigateur d'un skipper ou le directeur d'une équipe qui choisit sa route pour dix semaines. L'agent compare des centaines de routes avec le vent réel.
- **Le moment wow** : « On a envoyé le leader à l'ouest des Canaries et il perdait deux jours. » Le juré trace une route sur un globe, la flotte du Vendée Globe 2024 repart, le vent défile en particules, le bateau bifurque et le classement final change.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit la course réelle (positions des bateaux toutes les quelques heures, vent GFS de chaque jour). Scénarios : des centaines de routes autour de chaque point de décision, avec les prévisions qu'un navigateur avait ce jour-là (pas le vent réel connu après coup). L'agent les classe et écrit la décision qu'il aurait prise.
- **Donnée disponible à 9h demain** : prévisions GFS de la NOAA en GRIB, publiques `[?]` ; classements et positions du Vendée Globe 2024 publiés par l'organisateur `[?]` ; polaires des IMOCA à foils non publiques `[?]`, on approche par une polaire générique.
- **Qui paie, combien, combien de clients** : une quarantaine d'équipes IMOCA, quelques classes de course au large, sponsors et télévision. Au plus 10 à 20 M€ par an en voile de compétition seule `[?]`. Filtre 3 faible, sauf élargissement au routage de navires de commerce, qui relève d'un autre terrain.
- **Briques Aiven** : PostgreSQL avec PostGIS pour les traces de bateaux ; ClickHouse pour les grilles de vent ; Valkey pour mettre en cache les routes déjà calculées.
- **Concurrent le plus proche et la différence** : Adrena, Expedition, PredictWind. Ils donnent une route ; ici l'agent rejoue la course entière autrement.
- **Faisable en 7 h ?** On construit le globe CesiumJS, le routage sur grille de vent, la bifurcation des routes. On simule la polaire du bateau. Risque : les fichiers GRIB lourds (prévoir une grille réduite à l'avance).
- **% LLM** : 8 %

### Grille de diffusion rejouée
- **Preuve de paiement** : les droits médias des ligues se comptent en milliards, mais je n'ai pas de source de prix : `[?]` (pistes : droits de la Ligue 1, de la Premier League). Indirect : Sportradar 1,29 Md€ de revenu 2025 (https://www.sportcal.com/financial/sportradar-hits-record-revenue-in-2025-financial-results/). Preuve faible.
- **Pour un ami** : l'utilisateur est le responsable du calendrier d'une ligue ou d'un diffuseur qui décide à quelle heure passe chaque match. L'agent essaie des grilles et montre laquelle remplit le plus de stades et d'écrans.
- **Le moment wow** : « Le juré a déplacé un choc du dimanche soir au samedi et la fréquentation de la saison a changé. » Il voit les 306 matchs d'une saison de Ligue 1 sur une carte de France et un calendrier, les stades qui s'allument ou s'éteignent au fil de la saison.
- **Ce qu'on reconstruit et les scénarios** : on reconstruit la saison réelle (dates, heures, affluences, résultats). Scénarios : des grilles alternatives qui respectent les contraintes (repos des clubs, matchs européens, police). L'agent estime l'affluence par créneau avec un modèle appris sur les saisons passées, choisit la grille et justifie chaque déplacement.
- **Donnée disponible à 9h demain** : football-data.co.uk (dates et résultats) `[?]` ; affluences des stades : Wikipédia ou Transfermarkt `[?]` licences à vérifier ; audiences télé non publiques, on les remplace par les consultations Wikipédia (API ouverte) `[?]`.
- **Qui paie, combien, combien de clients** : ligues et diffuseurs européens (environ 50 ligues). Prix `[?]`. Marché réaliste 10 à 30 M€.
- **Briques Aiven** : PostgreSQL avec PostGIS pour les stades et les distances ; ClickHouse pour agréger les affluences par créneau ; OpenSearch pour retrouver des matchs comparables.
- **Concurrent le plus proche et la différence** : Nielsen Sports, cabinets de conseil, fournisseurs de planification de calendrier `[?]`. Eux produisent un calendrier ; ici on rejoue la saison et on chiffre l'effet de chaque déplacement.
- **Faisable en 7 h ?** Le solveur de grille et la carte sont faisables. L'affluence par créneau est un modèle simple appris sur les saisons passées. Risque : la donnée d'affluence est incomplète et le résultat sera jugé spéculatif.
- **% LLM** : 10 %
