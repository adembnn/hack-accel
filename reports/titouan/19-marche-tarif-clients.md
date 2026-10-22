# 19 - Marché, tarifs et premiers clients de Refuge

Recherche du 22/10/2026, sources publiques uniquement (Keenable), aucun appel payant, personne contacté. Angle défensif : aide à la décision et à l'exercice, non certifiée. Ne refait pas : `05` (réglementation ERP, UP, Vigipirate), `12` et `15` (jury, tarif en 3 options), `etat-art-6` (4 marchés RATP / SGP / Ville de Paris / IDFM, concurrents).
Convention : **[SOURCÉ]** = lu dans la page citée ; **[CALCUL]** = ma division ou déduction, à refaire ; **[SECONDAIRE]** = relayé par un site non officiel ; **[?]** = introuvable.
Mini-glossaire : *ERP* = établissement recevant du public ; *catégories 1 à 4* = plus de 1 500 / 701-1 500 / 301-700 / jusqu'à 300 personnes (https://aisne.gouv.fr/Actions-de-l-Etat/Securite-et-protection-de-la-population/Service-Interministeriel-de-Defense-et-de-Protection-Civile/ETABLISSEMENTS-RECEVANT-DU-PUBLIC-ERP/La-securite-dans-les-etablissements-recevant-du-public-ERP) ; *ESSP* = étude de sûreté et de sécurité publique ; *HT* = hors taxes.

## Verdict en 3 lignes
1. Aucun texte lu n'oblige à *simuler* une foule dans un lieu existant : la loi impose des exercices, un registre, un plan d'évacuation, des commissions. Refuge se vend donc comme **exercice sur table rejoué + trace de décision**, pas comme conformité.
2. Le seul achat public de simulation prouvé reste celui des études de flux par bureaux d'études (RATP, SGP, IDFM, Ville de Paris, cf. `etat-art-6`) : l'acheteur paie des jours de modélisation, pas une licence.
3. **Correction au rapport `etat-art-6` : Onhys n'est plus un concurrent actif.** Liquidée fin nov. 2023 faute de financement ; son logiciel a été racheté par Interactive 4D, qui le vend en abonnement (SaaS, produit « Virtualitis ») aux organisateurs de grands événements (https://www.sophianet.com/article/sophia-interactive-4-d-reprend-techno-onhys-mouvements-foule). Prix de Virtualitis : [?]. Concurrent direct à surveiller, plus fragile qu'annoncé.

## 1. Qui achète, combien, et quelle obligation crée le besoin

