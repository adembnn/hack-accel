# Qui achète : taille de marché et chemin vers les 3 premiers clients

Date : 22 oct. 2026. Règle : un lien par chiffre, sinon `[?]`. Complète `idee-evacuation-4-marche.md` et `etat-art-6-acheteurs-et-marches-publics.md` (non refaits).
Décision débloquée : quels chiffres de marché montrer au jury, et quel plan pour signer 3 clients.

## Version simple
Il y a en France environ 24 000 lieux qui reçoivent plus de 800 personnes, et à peu près 180 000 en Europe. À 10 k€ par lieu et par an, cela fait 240 M€ en France et 1,8 Md€ en Europe. Mais personne n'est obligé d'acheter en France : le déclencheur est l'incident du 19 oct. (3 000 personnes sorties de l'UGC des Halles) et, au Royaume-Uni, une loi qui entre en vigueur en 2027. Deux faits changent le tableau précédent : Onhys, le concurrent français, a fermé en 2023 ; et Milipol n'a pas lieu cette année.

Mini-glossaire. *TAM* = marché total si chaque lieu possible achetait. *SAM* = la part qu'on peut servir avec notre offre et nos pays de départ. *SOM* = ce qu'on peut raisonnablement prendre en 3 ans. *ARR* = revenu annuel récurrent (abonnements). *Prescripteur* = acteur qui recommande sans payer. *ERP* = établissement recevant du public.

## 1. Nombre de lieux (les données)

| Zone | Donnée | Source | Fiabilité |
|---|---|---|---|
| France, tous ERP | ~2 millions d'ERP, ~80 % en 5e catégorie | https://douzepointcinq.com/blog/etablissement-recevant-du-public-erp-normes-et-obligations | faible (blog d'un éditeur, pas un chiffre d'État) |
| France, 1re et 2e catégorie | **introuvable** : aucun recensement publié trouvé (le registre existe : chaque SDIS tient la base des ERP de son département, art. R143-40) | https://amf53.asso.fr/wp-content/uploads/2025/07/Guide_ERP_2025.pdf | `[?]` à demander à 2 SDIS ou à la DGSCGC |
| France, cinémas | 2 028 établissements dont 240 multiplexes (8 écrans et plus), 2021 | https://www.occitanie-films.fr/wp-content/uploads/2022/09/Ge%CC%81ographie-du-cine%CC%81ma-2021.pdf (CNC) | bonne |
| Royaume-Uni | 928 554 lieux ouverts au public ; 178 900 concernés par Martyn's Law dont **24 300 de 800 personnes ou plus** et 154 600 de 200 à 799 | https://www.gov.uk/government/publications/terrorism-protection-of-premises-bill-2024-impact-assessment/terrorism-protection-of-premises-bill-impact-assessment-accessible | bonne (étude d'impact du Home Office, 2024) |
| États-Unis | NFPA 101 : « classe A » = 1 000 occupants ou plus ; **aucun décompte national trouvé** | https://evacplangenerator.com/articles/nfpa-101-occupancy-classifications-guide | `[?]` |
| Allemagne | Sicherheitskonzept obligatoire au-dessus de 5 000 places ; aucun décompte | https://futuratickets.com/en/blog/aforo-seguridad-eventos-alemania-vstaettvo | moyenne |

Faute de décompte français, **j'extrapole le chiffre britannique par la population** : la France (69,1 M d'habitants au 1er janv. 2026, INSEE https://insee.fr/fr/statistiques/8996934?sommaire=8996963) et le Royaume-Uni sont proches (≈ 69 M, de mémoire `[?]`). Hypothèse : la France compte autant de lieux de 800 personnes ou plus que le Royaume-Uni, donc **≈ 24 000**. Europe (UE + Royaume-Uni, ≈ 520 M d'habitants) : ×7,5, soit **≈ 180 000**. États-Unis (≈ 335 M) : ×4,9, soit **≈ 120 000**. Marge d'erreur réaliste : ±50 %. Ces lieux incluent écoles, hôpitaux et lieux de culte, d'où la décote du SAM.

## 2. Prix par lieu : l'hypothèse et ses ancrages

