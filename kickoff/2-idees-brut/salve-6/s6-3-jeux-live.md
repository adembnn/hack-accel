# Salve 6, agent 3 : jeux vidéo, esport, spectacle vivant, jouets et collections

Recherches faites : 5 (Gigwell, Limitless TCG, Steam Next Fest, API de marché OSRS/EVE, appel de cues par IA). Ce qui est vérifié porte un lien. Le reste porte `[?]`.

---

### Tourneur qui appelle les salles

- **Pour un ami (2 phrases, zéro jargon)** : Un tourneur est la personne qui monte les dates de concert d'un groupe sur la route. Il passe des jours à appeler des salles pour trouver des soirs libres qui se suivent sans trop de kilomètres ; l'agent passe ces appels à sa place, négocie la date et le cachet, et dessine la tournée au fur et à mesure.
- **Ce que le jury voit et entend** : Trois téléphones sonnent sur scène. Ce sont trois coéquipiers qui jouent le programmateur de Lyon, de Nantes et de Lille ; l'agent leur parle d'une voix naturelle, réagit quand Lyon propose le vendredi 14 alors que Lille n'est libre que le 15, et la carte de France redessine l'itinéraire et les kilomètres à chaque réponse.
- **Comment ça se fait aujourd'hui** : Un booker (agent de booking) ou un manager appelle et écrit à chaque salle, un tableur à côté. Il prend une commission sur le cachet, souvent 10 à 20 % `[?]`. Les logiciels existants (Gigwell, Master Tour) rangent les dates après coup, ils n'appellent personne.
- **Qui paie et la preuve** : Les agences de booking et les managers de groupes qui jouent dans des salles de 300 à 3 000 places. Prix plausible : 300 à 800 € par mois et par agence, ou 1 % du cachet signé `[?]`. Preuve partielle : Gigwell, logiciel de booking sorti de Y Combinator, a levé environ 3,7 M$ selon [PitchBook](https://pitchbook.com/profiles/company/87126-31), avec des agences de booking pour clientes d'après [TechCrunch](https://techcrunch.com/?p=1288319). Les sources se contredisent sur le total. Marché de logiciel étroit ; l'argent est surtout dans la commission des bookers.
- **Donnée disponible à 9h demain** : Ticketmaster Discovery API (événements et salles par ville, clé gratuite, quota `[?]`) ; setlist.fm API (salles déjà jouées par un artiste, donc sa taille actuelle ; clé gratuite, usage commercial à demander `[?]`) ; OpenAgenda pour l'agenda des petites salles `[?]` ; OpenStreetMap et OSRM pour les distances `[?]`. Les numéros de salles viennent des sites publics. Pour la démo, les appels vont vers des téléphones de l'équipe. Voix et appels sortants : ElevenLabs (téléphonie sortante à confirmer `[?]`).
- **Ce que fait l'agent** : Il lit les agendas des salles autour de la zone, repère les soirs libres, classe les salles par taille adaptée à l'artiste, choisit qui appeler et dans quel ordre, puis propose une date et un cachet. Il retient par salle qui répond, quels jours elle refuse et quelle remise elle accepte (Postgres pour la mémoire, Valkey pour l'état des appels en cours). À la tournée suivante, il commence par les salles qui disent oui vite.
- **Concurrent le plus proche et la différence** : Gigwell et Master Tour gèrent le planning une fois les dates obtenues. L'agent fait la prospection par téléphone, qui est la partie longue.
- **% LLM** : 12 %

---

### Régisseur qui écoute la scène

- **Pour un ami (2 phrases, zéro jargon)** : Dans un spectacle, le régisseur suit le texte et lance à voix haute chaque changement de lumière, de son et de vidéo au bon mot ; l'agent écoute les acteurs et lance ces changements tout seul. Si l'acteur saute une réplique ou improvise, il s'adapte.
- **Ce que le jury voit et entend** : Un coéquipier joue une scène de deux minutes devant une scène 3D dans le navigateur : il saute deux répliques, en répète une, improvise une phrase. Les lumières et la musique suivent sans retard, et l'agent annonce à voix basse « cue 14 retenu, la réplique n'a pas été dite ».
- **Comment ça se fait aujourd'hui** : Un régisseur général ou un régisseur de plateau lit le texte et annonce « attention 14… top 14 » à chaque cue, soir après soir. Un jour de travail coûte quelques centaines d'euros `[?]`. Le logiciel de référence, QLab, lance les cues quand on appuie sur « go » ; la décision de le faire reste humaine.
- **Qui paie et la preuve** : Théâtres privés, productions de spectacle, agences événementielles qui montent des conventions et des galas avec lumières, vidéo et prises de parole minutées. Prix plausible : 500 à 1 500 € par mois et par salle, ou par prestation pour les agences `[?]`. QLab domine le théâtre (Figure 53) : le marché achète du logiciel de cues. Ma recherche n'a trouvé aucun produit qui appelle les cues par IA, et aucun chiffre de levée. Ni concurrent direct, ni preuve de budget : à tester par deux appels à des théâtres et à une agence événementielle.
- **Donnée disponible à 9h demain** : Le texte et la liste de cues viennent de l'utilisateur (un script de démo écrit par l'équipe). Transcription en direct : ElevenLabs Scribe temps réel `[?]`. Bibliothèque de projecteurs et de leurs canaux : Open Fixture Library, sur GitHub, ouverte `[?]`. Peu de données externes ; la donnée est le flux de paroles et l'historique des représentations.
- **Ce que fait l'agent** : Il suit la position dans le script en temps réel, même quand l'acteur dévie, et déclenche les cues par réseau (OSC, protocole que QLab comprend `[?]`) ou sur la scène 3D de démo. Il apprend de chaque représentation : les délais de salle, les répliques que tel acteur change d'un soir à l'autre, les cues qu'il a dû rattraper. Il avance les cues lents d'une fraction de seconde (Kafka pour les paroles, Postgres pour l'historique).
- **Concurrent le plus proche et la différence** : QLab et ses alternatives (LivePlay, Cue Player) exécutent les cues sur ordre humain. L'agent suit le jeu et prend la décision du top.
- **% LLM** : 8 %

---

### Chasseur de démos pour éditeurs

- **Pour un ami (2 phrases, zéro jargon)** : Un éditeur de jeux indépendants cherche des jeunes studios à signer. Pendant le festival de démos de Steam, l'agent suit des milliers de démos, repère celles qui décollent et prend contact avec le studio avant les autres éditeurs.
- **Ce que le jury voit et entend** : Le festival est en cours le jour du pitch : tout est de la vraie donnée. L'agent dit « ce jeu de gestion n'a pas d'éditeur, 96 % d'avis positifs sur la démo, trois streamers l'ont repris hier, les abonnés ont triplé en 24 h » ; puis il appelle le studio (un coéquipier joue le créateur) et prend rendez-vous.
- **Comment ça se fait aujourd'hui** : Des scouts et des business developers d'éditeurs passent la semaine à jouer des démos, à surveiller Steam, X, Discord et des tableurs. Salaire d'un scout : environ 35 à 70 k€ `[?]`. Chaque édition passe en quelques jours, et un jeu repéré trop tard est signé par un autre.
- **Qui paie et la preuve** : Les éditeurs indépendants (Devolver, Hooded Horse, Kepler, Dear Villagers côté français `[?]`). Prix plausible : 1 000 à 3 000 € par mois par éditeur `[?]`. Preuve que le festival structure le marché : Steam Next Fest d'octobre 2026 court du 19 au 26 octobre ([godisageek](https://godisageek.com/2026/10/steam-next-fest-october-2026/)). Preuve que les éditeurs achètent de la donnée : des outils payants comme Gamalytic ou VG Insights existent `[?]`. Aucun montant vérifié.
- **Donnée disponible à 9h demain** : API publique de Steam pour la fiche d'un jeu et les avis (non officielle, sans clé) `[?]` ; page communauté pour le nombre d'abonnés, à lire par la page `[?]` ; Twitch Helix (clé gratuite par jeton d'application) et YouTube Data API (clé gratuite) pour les streamers et les vidéos `[?]`. Les listes de souhaits sont privées : indisponibles.
- **Ce que fait l'agent** : Il suit chaque démo (avis par heure, abonnés, streamers), calcule la vitesse de croissance, la compare à la thèse de l'éditeur (genre, taille du studio, durée de développement), et dresse une liste courte. Il écrit ou appelle le studio avec un message adapté. Il apprend des jeux que l'éditeur a déjà signés (son goût) et des oui et non du scout (ClickHouse pour la série temporelle, Postgres pour les contacts).
- **Concurrent le plus proche et la différence** : Gamalytic, VG Insights, Steam250 donnent des classements après coup. L'agent agit pendant la fenêtre et prend contact.
- **% LLM** : 22 %

---

### Économiste d'un monde de jeu

- **Pour un ami (2 phrases, zéro jargon)** : Dans un jeu en ligne où les joueurs s'échangent des objets, un économiste de jeu règle les récompenses et traque les tricheurs qui vendent la monnaie du jeu pour de vrais euros. L'agent regarde le marché en continu, repère une manipulation et rejoue « et si on baissait la récompense de 10 % ? » sur un monde simulé.
- **Ce que le jury voit et entend** : Les prix d'un vrai jeu bougent sur l'écran. L'agent dit « le prix du minerai a doublé en 12 minutes, le volume est neuf fois plus haut, ça ressemble à l'épisode du 3 mars » ; on le laisse tester une correction, et 5 000 joueurs simulés réorganisent leurs échanges en direct.
- **Comment ça se fait aujourd'hui** : Un économiste de jeu, des analystes et des modérateurs lisent des courbes dans des outils internes, souvent après les plaintes des joueurs. Des studios ont déjà un économiste maison : CCP (EVE Online) en a eu un à plein temps, Valve en a embauché un `[?]`. Salaire 70 à 120 k€ `[?]`.
- **Qui paie et la preuve** : Les studios dont le jeu a un marché entre joueurs (jeux en ligne massifs, jeux d'objets, plateformes d'univers créés par les joueurs). Prix plausible : 2 000 à 6 000 € par mois par jeu `[?]`. Preuve : les économistes de jeu sont des postes publiés chez de gros studios `[?]`, et Machinations (outil de conception d'économies) vend déjà ce besoin `[?]`. Aucun chiffre de levée vérifié. Le client réel donne ses journaux ; la démo utilise des jeux publics comme preuve.
- **Donnée disponible à 9h demain** : OSRS Wiki, prix en temps réel de la Grand Exchange d'Old School RuneScape, mis à jour toutes les quelques minutes, gratuit, avec un en-tête User-Agent ([OSRS Wiki](https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)). EVE Online ESI, ordres de marché par région, accessibles sans identification d'après des messages de forum, à confirmer sur la doc officielle `[?]`. Guild Wars 2 API, marché public `[?]`.
- **Ce que fait l'agent** : Il lit les prix et les volumes, apprend le comportement normal de chaque objet, signale les sorties du normal et les classe (accaparement, bot, effet d'une mise à jour). Il propose un réglage et le teste dans un monde simulé avant de l'écrire. Il garde en mémoire les incidents passés et les verdicts de l'économiste, ce qui affine ses seuils (ClickHouse pour les séries, Postgres pour les incidents).
- **Concurrent le plus proche et la différence** : Machinations simule des économies de jeu sans flux réel. GameAnalytics et Nakama suivent les joueurs plutôt que les marchés. L'agent relie le flux réel à la simulation de correction.
- **% LLM** : 10 %

---

### Le tournoi avant les prix

- **Pour un ami (2 phrases, zéro jargon)** : Quand un deck gagne un grand tournoi de Magic ou de Pokémon, les cartes qui le composent montent de prix dans les heures qui suivent, et ceux qui réagissent à la main perdent la course. L'agent lit les résultats dès qu'ils tombent, repère les cartes encore sous-évaluées et dit à un revendeur quoi acheter ou quoi réajuster dans son stock.
- **Ce que le jury voit et entend** : On rejoue un grand tournoi passé, ronde par ronde. À l'arrivée de la table finale, la liste des cartes du deck vainqueur s'affiche avec leur prix du matin et la marge attendue, et l'agent dit « j'achète ces 12 cartes avant que la boutique voisine ne bouge ».
- **Comment ça se fait aujourd'hui** : Des revendeurs et spéculateurs suivent les résultats sur Twitter et Discord, puis regardent les prix à la main. Quelques outils (MTGStocks, MTGGoldfish) donnent les cours après coup `[?]`. Coût : des heures de veille, ou un abonnement.
- **Qui paie et la preuve** : Les gros revendeurs de cartes à collectionner, les boutiques en ligne et les investisseurs de cartes. Prix plausible : 100 à 500 € par mois et par revendeur `[?]`. Preuve du marché : eBay a racheté TCGplayer (place de marché de cartes) pour environ 295 M$ en 2022 `[?]` (de mémoire, non vérifié ici). Marché sérieux, mais acheteur individuel plus petit que dans les autres idées.
- **Donnée disponible à 9h demain** : Scryfall (toutes les cartes Magic, prix du jour, téléchargement en bloc, sans clé) `[?]` ; résultats et listes de decks Magic Online publiés sur le site officiel `[?]`. Pokémon : l'API de Limitless demande une clé avec approbation, donc probablement pas dispo à 9h ([description tierce](https://mcp.so/servers/limitlesstcg-mcp)). L'historique de prix n'est pas gratuit : il faut le constituer dès ce soir, ou passer par l'API de Cardmarket pour revendeurs `[?]`. Point faible de l'idée : la donnée de prix dans le temps.
- **Ce que fait l'agent** : Il lit les résultats, reconstitue les decks gagnants, croise avec les prix de plusieurs places de marché et dresse une liste d'achat avec un seuil de marge. Dans la démo, les ordres sont simulés. Il apprend en comparant sa prédiction aux prix 48 heures plus tard (quel type de tournoi fait monter quelles cartes) et ajuste.
- **Concurrent le plus proche et la différence** : MTGStocks et MTGGoldfish montrent les prix. L'agent réagit au flux de résultats avant que le prix ne bouge, et agit sur le stock.
- **% LLM** : 15 %

---

## À savoir avant de choisir

- Sous 20 % : Tourneur (12), Régisseur (8), Économiste (10), Tournoi (15). Chasseur de démos : 22.
- Vérifié par lien : dates de Next Fest, API de prix OSRS, financement de Gigwell (sources en désaccord), absence de produit d'appel de cues par IA, clé requise chez Limitless.
- Non vérifié : tous les prix plausibles, les salaires, les quotas d'API marqués `[?]`, l'accès sans identification à EVE ESI.
- Preuve de paiement : aucune des cinq n'est solide. Le Régisseur n'a pas de budget prouvé ; le Tourneur a un marché logiciel étroit ; l'Économiste a des postes réels mais pas de prix connu ; le Chasseur de démos paie par des abonnements d'outils, sans montant ; le Tournoi a un marché large et un acheteur petit.
- Plus spectaculaire en direct : Tourneur (appels), Régisseur (scène 3D et voix), Chasseur de démos (vraie donnée vivante pendant le festival).
