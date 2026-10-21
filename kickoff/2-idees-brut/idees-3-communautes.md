# Angle 3 : le geste des communautés (8 idées)

Lecture : `0-cadrage.md` et `1-terrain.md` uniquement, pas de recherche web. `[?]` = non vérifié, à tester demain à 9h. Les % LLM sont des estimations, pas des mesures. Là où le geste manuel n'est pas dans la fiche, c'est écrit.

### Dossier de survols hors couvre-feu
- **Une phrase** : l'association de riverains d'Orly (ou de CDG) qui relève à la main les survols de nuit reçoit chaque matin le dossier des infractions probables de la veille, bâti sur l'ADS-B ouvert d'adsb.lol.
- **Mécanique centrale** : une requête géographique trouve les avions au-dessus de la commune pendant le couvre-feu (23h30–6h à Orly `[?]`) ; l'agent tranche ce qu'elle ne sait pas trancher : vol d'État ou sanitaire, déroutement, remise de gaz, retard toléré. Il produit un constat par survol : trace reconstruite, altitude au-dessus du quartier, exploitant, qualification motivée (infraction probable / exception plausible / indéterminé). Interface : une feuille partagée, une ligne par survol ; le bénévole coche « confirmé » ou « faux », et ces cases règlent ensuite la qualification (c'est la boucle d'amélioration).
- **Fondement** : fiche, couche « La douleur » : VITRAIL d'ADP affiche le trafic avec 30 min de retard et 60 jours d'historique, « une association relève à la main les survols pendant le couvre-feu » ; ADS-B ouvert en temps réel. Trou confirmé (ligne « Trous confirmés ») : « historique des survols ».
- **Donnée et brique Aiven** : adsb.lol (API ADS-B, sans compte) ; OpenSky en secours. Kafka : flux de positions. ClickHouse : toutes les traces conservées (volume élevé, requêtes géographiques et agrégats mensuels). Postgres : constats, décisions des bénévoles, piste d'audit.
- **Utilisateur à appeler demain soir** : le ou la bénévole qui tient le relevé nocturne dans une association de riverains d'Orly ou de Roissy.
- **% LLM** : 40 % (la fiche la sert sur un plateau à tous les agents).
- **Carte de rejet** : point 4 : la démo se joue de nuit, il faudra rejouer la nuit précédente ; et le couvre-feu et ses dérogations exactes restent à vérifier.

### Fiche des posts d'élus supprimés
- **Une phrase** : une cellule politique ou de vérification d'une rédaction reçoit, pour une liste de quelques centaines de comptes d'élus et de porte-parole, la fiche de chaque post Bluesky supprimé, reconstruite à partir de Jetstream.
- **Mécanique centrale** : Jetstream n'émet à la suppression que des identifiants ; le texte n'existe plus nulle part sauf dans notre base, qui l'a gardé avant. L'agent lit le contexte conservé (réponses, citations des minutes précédentes, repost corrigé juste après) et classe la suppression : coquille, retrait après polémique, volte-face. La pièce : une ligne de feuille avec le texte disparu, sa durée de vie, ce qui l'entourait, le type de suppression. Le journaliste marque « à creuser / sans intérêt » ; ces marques affinent le tri.
- **Fondement** : fiche : les suppressions sont observables sur Jetstream (ligne « Les 5 enjeux », 1) ; trou confirmé « Politwoops sur Bluesky » ; mécanique rare « mémoire d'une source qui n'expose que le maintenant » (~25 %) ; Bellingcat Auto Archiver, « tableur comme interface ».
- **Donnée et brique Aiven** : Jetstream Bluesky (temps réel, sans compte). Kafka : tout le flux, filtré sur la liste des comptes suivis et sur les citations qui les visent. Postgres : posts conservés, fiches, marques du journaliste. OpenSearch : recherche plein texte dans l'archive des posts disparus.
- **Utilisateur à appeler demain soir** : un journaliste ou une journaliste d'une cellule de vérification (type CheckNews) qui suit la vie politique.
- **% LLM** : 25 %.
- **Carte de rejet** : point 4 : peu d'élus français sur Bluesky, donc peu de suppressions pendant la démo ; il faudra une rediffusion ou un jeu de comptes plus large.

