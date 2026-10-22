# Qui paie pour simuler des foules : acheteurs et marchés publics

Date : 22 oct. 2026. Règle suivie : un lien par affirmation, sinon `[?]`. Aucun choix pris pour l'équipe.
Décision débloquée : l'idée garde-t-elle un « qui paie », avec un acheteur nommé et un montant sourcé ?

## Verdict en deux lignes (version simple)
Des acheteurs publics paient bel et bien pour simuler des foules, mais ils achètent **une étude livrée par un bureau d'études**, pas un logiciel, et par accords-cadres de quelques centaines de milliers d'euros à 1 M€. Les 4 marchés trouvés sont tous dans les transports et les grands événements ; je n'ai trouvé **aucune ligne « simulation » chez la préfecture de police ni les SDIS**.

Mini-glossaire : *marché public* = achat d'une collectivité ou d'un établissement public, publié. *BOAMP* = bulletin officiel où ces avis sont publiés. *TED* = son équivalent européen. *Accord-cadre à bons de commande* = contrat plafonné dans lequel l'acheteur commande au fil des besoins ; le plafond n'est pas la dépense réelle. *HT* = hors taxes. *Titulaire* = l'entreprise qui a gagné. *Simulation dynamique de flux* = des personnes virtuelles marchent dans un plan et on mesure bouchons et temps de sortie. *Bureau d'études* = cabinet d'ingénieurs qui vend des études.

