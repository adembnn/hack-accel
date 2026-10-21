# 2. Cas réels et gestes à la main (recherche du 21 oct. 2026)

Décision débloquée : quel utilisateur précis surveille ou croise des données à la main, et changerait d'outil pour des agents.
Lecture des sources : `[vendeur]` = chiffre publié par un éditeur qui vend la solution (à prendre comme ordre de grandeur) ; `[témoin]` = récit direct ; `[?]` = non vérifié.
Reddit n'est pas lisible par recherche directe : seuls 2 fils ont pu être lus en entier. Le reste vient de rapports officiels, de blogs métier et de pages d'éditeurs.

## Cas 1. Pharmacien titulaire d'officine : retrouver un médicament en rupture
- **Geste** : chaque jour, pour chaque référence manquante, chercher chez 2 grossistes, appeler le laboratoire, contacter le médecin, trouver une alternative. Le DP-Ruptures déclare la rupture après 72 h sans livraison (Ordre) mais ne cherche pas le stock.
- **Coût** : environ 12 h par semaine et par pharmacie, plus du double de 2021 (5,3 h) ; 81 % déclarent une perte financière ; moyenne de 27 pays, la France n'est pas isolée [?] → pgeu.eu/wp-content/uploads/2026/03/PGEU-Medicines-Shortages-Report-2025_.pdf
- **Bricolage** : portails grossistes, téléphone, groupes WhatsApp entre confrères (cas britannique : mediwatch.co.uk/guides/how-pharmacies-handle-shortages [vendeur]). Un prestataire d'externalisation existe (pharmapex.fr).
- **Tentatives** : DP-Ruptures, en service dans 70 % des officines en 2019 → ordre.pharmacien.fr (déclaratif, sans recherche de stock).
- **Données** : ruptures ANSM et DP-Ruptures (accès Ordre) ; stocks grossistes dans les logiciels d'officine (fermés). BDPM ouverte [?].
- **Verdict** : pas un chatbot ; aucun produit trouvé qui cherche le stock. Risque #3 : le stock grossiste temps réel n'est pas accessible demain matin. Substitution = décision d'un pharmacien.

## Cas 2. Conseil syndical bénévole : contrôler les comptes du syndic
- **Geste** : réunion annuelle de contrôle avant l'AG ; rapprocher la balance générale, le relevé bancaire séparé, l'extrait de compte, les appels de provision et les factures (inc-conso.fr/content/copropriete-le-controle-des-comptes-par-le-conseil-syndical).
- **Coût** [témoin] : dans une copropriété, 18 000 € d'écart fournisseurs, 21 000 € d'écart débiteurs entre deux documents du syndic, et 55 000 € dus à un fournisseur de gaz sur 72 000 € de trésorerie, découverts par hasard → reussirconseilsyndical.fr/finance/controler-comptes-copropriete
- **Bricolage** : le copropriétaire a bâti seul un assistant LLM pour pré-analyser les pièces ; il prévient d'erreurs d'interprétation possibles. Il prépare une séance de 1 h 30 à 2 h.
- **Tentatives** : le même auteur annonce ScanTaCopro (accès anticipé, scantacopro.fr) : contrats décortiqués, devis en doublon. Je n'ai pas testé l'outil.
- **Données** : balance, relevés, factures PDF dans l'extranet du syndic ; justificatifs conservés 10 ans (berenfus-immobilier.fr). Format libre selon le logiciel du syndic.
- **Verdict** : survit à #1 (sans les PDF, rien à faire) et #6 (le blogueur est nommable). Danger #8 : ressemble à « chat avec tes documents » si l'agent ne fait que lire. À garder si l'agent rapproche et chiffre les écarts.