| Acheteur | Volume en France (sourcé) | Obligation / déclencheur | Source |
|---|---|---|---|
| Gestionnaires de centres commerciaux (type M) | 835 centres commerciaux (chiffres clés CNCC, relayés par un PDF Scribd) [SECONDAIRE] | visites de la commission de sécurité tous les 3 ans (1re-2e cat.) ou 5 ans (3e-4e) ; registre de sécurité ; plan d'évacuation | https://fr.scribd.com/document/599162903/A4-Chiffre-cle-s-CNCC ; https://gammeo.com/gestion-des-risques/la-commission-de-securite-quest-ce-que-cest |
| Exploitants de cinémas et salles (type L) | 2 061 établissements de cinéma (jeu de données du ministère de la Culture, relayé) [SECONDAIRE] ; 6 401 écrans (CNC, bilan 2025) [SOURCÉ] | idem ; salles de plus de 700 places : règles de dégagement renforcées (`05`, L 26 à L 29) | https://clawhub.ai/deiu/skills/france-cinemas ; https://cnc.fr/professionnels/etudes-et-rapports/bilans/bilan-2025-du-cnc_2589800 |
| Gares | 3 000 gares gérées par SNCF Gares & Connexions, 10 millions de voyageurs par jour [SOURCÉ] | ESSP obligatoire sur tout le territoire pour les projets de gares | https://groupe-sncf.com/en/group/about-us/companies/sncf-gares-et-connexions ; https://www.socotec.fr/nos-solutions/surete-erp-sante/assistance-etude-surete-securite-publique-essp |
| Tous ERP | « environ 2 millions d'ERP, près de 80 % de catégorie 5 » [SECONDAIRE] ; donc de l'ordre de 400 000 en catégories 1 à 4 [CALCUL, 20 % de 2 M, à vérifier : aucun chiffre officiel 1-4 trouvé, ni pour Paris] | registre de sécurité obligatoire pour tout ERP | https://douzepointcinq.com/blog/etablissement-recevant-du-public-erp-normes-et-obligations ; https://countact.fr/en/blog/erp-safety-register-content-update-frequency |
| Organisateurs d'événements | [?] aucun décompte national trouvé | déclaration préalable d'une manifestation sur la voie publique ; grands rassemblements : dispositif de sécurité à prévoir avec la préfecture ; posture Vigipirate | https://service-public.gouv.fr/particuliers/vosdroits/F21899 ; https://haut-rhin.gouv.fr/Actions-de-l-Etat/Securite-et-protection-de-la-population/Manifestations-et-grands-rassemblements/Reglementation-Manifestations-et-Grands-rassemblements |
| Collectivités | [?] | ESSP dans les agglomérations de plus de 100 000 habitants : création ou travaux d'ERP de 1re/2e cat., opérations de plus de 70 000 m2 de plancher ; Lyon passe un accord-cadre de 240 000 € HT max sur 4 ans pour des AMO en ESSP | Socotec (lien ci-dessus) ; https://www.marchesonline.com/appels-offres/avis/assistance-a-maitrise-d-ouvrage-pour-la-realisation/ao-9518973-1 |
| Bureaux d'études sécurité incendie | [?] nombre non trouvé ; acteurs publics lus : CNPP, 1Point2 (distributeur Pathfinder avec bureau d'études), Elvia, Socotec, Ingérop, Explain | « ingénierie d'évacuation » : analyse simple GA 23 puis simulations avancées (Pathfinder, FDS+EVAC), temps d'évacuation RSET/ASET | https://www.cnpp.com/etre-accompagne/incendie-explosion/ingenierie-evacuation ; https://www.pathfinder-simulation.fr/ |

