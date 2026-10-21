# Idées 1 : Adopter → Adapter → Scaler

Lecture : 7 idées. Sous 20 % de chance qu'un autre LLM les propose : B (15), F (10), G (12). Les pourcentages sont des estimations, pas des mesures. Les points `[?]` sont à vérifier avant de s'y engager.

### A. Gel des avoirs, dossier opposable
- **Une phrase** : Le référent conformité d'une étude notariale ou d'une agence immobilière dépose son fichier clients (noms, dirigeants, associés), et à chaque publication du registre des gels l'agent revérifie tout le fichier. Donnée : registre national des gels (JSON 14 Mo, dernière publication 20/10/2026) ; l'actionnariat vient du fichier client, simulé pour la démo.
- **Mécanique centrale** : pour chaque quasi-correspondance (translittération, ordre des noms, date de naissance partielle, alias), l'agent tranche « homonyme écarté », « correspondance probable » ou « à geler et déclarer », en citant les champs du registre qui fondent le verdict. Pièce produite : une fiche de vérification horodatée, conservée même sans résultat (c'est l'obligation de trace). Une requête SQL propose des candidats ; elle ne motive pas le rejet d'un homonyme.
- **Fondement** : fiche, « Assujettis au gel des avoirs » : « obligation de résultat, vérification "sans délai" de chaque client et de son actionnariat à chaque publication, traces à conserver même sans résultat, "exact match" jugé insuffisant par l'ACPR ». Réponse adoptée : CrossBeam, dossier réglementaire lu contre des règles, sortie actionnable, « plan d'action en 20 min ».
- **Donnée et brique Aiven** : registre des gels.
  - Kafka : un événement par publication du registre, qui déclenche le re-criblage du portefeuille.
  - OpenSearch : génération de candidats (phonétique, alias, translittération) sur noms et alias.
  - Postgres : piste d'audit (version du registre, verdict, motif, validation humaine).
- **Utilisateur à appeler demain soir** : référent conformité LCB-FT / gel des avoirs d'une étude notariale, ou responsable conformité d'un cabinet d'expertise comptable.
- **% LLM** : 30 %
- **Carte de rejet** : point 6, la fiche n'a trouvé aucun témoignage d'assujetti `[?]` ; sans une personne à appeler, l'idée tombe.

### B. Survols nocturnes, dossier de manquement
- **Une phrase** : Une association de riverains d'Orly reçoit chaque matin le dossier des vols passés pendant le couvre-feu, relevés en ADS-B et déjà classés « exempté » ou « à signaler ». Donnée : ADS-B ouvert en temps réel (adsb.lol, OpenSky).
- **Mécanique centrale** : l'agent reconstruit la trajectoire de chaque avion nocturne, détermine la commune survolée et l'altitude, écarte les vols qui relèvent d'une dérogation (règles d'exemption fournies par l'association, `[?]` à confirmer), et écrit une page par manquement avec heures, trajectoire et lien vers les positions brutes. Pièce : le dossier mensuel prêt à adresser à l'autorité compétente.
- **Fondement** : fiche, « Riverains d'Orly et CDG » : « VITRAIL affiche le trafic avec 30 min de retard et 60 jours d'historique ; une association relève à la main les survols pendant le couvre-feu ». Réponses adoptées : Vigil (couverture totale d'un contrôle que l'humain ne fait qu'en échantillon) et Bellingcat Auto Archiver (la source ne garde rien, la valeur est ce qu'on a gardé).
- **Donnée et brique Aiven** : positions ADS-B.
  - Kafka : ingestion continue des positions.
  - ClickHouse : trajectoires conservées sur des mois, requêtes spatio-temporelles par commune ; c'est l'historique que l'outil officiel n'offre pas.
  - Postgres : dossiers et décisions de l'association (ce qu'elle rejette réajuste le classement).
- **Utilisateur à appeler demain soir** : le bénévole chargé des relevés d'une association de riverains d'Orly (ou de CDG).
- **% LLM** : 15 %
- **Carte de rejet** : point 1, retirer l'agent et garder une requête géospatiale ClickHouse sur la plage horaire donne déjà la liste ; l'agent ne se justifie que par le classement des exemptions et la rédaction.

