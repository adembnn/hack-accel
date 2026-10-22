# État de l'art : simulation de foules en espace urbain (protection des personnes)

Décision débloquée : quels scénarios de rue on peut modéliser de façon crédible en démo, lesquels sont hors de portée, et où une simulation entre dans les décisions françaises. Rien n'est choisi pour l'équipe. Recherche faite par recoupement de résultats web (pas de lecture intégrale des rapports officiels) : `[?]` = non vérifié à la source primaire.

## 1. Version simple (à retenir)

- Une foule se comporte comme un liquide qui se coince : quand la place par personne tombe trop bas, les gens ne choisissent plus où ils vont, ils sont portés. Les drames viennent presque toujours d'un **goulot** (passage étroit), d'**arrivées qui dépassent la capacité** du passage, ou d'un **accès fermé / ouvert au mauvais moment**.
- Les rapports officiels des 6 cas pointent surtout des décisions d'organisation (jauge, filtrage, ouverture de porte, usage de gaz), pas la « panique ». Un simulateur utile montre donc l'effet de **décisions** (fermer une rue, ouvrir une issue, décaler un horaire), pas des comportements affolés.
- En France la décision se prend en réunion entre préfecture, mairie, organisateur, secours et transporteur, sur documents (plans de sûreté, dispositif de secours). Une simulation s'insère comme **pièce d'aide à la décision avant l'événement** (tester un plan), plus que comme outil temps réel.
- Réaliste en 7 h : rues/places/sorties de métro, flux à 1 ou 2 sens, fermeture d'issue, étalement des arrivées. Hors de portée : prédire un comportement individuel, valider un chiffre de victimes, modéliser un lieu réel avec précision réglementaire.

## 2. Catastrophes documentées

Termes : **densité** = personnes par m² ; **goulot** = point étroit ; **contre-flux** = deux flux en sens opposés ; **écrasement** = compression qui empêche de respirer (en général quand la densité dépasse environ 5 pers/m² [?], seuils variables selon les sources).

| Cas | Mécanisme | Densité / durée | Décisions déterminantes | Ce qu'un simulateur devait représenter |
|---|---|---|---|---|
| Itaewon 2022 (159 morts) | Ruelle en pente, 3,2 à 4 m de large, 40 à 50 m, arrivées de plusieurs directions, packing | NFS : ~8/m² à 22h15, 9-11 à 22h25 ; 10,74 cité par Yonhap ; chute puis 4 chutes en chaîne | Pas de plan de prévention ni réponse rapide ; enquête de police : catastrophe « man-made » | Largeur et pente de la ruelle, convergence de flux, effet de chute en cascade |
| Love Parade Duisburg 2010 (21 morts, 652 blessés) | Rampe d'accès unique (tunnel vers site), l'entrée se bloque, reflux, densité locale | Largeur utile de rampe ~10,6 m (clôtures non cartographiées) ; flux sûr max ~82 pers/m/min | Plan d'accès à une seule voie d'entrée/sortie, site jugé pour 300 000 | Capacité de la rampe en flux/min, accumulation à l'entrée, oscillations de foule à forte densité |
| Hillsborough 1989 (97 morts) | Porte C ouverte sous pression de la queue aux tourniquets, afflux vers des enclos déjà pleins | Capacité officielle des enclos 2 200, reconnue trop haute (~1 600) | Commandant : porte C ouverte sans fermer l'accès aux enclos | Pression devant les entrées, effet d'une ouverture de porte, remplissage de zones fermées |
| Astroworld 2021 (10 morts) | Compression devant la scène, surcharge de zone | 10 décès dans ~8 200 sq ft (~760 m²) près de la scène ; la jauge permise dépassée | Permis sans règle unifiée, commandement éclaté | Densité par zone, vague de foule, arrêt du spectacle comme décision |
| Kanjuruhan 2022 (135 morts) | Gaz lacrymogène dans les tribunes, sorties étroites ou verrouillées, sur-capacité | Quelques minutes d'évacuation vers de petites portes | Gaz tiré sans retenue alors que interdit par la FIFA ; portes fermées | Débit des portes, effet d'une zone dangereuse qui pousse la foule vers des issues |
| Stade de France 2022 (pas de mort, mise en danger) | Files bloquées par filtrage avant les portes, sortie de RER vers un entonnoir, gaz sur la foule piégée | Plusieurs dizaines de milliers de personnes concernées selon l'exécutif (30 000 à 35 000 « sans billet ou faux billets » ; FFF/UEFA : 2 800 faux billets scannés, chiffres contestés) | Filtrage à deux niveaux, billet papier falsifiable, doctrine de gaz | Arrivées groupées des transports, capacité des points de filtrage, file d'attente qui s'accumule |

