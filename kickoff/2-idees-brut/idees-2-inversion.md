# Idées 2 : Inversion (21 oct. 2026)

Angle : chaque situation de la fiche vue du côté de celui qui a intérêt à ce que la donnée se taise, reste au « maintenant » ou soit mal lue. Sources : uniquement `0-cadrage.md` et `1-terrain.md`. Les `[?]` sont des points non vérifiés, à tester avant de s'engager.

### Survols de nuit : le dossier opposable
- **Une phrase** : l'association de riverains d'Orly reçoit, pour chaque mouvement de nuit, un dossier qui contient la trace ADS-B, l'exploitant du vol, et la réponse d'avance à ce que la compagnie plaidera.
- **Mécanique centrale** : l'agent joue la défense de la compagnie avant qu'elle ne parle. Il écarte ce qui est légitime (code d'urgence 7700, vol d'État ou sanitaire, déroutement) et retient le reste. Pièce : une fiche par infraction probable avec horodatages, altitude, trace, historique de récidive de l'exploitant, et la liste des excuses écartées avec la raison. Une alerte dit « un avion vole » ; ceci produit le constat que l'association peut déposer.
- **Fondement** : fiche, « Riverains d'Orly et CDG » : VITRAIL affiche le trafic avec 30 min de retard et 60 jours d'historique, et une association relève à la main les survols pendant le couvre-feu. ADS-B ouvert en temps réel (adsb.lol, OpenSky).
- **Donnée et brique Aiven** : ADS-B adsb.lol sur une boîte géographique autour d'Orly, immatriculation vers exploitant par table ICAO ouverte. Kafka : flux des positions. Valkey : état courant de chaque appareil et dédoublonnage. ClickHouse : toutes les traces, donc récidive par exploitant sur des semaines. Postgres : dossiers et décisions de l'association (rejeté, déposé), qui affinent les exclusions.
- **Utilisateur à appeler demain soir** : le ou la responsable (bénévole) d'une association de riverains d'Orly ou de CDG.
- **% LLM** : 25 %. L'idée « historique des survols » est dans la fiche comme trou ; la version « défense anticipée de la compagnie » est plus rare.
- **Carte de rejet** : point 3 : la liste des dérogations officielles de nuit est-elle publique `[?]` ; sans elle, l'agent ne peut écarter que les cas visibles dans le signal (7700, vols d'État).

### Suppressions suivies d'un repost corrigé
- **Une phrase** : une cellule de vérification de rédaction reçoit les cas où un élu ou un média supprime un message puis le republie avec un chiffre ou une promesse changés.
- **Mécanique centrale** : Bluesky n'a pas de bouton « modifier » ; corriger sans le dire passe donc par supprimer puis reposter. L'agent a stocké le message avant sa disparition, repère la republication proche, compare les deux textes, et décide si la suppression est matérielle (chiffre, engagement, accusation) ou banale (faute de frappe, réponse, doublon). Pièce : une fiche « avant / après » datée, avec durée de vie du message, interactions au moment de la suppression, et verdict motivé. La requête SQL liste les suppressions ; elle ne lit pas ce qui a changé.
- **Fondement** : fiche, enjeu 1 : Jetstream Bluesky en temps réel, « les suppressions sont observables » ; trous confirmés : « Politwoops sur Bluesky » ; modèle Bellingcat Auto Archiver (capter avant disparition, 150 000 pages préservées).
- **Donnée et brique Aiven** : Jetstream, filtré sur une liste de comptes (élus, ministères, médias, grandes marques françaises). Les événements de suppression ne portent pas le texte : il faut avoir gardé la création. Kafka : flux Jetstream. ClickHouse : tout le texte capté, requêtes de proximité entre une suppression et les messages qui suivent. Postgres : fiches validées par le journaliste. OpenSearch : recherche de textes proches pour retrouver le repost.
- **Utilisateur à appeler demain soir** : un ou une journaliste de cellule de vérification (type AFP Factuel, CheckNews).
- **% LLM** : 15 % pour la version « repost corrigé + matérialité » ; la version « Politwoops pour Bluesky » seule serait à 30 %.
- **Carte de rejet** : point 4 : le public français de Bluesky est petit et les suppressions intéressantes sont rares ; la démo dépend de trouver un vrai cas ou de le rejouer sur de la donnée captée à l'avance.

