# État de l'art : 3D d'un lieu réel + foule, évacuation, confinement, secours (21 oct. 2026)
Décision débloquée : la piste survit-elle aux quatre filtres, qui paie, que construit-on en 7 h ?
Périmètre : foule, évacuation, confinement, secours. Aucun scénario d'attaque, aucun lieu ciblé.
Légende : « testé » = appelé par moi ce soir, sans clé. `[?]` = non vérifié.

## 1. Données 3D : ce qu'on a le droit de faire
- **Google 3D Tiles : reconstruction interdite.** Pas de pré-chargement, stockage ni cache. Analyse d'image, interprétation machine, détection d'objets, extraction de géodonnées, usage hors ligne : interdits ([politique Map Tiles](https://developers.google.com/maps/documentation/tile/policies)).
- On peut poser ses propres objets 3D sur les tuiles, à condition qu'ils ne soient pas « extraits, tracés ou dérivés » des tuiles (même page).
- Lire et enregistrer des hauteurs ou distances depuis les tuiles est « dérivé » et interdit ([FAQ Google](https://mapsplatform.google.com/resources/blog/commonly-asked-questions-about-our-recently-launched-photorealistic-3d-tiles/)).
- **Street View : stockage « généralement interdit »**, sauf les identifiants de panorama ([politique](https://developers.google.com/maps/documentation/streetview/policies)). Le texte sur l'analyse ou le ML n'est pas sur cette page.
- EEA : depuis le 8 juil. 2025, le contenu Street View Static ne peut plus servir « avec une carte » ([Google EEA](https://developers.google.com/maps/comms/eea/street-view-static)). Lu dans un extrait, `[?]` sur le texte exact.
- Conclusion : Google sert à regarder, pas à reconstruire. À écarter.
- **BD TOPO (IGN), testé, sans clé** : WFS `data.geopf.fr/wfs/ows`, couche `BDTOPO_V3:batiment`. Sur 500 bâtiments de Paris 8e : 464 ont une hauteur (93 %), 311 un nombre d'étages (62 %). Champs : `usage_1`, `hauteur`, `nombre_d_etages`, `identifiants_rnb`.
- Mais les 2 premiers bâtiments du premier tirage n'avaient pas de hauteur : couverture inégale. Licence BD TOPO : `[?]` (page de licence non ouverte).
- BD TOPO, couche `zone_d_activite_ou_d_interet`, testée : 343 objets sur environ 3 x 2 km (Paris 8e/9e), dont 21 « Enseignement primaire », 9 lycées, 32 salles de spectacle. Écoles et lieux d'événement se retrouvent sans clé. La couche `erp` existe mais a renvoyé 0 objet sur cette zone.
- **LiDAR HD (IGN)** : nuages de points classés (LAZ 1.4), dalles de 1 km, 500 Mo à 2 Go chacune, **Licence Ouverte 2.0**, fiche mise à jour le 30 sept. 2026 ([data.gouv.fr](https://www.data.gouv.fr/datasets/nuages-de-points-lidar-hd/informations)).
- Couverture réelle, testée via l'index WFS `IGNF_LIDAR-HD_METADONNEE:metadata` : 8 villes sur 9 ont une dalle (Paris, Saint-Denis, Lyon, Marseille, Toulouse, Nantes, Strasbourg, Nice ; acquisitions 2021-2024). **Lille : aucune dalle trouvée.** Pourcentage national d'oct. 2026 : non trouvé (objectif annoncé : 100 % fin 2026, [ActuIA](https://www.actuia.com/actualite/les-premiers-modeles-numeriques-issus-du-programme-lidar-hd-sont-disponibles/)).
- L'index donne aussi une URL de modèle de hauteur (MNH, GeoTIFF) par WMS, sans clé. Non téléchargée.
- **OpenStreetMap** : ODbL (mention dans la réponse d'Overpass). Testé : réponse correcte avec un en-tête User-Agent, erreurs 406 et 502 sans. Bâtiments, `entrance=main|yes`, `amenity=school` ([wiki OSM](https://wiki.openstreetmap.org/wiki/Tr:Tag:amenity%3Dschool)).
- Intérieurs dans OSM : aucune statistique trouvée. Mapzen note que cartographier l'intérieur exige une autorisation explicite pour la vie privée et la sécurité ([Mapzen](https://mapzen.com/blog/targeted-editing-campus-mapping/)).
- **Mapillary** : CC BY-SA ([aide](https://help.mapillary.com/hc/en-us/articles/115001770409-Licenses)). Appel à `graph.mapillary.com` sans jeton : HTTP 500 (testé), jeton requis ou panne `[?]`. Originaux non téléchargeables d'après la liste OSM, `[?]`.
- Cadastre Etalab, ortho-images IGN : non testés, `[?]`.
- **Trou majeur : aucune donnée ouverte sur l'intérieur des bâtiments** (couloirs, portes, escaliers).

## 2. Qui a l'obligation légale et le fait à la main
- **Écoles (PPMS)** : la DSDEN rédige le PPMS de chaque école, le maire ou l'EPCI le valide. Un cinquième des PPMS est renouvelé chaque année depuis 2023-2024. PPMS unifié attendu avant la rentrée de sept. 2028 ([Maire-info](https://www.maire-info.com/securite/ecoles-les-modalites-mise-jour-plans-particuliers-mise-en-srete-publiees-article-27684)).
- Les directeurs font **au moins 2 exercices PPMS par an**, hors incendie. Retour d'expérience à la DSDEN et à la collectivité avant le 1er avril. Annuaire de crise à la préfecture, aux forces de l'ordre et au SDIS avant le 15 sept. (même page).
- Support : seulement trouvé « plans de masse » et « plans par bâtiment et niveau » avec organes de coupure ([IRMA](https://irma-grenoble.com/PDF/05documentation/memento_ppms/PPMS_2eme_degre/plans/les_%20plans.pdf)). Format exact (papier, PDF) : `[?]`.
- Volume : 47 400 écoles, 7 000 collèges, 3 700 lycées = 58 100 ([dossier de rentrée 2025-2026](https://www.education.gouv.fr/sites/default/files/2025-09/l-cole-notre-avenir---ann-e-scolaire-2025-2026-441945.pdf), lu dans un résumé de recherche). Mon calcul : au moins 116 000 exercices par an.
- **Hôpitaux** : décret 2024-8 du 3 janv. 2024, art. R. 3131-10 à R. 3131-14 du CSP. Plan de gestion des tensions hospitalières, dont le plan blanc, « un ou plusieurs exercices chaque année » et retour d'expérience ([AP-HP juridique](https://affairesjuridiques.aphp.fr/textes/decret-n-2024-8-du-3-janvier-2024-relatif-a-la-preparation-et-a-la-reponse-du-systeme-de-sante-pour-faire-face-aux-situations-sanitaires-exceptionnelles/)).
- Volume : environ 2 962 établissements de santé fin 2024 : 1 330 publics, 655 privés non lucratifs, 977 cliniques ([DREES](https://drees.solidarites-sante.gouv.fr/sites/default/files/2026-07/ES%202026%20-%20Fiche%2001%20-%20Les%20grandes%20cat%C3%A9gories%20d%27%C3%A9tablissements%20de%20sant%C3%A9.pdf), via recherche).
- **Événements** : dossier de sécurité obligatoire au-delà de 5 000 personnes simultanées, déposé 2 mois avant ([Tarn-et-Garonne](https://tarn-et-garonne.gouv.fr/contenu/telechargement/33895/226445/file/Annexe%202_Dossier%20de%20s%C3%A9curit%C3%A9.pdf)). Déclaration au maire dès 1 500 personnes pour une manifestation lucrative ([Oise](https://www.oise.gouv.fr/index.php/contenu/telechargement/78116/570769/file/formulaire%20V2022.pdf)). Pièces : plans de masse, issues, accès des secours.
- Le dispositif prévisionnel de secours est assuré par une association agréée de sécurité civile ([Var](https://www.var.gouv.fr/contenu/telechargement/34143/227289/file/Vs%20accessibilit%C3%A9%20-%20Dossier%20de%20d%C3%A9claration%20d%27%C3%A9v%C3%A8nement%20-manif%20r%C3%A9cr%C3%A9atives,%20culturelles,%20et%20festives%202.pdf)). Stades de plus de 3 000 places : homologation par arrêté préfectoral ([FFR](https://api.www.ffr.fr/wp-content/uploads/2024/12/annexe-i-installations-sportives-24-25.pdf), lecture `[?]`).
- **Temps passé, qui paie, combien : non trouvé.** Aucun tarif d'étude d'évacuation. Nombre national d'ERP, de stades, d'événements de plus de 5 000 personnes : non trouvé.

## 3. Concurrents
- **Pathfinder (Thunderhead)** : abonnement 2 350 $/an (poste fixe) ou 3 525 $/an (flottant) ; perpétuel 7 850 $ ([page officielle](https://www.thunderheadeng.com/pathfinder/licensing)). Essai complet gratuit.
- **MassMotion (Oasys)** : 30 000 $ la licence en 2015, Flow 7 500 $ ([Architosh](https://architosh.com/2015/06/aia-show-floor-reports-oasys-massmotion-and-massmotion-flow/amp)). Chiffres de plus de 10 ans.
- **Legion (Bentley)** : gares, stades, aéroports ; le Bernabéu a été modélisé par le bureau Buchanan ([Bentley](https://www.bentley.com/?p=54675)). Prix non trouvé. **PTV Viswalk** : sur devis ([Software Advice](https://www.softwareadvice.com.au/software/530928/PTV-Viswalk)).
- **Cesium** : racheté par Bentley le 6 sept. 2024, prix non divulgué ([Bentley](https://www.bentley.com/news/bentley-systems-acquires-3d-geospatial-company-cesium/)). Legion et Cesium sont donc dans la même maison. Esri : non trouvé.
- **Armored Things** (comptage de foule par capteurs, Boston) : 26,8 M$ au total, dont 12 M$ en série A en 2021 ([GlobeNewswire](https://www.globenewswire.com/fr/news-release/2021/08/24/2285559/0/en/Armored-Things-Raises-12m-in-Series-A-Funding-to-Fuel-Growth-in-Crowd-Intelligence-Adds-to-Executive-Team.html)). Clients : Cavaliers, LAFC, Univ. du Tennessee. Rien de 2025.
- **uCrowds** (Utrecht, cofondé par R. Geraerts) : évacuation de la plage de Rotterdam, mairie d'Utrecht ([page Utrecht](https://www.uu.nl/staff/RJGeraerts/0)). Levée non trouvée. Aucune startup française comparable trouvée.
- **Ce qu'ils ne font pas** (mon inférence, `[?]`) : ils partent d'un plan CAD ou BIM saisi à la main, ne lisent pas la donnée publique seuls, et n'ont pas de boucle « proposer une parade, la tester, apprendre ». Les capteurs mesurent le présent, ils ne rejouent pas demain.
- Plancher de prix : un simulateur coûte 2 à 30 k$. Le logiciel seul ne fait pas 100 M€ ; la valeur est dans le travail du bureau d'études ou du service qui l'achète.

## 4. Le rôle de l'agent
- Travail publié le plus proche : arXiv 2509.21868 (Li, Das, Shirado). Simulation à base de LLM d'un grand rassemblement sur un campus, **jusqu'à 13 000 agents**, conçue pendant un an avec l'équipe universitaire de préparation aux urgences. Elle sert à former, régler les évacuations et planifier, pas à prédire ([arXiv](https://arxiv.org/abs/2509.21868)). Un seul terrain.
- Personnalités OCEAN des agents dans une évacuation : consciencieux = suivent mieux les consignes, névrosés = paniquent ([arXiv 2606.31038](https://arxiv.org/pdf/2606.31038), juin 2026).
- Autres : LLM décideur de chaque agent avec traitement par lots (Yang, Zhang, Gu, 2026) ; agents génératifs pour crises (Ntarouis, Geraerts, 2026). Lus dans des résumés, textes non ouverts.
- **Non trouvé** : un travail où le LLM génère les scénarios, propose une parade puis la teste dans un simulateur physique ; un travail où l'agent apprend de vrais exercices.
- Mon découpage (hypothèse) : le simulateur déplace les gens. L'agent lit le site, choisit les cas qui comptent, modifie le lieu (ferme une porte, déplace un point de rassemblement), relance, compare, garde la trace. Sans cette boucle : un simulateur avec un chat collé dessus, filtre 4 raté.

## 5. Faisabilité en 7 h
- 3D du quartier : polygones BD TOPO extrudés avec `hauteur` (93 % sur l'échantillon testé) dans deck.gl, three.js ou CesiumJS (Apache 2.0 selon un listing tiers, `[?]`). Scène non construite par moi ; donnée testée.
- Simulateurs ouverts : **JuPedSim** (LGPLv3, `pip`, modèle de vitesse sans collision, [PyPI](https://pypi.org/project/jupedsim)). **Vadere** (Hochschule München, forces sociales, [article](https://arxiv.org/pdf/1907.09520)), licence non confirmée.
- **Mesure ce soir** : JuPedSim 1.4.2 installé par pip sur le PC d'Adem (Windows, 20 threads), pas de temps 0,05 s, 10 s simulées, environ 0,4 personne/m², sortie de 20 m.
- 500 agents : 0,2 s de calcul (x57 le temps réel). 2 000 : 0,8 s (x12). **10 000 : 7,6 s (x1,3). 40 000 : 22,8 s (x0,44).**
- Lecture : 10 000 personnes tiennent en quasi temps réel. 40 000 prennent environ 23 min de calcul pour 10 min simulées (extrapolation). Mesure basse : foule clairsemée au départ, un vrai bouchon à la sortie coûte plus. Non mesuré.
- Pour 7 h : viser 2 000 à 5 000 agents, calcul avant la démo, rejeu fluide. Modal pour lancer 5 scénarios en parallèle (crédits disponibles).
- Risque technique n°1 : fabriquer la zone praticable (« terrain moins bâtiments » avec shapely, sans intérieur). Une issue mal dessinée dans la donnée donne une simulation fausse sans erreur visible.
- Coût : chaque boucle d'agent appelle un LLM payant. Accord d'Adem avant tout test chiffré.

## 6. Risques
- **Double usage** : un outil qui chiffre goulots et temps d'arrivée des secours d'un lieu réel peut servir à qui voudrait nuire. Parades : démo sur un lieu public à événements, pas une école ; sorties en avant/après de parades, jamais de scénario hostile ; aucune donnée nominative.
- **Écoles** : le PPMS contient les plans de coupure (gaz, électricité). Aucune règle officielle de diffusion trouvée, mais le contenu est sensible, et ce sont des mineurs. À éviter en démo.
- **Jury Accel** : aucune source sur leur sensibilité. Avis personnel : un fonds aime « sécurité », décroche si ça ressemble à de la surveillance ou au ciblage de lieux.
- **Carte de rejet** : « l'agent rédige le PPMS ou le dossier de sécurité » = paperasse, rejeté. Il doit tester des décisions, pas remplir des cases.
- Sites protégés en France : aucune restriction trouvée sur BD TOPO et LiDAR HD ; zones masquées par l'IGN non cherchées `[?]`.

## Verdict contre les quatre filtres
1. Rien à installer : **fragile.** Extérieur et hauteurs : passe (testé sans clé). Intérieur et effectifs : aucune donnée publique, le client devrait les fournir.
2. Effet wow : **passe** si le juré modifie le lieu en direct (ferme une porte) et que l'agent refait la sortie sous ses yeux. **Fragile** si c'est une jolie foule en 3D, déjà vue.
3. Commercialisable : **fragile.** Obligations réelles (58 100 écoles et lycées, environ 2 962 établissements de santé, événements de plus de 5 000 personnes) mais payeurs publics, lents, prix non trouvé. Concurrent à 2-30 k$. Marché de 100 M€ : non démontré.
4. L'agent fait un vrai travail : **fragile.** Passe seulement avec la boucle « scénario, parade, test, comparaison, mémoire ». Les exercices réels existent (2 par an et par école), mais aucune donnée d'exercice n'est publique.
- **Globalement : survit en version étroite** (événement ou quartier extérieur), pas sur l'intérieur d'une école.

## Les 3 meilleures formes de la piste
1. **Rejouer la sortie d'un événement.**
   - Utilisateur : responsable sécurité d'une salle ou d'un festival de plus de 5 000 personnes qui dépose un dossier de sécurité.
   - Donnée : BD TOPO, OSM, MNH LiDAR HD, jauge saisie.
   - Agent : génère 5 cas (porte fermée, métro en retard, pluie), teste, propose une parade, la rejoue, garde le résultat.
   - Wow : le juré ferme une sortie à voix haute, 4 000 points se reroutent, le temps de sortie passe de X à Y.
   - % LLM : 30 %.
2. **Faire entrer les secours dans la foule.**
   - Utilisateur : association agréée de sécurité civile ou SDIS qui place postes de secours et ambulances.
   - Donnée : BD TOPO routes, OSM, hôpitaux proches.
   - Agent : teste des itinéraires d'ambulance contre la densité, déplace le poste, mesure le temps d'arrivée.
   - Wow : une ambulance reste bloquée sur la carte 3D, l'agent déplace le poste de 80 m, elle passe.
   - % LLM : 12 %.
3. **Mise à l'abri ou évacuation d'un quartier.**
   - Utilisateur : mairie, service sécurité civile (plan communal de sauvegarde), face à une inondation ou un risque industriel.
   - Donnée : MNT LiDAR HD (relief), BD TOPO, OSM. Source du risque (Géorisques) non vérifiée `[?]`.
   - Agent : compare « rester » et « partir » par rue, propose les points de rassemblement, rejoue avec une route coupée.
   - Wow : l'eau monte sur le relief réel d'une rue que le juré connaît ; l'agent change l'ordre de départ des quartiers.
   - % LLM : 8 %.
- Probabilités : jugement, pas mesure.

## Ce que je n'ai pas trouvé
- Texte exact des conditions Google (Street View : analyse, ML) et du texte EEA ; licence BD TOPO ; Cadastre Etalab et ortho IGN non testés.
- Couverture LiDAR HD nationale en pourcentage ; dalle de Lille absente de l'index.
- Prix d'une étude d'évacuation, d'un PPMS, d'un dossier de sécurité ; nombre national d'ERP, de stades, d'événements de plus de 5 000 personnes ; temps passé par un directeur ou un organisateur.
- Prix actuels de Legion, Viswalk, MassMotion ; levée de uCrowds ; Esri.
- Format de support du PPMS ; règle de diffusion du PPMS ; texte officiel de la circulaire (education.gouv.fr en 403).
- Travail publié où un LLM génère des scénarios puis teste des parades ; apprentissage à partir d'exercices réels.
- Temps de calcul avec bouchon réel ; licence Vadere ; scène 3D construite.
- Réaction possible d'un jury Accel : aucune source, avis personnel.