## 1. Marchés réels trouvés (méthode : interrogation directe des bases publiques)
J'ai interrogé l'API ouverte du BOAMP (https://boamp-datadila.opendatasoft.com) et l'API de TED (https://api.ted.europa.eu/v3/notices/search) sur les mots du brief. Résultat net : **4 marchés de simulation de flux de personnes**, tous avec acheteur et objet, deux avec montant.

| # | Acheteur | Objet | Montant | Titulaire | Année | Source |
|---|---|---|---|---|---|---|
| 1 | RATP | « Prestation de réalisation de simulations dynamiques de flux voyageurs », environ 14 espaces voyageurs : modélisation, simulations, analyse, rapport | 278 996,25 € HT (plafond, ±50 % possible) | Ingérop (Rueil-Malmaison) | 2018 (conclu 19/09/2018) | https://ted.europa.eu/en/notice/435138-2018/html |
| 2 | Société du Grand Paris (SGP) | « Expertise des flux piétons dans les gares du Grand Paris Express » : simulations dynamiques pour les gares des lignes 15, 16, 17, 18 | plafond 1 000 000 € HT sur 72 mois au maximum (24 mois + 2 reconductions de 24) ; 5 offres reçues | Explain (enregistré sous « Odent Pierre », Montreuil), attribué le 22/07/2020 | 2019-2020 | Avis : https://www.boamp.fr/pages/avis/?q=idweb:19-85460 ; résultat : https://www.boamp.fr/pages/avis/?q=idweb:20-104201 |
| 3 | Ville de Paris, direction des JO et grands événements (DGJOPGE) | « Prestations de simulations de flux (incluant la modélisation du périmètre géographique) dans le cadre d'un événement grand public » ; 2 mois ; tranche ferme et tranche optionnelle | non publié `[?]` | non publié `[?]` (aucun avis de résultat trouvé) | 2022 (avis du 12/07/2022) | https://www.boamp.fr/pages/avis/?q=idweb:22-98315 |
| 4 | Île-de-France Mobilités (IDFM) | Accord-cadre « Assistance à maîtrise d'ouvrage sur les études de circulation » ; la mission 6 est « simulations de flux piétons », parmi d'autres missions (enquêtes, stationnement, impact trafic) | plafond 3 000 000 € sur l'accord, soit 1,5 M€ HT par période de 24 mois, avec une reconduction | jusqu'à 3 titulaires, noms non lus `[?]` | 2024 (avis du 05/11/2024) | https://ted.europa.eu/en/notice/673654-2024/html |

Lecture chiffrée (calcul à partir du tableau, pas une donnée publiée) : le marché RATP représente environ 20 k€ par espace voyageurs (278 996 / 14). Le plafond SGP équivaut à 167 k€ par an au maximum (1 M€ / 6 ans) ; la dépense réelle est inconnue `[?]`.

**Ce que ces marchés disent d'utile**
- La SGP précise le but : vérifier que l'architecture de génie civil tient les objectifs de flux avant les travaux, et préparer les plans de gestion des escaliers mécaniques et ascenseurs « en situation nominale, dégradée ou d'évacuation » (même avis SGP). L'évacuation est donc un cas d'usage payé, mais comme une ligne parmi d'autres d'une étude de conception.
- La procédure SGP est négociée avec 5 offres : ce n'est pas un achat de gré à gré, il y a de la concurrence entre bureaux.
- Le marché Ville de Paris (n° 3) est le plus proche de l'idée : simulation de scénarios pour **un événement grand public**, très court (2 mois), sur un périmètre géographique à modéliser. Il montre qu'une ville paie pour comparer des scénarios d'accueil. Son montant et son titulaire manquent : première question à poser à la DGJOPGE.

**Marchés voisins, à ne pas confondre**
- Comptage de piétons (capteurs, analyses de fréquentation commerciale) : Métropole du Grand Paris 2022 (https://www.boamp.fr/pages/avis/?q=idweb:22-135970), Dunkerque 2023 (https://www.boamp.fr/pages/avis/?q=idweb:23-30265), ANCT 2021 (https://www.boamp.fr/pages/avis/?q=idweb:21-15131). C'est de la mesure du passé, pas de la simulation.
- Simulation de **trafic** (voitures) qui inclut parfois les piétons : Rennes Métropole 2026 (https://www.boamp.fr/pages/avis/?q=idweb:26-11767), Saint-Étienne Métropole 2026, plafond 250 000 € net (https://www.patterno.de/en/ausschreibungen/tender/dienstleistungen-fuer-verkehrszaehlungen-analysen-und-saint-etienne-pjwfe81mgbt3sofx85gj6d2t), Métropole Nice Côte d'Azur 2026 pour la maintenance et l'extension du logiciel VISSIM (simulation de trafic) (https://www.boamp.fr/pages/avis/?q=idweb:26-1125). Ces métropoles achètent donc parfois un logiciel, mais pour le trafic routier.
- Un résumé de recherche attribue à Egis un marché de 60 000 € HT maximum à Nîmes (2024) pour des études de circulation avec simulations dynamiques ; je n'ai pas pu relire l'avis (PDF illisible), donc `[?]`.

**Ce que je n'ai pas pu faire**
- DECP (données essentielles de la commande publique, qui contiennent les montants réellement notifiés) : le fichier consolidé fait 135 Mo par mois et 1 Go au total (https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/). Je n'ai rien téléchargé sans ton accord. Il permettrait de trouver le montant et le titulaire du marché n° 3. `[?]`
- PLACE (profil d'acheteur de l'État) et les plateformes propres de la SNCF, de la RATP, d'ADP : non explorées en dehors de TED. Les notices TED SNCF trouvées (études d'offre de transport régional) ne portent pas sur des flux de voyageurs en gare et sont écartées.
- Les recherches par mots du titre ratent les marchés dont le titre est vague (« étude de circulation »), comme le marché n° 4 qui n'apparaît qu'en cherchant le texte. Les 4 marchés sont donc un plancher.

## 2. Études de flux commandées par les gestionnaires
- **RATP** : voir marché n° 1. Un tarif de référence : ~20 k€ l'espace voyageurs, pour une étude complète modélisation + analyse + rapport.
- **SGP (Grand Paris Express)** : voir marché n° 2. Particularité à retenir : l'étude se fait **avant les travaux** (de l'avant-projet à l'approbation des plans d'exécution), donc le besoin suit le calendrier de conception des gares.
- **IDFM** : voir marché n° 4, 1,5 M€ par 24 mois pour toutes les études de circulation (la simulation piétons n'en est qu'une partie).
- **Ingérop** gagne chez la RATP en 2018 ; **Systra** a utilisé LEGION sur l'extension d'une gare parisienne selon une étude de cas de l'éditeur Bentley, sans montant (résumé de recherche, page non relue `[?]`).
- **SNCF Gares & Connexions, ADP, stades, parcs d'attractions, COJOP** : aucun marché de simulation de flux trouvé sur BOAMP ni TED `[?]`. La start-up Onhys cite pourtant la SNCF (gare Saint-Charles, Marseille) et l'Olympique de Marseille (Vélodrome) comme clients (https://www.lejournaldesentreprises.com/article/la-simulation-des-flux-pietons-donhys-securisera-les-jo-2024-2054304) : achats privés ou non publiés, montants inconnus.
- **Prix d'une journée d'ingénieur** : aucune grille publique trouvée (recherche web sans résultat). Ta fourchette de 800 à 1 500 € par jour reste une hypothèse du brief `[?]`. Avec elle, 279 k€ pour 14 espaces correspondent grossièrement à 190 à 350 jours-ingénieur au total, soit 14 à 25 jours par espace : calcul d'ordre de grandeur, pas une donnée.

## 3. Acheteurs de sécurité publique
- **Préfecture de police de Paris** : recherche BOAMP par nom d'acheteur + mots « simulation, modélisation, foule, vidéoprotection » : 24 résultats, tous sans rapport (consommables médicaux, déminage, simulateur de tir). Aucun marché de simulation de foule trouvé. Exemple de ce qui sort : https://www.boamp.fr/pages/avis/?q=idweb:19-25387 (simulateur d'entraînement au tir).
- **SDIS (pompiers)** : 69 résultats sur « simulation », tous des simulateurs de feu ou de réalité virtuelle pour la formation (ex. SDIS 44, https://www.boamp.fr/pages/avis/?q=idweb:25-81443). Aucune simulation de foule.
- **Ministère de l'Intérieur, salles de commandement, budgets de vidéoprotection de Paris, Lyon, Marseille, Nice** : non trouvés dans cette passe `[?]`. Le seul chiffre rencontré est un budget global de la préfecture de police (budget spécial 2018, 217,4 M€ de contribution de Paris), sans ligne simulation (recherche web, source ancienne, non retenue).
- Conclusion prudente : **je n'ai pas trouvé de ligne budgétaire dédiée à la simulation de foule côté sécurité publique**. Le coût de la sécurité des JO (1,7 Md€) cité dans le rapport précédent est surtout des effectifs. Ne pas le présenter comme marché.
- Le marché n° 3 prouve qu'une direction de la Ville de Paris (grands événements) achète de la simulation de flux pour préparer un événement, ce qui est plus proche de ta cible que la préfecture.

## 4. Autres acheteurs de scénarios de foule
- **Assureurs de l'événementiel** : le risque « mouvement de foule » est reconnu, mais aucune source trouvée ne dit qu'un assureur exige une étude de foule ni ce qu'elle coûte `[?]`. Un article de presse sectorielle parle d'assureurs qui durcissent leurs exigences après des bousculades (https://www.insurancebusinessmag.com/ca/news/hospitality/new-festival-risks--from-crowd-crush-to-needle-attacks--force-insurers-to-rethink-exposure-573134.aspx) : signal faible, aucun montant.
- **Promoteurs de centres commerciaux, villes pour la Fête de la Musique, le 14 juillet, les marathons** : aucun marché trouvé `[?]`. Le seul achat de ville trouvé est celui de la DGJOPGE (n° 3).
- **Aéroports** : aucun marché ADP trouvé. Côté étranger, uCrowds cite Schiphol et le départ du Tour de France à Utrecht (https://webspace.science.uu.nl/~gerae101/index2.html).
- **Organisateurs privés** (Roland-Garros, festivals) : Onhys a testé son jumeau numérique à Roland-Garros en 2020 (même article Journal des Entreprises) ; pas de montant.

## 5. Concurrence sur le marché « décider »
| Acteur | Ce qu'il vend | Prix / taille (source) |
|---|---|---|
| Bentley LEGION | Simulation de piétons, référence des gares et stades | à partir de 16 330 USD l'an, 1 licence (https://www.bentley.com/products/legion) |
| Pathfinder (Thunderhead) | Simulation d'évacuation de bâtiments | 2 640 USD (poste fixe) ou 3 960 USD (flottante) l'an (https://www.thunderheadeng.com/pathfinder/pricing) |
| Arup MassMotion (Oasys) | Piétons, stades, évacuation | ancien prix : 20 000 £ en licence perpétuelle (https://aecmag.com/news/massmotion/) ; prix actuel `[?]` |
| uCrowds (Utrecht) | SimCrowds (appli de bureau) et TerraCrowds (moteur) ; jusqu'à 150 000 piétons selon l'éditeur | 250 k€ de subvention publique néerlandaise en 2018 (https://webspace.science.uu.nl/~gerae101/UU_projects_outreach.html) ; levée récente `[?]`. Partenaire d'Esri sur un jumeau numérique d'événement (post LinkedIn de l'éditeur, billet Esri non relisible : 403) |
| **Onhys (Sophia Antipolis)** | **Start-up française** : simulation de flux et prévision de mouvements de foule ; logiciel lancé fin 2019 ; environ 15 salariés ; 80 % d'activité en sécurité | clients cités : OM/Vélodrome, SNCF Saint-Charles, JCDecaux ; retenue dans un appel à manifestation d'intérêt JO 2024 ; levée de 3 M€ visée en 2023, issue inconnue `[?]` (même article du 14/02/2023) |
| Crowd Dynamics / K. Still | Conseil en sécurité des foules, auteur du modèle LEGION | pas de preuve qu'elle opère encore sous ce nom (https://academyofexperts.org/search-register/profile/g.-keith-still/) |
| « Dynamic Crowd Simulations » | cité dans le brief | introuvable `[?]` |

**À noter** : Onhys est le concurrent français direct et il n'apparaissait pas dans le rapport précédent. Il vend déjà à la SNCF et à un club, avec un label de filière pour les JO.

**Ce que l'idée peut vendre que ces acteurs ne vendent pas** (hypothèses à tester, aucune n'est prouvée) :
- Les marchés trouvés paient la **construction du modèle** (« modélisation du périmètre géographique » dans le marché n° 3, 2 mois ; modélisation de 14 espaces chez la RATP). Un outil qui livre un premier modèle en minutes attaque la ligne la plus chère, que LEGION et Pathfinder laissent à l'ingénieur.
- L'espace public ouvert (rues, abords, parcours) : le marché n° 3 porte sur un « périmètre géographique » d'événement, pas sur l'intérieur d'un bâtiment. Les données ouvertes y suffisent mieux qu'à l'intérieur.
- La comparaison automatique de scénarios (fermeture de rue, de station) : les avis demandent des « hypothèses » multiples (tranche ferme et optionnelle du n° 3), mais aucun produit trouvé ne les génère seul.
- Contre-argument : Onhys, uCrowds et Esri sont déjà sur « jumeau numérique + foule », et un éditeur établi peut ajouter la génération de scénarios.

## 6. Verdict honnête

### Trois acheteurs qu'un partner pourrait appeler demain
| Acheteur | Ce qu'il achète aujourd'hui | Fourchette | Question piège du partner |
|---|---|---|---|
| **RATP** (études de flux voyageurs) | Simulations dynamiques par espace voyageurs, livrées par un bureau d'études (Ingérop en 2018) | 279 k€ HT plafond pour ~14 espaces, soit ~20 k€ l'espace (n° 1) | « Votre modèle est-il accepté par vos ingénieurs au même titre qu'un modèle LEGION validé ? Qui engage sa responsabilité si le temps d'évacuation est faux ? » |
| **Société du Grand Paris** (gares du Grand Paris Express) | Études de flux de conception, y compris cas dégradé et évacuation | plafond 1 M€ HT sur 6 ans au maximum (n° 2) | « Les gares sont conçues avant les travaux : quand elles sont livrées, que reste-t-il à vendre ? » (dépend du calendrier de conception des gares, non vérifié `[?]`) |
| **Ville de Paris, direction des JO et grands événements** | Simulation de flux pour accueillir un événement grand public, 2 mois | non publié `[?]` | « Une commande de deux mois en 2022 : combien d'événements par an, et avez-vous un budget récurrent ou un marché ponctuel ? » |

Variante : **Île-de-France Mobilités** (n° 4) pour comprendre comment une simulation piétons entre dans une enveloppe de 1,5 M€ par 24 mois d'études de circulation.

### Vendre au bureau d'études ou à l'autorité ?
Ce que montrent les faits : dans les 3 marchés où le titulaire est connu ou probable, l'autorité achète l'étude, et **le logiciel reste chez le bureau** (Ingérop, Explain). Les autorités n'achètent un logiciel que pour le trafic routier (Nice, VISSIM, 2026). Tendance donc : **vendre au bureau d'études** (outil qui réduit les jours de modélisation) est plus cohérent avec ce qu'on observe. Réserve : un bureau d'études aura du mal à payer plus cher qu'une licence de 3 à 16 k USD par an ; l'argent est dans les jours économisés, pas dans la licence. Autre voie : être **le prestataire** qui répond à ces accords-cadres avec l'outil en interne, mais cela revient à fonder un bureau d'études. Choix à trancher par l'équipe, pas par moi.

### Ce qui ne tient pas
- Aucune ligne « simulation » trouvée chez la préfecture de police, les SDIS, le ministère de l'Intérieur : le cas « autorité de sécurité qui paie la simulation » n'est pas prouvé.
- Aucun montant réellement dépensé, seulement des plafonds.
- Le marché observé est petit et concentré : 4 marchés en 8 ans sur les bases interrogées, avec des acheteurs de transport dont le besoin suit la conception de nouvelles gares.
- Il y a un concurrent français (Onhys) qui a déjà des clients nommés.

## Questions pour Adem (regroupées)
Contexte : trois appels sont possibles avant le jury, et je n'ai pas pu lire les montants réels (DECP) sans télécharger un gros fichier.
1. Télécharger le fichier DECP (135 Mo à 1 Go, données publiques data.gouv.fr) pour retrouver montant et titulaire du marché de la Ville de Paris ? a. oui, fichier mensuel de 2022 seulement (recommandé) / b. oui, fichier global / c. non, on appelle la DGJOPGE.
2. Faut-il enquêter sur Onhys avant le jury ? a. oui, clients, financement, tarifs (recommandé) / b. non.
3. Quel premier appel ? a. RATP / b. Société du Grand Paris / c. DGJOPGE / d. Ingérop ou Explain (côté bureau d'études).