Sources :
- Itaewon : [AP/Khaosod](https://www.khaosodenglish.com/news/international/2023/01/13/s-korean-police-seek-manslaughter-charges-over-deadly-crush/), [Korea Times](https://www.koreatimes.co.kr/www/nation/2023/09/113_343539.html) (10,74/m²) ; largeur 3,2 vs 4 m non tranchée entre sources. Rapport primaire (police + NFS) non lu `[?]`.
- Love Parade : [Helbing/Mukerji, arXiv 1206.5856](https://arxiv.org/pdf/1206.5856) (résume l'expertise de G. K. Still), [Klüpfel](https://ideas.repec.org/h/spr/sprchp/978-3-319-02447-9_115.html), [Pretorius/Gwynne/Galea 2013](https://gala.gre.ac.uk/id/eprint/15468/), [Wikipedia](https://en.wikipedia.org/wiki/Love_Parade_disaster). Poursuites pénales abandonnées faute de lien causal prouvé.
- Hillsborough : [Taylor Report](https://en.wikipedia.org/wiki/Taylor_Report), [IOPC chronologie](https://www.policeconduct.gov.uk/hillsborough-report/chapter-4/timeline-15-april-1989), [HSE](https://www.hse.gov.uk/foi/releases/hillsborough.htm). Densité en pers/m² introuvable dans mes sources `[?]`.
- Astroworld : [Task force Texas](https://www.keranews.org/news/2022-04-20/gov-abbotts-concert-safety-task-force-finds-5-key-factors-led-to-astroworld-incident), [Houston Landing](https://www.houstonlanding.org/astroworld-planners-foresaw-crowding-before-deadly-festival-no-way-we-are-going-to-fit-50k/). Surface de 8 200 sq ft : surface dite par enquêteurs, via presse `[?]`.
- Kanjuruhan : [Al Jazeera, équipe gouvernementale](https://www.aljazeera.com/news/2022/11/2/police-tear-gas-main-cause-of-indonesia-football-tragedy-report), [Kompas](https://www.kompas.id/baca/english/2022/10/10/tgipf-kanjuruhan-stadium-unfit-for-high-risk-matches). Bilan 130/131/135 selon source.
- Stade de France : [Sénat via Public Sénat](https://www.publicsenat.fr/actualites/societe/un-fiasco-evitable-le-rapport-au-vitriol-du-senat-sur-les-violences-au-stade) (rapport du 13 juillet 2022), [chiffres contestés](https://www.publicsenat.fr/article/parlementaire/stade-de-france-l-uefa-minimise-le-nombre-de-faux-billets-214199), [rapport UEFA indépendant](https://fr.soccerway.com/actualites/incidents-du-stade-de-france-un-rapport-independant-fustige-l-uefa-et-les-autorites/xrpcCr8d).

À noter : le seuil « 5 pers/m² critique » vient de synthèses secondaires ; l'échelle de Fruin (niveau de service F) est beaucoup plus bas (~2,2/m²) ([discussion](https://arxiv.org/pdf/0805.0360), [Still](https://gkstill.com/CV/PhD/Chapter3.html)). Ne pas afficher « seuil mortel » en démo sans mention de source.

Leçons pour la modélisation : (a) tous les cas sont des problèmes de **débit contre capacité** à un point précis ; (b) la décision humaine (ouvrir/fermer, filtrer, tirer du gaz) est la variable clé ; (c) le simulateur doit montrer une **file qui s'accumule et une densité locale**, pas simuler la panique.

## 3. Gestion de foule en France : qui décide quoi

Termes : **ERP** = établissement recevant du public (régi par le règlement de sécurité) ; **DPS** = dispositif prévisionnel de secours (secouristes d'associations agréées, dimensionné à l'avance).

- **Manifestation sur la voie publique** : déclaration au moins 3 jours francs et au plus 15 avant, en mairie (à Paris, préfecture de police), avec itinéraire ; l'autorité de police peut interdire par arrêté (code de la sécurité intérieure, L211-1 à L211-4) ([résumé](https://autunoismorvan.foyersruraux.org/wp-content/uploads/sites/10/2022/07/Organisation-dune-manifestation-sur-la-voie-publique.pdf), à confirmer sur Légifrance `[?]`).
- **Événements et rassemblements** : l'organisateur est responsable de la sécurité des participants ; le DPS est obligatoire de droit pour les rassemblements lucratifs de plus de 1 500 personnes, sinon sur décision de l'autorité de police ([arrêté du 7 nov. 2006](https://aida.ineris.fr/reglementation/arrete-071106-fixant-referentiel-national-relatif-dispositifs-previsionnels-secours), [réponse ministérielle](https://www.assemblee-nationale.fr/dyn/13/questions/QANR5L13QE8307.pdf)). Le ratio de secours (RIS) combine effectif pondéré, comportement du public, site, délai d'intervention des secours.
- **Sûreté** : guides sectoriels non contraignants issus du plan Vigipirate, par ex. [guide festivals et rassemblements culturels](https://www.culture.gouv.fr/content/download/145542/file/guide_bonnes_pratiques_surete_des_festivals_et_rassemblements_culturels.pdf) (l'organisateur reste responsable de la sécurité générale ; le guide ne crée pas d'obligation).
- **Grand événement parisien** (exemple JO 2024) : l'État garantit la sécurité, la Ville gère l'espace public, l'organisateur organise ; jauges négociées (préfet de police Lallement : 250 000 souhaités contre un projet plus large, selon presse) ([Francs Jeux](https://www.francsjeux.com/breves/la-ceremonie-douverture-fait-naitre-les-tensions/), [Orange](https://sports.orange.fr/plus-de-sport/article/paris-2024-le-protocole-securitaire-de-la-ceremonie-d-ouverture-devoile-exclu-CNT00000244srH.html)). Plans A/B/C de repli selon l'analyse de risques.
- **Outils de pilotage** : salles de commandement de la préfecture de police et vidéoprotection (près de 4 000 caméras propres et plus de 37 000 interconnectées selon la Cour des comptes ([Next](https://next.ink/4634/la-cour-comptes-deplore-encore-derives-videosurveillance-a-paris/))) ; vidéosurveillance algorithmique expérimentée pour les JO ([Siècle Digital](https://siecledigital.fr/2024/04/19/paris-continue-de-tester-la-videosurveillance-algorithmique-avant-les-jeux-olympiques/)). Je n'ai trouvé **aucune source publique** sur un outil de simulation de foule officiel de la préfecture `[?]` : c'est soit un vide, soit non publié.
- **Où la simulation s'insère** (hypothèse de travail, à valider avec un praticien) : (1) avant l'événement, pour justifier jauge, itinéraire, nombre d'issues dans le dossier présenté à la préfecture et à la commission de sécurité ; (2) en répétition de plan avec transporteur (RATP/SNCF) pour caler les horaires de renfort ; (3) en retour d'expérience. Le temps réel suppose du comptage fiable, hors périmètre de 7 h.
- **Leçon française récente** : le Sénat a estimé que le Stade de France était un « fiasco évitable » (accueil des supporters négligé, filtrage avancé jugé malavisé, doctrine du gaz à revoir). Un rapport de préfet Cadot a été remis le 10 juin 2022 `[?]` (contenu non lu).

## 4. Manifestations (côté protection uniquement)

- **Vitesse et densité** : en marche libre un piéton va à environ 1,3 m/s (moyenne 1,34, de 0,97 à 1,65 ; médiane plus proche de 1,2) ([Weidmann via arXiv](https://arxiv.org/pdf/physics/0506170)). Un cortège dense avance bien plus lentement et la queue s'allonge à chaque arrêt ; pas de mesure publique de vitesse de cortège français trouvée `[?]`.
- **Comptage** : la préfecture de police compte à la main depuis des points hauts sur 3-4 endroits du parcours, par groupes de 10, puis moyenne ; le cabinet Occurrence utilise des capteurs sur ligne virtuelle et vérifie par recomptage vidéo (janvier 2020 : 87 000 contre 55 000) ([Public Sénat](https://www.publicsenat.fr/actualites/politique/manifestations-les-medias-adoptent-leur-propre-systeme-de-comptage-83895), [Assemblée](https://questions.assemblee-nationale.fr/dyn/14/questions/QANR5L14QE16090.pdf)). Les chiffres de participation sont donc **une plage**, pas une mesure.
- **Simulation académique** : les modèles trouvés sont surtout des modèles de confrontation (ProtestLab, [Lemos et al. 2017](https://ciencia.iscte-iul.pt/publications/protestlab-a-computational-laboratory-for-studying-street-protests/31865?lang=en)) : **à ne pas reprendre**. Pour la protection, la base utile est la dynamique piétonne classique (diagramme vitesse/densité), à appliquer au cortège et aux rues de dispersion.
- **Ce qu'un outil protecteur peut montrer** : longueur du cortège et temps de passage selon le nombre de participants ; capacité des rues de dispersion en bout de parcours ; effet de la fermeture d'un point de passage ; temps pour évacuer une place d'arrivée. Pas d'analyse de stratégie d'affrontement.

## 5. Incidents violents ou de panique, vus protection

- **Fuite de foule** : le modèle de référence (forces sociales de Helbing, Farkas, Vicsek, Nature 2000) donne arcs et bouchons aux sorties et suivi collectif ; plusieurs affirmations de l'article sont discutées depuis ([bilan](https://collective-dynamics.eu/index.php/cod/article/view/A168)). Choix de sortie : les gens suivent la majorité et évitent une sortie seuls (RV, [Kinateder & Warren](https://par.nsf.gov/servlets/purl/10315492)) ; la validité de la réalité virtuelle pour le choix de sortie est étayée (Feng et al. 2021, via recherche). Contagion de la peur et contre-flux : non couverts par mes sources `[?]`.
- **Préconisations officielles** : guides Vigipirate sectoriels ; la responsabilité reste à l'organisateur et à l'autorité de police ([guide festivals](https://www.culture.gouv.fr/content/download/145542/file/guide_bonnes_pratiques_surete_des_festivals_et_rassemblements_culturels.pdf)). Contenu détaillé non résumé volontairement.
- **Représentation neutre à retenir** : une **zone à éviter** qui s'étend à partir d'un côté, des **issues bloquées**, et la question protectrice « combien de temps pour vider la zone ? ». Aucun scénario d'agresseur, aucun lieu réel, aucune statistique de victimes à afficher. Formuler en « incident » ou « zone fermée », pas en attaque.

## 6. Données publiques pour caler un scénario

| Donnée | Ce qu'elle donne | Limites | Source |
|---|---|---|---|
| Trafic annuel entrant par station (RATP) | Volume annuel d'entrées par station, licence ouverte | Annuel, millésimes jusqu'à 2019 dans mes résultats ; pas de transfert ni de profil horaire | [data.gouv 2019](https://www.data.gouv.fr/datasets/trafic-annuel-entrant-par-station-du-reseau-ferre-2019) |
| Validations IDFM par arrêt et jour | Validations quotidiennes réseau ferré, trimestriel | Pas de profil horaire trouvé ; exclut non-validants | [data.gouv](https://www.data.gouv.fr/datasets/validations-sur-le-reseau-ferre-nombre-de-validations-par-jour-4eme-trimestre-2025) |
| Fréquentation La Défense (RATP) | Profil horaire d'un pôle | Un seul site | [notice](https://data.ratp.fr/api/datasets/1.0/frequentation-du-pole-de-la-defense-experimentation-lissage-des-heures-de-pointe/attachments/notice_opendata_ratp_comptages_ladefense_pdf) |
| Compteurs vélo Ville de Paris | Comptage horaire, pas piéton | Vélos seulement | [opendata.paris.fr](https://opendata.paris.fr/explore/dataset/comptage-velo-compteurs/) |
| Vélib' temps réel | Vélos et bornes par station, par minute, sans clé | Indirect (proxy d'affluence) | [data.gouv](https://www.data.gouv.fr/datasets/velib-velos-et-bornes-disponibilite-temps-reel) |
| Téléphonie (Orange Flux Vision) | Présence et déplacements agrégés | **Payant, sous contrat**, pas d'open data trouvé | [Sofrecom](https://www.sofrecom.com/publications/flux-vision-a-marketing-innovation-based-on-data-analytics) |
| Géométrie des rues | OpenStreetMap (licence ODbL, non vérifiée ici `[?]`) | Largeurs de trottoir approximatives | non testé |
| Offre de transport (GTFS IDFM) | Horaires théoriques de trains/bus/métro | Offre, pas affluence | [IDFM](https://iledefrance-mobilites.fr/en/open-data) |

Comptages piétons de la Ville de Paris (capteurs multimodaux) : annoncés « à terme » seulement ([source](https://opendata.paris.fr/explore/dataset/comptage-velo-compteurs/)). Données d'événements (jauge, heures) : à reconstituer à la main depuis des articles, pas de flux ouvert trouvé `[?]`.

Moteurs libres de simulation piétonne : JuPedSim (LGPLv3, Python, Jülich) et Vadere (LGPL) ([GitHub](https://github.com/JuPedSim/jpscore), [PyPI](https://pypi.org/project/jupedsim/)). Import direct d'OpenStreetMap : non vérifié `[?]`. Choix d'outil non fait ici.

## 7. Synthèse : 6 scénarios, du plus facile au plus ambitieux

Hypothèse de calibrage commune : vitesse libre ~1,3 m/s, débit d'une porte ou d'un couloir par mètre de largeur, densité par zone. Chiffres de démo = ordres de grandeur illustrés, jamais « prévision ».

1. **Sortie de métro / RER après un événement** (type Stade de France) : une sortie, un escalier, une rue ; arrivées en rafale. Donnée : validations par station + jauge de l'événement (à saisir) + largeur de la sortie. Question : combien de minutes de file, quand décaler les départs. Fait : ~1 builder suffit.
2. **Goulot à l'entrée d'un site (filtrage)** : file qui s'accumule devant 2 niveaux de contrôle. Donnée : débit de contrôle par ligne (hypothèse à saisir, non publiée), arrivée par vagues. Résultat : taille et longueur de la file, effet d'ouvrir une ligne de plus. Réaliste.
3. **Rue étroite à double sens piéton** (type ruelle de bar, marché de Noël, sortie de bars) : flux opposés et densité maximale. Donnée : largeur depuis OpenStreetMap ou relevé, volume horaire estimé. Montre pourquoi un sens unique ou un élargissement change la densité. Réaliste, mais exiger une marge d'erreur sur la largeur.
4. **Cortège de manifestation sur un itinéraire** : longueur de la file, temps de passage, fermeture d'une rue, arrivée sur une place et dispersion. Donnée : déclaration (itinéraire, horaire), fourchette de participants (préfecture vs indépendants), largeur des rues. Protection : la place d'arrivée peut-elle absorber et écouler ? Réaliste avec fourchette plutôt que chiffre.
5. **Place avec un incident (zone fermée qui s'étend, issues indisponibles)** : évacuation d'une place (ex. fête publique) quand un secteur devient inaccessible. Donnée : géométrie de la place, nombre d'issues, jauge. Résultat : temps pour vider, issues saturées, effet d'une signalétique. Faisable si le modèle reste neutre et sans lieu réel sensible.
6. **Grand événement multi-site avec transports** (type concert + station + rue + parvis, ou fête sur les quais) : enchaîne scénarios 1 à 3 avec plan A/B/C et fermeture d'accès. Donnée : jauge, plusieurs stations, horaires. **Le plus ambitieux** : trop d'hypothèses pour 7 h sans cas unique très cadré.

Hors de portée (à dire clairement en démo) : prédire un nombre de victimes ou une probabilité d'accident, modéliser la panique individuelle, valider un seuil réglementaire (le simulateur ne remplace pas la commission de sécurité), utiliser des données de téléphonie en temps réel (payantes), évaluer un lieu réel nominatif.

## 8. Lacunes honnêtes (à lever avant d'affirmer)

- Rapports primaires non lus : police coréenne/NFS (Itaewon), TGIPF (Kanjuruhan), rapport Cadot, texte intégral du Sénat. Les chiffres viennent de presse et de synthèses.
- Densité de Hillsborough non trouvée ; seuils pers/m² varient selon les auteurs.
- Aucun outil officiel de simulation de la préfecture de police trouvé ; « SICOP » et comptage de foule en salle de commandement non documentés publiquement.
- Données de piétons (capteurs) de la Ville de Paris et agenda d'événements ouverts : non trouvés.
- À valider par un praticien (préfecture, SDIS, exploitant de site) : où la simulation entre vraiment dans leurs décisions.
