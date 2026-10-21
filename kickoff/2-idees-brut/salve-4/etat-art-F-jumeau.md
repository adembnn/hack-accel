# État de l'art F : le jumeau qui teste (21 oct. 2026)

Décision débloquée : quel lieu on peut reconstituer demain, qui le vend déjà, qui paierait.
Légende : [V] testé par moi le 21 oct. 2026 vers 14h50 UTC. [S] lu dans une doc ou un article. [?] non vérifié.

## 1. Flux ouverts (sans contrat, sans API payante)

**Digitraffic, Finlande (marine)** [V]
- Escales : `meri.digitraffic.fi/api/port-call/v1/port-calls`. Appel sans clé : 259 escales mises à jour en 24 h.
- Chaque escale : navire, port précédent et suivant, agent, poste à quai, ETA, ETD, ATA, ATD, source de l'ETA (Agent, Port).
- Exemple lu : « Auto Eco », Vuosaari (Helsinki), poste VC2, ETA du 23 oct. 03h45, ETD 23 oct. 18h.
- AIS : `/api/ais/v1/locations` renvoie 1 251 positions à 14h53 ; `/vessels` donne 1 106 fiches (destination, tirant d'eau).
- Historique : la requête `from=…&to=…` filtre sur la date de mise à jour. 113 escales mises à jour le 1er sept. 2026, 18 le 1er janv. 2025. Historique partiel, profondeur totale [?].
- Licence : CC BY 4.0 [S, digitraffic.fi/en/terms-of-service].
- Limite : 60 requêtes/min par IP ; l'en-tête `Digitraffic-User` relève la limite ; la compression gzip est obligatoire (sinon erreur 406, vécue) [S].
- Même licence et même accès : trains en direct (`rata.digitraffic.fi`) [V], historique 1 817 trains le 1er oct. 2026 et 1 881 le 15 janv. 2025 [V] ; capteurs routiers (`tie.digitraffic.fi/api/tms`, comptage horaire de véhicules) [V].

**Kystverket, Norvège (AIS)** [S]
- TCP brut `153.44.253.27:5631`, sans inscription, licence NLOD 2.0. Zone économique norvégienne et Svalbard.
- Exclut les pêcheurs de moins de 15 m et les plaisanciers de moins de 45 m. Pas de délai annoncé.
- Mon test : la connexion n'a rien renvoyé en 10 s depuis ce PC. Non confirmé [?]. BarentsWatch exige un compte (14 jours max).

**aisstream.io (mondial, communautaire)** [S]
- WebSocket, clé API obligatoire, boîte géographique obligatoire, 3 connexions par compte, pas de SLA, pas de rejeu (« not durably replayed »). Prix et gratuité de la clé non écrits dans la doc [?].

**ADS-B** [V]
- adsb.lol : `api.adsb.lol/v2/point/{lat}/{lon}/{rayon_nm}`, sans clé, ODbL. 32 avions à moins de 20 nm d'Amsterdam à l'instant du test. L'API est marquée « deprecated » dans la doc.
- Historique : dépôt GitHub `adsblol/globe_history`, un dump quotidien, ODbL, environ 1,9 Tio au total [S].
- OpenSky anonyme : positions en direct [V] (Roissy lu), mais 400 crédits par jour, pas d'historique, 10 s de résolution [S]. Les arrivées par aéroport ont répondu 404 [V]. Usage commercial non précisé [?].
- airplanes.live : 403, il faut écrire aux auteurs [V].

**Aéroports**
- Avinor, Norvège : `asrv.avinor.no/XmlFeed/v1.0?airport=TRD&TimeFrom=1&TimeTo=3` renvoie vols, heure prévue, statut réel (code A + heure), tapis à bagages. Sans clé [V]. Aéroports privés exclus [S]. Licence complète non lue [?].
- Schiphol : API vols avec APP ID et APP KEY, compte gratuit au Developer Center, niveau public « limité » [S]. Non testé.

**Transport public**
- Entur (Norvège) : SIRI ET et GTFS-RT sans clé, 9,3 Mo de trip-updates reçus [V]. Historique [?].
- France : plusieurs réseaux publient du GTFS-RT en Licence Ouverte sur transport.data.gouv.fr [S] ; besoin ou non d'une clé : [?].

**Ports fermés ou payants**
- Anvers-Bruges : PortVoyages payant (1 500 requêtes/jour/entreprise), PortStays 100/jour, ETA Terminal gratuit après inscription (PSA, MPET, DP World, CSP Zeebrugge) [S].
- Rotterdam : Portbase Vessel Visit et Spotlight (postes à quai) sur inscription au Marketplace. Pas de flux d'occupation des quais public trouvé [S].
- Le Havre (HAROPA), Marseille-Fos, Hambourg : aucun flux d'escales ouvert trouvé [?]. HAROPA ouvre seulement le marégraphe du Havre via REFMAR [S].
- Écluses et ponts néerlandais : données EuRIS (statut ouvert/fermé) à accès restreint, licence inconnue [S]. Mon appel à Rijkswaterstaat : échec réseau [V], donc [?].
- Danemark : AIS historique gratuit sur demande ; l'AIS en direct est payant (1 800 à 5 600 DKK/an en 2016) [S].

## 2. Qui vend déjà

| Acteur | Client type | Prix | Levée, propriétaire | Ce qu'il ne fait pas |
|---|---|---|---|---|
| PortXchange Synchronizer (Rotterdam) | autorité portuaire, terminaux, agents, armateurs (ONE : environ 350 escales/an à Rotterdam) | non public | créé par l'autorité portuaire de Rotterdam en 2019 avec Shell et Maersk ; affaire de VC en janv. 2025 avec Platform Zero, montant non publié (PitchBook) | coordonne des horodatages entre acteurs ; ne teste pas de scénarios ; ne négocie pas |
| Awake.AI (Turku) | ports Helsinki, Gothenburg, Anvers-Bruges, Valence, Auckland, Peel Ports | sur demande | aucun tour en millions trouvé ; subvention 267 k$ (Tracxn) ; ARR 1,9 M$ estimé par Latka [?] | planifie les escales ; décide-t-il seul ? non précisé |
| Portbase (Rotterdam, Amsterdam) | tout le monde dans ces deux ports | non public | système communautaire du port | échange de données, pas de simulation |
| Assaia (Zurich) | aéroports (JFK T4, Heathrow, Gatwick, Dubaï, Pearson, Munich, BER…) | non public | 26,6 M$ série B, déc. 2025, mené par Armira Growth ; ADR Ventures investisseur | surtout voit et prédit ; « intervention automatisée » annoncée sans détail ; gros hubs |
| Autonoma AutoVerse (Cisco) | Delta à Atlanta | non public | non trouvé | jumeau de test d'affectation de portes ; un seul client cité |
| Searidge | contrôle aérien et aéroports (tours distantes) | non public | détenu à parts égales par NATS et NAV CANADA depuis 2017 | tour numérique, pas un jumeau |
| Navis (N4) | terminaux conteneurs | non public | vendu 451 M$ à Accel-KKR en 2021 (Accel-KKR n'est pas Accel) | système d'exploitation de terminal ; pas de test de demain avec flux externes [?] |
| INFORM (Aix-la-Chapelle) | HHLA Hambourg, APM, Los Angeles | non public | 70 M€ de CA en 2016 (vieux) | optimise quais, cours, camions ; logiciel lourd, projet de plusieurs mois [?] |
| Kpler, Portcast | chargeurs, transitaires | non public | levées non trouvées | prédit ETA et congestion ; ne décide pas |
| GISGRO | petits et moyens ports (Hamina-Kotka bâtit un jumeau avec eux) | non public | non trouvé | exactement le créneau « petit port » ; encore en construction |

Non trouvés malgré recherche : Cognite, AnyLogic (page prix en 404), Siemens, Kalmar (voir section 5).

## 3. Décisions testées et coût quand elles ratent (chiffres sourcés)

- **Attente à quai au départ** : 47 min en moyenne avant, 32 min après Synchronizer, sur 177 navires à Rotterdam [S, PortXchange]. La page contredit son propre titre (15 %), je retiens les minutes.
- **Vitesse d'approche contre attente au mouillage** : 9 % de carburant en moins avec une arrivée juste à temps sur les 12 dernières heures, 26 navires, un terminal de Rotterdam, essai sur papier de 2020 [S, GIA]. Les navires passent jusqu'à 9 % de leur temps à attendre [S].
- **Attente à Anvers** : 32 h début avril à 44 h fin mai 2025 (+37 %) [S, Drewry via presse]. Jusqu'à 11 navires au mouillage à Rotterdam début juin 2025 [S, Lloyd's List via presse].
- **Barges** : 12 à 24 h normalement, 72 à 75 h avec le bas niveau du Rhin en 2026 ; 163 h à Rotterdam au pire chez Contargo [S]. Un créneau d'écluse manqué coûte 8 à 24 h [S, consultant cité]. Retard moyen lié à la congestion aux terminaux maritimes : plus de 96 h [S, même source]. Coût par heure : non trouvé.
- **Camions** : créneaux décalés de 7 à 12 h à Rotterdam et Anvers, avis Contargo non daté [S]. Coût par heure de camion : non trouvé.
- **Surestaries** : immobilisation d'un navire 10 000 à 36 000 $/jour selon les cas (Chattogram, Durban), donc pas européen [S, presse]. Franchise de 4 à 7 jours puis 75 à 300 $ par conteneur et par jour aux États-Unis [S].
- **Aéroport** : une minute de retard coûte 17,78 € à la porte, 46,69 € au roulage, 82,95 € en route (prix 2022, Eurocontrol/Westminster) [S] ; 104 € la minute de retard ATFM en 2018 [S]. Eurocontrol met en garde : indicatif, pas pour planifier. Les retards de gestion du trafic aérien ont coûté 16,1 Md€ de 2015 à 2025 [S, IATA]. Une journée très chargée : environ 20 M€ [S].

## 4. Les trous (absence non prouvée sauf mention)

- **Petits ports et ports de taille moyenne** : raisons citées : budget informatique, données enfermées chez les fournisseurs, rotation trop faible pour justifier l'investissement [S, Trelleborg, BPO]. GISGRO s'y met seulement maintenant.
- **Barges et terminaux intérieurs du Rhin** : retards massifs, acteurs fragmentés ; aucun jumeau abordable trouvé [?]. Contargo publie ses temps d'attente en pages web, sans API [S].
- **Aéroports régionaux** : l'A-CDM complet est surtout dans les grands hubs, 34 aéroports en 2022 [S, Eurocontrol]. Le projet SESAR E-CRA cherche une version moins chère [S]. Aucun jumeau commercial pour régional trouvé [?].
- **Ports français** (Le Havre, Fos, Dunkerque) : pas de flux d'escales ouvert trouvé [?].
- **Quais, écluses, files de camions** : l'état réel n'est ouvert nulle part où j'ai cherché. Il faut un flux d'escales, un AIS ou un GTFS-RT, puis déduire.
- **Ports de plaisance** : aucune recherche aboutie ici [?].

## 5. Les 3 lieux les plus prometteurs pour demain

**1. Helsinki-Vuosaari et le corridor finlandais (ferries, camions, trains)**
- Flux : escales + AIS + comptages routiers + trains, une seule API, CC BY 4.0, sans clé, tout [V]. Seule source qui permet de rejouer une vraie journée passée.
- Acheteur : autorité portuaire, terminal, transitaire, entreprise de transport qui amène des camions au quai. Awake.AI y est déjà (Port of Helsinki), donc l'angle doit être « agent qui teste puis agit », pas « prédire l'ETA ».
- Décision testable : combien de camions et à quelle heure sur un quai, vu l'ETA et l'ETD des ferries. Coût : attente à quai, 47 min mesurées à Rotterdam sur ce type de décision.
- Risque : petit volume (259 mises à jour par jour pour tout le pays), un pays seulement. Capteurs routiers pas reliés à un quai précis.

**2. Barges Rotterdam-Anvers (trou le plus net)**
- Flux : AIS via aisstream (clé gratuite [?]) ; ETA Terminal Anvers gratuit après inscription [S]. L'état des quais reste inconnu.
- Acheteur : opérateurs de barges (Contargo cité), transitaires. Taille du marché et prix : non trouvés [?].
- Décision testable : quel terminal appeler en premier, rater ou non le créneau d'écluse, sachant 12 à 24 h normaux contre 72 à 163 h au pire.
- Risque : flux faible. Demain, on aurait la position des barges, pas l'état des terminaux. Fusionne bien avec D (l'agent appelle un terminal pour un créneau).