### Rappel limité : les frères non rappelés
- **Une phrase** : le responsable qualité d'une cuisine centrale ou d'une épicerie solidaire apprend quels produits non rappelés sortent du même site de production qu'un produit rappelé.
- **Mécanique centrale** : le producteur déclare un périmètre de rappel (lots, marque) et il a intérêt à ce qu'il soit étroit. L'agent extrait le site de production (marque de salubrité), retrouve tous les produits connus du même site sous d'autres marques de distributeur, croise avec l'historique d'inspections du site, et rend une décision par lot reçu : retirer, garder, appeler le fournisseur. Pièce : une fiche de décision motivée, citant la fiche RappelConso et la ligne d'inspection. Une alerte consommateur ne traite que le produit rappelé.
- **Fondement** : fiche, enjeu 1 : RappelConso V2 avec code-barres, fiche du jour ; Alim'confiance ; trous confirmés : « rappels côté pro (cuisines centrales, épiceries solidaires) ».
- **Donnée et brique Aiven** : RappelConso V2 (historique complet), Alim'confiance (résultat d'inspection par établissement). Le site de production n'est peut-être pas un champ structuré `[?]` ; sinon l'agent l'extrait du texte libre. Postgres : lots reçus par l'utilisateur (bons de livraison simulés en démo) et décisions. OpenSearch : rapprochement flou de noms de produits et de marques. ClickHouse : récidive du producteur sur plusieurs années. Kafka seulement si on veut les fiches du jour en flux.
- **Utilisateur à appeler demain soir** : le ou la responsable qualité d'une cuisine centrale scolaire ou municipale.
- **% LLM** : 15 %. Les LLM proposent « alerte rappel pour particuliers » (déjà couvert par RappAlert, Alerte-Conso) ; le côté pro est dans la fiche, la logique du périmètre minimisé non.
- **Carte de rejet** : point 3 : la liste de ce que l'utilisateur a reçu est privée ; la démo repose sur des bons de livraison simulés, crédibles seulement si le responsable qualité de l'appel confirme leur format.

### Sociétés phénix dans les marchés publics
- **Une phrase** : un service achats public ou un responsable crédit apprend qu'une société nouvelle est la suite d'une société liquidée avec ses dettes, et si c'est légal.
- **Mécanique centrale** : le dirigeant indélicat liquide sa société, la recrée sous un autre numéro, même adresse, même activité. L'agent rapproche les liquidations et les créations du BODACC, puis tranche entre reprise validée par un jugement de cession (légale), homonyme, et recréation silencieuse. Pièce : une fiche de filiation datée (ancienne société, jugement, nouvelle société, numéros d'annonces), avec mention des marchés publics déjà gagnés par la nouvelle. Une jointure SQL trouve des paires ; elle ne distingue pas un plan de cession d'une fuite.
- **Fondement** : fiche, enjeu 1 : BODACC 51 M d'annonces le jour même, DECP en Parquet (237 Mo), BOAMP + TED. Veille BODACC existante (Pappers, AlertBodacc 49 €/mois, Altares) : elle prévient d'un événement par société, pas d'un lien entre deux sociétés.
- **Donnée et brique Aiven** : BODACC (procédures collectives, immatriculations), DECP. Les noms de dirigeants sont-ils dans les annonces de création `[?]` ; sinon on rapproche par adresse et activité. ClickHouse : jointures sur 51 M d'annonces. OpenSearch : adresses et noms approchés. Postgres : fiches et retour de l'utilisateur sur les faux liens. Kafka : annonces du jour pour tenir les fiches à jour.
- **Utilisateur à appeler demain soir** : un ou une acheteuse d'une mairie de 10 000 à 50 000 habitants, ou le responsable du recouvrement d'un grossiste.
- **% LLM** : 12 %.
- **Carte de rejet** : point 2 : Pappers montre déjà les autres mandats d'un dirigeant ; l'écart à défendre est que Pappers ne tranche pas entre cession judiciaire et recréation et ne produit pas de pièce.

