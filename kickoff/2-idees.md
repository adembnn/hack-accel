# 2. Idées, salve 4 (21 oct. 2026, soir)

**Pourquoi une salve 4.** Salve 3 rejetée (« de la paperasse »). Adem veut « du réel ou des agents » et retient deux directions : **D, l'agent négociateur** (il écrit ou téléphone à de vrais fournisseurs, négocie, se souvient) et **F, le jumeau qui teste** (copie d'un lieu réel à partir de flux en direct, on y essaie les décisions). Plus sa piste « quartier reconstruit en 3D, foule et évacuation » (volet « attaques » exclu), en cours d'état de l'art. Brief : `2-idees-brut/salve-4/0-brief-salve-4.md`. Salves 1 à 3 archivées dans `2-idees-brut/`.

**Méthode.** Trois agents Sonnet de divergence (D, F, fusion D+F), 23 idées, plus deux états de l'art (`etat-art-D-negociateur.md` rendu, `etat-art-F-jumeau.md` rendu) et celui de la piste 3D (en cours). % = chance qu'un autre LLM propose l'idée (estimation). Prix et marchés : estimations, presque toutes `[?]`.

**Ce que l'état de l'art D change.** Le fret routier par voix (HappyRobot, 1,2 Md$ de valorisation, DHL, Kuehne + Nagel, CMA CGM) et les achats de grands comptes (Pactum, plus de 100 M$) sont pris. Accel n'a investi dans aucun acteur de la négociation, mais il a mené Synthflow (agents vocaux). Trous repérés : acheteur PME qui demande des devis par téléphone en français, organisateur d'événement face à dix hôtels. Contraintes : l'agent doit dire qu'il est une IA (AI Act, article 50, en vigueur depuis le 2 août 2026) ; un numéro Twilio français demande jusqu'à trois jours.

**Ce que l'état de l'art F change.** Seule la Finlande (Digitraffic : escales, navires, trains, routes, sans clé, testé) permet de rejouer une vraie journée d'un lieu. Les grands ports (Rotterdam, Anvers, Le Havre, Marseille) n'ouvrent pas l'état de leurs quais. Les grands hubs sont pris (PortXchange, Awake.AI, Assaia). Le trou le plus net : **les barges du Rhin et les terminaux intérieurs** (attente de 12-24 h en temps normal, 72 à 163 h avec le bas niveau de 2026, aucun jumeau abordable trouvé), puis les petits ports et les aéroports régionaux.

## Top 10 provisoire

