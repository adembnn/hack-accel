# Angle 5 : avantage injuste de l'équipe (21 oct. 2026)

Sources lues : `kickoff/0-cadrage.md` et `kickoff/1-terrain.md`, rien d'autre. Les « § » renvoient à la fiche terrain. `[?]` = non vérifié. Les pourcentages « autre LLM » sont des estimations, pas des mesures. Sous 20 % : idées 1, 2, 3, 4, 5, 6.

Fil commun : trois avantages reviennent. (a) Le téléphone sert de capteur : un appel crée une donnée que personne n'ouvre (stock, présence d'un lot). (b) Les quatre sont leurs propres utilisateurs ou ont un proche qui l'est : on peut mesurer « sur N cas réels » (§9, question 8 de §7) dès ce soir. (c) Modal calcule en une nuit une table dérivée que les autres équipes n'auront pas à 9h.

### Rappels clos par téléphone
- **Une phrase** : la coordinatrice logistique d'une banque alimentaire (ou d'une épicerie solidaire) reçoit un rappel RappelConso ; l'agent retrouve les structures partenaires qui ont reçu le produit et les appelle une par une.
- **Mécanique centrale** : l'agent parle (ElevenLabs), demande lot par lot, comprend « on en a distribué la moitié », relance les absents et produit un registre de clôture : par lot et par structure, réponse, quantité restante, heure, extrait d'enregistrement. Une alerte prévient, une requête SQL liste ; aucune des deux ne ferme la boucle auprès des gens.
- **Fondement** : §4, ligne RappelConso : « 304 rappels en 30 j (testé) », « œufs rappelés distribués par les Restos du cœur (Le Monde) ». Réserve de la fiche, §4 même ligne : « côté pro aucun témoignage [?] ».
- **Avantage injuste exploité** : réseau associatif des quatre (BDE, épiceries solidaires étudiantes, familles bénévoles) pour avoir ce soir une vraie coordinatrice et cinq bénévoles prévenus qui décrochent ; 440 min d'ElevenLabs couvrent une centaine d'appels de 3 min. Une autre équipe n'a personne à appeler de l'autre côté du fil et se retrouve avec une voix qui parle à un simulateur.
- **Donnée et brique Aiven** : RappelConso V2 (data.economie.gouv.fr, ODS, sans clé) + Open Food Facts par GTIN pour marques et catégories. Kafka : rappels entrants et événements d'appel. OpenSearch : rapprochement flou entre l'intitulé du rappel et les lignes du bon de livraison (CSV fourni par la coordinatrice, anonymisé). Postgres : registre de clôture horodaté. Valkey : file d'appels, pas de double appel à la même structure.
- **Utilisateur à appeler demain soir** : coordinateur ou coordinatrice logistique d'une banque alimentaire départementale, ou responsable d'une épicerie solidaire étudiante.
- **% LLM** : 6 %
- **Carte de rejet** : #3, les bons de livraison par structure sont privés ; on dépend d'un CSV que la coordinatrice accepte de nous passer.

### Pharmacies appelées en parallèle
- **Une phrase** : le pharmacien titulaire cherche une boîte en tension pour un patient ; l'agent appelle huit pharmacies voisines en même temps, avec la liste des équivalents tirée de la base publique des médicaments.
- **Mécanique centrale** : l'agent sait quoi demander (groupe générique, dosages, codes CIP), comprend « il m'en reste une demi-boîte », arrête les autres appels dès la première confirmation et sort une fiche de dépannage : pharmacie, produit, heure, nom de la personne qui a confirmé. La substitution reste la décision du pharmacien. Chaque réponse s'ajoute à une carte des stocks réels par téléphone ; au bout d'un mois, elle dit quelle pharmacie répond oui, à quelle heure.
- **Fondement** : §1.4 : « ~12 h par semaine et par pharmacie (5,3 h en 2021), 81 % déclarent une perte financière », moyenne de 27 pays [?] ; §10 : « pharmacie : source primaire, stocks grossistes fermés ». Le téléphone remplace la donnée fermée.
- **Avantage injuste exploité** : l'un des quatre joue le pharmacien (ou en a un dans sa famille) et trois pharmacies de proches, prévenues, reçoivent de vrais appels. Une autre équipe n'a ni le pharmacien pour dire si la fiche est utilisable, ni les pharmacies qui acceptent d'être appelées.
- **Donnée et brique Aiven** : BDPM (base publique des médicaments, fichiers texte téléchargeables, sans compte [?, non testé le 21/10]) ; les ruptures ANSM sont annuelles (§4, hors tableau) et ne servent qu'à marquer une spécialité en tension. Postgres : spécialités, CIP, groupes génériques, registre des appels. OpenSearch : noms de médicaments dictés à la voix, tolérance à l'orthographe et à la phonétique. Valkey : état des appels parallèles. ClickHouse : historique des réponses par pharmacie et par heure, utile seulement après quelques jours.
- **Utilisateur à appeler demain soir** : pharmacien(ne) titulaire ou préparateur(trice) d'officine.
- **% LLM** : 12 %
- **Carte de rejet** : #1, sans la base l'agent appelle quand même pour la boîte exacte ; la donnée n'apporte que la liste des équivalents, ce qui est mince. Risque annexe : appeler des pharmacies qui n'ont rien demandé, d'où les trois volontaires.

