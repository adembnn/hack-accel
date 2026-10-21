# 2. Idées, salve 3 (21 oct. 2026, soir)

**Pourquoi une salve 3.** La salve 2 (caméras et flux) était « pas trop mal » mais il fallait installer du matériel, il n'y avait pas d'effet wow, et les marchés étaient trop petits pour un fonds. Quatre filtres ajoutés au cadrage (`0-cadrage.md`, points 9 à 11) : rien à installer, un vrai moment wow, un marché qu'Accel financerait, un agent qui fait le travail d'un professionnel payé. Brief commun : `2-idees-brut/salve-3/0-brief-salve-3.md`. Salves 1 et 2 archivées dans `2-idees-brut/`.

**Méthode.** Six agents Sonnet, contexte neuf, 5 recherches web chacun au plus. 41 idées. % = chance qu'un autre LLM propose l'idée (estimation, pas une mesure). Prix et tailles de marché : estimations des agents, presque toutes `[?]`. Sorties complètes avec sources : `2-idees-brut/salve-3/`.

**Convergence (pas un signal de qualité).** Trois agents sur six ont sorti le dossier d'évaluation clinique des dispositifs médicaux. C'est donc l'idée la plus « attendue » de la salve, même si chaque agent l'estime sous 20 %.

## Top 10 (sélection de la session, contre les quatre filtres)

| # | L'idée, simplement | Ce qu'il remplace et ce que ça coûte | Le moment wow | Donnée à 9h | % |
|---|---|---|---|---|---|
| 1 | **Dossier de crédit d'impôt recherche** : l'agent lit l'historique du code d'une startup et écrit le dossier fiscal qui récupère jusqu'à 30 % de ses dépenses de R&D | Cabinets de conseil payés 10 à 20 % du crédit `[?]` ; le crédit coûte ~7 Md€/an à l'État `[?]` | On colle l'adresse d'un dépôt public, la frise des approches abandonnées apparaît, le dossier de 40 pages et le montant sortent | Dépôts GitHub publics, HAL, arXiv, Crossref, guide officiel `[?]` | 6 % |
| 2 | **Le vrai bénéfice avant un rachat** : l'agent lit toute la comptabilité d'une PME et rend le bénéfice retraité qu'un fonds paie à un cabinet | Due diligence financière à 40-150 k€ et 3 à 6 semaines `[?]` | « Un million d'écritures, onze minutes, 180 000 € de charges de 2023 passées en 2024 », chaque ajustement ouvre ses écritures | Fichier comptable standard français (FEC) ; échantillon public non vérifié `[?]` | 15 % |
| 3 | **Les limites du prêt recalculées** : l'agent lit un contrat de crédit de 200 pages et vérifie chaque trimestre que l'emprunteur respecte ses limites, selon la définition propre à ce contrat | Analyste de suivi de dette privée, 70-100 k€ `[?]` | « Il a trouvé le dépassement, parce que ce contrat interdit l'exclusion que tout le monde fait », la phrase du contrat surlignée | Contrats et comptes de sociétés cotées sur EDGAR, sans compte `[?]` | 12 % |
| 4 | **Le dossier clinique d'un dispositif médical** : l'agent écrit le rapport de 60 à 80 pages qu'exige l'Europe pour chaque appareil médical, chaque phrase reliée à l'étude source | Consultant réglementaire, 15 à 60 k€ par rapport, 2 à 3 mois `[?]` | Le jury choisit un appareil, 400 articles lus, 31 retenus, rapport sorti en 3 min, on clique une phrase et l'étude s'ouvre surlignée | PubMed, Europe PMC, incidents FDA (MAUDE), fiches 510(k) `[?]` | 8-18 % |
| 5 | **La perte d'un séisme en six minutes** : quand une catastrophe frappe, l'agent croise l'événement avec les biens assurés d'un réassureur, lit ses contrats et donne la perte nette | Analyste en modélisation de catastrophes ; les éditeurs de modèles répondent en 1 à 3 jours `[?]` | « Séisme à 14 h 03, perte du portefeuille à 14 h 09 », 40 000 sites qui s'allument, la clause qui plafonne la perte | Flux public des séismes USGS ; portefeuille synthétique à annoncer `[?]` | 7 % |
| 6 | **Sinistres agricoles triés par satellite** : après un orage, l'agent compare avant et après sur chaque parcelle déclarée et rédige l'expertise | Visite d'expert à 150-400 €, semaines d'attente au pic `[?]` | « 9 800 déclarations, une paire d'images pour chacune, 140 montrent des cultures intactes » | Sentinel-2 et Sentinel-1, registre parcellaire ; déclarations à générer `[?]` | 15 % |
| 7 | **Le critère d'essai réécrit en douce** : avant d'investir dans une biotech, l'agent relit toutes les versions du dossier officiel d'un essai et dit si la réussite a été définie après coup | Analyste biotech de fonds, due diligence à 20-60 k€ `[?]` | Le communiqué « succès » à gauche, la ligne du registre modifiée trois semaines avant les résultats à droite | API ClinicalTrials.gov sans clé (vérifiée), historique des versions `[?]` | 7 % |
| 8 | **Le recrutement d'essai qui se corrige** : l'agent prédit combien de patients chaque hôpital recrutera, se compare aux essais réels et écrit lui-même ses leçons | Étude de faisabilité à 20-80 k€, 3 à 6 semaines `[?]` | La courbe d'erreur qui descend d'essai en essai : 40 % d'erreur au départ, 12 % au 61e, avec les leçons en clair | ClinicalTrials.gov, plus de 500 000 essais `[?]` | 14 % |
| 9 | **La pub payée sur des sites que personne ne lit** : l'agent visite chaque site où passent les pubs d'une marque et dit lesquels sont faits pour capter de la pub | Audit média indépendant, 30-150 k€ `[?]` | Un fichier de 38 000 lignes glissé, une capture et un verdict par site, le total d'euros perdus qui monte | OpenSincera, gratuit avec clé (vérifié) ; relevé de placements à fabriquer | 12 % |
| 10 | **Où forer, d'après 60 000 vieux rapports** : l'agent relit 50 ans de rapports de forage scannés et dit à une société minière où creuser | Étude documentaire d'un géologue, 3 à 6 mois `[?]` | Le jury choisit un métal et une zone, 40 000 anciens forages réapparaissent sur la carte pendant que l'agent lit un tableau de 1987 | WAMEX (Australie-Occidentale), 105 000 rapports gratuits (vérifié) | 4 % |

