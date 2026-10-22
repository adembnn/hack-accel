# Salve 6 : mode, luxe, beauté, seconde main, médecine esthétique

Domaines : mode, luxe, beauté et cosmétique, seconde main et revente, médecine esthétique et cliniques privées. 5 idées. Écartées d'emblée car trop attendues : essayage virtuel, styliste IA, estimateur de reprise « photo vers prix », prévision de tendances TikTok.

Recherches faites (5 sur 5) : valeur du marché de la revente de luxe, accès aux données cosmétiques ouvertes, preuve de paiement en protection de marque, résultats d'enchères mode en ligne, archives de mode louées aux stylistes.

---

### Lots de mode mal décrits

- **Pour un ami (2 phrases, zéro jargon)** : Un revendeur professionnel de sacs et vêtements de luxe d'occasion cherche des pièces sous-payées dans les ventes aux enchères. L'agent lit les annonces de salles des ventes, repère ce qui vaut bien plus que son titre (« sac en cuir noir »), et enchérit à sa place en direct jusqu'à un plafond de rentabilité.
- **Ce que le jury voit et entend** : Une vente aux enchères réelle défile à l'écran. Un lot « sac cuir noir, usures » est à 40 €, l'agent dit à voix haute « c'est un modèle des années 90 d'une grande maison, il se revend 1 800 € à Paris, je monte jusqu'à 420 € » et le plafond se met à jour à chaque surenchère.
- **Comment ça se fait aujourd'hui** : Les acheteurs des plateformes de revente et les dénicheurs indépendants épluchent les catalogues à la main et vont aux expositions avant vente. Les catalogues de mode sont rédigés par des commissaires-priseurs généralistes, d'où les erreurs de titre. Coût : un acheteur salarié ou un dénicheur payé à la commission `[?]`.
- **Qui paie et la preuve** : Acheteurs de stock des plateformes de revente de luxe et dénicheurs professionnels, au forfait mensuel ou à la commission sur les marges gagnées (ordre de grandeur 300 à 1 500 €/mois `[?]`). La revente de luxe lève des fonds : Vestiaire Collective valorisé 1,7 milliard de dollars en 2021 après 210 M$ levés ([FashionUnited](https://fashionunited.uk/news/business/vestiaire-collective-valued-at-1-7-billion-dollars-as-it-secures-fresh-funding/2021092257844)). Le manque de stock authentique est le goulot de ces plateformes `[?]`.
- **Donnée disponible à 9h demain** : Pages de lots et ventes en direct de drouot.com (photos, estimations, statut des enchères) `[?]` règles d'accès à vérifier. Prix passés : l'indice d'un agrégateur de résultats de ventes ([Collectorsquare, sacs Louis Vuitton Drouot](https://www.collectorsquare.com/sacs/louis-vuitton/drouot/lpi)) existe en accès public ; résultats des maisons (Artcurial, Cornette de Saint Cyr) publiés sur leurs sites. Annonces de revente pour les prix de sortie : eBay Browse API (clé gratuite) `[?]`, pages publiques de plateformes de revente `[?]`. Flux d'enchères en direct : tester une vente en cours jeudi `[?]`.
- **Ce que fait l'agent** : Il voit les photos et le texte de chaque lot, identifie la pièce (maison, modèle, époque, matière) avec un modèle de vision, cherche des ventes comparables, calcule la marge nette après frais de salle (la commission acheteur est d'environ un quart du prix `[?]`) et fixe un plafond. Il ne certifie pas l'authenticité : il classe chaque lot « à faire expertiser en main » ou « risque faible ». Pendant la vente, il enchérit et baisse son plafond si la concurrence révèle un défaut. Mémoire : après chaque résultat, il compare son estimation au prix d'adjudication et corrige ses règles par maison.
- **Concurrent le plus proche et la différence** : Les alertes de recherche des sites d'enchères (mots-clés) et les agrégateurs de prix de vente, qui donnent un prix passé sans lire le lot ni enchérir. Ici l'agent lit l'image, chiffre la marge et agit pendant la vente.
- **% LLM** : 12 %

---

### Copies de défilé en direct

- **Pour un ami (2 phrases, zéro jargon)** : Une créatrice indépendante ou le service juridique d'une maison de mode veut savoir quand un modèle est copié par les enseignes rapides. L'agent compare chaque nouveau vêtement mis en ligne aux silhouettes de défilé et aux collections de créateurs, et sort un dossier daté et illustré.
- **Ce que le jury voit et entend** : À gauche, un mur de silhouettes de la saison. À droite, les nouveautés d'une grande enseigne tombent en direct. Des fils se tendent entre une pièce et sa source, avec un chiffre : « 9 jours après la sortie du défilé ».
- **Comment ça se fait aujourd'hui** : Des juristes de marque, des assistants de studio ou des créateurs eux-mêmes parcourent les sites et les réseaux, comparent des photos à l'œil, font des captures d'écran. La preuve de date de première divulgation est souvent mal conservée `[?]`. Coût : temps de juriste ou de studio, non chiffré `[?]`.
- **Qui paie et la preuve** : Services propriété intellectuelle de maisons de mode, collectifs de créateurs indépendants, avocats spécialisés. Prix plausible : 500 à 3 000 €/mois selon le périmètre `[?]`. Preuve que la protection de marque paie : Red Points a levé plus de 76 M$ au total, ses clients incluent Hugo Boss et Puma ([TechCrunch](https://techcrunch.com/2019/04/03/red-points-closes-38m-series-c-for-its-antivirus-saas-for-brands), [Summit Partners](https://summitpartners.com/news/red-points-raises-20-million-announces-b-corp-certification)). Le droit applicable au dessin non enregistré dans l'UE (protection courte à partir de la première divulgation) rend la preuve de date utile `[?]` à vérifier avec un juriste.
- **Donnée disponible à 9h demain** : Images de défilés de la saison (pages publiques de revues de mode et comptes officiels des maisons) `[?]`. Nouveautés des enseignes : pages catalogue de grandes enseignes accessibles sans connexion, à tester une par une ; les sites très protégés contre les robots sont à éviter `[?]`. Calcul d'images similaires : Modal (crédit fourni). Stockage : ClickHouse pour l'historique, Kafka pour le flux de nouveautés.
- **Ce que fait l'agent** : Il surveille les arrivées par flux, calcule la proximité visuelle avec les silhouettes de défilé, fait confirmer par un modèle de vision (« même découpe, même détail, même motif »), écarte les basiques que tout le monde fait, et assemble une fiche datée avec images, liens archivés et délai. Mémoire : le créateur valide « copie » ou « inspiration banale », l'agent ajuste ses seuils par catégorie et par enseigne.
- **Concurrent le plus proche et la différence** : Red Points et ses semblables pistent les contrefaçons de marque (logo, nom). Ils ne mesurent pas la copie de dessin ni le délai depuis le défilé.
- **% LLM** : 12 %

---

### Archive de tapis rouge au téléphone

- **Pour un ami (2 phrases, zéro jargon)** : Une styliste a trois jours pour trouver une robe précise d'un défilé de 1998, en taille 36, pour une actrice. L'agent cherche qui la possède (vendeurs de vintage, archives de location), appelle les boutiques pour vérifier qu'elle est disponible, en quelle taille, à quel prix de location ou d'achat, et rend une liste classée.
- **Ce que le jury voit et entend** : L'agent appelle en direct une vraie boutique de vintage parisienne, se présente comme assistante virtuelle d'une styliste, et négocie la location d'une pièce pour trois jours. Pendant l'appel, l'écran coche « taille 36 confirmée, 450 €, retrait mardi ».
- **Comment ça se fait aujourd'hui** : Les assistants de stylistes envoient des dizaines de messages et d'appels à des showrooms, des revendeurs et des archives. Les réponses arrivent en désordre, les tailles se perdent dans les fils de discussion. Coût : le temps d'un assistant de styliste, souvent peu payé, plus les jours perdus avant un shooting `[?]`.
- **Qui paie et la preuve** : Stylistes indépendants, rédactions, productions de publicité et de clips, au forfait par recherche ou par mois (100 à 400 €/mois `[?]`). Le marché est modeste, à dire franchement au jury. Les archives de location d'habits de défilé existent et habillent des célébrités : [Lidow Archive](https://prelovedpod.substack.com/p/pre-loved-podcast-lidow-archive) (9 000 pièces), Stage3 en Inde a levé 2 M$ auprès de Blume Ventures avec une centaine de créateurs et 25 stylistes de stars ([Inc42](https://inc42.com/?p=175161)). Piste d'extension : les revendeurs d'archives paient pour être trouvés `[?]`.
- **Donnée disponible à 9h demain** : Catalogues publics de vente de vintage et de revente (plateformes de revente, marchands de pièces de collection, boutiques en ligne) `[?]` selon l'accès. Images de défilés d'archive pour identifier la pièce `[?]`. Numéros de boutiques : fiches publiques de cartes en ligne. Voix : ElevenLabs (crédits fournis). Annonce explicite « assistante virtuelle » à l'ouverture de l'appel.
- **Ce que fait l'agent** : Il lit le brief (photo de référence, taille, dates, budget), identifie la pièce et ses variantes (autres couleurs, rééditions), cherche les détenteurs, appelle pour confirmer et négocier, et met à jour la liste. S'il n'y a rien, il propose les pièces voisines. Mémoire : il retient quels vendeurs répondent vrai, à quel prix final, et lesquels annoncent des tailles fausses.
- **Concurrent le plus proche et la différence** : Les archives de location (Lidow Archive, Fashionaholic) qui n'ont que leur stock. Ici l'agent cherche dans tout le marché et passe les appels.
- **% LLM** : 8 %

---

### Formule rétro-conçue d'un sérum

- **Pour un ami (2 phrases, zéro jargon)** : Le fondateur d'une marque de cosmétiques indépendante veut une alternative à un soin de luxe vendu 240 €. L'agent lit la liste d'ingrédients sur l'étiquette, reconstitue la recette probable avec les pourcentages, et chiffre le coût de fabrication.
- **Ce que le jury voit et entend** : Un membre du jury donne le nom de son soin préféré. En moins d'une minute, l'écran affiche la recette probable en barres, une ligne rouge à « 1 % » et la phrase de l'agent : « coût matières environ 4 €, prix en rayon 240 €, voici trois alternatives réalisables par un laboratoire ».
- **Comment ça se fait aujourd'hui** : Des chimistes de formulation et des chefs de produit chez les fabricants à façon et les marques de distributeurs décortiquent à la main les listes d'ingrédients de concurrents et en tirent des briefs. Coût : plusieurs jours d'un chimiste de formulation, et des essais en laboratoire `[?]`.
- **Qui paie et la preuve** : Fondateurs de marques indépendantes, marques de distributeurs, fabricants à façon (forfait par formule rétro-conçue 500 à 2 000 € ou abonnement `[?]`). Preuve : les marques qui vendent des actifs à prix transparent ont trouvé leur marché, la marque The Ordinary a été rachetée par Estée Lauder `[?]` à sourcer. Le marché de la marque de distributeur en cosmétique est solide `[?]`.
- **Donnée disponible à 9h demain** : Open Beauty Facts, base ouverte de produits avec listes d'ingrédients ; attention, un message du forum signale des exports incomplets ([forum](https://forum.openfoodfacts.org/t/is-the-open-beauty-facts-database-dump-incomplete/2103)), à tester d'abord. Base européenne des ingrédients cosmétiques CosIng (fonctions, restrictions) `[?]` format de téléchargement non vérifié. Prix des matières premières : listes publiques de revendeurs de matières `[?]`. Règle exploitée : l'étiquette liste les ingrédients par ordre décroissant jusqu'à 1 %, ordre libre ensuite. La chimie de base (solubilités, plages de pourcentage par fonction) est dans le modèle.
- **Ce que fait l'agent** : Il lit la liste, répartit les ingrédients en trois zones (corps de la formule, actifs, conservateurs et parfum), estime des pourcentages avec des contraintes (somme à 100, plages usuelles, limites réglementaires), chiffre le coût, et propose des variantes à moindre coût. Mémoire : le laboratoire renvoie ses mesures (pH, viscosité, texture) ou un échec, et l'agent recale ses estimations pour les formules suivantes. Il ne prétend pas retrouver la recette exacte et le dit.
- **Concurrent le plus proche et la différence** : Les bases d'ingrédients grand public qui notent la dangerosité des produits. Elles ne reconstruisent pas la recette ni le coût de revient.
- **% LLM** : 7 %

---

### Négocier un laser d'occasion

- **Pour un ami (2 phrases, zéro jargon)** : Un médecin esthétique qui ouvre ou agrandit son cabinet veut acheter un laser d'occasion. L'agent trouve les appareils en vente, appelle les vendeurs, demande le compteur de tirs et l'état de l'entretien, et négocie le prix.
- **Ce que le jury voit et entend** : L'agent appelle un courtier d'appareils médicaux en direct et demande « combien de tirs au compteur ? ». L'écran montre l'écart entre le prix demandé et la valeur estimée, puis la contre-offre dite à voix haute avec son argument chiffré.
- **Comment ça se fait aujourd'hui** : Le praticien ou son associé parcourt des annonces éparses, appelle des courtiers, et se fie à ce qu'on lui dit sur l'usure. Le compteur de tirs et l'état des pièces d'usure font l'essentiel de la valeur et sont rarement indiqués dans l'annonce `[?]`. Coût : un appareil se paie plusieurs dizaines de milliers d'euros `[?]` ; un mauvais achat coûte une réparation de plusieurs milliers d'euros `[?]`.
- **Qui paie et la preuve** : Médecins esthétiques, dermatologues libéraux, groupes de cliniques, courtiers (forfait par achat conclu, par exemple 1 à 2 % du prix, ou abonnement `[?]`). Preuve : marché de l'équipement esthétique porté par des sociétés cotées (InMode, Cutera) `[?]`, places de marché d'occasion médicale existantes (DOTmed, MedWOW) `[?]` à vérifier.
- **Donnée disponible à 9h demain** : Annonces d'appareils d'occasion sur des places de marché publiques et sur eBay (clé gratuite) `[?]`. Fiches techniques des fabricants (durée de vie des pièces, nombre de tirs garantis) en accès public `[?]`. Numéros de courtiers : sites publics. Voix : ElevenLabs. Les prix de revente effectifs sont difficiles à obtenir : la valeur estimée se construit à partir des annonces et des appels, donc approximative `[?]`.
- **Ce que fait l'agent** : Il lit les annonces, rapproche modèle et année de la fiche fabricant, repère ce qui manque (compteur, dernier entretien), appelle pour combler les trous, calcule la valeur et la remise justifiée, puis négocie par téléphone. Mémoire : à chaque appel, il enregistre prix demandé, prix obtenu et mensonges détectés (compteur différent selon l'interlocuteur), et affine la valeur du modèle.
- **Concurrent le plus proche et la différence** : Les places de marché d'occasion médicale, qui affichent des annonces et laissent l'acheteur seul face au vendeur. Ici l'agent réunit les informations manquantes et négocie.
- **% LLM** : 6 %

---

## Tableau de synthèse

| Idée | Spectaculaire | Données à 9h | Acheteur atteignable | % LLM |
|---|---|---|---|---|
| Lots de mode mal décrits | enchères en direct, plafond qui bouge | moyenne, à tester vite | bonne | 12 % |
| Copies de défilé en direct | fils entre défilé et copie | moyenne, accès enseignes à tester | moyenne | 12 % |
| Archive de tapis rouge au téléphone | appel réel en salle | bonne, mais catalogues dispersés | petite (à dire) | 8 % |
| Formule rétro-conçue d'un sérum | chiffre choc en une minute | bonne, base ouverte à tester | bonne | 7 % |
| Négocier un laser d'occasion | appel réel, écart de prix | faible, annonces peu fournies | moyenne | 6 % |

Recommandation de l'agent : la plus forte pour le jury est « Lots de mode mal décrits » (donnée qui bouge, agent qui agit, acheteur qui paie déjà). La plus fragile en données est « Négocier un laser d'occasion ». Test à faire avant de choisir : ouvrir une vente de mode en direct sur drouot.com et vérifier que les pages se lisent sans compte.

Sources des recherches : [Vestiaire Collective 1,7 Md$](https://fashionunited.uk/news/business/vestiaire-collective-valued-at-1-7-billion-dollars-as-it-secures-fresh-funding/2021092257844) ; [Red Points, série C](https://techcrunch.com/2019/04/03/red-points-closes-38m-series-c-for-its-antivirus-saas-for-brands) ; [Red Points, 20 M$](https://summitpartners.com/news/red-points-raises-20-million-announces-b-corp-certification) ; [Collectorsquare, résultats Drouot](https://www.collectorsquare.com/sacs/louis-vuitton/drouot/lpi) ; [Artcurial, ventes mode en ligne](https://fashionunited.fr/actualite/business/artcurial-ou-le-succes-des-ventes-aux-encheres-en-ligne-dediees-a-la-mode/2023050932066) ; [Stage3](https://inc42.com/?p=175161) ; [Lidow Archive](https://prelovedpod.substack.com/p/pre-loved-podcast-lidow-archive) ; [Open Beauty Facts, export](https://forum.openfoodfacts.org/t/is-the-open-beauty-facts-database-dump-incomplete/2103).
