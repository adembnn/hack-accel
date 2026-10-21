# Salve 3 : angle Inversion (celui qui perd de l'argent parce qu'il ne voit pas)

Cinq recherches web faites : date EUDR, historique ClinicalTrials.gov, API OpenSincera, données ouvertes RDW (voitures), puis chemin de l'historique ClinicalTrials.gov. Ce qui est confirmé est dit tel quel ; le reste est marqué `[?]`.

---

### Critère d'essai réécrit en douce
- **Pour un ami** : Un fonds spécialisé santé doit décider d'investir dans une biotech qui annonce « essai réussi ». L'outil relit toutes les versions du dossier officiel de l'essai et dit si la réussite a été définie après coup.
- **Le moment wow** : « Le communiqué parle de succès ; le registre montre que le critère principal a été remplacé quelques semaines avant l'ouverture des résultats. » À l'écran : le communiqué à gauche, la frise des versions du dossier à droite, la ligne modifiée surlignée avec sa date ; puis 300 essais d'une même maladie passés au tamis en 40 s, classés par sponsor.
- **Le travail remplacé** : analyste biotech d'un fonds (salaire 80-150 k€ `[?]`) ou due diligence scientifique externe sur un actif (20-60 k€ par dossier `[?]`). Une requête SQL compare des champs, pas un critère écrit en texte libre (« variation de l'HbA1c à 12 semaines » contre « proportion de patients sous le seuil ») ni un communiqué de presse.
- **Qui paie, combien, combien de clients** : fonds santé cotés et capital-risque santé, équipes de licensing des laboratoires pharmaceutiques, analystes de banques. 40-80 k€/an `[?]`. Quelques centaines de fonds et un millier d'équipes en Europe `[?]`. Marché autour de 100 M€ `[?]` : c'est le point faible de l'idée sur le filtre 3.
- **Donnée disponible à 9h demain** : API ClinicalTrials.gov v2, gratuite, sans clé (confirmé). L'historique des versions de chaque dossier existe (onglet « Study Record Versions », paquet R `cthist`, confirmé), mais le chemin exact du point d'accès JSON n'est pas confirmé `[?]`. Communiqués : SEC EDGAR, formulaires 8-K, sans clé, en-tête User-Agent exigé `[?]`. Une étude académique chiffre à environ 32 % la part d'essais dont le critère principal a changé (PMC4032105, 2014) : le phénomène est courant, le tri est donc le travail.
- **Briques Aiven** : PostgreSQL (versions de chaque essai, verdicts avec la preuve citée, piste d'audit) ; OpenSearch (recherche dans les textes de critères et de communiqués).
- **Ce que la base sait après 1 000 clients** : le taux de changement de critère par sponsor, par maladie, par société de recherche sous contrat ; le lien entre ces changements et l'échec ultérieur en phase 3, recalculé sur les décisions réelles des clients. La donnée brute est publique, l'étalonnage ne l'est pas.
- **Faisable en 7 h ?** On construit : récupération d'un dossier et de ses versions, comparaison, lecture du communiqué par l'agent, verdict sourcé, tri de 300 essais. On ne simule rien. Point risqué : le chemin de l'historique ; repli sur les pages de versions du site. Second risque : un jury scientifique peut contester un verdict ; chaque verdict cite la ligne et la date.
- **% LLM** : 7 %

---

### Parcelles de cacao recopiées
- **Pour un ami** : Un importateur de cacao, de café ou de bois doit prouver que ses fournisseurs n'ont pas rasé de forêt, sinon amende. L'outil prend la liste de parcelles que les fournisseurs lui envoient, la confronte à vingt ans d'images satellites, et rédige la déclaration.
- **Le moment wow** : « Sur 1 400 parcelles envoyées par une coopérative, 212 ont exactement la même forme et 38 sont dans une forêt classée. » (chiffres de l'exemple, calculés en direct sur le jeu de démo). À l'écran : la liste de parcelles défile, chacune reçoit en quelques secondes sa vignette 2020 contre aujourd'hui et un tampon ; les doublons s'allument ensemble sur une même carte ; la déclaration se génère à droite.
- **Le travail remplacé** : responsable conformité durable, plus un prestataire d'imagerie et de conseil facturé 10-50 k€ par chaîne d'approvisionnement `[?]`. Une alerte ne rédige pas le dossier ; une requête SQL ne repère pas qu'une parcelle de « cacao » est une ancienne forêt ni que trois fermiers ont déposé le même contour.
- **Qui paie, combien, combien de clients** : les opérateurs qui mettent en marché dans l'UE cacao, café, huile de palme, soja, caoutchouc, bois, bovins. 15-60 k€/an `[?]`. Plusieurs milliers d'opérateurs `[?]`. Marché d'environ 150 M€ `[?]`. Échéance confirmée : règlement (UE) 2025/2650, application aux grands opérateurs le 30 décembre 2026, au 30 juin 2027 pour micro et petites entreprises ; la déclaration repose sur l'opérateur qui met le produit en marché la première fois. Des acteurs existent déjà (Satelligence, Meridia, Starling, cités de mémoire `[?]`) : la différence doit être le recoupement entre fournisseurs.
- **Donnée disponible à 9h demain** : Hansen Global Forest Change (perte de couvert 2001-2024, téléchargement libre) `[?]`, carte de forêt 2020 du Centre commun de recherche européen `[?]`, aires protégées `[?]`. Échantillon de parcelles réelles : non trouvé `[?]`.
- **Briques Aiven** : PostgreSQL avec PostGIS `[?]` (parcelles, preuves, piste d'audit des déclarations) ; ClickHouse (perte de couvert année par année pour des millions de parcelles, en second temps).
- **Ce que la base sait après 1 000 clients** : le graphe de toutes les parcelles vues chez tous les clients. La même parcelle présentée par quatre coopératives, les coopératives dont les dossiers sont systématiquement faux, le lavage de cacao d'une zone interdite vers une zone propre : aucun client seul ne le voit.
- **Faisable en 7 h ?** On construit : import de parcelles, lecture des tuiles Hansen sur deux zones, détection de doublons géométriques, brouillon de déclaration. On simule : les parcelles (polygones tracés sur de vraies zones de Côte d'Ivoire ou du Cameroun, à dire clairement). Point risqué : le poids des tuiles ; les télécharger ce soir.
- **% LLM** : 25 %

---

### Pub payée sur sites zombies
- **Pour un ami** : Un directeur marketing dépense des millions en publicité automatique sans savoir sur quels sites elle s'affiche. L'outil prend le relevé des sites où ses pubs sont passées, visite chacun, et dit lesquels sont fabriqués pour capter de la pub sans lecteur.
- **Le moment wow** : « Sur chaque 100 € dépensés, X partent vers des sites que personne ne lit. » Le X est calculé en direct sur le relevé. À l'écran : un fichier de 38 000 lignes glissé dans la page, chaque ligne reçoit une capture du site et un verdict en quelques secondes, le total détourné s'affiche en euros.
- **Le travail remplacé** : cabinet d'audit média indépendant (30-150 k€ par audit `[?]`) et équipe interne de contrôle. Les outils de vérification en place (DoubleVerify, IAS) classent des pages ; décider qu'un site est fait pour la pub demande de le lire et de comparer son contenu à des centaines d'autres. SQL ne le fait pas.
- **Qui paie, combien, combien de clients** : annonceurs dépensant plus de 5 M€/an en programmatique, et les agences média. 60-200 k€/an `[?]`. Quelques milliers en Europe `[?]`. Marché supérieur à 100 M€ `[?]`.
- **Donnée disponible à 9h demain** : OpenSincera (The Trade Desk), gratuit pour l'industrie, plus de 300 000 éditeurs, mesures de rapport pub/contenu, pubs visibles, rafraîchissement, API à l'adresse open.sincera.io/api avec une clé (confirmé par la recherche). Aucun drapeau « fait pour la pub » confirmé : l'agent le déduit. Fichiers ads.txt et sellers.json publics sur chaque site `[?]`. Relevé de placements réel : aucun échantillon public trouvé `[?]` ; on le fabrique à partir de vrais domaines et on le dit.
- **Briques Aiven** : ClickHouse (relevés d'impressions par annonceur, des milliards de lignes) ; PostgreSQL (verdicts et preuves par site) ; OpenSearch (contenus de pages, regroupement des sites quasi identiques ou écrits par machine).
- **Ce que la base sait après 1 000 clients** : pour chaque site, son historique chez des centaines d'annonceurs, son prix réel payé selon le chemin d'achat, ses sites jumeaux. Une liste noire avec preuve que nul annonceur seul ne peut construire.
- **Faisable en 7 h ?** On construit : exploration de 200 vrais sites avec verdict de l'agent, agrégation sur le relevé de 38 000 lignes à partir de verdicts en cache. On simule : le relevé. Point risqué : le verdict « fait pour la pub » est subjectif ; chaque verdict cite ses indices (densité de pubs, contenu recopié, absence d'auteur). Coût des appels LLM à valider avec Adem avant tout test.
- **% LLM** : 12 %

---

### Certificat d'acier impossible
- **Pour un ami** : Une entreprise qui achète de l'acier pour un pont ou une cuve reçoit un certificat qui dit de quel acier il s'agit. L'outil lit ce certificat et détecte ceux qui sont truqués ou recopiés.
- **Le moment wow** : « Ce certificat annonce une teneur en carbone impossible pour ce grade, et le même numéro de coulée figure sur un certificat reçu il y a huit mois d'une autre aciérie. » À l'écran : un PDF scanné de travers, ses valeurs extraites en surbrillance, la case qui sort de la plage autorisée en rouge, le certificat jumeau à côté.
- **Le travail remplacé** : technicien qualité à la réception (35-50 k€ chargé `[?]`) qui contrôle chaque certificat en 5 à 15 minutes `[?]`, ou organisme de contrôle facturé à la prestation. Une requête SQL n'extrait pas un certificat de 40 formats différents ni ne juge la cohérence chimique et mécanique d'une coulée.
- **Qui paie, combien, combien de clients** : distributeurs de métaux, chaudronniers, fabricants d'équipements sous pression, entrepreneurs, organismes de contrôle. 10-30 k€/an `[?]`. Plusieurs milliers à dizaines de milliers en Europe `[?]`. Marché autour de 200 M€ `[?]` ; à vérifier.
- **Donnée disponible à 9h demain** : certificats de réception (type EN 10204 3.1) publiés en exemple sur des sites de distributeurs et d'aciéries `[?]`, non vérifié faute de recherche restante. Plages chimiques par grade : fiches techniques publiques `[?]` (les normes complètes sont payantes). Les faux sont à injecter : on le dit.
- **Briques Aiven** : OpenSearch (similarité entre certificats, numéros de coulée, texte et tableaux) ; PostgreSQL (certificats extraits, verdicts, piste d'audit exigée par les audits qualité).
- **Ce que la base sait après 1 000 clients** : tous les numéros de coulée jamais vus, par aciérie et par date. Un même numéro présenté par deux producteurs, les valeurs « trop parfaites » d'un fournisseur, les laminoirs dont les certificats ne varient jamais. Seul un réseau de clients produit cette donnée.
- **Faisable en 7 h ?** On construit : extraction de 30 certificats réels, contrôle de plage par grade, détection de doublons de coulée. On simule : les fraudes injectées. Point risqué : trouver assez de vrais certificats en échantillon ; sinon le jury doit voir au moins dix vrais.
- **% LLM** : 5 %

---

### Sinistres de grêle et d'inondation triés
- **Pour un ami** : Après un orage ou une crue, un assureur reçoit des milliers de déclarations de dégâts et n'a pas assez d'experts pour tout visiter. L'outil regarde les images satellites avant et après sur chaque parcelle déclarée et dit lesquelles ont réellement souffert.
- **Le moment wow** : « Après l'orage de juin, 9 800 déclarations ; l'agent a rendu un avant/après et un taux de perte pour chacune, et 140 montrent des cultures intactes. » (chiffres de l'exemple). À l'écran : le fichier de déclarations en entrée, une grille de paires d'images qui se remplit en 40 s, les cas suspects remontés en tête avec leur dossier d'expertise rédigé.
- **Le travail remplacé** : expert agricole ou expert en sinistres (visite facturée environ 150-400 € `[?]`, délais de plusieurs semaines au pic) et gestionnaire de sinistres. Une requête SQL ne lit pas une image ; une alerte ne rédige pas le rapport d'expertise.
- **Qui paie, combien, combien de clients** : assureurs récolte et dommages, cabinets d'expertise et d'ajustement de sinistres, réassureurs. 150-500 k€/an `[?]` ou par dossier. Des dizaines d'assureurs et d'expertises en Europe `[?]`. Marché de l'ajustement de sinistres supérieur à 100 M€ en Europe `[?]`.
- **Donnée disponible à 9h demain** : Sentinel-2 (optique, 10 m) et Sentinel-1 (radar, étendue des inondations) via un catalogue ouvert, lecture sans compte à vérifier `[?]`. Registre parcellaire graphique français (contours et culture déclarée, licence ouverte) `[?]`. Radar météo de Météo-France `[?]`. Déclarations de sinistre réelles : aucune publique ; on les génère sur de vraies parcelles et de vrais événements.
- **Briques Aiven** : PostgreSQL (parcelles, déclarations, rapports, piste d'audit) ; ClickHouse (séries d'indice de végétation de milliers de parcelles sur plusieurs années pour la ligne de base).
- **Ce que la base sait après 1 000 clients** : pour chaque parcelle, sa trajectoire normale sur dix ans, donc l'écart réel ; l'écart entre les pertes déclarées et les pertes mesurées par assureur, par région, par expert. Ce que valent les déclarations d'un territoire.
- **Faisable en 7 h ?** On construit : un événement réel (grêle ou crue passée), 200 parcelles réelles, indice de végétation avant/après, rapport rédigé. On simule : les déclarations. Point risqué : les nuages sur Sentinel-2 ; choisir un événement à ciel dégagé, repli sur radar.
- **% LLM** : 15 %

---

### Origine du produit maquillée
- **Pour un ami** : Un importateur d'acier ou de panneaux solaires achète un produit « fabriqué au Vietnam ». S'il est en fait chinois, la douane peut lui réclamer des années de droits antidumping. L'outil recoupe l'origine annoncée avec les flux mondiaux et les papiers du lot.
- **Le moment wow** : « Ce pays exporte vers l'Europe six fois plus de ce produit qu'il n'a de matière première entrante ; l'importateur est exposé à 380 000 € de droits rétroactifs. » (chiffres de l'exemple, calculés sur le cas de démo). À l'écran : facture et certificat d'origine d'un lot en entrée, un flux miroir Chine, pays tiers, Europe sur dix ans, le montant d'exposition en grand.
- **Le travail remplacé** : consultant en douane ou juriste (800-1 500 € par jour `[?]`) lors d'un contrôle ou d'une enquête anticontournement. Le recoupement de flux se fait en SQL, mais lire les papiers du lot, retrouver la mesure applicable et estimer l'exposition ne se fait pas en SQL.
- **Qui paie, combien, combien de clients** : importateurs de produits sous mesures antidumping, commissionnaires en douane, assureurs-crédit. 20-80 k€/an `[?]`. Quelques milliers en Europe `[?]`. Marché de 100 à 200 M€ `[?]`. À distinguer de l'interdit « vérification de sous-traitants » : ici on vérifie l'origine d'un produit, pas une entreprise.
- **Donnée disponible à 9h demain** : fichiers en vrac Comext d'Eurostat (commerce par produit et par pays, mensuel, sans compte) `[?]`, UN Comtrade (clé gratuite) `[?]`, mesures antidumping au Journal officiel de l'UE `[?]`, tarif TARIC `[?]`. Factures et certificats d'origine en exemple : modèles publics à vérifier `[?]`. Rien de cela n'a été confirmé par les cinq recherches.
- **Briques Aiven** : ClickHouse (commerce mondial par produit, pays et mois, centaines de millions de lignes) ; PostgreSQL (dossiers d'importation, verdicts, audit) ; OpenSearch (textes des règlements antidumping).
- **Ce que la base sait après 1 000 clients** : les prix unitaires réellement payés par produit et par origine, les usines qui reviennent sur les certificats de plusieurs clients, les routes de transbordement qui apparaissent avant les enquêtes officielles.
- **Faisable en 7 h ?** On construit : ingestion Comext sur 5 codes douaniers, détection de flux incohérents, lecture de pièces, calcul d'exposition. On simule : le lot de papiers. Point risqué : les flux miroirs sont bruités ; il faut un cas d'école documenté (panneaux solaires, aluminium) pour que le chiffre tienne.
- **% LLM** : 8 %

---

### Faux sites à l'effigie d'une marque
- **Pour un ami** : Une banque ou une enseigne voit des sites imitant la sienne apparaître chaque minute pour voler les clients. L'outil les repère dès leur création, constitue le dossier de preuve et rédige la demande de récupération du nom de domaine.
- **Le moment wow** : « Pendant que vous m'écoutez, 14 faux sites sont apparus ; le dossier de récupération du premier est déjà rédigé. » (le nombre est celui du flux en direct). À l'écran : le flux des nouveaux certificats web défile, les faux se détachent, un dossier de 12 pages (captures, dates, titulaire, motifs juridiques) se génère.
- **Le travail remplacé** : un cabinet d'avocats facture une procédure de récupération de nom de domaine (UDRP) environ 3-6 k€ `[?]` ; le service de protection de marque coûte 100 k€ ou plus à l'année `[?]`. L'alerte seule est refusée par la carte de rejet du hack ; ici le travail fait est le dossier.
- **Qui paie, combien, combien de clients** : responsables juridiques de banques, assureurs, enseignes. 30-120 k€/an `[?]`. Plusieurs milliers de marques en Europe `[?]`. Marché supérieur à 100 M€ `[?]`. Concurrents solides (Doppel, Bolster, Netcraft, MarkMonitor, de mémoire `[?]`) : de loin l'idée la plus risquée sur l'originalité.
- **Donnée disponible à 9h demain** : journaux de transparence des certificats (flux public, sans compte, lisible directement) `[?]`, service RDAP public pour les titulaires `[?]`. Aucun matériel à poser, mais je n'ai pas vérifié l'état actuel du relais populaire CertStream.
- **Briques Aiven** : Kafka (flux de millions de nouveaux certificats par jour) ; Valkey (liste des marques surveillées, déduplication) ; PostgreSQL (dossiers, preuves, piste d'audit) ; OpenSearch (similarité entre noms de domaine et marques).
- **Ce que la base sait après 1 000 clients** : les réseaux d'enregistrement d'un même fraudeur (même hébergeur, mêmes gabarits de page), le délai moyen avant retrait par hébergeur, les motifs qui gagnent en procédure.
- **Faisable en 7 h ?** On construit : lecture du flux, filtre par marque, capture, dossier. On ne simule rien. Point risqué : le vrai fraudeur n'est visible que quelques heures ; prévoir une marque de démo qui a des imitations actives.
- **% LLM** : 25 %

---

## Classement conseillé (mon avis, à trancher par Adem)
1. Parcelles de cacao recopiées : échéance réelle et confirmée (30 déc. 2026), effet de réseau net, mais un marché déjà occupé.
2. Certificat d'acier impossible : la plus originale (5 %), marché et échantillons à vérifier.
3. Pub payée sur sites zombies : donnée gratuite confirmée, chiffre en euros parlant pour un jury.

Sous 20 % : essai clinique (7), acier (5), pub (12), sinistres (15), origine douanière (8). Cacao et faux sites (25) restent pour leur échéance ou leur vitesse, pas pour leur surprise.

## Ce que les cinq recherches ont établi
- EUDR : règlement (UE) 2025/2650, 30 déc. 2026 grands opérateurs, 30 juin 2027 micro et petites ; le résultat du réexamen de simplification d'avril 2026 n'a pas été trouvé.
- ClinicalTrials.gov : API v2 gratuite ; historique des versions existant, chemin exact non confirmé ; des outils tiers de comparaison existent déjà (Apify, cthist), aucun produit pour investisseurs vu.
- OpenSincera : gratuit, API avec clé, 300 000 éditeurs ; aucun indicateur « fait pour la pub » confirmé.
- RDW (compteurs kilométriques des voitures) : endpoint ouvert confirmé pour les véhicules, jeu « jugement du compteur » non confirmé ; idée écartée.