### C. Posts d'élus effacés, documentés
- **Une phrase** : Un journaliste de la cellule de vérification d'une rédaction reçoit, pour chaque post supprimé par un élu français, le texte d'origine, le délai avant suppression et ce qui l'a remplacé. Donnée : Jetstream Bluesky, sur une liste de comptes d'élus à constituer demain matin (taille à tester `[?]`).
- **Mécanique centrale** : l'événement de suppression ne porte aucun contenu, donc tout dépend d'avoir gardé la création. L'agent distingue une correction (repost quasi identique dans les minutes qui suivent) d'un retrait sans remplacement après une montée des réponses et citations, puis rédige la séquence datée avec liens vers les enregistrements d'origine. Pièce : la fiche de suppression. Les verdicts du journaliste alimentent les exemples donnés à l'agent à l'exécution suivante.
- **Fondement** : fiche, « Trous confirmés » : « Politwoops sur Bluesky » ; enjeu 1 : « Jetstream Bluesky (temps réel, les suppressions sont observables) ». Réponse adoptée : Bellingcat Auto Archiver, « capter avant disparition, humain au centre ».
- **Donnée et brique Aiven** : Jetstream Bluesky.
  - Kafka : flux entrant des événements.
  - Valkey : table de jointure création → suppression (clé = identifiant du post), pour résoudre une suppression en quelques millisecondes.
  - ClickHouse : posts et interactions des comptes suivis, pour mesurer l'engagement avant suppression.
  - Postgres : fiches et verdicts du journaliste.
- **Utilisateur à appeler demain soir** : journaliste ou responsable de la cellule de vérification d'un desk politique.
- **% LLM** : 25 %
- **Carte de rejet** : point 4, peu d'élus français sont sur Bluesky `[?]` et le seuil de bruit n'est pas testé ; le risque est de finir en « dashboard + alerte ».

### D. Rappels croisés au stock cuisine
- **Une phrase** : Le responsable achats d'une cuisine centrale scolaire reçoit, pour chaque rappel du jour, la liste des lots présents dans ses écoles et le courrier de retrait prêt à envoyer. Donnée : RappelConso V2 (fiche du jour, code-barres) et Alim'confiance ; bons de livraison simulés pour la démo.
- **Mécanique centrale** : l'agent rapproche le libellé d'un rappel (marque, lots, DLC, code-barres) de désignations de fournisseur en texte libre (« SAUC VOL 2KG »), tranche « concerné », « non concerné » ou « à vérifier sur place » par site, rédige les consignes de retrait et tient le registre des retraits. Alim'confiance sert à signaler un fournisseur à l'historique d'inspection dégradé. Pièce : le registre des retraits, présentable à un contrôle.
- **Fondement** : fiche, « Trous confirmés » : « rappels côté pro (cuisines centrales, épiceries solidaires) » ; couverture existante limitée au « côté particulier (Alerte-Conso, NetAlerts, RappAlert) ». Réponses adoptées : CrossBeam (sortie actionnable) et Auto Archiver (tableur comme interface).
- **Donnée et brique Aiven** : RappelConso V2 + Alim'confiance.
  - Kafka : nouvelles fiches de rappel dans la journée.
  - OpenSearch : recherche plein texte et approximative des désignations et codes-barres dans les bons de livraison.
  - Postgres : registre des retraits, piste d'audit, et table des correspondances validées (désignation fournisseur → produit) que personne d'autre n'accumule.
- **Utilisateur à appeler demain soir** : responsable achats ou qualité d'une cuisine centrale de collectivité, ou responsable logistique d'une épicerie solidaire.
- **% LLM** : 20 %
- **Carte de rejet** : point 3, les stocks réels sont privés et la démo repose sur des données simulées qui doivent rester crédibles ; second risque, point 7 (« extension qui alerte ») si la démo s'arrête à la notification.