| # | L'idée, simplement | Direction | Le moment wow | % |
|---|---|---|---|---|
| 1 | **Le Rhin baisse, l'agent réserve** : quand l'eau baisse, les péniches chargent un tiers ; l'agent calcule ce que chaque bateau pourra porter, teste des plans (train, stock), puis appelle les armateurs | D+F | Le vrai niveau du Rhin à Kaub en direct (lu aujourd'hui, unité à vérifier), les barges du client passent au rouge, un juré-armateur concède 40 % sur la surcharge | 6 % |
| 2 | **Vélib : les camions de demain** : l'agent rejoue la soirée station par station et choisit la tournée des camions qui laisse le moins de stations vides | F | La station à 50 m de la salle passe au rouge dans la copie, redevient verte quand l'agent déplace un camion | 15 % |
| 3 | **Le parc bondé, la parade déplacée** : l'agent rejoue l'après-midi d'un parc d'attractions et teste parade, files annexes, renforts | F | La parade avancée de 45 min fait passer une file de 78 à 52 min, deux journées côte à côte | 6 % |
| 4 | **Avitailler un navire avant qu'il arrive** : le cargo est à 40 h du port, l'agent écrit aux fournisseurs du port, compare, négocie | D | Le navire avance en vrai sur la carte, un juré-fournisseur répond, l'agent cite la remise de l'escale précédente et le prix baisse | 7 % |
| 5 | **Le jet privé qui rentre à vide** : l'agent repère en vol un jet qui revient sans passager et appelle l'opérateur pour le louer moins cher | D | On voit l'avion descendre vers Nice, l'agent l'a au téléphone avant l'atterrissage, −40 % | 12 % |
| 6 | **Loger les techniciens d'un arrêt de réacteur** : 750 techniciens arrivent pour six semaines, l'agent appelle les hôtels à 40 km et bloque les nuits | D | Carte autour de la centrale, compteur de nuits sécurisées, un juré-hôtelier cède 12 % pour 21 nuits fermes | 3 % |
| 7 | **Remorqueurs et marée** : l'agent rejoue les six prochaines heures d'un port à marée avec les vrais navires en approche et choisit l'ordre d'entrée | F | Avec l'ordre humain deux navires ratent la marée, avec celui de l'agent aucun, et un remorqueur de moins | 12 % |
| 8 | **Escale de croisière annulée** : le vent va fermer Marseille, l'agent le prévoit et trouve 40 autocars à Toulon avant le déroutement | D+F | « Le bateau n'est pas encore dérouté et il a déjà ses autocars », position réelle du paquebot et appel à un autocariste | 7 % |
| 9 | **Béton réservé selon la météo** : l'agent appelle les centrales à béton autour du chantier et refait le marché quand la pluie se décale | D | La prévision change, l'agent rappelle seul la centrale et obtient 6 h au lieu de 10 h | 8 % |
| 10 | **Le soir du match (piste 3D d'Adem)** : quartier du stade en 3D, métro et sorties en direct, l'agent teste une sortie fermée ou un train de plus, puis demande des navettes | 3D+D+F | 40 000 personnes sortent du stade dans la copie, le bouchon se forme, la parade l'efface | 10 % |

## Les 23 idées de la salve 4

### D, l'agent négociateur (fichier `salve4-D-negociateur.md`)
Loger les arrêts de tranche (3 %) ; béton réservé selon la météo (8 %, Koncrete et Flixbeton déjà là) ; avitailler les navires avant l'escale (7 %) ; jets privés revenant à vide (12 %, marché petit) ; électricité de PME mise aux enchères (25 %) ; machines d'occasion sans prix (18 %, donnée fragile) ; broutards mis en concurrence (6 %) ; courtage de vin en vrac (9 %).

### F, le jumeau qui teste (fichier `salve4-F-jumeau.md`)
Remorqueurs et fenêtre de marée (12 %) ; Vélib, les camions de demain (15 %, flux vérifié) ; parc bondé, parade déplacée (6 %, Queue-Times vérifié) ; le camion et la frontière (8 %, API des files non trouvée) ; retenir le bus du train (22 %) ; Panama, attendre ou payer (15 %) ; saleuses, quelle route d'abord (6 %, proche de la salve 2) ; batterie, charger ou attendre (30 %, wow faible).

### Fusion D+F (fichier `salve4-DF-fusion.md`)
Le Rhin tombe, l'agent réserve (6 %) ; escale annulée, autocars trouvés (7 %) ; fenêtre météo, bateau réservé pour l'éolien en mer (8 %) ; séchoir plein, camions déroutés pour une coopérative de maïs (10 %) ; vol retardé, froid maintenu pour le fret pharma (15 %) ; cars et chambres avant l'annulation d'un vol (24 %) ; jours de franchise d'un importateur (38 %).

### Piste 3D d'Adem (état de l'art en cours)
Reconstruire un quartier en 3D à partir de données ouvertes (LiDAR HD de l'IGN, BD TOPO, OpenStreetMap ; Street View exclu par ses conditions) et y simuler foule, évacuation ou arrivée des secours. Formes repérées : le soir du match (10 %), l'accès des pompiers (8 %), la crue rejouée en 3D (12 %), l'assureur qui ne se déplace plus (20 %), le festival validé avant le montage (25 %), les couloirs de drones (15 %).