**3. Un aéroport régional norvégien (Trondheim, Bergen) avec Avinor + ADS-B**
- Flux : vols, statut réel, tapis à bagages sans clé [V] ; approche des avions par adsb.lol [V]. Pas de postes de stationnement ni d'équipes au sol.
- Acheteur : assistance au sol, gestionnaire d'aéroport. Assaia vise les gros hubs, le régional est un trou [?]. Prix et nombre de clients : non trouvés.
- Décision testable : combien d'agents sur quel vol, quel tapis, quelle porte. Coût : 17,78 à 46,69 € la minute (Eurocontrol), pour un régional les volumes sont bien plus faibles.
- Risque : marché petit, démo moins spectaculaire.

Écarté : Schiphol (clé, niveau public limité, non testé), Hambourg, Le Havre, Marseille (pas de flux).

## 6. Ce que je n'ai pas trouvé

- Aucun prix public d'un jumeau portuaire ou aéroportuaire (PortXchange, Awake.AI, Assaia, Navis, INFORM, Autonoma, Cognite, Siemens, Kalmar, AnyLogic).
- La levée réelle d'Awake.AI et de PortXchange. Les agrégateurs se contredisent.
- Le coût d'une heure de camion ou de barge en attente, en Europe.
- L'accès réel à Kystverket (connexion sans réponse) et à Rijkswaterstaat.
- Un flux ouvert d'occupation de quais, d'écluses ou de portails de terminal en Europe.
- Le nombre de ports, d'aéroports ou de terminaux clients potentiels en Europe, donc la taille du marché.
- L'historique complet de Digitraffic et d'Entur.
- Les prix 2026 d'aisstream et de sa clé, les conditions commerciales d'OpenSky.