### E. Créance à déclarer, délai calculé
- **Une phrase** : Le credit manager d'une PME voit l'un de ses clients entrer en procédure collective au BODACC et reçoit la déclaration de créance préremplie, avec la date limite calculée. Donnée : BODACC (51 M d'annonces, le jour même) ; le grand livre clients est simulé.
- **Mécanique centrale** : l'agent lit le texte du jugement (type de procédure, tribunal, mandataire, adresse de déclaration), consulte les annonces antérieures du même SIREN (un plan précédent change la voie de déclaration), croise les factures impayées, calcule la date limite à partir de la publication (règle de délai à valider par un juriste avant la démo `[?]`) et rédige le courrier au mandataire avec la liste des pièces. Pièce : le courrier de déclaration. Les annonces sans effet sur la créance sont écartées.
- **Fondement** : fiche, mécanique rare « texte réglementé → événement structuré → fiche historique de l'entité (~30 %) » ; veille BODACC existante limitée à l'alerte (Pappers, AlertBodacc 49 €/mois, Altares, Ellisphere). Réponse adoptée : CrossBeam (lettres de correction, plan d'action en 20 min).
- **Donnée et brique Aiven** : BODACC.
  - Kafka : annonces du jour en flux.
  - ClickHouse : historique des 51 M d'annonces pour reconstituer la fiche de chaque entité.
  - Postgres : portefeuille clients, échéances, brouillons et courriers envoyés.
- **Utilisateur à appeler demain soir** : responsable recouvrement (credit manager) d'une PME de négoce ou de BTP, ou collaborateur d'un cabinet d'expertise comptable chargé du suivi des clients en difficulté.
- **% LLM** : 22 %
- **Carte de rejet** : point 2, quatre éditeurs surveillent déjà le BODACC ; aucun n'a été vérifié sur la rédaction de la déclaration `[?]`. Point 1 aussi : la jointure par SIREN est du SQL, seule la lecture du texte et la rédaction justifient l'agent.

### F. Chronique datée d'un marché public
- **Une phrase** : Un collaborateur de groupe d'opposition au conseil municipal choisit un marché de sa ville et reçoit sa chronologie (avis, rectificatifs, déclarations sans suite, attribution, avenants, sort du titulaire) avec la question écrite prête pour le conseil. Donnée : BOAMP + TED (avis) et DECP (Parquet 237 Mo), croisés avec le BODACC par SIREN du titulaire.
- **Mécanique centrale** : les avis d'un même marché ne partagent pas de clé propre ; l'agent les rapproche par objet, acheteur et lot, reconstruit l'histoire, relève ce qui sort de l'ordinaire (marché relancé après une déclaration sans suite, titulaire placé en procédure collective quelques mois après l'attribution) et cite chaque ligne source. Pièce : la chronique et la question écrite. Après 100 chroniques, la base contient des profils de comportement par acheteur.
- **Fondement** : fiche, mécaniques rares : « séquence d'événements reconstruite en récit daté (~25 %) » ; trou confirmé : « délibérations municipales croisées marchés et BODACC ». Réponses adoptées : Vigil (couverture totale là où l'humain échantillonne) et Auto Archiver (humain au centre).
- **Donnée et brique Aiven** : BOAMP, TED, DECP, BODACC.
  - ClickHouse : DECP en Parquet natif et jointure sur 51 M d'annonces BODACC.
  - OpenSearch : rapprochement textuel des avis entre eux, y compris multilingue côté TED.
  - Postgres : chroniques, annotations de l'utilisateur, historique des profils d'acheteurs.
- **Utilisateur à appeler demain soir** : collaborateur d'un groupe d'opposition d'un conseil municipal ou départemental, ou journaliste local spécialisé dans les collectivités.
- **% LLM** : 10 %
- **Carte de rejet** : point 3, la qualité inégale des DECP et l'absence de clé de jointure fiable ne sont pas testées dans la fiche `[?]` ; une jointure qui ne tient pas fait s'effondrer la démo.

### G. Contre-expertise DPE par comparables
- **Une phrase** : Le gestionnaire locatif d'une agence dont un logement est classé G sur un DPE douteux reçoit un dossier de contestation chiffré, bâti sur les DPE voisins de même typologie. Donnée : DPE ADEME (15,8 M de lignes).
- **Mécanique centrale** : l'agent compare les données saisies dans le diagnostic contesté (isolation, chauffage, surface) à celles des diagnostics du même immeuble, de la même rue et de la même période, repère les champs qui divergent sans raison apparente et rédige la demande de nouveau diagnostic avec les lignes ADEME en pièces. Pièce : le dossier de contestation. Les statistiques de comparaison sont calculées par la base, l'agent ne fait que lire et argumenter.
- **Fondement** : fiche, enjeu 1 : « DPE ADEME (15,8 M de lignes) » ; l'existant se limite à l'alerte (alerte-dpe). Réponse adoptée : Vigil, contrôle de cohérence sur la totalité des diagnostics (l'absence de ce contrôle systématique n'est pas sourcée `[?]`).
- **Donnée et brique Aiven** : DPE ADEME.
  - ClickHouse : 15,8 M de lignes, requêtes de comparables par adresse, typologie et période.
  - Postgres : dossiers et issues (le diagnostiqueur a-t-il rectifié ?), ce qui construit peu à peu une table des écarts qui aboutissent.
- **Utilisateur à appeler demain soir** : gestionnaire de biens en agence de gestion locative, ou propriétaire bailleur de plusieurs lots.
- **% LLM** : 12 %
- **Carte de rejet** : point 1, une requête de comparables suffit à repérer l'écart, et la finesse des champs de l'open data par logement n'est pas vérifiée `[?]`.
