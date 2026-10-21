# Angle Transfert : 7 idées

Lecture : les % LLM sont des estimations de ma part, pas des mesures. Les numéros de ligne renvoient à `kickoff/1-terrain.md`.

### Constat d'huissier pour le ciel
- **Une phrase** : l'association de riverains d'Orly obtient, pour chaque passage d'avion pendant le couvre-feu, un constat daté avec pièces numérotées, construit à partir de positions ADS-B (avions qui émettent leur position en clair) que personne d'autre ne conserve.
- **Mécanique transférée** : le constat d'huissier (un tiers neutre fige un fait, date, lieu, chaîne de pièces non modifiables) croisé avec la boîte noire (tout enregistrer à haute résolution, relire après coup). L'agent lit le texte du couvre-feu et de ses dérogations [?], décide pour chaque passage s'il relève d'une infraction possible ou d'un cas couvert, puis rédige le constat. Une alerte dit « un avion passe », une requête SQL liste des positions ; ni l'une ni l'autre ne qualifie le fait au regard du texte ni ne produit un document opposable. Pièce : constat PDF, pièces P1 à Pn, chaque pièce = positions échantillonnées par seconde, empreinte SHA-256 chaînée à la pièce précédente, position et portée du récepteur indiquées.
- **Fondement** : ligne 38 : « VITRAIL décalé de 30 min, 60 jours » (ADP) ; « relevé à la main en 2017 » (Portes de l'Essonne Environnement).
- **Donnée et brique Aiven** : adsb.lol (temps réel, sans clé, testé) ou OpenSky. Kafka : flux de positions autour d'Orly. ClickHouse : trajectoires à pleine résolution gardées seulement autour des passages candidats (TTL court pour le reste, comme une boîte noire). PostgreSQL : dossier, numérotation des pièces, chaîne d'empreintes.
- **Utilisateur à appeler demain soir** : le ou la président(e) d'une association de riverains d'Orly (PEE) ou son bénévole chargé du relevé.
- **% LLM** : 18 %
- **Carte de rejet** : #3 et #2. Valeur probante d'un récepteur ADS-B face au radar d'ADP non vérifiée (ligne 89), licence adsb.lol [?], et VITRAIL, Entract, Survol occupent déjà le sujet.

### Acte et mention en marge
- **Une phrase** : un assujetti au gel des avoirs hors banque (agence immobilière, cabinet comptable) tient un registre où chaque client reçoit un acte de contrôle daté, puis une mention en marge à chaque publication de la liste qui le touche.
- **Mécanique transférée** : l'état civil (l'acte de naissance n'est jamais réécrit, les événements ultérieurs s'ajoutent en marge) mêlé au dossier du juge (pièces numérotées, trace conservée même quand rien n'est trouvé). À chaque nouvelle version du fichier, l'agent rejoue le portefeuille, tranche les homonymes un par un avec les éléments d'identité (date et lieu de naissance, nationalité, activité) et rédige la motivation de non-correspondance. Une requête SQL floue sort une liste de candidats sans motiver la mise à l'écart ; une alerte n'écrit rien dans le registre. Pièce : extrait de registre par client, avec version de la liste, date, décision motivée et nom de la personne qui a validé.
- **Fondement** : ligne 34 : « obligation de résultat » (ACPR 2026) ; ligne 13 : « le Trésor exige de conserver les traces même infructueuses » ; ligne 15 : « les homonymes se tranchent un par un ».
- **Donnée et brique Aiven** : DG Trésor, JSON de 14 Mo, publication du 20/10 (testé). Kafka : une version de la liste = un événement, le diff est calculé en aval. OpenSearch : correspondance floue sur noms, alias, translittérations. PostgreSQL : registre append-only (actes et mentions), c'est la pièce.
- **Utilisateur à appeler demain soir** : le ou la dirigeant(e) d'une agence immobilière de quelques personnes, ou l'expert-comptable responsable LCB-FT d'un petit cabinet.
- **% LLM** : 22 %
- **Carte de rejet** : #6 et #2. Aucun témoignage d'assujetti et aucun outil TPE trouvé (ligne 85, inventaire des concurrents non fait) ; les outils de filtrage bancaires existent.

### L'appel d'offres qui manque
- **Une phrase** : une TPE qui vend à quelques collectivités apprend qu'un marché attendu ne sera pas publié cette année, et pourquoi, à partir de l'historique BOAMP de l'acheteur et des avenants DECP.
- **Mécanique transférée** : le médecin de famille (ce qui est normal pour CE patient) mêlé à la vigie de phare (le feu éteint est l'information). La base apprend le rythme de chaque acheteur par type d'achat ; quand la fenêtre habituelle passe sans avis, l'agent cherche l'explication dans le texte des avenants, prolongations, accords-cadres ou transferts à une intercommunalité, et conclut sur la date probable du prochain avis. Les veilleurs d'appels d'offres signalent ce qui existe ; aucune requête ne dit pourquoi une publication n'a pas eu lieu. Pièce : « note de situation de l'acheteur » (attendu, observé, explication avec les avis cités, prochaine fenêtre).
- **Fondement** : ligne 33 : veille « chronophage » (Klekoon, vendeur) et domaine saturé côté alertes ; ligne 14 : DECP « avec des périodes manquantes » (l'absence est donc ambiguë, l'agent doit le dire).
- **Donnée et brique Aiven** : BOAMP (ODS, 2 fois par jour, 410 avis le 21/10, testé) avec historique, DECP (fichier de 237 Mo). Kafka : flux des avis. ClickHouse : calendrier pluriannuel par acheteur et code CPV. OpenSearch : texte des avis d'attribution et des avenants. PostgreSQL : état attendu/observé par couple acheteur-objet.
- **Utilisateur à appeler demain soir** : le gérant d'une PME de signalisation, de nettoyage ou de fournitures qui répond aux marchés de trois à cinq communes.
- **% LLM** : 8 %
- **Carte de rejet** : #1 et #2. Le calendrier de l'acheteur se calcule en SQL, seule l'explication par les avenants demande l'agent ; Klekoon et marche-public.fr occupent le terrain de la veille.

### Pronostic daté, arrêtés sécheresse
- **Une phrase** : avant chaque restriction d'eau, l'agent publie un pronostic horodaté (quelle zone, quel niveau, quelle fenêtre de dates) à partir des niveaux de nappe et de rivière, puis se note sur les arrêtés réellement pris.
- **Mécanique transférée** : le pré-enregistrement des essais cliniques et la cote du bookmaker (on engage une probabilité avant le résultat, on en rend compte après). L'agent lit l'arrêté-cadre du département [?] pour en tirer l'indicateur et les seuils de chaque zone, projette le niveau de la nappe, et apprend le délai réel entre franchissement du seuil et arrêté préfectoral. Une alerte réagit après le fait ; une requête ne lit pas un texte réglementaire. Pièce : bulletin de pronostic signé avant l'événement, puis relevé de comptes (réussis, ratés, écart de délai) qui s'allonge à chaque exécution.
- **Fondement** : ligne 37 : « 10 arrêtés du 16/07 au 08/10/2026 en Loire-Atlantique » ; ligne 89 : « aucune boucle d'amélioration réelle chez les bricoleurs ».
- **Donnée et brique Aiven** : Hub'Eau piézométrie horaire et hydrométrie 5 min (sans clé), VigiEau quotidien (testé, sans clé). Kafka : mesures des stations. ClickHouse : historique des mêmes stations aux mêmes dates des années passées. Valkey : état courant par zone. PostgreSQL : registre des pronostics et de leurs résultats.
- **Utilisateur à appeler demain soir** : l'animateur ou l'animatrice d'un syndicat d'irrigants, ou le responsable environnement d'une carrière ou d'une laiterie classée ICPE.
- **% LLM** : 10 %
- **Carte de rejet** : #1 et #6. Un seuil et une tendance se passent de LLM ; la décision préfectorale est discrétionnaire ; aucun récit d'utilisateur professionnel de VigiEau (ligne 37) ; arrêtés-cadres à vérifier comme accessibles [?].

### Revue au ralenti d'un effacement
- **Une phrase** : une fact-checkeuse reçoit, pour un post Bluesky supprimé qui avait pris de l'ampleur, la séquence minute par minute (création, reprises, citations, suppression) avec le texte que l'événement de suppression ne contient pas.
- **Mécanique transférée** : l'arbitrage vidéo (revoir l'action au ralenti avant de trancher) combiné à la mémoire d'une source qui n'expose que le maintenant. L'agent trie les suppressions par ce qu'elles ont déclenché, reconstruit la cascade, la rapproche de l'événement GDELT de la même quinzaine de minutes, et rédige la séquence datée. Une alerte dit « un post a disparu », une requête SQL retrouve le texte ; ni l'une ni l'autre ne choisit les 5 cas qui comptent parmi les suppressions du jour ni ne raconte la cascade. Pièce : fiche de séquence datée, chaque ligne renvoyant à l'événement brut.
- **Fondement** : ligne 7 : l'AFP Fact Check ne voit rien d'aussi utile que CrowdTangle, fermé le 14/08/2024 ; ligne 12 : « un événement de suppression Jetstream ne contient ni texte ni date, il faut avoir stocké la création » ; ligne 39 : 35 créations et 2,2 suppressions de posts par seconde.
- **Donnée et brique Aiven** : Jetstream (sans authentification, testé), GDELT (15 min, testé), Wikimedia. Kafka : tampon du flux brut. Valkey : déduplication (doublons jusqu'à 24 h, ligne 14) et compteurs de cascade. ClickHouse : créations conservées 7 jours, jointure avec les suppressions. OpenSearch : rapprochement texte contre événements GDELT.
- **Utilisateur à appeler demain soir** : une journaliste du desk vérification d'une rédaction (AFP Fact Check, Les Surligneurs, desk Décodeurs).
- **% LLM** : 24 %
- **Carte de rejet** : #2 et #4. Politwoops et CongressEdits ont fait la suppression, BlueHoover a fait Bluesky sous ClickHouse ; Bluesky reste un public restreint pour les rédactions françaises (récit direct absent, ligne 86).

### Rappel rétroactif des repas servis
- **Une phrase** : une cuisine centrale ou une épicerie solidaire apprend, pour chaque rappel de produit, ce qui est déjà sorti de ses locaux dans la fenêtre de lots concernée, vers qui, et le texte à envoyer aux destinataires.
- **Mécanique transférée** : le contrôle qualité par échantillonnage d'usine, inversé en couverture totale et tourné vers le passé : on ne regarde pas ce qui va arriver, on contrôle tout ce qui est déjà parti. L'agent lit le texte libre du rappel (lots, plages de DLC, circuits de vente), rapproche les GTIN du registre du client, complète les produits sans code via Open Food Facts, et décide ce qui est dans la fenêtre. Une alerte arrive avant, une requête sur GTIN rate les lots et dates décrits en texte. Pièce : fiche de traçabilité descendante (produit, plage de lots, dates et quantités servies, destinataires, texte de prévenance à valider).
- **Fondement** : ligne 31 : « œufs rappelés distribués par les Restos du cœur » (Le Monde) ; 304 rappels en 30 jours, fiche du 21/10.
- **Donnée et brique Aiven** : RappelConso V2 (ODS sans clé, fiche du 21/10 14:56 UTC) + Open Food Facts (1 275 763 produits France, testé). Kafka : nouveaux rappels. OpenSearch : texte libre et jointure floue par nom de produit. PostgreSQL : registre des sorties du client et résultats de rapprochement.
- **Utilisateur à appeler demain soir** : le ou la responsable qualité d'une cuisine centrale de collectivité (1 000 repas par jour et plus), ou le coordinateur d'une épicerie solidaire.
- **% LLM** : 12 %
- **Carte de rejet** : #3. Il faut le registre des sorties du client, donnée privée (question 7, ligne 60) ; côté pro aucun témoignage (ligne 31). Alerte-Conso et NetAlerts occupent le grand public.

### Partie double marchés et défaillances
- **Une phrase** : la direction de la commande publique d'une ville voit chaque marché en cours en regard de la situation de son titulaire, avec les cas où aucune contrepartie n'a pu être trouvée.
- **Mécanique transférée** : la comptabilité en partie double (chaque écriture a sa contrepartie, la balance ne tient que si tout est rapproché). Une écriture est un marché (DECP, côté acheteur), l'autre est la situation du titulaire (BODACC, avec la qualification de la procédure lue dans le jugement). Les annonces sans SIREN ou avec deux écritures sont rapprochées par l'agent, qui indique ce que chaque procédure change pour le contrat. Les surveillances de défaillance prennent le point de vue du créancier ; une requête SQL perd les 7,5 % sans SIREN. Pièce : balance des marchés (ligne = marché, titulaire, statut, effet probable sur le contrat, case « contrepartie introuvable » en rouge avec les pièces).
- **Fondement** : ligne 14 : « BODACC avec SIREN en deux écritures et 7,5 % des procédures collectives sans SIREN » ; ligne 32 : 68 414 redressements et liquidations en 2025 (Altares).
- **Donnée et brique Aiven** : DECP (237 Mo, sans clé) + BODACC (51 132 086 annonces, ODS, testé) + recherche-entreprises (sans clé, testé). Kafka : annonces BODACC quotidiennes. ClickHouse : jointure marchés × historique de procédures. OpenSearch : appariement flou nom/adresse sans SIREN. Valkey : cache recherche-entreprises (Sirene complet limité à 30 requêtes par minute). PostgreSQL : balance.
- **Utilisateur à appeler demain soir** : le directeur ou la directrice de la commande publique d'une ville moyenne ou d'une intercommunalité.
- **% LLM** : 17 %
- **Carte de rejet** : #2 et #1. Pappers, AlertBodacc et Altares couvrent la surveillance côté créancier ; le rapprochement par SIREN se règle en SQL sauf pour les cas sales, d'où le test à faire sur combien de cas le font échouer.

## Remarque
Idées sous 20 % : constat d'huissier (18), appel d'offres qui manque (8), pronostic daté (10), rappel rétroactif (12), partie double (17). Les plus fortes contre la carte sont « appel d'offres qui manque » (données ouvertes testées, utilisateur trouvable, rien d'équivalent vu) et « partie double » (tout vient de sources ouvertes). Les plus fragiles sont « rappel rétroactif » (donnée privée) et « acte et mention en marge » (aucun témoin).
