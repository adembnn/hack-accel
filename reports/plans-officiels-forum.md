# Plans officiels du Forum des Halles et de Châtelet-Les Halles : ce qui existe, ce qu'on importe

Décision débloquée : peut-on dire « notre jumeau 3D colle au vrai Châtelet-Les Halles, niveau par niveau » ? Recherche faite le 22 oct. 2026 (web + essais réels sur les jeux de données ; fichiers de travail hors dépôt dans `C:\Users\Adem\AppData\Local\Temp\claude\plans-forum\`).

## Réponse courte (version imagée)
Non, pas « niveau par niveau » : aucun plan par niveau, vectoriel et public, du Forum n'existe en ligne. Les vrais plans (plans de sécurité incendie, plans de la Société Civile du Forum / Unibail, plans RATP des salles d'échange) sont privés. Ce qu'on peut dire, et prouver cette semaine : « les 16 accès voyageurs, leurs numéros, leurs coordonnées et les lignes desservies correspondent aux données officielles IDFM/RATP ; les niveaux -3 à -5 de la gare viennent de plans SNCF ; les niveaux -1 à -3 de la galerie marchande sont les couloirs seulement ». Dire « fidèle » sur ce périmètre, « approché » sur les boutiques et le cinéma.

Fait important trouvé : le forum OSM France (sept. 2025, https://forum.openstreetmap.fr/t/comment-cartographier-le-forum-des-halles-a-paris/37441) confirme ce que voit notre scène. Les cartographes de la gare (pour SNCF Transilien) ont eu des plans et des photos pour la gare, « rien pour la galerie marchande » ; ils n'ont dessiné que les couloirs ; le niveau -3 du Forum est « lapidaire » ; niveaux -4 et -5 = seulement la partie gare ; le plan Westfield est jugé « trop peu précis » ; seule vraie source recommandée : photographier les plans d'évacuation sur place.

## 1. Plans du Forum, de la Canopée, d'UGC, des architectes, permis

| Source | URL | Ce que ça montre | Niveaux | Format | Échelle | Droits | Date | Verdict |
|---|---|---|---|---|---|---|---|---|
| Plan Westfield Forum des Halles | https://www.westfield.com/fr/france/forumdeshalles/plan | Annuaire des boutiques par niveau. Page Next.js qui charge un iframe `experience.westfield.com` (carte interactive ; l'URL exacte de l'iframe n'est pas dans le HTML statique, l'adresse devinée renvoie 404, non inspecté plus loin) | Boutiques/restaurants/cinéma, niveaux affichés non vérifiés | Interactif (probablement tuiles/SVG côté client), pas de PDF trouvé | Schématique | © Westfield/Unibail, pas de licence ouverte | actif 2026 | Vérification visuelle seulement. Le forum OSM le dit simplifié. Ne pas vectoriser (droits + schématique) |
| Plans de sécurité incendie affichés dans le Forum | sur place (photos) | Plans d'évacuation par niveau, issues, escaliers de secours, désenfumage | tous | Photo, à redresser | non cotée mais fidèle | usage privé ; prendre en photo dans un lieu public est possible, republier non garanti | en place | **Meilleure source réelle**, recommandée par les cartographes OSM. Demande une visite |
| UGC Ciné Cité Les Halles | https://www.ugc.fr (fiche cinéma) ; fr.wikivoyage « UGC Ciné Cité Les Halles » | Pas de plan de salles ni d'issues publiés. Seuls : adresse, nombre de salles | n/a | n/a | n/a | n/a | n/a | **Aucun plan public trouvé.** Escaliers de secours UGC à relever sur place ou à déduire (ERP : 2 dégagements mini par salle, règle CO 38) |
| PariSeine, fiche projet Les Halles | https://pariseine.fr/projets/les-halles/ | Texte : 7 niveaux de planchers dont 5 souterrains, 60 000 m², 2 000 places de parking, maîtres d'œuvre (Berger, Anziutti ; SEURA) | résumé | Web | n/a | © PariSeine | 2021 | Source citable pour « 7 niveaux dont 5 souterrains » (cohérent avec nos niveaux 0 à -5, plus +1 Canopée) |
| Dossier d'enquêtes publiques 2009 (DUP, permis > 10 000 m²) | BOVP Ville de Paris 10 août 2010 : https://cdn.paris.fr/paris/2020/02/26/2b2b45214a249f3031f61344dd4bb56f.pdf ; bilan concertation : https://cdn.paris.fr/paris/2020/02/26/4e5764f0d4ad4f73877fc78886c5dc05.pdf | Délibérations (texte). Le dossier d'enquête complet (plans de niveaux) n'est pas en ligne dans ce que j'ai trouvé | n/a | PDF texte | n/a | Publication officielle | 2009-2010 | Pas de plans. Utile pour citer des chiffres seulement |
| Permis de construire Halles | Paris Data « Autorisations d'urbanisme » https://opendata.paris.fr/explore/dataset/dossiers-recents-durbanisme | Métadonnées de dossiers (numéro, adresse, objet). Pas de plans. Plans consultables en mairie / sur demande CADA | n/a | CSV | n/a | ODbL | 6 derniers mois | À écarter pour le hack ; piste « demande de communication » à décrire dans l'étape route-vers-utilisateurs |
| PLU Paris | https://www.apur.org / PLU bioclimatique | Zonage, hauteurs, pas d'intérieur | n/a | n/a | n/a | n/a | n/a | Sans intérêt pour l'intérieur |
| Dessins Berger / Anziutti / SEURA | patrickberger.fr (page « Pôle transport Châtelet-Les Halles ») ; Wikimedia Commons (photos CC BY-SA, pas de plans) | Images d'agence, coupes illustratives | schémas | JPG | non | © agence | 2016 | Illustration de la coupe verticale (Canopée, patio Pina Bausch), pas de géométrie utilisable |

## 2. RATP / IDFM

### 2a. Liste des accès : validée par un vrai appel (c'est notre meilleur résultat)
Jeu de données IDFM « Référentiel des arrêts : Accès » (`acces`) et « Relations accès » (`relations-acces`), API ouverte, licence ODbL. Essai : requête `within_distance` 350 m autour de (2.3466, 48.8602) → **16 accès**, avec identifiant, nom, numéro (`accshortname`), coordonnées WGS84 + Lambert 93, entrée/sortie. Exemple : Forum - Pte Lescot n°3 (48.86168, 2.34782), pl. Ste-Opportune n°10 (48.85956, 2.34694).

URL : `https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/acces/records?where=within_distance(accgeopoint,geom'POINT(2.3466 48.8602)',350m)&limit=100`

Numéros couverts dans le rayon : 1, 2, 3, 4, 5, 6, 8, 9, 10 à 17. Les accès 7 (Pte du Jour), 18 (av. Victoria), 19 (r. Saint-Martin) existent aussi dans le GTFS, hors du rayon testé.

### 2b. Lignes par accès : reconstituables, pas fournies directement
`relations-acces` relie chaque accès à une zone d'arrêt. Résultat réel :

| Accès (n°) | Zone d'arrêt IDFM | Lignes |
|---|---|---|
| 1 Marguerite de Navarre, 2 Berger, 3 Lescot | 45102 « Châtelet - Les Halles » (gare) + 42587 « Châtelet » | RER A, B, D (+ métros 1, 7, 11, 14 par correspondance, 4 aussi côté Châtelet) |
| 4 Rambuteau, 5 St-Eustache, 6 Pont Neuf, 8 Louvre, 9 Montorgueil | 417675 « Les Halles » | métro 4 (accès au secteur Forum ; RER par couloirs intérieurs) |
| 10 à 17 (Ste-Opportune, Rivoli, Bertin Poirée, Lavandières, St-Denis, Th. du Châtelet, pl. du Châtelet, Th. de la Ville) | 42587 « Châtelet » | métros 1, 4, 7, 11, 14 (RATP) |

Confirmation RATP (page https://www.ratp.fr/vos-lignes/vos-stations/chatelet, 15 oct. 2026) : accès 10 à 19 « Châtelet », lignes 1, 4, 7, 11, 14 ; RER A, B, D. Le plan de quartier RATP (JPG 3000×2320, https://www.ratp.fr/sites/default/files/2024-07/plan-station-chatelet-les-halles.jpg, téléchargé et visionné) donne la numérotation officielle et les secteurs Forum / Rivoli / Seine, avec icônes lignes. À noter : cet attribut « lignes » est à nous de calculer ; aucun jeu ne le donne par accès. Les PDF `assets-web.bonjour-ratp.fr/...Plan_Pdf...pdf` et `res.cloudinary.com/...chatelet-les-halles.pdf` sont bloqués pour curl (Cloudflare, page HTML renvoyée) ; ouvrables dans un navigateur. Le contenu est un plan de **surface** raster (0 tracé vectoriel détecté, 1 page 400×600 pt pour la version accessible) : aucune géométrie de niveaux.

### 2c. GTFS IDFM `pathways.txt` : testé en vrai
Téléchargé l'archive (150 Mo, https://eu.ftp.opendatasoft.com/stif/GTFS/IDFM-gtfs.zip, licence ODbL), extrait `pathways.txt` et `stops.txt` (hors dépôt). Autour de Châtelet : 76 arrêts (26 accès, 43 points d'arrêt, 7 zones) et **175 cheminements**, tous de mode « passerelle » (mode 1), bidirectionnels, avec `length` (m) et `traversal_time` (s), **sans** `stair_count`, `max_slope`, ni mode escalier/escalator/ascenseur. Exemple : accès Pte St-Eustache → zone Les Halles = 31,6 m / 33 s. Donc : pas d'escalators dirigés, pas de niveaux ; mais **distances et durées entrée→zone de quai officielles**, utilisables comme test de cohérence de nos trajets (écart > 30 % = alerte).

### 2d. Autres jeux IDFM / SNCF utiles
- `accessibilite-en-gare` (IDFM) : niveau d'accessibilité par arrêt, pas de géométrie.
- « Cheminements piétons - accessibilité des gares » (transport.data.gouv.fr, créé 2026-03-27, NeTEx/csv/json) : équipements d'élévation (ascenseurs, escaliers mécaniques) des gares de voyageurs. Gare Châtelet-Les Halles à vérifier dans le jeu ; si présent, fournit la **liste des escalators/ascenseurs par gare** (pas leur sens). Non téléchargé : à tester en 15 min.
- `cartographie-open-street-map-des-gares-transilien` (data.iledefrance.fr) : export OSM des équipements des gares SNCF IdF, mis à jour avec l'avancée de la cartographie ; c'est le travail des cartographes cités ci-dessus, donc **même source que notre scène** (pas une seconde source).
- Plans SNCF Gares & Connexions : https://www.garesetconnexions.sncf (PDF par gare, ex. Bordeaux, Montparnasse). La gare Châtelet-Les Halles est RATP/SNCF mixte ; PDF du plan de gare non trouvé par recherche, à chercher sur la fiche gare (hall, niveau -4/-5). Ne pas supposer.

## 3. Évacuation, ERP, commission de sécurité
Aucun plan d'évacuation, aucun avis de commission de sécurité, aucun registre de sécurité du Forum n'est public. Ces documents appartiennent à l'exploitant (Unibail-Rodamco-Westfield / SCFHP), à la RATP pour le pôle transport, et à la Préfecture de police (commission). Ce qui est public : le règlement ERP (Légifrance, arrêté du 25 juin 1980, articles CO 34 à CO 56 sur dégagements, unités de passage de 0,90 m, escaliers) : à citer comme règle de calcul de capacité, pas comme preuve du plan. Contexte presse : fermeture du Forum et des stations le 10 sept. 2025 (BFMTV), précédent réel de « stations fermées » pour notre scénario. Cour des comptes / Conseil de Paris : rapports financiers sur la rénovation, pas de plans.

## 4. Données indoor ouvertes
- **OpenStreetMap** : c'est notre base. Statut (forum OSM France, sept. 2025) : couloirs gare cartographiés depuis plans SNCF, commerces et espaces entre couloirs manquants aux niveaux -1 à -3, niveaux -4/-5 = gare seulement, un seul contour Westfield (way 408380251) couvrant la Canopée en surface. Visualiseur : https://indoorequal.org (niveau -3 : https://indoorequal.org/=17.29/48.861641/2.347074&level=-3) pour comparer. Licence ODbL, attribution OSM obligatoire (à mettre dans l'interface).
- **Compléter OSM nous-mêmes** : possible avec JOSM + fond de plan calé (méthode PicLayer citée par les contributeurs), mais sans plan source on ne fait que redessiner du flou.
- **Apple / Google / Mappedin-type indoor** : cartes existantes mais non exportables, licence interdisant la réutilisation. À citer uniquement comme concurrents, ne pas utiliser.
- **Wemap** : prestataire des plans interactifs SNCF Gares & Connexions (étude de cas publique). Pas de données ouvertes.
- **IDFM Prim / transport.data.gouv.fr** : GTFS pathways (point 2c), NeTEx accessibilité (point 2d).

## 5. Comment on importe chaque source

| Source | Méthode | Détail |
|---|---|---|
| IDFM `acces` (16 accès) | Points + contrôle | Convertir WGS84 → repère de scène (mêmes points de contrôle que `build_scene.py`), poser une porte nommée par accès avec `ref` = numéro, écart attendu < 10 m vs OSM. Ajouter l'attribut `lignes` selon le tableau 2b |
| GTFS `pathways.txt` | Test de cohérence | Pour chaque accès, distance de marche A* dans `navgrid` jusqu'à la zone de quai vs `length` GTFS ; rapport d'écarts |
| Plan quartier RATP (JPG) | Calque de contrôle | Géoréférencer par 3 points (ex. Fontaine des Innocents, Pte Lescot, pl. du Châtelet), superposer sur la vue niveau 0 ; raster, donc **pas de vectorisation** (qualité JPG insuffisante, on perdrait la précision) |
| Plans d'évacuation photographiés | Calque + retrace | Photo → redressement perspective → 3 points de contrôle (poteaux, escaliers connus) → retrace manuel des couloirs/escaliers (JOSM, ou polygones dans `build_scene`). Seule voie pour les issues UGC et niveaux -1/-2 |
| PDF vectoriels éventuels obtenus (plans RATP salle d'échange, plans Unibail) | PyMuPDF `get_drawings()` | Comme pour l'Adidas Arena : extraire segments/rectangles, filtrer par épaisseur de trait (murs) vs hachures, géoréférencer 3 points, un fichier par niveau. Si le PDF est scanné (0 tracé), retomber sur « calque » |
| Plan Westfield (écran) | Contrôle à l'œil | Capture écran par niveau, comparer l'emplacement des grands équipements (UGC, piscine, FNAC) ; pas d'import |
| Jeu « cheminements piétons - accessibilité gares » | Attributs | Si Châtelet y figure : marquer escaliers mécaniques/ascenseurs existants ; le sens se règle à la main (convention : montée le matin côté RER, à confirmer sur place) |

## 6. Les 5 meilleures sources, classées

1. **IDFM `acces` + `relations-acces`** (ODbL, API) : 16 accès nommés et numérotés ; 30 min d'import ; règle le manque « entrées sans attribut ligne » et donne la preuve « c'est bien Châtelet-Les Halles » pour les portes.
2. **Plans d'évacuation photographiés sur place** : seul moyen de corriger niveaux -1/-2, escaliers UGC, sorties de secours ; 2 à 3 h de terrain + retrace ; la preuve la plus forte (« recalé sur les plans de sécurité »).
3. **GTFS IDFM `pathways.txt`** (ODbL) : 175 cheminements chiffrés ; pas de géométrie mais valide nos distances ; 1 h.
4. **Plan quartier RATP (JPG)** + page station RATP : numérotation officielle et secteurs Forum/Rivoli/Seine, calque de contrôle ; 45 min.
5. **Fond OSM à jour + indoorequal** : revérifier avant le hack que nos couloirs -3 à -5 n'ont pas changé depuis la contribution de sept. 2025 (le forum OSM signale un travail en cours sur les magasins du -3) ; 20 min.

Mention : « Cheminements piétons - accessibilité des gares » (transport.data.gouv.fr) vient juste après si Châtelet y est présent (liste des escalators/ascenseurs).

## 7. Tableau des écarts

| Écart | Source qui le règle | Effort | Réserve |
|---|---|---|---|
| Entrées métro/RER sans ligne | IDFM `acces` + `relations-acces` + table 2b | 1 h | Lignes déduites par zone d'arrêt, pas par accès exact (les accès 1-3 touchent RER et métro) |
| Numéro d'accès (1 à 19) manquant | IDFM `accshortname`, plan quartier RATP | 30 min | |
| Distances entrée → quai à valider | GTFS pathways (175 liens) | 1 h | Pas de niveaux, pas d'escaliers |
| Niveaux -1 et -2 pauvres | Plans d'évacuation sur place, ou plan RATP salle d'échange si obtenu | 3 à 6 h | Source privée ; sans elle, rester à « couloirs seulement » |
| Escaliers de secours UGC | Relevé sur place (issues) ; règle ERP CO 38 pour dimensionner | 2 h | Aucun plan public ; si déduits, étiqueter « estimés » |
| ~264 personnes sans chemin quand les stations sont fermées | Liens quais ↔ surface : vérifier dans les plans d'évacuation les escaliers de secours des quais RER ; sinon les déclarer dans le moteur comme « issues de secours des quais » avec source = convention ERP | 2 à 4 h | Cause probable : OSM ne relie pas les quais à la galerie hors station ; à confirmer par les plans |
| Escalators sans sens | Liste d'équipements d'élévation (jeu accessibilité) + observation sur place ; défaut « montant/descendant » par convention | 1 à 2 h | Aucune donnée ouverte du sens ; à étiqueter « convention » |
| Boutiques du -3 incomplètes | Plan Westfield (contrôle), futur travail OSM, relevé sur place | 4 h+ | Non nécessaire à la démo d'évacuation |
| Niveaux -4/-5 = gare seulement | Cohérent avec le réel pour les quais ; parkings -2 à -4 absents | 2 h | Les parkings du Forum sont un autre ERP ; décider si on les représente |

## 8. Ce qu'on peut affirmer devant le jury (formulations testables)
- « 16 accès voyageurs, numérotés et positionnés selon le référentiel officiel IDFM (ODbL) » : oui après import 2a (vérifiable par un script : nombre de portes, écart de position < 10 m).
- « Distances entrée → quai recoupées avec le GTFS IDFM » : oui après 2c.
- « Niveau par niveau fidèle aux plans officiels » : **non**, à ne pas dire. Dire « bâti à partir d'OpenStreetMap (couloirs de la gare issus de plans SNCF), recalé sur les données officielles IDFM, et à compléter avec les plans de sécurité du gestionnaire ». Cela vend aussi le produit (« donnez-nous vos plans, on les branche »).

## 9. Limites de cette recherche
Non fait : ouverture de l'iframe `experience.westfield.com` (URL non trouvée), téléchargement des PDF RATP (bloqués pour curl, non ouverts dans un navigateur), jeu « cheminements piétons - accessibilité des gares » (non téléchargé, présence de Châtelet non vérifiée), contrôle direct de la scène (`build_scene.py` non rerun). Aucun document de commission de sécurité n'a été trouvé ; je ne peux pas exclure qu'un exemplaire circule (presse spécialisée, rapport d'inspection).
