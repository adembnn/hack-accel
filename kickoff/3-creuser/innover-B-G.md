# Innover dans l'espace B + G : 8 idées (21 oct. 2026)

Décision débloquée : quelle forme pousser entre B (crue/canicule + investissement par bâtiment) et G (arbres/bitume), et pour quel acheteur privé.

## Ce que les 5 recherches ont établi
- **Relief et végétation** : IGN LiDAR HD, dont MNT/MNS/MNH (hauteurs de tout ce qui dépasse du sol), sont sur data.gouv.fr. Le nuage de points est classé : sol, végétation, bâtiments, routes. Précision 0,5 m citée sur un jeu (Hauts-de-Seine). **Non vérifié** : couverture complète du territoire, licence de téléchargement, volumes. Prendre un seul secteur déjà téléchargé ce soir.
- **Chaleur satellite** : ECOSTRESS (ISS) ≈ 70 m, Landsat 8/9 ≈ 100 m (30 m rééchantillonné), projet THERMOCITY (CNES) produit des cartes de température de surface par ville. Rien d'ouvert à 10 m. Donc la chaleur à l'échelle de la rue doit être **simulée**, pas mesurée.
- **Argiles (RGA)** : 22,3 Md€ de sinistres 1989-2023 (BRGM, estimation CCR) ; 2022 : 3 à 3,5 Md€ ; projection France Assureurs 2020-2050 : 13,8 → 43 Md€ ; sécheresse = 52 % de la sinistralité sur 10 ans, 1,1 Md€/an en moyenne sur 5 ans ; plus de 12 M de maisons (≈ 60 %) en aléa moyen ou fort (carte révisée début 2026). **Non vérifié** : documentation de l'API Géorisques (connue, non relue ce soir).
- **Acheteurs de risque climatique** : Jupiter Intelligence, Cervest et Climate X vendent déjà des scores de risque physique aux banques, investisseurs et entreprises. **Aucun prix publié.** Les fourchettes lues (100 k$ à 5 M$/an) viennent d'une page sans sources : à ne pas citer au jury.
- **Obligation réglementaire** : l'Omnibus ramènerait la CSRD aux entreprises de plus de 1 000 salariés et 450 M€ de CA, dès l'exercice 2027 (source : page commerciale de Climate X, à confirmer sur EUR-Lex). Le risque physique par site (ESRS E1) resterait dans le texte simplifié.

Les prix « estimation » ci-dessous sont les miens, sans source. Je les marque `[?]`.

## Les 8 idées