### Rappel arrivé après la distribution
- **Une phrase** : le responsable d'une épicerie solidaire ou d'une antenne de banque alimentaire, qui note lots entrants et sorties dans un tableur, apprend dès la publication d'un rappel RappelConso quels de ses produits sont concernés et lesquels sont déjà partis chez des foyers.
- **Mécanique centrale** : le rapprochement par code-barres est du SQL ; ce qui ne l'est pas, c'est le texte libre des rappels (plages de lots, DLC « avant le… », conditionnements) lu contre chaque ligne de stock, et surtout la mémoire des sorties. L'agent produit la pièce que le bénévole n'a pas le temps de faire : liste des foyers à prévenir (date de distribution, référent), fiche de retrait, extrait de registre de traçabilité. Interface : une colonne ajoutée dans la feuille d'inventaire existante.
- **Fondement** : fiche : trou confirmé « rappels côté pro (cuisines centrales, épiceries solidaires) » ; RappelConso V2 avec code-barres, fiche du jour ; les éditeurs existants (Alerte-Conso, NetAlerts, RappAlert) visent le particulier. Le geste manuel de ces bénévoles n'est pas décrit dans la fiche `[?]`.
- **Donnée et brique Aiven** : RappelConso V2 (data.economie.gouv.fr, ouvert). Kafka : nouvelles fiches de rappel. Postgres : inventaire, sorties par foyer, piste d'audit. OpenSearch : rapprochement approximatif quand le bénévole a saisi « yaourt nature x8 » sans code-barres.
- **Utilisateur à appeler demain soir** : un ou une coordinateur·rice d'épicerie solidaire (réseau ANDES) ou le responsable d'une antenne de banque alimentaire.
- **% LLM** : 15 %.
- **Carte de rejet** : point 3 : l'inventaire est privé, donc simulé en démo ; seule la donnée de rappel est réelle, et le jury verra un stock fictif.

### Sociétés phénix dans les marchés
- **Une phrase** : le responsable recouvrement d'un sous-traitant du BTP, ou un acheteur public, reçoit le dossier qui relie une société fraîchement immatriculée ou attributaire d'un marché à une société liquidée avec la même adresse ou le même dirigeant.
- **Mécanique centrale** : à chaque nouvelle annonce BODACC ou attribution DECP, l'agent cherche dans l'historique des liquidations les candidats voisins (nom, adresse, activité) et juge : reprise déguisée ou homonymie. Pièce : un dossier de rapprochement qui cite chaque annonce (numéro, date) et la ligne DECP, avec le niveau de confiance. Les décisions « confirmé / faux » du demandeur s'accumulent dans une table de précédents.
- **Fondement** : fiche : BODACC (51 M d'annonces, le jour même) et DECP (Parquet 237 Mo) ouverts ; les éditeurs de veille BODACC (Pappers, AlertBodacc 49 €/mois, Altares, Ellisphere) alertent sans relier ; trou confirmé « délibérations municipales croisées marchés et BODACC ». Mécanique « texte réglementé → événement structuré → fiche historique de l'entité » (~30 %).
- **Donnée et brique Aiven** : BODACC (API ouverte), DECP (Parquet). ClickHouse : 51 M d'annonces jointes aux marchés. OpenSearch : génération des candidats par proximité de noms et d'adresses. Postgres : dossiers et précédents. Kafka : flux quotidien BODACC.
- **Utilisateur à appeler demain soir** : un credit manager de grossiste ou de sous-traitant du bâtiment, ou le responsable de la commande publique d'une commune.
- **% LLM** : 9 %.
- **Carte de rejet** : point 3 : les annonces de création ne publient pas toujours le dirigeant `[?]` ; le rapprochement ne tiendrait alors qu'au nom et à l'adresse. Point 2 aussi : Pappers affiche déjà des liens entre dirigeants.

### Analyses d'eau jamais faites
- **Une phrase** : le maire d'une petite commune ou un collectif de riverains reçoit la liste des analyses réglementaires (dont les 20 PFAS) qui auraient dû paraître pour leur réseau et qui n'y sont pas, avec le courrier de demande à l'ARS.
- **Mécanique centrale** : la source ne dit rien de ce qui manque. L'agent lit les règles de fréquence (qui dépendent de la taille de l'unité de distribution), calcule ce qui était attendu, trouve le silence et distingue l'absence légitime (fréquence plus basse, résultat pas encore publié) de la carence. Il garde la date à laquelle chaque résultat est apparu, donc le retard de publication lui-même devient une donnée. Pièce : relevé de carences daté + courrier-type.
- **Fondement** : fiche : 637 000 consommateurs desservis par une eau non conforme en 2025 (IGF, mai 2026), 20 PFAS contrôlés depuis janvier 2026, Hub'Eau ouvert et frais ; mécanique rare « disparition ou silence d'une source » (~10 %).
- **Donnée et brique Aiven** : Hub'Eau, qualité de l'eau potable (API ouverte, rafraîchie en continu). Kafka : résultats au fil de l'eau. ClickHouse : historique national des analyses, attendu contre réalisé par unité de distribution. Postgres : règles, dossiers, dates d'apparition des résultats.
- **Utilisateur à appeler demain soir** : un ou une secrétaire de mairie ou maire d'une commune de moins de 2 000 habitants, ou la présidente d'une association de défense de l'eau.
- **% LLM** : 12 %.
- **Carte de rejet** : point 1 : une fois les règles codées, attendu contre réalisé est du SQL ; l'agent ne se justifie que par la lecture des règles et des exceptions, et la population desservie n'est peut-être pas dans Hub'Eau `[?]`.