### Trente communes, trente notes
- **Une phrase** : le secrétaire de mairie ou l'adjoint à l'eau d'une commune de moins de 3 500 habitants reçoit une note de deux pages sur son réseau : paramètres qui s'approchent d'une limite, date probable de dépassement, obligations qui en découlent.
- **Mécanique centrale** : Modal calcule la nuit entière les séries de toutes les unités de distribution, 10 ans, tous paramètres. L'agent lit celle de la commune demandée, applique la limite en vigueur à chaque date (certaines limites changent, par exemple les PFAS en 2026 [?]) et écrit la note pour le conseil municipal avec un projet de courrier à l'ARS ou à l'exploitant ; chaque chiffre renvoie à l'identifiant d'analyse. L'événement n'a pas eu lieu : ce n'est pas une alerte, c'est un dossier préparé avant.
- **Fondement** : §1.5 : « 637 000 consommateurs desservis par une eau non conforme en 2025 (72 unités de distribution), 90 % pesticides » ; §4 Hub'Eau : « consultation brute commune par commune ». Réserve de la fiche : « aucun récit de commune trouvé ».
- **Avantage injuste exploité** : les quatre et leurs camarades viennent de communes de toute la France ; ce soir on recueille une trentaine de communes d'origine réelles, demain on appelle trois mairies. On peut dire « sur 30 communes réelles » (§9). Une autre équipe démontre sur une commune choisie à la main et n'a pas de maire au bout du fil.
- **Donnée et brique Aiven** : Hub'Eau, API qualité de l'eau potable (sans clé, page citée, **non testée** : première vérification demain matin). ClickHouse : séries d'analyses et calcul de tendance par UDI et par paramètre. Postgres : communes, UDI, limite applicable avec sa date, notes émises. Pas de Kafka : les résultats sont mensuels.
- **Utilisateur à appeler demain soir** : secrétaire de mairie ou adjoint(e) à l'eau et à l'assainissement d'une commune de moins de 3 500 habitants.
- **% LLM** : 15 %
- **Carte de rejet** : #1, une tendance sur une série est une requête SQL ; la place de l'agent tient à la note et au changement de limite dans le temps. Frôle aussi #7 si on la présente comme une alerte.

### Titulaire en liquidation, marché ouvert
- **Une phrase** : le responsable du service marchés d'une mairie (ou d'un hôpital) reçoit, quand l'un de ses titulaires ouvre une procédure collective, la liste de ses contrats en cours et le dossier pour les sécuriser.
- **Mécanique centrale** : l'agent rattache l'annonce BODACC au titulaire du marché dans les DECP, y compris quand le SIREN manque ou s'écrit de deux façons, tranche les homonymes par raison sociale et adresse, puis produit une note : contrats concernés (montants, dates, sous-traitants déclarés), échéance pour déclarer une créance (deux mois à compter de la publication au BODACC [?, à faire valider par le service juridique]) et un projet de courrier au mandataire dont le nom et l'adresse figurent dans l'annonce.
- **Fondement** : §2.4 : « BODACC avec SIREN en deux écritures et 7,5 % des procédures collectives sans SIREN ; DECP scrapées avec des périodes manquantes » ; §4 BODACC : « 68 414 redressements et liquidations en 2025 (Altares) ».
- **Avantage injuste exploité** : un service marchés de la commune d'origine d'un des quatre se joint ce soir ; Modal rejoue de nuit les 51 132 086 annonces contre le fichier DECP de 237 Mo, avec un modèle ouvert pour les 7,5 % sans SIREN, donc sans facture d'API. Une autre équipe fait « alerte BODACC » pour les créanciers ; côté acheteur public, la fiche ne montre aucun outil [?, non cherché].
- **Donnée et brique Aiven** : BODACC (ODS, quotidien, 4 890 annonces le 21/10) + DECP (data.gouv.fr, 237 Mo) + recherche-entreprises pour dédoublonner (sans clé, testé). Kafka : diff quotidien du BODACC. ClickHouse : jointure historique BODACC × DECP. OpenSearch : rapprochement flou des raisons sociales sans SIREN. Postgres : portefeuille par acheteur et suivi des échéances.
- **Utilisateur à appeler demain soir** : responsable du service commande publique d'une commune ou d'un centre hospitalier.
- **% LLM** : 15 %
- **Carte de rejet** : #2 (Pappers surveille une liste de SIREN : un acheteur peut déjà lui fournir ses titulaires) et #1 (une fois les SIREN nettoyés, la jointure est une requête).

