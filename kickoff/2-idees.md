# 2. Idées (21 oct. 2026, soir)

45 idées, six agents Sonnet en contexte neuf, un par angle, chacun n'ayant lu que `0-cadrage.md` et `1-terrain.md`. Sorties brutes et complètes dans `2-idees-brut/` (un fichier par angle). Ici : regroupement par famille, sans jugement. % = probabilité estimée qu'un autre LLM propose la même idée (estimation de l'agent, pas une mesure). Angles : A1 adopter-adapter-scaler, A2 inversion, A3 geste des communautés, A4 système ambitieux, A5 avantage injuste, A6 transfert.

**Lecture honnête de la liste.** Les 45 idées tiennent sur 8 sources ouvertes, toutes citées dans la fiche terrain. Les six agents ont convergé sur 8 familles sur 10 (survols, gels, rappels pro, Bluesky, BODACC × marchés, eau, DPE) : c'est l'effet de la fiche partagée, pas un signal de qualité. La variété est dans les mécaniques, pas dans les terrains. Si la liste paraît trop sage, on relance l'étape 2 entière avec une contrainte nouvelle (exemple : une donnée hors fiche, ou un utilisateur qui paie de sa poche), pas une retouche.

## Top 10 (sélection de la session, pas un classement d'agents)

| # | Idée | % LLM | Cas qui la fonde | Famille |
|---|---|---|---|---|
| 1 | **Pharmacies appelées en parallèle** : l'agent téléphone à 8 officines voisines pour une boîte en tension, avec les équivalents tirés de la base publique des médicaments, et tient la carte des stocks réels par téléphone | 12 % | 12 h par semaine et par pharmacie (PGEU 2025, source primaire) ; stocks grossistes fermés | I |
| 2 | **Rappels clos par téléphone** : à chaque rappel RappelConso, l'agent appelle les structures qui ont reçu le lot (banque alimentaire, épicerie solidaire) et tient le registre de clôture | 6 % | Œufs rappelés distribués par les Restos du cœur (Le Monde 2024) ; 304 rappels en 30 j | C |
| 3 | **L'appel d'offres qui manque** : la base apprend le rythme de chaque acheteur public ; quand la fenêtre passe sans avis, l'agent cherche pourquoi dans les avenants et prolongations | 8 % | Veille BOAMP « chronophage » et saturée côté alertes ; DECP avec périodes manquantes | F |
| 4 | **Chiffrage d'appel d'offres rétro-noté** : l'agent propose un prix d'offre à partir de marchés comparables, enregistre la prédiction, et se corrige seul quand l'attribution paraît | 15 % | Brief : « improving over time from past runs » ; aucun projet trouvé avec une vraie boucle d'amélioration | F |
| 5 | **Sociétés phénix** : relier une société nouvelle ou attributaire d'un marché à une société liquidée (même adresse, dirigeant, activité) et trancher reprise légale ou recréation silencieuse | 9-12 % | 68 414 défaillances en 2025 ; 7,5 % des procédures sans SIREN, SIREN en deux écritures | E |
| 6 | **Analyses d'eau jamais faites** : pour une commune, ce qui aurait dû être mesuré (20 PFAS depuis janvier 2026) et ne l'a pas été, avec le courrier à l'ARS | 10-12 % | 637 000 consommateurs en eau non conforme (IGF mai 2026) ; Hub'Eau ouvert | G |
| 7 | **Pronostic daté de restriction d'eau** : l'agent publie avant l'arrêté préfectoral un pronostic horodaté (zone, niveau, fenêtre) et se note sur les arrêtés réels | 10 % | 10 arrêtés sécheresse en 3 mois en Loire-Atlantique ; Hub'Eau 5 min, VigiEau quotidien | G |
| 8 | **Rappel suivi jusqu'à l'assiette** : pour une cuisine centrale, du rappel au lot, à la recette, aux écoles servies, avec le courrier aux parents ; variante « frères non rappelés » du même site de production | 15-22 % | Trou confirmé « rappels côté pro » ; RappelConso V2 avec code-barres, fiche du jour | C |
| 9 | **Suppression puis repost corrigé** : Bluesky n'a pas de bouton modifier ; l'agent a gardé le post, repère la republication et dit ce qui a changé (chiffre, promesse) | 15 % | Suppressions observables sur Jetstream (2,2/s), sans texte ; AFP sans CrowdTangle depuis 2024 | D |
| 10 | **Constat d'huissier pour le ciel** : chaque vol de couvre-feu à Orly devient un constat daté, pièces numérotées et chaînées par empreinte, exceptions écartées avec motif | 18 % | VITRAIL décalé de 30 min, 60 j d'historique ; relevé à la main par une association | A |

Candidats proches du top, sous 20 % : DPE refaits sans travaux (12 %, H), retraits sourcés sur Wikipédia (10 %, J), chronique datée d'un marché (10 %, F), partie double marchés × défaillances (17 %, E), fichier clients passé aux gels avec mesure de faux positifs (18 %, B).

## Familles

### A. Survols nocturnes d'Orly et CDG (ADS-B) : 6 idées, 6 angles sur 6
Donnée : adsb.lol / OpenSky, temps réel, sans clé. Briques : Kafka (positions), ClickHouse (trajectoires au-delà des 60 j officiels), Postgres (dossiers), Valkey (état courant par avion). Utilisateur : bénévole relevés d'une association de riverains (Portes de l'Essonne Environnement, AVEVY). Menace commune : point 3 (le couvre-feu est la nuit, il faut enregistrer une nuit avant la démo ; liste des dérogations non vérifiée `[?]`), point 2 (VITRAIL, Entract, Survol).
- **A1, 15 %. Dossier de manquement** : trajectoires reconstruites, commune et altitude, exemptions écartées, page par manquement, dossier mensuel.
- **A2, 25 %. Défense anticipée de la compagnie** : l'agent écarte d'avance ce que la compagnie plaidera (7700, vol d'État, déroutement) et garde la récidive par exploitant.
- **A3, 40 %. Feuille partagée, une ligne par survol** : le bénévole coche confirmé/faux, ce qui règle la qualification.
- **A4, 35 %. Dossier de saisine hebdomadaire** : lettre à l'autorité avec annexe par vol ; démo = nuit rejouée en accéléré.
- **A5, 22 %. Procès-verbaux du matin** : Modal retraite l'historique la nuit pour arriver à 9h avec des semaines de traces ; comparaison aux 60 nuits précédentes.
- **A6, 18 %. Constat d'huissier** : pièces P1 à Pn, empreinte SHA-256 chaînée, position et portée du récepteur indiquées.

### B. Gel des avoirs pour assujettis hors banques : 5 idées, 5 angles
Donnée : registre DG Trésor (JSON 14 Mo, publication du 20/10). Briques : OpenSearch (flou, translittération, alias), Postgres (journal en ajout seul), Kafka (diff entre publications). Utilisateur : responsable conformité d'une agence immobilière, d'un cabinet comptable, clerc de notaire, galeriste. Menace commune : point 6 (aucun témoignage d'assujetti trouvé `[?]`), point 4 (démo peu spectaculaire).
- **A1, 30 %. Décision motivée par homonyme** : fiche de vérification horodatée, conservée même sans résultat.
- **A2, 30 %. Preuve face au contrôleur** : « qu'avez-vous fait le 3 mars ? » ; journal chaîné.
- **A4, 35 %. Diff en événements** : une nouvelle ligne au registre balaie 2 000 dossiers, un seul s'allume avec le raisonnement.
- **A5, 18 %. Mesure de faux positifs** : Modal fabrique un million de noms synthétiques pour mesurer le taux de faux positifs avant le jury.
- **A6, 22 %. Acte et mention en marge** : l'acte de contrôle n'est jamais réécrit, chaque publication ajoute une mention, comme l'état civil.

### C. Rappels de produits côté professionnel : 6 idées, 6 angles
Donnée : RappelConso V2 (code-barres, fiche du jour), Open Food Facts, Alim'confiance. Briques : Kafka (rappels du jour), OpenSearch (libellés fournisseur en texte libre), Postgres (lots, sorties, registre). Utilisateur : responsable qualité d'une cuisine centrale, coordinateur d'épicerie solidaire (Andès), antenne de banque alimentaire. Menace commune : point 3 (stocks et bons de livraison privés, simulés en démo), point 7 si la démo s'arrête à l'alerte.
- **A1, 20 %. Registre des retraits** : concerné / non concerné / à vérifier par site, table des correspondances validées que personne n'accumule.
- **A2, 15 %. Les frères non rappelés** : le producteur déclare un périmètre étroit ; l'agent retrouve les produits du même site de production sous d'autres marques et croise l'historique d'inspection.
- **A3, 15 %. Rappel arrivé après la distribution** : mémoire des sorties par foyer, liste des foyers à prévenir, colonne ajoutée dans la feuille d'inventaire.
- **A4, 22 %. Jusqu'à l'assiette** : lot, recette, service, écoles ; démo = un bon de livraison vieux de neuf jours s'allume, 14 écoles se déplient.
- **A5, 6 %. Rappels clos par téléphone** : l'agent appelle les structures (ElevenLabs), comprend « on en a distribué la moitié », relance, registre de clôture avec extrait d'enregistrement.
- **A6, 12 %. Rappel rétroactif** : contrôle de tout ce qui est déjà parti, lecture des plages de lots et DLC en texte libre.

### D. Posts supprimés sur Bluesky : 5 idées, 5 angles
Donnée : Jetstream (temps réel, sans compte ; l'événement de suppression ne contient que des identifiants, il faut avoir stocké la création). Briques : Kafka (flux), Valkey (jointure création → suppression, dédoublonnage), ClickHouse (posts et réactions), OpenSearch (repost proche), Postgres (fiches). Utilisateur : journaliste de cellule de vérification (CheckNews, AFP Factuel). Menace commune : point 4 (peu d'élus français sur Bluesky, démo dépendante d'un rejeu), point 7 (dashboard + alerte), design responsable (comptes publics, rétention).
- **A1, 25 %. Correction ou retrait** : distingue repost quasi identique et retrait après montée des réponses.
- **A2, 15 %. Repost corrigé** : fiche avant/après, matérialité (chiffre, engagement, accusation) contre banalité.
- **A3, 25 %. Fiche de suppression en feuille** : texte disparu, durée de vie, contexte, le journaliste marque « à creuser ».
- **A4, 18 %. Reniement cité** : retrouve dans l'historique du compte les propos antérieurs que le post effacé contredisait.
- **A6, 24 %. Revue au ralenti** : cascade minute par minute, rapprochée de l'événement GDELT de la même quinzaine de minutes.

### E. BODACC croisé avec les marchés publics : 6 idées, 6 angles
Donnée : BODACC (51 M d'annonces, 4 890 le 21/10), DECP (Parquet 237 Mo), recherche-entreprises. Briques : Kafka (annonces du jour), ClickHouse (jointure sur 51 M), OpenSearch (flou sans SIREN), Postgres (portefeuille, échéances), Valkey (cache Sirene à 30 req/min). Menace commune : point 2 (Pappers, AlertBodacc, Altares, Provigis), point 1 (jointure par SIREN = SQL, l'agent ne se justifie que sur les cas sales et la rédaction).
- **A1, 22 %. Créance à déclarer, délai calculé** : credit manager de PME, courrier au mandataire prérempli, date limite calculée depuis la publication.
- **A2, 12 %. Sociétés phénix** : liquidation puis recréation à la même adresse ; tranche cession judiciaire / homonyme / recréation silencieuse ; marchés déjà gagnés par la nouvelle.
- **A3, 9 %. Phénix dans les marchés** : même mécanique, dossier de rapprochement avec niveau de confiance, précédents accumulés.
- **A4, 25 %. Titulaire qui coule, marché continue** : la commande publique d'une intercommunalité reçoit la note sur ses marchés en cours avec l'entreprise jugée, remplaçants possibles.
- **A5, 15 %. Même idée côté acheteur public** : Modal rejoue de nuit 51 M d'annonces contre les DECP avec un modèle ouvert pour les 7,5 % sans SIREN.
- **A6, 17 %. Partie double** : chaque marché (DECP) a sa contrepartie (situation du titulaire, BODACC) ; case rouge « contrepartie introuvable » avec les pièces.

### F. Marchés publics seuls (BOAMP, TED, DECP) : 4 idées, 4 angles
Briques : ClickHouse (DECP Parquet natif, calendrier par acheteur et CPV), OpenSearch (objets en texte libre, multilingue TED), Postgres (prédictions, chroniques), Kafka (avis d'attribution). Menace commune : point 2 (Klekoon, Marchey, WeWinBid côté veille ; Opentender côté indicateurs `[?]`), point 3 (DECP sans clé de jointure fiable, montants parfois des plafonds d'accord-cadre).
- **A1, 10 %. Chronique datée d'un marché** : avis, rectificatifs, sans suite, attribution, avenants, sort du titulaire ; question écrite pour un élu d'opposition.
- **A2, 22 %. Fractionnement** : marchés découpés pour passer sous un seuil ou signés sans avis ; note de signalement citant la ligne DECP et l'article de seuil.
- **A4, 15 %. Chiffrage rétro-noté** : fourchette de prix par comparables, prédiction enregistrée, clôturée seule par l'avis d'attribution, biais corrigé par segment ; démo = rétro-test sur 30 marchés, le rideau se lève sur le prix réel.
- **A6, 8 %. L'appel d'offres qui manque** : la vigie de phare, le feu éteint est l'information ; note de situation de l'acheteur (attendu, observé, explication par les avenants, prochaine fenêtre).

### G. Eau potable et sécheresse (Hub'Eau, VigiEau) : 5 idées, 4 angles
Briques : ClickHouse (séries par unité de distribution, historique aux mêmes dates), Kafka (mesures 5 min, résultats au fil de l'eau), Postgres (règles, courriers, pronostics), Valkey (état par zone). Utilisateur : secrétaire de mairie d'une commune de moins de 3 500 habitants, syndicat des eaux, syndicat d'irrigants, chambre d'agriculture. Menace commune : point 1 (attendu contre réalisé = SQL une fois les règles codées ; un seuil se passe de LLM), point 3 (population par unité et limite de quantification peut-être absentes de Hub'Eau `[?]`, arrêtés-cadres en PDF).
- **A2, 10 %. Analyses qui n'ont pas eu lieu** : calendrier réglementaire contre publié, résultats « non quantifié » incapables de rien voir, courrier à l'ARS.
- **A3, 12 %. Analyses jamais faites** : même mécanique, plus la date d'apparition de chaque résultat, donc le retard de publication devient une donnée.
- **A4, 10 %. Arrêté sécheresse anticipé** : seuils extraits de l'arrêté-cadre, date de franchissement estimée, calendrier d'irrigation par scénario ; démo = rejeu de l'été 2026.
- **A5, 15 %. Trente communes, trente notes** : Modal calcule la nuit toutes les unités sur 10 ans ; note de deux pages pour le conseil municipal ; mesure « sur 30 communes réelles » via les communes d'origine des camarades.
- **A6, 10 %. Pronostic daté** : pré-enregistrement d'essai clinique et cote de bookmaker ; bulletin signé avant l'événement, relevé de comptes qui s'allonge.

### H. Diagnostics de performance énergétique (DPE ADEME) : 5 idées, 5 angles
Donnée : 15,8 M de lignes, sans clé. Briques : ClickHouse (jointure de la table sur elle-même par logement), OpenSearch (adresses mal saisies), Postgres (dossiers). Menace commune : point 1 (la détection est du SQL), point 3 (le DPE ouvert n'identifie peut-être pas le logement à la porte près `[?]`), aucune douleur chiffrée dans la fiche pour ce public.
- **A1, 12 %. Contre-expertise par comparables** : gestionnaire locatif, champs qui divergent des voisins de même typologie, demande de nouveau diagnostic.
- **A2, 12 %. Refaits jusqu'à la bonne lettre** : juriste d'ADIL, chronologie du logement, champs saisis qui ont bougé sans travaux.
- **A3, 14 %. Permanence de locataires** : même mécanique, courrier de conciliation ou mise en demeure.
- **A4, 12 %. Réseau d'agences** : contrôle avant publication d'annonce ; démo = scan visible des 15,8 M, 40 logements isolés.
- **A5, 10 %. Le locataire tape son adresse** : les quatre sont locataires parisiens, 24 logements réels passés ce soir, un juré tape son adresse en direct.

### I. Pharmacie et ruptures de médicaments : 2 idées, 2 angles
Donnée : BDPM (base publique des médicaments, fichiers, `[?]` non testée), listes ANSM annuelles. Menace commune : point 1 (les substituts du même groupe générique = jointure SQL ; stocks fermés).
- **A3, 35 %. Fiche de repli par rupture** : journal daté des changements de statut par diff quotidien, conduite à tenir ANSM, ce que le pharmacien peut faire seul contre ce qui exige un médecin.
- **A5, 12 %. Pharmacies appelées en parallèle** : 8 appels simultanés (ElevenLabs), arrêt à la première confirmation, fiche de dépannage, carte des stocks réels par téléphone qui s'enrichit ; le téléphone remplace la donnée fermée.

### J. Wikipédia : 1 idée, 1 angle
- **A3, 10 %. Retraits sourcés** : patrouilleur de Wikipédia en français ; l'agent lit la différence entre versions, identifie la référence retirée, depuis combien de versions l'affirmation tenait, classe nettoyage / blanchiment probable / litige ; note pour la page de discussion. Menace : point 4 et route commerciale faible.

## Questions posées par les agents (à trancher avec Adem avant l'étape 3)
- Téléphonie sortante (familles C et I) : ElevenLabs exige un numéro (Twilio ou SIP `[?]`). Sinon appels dans le navigateur avec un membre qui joue le correspondant.
- Appels à des tiers : seulement des volontaires prévenus.
- Modèle pour l'extraction en masse (familles E et G) : modèle ouvert sur Modal (pas de facture) ou Haiku par l'API (payant, accord d'Adem requis).
- Réseau de l'équipe : qui a un proche pharmacien, bénévole alimentaire, élu ou secrétaire de mairie, agent immobilier ou notaire, PME qui répond aux marchés ?