Hypothèse de départ : **10 k€ par lieu et par an en moyenne** = 85 % des lieux à 8 k€ (entre 800 et 5 000 personnes) et 15 % à 30 k€ (plus de 5 000 : stade, gare, centre commercial). Cela donne 11,3 k€, arrondi à 10 k€ par prudence. Les 85 % / 15 % sont une hypothèse `[?]`.

Ancrages (ce que le client paie déjà ou paierait à côté) :
- Logiciel de simulation d'évacuation : Pathfinder 2 640 à 3 960 USD/an par poste (https://www.thunderheadeng.com/pathfinder/pricing) ; LEGION à partir de 16 330 USD/an (https://www.bentley.com/en/products/legion).
- Étude livrée par un bureau d'études : environ 20 k€ par espace voyageurs à la RATP en 2018 (279 k€ pour ~14 espaces, calcul de `etat-art-6`).
- Coût de conformité Martyn's Law estimé par le Home Office : 3 313 £ par lieu standard et 52 093 £ par lieu renforcé, sur 10 ans, valeur actualisée (même lien que ci-dessus), soit **≈ 330 £/an et ≈ 5 200 £/an** de temps de gestion. Un outil à 8 k€/an coûte donc plus que toute la conformité estimée d'un lieu renforcé : il doit se justifier par autre chose que l'obligation (incident, assurance, exercices).
- Un blog de business plan donne 12 à 30 k$/an pour une petite licence et 20 à 75 k$ par étude (https://financialmodelslab.com/blogs/business-insights/crowd-simulation) : **source peu fiable** (valeurs « illustratives »), non utilisée dans les calculs.

Sensibilité du TAM France (24 000 lieux) : à 3 k€ (prix Pathfinder) = 72 M€ ; à 10 k€ = 240 M€ ; à 30 k€ = 720 M€.

## 3. TAM / SAM / SOM

| Niveau | Calcul (hypothèses visibles) | Résultat |
|---|---|---|
| **TAM France** | 24 000 lieux × 10 k€ | **≈ 240 M€/an** |
| **TAM Europe (UE + Royaume-Uni)** | 180 000 × 10 k€ | **≈ 1,8 Md€/an** |
| **TAM États-Unis** | 120 000 × 10 k€ | **≈ 1,2 Md€/an** |
| **SAM (France + Royaume-Uni)** | (24 000 + 24 300) lieux × 50 % de « lieux à flux » (commerce, spectacle, sport, transport, expositions, hôtels ; hors écoles, hôpitaux, cultes) × 10 k€ | 24 150 lieux, **≈ 240 M€/an** |
| **SOM à 3 ans, méthode A (part)** | 2 % des 24 150 lieux du SAM = 483 lieux × 10 k€ | **≈ 4,8 M€ d'ARR** |
| **SOM à 3 ans, méthode B (canaux)** | 15 partenaires (bureaux d'études, intégrateurs, sociétés de sécurité) × 25 lieux/an × 10 k€ | **≈ 3,75 M€ d'ARR** |

Le « 50 % » et le « 2 % » sont des hypothèses `[?]`. Les deux méthodes donnent 4 à 5 M€ d'ARR à 3 ans ; cela décrit un début d'activité, pas un fonds-qui-investit : à dire tel quel.

Vérification par le haut (le TAM est-il plausible face aux dépenses réelles ?) :
- Sécurité privée en France : **11,12 Md€ HT en 2023**, 5 012 entreprises, 210 500 salariés, 86 % de marchés privés (panorama AKTO, via https://experys.net/ressources-marche-securite-privee-telesurveillance ; confirmé en seconde main par https://coredinate.de/fr/blog/securite-evenementielle-2026). Notre SAM France (120 M€) = **1,1 %** de ce chiffre : cohérent.
- Sécurité privée Europe : de 35 Md€ (CoESS, ancien : https://lobbyfacts.eu/datacard/confederation-of-european-security-services?rid=61991787780-18&sid=88825) à plus de 40 Md€ (CoESS cité par https://euro-security.de/en/european-rules-national-markets-kritis-is-transforming-the-european-security-market), 76,5 Md€ (IBISWorld 2026 : https://ibisworld.com/europe/industry/private-security-services/200306), 104,4 Md$ (R&M / MarketLine 2024 : https://researchandmarkets.com/reports/6093489/security-services-in-europe). Écart de 1 à 3 selon le périmètre. Un autre rapport donne 157 Md$ mais y inclut la cybersécurité : **à écarter**. Notre TAM Europe (1,8 Md€) = 2 à 5 % de ces bases.
- Sécurité privée monde : 259 Md$ en 2025 (Straits, https://straitsresearch.com/report/private-security-market) à 295 Md$ (PW Consulting, fiabilité faible, voir §4).
- Budget des JO 2024 : environ 22 000 agents privés et 320 M€ (blog Coredinate, peu fiable ; l'ordre de grandeur concorde avec les ~0,3 Md€ du comité d'organisation de `idee-evacuation-4`).

Lecture : le TAM dépasse ce que l'on dépense aujourd'hui en logiciels de foule ; c'est un potentiel (chaque lieu achète), pas un marché existant. Un partner le remarquera : le dire avant lui.

## 4. Rapports de marché : montants, éditeurs, fiabilité

J'ai lu des extraits publics, jamais les rapports payants. Les écarts entre éditeurs sont de 1 à 16 : **aucun de ces chiffres ne se cite seul**. Fourchettes utilisables en slide : « 2 à 3 Md$ » pour la gestion de foule, « quelques Md$ » pour la gestion d'urgence.

| Thème | Chiffres relevés (année de base 2025) | Éditeurs | Verdict |
|---|---|---|---|
| Gestion de foule (systèmes) | 1,73 Md$ ; 2,46 Md$ ; 2,5 Md$ ; 2,86 Md$ ; Europe 0,69 à 0,74 Md$ | Research and Markets https://researchandmarkets.com/reports/6075275/crowd-management-systems-market-report ; PW Consulting https://pmarketresearch.com/worldwide-crowd-management-system-market-research-2024-by-type-application-participants-and-countries-forecast-to-2030 ; TrendX https://trendxinsights.com/syndicated-market-research-reports/crowd-management-systems-market | bande 2 à 3 Md$ : utilisable comme ordre de grandeur |
| Gestion de foule et sécurité d'événement (inclut les agents) | 27,4 Md$ ; 28,6 Md$ ; 3,2 Md$ (services, market.us) | Dataintelo https://dataintelo.com/report/crowd-management-services-market ; MarkWide https://markwideresearch.com/crowd-management-and-event-security-market | **peu fiable** : le périmètre englobe la main-d'œuvre de sécurité |
| Logiciel de gestion d'urgence | 0,42 ; 1,65 ; 3,46 ; 5,35 ; 8,65 Md$ selon l'éditeur | Global Growth Insights, Dataintelo https://dataintelo.com/report/emergency-management-software-market, TrendX https://trendxinsights.com/syndicated-market-research-reports/emergency-management-software-market, Premium Market Insights, Market Research Intellect | **peu fiable** : écart de 1 à 20 |
| Notification de masse | 4,2 ; 12 ; 14,2 ; 16,9 ; 20,7 ; 25,7 Md$ | MarketsandMarkets https://marketsandmarkets.com/Market-Reports/mass-notification-market-1248.html ; Grand View https://grandviewresearch.com/industry-analysis/mass-notification-system-market (64,8 % de matériel) ; Mordor https://mordorintelligence.com/industry-reports/mass-notification-systems-market | marché réel mais surtout du matériel (sirènes, haut-parleurs) ; prendre 14 à 17 Md$ (éditeurs établis), pas 25 |
| Jumeau numérique de bâtiment | 1,73 ; 2,1 ; 2,9 ; 4,2 ; 9,8 Md$ ; croissances de 17 % à 44 %/an | R&M https://researchandmarkets.com/reports/6103522/digital-twin-buildings-global-market-report ; Straits https://straitsresearch.com/report/building-twin-market ; Dataintelo https://dataintelo.com/report/building-digital-twin-market | **peu fiable** : le 44 %/an est invraisemblable ; marché surtout énergie et maintenance, pas sécurité |

Signaux de fiabilité : les pages de PW Consulting (pmarketresearch.com) mélangent « Million » et « Billion » dans le même texte (par ex. gestion d'urgence « 155 Million » puis « 155 Billion ») ; Dataintelo et MarkWide ont des périmètres qui ne se recoupent pas. Deux sites sur Martyn's Law donnent des chiffres contraires au Home Office (650 000 lieux et seuil de 100 personnes chez Priority First ; 7 000 lieux renforcés chez Blend) : **ne pas les citer**, le chiffre officiel est 24 300.

## 5. La slide « marché » en 4 lignes
1. Environ 24 000 lieux français accueillent 800 personnes ou plus, et 180 000 en Europe (chiffre officiel britannique de 24 300, ramené à la population ; à confirmer).
2. À 10 k€ par lieu et par an (un logiciel de simulation seul coûte déjà 3 à 16 k$) : 240 M€ en France, 1,8 Md€ en Europe, 1,2 Md€ aux États-Unis.
3. Départ : France et Royaume-Uni, 240 M€ ; au Royaume-Uni, Martyn's Law (en vigueur 2027) impose aux 24 300 grands lieux un plan écrit, sous peine de 18 M£ ou 5 % du chiffre d'affaires.
4. Déclencheur local : le 19 oct., sur ordre de la préfecture, 3 000 personnes ont été sorties de l'UGC des Halles ; le cinéma a été prévenu à 19 h 30.

Sources de la ligne 4 : https://www.telerama.fr/cinema/a-paris-le-cinema-ugc-cine-cite-les-halles-evacue-en-derniere-minute-a-cause-du-couvre-feu-7033457.php ; https://www.24heures.ch/couvre-feu-a-paris-3000-spectateurs-evacues-dun-cinema-ugc-628843041687. Pénalité Martyn's Law : https://apexinsurancebrokers.co.uk/martyns-law-explained (entrée en vigueur « printemps 2027 », date officielle `[?]`).

## 6. Ce qui a changé depuis le rapport précédent
- **Onhys a fermé le 8 nov. 2023**, après 8 ans, une équipe d'une douzaine de personnes, une première levée de 500 k€ (juillet 2018) et des clients comme la SNCF (gare Saint-Charles) : fin « faute de financement à court terme » (https://www.sophianet.com/article/startup-faute-financement-court-terme-aventure-onhys-terminee). `etat-art-6` le présentait comme concurrent direct : il ne l'est plus. Deux lectures : la place est libre en France ; et un éditeur de simulation de foule ne s'est pas financé en 8 ans. Les deux sont à dire.
- **Milipol n'a pas lieu en 2026** : édition les années impaires (la dernière : 18-21 nov. 2025 ; la prochaine : 16-19 nov. 2027, Paris Nord Villepinte). Source : https://milipol.com/en/event/milipol-network ; https://eventsindex.org/events/milipol-paris. Il comporte un espace de pitch pour start-up (Innov'Arena) et des prix « gestion de crise » et « sécurité des grands événements » : à viser en 2027.

## 7. Chemin vers les premiers clients

### Canaux (du plus direct au plus lent)
| Canal | Ce qu'il apporte | Preuve et limite |
|---|---|---|
| Exploitant en direct (cinéma, centre commercial, salle) | décide et paie, mais seul un incident le fait bouger | UGC : incident du 19 oct. Pas d'obligation de simuler en France (`idee-evacuation-4`) |
| Bureaux de contrôle (Socotec, Bureau Veritas, Apave, Qualiconsult) | déjà dans les ERP : vérifications techniques par organismes agréés obligatoires pour les catégories 1 à 4 (art. R143-34) ; vendent l'ESSP | https://www.socotec.fr/nos-solutions/surete-erp-sante/assistance-etude-surete-securite-publique-essp ; ils vendent des heures, un outil qui les réduit peut les gêner `[?]` |
| Bureaux d'études en flux (Ingérop, Explain) | gagnent les accords-cadres RATP, SGP | `etat-art-6` ; achat de productivité |
| Sociétés de sécurité privée | 86 % de leur chiffre d'affaires est privé ; les grands comptes d'événementiel sont chez Securitas, Onet, Samsic (Coredinate, peu fiable) ; ils vendent déjà des plans de déploiement | à tester : un module « plan de déploiement des agents » |
| Pompiers / préfecture / commissions de sécurité | **prescripteurs sans budget** : visitent les ERP de catégories 1 à 4 tous les 2 à 5 ans (https://sdis91.fr/erp) ; la préfecture a ordonné l'évacuation de l'UGC | aucune ligne budgétaire « simulation » trouvée (`etat-art-6`). Les approcher pour la crédibilité, pas pour le chèque |
| Assureurs | aucune source ne montre qu'un assureur exige une étude de foule | `[?]` : 2 appels à faire |
| Aiven / Accel | Aiven for Startups : 12 k$ à 100 k$ de crédits sur 12 mois, avec affiliation à un fonds ou à un partenaire (https://aiven.io/startups) | **crédits d'infrastructure, pas des clients**. Ne pas compter dessus pour les 3 premiers ; demander à Accel des introductions vers des sociétés de son portefeuille qui exploitent des lieux `[?]` |

### Achat public d'innovation
- L'article R2122-9-1 permet d'acheter un service innovant de moins de 100 000 € HT **sans publicité ni mise en concurrence** (décret du 13 déc. 2021) : https://code-commande-publique.com/article-r2122-9-1. **Réserve** : un cabinet précise que les marchés de défense et de sécurité ne peuvent plus passer par ce mode (https://lgp-avocats.fr/commande-publique/le-dispositif-dachat-innovant-est-perennise-dispense-de-publicite-et-de-mise-en-concurrence-pour-les-achats-innovants-inferieurs-a-100-000-euros-ht). Un outil de préparation d'événement pour une ville n'est sans doute pas un « marché de sécurité » au sens du code `[?]` : à faire valider par un juriste avant de le promettre.
- Marchés de référence déjà connus : RATP 279 k€ (2018), SGP 1 M€ plafond (2020), Ville de Paris DGJOPGE 2 mois (2022), IDFM 1,5 M€ par 24 mois (`etat-art-6`). Pas de programme national d'achat d'innovation en sécurité des foules trouvé en une passe `[?]`.

### Salons
- **Expoprotection : 3 au 5 nov. 2026**, Paris Expo Porte de Versailles, pavillon 5.1, 9 h 30 à 18 h (17 h le dernier jour) : https://expoprotection.com/en-gb/useful-info.html. Chiffres d'affluence discordants : 660 exposants et 14 500 décideurs (https://parisjetaime.com/eng/convention/event/expoprotection-e2514) contre 520 exposants et 17 700 visiteurs (agrégateur). Une rubrique « Expoprotection Connect » prend des rendez-vous à l'avance. **Seul salon pertinent dans les 30 jours.**
- Fête des Lumières de Lyon, 5 au 8 déc. 2026, annoncée à 2 à 3 millions de visiteurs (blog touristique, `[?]`) : https://globalsilentwalks.com/en/france/lyon-fete-lumieres-december-guide-2026. Le plan de sécurité et le programme sortent début novembre.

### Premiers comptes atteignables en 30 jours (raisons vérifiées, contacts non vérifiés)
| # | Compte | Raison | Entrée |
|---|---|---|---|
| 1 | **UGC, Ciné Cité Les Halles** | incident du 19 oct. : 27 salles, 3 000 personnes, prévenu à 19 h 30 par la Ville de Paris ; séances annulées depuis (Ouest-France https://www.ouest-france.fr/cinema/un-cinema-ugc-evacue-en-pleines-projections-a-paris-a-cause-du-couvre-feu-les-spectateurs-en-colere-9713fd42-cd4f-11f1-af51-804fa8efc454) ; couvre-feu renouvelé depuis (https://sortiraparis.com/en/news/in-paris/articles/355276-curfew-in-paris-can-cinemas-and-theatres-shut-down-in-the-middle-of-a-showing) | directeur du site ou direction d'exploitation `[?]`; offre : « rejouer votre soirée du 19 » |
| 2 | **Centre commercial des Halles** (exploitant à confirmer `[?]`) | des spectateurs rapportent que le centre a fermé vers 20 h (actu.fr https://actu.fr/ile-de-france/paris_75056/vous-nous-avez-quand-meme-fait-payer-la-colere-des-spectateurs-apres-l-evacuation-de-l-ugc-de-chatelet_64948689.html), témoignage non vérifié | direction du centre `[?]` |
| 3 | **Ville de Paris, DGJOPGE** | a déjà acheté une simulation de flux pour un événement (2022) ; a prévenu l'UGC ; Noël et fin d'année à venir | l'agent qui a passé le marché de 2022 : demander titulaire et montant |
| 4 | **Ville et préfecture de Lyon** | Fête des Lumières les 5-8 déc. ; le préfet a interdit toute manifestation le 24 oct. (Le Monde https://lemonde.fr/societe/live/2026/10/22/en-direct-manifestations-du-17-octobre-un-conseil-de-securite-en-cours-a-l-elysee-un-second-suspect-interpelle-en-lien-avec-l-incendie-de-la-mairie-de-limoges_6795855_3224.html) | service événementiel de la Ville `[?]` ; pilote à livrer avant le 5 déc. |
| 5 | **Un bureau de contrôle** (Socotec ou Bureau Veritas) | canal, pas client final : un cas d'ESSP ou d'ERP de catégorie 1 en pilote | croisé à Expoprotection |
| 6 | **Une société de sécurité d'événementiel** | outil de plan de déploiement | croisé à Expoprotection |

Le 24 oct. (journée de mobilisation, dispositif « massif », Sentinelle, interdictions locales) sert de cas d'école en direct, sans y ajouter d'hypothèse de notre part.

### Pilote type
- **Durée** : 4 semaines. Semaine 1 : jumeau du lieu construit à partir des données publiques et du plan du client. Semaine 2 : 3 incidents du catalogue posés avec le responsable sécurité. Semaine 3 : une séance d'exercice à froid avec l'équipe. Semaine 4 : restitution écrite remise au seul exploitant (garde-fou de `idee-evacuation-4` §4).
- **Prix proposé** : **4 900 € HT** forfait, déduit de l'abonnement de 8 k€/an si signature sous 30 jours. Ancrages : un quart du prix RATP par espace (~20 k€) et 1,5 fois une licence Pathfinder. Hypothèse `[?]` : à valider par Adem (argent).
- **Critères de succès mesurables** (à écrire dans le bon de commande) :
  1. temps de construction du jumeau : 2 h de travail côté client au maximum ;
  2. fidélité : temps d'évacuation simulé à ±20 % d'une mesure de référence du client (exercice passé ou étude existante), sinon les 3 goulots simulés recoupent ceux qu'il connaît déjà ;
  3. au moins 1 constat nouveau que le responsable sécurité valide par écrit ;
  4. il rejoue seul au moins 5 scénarios en séance ;
  5. conversion : abonnement signé ou second site cité au jour 30.
- **Objectif honnête sur 30 jours** : 1 pilote payant signé, 2 lettres d'intention nommées. Trois signatures payantes en 30 jours n'est pas réaliste face à des exploitants sans obligation légale ; je le dis pour éviter de surpromettre au jury.

## 8. Ce qui n'est pas sourcé
- Nombre d'ERP français de 1re et 2e catégorie (aucun chiffre publié trouvé) : 24 000 est une extrapolation du Royaume-Uni.
- Décomptes États-Unis, Allemagne, Europe : extrapolés par population, ±50 %.
- Parts de 50 % (lieux à flux), 15 % (> 5 000 personnes), 2 % de pénétration : hypothèses.
- Consentement à payer des exploitants : seulement des ancrages indirects (licences, étude RATP, coût Martyn's Law). Aucun exploitant n'a dit « 8 k€ ».
- Exigence d'assureurs : rien.
- Exploitants exacts des Halles et de l'Accor Arena, noms de contacts, et si le dispositif R2122-9-1 couvre notre service.
- Date officielle d'entrée en vigueur de Martyn's Law (sources commerciales : « printemps » ou « avril 2027 »).
- Contenu complet des rapports de marché (extraits seulement, jamais les versions payantes) ; plafond du coût d'une étude de foule en France (toujours `[?]`).

## Questions pour Adem (regroupées)
Contexte : le plan vise 1 pilote payant et 2 lettres d'intention, et deux démarches sortent de l'ordinateur (prise de contact, prix).
1. Prix du pilote : a. 4 900 € HT, déduit de l'abonnement (recommandé) / b. gratuit contre données et témoignage / c. 9 800 € HT.
2. Première cible : a. UGC et le centre des Halles, avec le rejeu du 19 oct. (recommandé) / b. Lyon (Fête des Lumières) / c. un bureau de contrôle via Expoprotection. Défaut si tu ne réponds pas : a.
3. Message au jury sur la concurrence : a. dire qu'Onhys a fermé en 2023 faute de financement, et ce que nous faisons différemment (recommandé) / b. ne pas le mentionner.