### Gel des avoirs : preuve de ce qu'on a vérifié
- **Une phrase** : un cabinet d'expertise comptable ou une étude notariale obtient, à chaque publication du registre des gels, une attestation datée qui dit ce qui a été comparé à quoi et ce qui a été écarté pourquoi.
- **Mécanique centrale** : la partie adverse est le contrôleur qui arrive quatorze mois plus tard et demande « qu'avez-vous fait le 3 mars ? », et la personne gelée qui change d'orthographe (translittérations, alias) ou s'efface derrière une société. L'agent re-compare toute la base clients à chaque publication, juge chaque quasi-correspondance (homonyme écarté, date de naissance incompatible, alias probable) avec la ligne du registre à l'appui, et signe un journal chaîné. Pièce : l'attestation, y compris les jours « aucun résultat », que la fiche dit obligatoires.
- **Fondement** : fiche, « Assujettis au gel des avoirs hors banques » : obligation de résultat, vérification « sans délai » à chaque publication, traces à conserver même sans résultat, « exact match » jugé insuffisant par l'ACPR ; registre mis à jour le 20/10/2026 ; aucun outil abordable pour TPE trouvé.
- **Donnée et brique Aiven** : registre des gels (JSON, 14 Mo). Postgres : base clients (jeu simulé), journal en ajout seul et chaînage. OpenSearch : correspondance phonétique et floue avec alias. L'actionnariat des clients est en grande partie fermé `[?]` : la démo le prend dans un fichier fourni. Pas de Kafka ni de ClickHouse nécessaires.
- **Utilisateur à appeler demain soir** : le ou la responsable conformité d'un cabinet d'expertise comptable, ou un clerc de notaire chargé de la lutte antiblanchiment.
- **% LLM** : 30 %. Le trou est dans la fiche ; la partie « défense face au contrôleur » et la translittération sont moins fréquentes, mais pas sous 20 %.
- **Carte de rejet** : point 6 : la fiche ne trouve aucun témoignage d'assujetti `[?]` ; l'appel de demain soir est le vrai test.

### Fractionnement : marchés sans publicité
- **Une phrase** : un élu d'opposition reçoit la liste des marchés d'une commune qui ont été découpés pour passer sous un seuil ou signés sans avis publié, avec le texte qui l'interdit.
- **Mécanique centrale** : l'acheteur a intérêt à rester sous le seuil de procédure. L'agent regroupe les marchés d'un même acheteur, même nature, même période, juge si la série forme un seul besoin, calcule le montant cumulé contre le seuil applicable à la date (à vérifier pour 2026 `[?]`), et vérifie qu'un avis a bien paru. Pièce : une note de signalement qui cite la ligne DECP de chaque marché, l'article de seuil et le cumul. La veille BOAMP existante cherche des marchés à gagner ; celle-ci cherche ceux qui n'ont pas eu d'avis.
- **Fondement** : fiche, enjeu 1 : DECP (Parquet 237 Mo), BOAMP + TED ; veille BOAMP couverte (Klekoon, Marchey, WeWinBid) ; trous : « délibérations municipales croisées marchés et BODACC ». Enjeu 3 : calcul chiffré déterministe et chaque sortie qui cite sa ligne.
- **Donnée et brique Aiven** : DECP, BOAMP. ClickHouse : séries par acheteur, code CPV et mois. OpenSearch : rapprochement entre l'objet d'un marché (DECP) et les avis (BOAMP). Postgres : verdicts de l'élu, qui règlent la sévérité du regroupement. Kafka : nouveaux avis du jour.
- **Utilisateur à appeler demain soir** : un ou une conseillère municipale d'opposition, ou un journaliste local de données.
- **% LLM** : 22 %.
- **Carte de rejet** : point 2 : des indicateurs de risque sur marchés publics existent déjà (Opentender, travaux de la Cour des comptes `[?]`) ; il faut que la pièce signalée soit déposable et pas seulement un score.