## Les 41 idées, par famille

### A. Finance et investissement (fonds, banques, assureurs)
- Les limites du prêt recalculées (A3, 12 %).
- Le vrai bénéfice avant un rachat, depuis le FEC (A1, 15 %).
- Couvrir les petites sociétés cotées sans analyste, note de 45 pages depuis les comptes officiels (A1, 22 %).
- Contrôle de crédit documentaire à l'export (A3, 8 %) : aucun échantillon réel de documents, filtre 1 raté.
- La perte d'un séisme en six minutes (A6, 7 %).
- Audit cyber extérieur avant un rachat (A4, 24 %).
- Pub payée sur des sites zombies (A2, 12 %).
- Cartels : les réclamations oubliées, pour financeurs de contentieux (A6, 8 %).
- Audit des preuves d'un biotech, images réutilisées dans les articles (A6, 6 %).
- Le critère d'essai réécrit en douce (A2, 7 %).

### B. Santé et sciences de la vie
- Dossier clinique d'un dispositif médical (A1 12 %, A3 12 %, A4 8 %, A5 18 %) : convergence.
- Recrutement d'essai qui se corrige (A4, 14 %).
- Dossier d'accès au marché d'un médicament (A5, 8 %) : savoir de domaine trop lourd.
- Codage des sorties d'hôpital en Allemagne (A1, 9 %) : 60 lettres synthétiques seulement.

### C. Assurance et sinistres
- Sinistres de grêle et d'inondation triés par satellite (A2, 15 %).
- Chiffrer un préjudice corporel avec la jurisprudence (A3, 15 %) : marché France seule sous 100 M€.

### D. Industrie, énergie, matières premières
- Où forer, d'après 60 000 rapports (A4, 4 %).
- Certificat d'acier impossible, faux certificats de matière (A2, 5 %) : échantillons non trouvés.
- Terrains branchés au réseau électrique pour centres de données (A6, 14 %) et pré-étude de raccordement (A3, 28 %).
- Chiffrage d'un bâtiment sur plans (A4, 16 %).
- Plans de travaux en masse pour copropriétés (A6, 12 %).

### E. Conformité européenne (obligations nouvelles)
- Facture carbone de l'acier importé, CBAM (A5, 45 %).
- Dossier déforestation par fournisseur, EUDR (A5 55 %, A2 25 %).
- Emballages conformes au nouveau règlement, PPWR (A5, 12 %).
- Allégations vertes devenues illégales (A5, 30 %).
- Contre-audit des rapports de durabilité, CSRD (A5, 35 %).
- Fiches de sécurité chimiques reclassées, CLP (A5, 7 %).
- Contrôler les étiquettes alimentaires par pays (A1, 8 %).

### F. Commerce international et douane
- Un desk pour les douanes, catalogue réévalué à chaque décret (A6, 15 %).
- Classer les marchandises en douane (A3, 30 %) : éditeurs déjà en place.
- Origine du produit maquillée, contournement antidumping (A2, 8 %).

### G. Juridique, fiscal, affaires publiques
- Dossier de crédit d'impôt recherche (A1, 6 %).
- Mémoire d'influence réglementaire, arguments qui ont fait bouger une règle (A4, 9 %) : données américaines.
- Enquête interne sur 500 000 e-mails (A4, 28 %) : terrain occupé (Relativity, Everlaw).
- Faux sites à l'effigie d'une marque (A2, 25 %) : concurrents solides.
- Chaîne de propriété d'un tableau, provenance d'œuvres d'art (A6, 5 %) : marché sous 100 M€.

## Ce qui reste fragile, à dire honnêtement
- **Les prix et les tailles de marché** sont des estimations des agents, pas des chiffres sourcés.
- **Les accès vérifiés aujourd'hui** sont ClinicalTrials.gov, OpenSincera, WAMEX, filings.xbrl.org, l'API de l'Art Institute of Chicago et Regulations.gov. Le reste est à tester par `curl` à 9h.
- **Aucun membre de l'équipe n'est expert** des métiers du top 10. Les gagnants comparables en avaient un.