## Cas 3. Éleveur de volailles en zone réglementée : réclamer l'indemnité grippe aviaire
- **Geste** : vérifier que chaque bâtiment est dans une commune des zones de protection ou de surveillance (liste xlsx en annexe, « ou contactez votre DDT »), calculer le vide sanitaire, faire signer une attestation de pertes par l'expert-comptable, déposer avance puis solde chaque année.
- **Coût** : indemnisation jusqu'à 90 % des pertes ; 156 foyers en 2025-26 dont 125 en élevage ; solde à déposer du 21 sept. au 6 nov. 2026, 14 h → franceagrimer.fr/aides/influenza-aviaire-amont-epizootie-2025-2026-solde ; agriculture.gouv.fr/influenza-aviaire-la-situation-en-france. Le temps passé par éleveur : non trouvé [?].
- **Bricolage** : expert-comptable, DDT, organisation professionnelle. Déclaration de chaque mouvement sous 7 jours, 48 h au niveau de risque élevé → draaf.bretagne.agriculture.gouv.fr/influenza-aviaire-r327.html
- **Tentatives** : aides-agri.beta.gouv.fr (fiche d'aide), PIGMA pour la cartographie des zones (une région). Les réfactions pour manquement sanitaire sont appliquées au solde (info.agriculture.gouv.fr, décision INTV GECRI 2026-09).
- **Données** : arrêtés préfectoraux dans le recueil de chaque département, liste de communes FranceAgriMer, comptabilité privée.
- **Verdict** : dispositif refait chaque année (2023-24, 2024-25, 2025-26). Aucune preuve de gestes manuels longs. Proche de « plateforme qui aide X » (#7). Douteux.

## Cas 4. Généalogiste successoral : retrouver tous les héritiers
- **Geste** : partir d'un nom et d'une adresse, fouiller 36 000 mairies, archives départementales, état civil, fiscalité, cadastre ; vérifier chaque lien familial jusqu'au 6e degré.
- **Coût** : 6 à 12 mois par dossier (add-associes.com) ; interviennent dans 2 % des successions ; « il n'existe pas en France de fichier centralisé » pour retrouver une adresse (coutot-roehrig.com). Coût en heures : non trouvé [?].
- **Bricolage** : base interne du leader, plus d'un milliard de données (coutot-roehrig.com/ufaqs/comment-travaille-le-genealogiste-successoral).
- **Tentatives** : pas d'outil tiers trouvé.
- **Données** : fichier des décès INSEE (ouvert), archives papier ou scannées, registres de greffe. La majorité des sources n'est pas numérisée.
- **Verdict** : fort sur #4 (retrouver un héritier inconnu fait une histoire). Risque #3 élevé : l'archive papier. Utilisateur nommable (cabinets indépendants, membres de Généalogistes de France). Douteux.

## Cas 5. Journaliste local (ou élu d'opposition) : lire les délibérations et les marchés
- **Geste** : ouvrir les PDF de conseils municipaux de chaque commune couverte, chercher les subventions et marchés, croiser avec les marchés publics.
- **Coût** : les rapports de recherche le décrivent comme « time-consuming » (arxiv.org/pdf/2601.18374v1). Aucun chiffre français en heures ou en euros trouvé [?].
- **Bricolage** : lecture manuelle ; sites de communes hétérogènes.
- **Tentatives** : Data4Democracy « town-council » est à l'arrêt (« NOT ACTIVE », github.com/Data4Democracy/town-council) ; il listait l'extraction de texte des PDF scannés et l'hébergement comme chantiers en cours, cause de l'abandon non documentée [?] ; Agenda Watch (Big Local News, né dans un cours de Stanford) continue (rjionline.org) ; Civic Searchlight couvre 650 communes canadiennes (civicsearchlight.nationalobserver.com) ; CitiLink : 120 procès-verbaux de 6 communes portugaises seulement. Rien de comparable trouvé pour la France [?].
- **Données** : délibérations PDF (ex. jeu Soissons sur data.gouv.fr), DECP via API data.gouv.fr. Le scraping DECP de marches-publics.info est « expérimental », avec des périodes de 4 jours manquantes ou dupliquées (data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-decp-de-marches-publics-info-awsolutions).
- **Verdict** : #7 menace (« extension qui alerte »). Gagnerait s'il croise délibération, marché et entreprise (BODACC). Risque #3 : qualité des données. Douteux.

## Cas 6. Conciergerie de location saisonnière : tenir 120 jours, numéros et taxe de séjour par commune
- **Geste** : par logement, additionner les nuits sur Airbnb, Booking et le site direct, afficher le numéro d'enregistrement sur chaque annonce, déclarer la taxe de séjour commune par commune « d'où le tableur mensuel » → groume.io/taxe-de-sejour-conciergerie.html [vendeur]
- **Coût** : amende jusqu'à 10 000 € sans enregistrement, 20 000 € pour fausse déclaration ; plafond 120 jours, abaissable à 90 par délibération → tgs-france.fr/blog/location-de-meubles-de-tourisme-l-enregistrement-generalise-a-l-ensemble-du-territoire ; exemple chiffré (128 jours au lieu de 120) : cas fictif d'un cabinet comptable, socic.fr [?].
- **Bricolage** : tableur par logement (adresse, plateforme, numéro, plafond) conseillé par socic.fr.
- **Tentatives** : Groume.io, « channel manager conçu par des conciergeries » avec compteur de 120 jours (groume.io).
- **Données** : exports de réservations, délibérations de chaque commune, téléservice national. Date d'ouverture contradictoire : 20 mai 2026 (socic.fr) ou 4e trimestre 2026 (actual-immo.fr) [?].
- **Verdict** : #2 touché (Groume.io, nommé). Reste le suivi des délibérations communales, que je n'ai pas vu couvert [?]. Douteux.

## Cas 7. Restaurateur ou boucher : croiser RappelConso avec ses lots en stock
- **Geste** : lire les rappels du jour, retrouver bon de livraison, lot et fournisseur, retirer, noter dans le registre HACCP.
- **Coût** : plus de 1 000 rappels par an ; « 7 500 € minimum » en cas de non-retrait [vendeur, ?] → onrush.fr/blog/reglementation/rappel-conso-restaurant
- **Bricolage** : flux RSS ou API ; logiciels de restauration qui interrogent l'API chaque heure (même source).
- **Tentatives** : l'article lui-même note que « si tu ne sais pas quel lot tu as en stock, l'alerte ne sert à rien ».
- **Données** : API RappelConso V2 avec GTIN (data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces) ouverte ; lots reçus dans des photos de bons de livraison ou des factures PDF.
- **Verdict** : aucun témoignage de geste manuel trouvé [?]. #7 menace (alerte). Le seul angle viable est de reconstituer les lots à partir des bons de livraison. Douteux.

## Cas 8. Credit manager de PME : déclarer sa créance dans les 2 mois après un jugement
- **Geste** : surveiller les clients dans le BODACC ; le délai de déclaration court depuis la parution, forclusion sinon (infogreffe.fr ; legifrance.gouv.fr, R622-21).
- **Coût** : une faillite client coûte « 10 000 à 40 000 € » de créances [vendeur] → alertbodacc.fr. Les alertes gratuites de bodacc.fr : une alerte par SIREN, pas de regroupement (risksonnar.com/blog/bodacc-procedures-collectives-guide-complet-2026).
- **Tentatives** : AlertBodacc (49 €/mois), Altares, Ellisphere, RiskSonnar.
- **Verdict** : écarté, #2 (AlertBodacc, Altares, Ellisphere).

## Cas 9. Donneur d'ordre du BTP : vérifier les sous-traitants tous les 6 mois
- **Geste** : à la signature puis tous les 6 mois (seuil 5 000 € HT), vérifier l'attestation URSSAF par son code à 15 caractères, Kbis, assurances, carte BTP.
- **Coût** : 10 à 20 min par profil, soit 10 à 20 h par an pour 30 prestataires [vendeur] → addworking.com ; amende administrative jusqu'à 4 000 € par salarié, plafond 500 000 € → hauts-de-france.dreets.gouv.fr (maquette_lti_vs_05112019.pdf).
- **Tentatives** : Provigis, AddWorking, Kontractis (récupération automatique URSSAF et DGFiP).
- **Verdict** : écarté, #2 (Provigis, AddWorking, Kontractis).

## Cas 10. Transitaire ou courtier de fret : auditer factures et frais de surestaries
- **Geste** : recouper chaque facture transporteur avec le contrat, le dernier jour de franchise et l'historique du conteneur.
- **Coût** [témoin] : « 2 300 $ de surfacturation » trouvés sur 30 chargements en une semaine d'audit → reddit.com/r/FreightBrokers/comments/1siez7c ; 2 à 4 h par jour d'audit manuel [vendeur, Expedock via reconciler-ai.com/guide]. Règle FMC 2024 : 20 champs obligatoires, facture sous 30 jours (tradlinx.com).
- **Tentatives** : Cubic, Reconciler AI, GoFreight (-53 % de surestaries, cas client).
- **Verdict** : écarté, #2 (Cubic, Reconciler AI, GoFreight).

## Cas 11. Infirmière libérale : rejets de facturation
- **Geste** : lire les retours NOEMIE, corriger, retransmettre, rapprocher le compte bancaire.
- **Coût** : 609 € d'impayés par mois et 1 à 4 h par semaine [vendeur, Agathe YOU] → agatheyou.fr/vos-questions/motifs-rejet-tiers-payant ; 3 à 10 % de FSE rejetées [vendeur] → swily.io/guide/rejets-noemie-infirmier.
- **Tentatives** : Agathe YOU (garantie de paiement), Swily.
- **Verdict** : écarté : #2 (Agathe YOU, Swily) et #3 (données de santé dans les logiciels).

## Cas 12. Gestionnaire de flotte : désigner le conducteur sous 45 jours
- **Geste** : pour chaque avis ANTAI, retrouver qui conduisait le véhicule et désigner.
- **Coût** : 675 € (450 € si payé sous 15 jours), 1 875 € après 45 jours → senat.fr/questions/base/2017/qSEQ171001778.html ; 25 minutes par avis avant outil [vendeur, témoignage] → gac-carfleet.com.
- **Tentatives** : GAC Car Fleet (connexion ANTAI directe), Chevin.
- **Verdict** : écarté, #2 (GAC Car Fleet, Chevin).

## Vus et écartés (même motif #2, pas détaillés)
Veille BOAMP des PME, 10 à 15 h par semaine [vendeur] → marchey.fr (Marchey, WeWinBid). Suivi des assurances fournisseurs d'un gestionnaire (fil r/PropertyManagement, témoin) → TrustLayer, myCOI, Jones. DRM du viticulteur → Isavigne, Wineriz. Indexation oubliée du bailleur → Smartloc. Vérification de provenance d'un commissaire-priseur, 5,10 € par lot → Art Loss Register.

## Les 3 douleurs les plus chères (par preuve et par montant)
1. **Ruptures de médicaments en officine** : 12 h par semaine et par pharmacie, source primaire (PGEU). Seule douleur chiffrée sans éditeur derrière. Obstacle : données grossistes fermées.
2. **Contrôle des comptes de copropriété** : 39 000 € d'écarts non expliqués plus 55 000 € non disponibles dans un seul immeuble, récit direct. Obstacle : un seul témoin, pas d'enquête sur la fréquence [?].
3. **Audit de factures de fret** : 2 300 $ sur 30 chargements, récit direct. Dernier rang car le marché est équipé (Cubic, Reconciler AI).

## Ce que je n'ai pas trouvé
- Aucun récit à la première personne, chiffré en heures, pour les généalogistes, secrétaires de mairie, mandataires à la protection des majeurs et éleveurs. J'ai écarté faute de coût (MJPM : seule la « charge administrative croissante » est citée, dreets Pays de la Loire).
- Pas de fil Reddit lisible sur la recherche de stock en pharmacie ni sur la veille d'appels d'offres.
- Pas d'outil français concurrent pour les délibérations communales (cas 5) ni pour le suivi des arrêtés de zone (cas 3, 6) : absence de résultat, pas preuve d'absence.
- Aucun chiffre vérifié sur le nombre d'utilisateurs potentiels par cas.
- Forums professionnels français (comptables, huissiers, notaires) : les recherches n'ont rendu que des pages d'éditeurs ; les notaires donnent 3 mois moyens entre compromis et acte sans coût de la collecte des pièces (notaires.fr).
- Constat transversal : presque chaque geste manuel trouvé a déjà un éditeur nommé. Les trous restent là où les données sont dispersées entre communes, préfectures et archives, ou privées chez l'utilisateur.