### Retraits sourcés sur Wikipédia
- **Une phrase** : un patrouilleur ou une patrouilleuse de Wikipédia en français reçoit les modifications qui suppriment une critique sourcée sur la page d'une entreprise ou d'un élu, avec la note argumentée à coller en page de discussion.
- **Mécanique centrale** : les outils de patrouille repèrent le vandalisme ; ici l'agent lit la différence entre deux versions, identifie la référence retirée, vérifie depuis combien de versions l'affirmation tenait et si elle a été discutée, puis classe : nettoyage légitime, blanchiment probable, litige de neutralité. Pièce : une note qui cite les identifiants de révision. Postgres garde le dossier de chaque compte et de chaque page suivie.
- **Fondement** : fiche, enjeu 2 : « le trou est dans la décision, pas dans l'alerte » (liste de surveillance × flux qui prévient). Le geste des patrouilleurs n'est pas dans la fiche `[?]`.
- **Donnée et brique Aiven** : Wikimedia EventStreams (recentchange, SSE ouvert sans compte) et API MediaWiki pour les versions. Kafka : flux des modifications de frwiki. Postgres : historique des pages suivies, notes, décisions du patrouilleur.
- **Utilisateur à appeler demain soir** : un contributeur patrouilleur de Wikipédia en français.
- **% LLM** : 10 %.
- **Carte de rejet** : point 4, et la route vers des premiers utilisateurs payants : communauté bénévole sans budget, « potentiel d'entreprise » faible.

### DPE refaits jusqu'à être meilleurs
- **Une phrase** : un juriste bénévole d'une permanence de locataires reçoit, pour l'adresse d'un logement classé F ou G, la chaîne des DPE successifs de l'immeuble et un courrier qui cite chaque numéro ADEME.
- **Mécanique centrale** : la base conserve les diagnostics remplacés, mais personne n'en présente la suite par adresse. L'agent compare les diagnostics : surface, chauffage et isolation déclarés, classe, validité, et dit si l'écart s'explique par des travaux plausibles ou reste inexpliqué. Pièce : dossier de conciliation ou mise en demeure, chaque affirmation renvoyant à une ligne de la base.
- **Fondement** : fiche : DPE ADEME, 15,8 M de lignes, ouvert ; la veille DPE existante (alerte-dpe) s'adresse aux acheteurs et investisseurs. Le geste manuel côté locataires n'est pas dans la fiche `[?]`.
- **Donnée et brique Aiven** : DPE ADEME (data.ademe.fr). ClickHouse : regroupement des 15,8 M de lignes par adresse. OpenSearch : appariement approximatif des adresses mal saisies. Postgres : dossiers et suites données.
- **Utilisateur à appeler demain soir** : un ou une juriste d'une ADIL, ou le bénévole de permanence d'une association de locataires.
- **% LLM** : 14 %.
- **Carte de rejet** : point 3 : le DPE ouvert n'identifie peut-être pas le logement à l'étage ou à la porte près `[?]` ; le « même logement » ne serait alors qu'un même immeuble.

### Fiche de repli par rupture
- **Une phrase** : le pharmacien titulaire reçoit, pour chaque spécialité qui passe en rupture ou en tension, la fiche qui dit quoi faire seul, quoi demander au prescripteur, et le message prêt à envoyer.
- **Mécanique centrale** : la source ne donne que l'état du jour ; une comparaison quotidienne des fichiers de la base publique des médicaments construit le journal daté des changements de statut. L'agent lit la conduite à tenir publiée par l'ANSM pour la molécule, aligne les substituts (même substance chez un autre laboratoire, autre dosage, autre forme) et sépare ce que le pharmacien peut faire seul de ce qui exige un médecin. Pièce : fiche de repli citant les codes CIS/CIP et le texte ANSM, validée par le pharmacien.
- **Fondement** : fiche : ~12 h par semaine et par pharmacie à chercher un médicament manquant, 81 % déclarent une perte financière (PGEU, 2025), 3 887 signalements à l'ANSM ; la liste ANSM est annuelle et les stocks des grossistes sont fermés.
- **Donnée et brique Aiven** : BDPM (fichiers téléchargeables, dont celui de disponibilité des spécialités `[?]`), textes de l'ANSM. Kafka : changements de statut issus du diff quotidien. Postgres : journal de statuts et fiches. OpenSearch : recherche dans les textes ANSM par substance.
- **Utilisateur à appeler demain soir** : un pharmacien titulaire d'officine, ou le préparateur chargé des commandes.
- **% LLM** : 35 %.
- **Carte de rejet** : point 1 : les substituts du même groupe générique sortent d'une jointure SQL ; l'agent ne se justifie que pour les alternatives hors groupe et le courrier au prescripteur. Les stocks étant fermés, la fiche ne dit pas où trouver la boîte.

## Sous 20 % : Rappel arrivé après la distribution (15), Sociétés phénix (9), Analyses d'eau jamais faites (12), Retraits sourcés sur Wikipédia (10), DPE refaits (14).