### Mobil-homes qui fuient la crue
- **Pour un ami** : un groupe de campings paie pour que l'agent décide, avant chaque saison, où poser ses mobil-homes sur le terrain. Il les place hors d'atteinte de l'eau, à l'ombre l'après-midi et loin des pins qui brûlent.
- **Le moment wow** : « L'agent a déplacé 140 maisons avant que l'eau arrive. » Le jury choisit un camping au bord d'une rivière ; la crue monte dans la vallée en 3D et les mobil-homes glissent un à un vers les emplacements hauts.
- **Qui paie, combien, clients, preuve** : groupes de campings (Sandaya, Yelloh!, Huttopia, Capfun…) et campings indépendants. Environ 8 000 campings en France `[?]`, plus de 30 000 en Europe `[?]`. Prix estimé 6 à 15 k€ par site et par an `[?]`, soit un marché européen au-dessus de 100 M€ si 10 % des sites signent `[?]`. Preuve que l'acheteur paie déjà : les campings en zone à risque doivent avoir un cahier de prescriptions de sécurité et un plan d'évacuation `[?]` (code de l'urbanisme) ; le drame du Grand-Bornand (1987) l'a fondé `[?]`. Qui le fait aujourd'hui : bureaux d'études et assureurs `[?]`.
- **Donnée à 9h** : Géorisques (zones inondables, PPRI) `[?]` ; BD TOPO (bâti, cours d'eau) via Géoplateforme ; LiDAR HD MNT ; OSM (`tourism=camp_site`) ; Hub'Eau (débits, historique de crues) ; DRIAS (Météo-France, projections de canicule) ; base Prométhée et BD Forêt pour le feu `[?]`. Les emplacements ne sont pas ouverts : on les trace sur l'orthophoto.
- **Ce que fait l'agent** : pour chaque saison, il génère des plans de placement des unités, fait tourner crue (3 débits), ombre à 15 h (rayons sur le MNS) et distance au massif forestier, puis choisit le plan qui garde le plus d'unités louables sous contrainte de sécurité. Il justifie en nuits perdues et en unités sauvées. Chaque saison réelle (alertes vigilance, sinistres déclarés) recale le modèle ; la base des plans et issues par site est la donnée qui s'accumule.
- **Briques Aiven** : PostgreSQL + PostGIS (emplacements, couches de risque) ; ClickHouse (milliers de runs de scénarios comparables) ; Valkey (cache des scénarios pour la démo).
- **Concurrent le plus proche** : Climate X, Jupiter (score par site, pas de plan d'action) ; les logiciels de réservation de camping ne touchent pas au risque. Différence : l'agent sort un plan de placement, pas une note.
- **Faisable en 7 h ?** On construit : un camping réel en 3D, crue par remplissage du relief (profondeur sur MNT, calée sur la zone Géorisques), ombre par lancer de rayons, déplacement animé. On simule : emplacements générés en grille, feu par règle de distance. Point risqué : la crue sur un petit terrain sans modèle hydraulique ; on annonce « ordre de grandeur calé sur zone réglementaire ».
- **% LLM** : 4 %.

### Parking de supermarché : ombrière ou arbres
- **Pour un ami** : une foncière commerciale possède des centaines de parkings qu'elle doit couvrir. L'agent décide, parking par parking, entre panneaux solaires, arbres ou sol perméable, selon ce qui rafraîchit, absorbe la pluie et rapporte.
- **Le moment wow** : « Le parking de mon Carrefour passe de 58 °C à 37 °C et rapporte de l'électricité. » Le jury cite un supermarché ; l'asphalte rougit en 3D, l'agent y plante des ombrières et des arbres, la couleur vire au vert, le rendement en € s'affiche.
- **Qui paie, combien, clients, preuve** : foncières commerciales et enseignes (Klépierre, Mercialys, Carrefour Property, Leclerc, Intermarché…). Environ 1 500 à 3 000 parkings concernés en France `[?]`. Prix estimé 3 à 10 k€ par parking `[?]`. Preuve : la loi APER (2023) impose l'ombrage des parkings extérieurs de plus de 1 500 m², avec échéances 2026 (> 10 000 m²) et 2028 `[?]`, et les développeurs d'ombrières (TotalEnergies, Engie Green…) paient déjà des études de faisabilité `[?]`. À vérifier avant de citer.
- **Donnée à 9h** : BD TOPO (emprise des parkings, bâti) ; OSM (`amenity=parking`) ; orthophoto IGN ; LiDAR HD (arbres existants, ombres) ; PVGIS (API gratuite du JRC européen, productible solaire) `[?]` ; SIRENE pour rattacher à l'enseigne `[?]`.
- **Ce que fait l'agent** : il construit pour un parking les variantes (ombrières sur 50 %, canopée de 40 arbres, dalles perméables, mix), simule la température de surface à 15 h un jour de 2050 et la pluie décennale ruisselée, calcule le revenu solaire et le coût de plantation, puis choisit le mix qui respecte l'obligation au moindre coût net. Chaque parking réalisé, mesuré en thermique satellite avant/après (Landsat), corrige le modèle.
- **Briques Aiven** : PostgreSQL + PostGIS (parkings, géométries) ; ClickHouse (résultats par variante pour comparer des milliers de parkings) ; OpenSearch seulement si on retrouve un parking par nom d'enseigne `[?]`.
- **Concurrent le plus proche** : développeurs d'ombrières et leurs bureaux d'études (calcul de productible, pas de température ni de ruissellement). Différence : le choix entre solaire et vivant, chiffré en chaleur et en eau.
- **Faisable en 7 h ?** On construit : un parking réel en 3D avec ombre mobile, température de surface par bilan simplifié (matériau, ombre), productible via PVGIS. On simule : arbres à maturité, ruissellement. Point risqué : la loi APER est à confirmer ; si elle ne vaut que pour l'ombrage solaire, l'arbre devient un plus et non une obligation.
- **% LLM** : 12 %.

### L'arbre qui fissure la maison
- **Pour un ami** : un arbre qui rafraîchit la rue boit aussi l'eau du sol, et sur de l'argile la maison voisine se fissure. Un assureur habitation paie pour que l'agent choisisse où planter et quel arbre abattre, quartier par quartier.
- **Le moment wow** : « L'arbre qui baisse la rue de 2 °C faisait fissurer la maison du numéro 14 ; l'agent l'a déplacé de 6 mètres. » En 3D, chaque arbre projette un halo de fissures sur les maisons proches et un halo de fraîcheur sur la rue ; on les voit se chevaucher.
- **Qui paie, combien, clients, preuve** : assureurs habitation et bailleurs sociaux propriétaires de pavillons. Une dizaine de gros assureurs IARD en France `[?]`, environ 600 organismes HLM `[?]`. Prix estimé 150 à 500 k€ par an et par assureur `[?]`. Preuve : le coût existe et il est énorme (22,3 Md€ sur 1989-2023, 1,1 Md€/an en moyenne sur 5 ans, projections de 43 Md€ sur 2020-2050). Qu'un assureur finance déjà de la prévention par arbre : `[?]`. Ce qui est sûr : il paie l'abattage et la reprise en sous-œuvre après sinistre.
- **Donnée à 9h** : carte d'exposition RGA (BRGM / Géorisques, mise à jour début 2026) `[?]` ; LiDAR HD classé (position et hauteur des arbres) ; BD TOPO (maisons) ; DRIAS (sécheresses à venir) ; indice d'humidité des sols Météo-France `[?]`. Aucune donnée de sinistre par adresse : on utilise la classe d'aléa comme substitut et on le dit.
- **Ce que fait l'agent** : il construit des scénarios par rue (planter 12 arbres, ne rien faire, déplacer, changer d'essence, abattre un sujet), calcule le gain de fraîcheur par ombre et le risque de fissure par distance arbre-maison rapportée à la hauteur à maturité, puis choisit le scénario au meilleur rapport, en euros, entre chaleur évitée et sinistre attendu. Il apprend des sinistres réels : l'assureur lui renvoie les dossiers, la distance critique se recale par commune. La base arbre-maison-sinistre devient la donnée rare.
- **Briques Aiven** : PostgreSQL + PostGIS (arbres, maisons, distances) ; ClickHouse (scénarios par rue) ; Kafka si on branche un flux de déclarations de sinistre `[?]`.
- **Concurrent le plus proche** : les scores RGA à l'adresse (Géorisques, outils internes d'assureurs `[?]`) disent « zone à risque » sans arbitrer l'arbre. Différence : l'agent règle le conflit entre deux périls.
- **Faisable en 7 h ?** On construit : une commune en aléa argile fort, arbres extraits du LiDAR, halo de fraîcheur par ombre, halo de fissure par règle de distance. On simule : la sécheresse à venir et la baisse de température. Point risqué : aucune validation du seuil de distance sans données de sinistre ; à présenter comme règle de l'art du bâtiment `[?]` et non comme mesure.
- **% LLM** : 5 %.

### Parcelle testée avant l'offre
- **Pour un ami** : un promoteur hésite à acheter un terrain. L'agent dessine plusieurs immeubles sur la parcelle, les fait vivre l'été 2050 et la crue décennale, et dit à quel prix il faut s'arrêter d'enchérir.
- **Le moment wow** : « Il a posé quatre immeubles sur le terrain vague, et celui du fond coûtait 1,2 M€ de moins à rendre habitable en août 2050. » Le jury pointe une friche sur la carte, les volumes poussent, les étages chauffent en couleur.
- **Qui paie, combien, clients, preuve** : promoteurs, aménageurs, foncières. Les trente premiers promoteurs font l'essentiel du volume `[?]`. Prix estimé 10 à 40 k€ par opération `[?]`. Preuve : la RE2020 impose depuis 2022 le calcul du confort d'été (degrés-heures) sur tout logement neuf, et les bureaux d'études thermiques facturent une simulation thermique dynamique à chaque projet `[?]`. Les outils d'implantation (TestFit, Autodesk Spacemaker) montrent aussi que l'acheteur paie pour dessiner avant d'acheter `[?]`.
- **Donnée à 9h** : cadastre (Etalab) ; PLU via API Carto (admin, mais réduit à l'emprise constructible) ; BD TOPO ; LiDAR HD ; DVF (prix de vente) ; Cartofriches (Cerema) pour repérer les terrains `[?]` ; DRIAS pour 2050.
- **Ce que fait l'agent** : il génère des implantations (hauteur, orientation, ratio de pleine terre, arbres, toiture), simule l'ombre mutuelle, la surchauffe des étages et l'eau de ruissellement, estime le coût de remise à niveau et de la prime de confort, et choisit la variante qui maximise la marge. Chaque opération réelle livrée avec ses mesures d'été corrige le modèle.
- **Briques Aiven** : PostgreSQL + PostGIS (parcelles, volumes) ; ClickHouse (variantes) ; Valkey (cache des calculs d'ombre).
- **Concurrent le plus proche** : TestFit et Spacemaker (implantation, ensoleillement) ; BET thermiques (simulation lente, à la fin du projet). Différence : le climat futur entre avant l'achat, et il sort un prix plafond.
- **Faisable en 7 h ?** On construit : un terrain réel, volumes en 3D, ombre portée, surchauffe par modèle simple (surface vitrée, orientation, ombre). On simule : la RE2020 et le prix. Point risqué : le prix plafond repose sur une formule de valeur que personne ne peut vérifier ce soir.
- **% LLM** : 25 %.

### Replanter le vignoble pour 2050
- **Pour un ami** : un domaine viticole ou le fonds qui le finance veut savoir quelle parcelle devient trop chaude et quoi y mettre à la place. L'agent propose un calendrier de replantation sur dix ans.
- **Le moment wow** : « Votre merlot du haut sera trop chaud en 2041 ; l'agent le remplace et garde la face nord pour la récolte tardive. » Les coteaux sont en relief réel, chaque parcelle vire de couleur selon son année de rupture.
- **Qui paie, combien, clients, preuve** : fonds qui achètent des vignobles, banques agricoles, coopératives, grands domaines. Environ 60 000 exploitations viticoles en France `[?]`. Prix estimé 5 à 30 k€ par domaine et par an `[?]` ; 100 M€ seulement si le fonds paie pour son portefeuille. Preuve : les stations météo connectées (Sencrop) vendent déjà du suivi aux vignerons, mais mesurent le présent, pas le futur `[?]`.
- **Donnée à 9h** : RPG (parcelles agricoles) ; aires AOC de l'INAO (data.gouv) `[?]` ; LiDAR HD MNT (pente, exposition) ; DRIAS ; ERA5 (Copernicus) pour le calage ; dates de vendanges historiques `[?]`.
- **Ce que fait l'agent** : pour chaque parcelle, il teste cépage, porte-greffe, orientation des rangs, arbres d'ombrage et irrigation, simule degrés-jours, jours au-dessus de 35 °C et gel au débourrement, puis choisit sous budget annuel ce qu'on replante et quand. Les vendanges réelles de chaque année recalent le modèle.
- **Briques Aiven** : PostgreSQL + PostGIS (parcelles) ; ClickHouse (séries climatiques par parcelle et scénario).
- **Concurrent le plus proche** : agrométéo connectée (Sencrop) ; cabinets de conseil en viticulture. Différence : plan de replantation chiffré par parcelle.
- **Faisable en 7 h ?** On construit : un coteau réel en 3D, parcelles RPG, couleur par année de rupture. On simule : le rendement et la maturité par un modèle degrés-jours. Point risqué : l'effet d'un cépage sur un site se mesure mal sans spécialiste ; nous n'avons pas d'expert métier.
- **% LLM** : 22 %.

### Festival : l'ombre heure par heure
- **Pour un ami** : un organisateur de festival d'été veut savoir où poser la scène, l'eau et l'ombre pour que personne ne tombe à 16 h par 40 °C. L'agent dispose le site, puis décale les horaires de la journée.
- **Le moment wow** : « 30 000 personnes en 3D, la foule fuit les zones rouges à 15 h, et l'agent déplace la scène sous le talus. » Le jury voit la foule bouger, la température ressentie s'afficher par zone.
- **Qui paie, combien, clients, preuve** : organisateurs (Live Nation, Vieilles Charrues, Rock en Seine, Hellfest…) et organisateurs de marathons ou d'événements sportifs. Plusieurs milliers de festivals en France `[?]`. Prix estimé 5 à 30 k€ par événement `[?]`. Marché probablement sous 100 M€ : c'est la limite de l'idée. Preuve : les préfets peuvent interdire ou arrêter un événement par canicule et l'annulation coûte des millions d'euros `[?]`.
- **Donnée à 9h** : BD TOPO ; LiDAR HD (arbres, talus, ombres) ; OSM ; DRIAS ou ERA5 (journées de canicule type) ; plan du site fourni par l'organisateur (donnée du client).
- **Ce que fait l'agent** : il génère des plans (scène, eau, brumisation, zones d'ombre, horaires), fait jouer une foule simulée à travers la journée sous une vague de chaleur type, mesure le temps passé en zone dangereuse et la saturation des points d'eau, puis choisit le plan. La foule réelle (comptages de l'organisateur) recale le simulateur.
- **Briques Aiven** : PostgreSQL + PostGIS (site) ; ClickHouse (trajectoires et expositions par scénario) ; Kafka si on rejoue un flux de capteurs `[?]`.
- **Concurrent le plus proche** : logiciels de simulation de foule (Legion, Crowd Dynamics `[?]`) sans climat. Différence : la chaleur dicte le plan.
- **Faisable en 7 h ?** On construit : un site en 3D, foule par modèle de particules, température ressentie par ombre et heure. On simule : toute la physiologie. Point risqué : crédibilité du modèle de foule, et marché étroit.
- **% LLM** : 6 %.

### Portefeuille : quel immeuble vendre
- **Pour un ami** : un gérant d'immobilier coté ou de SCPI possède une soixantaine d'immeubles. L'agent décide lesquels vendre, lesquels adapter, et avec quel budget, selon la valeur que chacun garde en 2050.
- **Le moment wow** : « La valeur du portefeuille bouge en direct quand on passe de +2 °C à +4 °C, et l'agent désigne les immeubles à vendre avant 2032. » Les immeubles sont des volumes en 3D, qui rougissent ou verdissent, avec une courbe de valeur qui bouge à côté.
- **Qui paie, combien, clients, preuve** : sociétés de gestion de SCPI et OPCI, foncières cotées. Plus d'une centaine de SCPI en France `[?]`. Prix estimé 50 à 200 k€ par société et par an `[?]`. Preuve : MSCI a racheté First Street (risque climatique par bâtiment) pour 120 M$ (annonce 2026, source unique du brief) ; Jupiter, Cervest et Climate X vendent déjà aux investisseurs.
- **Donnée à 9h** : DVF (prix de vente) ; BD TOPO ; Géorisques ; DPE ADEME (surface, isolation) `[?]` ; DRIAS. Portefeuille : liste publique d'une foncière cotée, ou fictif sur biens réels ; le vrai viendrait du client.
- **Ce que fait l'agent** : il construit des plans (vendre, adapter, attendre) pour le portefeuille, simule la valeur de chaque immeuble sous deux trajectoires climatiques par une relation prix-risque calibrée sur DVF, et choisit le plan qui maximise la valeur nette sous plafond de dépenses. Chaque vente réelle de bien exposé recale la décote.
- **Briques Aiven** : PostgreSQL + PostGIS (biens) ; ClickHouse (valeurs par scénario) ; Valkey (recalcul instantané pour le curseur).
- **Concurrent le plus proche** : MSCI / First Street, Climate X, Jupiter (scores). Différence : un moteur d'arbitrage qui choisit le plan, au lieu de rendre une note.
- **Faisable en 7 h ?** On construit : un portefeuille de 15 à 20 immeubles réels, curseur climat, plan sélectionné. On simule : la relation entre risque et prix. Point risqué : la décote estimée sur DVF ne se calibre pas en une demi-journée ; elle serait une hypothèse déclarée. Le jury d'un fonds peut l'attaquer.
- **% LLM** : 25 %.

### Ski : fermer les remontées une à une
- **Pour un ami** : un exploitant de domaine skiable doit choisir quelles pistes garder, où fabriquer de la neige et quelles remontées reconvertir en vélo ou en randonnée. L'agent déroule les trente prochaines années.
- **Le moment wow** : « La limite de la neige monte sur la montagne et l'agent ferme quatorze remontées à son passage. » Le jury voit un massif en 3D, les pistes brunir par altitude, les remontées s'éteindre année après année.
- **Qui paie, combien, clients, preuve** : exploitants de domaines skiables (Compagnie des Alpes, SATA, sociétés d'économie mixte), banques territoriales. Environ 250 stations en France `[?]`, plusieurs centaines dans les Alpes en Europe `[?]`. Prix estimé 30 à 100 k€ par domaine `[?]`. Marché sous 100 M€ si on se limite au ski. Preuve : les domaines investissent déjà des centaines de millions d'euros en neige de culture et la Cour des comptes a publié sur l'adaptation des stations `[?]`.
- **Donnée à 9h** : IGN MNT ; OSM (pistes et remontées) ; DRIAS ; réanalyse de neige S2M/Crocus (Météo-France) `[?]` ; Copernicus (couverture neigeuse) ; Hub'Eau (eau disponible pour la neige de culture).
- **Ce que fait l'agent** : par décennie, il choisit les pistes à maintenir, les secteurs à enneiger et ceux à convertir, sous contrainte d'eau et de budget, en comparant le chiffre d'affaires hiver-été. Chaque saison réelle (jours d'ouverture) recale la limite pluie-neige du modèle.
- **Briques Aiven** : PostgreSQL + PostGIS (pistes, remontées) ; ClickHouse (séries par décennie et scénario).
- **Concurrent le plus proche** : bureaux d'études de montagne et Météo-France sans optimisation `[?]`. Différence : un plan de fermeture chiffré.
- **Faisable en 7 h ?** On construit : un massif en 3D, limite neige par altitude, remontées éteintes selon la règle de l'agent. On simule : l'économie. Point risqué : le jeu de gestion séduit mais le marché est étroit ; ce serait de la démonstration pour une idée de plus grande portée (tout actif de montagne).
- **% LLM** : 15 %.

## Lecture rapide
- Sous 20 % : camping (4), arbre/argile (5), festival (6), parking (12), ski (15). Au-dessus : vignoble (22), promoteur (25), portefeuille (25).
- Deux idées seulement ont un marché qui peut raisonnablement dépasser 100 M€/an sans extrapoler : le portefeuille (25 %) et l'arbre/argile (5 %), cette dernière parce que l'acheteur paie déjà 1,1 Md€/an de sinistres. Le camping y arrive à l'échelle européenne, avec des hypothèses de prix non vérifiées.
- La plus loin du « jumeau pour le maire » est l'arbre/argile : deux périls qui s'opposent, un acheteur privé qui perd de l'argent chaque année, un moment de démo qui montre un conflit.
- Le plus gros risque commun : aucune de ces idées n'a de validation hydrologique, thermique ou géotechnique en 7 h. Il faut annoncer « ordre de grandeur » et ne pas prétendre mesurer.

## Questions pour Adem
Le décor : les 8 formes vont de 4 % à 25 % de probabilité qu'un autre LLM les propose, et elles diffèrent par l'acheteur et par le péril.
1. Quel acheteur te parle le plus ? a) assureur (arbre/argile) ; b) groupe de campings ; c) foncière commerciale (parking) ; d) fonds immobilier (portefeuille) ; e) autre. Ma recommandation : a, défaut si pas de réponse : a.
2. Veux-tu que je creuse les 2 ou 3 formes retenues avec un crash-test jury ? a) oui ; b) j'en ajoute d'autres avant. Défaut : a.