Exercices : le Code du travail (art. R4227-39) impose des exercices d'évacuation au moins tous les 6 mois, consignés sur un registre (https://travail-industrie.com/code-du-travail/r4227-39) ; Bureau Veritas l'applique aux ERP et ERT (https://commande.bureauveritas.fr/article/exercices-evacuation-incendie-MC3IVYKITWPBABPJ3K6UPWJW4YEA). La règle propre aux ERP (articles MS) : à vérifier sur Légifrance avant de la citer.
« DUS » : je n'ai trouvé aucune obligation ERP de ce nom. Les documents réels sont le registre de sécurité, le plan d'évacuation (norme NF X08-070, https://www.lonasante.com/plan-evacuation/), les consignes et, pour les salariés, le DUERP (code du travail, https://blog.agiris.fr/des-chiffres-et-moi/duerp). Si Titouan pensait à un autre document, le préciser.
Acteur public à connaître : le Laboratoire central de la Préfecture de police pilote le groupe EVAC2024 (état de l'art, benchmark des logiciels et guide de bonnes pratiques d'ingénierie d'évacuation, pour des outils prédictifs de foule avant les JO 2024) [SOURCÉ via CNPP]. Lien ci-dessus.

## 2. Prix du marché : public ou sur devis

| Repère | Prix | Statut | Source |
|---|---|---|---|
| Bentley LEGION | à partir de 16 330 USD l'an ; revendeur espagnol : 15 046 € l'an (2 « keys » incluses) ou 9 760 USD l'an pour la version Simulator | public, « à partir de » | https://bentley.com/software/legion ; https://c-buchanan.com/servicios/software |
| Pathfinder | 2 640 USD l'an (poste) ou 3 960 USD (flottante) | public | https://thunderheadeng.com/pathfinder/pricing |
| Oasys MassMotion | ancien : 20 000 £ en licence perpétuelle + maintenance 20 %/an ; MassMotion Flow : 5 000 £ ; 30 000 USD en 2015 ; prix actuel sur devis | ancien public, actuel sur devis | https://aecmag.com/news/massmotion ; https://aecmag.com/news/massmotion-flow ; https://architosh.com/2015/06/aia-show-floor-reports-oasys-massmotion-and-massmotion-flow ; https://buildingtech.pro/tools/massmotion |
| PTV Viswalk | sur devis (démo gratuite) ; une enquête de 2014 donne « 1 000 à 20 000 € selon [options] » (texte tronqué, ancien) | sur devis | https://ptvgroup.com/en/products/pedestrian-simulation-software-ptv-viswalk/faqs ; https://firemodelsurvey.com/pdf/Viswalk_2014.pdf |
| Virtualitis (ex-Onhys, Interactive 4D) | [?] abonnement, montant non publié | sur devis probable | Sophianet (lien section Verdict) |
| Étude de flux RATP (14 espaces) | 278 996 € HT plafond, soit ~20 k€ par espace [CALCUL] | marché public | https://ted.europa.eu/en/notice/435138-2018/html |
| Étude de flux SGP (gares GPE) | plafond 1 M€ HT sur 6 ans max | marché public | cf. `etat-art-6` |
| Étude de flux IDFM (toutes études de circulation) | plafond 3 M€ sur 4 ans (1,5 M€ par 24 mois) | marché public | https://ted.europa.eu/en/notice/673654-2024/html |
| AMO en ESSP, Lyon | plafond 240 000 € HT sur 4 ans | marché public | lien Lyon ci-dessus |
| Prix d'UNE étude d'évacuation par un bureau d'études privé | [?] non publié ; aucun tarif trouvé (CNPP, 1Point2, Elvia, simulation-evacuation.com : tous « sur devis ») | sur devis | liens section 1 |
| Prix d'UN exercice d'évacuation avec simulation | [?] non publié | sur devis | |
| Repères voisins, pas des exercices de foule | formation « évacuation » : 570 à 615 € HT par jour et par groupe ; SSIAP : 28 à 60 € HT l'heure ; plan d'évacuation imprimé : 150 à 300 € | public, voisin | https://www.cnfce.com/faq/securite-incendie/tarif-formations-incendie ; https://gvsp-securite.fr/securite-incendie-ssiap/ ; lonasante (lien ci-dessus) |

Lecture honnête : les logiciels coûtent de 2,6 k à 16,3 k USD par poste et par an, mais le client paie surtout le **temps d'ingénieur** (20 k€ par espace chez la RATP [CALCUL]). Rien ne dit qu'un gestionnaire de centre paie aujourd'hui pour un exercice de foule simulé. Aucun repère privé n'est public : c'est la première chose à demander.

## 3. Trois options de tarification, positionnées contre ces repères
Aucun chiffre de Refuge n'est proposé. Les repères du tableau section 2 servent de bornes, pas de prix.

| Option | Repère le plus proche | Position défendable | Prix |
|---|---|---|---|
| A. Abonnement par site | licence d'ingénieur de 2 640 à 16 330 USD l'an (Pathfinder, LEGION) | un gestionnaire n'a pas d'ingénieur de flux : il ne comparera pas à une licence mais à ce qu'il paie en études et exercices. Rester sous l'ordre du repère haut tant qu'aucun gain n'est démontré | à valider avec le premier client |
| B. Par exercice / simulation | étude RATP ~20 k€ par espace [CALCUL] en haut ; formation à 570-615 € la journée en bas | la valeur tient dans « modèle d'un lieu livré en minutes » (la ligne chère des marchés) et dans la trace de décision ; le bas de la fourchette est une formation, le haut est une étude de conception : l'écart est trop large pour fixer un chiffre | à valider avec le premier client |
| C. Par enseigne (locataires) | aucun repère public | la base de retours d'expérience grandit avec chaque enseigne, mais l'enseigne n'est pas l'acheteur ; le Forum compte environ 150 boutiques (`05`) | à valider avec le premier client |
Mon ordre de test : B pour entrer (peu d'engagement, comparable à une prestation), A en second pour le revenu récurrent, C seulement si le gestionnaire veut faire payer ses locataires.

## 4. Dix premiers clients cibles à Paris
Décideurs : titres publics ou rôles génériques ; aucun nom de personne n'est cité sauf profil LinkedIn public (Metafore). Un dirigeant mentionné dans une source peut avoir changé de poste.

| # | Organisation | Décideur probable | Pourquoi maintenant | Canal d'approche |
|---|---|---|---|---|
| 1 | Westfield Forum des Halles (Unibail-Rodamco-Westfield ; 77 500 m2 GLA, relié au hub de transport, `05`) | directeur du centre, directeur exploitation et sûreté (le général manager de 2021 à oct. 2025 a quitté le poste, successeur [?]) | couvre-feux des 19 au 22 oct. ; arrêté interdisant les rassemblements à Châtelet-Les Halles le 22 oct., 8h-20h (`05`) ; fermeture exceptionnelle du centre le 10 sept. 2025 | via la relation existante (à confirmer par Titouan), sinon entretien demandé par message personnel |
| 2 | UGC Ciné Cité Les Halles (27 écrans, 3 800 places, 2 599 667 entrées en 2025 [SOURCÉ] https://parissecret.com/en/worlds-busiest-cinema-paris) | directeur du cinéma, direction technique/sécurité d'UGC | évacué le 19 oct. vers 19h20-20h en pleine séance, environ 3 000 spectateurs (https://www.bfmtv.com/culture/cinema-series/gardez-votre-ticket-quand-le-couvre-feu-a-paris-interrompt-des-seances-a-l-ugc-cine-les-halles_AN-202610200618.html) | message au directeur de site ; ton de retour d'expérience, pas de vente |
| 3 | RATP (pôle Châtelet-Les Halles ; stations fermées dès 22h les 21 et 22 oct. à la demande de la Préfecture de police, https://sortiraparis.com/en/news/in-paris/articles/355189-paris-curfew-which-routes-to-take-to) | direction de la sûreté, études de flux voyageurs | acheteur prouvé de simulation de flux (marché 2018, ~20 k€ par espace [CALCUL]) | candidature à un futur accord-cadre via un bureau d'études (Ingérop est titulaire 2018) ; message à un ingénieur flux |
| 4 | Île-de-France Mobilités | AMO études de circulation (mission 6 : simulations de flux piétons) | accord-cadre 2024, plafond 1,5 M€ par 24 mois ; sa seule porte est le marché public | veille BOAMP/TED ; viser un titulaire de l'accord, pas IDFM directement |
| 5 | Metafore Boétie - St Augustin (lieu du hackathon, ERP, 850 à 1 100 m2, `16`) | directeur des opérations (profil LinkedIn public : https://linkedin.com/in/pamara-sylla-8a92a91ab) | on y est ; petit, privé, plan en main ; sert de site pilote sans enjeu réglementaire lourd | en personne ce soir, après le pitch ; demander le plan d'évacuation (`16` §8) |
| 6 | Ville de Paris, direction des JO et grands événements | responsable du pôle événements | marché 2022 « simulations de flux pour un événement grand public », 2 mois (cf. `etat-art-6`) ; les événements parisiens se répètent | message institutionnel ; demander le résultat du marché de 2022 |
| 7 | SNCF Gares & Connexions (gares parisiennes) | direction de la sûreté et de l'exploitation d'une gare | 3 000 gares, ESSP obligatoire pour les projets de gares (Socotec) | via un bureau d'études (voir 3) ou le pôle innovation ; délai long |
| 8 | Viparis (Paris Expo Porte de Versailles) | responsable sûreté-sécurité | page « sûreté, sécurité » publique avec forfaits : le sujet est déjà vendu aux exposants (https://viparis.com/en/our-venues/paris-expo-porte-de-versailles-en/solutions/surete-securite-en) | contact commercial public ; entrer par les organisateurs de salons |
| 9 | Accor Arena (Bercy, 20 300 places en concert [SECONDAIRE] https://wikiwand.com/en/articles/Accor_Arena) | direction de la sécurité du lieu ; exploitant exact à vérifier | exemple historique d'Adem ; capacité qui justifie un exercice de foule | message à la direction sécurité ; exploitant [?] |
| 10 | Laboratoire central de la Préfecture de police (groupe EVAC2024) | chargé d'études ingénierie d'évacuation | juge de la validité des modèles ; porte d'entrée pour la crédibilité, pas pour la vente | demande de retour sur la méthode, pas de démarchage commercial |
Côté bureaux d'études (Ingérop, Explain, CNPP, Socotec, 1Point2) : ils sont les titulaires des marchés ; les approcher comme partenaires, pas comme clients, revient à la question « vendre au bureau ou à l'autorité » laissée ouverte par `etat-art-6`.

## 5. Brouillon de message (à envoyer par Titouan lui-même ; rien n'est envoyé)
> Bonjour [Prénom],
> Je suis Titouan, étudiant à l'ESSEC ; au hackathon Accel de Paris du 22 octobre, nous avons construit un prototype qui rejoue en 3D, avec des données publiques, la sortie d'un lieu comme [lieu] quand une issue ou une station de métro est fermée.
> Après l'évacuation du 19 octobre aux Halles, j'aimerais comprendre comment vous décidez dans ce cas, et ce que vous utilisez aujourd'hui (exercice, plan, étude).
> Ce n'est pas une offre : c'est un outil d'aide à la décision, non certifié, et nous n'avons ni client ni tarif. Aucune donnée de votre site n'est utilisée.
> Auriez-vous 20 minutes cette semaine, au téléphone ou sur place, pour me corriger ?
(À adapter au lieu ; ne citer ni accord ni partenaire qui n'existe pas.)

## 6. Cinq risques de marché et la réponse honnête

| Risque | Réponse honnête |
|---|---|
| Responsabilité : un plan « optimisé » qui tourne mal | L'outil ne choisit pas : le directeur décide, la simulation montre le prix de chaque choix. Mention « non certifié, ordre de grandeur » partout. Écarts de 30 % entre modèles publiés cités par nos propres sources (`12`). Une assurance responsabilité professionnelle et des conditions d'usage restent à faire |
| Certification : aucun texte ne reconnaît Refuge | Vrai. Les ingénieurs valident aujourd'hui avec Pathfinder/FDS+EVAC (CNPP) ; le groupe EVAC2024 de la Préfecture de police benchmarke les logiciels. Positionnement : exercice et trace de décision, pas étude réglementaire ; viser un benchmark contre Pathfinder sur un cas commun, et solliciter le LCPP |
| Sensibilité sûreté : plans de lieux, issues, faiblesses | Angle strictement défensif : zones et issues dégradées, jamais d'optimisation d'attaque. Données publiques uniquement ; les plans de sites clients restent chez eux (hébergement et accès à cadrer). Sans autorisation écrite, pas de plan publié (`16` §8). Un lieu qui nous confie son plan devient lui-même un point d'attaque à protéger |
| Concurrence : bureaux d'études, éditeurs, repreneur d'Onhys | LEGION/Pathfinder/MassMotion sont établis ; Virtualitis (Interactive 4D) vise déjà les organisateurs d'événements en SaaS. Notre seul écart supposé : un modèle de lieu en minutes et un comparatif de décisions de crise avec agents ; non prouvé tant qu'aucun client ne l'a dit. Surveiller aussi l'ajout de génération de scénarios chez un éditeur établi |
| Cycle de vente long et petit marché prouvé | 4 marchés publics en 8 ans (`etat-art-6`), des accords-cadres sur 4 à 6 ans, des commissions de sécurité tous les 3 à 5 ans : on n'entrera pas par l'appel d'offres. Voie réaliste : un exercice sur table gratuit ou à prix symbolique avec un lieu (Metafore, un cinéma), en passant par le retour d'expérience, puis un bureau d'études comme revendeur. Aucun chiffre de pipeline n'existe |

## Ce qui reste à faire (hors de ma portée publique)
1. Tarif réel d'un exercice ou d'une étude : demander un devis anonyme à 1Point2, CNPP ou Elvia, ou poser la question au premier entretien.
2. Montant et titulaire du marché 2022 de la Ville de Paris (fichier DECP, voir `etat-art-6` pour la question à Adem).
3. Dénombrement officiel des ERP de catégories 1 à 4 (France et Paris) : demander à la DGSCGC ou à la Préfecture de police.
4. Exploitant actuel de l'Accor Arena, successeur du directeur du Forum, nature exacte de la relation « hôtel Rana » (`15`) : à confirmer par Titouan avant tout message.