### Eau : analyses qui n'ont pas eu lieu
- **Une phrase** : la secrétaire de mairie d'une petite commune sait quelles analyses PFAS manquent depuis janvier 2026 sur son réseau, et lesquelles n'ont rien pu détecter.
- **Mécanique centrale** : le résumé annuel « eau conforme » se tait sur ce qui n'a pas été mesuré. L'agent compare, pour chaque unité de distribution, le calendrier d'analyses attendu par la réglementation à ce qui a été publié, et repère les résultats « non quantifié » dont la limite de quantification dépasse le seuil, donc incapables de rien voir. Pièce : un courrier motivé à l'ARS avec les unités, les dates, les paramètres et le texte applicable. Un `COUNT` trouve les zéros ; le calendrier attendu dépend de la population desservie et il faut le lire dans l'arrêté.
- **Fondement** : fiche, « Communes rurales et eau potable » : 637 000 consommateurs desservis par une eau non conforme en 2025, 72 unités de distribution, 90 % pesticides (IGF, mai 2026) ; 20 PFAS contrôlés depuis janvier 2026 ; Hub'Eau ouvert et frais.
- **Donnée et brique Aiven** : Hub'Eau (qualité de l'eau potable, résultats par unité). La limite de quantification est-elle dans les champs `[?]` ; la population desservie par unité est dans un autre référentiel `[?]`. ClickHouse : tous les résultats depuis 2026 et leurs historiques. Postgres : courriers envoyés et réponses de l'ARS (mémoire). Valkey : cache des appels. Kafka non nécessaire.
- **Utilisateur à appeler demain soir** : un ou une secrétaire de mairie, ou le président d'un syndicat des eaux d'une commune rurale.
- **% LLM** : 10 %.
- **Carte de rejet** : point 1 : une requête de comptage suffit pour les zéros ; l'agent doit justifier sa place par la lecture du calendrier réglementaire et par la rédaction du courrier, ce qu'il faut démontrer.

### DPE refaits jusqu'à la bonne lettre
- **Une phrase** : un ou une juriste d'ADIL reçoit, pour un logement loué ou à vendre, la chronologie de ses diagnostics et ce qui a changé dans la saisie entre une classe F et une classe D.
- **Mécanique centrale** : le bailleur ou le vendeur a intérêt à relancer un diagnostic jusqu'à sortir de la passoire énergétique. L'agent isole les diagnostics d'un même logement (même immeuble, surface proche), décide si c'est bien le même, et nomme les champs saisis qui ont bougé (chauffage, surface, isolation, année) sans travaux qui l'expliquent. Pièce : une chronologie datée du logement et une note d'écart, avec les numéros de DPE. Une alerte DPE prévient d'un nouveau diagnostic ; elle ne compare pas deux saisies.
- **Fondement** : fiche, enjeu 1 : DPE ADEME, 15,8 M de lignes ; veille DPE couverte (alerte-dpe) ; mécanique rare « séquence d'événements reconstruite en récit daté » (~25 %).
- **Donnée et brique Aiven** : DPE ADEME. Le champ « DPE remplacé » et l'identité du diagnostiqueur sont-ils ouverts `[?]` ; sinon on part de l'adresse et de la surface. ClickHouse : 15,8 M de lignes, regroupement par immeuble. OpenSearch : adresses approchées. Postgres : dossiers et verdicts de la juriste. Pas de Kafka.
- **Utilisateur à appeler demain soir** : un ou une juriste d'ADIL (conseil aux locataires et aux propriétaires).
- **% LLM** : 12 %.
- **Carte de rejet** : point 3 et risque d'erreur 1 fois sur 10 : plusieurs logements d'un même immeuble ont des DPE légitimement différents ; la juriste est le filet, mais la démo doit montrer un vrai cas trouvé, pas seulement la mécanique.

---
Sous 20 % : Suppressions + repost (15 %), Rappel limité (15 %), Sociétés phénix (12 %), Eau (10 %), DPE (12 %). Soit 5 idées sur 8.