### Comparables de DPE par immeuble
- **Une phrase** : l'étudiant locataire d'un studio classé F ou G tape son adresse ; l'agent retrouve tous les DPE de ce logement dans la base ADEME et ceux de logements comparables du même immeuble ou de la même rue, puis écrit la demande au bailleur.
- **Mécanique centrale** : l'agent normalise l'adresse, repère les DPE successifs du même logement (dates, versions, classes), cherche les logements voisins de surface et de période proches classés autrement, et écrit la lettre : contre-diagnostic demandé, conséquence de la classe selon la date du bail (G interdit à la location depuis 2025, amende 3 000 €). Modal prépare la nuit le voisinage de chacune des 15,8 M de lignes pour répondre en quelques secondes devant le jury.
- **Fondement** : §4 DPE : « 15 807 887 lignes (testé) », « G interdit à la location depuis 2025, amende 3 000 € (Service-Public) » ; « alerte-dpe.fr saturé », donc côté bailleur seulement : le côté locataire n'apparaît pas dans la fiche [?].
- **Avantage injuste exploité** : les quatre sont des locataires parisiens ; avec vingt volontaires de plus, on passe ce soir 24 logements réels dans la chaîne et on mesure : combien ont un DPE dans la base, combien sont F ou G, combien ont des diagnostics contradictoires. Un juré peut aussi taper son adresse devant tout le monde. Une autre équipe démontre sur une adresse au hasard, sans taux mesuré.
- **Donnée et brique Aiven** : DPE ADEME, data-fair `dpe03existant` (sans clé, Licence Ouverte) ; normalisation d'adresse par l'API adresse nationale [?, non listée dans la fiche]. ClickHouse : les 15,8 M de lignes et les requêtes de voisinage. OpenSearch : adresses mal écrites (« 12 r. Ledru Rollin »). Postgres : dossiers générés avec les lignes sources.
- **Utilisateur à appeler demain soir** : locataire d'un studio ou d'une chambre à Paris classé F ou G (un colocataire de l'un des quatre) ; en second, conseiller juridique d'une ADIL.
- **% LLM** : 10 %
- **Carte de rejet** : #1, retrouver un DPE par adresse est une requête ; l'agent doit gagner sa place par les comparables et la lettre. Le droit cité (dates, montants) reste à faire relire.

### Fichier clients passé aux gels
- **Une phrase** : l'agent immobilier, le clerc de notaire ou le galeriste (assujetti hors banque) dépose son fichier clients ; l'agent le confronte au registre national des gels et recommence à chaque publication.
- **Mécanique centrale** : appariement avec translittération et alias ; pour chaque homonyme possible, l'agent demande au dossier le seul élément qui tranche (date de naissance, nationalité) et note la décision. Pièce : le journal de passage daté, avec la version de la liste, les noms testés et les levées de doute, donc la preuve que l'obligation de résultat a été tenue même quand rien n'est sorti.
- **Fondement** : §2.3 : « le Trésor exige de conserver les traces même infructueuses » ; §4 Gels : « obligation de résultat (ACPR 2026) », « JSON de 14 Mo (testé) » ; §10 : « aucun témoignage ni outil TPE ».
- **Avantage injuste exploité** : un proche assujetti (agence, étude, galerie) joue l'utilisateur et valide le journal comme une vraie pièce. Modal fabrique un million de noms de clients synthétiques et mesure le taux de faux positifs, la mesure que demande la question 8 de §7 et qu'une autre équipe n'aura pas faite. Avantage plus faible que pour les autres idées.
- **Donnée et brique Aiven** : registre national des gels (DG Trésor, JSON, API ouverte, User-Agent obligatoire, 1er essai en timeout). OpenSearch : appariement flou, translittération, alias. Kafka : diff entre deux publications pour ne rescanner que les changements. Postgres : journal d'audit en ajout seul.
- **Utilisateur à appeler demain soir** : responsable conformité d'une agence immobilière, clerc de notaire ou gérant d'une galerie d'art.
- **% LLM** : 18 %
- **Carte de rejet** : #1, l'appariement flou est OpenSearch seul ; l'agent n'ajoute que la levée de doute et le journal. Absence de témoignage d'utilisateur dans la fiche.

### Nuits d'Orly en procès-verbaux
- **Une phrase** : le président d'une association de riverains d'Orly reçoit chaque matin le procès-verbal des vols du couvre-feu de la veille, reconstitué à partir de traces ADS-B.
- **Mécanique centrale** : l'agent assemble les positions en trajectoires, identifie appareil et exploitant, sépare approche, départ et survol, cherche si une urgence ou une dérogation explique le vol, et compare la nuit aux 60 précédentes (« est-ce normal ? » contre sa propre base). Pièce : un procès-verbal numéroté, trace jointe, prêt à joindre à une plainte à l'ACNUSA.
- **Fondement** : §4 ADS-B : « VITRAIL décalé de 30 min, 60 jours (ADP) », « relevé à la main en 2017 (PEE) ». Réserve de la fiche, §10 : valeur probante d'un récepteur ADS-B face au radar d'ADP [?].
- **Avantage injuste exploité** : Modal retraite cette nuit l'historique disponible (archives quotidiennes adsb.lol [?], non testées) pour que la base contienne déjà des semaines à 9h ; les autres équipes démarrent à zéro et n'ont que 7 h de trace au pitch. L'association PEE, citée dans la fiche, peut être appelée ce soir, et l'un des quatre joue le riverain.
- **Donnée et brique Aiven** : adsb.lol (temps réel testé, licence [?]) et son historique. Kafka : positions en flux. ClickHouse : traces et historique, requêtes par cylindre géographique et fenêtre horaire. Postgres : procès-verbaux avec les lignes sources.
- **Utilisateur à appeler demain soir** : président(e) ou secrétaire d'une association de riverains d'Orly (Portes Essonne Environnement est cité dans la fiche).
- **% LLM** : 22 %
- **Carte de rejet** : #2, VITRAIL, Entract et Survol existent (§3, « Données françaises déjà occupées ») ; il faut montrer que le procès-verbal, pas la carte, est ce qui manque.

## Lecture rapide
- Avantage le plus net : 1 et 2 (le téléphone crée la donnée), puis 3 et 5 (mesure sur N cas réels dès ce soir).
- Plus fragile : 6 (avantage plus faible) et 7 (collision avec #2).
- Aucune idée n'est bloquée par un compte ou une clé, sauf la voix sortante (voir question 1).

## Questions (pour Adem)
Décor : les idées 1 et 2 supposent des appels sortants réels, les idées 3 et 5 demandent des volontaires que vous recrutez ce soir, et l'idée 4 utilise un modèle sur Modal.
1. Téléphonie sortante : ElevenLabs doit être relié à un numéro (Twilio ou SIP [?]). a) on prend ce lien et on appelle de vrais téléphones ; b) on reste en appels dans le navigateur, un membre joue le correspondant ; c) pas de voix. Ma reco : a. Défaut si pas de réponse : b.
2. Réseau : qui, parmi les quatre, a un proche pharmacien (a), bénévole en banque alimentaire ou épicerie solidaire (b), élu ou secrétaire de mairie (c), agent immobilier ou notaire (d), aucun (e) ? Ma reco : on retient les idées dont le réseau existe ; défaut : e, donc idées 3 et 5.
3. Appels à des tiers : a) seulement des volontaires prévenus avant ; b) simulation, un membre répond. Ma reco : a. Défaut : b.
4. Modèle pour l'extraction en masse (idée 4) : a) un modèle ouvert sur Modal (crédit déjà là, pas de facture) ; b) Haiku via l'API Anthropic (payant, coût plafonné à fixer). Ma reco : a. Défaut : a.
