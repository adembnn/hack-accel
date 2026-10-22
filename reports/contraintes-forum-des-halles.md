# Contraintes et leviers du directeur du Forum des Halles

Décision débloquée : quoi représenter dans le simulateur et les agents décisionnels. Rien n'est choisi ici pour l'équipe. `[?]` = non vérifié. Recherche faite le 22 oct. 2026, sources publiques uniquement, aucun plan de sécurité cherché.

## 0. Version simple

Le directeur ne décide pas seul. Il tient un grand centre souterrain (environ 50 millions de visites par an), collé à la plus grosse gare souterraine du monde. Le 19 oct., la préfecture a imposé de l'extérieur une règle (couvre-feu à 23 h) et le métro/RER a fermé à 22 h. Le directeur gère donc surtout un problème de **timing** : vider ~plusieurs milliers de personnes entre l'annonce (~19 h 20) et 22-23 h, sans les pousser vers une zone de trouble ni vers des stations fermées.

**Trois écarts avec le brief de départ, à corriger dans le simulateur :**
1. Le couvre-feu vise **23 h-6 h**, pas 20 h. Ce qui a démarré à 20 h : l'interdiction de manifester. Le cinéma a évacué tôt pour que le public rentre avant 23 h ([Le Parisien](https://leparisien.fr/paris-75/couvre-feu-a-paris-secteurs-heures-personnes-ce-que-lon-sait-du-dispositif-deploye-face-aux-violences-urbaines-19-10-2026-LVGEYQYDN5DRNCBNCJEWKGDDUM.php), [La Dépêche](https://www.ladepeche.fr/2026/10/20/violences-du-17-octobre-ils-ont-arrete-la-seance-en-plein-milieu-le-couvre-feu-est-decrete-pendant-leur-film-ils-se-retrouvent-mis-a-la-porte-13611633.php)).
2. L'annonce est tombée vers **19 h 20** ([BFM](https://www.bfmtv.com/culture/cinema-series/gardez-votre-ticket-quand-le-couvre-feu-a-paris-interrompt-des-seances-a-l-ugc-cine-les-halles_AN-202610200618.html), [HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html)). Les salles sont vidées vers 19 h 30-20 h, ~3 000 personnes (BFM). Le Forum était déjà censé fermer à 20 h 30 un lundi.
3. Les stations sont fermées à **22 h**, pas dès 20 h ([Le Parisien](https://leparisien.fr/info-paris-ile-de-france-oise/transports/couvre-feu-a-paris-des-stations-de-metro-et-rer-fermees-les-correspondances-pas-assurees-19-10-2026-FQUX6KCXZZFYZOJT4S7JONXZ3M.php)). Donc à 20 h le métro roulait encore : la fenêtre de sortie était ouverte ~2 h. Cela change la décision (voir §6).

Contradiction de presse : Télérama écrit « sur ordre de la préfecture » et « 22 h » pour l'accès interdit ; Le Parisien/La Dépêche disent que le cinéma a respecté les consignes pour laisser les gens partir avant 23 h. Qui a ordonné quoi au cinéma n'est pas établi `[?]`. Le Forum a-t-il fermé le 19 au soir : non trouvé `[?]`.

## 1. Contraintes réglementaires

*ERP = établissement recevant du public, soumis au règlement de sécurité incendie. Type = lettre selon l'activité. Catégorie = chiffre selon la capacité.*

| Fait | Source |
|---|---|
| Type M = magasins et centres commerciaux ; type L = salles de spectacle/réunion (cinéma) ; défini à l'article GN 1 | [Préfecture de l'Aisne](https://aisne.gouv.fr/Actions-de-l-Etat/Securite-et-protection-de-la-population/Service-Interministeriel-de-Defense-et-de-Protection-Civile/ETABLISSEMENTS-RECEVANT-DU-PUBLIC-ERP/La-securite-dans-les-etablissements-recevant-du-public-ERP) |
| 1re catégorie = plus de 1 500 personnes (art. R143-19 CCH). Le Forum est cité comme « ERP de catégorie 1 » dans un marché public de sécurité incendie | [Aisne](https://aisne.gouv.fr/Actions-de-l-Etat/Securite-et-protection-de-la-population/Service-Interministeriel-de-Defense-et-de-Protection-Civile/ETABLISSEMENTS-RECEVANT-DU-PUBLIC-ERP/La-securite-dans-les-etablissements-recevant-du-public-ERP), [UE](https://op.europa.eu/en/web/public-procurement/procurement-details/-/procurement/14a61d30-47ae-3b0a-95df-08c5691950fb) |
| Le cinéma UGC est-il un ERP distinct du centre, ou une partie de lui : non établi | `[?]` |
| L'exploitant doit entretenir et faire vérifier ses installations ; le contrôle de la commission ne le décharge pas de sa responsabilité (art. R143-34 CCH) | [Guide SDIS 73](https://www.unat.asso.fr/wp-content/uploads/2024/10/guide-commission-securite.pdf) |
| Alarme : « alarme générale » (tout le bâtiment) et « alarme restreinte » (seulement le poste de sécurité) ; zones de diffusion proposées par l'exploitant à la commission (art. MS 61 à 67) | [Légifrance](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020317664) |
| Principe du règlement : évacuation « rapide et en bon ordre » ou « différée » si nécessaire (art. CO) | [Légifrance](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303869) |
| Espace d'attente sécurisé (EAS) : zone à l'abri des fumées où une personne handicapée attend les secours (art. CO 34 §6) | [Légifrance](https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303940) |
| Escaliers mécaniques : 50 % au plus comptent comme sorties réglementaires (CO 34 §4). Donc les arrêter ou les inverser change la capacité de sortie | idem |
| SSIAP (agents de sécurité incendie), poste central de sécurité, désenfumage, arrêt des escalators/ascenseurs en évacuation | `[?]` non lus article par article ; à confirmer (MS 46 et suivants, articles du type M) |

**Point clé : tout ce règlement est écrit pour l'incendie et la panique.** Un couvre-feu n'est pas un sinistre. Je n'ai trouvé aucun texte public qui dise comment un exploitant d'ERP doit gérer un ordre préfectoral de fermeture sans incendie `[?]`. Le simulateur doit donc réutiliser la logique d'évacuation (sorties, flux) sans déclencher l'alarme générale par réflexe : une alarme incendie pourrait créer une panique inutile.

**Qui décide `[?]` à confirmer par un juriste.** Ce qui est sourcé : l'exploitant reste responsable de la sécurité de son ERP (R143-34). Dans la presse, l'ordre de fermeture vient de la préfecture de police (Télérama). La commission de sécurité conseille et contrôle, elle ne dirige pas une évacuation.

## 2. Contraintes physiques publiques

| Donnée | Valeur | Source |
|---|---|---|
| Fréquentation | ~50 M visiteurs/an (chiffre de 2019) | [Wikipedia](https://en.wikipedia.org/wiki/Forum_des_Halles) |
| Surface / boutiques | 60 000 m², 168 boutiques ; autre source : plus de 120 | Wikipedia, [Roavina](https://roavina.com/en/france/paris/westfield-forum-des-halles) |
| Niveaux | 4 niveaux souterrains + rez-de-chaussée (Canopée) ; boutiques référencées de -4 à 0 | [Daiztrip](https://daiztrip.com/destinations/paris/things-to-do/forum-des-halles), [Westfield](https://westfield.com/en/france/forumdeshalles/stores/fashion) |
| Accès piétons publics | 9 portes listées : Lescot, Berger, Rambuteau, Pont-Neuf, Saint-Eustache, Jour, Louvre, Marguerite de Navarre, plus l'entrée Canopée côté jardin Nelson Mandela | [Westfield accès](https://westfield.com/en/france/forumdeshalles/access) |
| Sorties vers le métro/RER | 8 sorties numérotées ; certaines avec ascenseur, d'autres escalators seulement | [Bonjour RATP](https://bonjour-ratp.fr/en/lieux/forum-des-halles) |
| Parking | ~2 100 places, entrée 12 rue Turbigo, ouvert 24 h/24 | Wikipedia, Bonjour RATP |
| Horaires | Lun-sam 10 h-20 h 30 (source RATP et site Westfield) ; d'autres sites disent 9 h-21 h (OpenStreetMap, Pages Jaunes) : à trancher | Bonjour RATP, [Roavina](https://roavina.com/en/france/paris/westfield-forum-des-halles) |
| Cinéma UGC | 27 salles, ~3 800 places, 2,6 M spectateurs en 2025, séances de 9 h à minuit | [Why So France](https://whysofrance.com/news/ugc-cine-cite-les-halles-remains-worlds-busiest-cinema-for-third-consecutive-year) |
| Restaurants / supermarché | restos ~11 h-23 h ; supermarché lun-sam 8 h-22 h | Bonjour RATP |
| Pôle de transport | 750 000 voyageurs par jour ouvré (493 000 RER) ; lignes 1, 4, 7, 11, 14, RER A/B/D | [Wikipedia](https://en.wikipedia.org/wiki/Ch%C3%A2telet%E2%80%93Les_Halles_station) |
| Bus | 21, 29, 38, 47, 58, 67, 69, 70, 72, 74, 75, 76, 85, 96 | Bonjour RATP |

Non public et à ne pas chercher : plans d'évacuation, capacités par sortie, positions des agents. Le simulateur travaille avec des **hypothèses** pour ces valeurs (voir §7).

## 3. Contraintes extérieures le 19 oct. (et suites)

| Fait | Source |
|---|---|
| Annonce de la préfecture de police ~19 h 20 ; couvre-feu **23 h-6 h**, nuit du 19 au 20 seulement | [Le Parisien](https://leparisien.fr/paris-75/couvre-feu-a-paris-secteurs-heures-personnes-ce-que-lon-sait-du-dispositif-deploye-face-aux-violences-urbaines-19-10-2026-LVGEYQYDN5DRNCBNCJEWKGDDUM.php), [HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html) |
| Périmètre Halles : place Maurice-Quentin, rue Berger (jusqu'au bd de Sébastopol), passage des Lingères, bd de Sébastopol (rue Berger à rue Rambuteau), rue Rambuteau (Sébastopol à allée André-Breton), allée André-Breton. Ce sont « les rues d'accès sud » du quartier | Le Parisien, [franceinfo](https://franceinfo.fr/societe/mobilisation-du-17-octobre/qui-est-concerne-pour-combien-de-temps-cinq-questions-sur-les-couvre-feux-partiels-mis-en-place-a-paris-bordeaux-lyon-lille-nice-et-marseille_8245186.html) |
| Exceptions : résidents, travailleurs obligés de rejoindre le périmètre, secours, commerçants | Le Parisien |
| Interdiction de manifester de 20 h à 6 h autour de plusieurs sites (dont Bourse, Palais de Justice) | [Europe 1](https://europe1.fr/societe/en-direct-violences-urbaines-la-prefecture-de-police-annonce-un-couvre-feu-a-paris-a-partir-de-ce-lundi-soir-23h-jusqua-6h-mardi-dans-certains-quartiers-1162317) |
| Contexte : pillages « dans le secteur Châtelet/Les Halles » ; dégradations rue Berger et rue du Renard ; 855 puis 351 interpellations les 17-18 oct. | Le Parisien, [actu.fr](https://actu.fr/ile-de-france/paris_75056/couvre-feu-a-paris-deux-quartiers-du-centre-de-la-capitale-concernes-des-22-heures_64947488.html) |
| **Fermeture des stations dès 22 h** : Châtelet (1, 4, 7, 11, 14), Les Halles (4), Châtelet-Les Halles (RER A, B, D) ; trains sans arrêt, **aucune correspondance** ; ligne 11 coupée Hôtel de Ville-Châtelet ; pas d'heure de réouverture annoncée | Le Parisien (transports), [Sortiraparis](https://sortiraparis.com/actualites/a-paris/articles/355161-couvre-feu-a-paris-les-stations-de-metro-et-de-rer-fermees-ce-20-octobre-2026), [actu.fr](https://actu.fr/ile-de-france/paris_75056/couvre-feu-a-paris-la-prefecture-de-police-fait-fermer-plusieurs-stations-de-metro-des-lundi-soir_64947832.html) |
| Les stations ferment « à la demande de la préfecture » et rouvrent sur son autorisation, souvent sans préavis | [Sortiraparis](https://sortiraparis.com/actualites/a-paris/articles/291320-metro-rer-manifestations-et-perturbations-du-12-au-18-octobre-2026) |
| Travaux déjà en cours : RER B coupé après 22 h 45 vers le nord (jusqu'au 10 nov.) ; station Saint-Michel non desservie sur la 4 ; République non desservie par la 8 | Sortiraparis, [Bonjour RATP](https://bonjour-ratp.fr/actualites/articles/bulletin-travaux-17-octobre) |
| Camions et canons à eau barrent des accès ; contrôles de passants ; rondes de la Brav-M | [franceinfo](https://franceinfo.fr/replay-jt/france-2/20-heures/17-octobre-des-quartiers-et-des-villes-places-sous-couvre-feu_8244514.html) |
| Les mesures se répètent : fermetures de stations Châtelet-Halles-République aussi les 21 et 22 oct. dès 22 h ; interdiction de rassemblement jeudi 22 de 8 h à 20 h incluant Châtelet-Les Halles | [Sortiraparis EN](https://sortiraparis.com/en/news/in-paris/articles/355189-paris-curfew-which-routes-to-take-to-get-back-to-the-suburbs), [franceinfo](https://franceinfo.fr/societe/mobilisation-du-17-octobre/les-rassemblements-et-les-manifestations-interdits-dans-plusieurs-secteurs-de-paris-jeudi-entre-8-heures-et-20-heures-annonce-la-prefecture-de-police_8247910.html) |

Non trouvé : itinéraires de manifestation du 19 au soir, météo du soir, lieu exact des troubles à 20 h `[?]`. Le jour s'est couché avant 19 h (nuit).

## 4. Contraintes humaines

- **Population un lundi à ~19 h 30-20 h** (estimation, pas une mesure) : spectateurs UGC (~3 000 sortis selon BFM, sur ~3 800 places), clients du centre en fin de journée, salariés des boutiques et restaurants, voyageurs de passage vers le métro/RER (la gare pèse 750 000 passages/jour). Aucun comptage du Forum à cette heure n'est public `[?]`.
- **Délai de prévenance** : ~19 h 20 annonce, cinéma vidé 19 h 30-20 h : de l'ordre de **10 à 40 min** de préavis selon les sources. Un spectateur dit que le film avait commencé à 19 h 20 ([Le Parisien](https://www.leparisien.fr/paris-75/on-etait-tous-degoutes-le-cinema-ugc-des-halles-evacue-avant-le-couvre-feu-a-paris-des-projections-coupees-en-pleine-seance-20-10-2026-JOMZGKARC5GLJMLFROO4YPS5PU.php)).
- **Friction constatée** : tickets non remboursés sur place (« gardez votre ticket »), spectateurs mécontents, annonce faite par un employé à voix haute ([HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html), [La Dépêche](https://www.ladepeche.fr/2026/10/20/violences-du-17-octobre-ils-ont-arrete-la-seance-en-plein-milieu-le-couvre-feu-est-decrete-pendant-leur-film-ils-se-retrouvent-mis-a-la-porte-13611633.php)).
- **Personnes à mobilité réduite** : certaines sorties métro n'ont que des escalators (Bonjour RATP) ; l'ascenseur est donc un goulot. Proportion de PMR : à poser en hypothèse (ordre de grandeur 1-3 % `[?]`).
- **Groupes, familles, touristes non francophones** : vacances de la Toussaint commencées le 17 oct. (Sortiraparis) → plus de familles et de touristes que la normale. Part exacte : hypothèse.
- **Effectif de sécurité** : aucun chiffre public. Le marché public cité (§1) montre qu'il existe un contrat de sécurité incendie pour le Forum, sans effectifs `[?]`. Paramètre à saisir, jamais présenté comme un fait.
- **Salariés** : les commerçants et travailleurs sont exemptés du couvre-feu, mais doivent rentrer chez eux avec des stations fermées dès 22 h.

## 5. Leviers du directeur (ce qu'il peut vraiment faire)

Beaucoup sont du bon sens d'opérateur, pas des obligations écrites ; seuls ceux marqués « sourcé » ont un appui public.

| Levier | Effet attendu | Limite connue |
|---|---|---|
| Fixer l'heure de fermeture des boutiques et zones, par niveau | Étale le flux de sortie dans le temps | Boutiques = locataires : le directeur coordonne, il ne commande pas toujours `[?]` |
| Choisir quelles portes (9 + Canopée + parking) restent ouvertes | Dirige la foule loin du périmètre de couvre-feu (Berger, Rambuteau sont dans ou près du périmètre) | Trop de portes fermées = goulot ; sorties réglementaires ne sont pas libres de fermeture `[?]` |
| Phaser par niveau / secteur | Évite la cohue aux portes | Phasage entre niveaux : les escaliers deviennent le goulot |
| Annonces sonores et écrans | Réduit l'incertitude, accélère l'adhésion | Pas de traduction = touristes perdus ; pas d'alarme incendie |
| Placer les agents (portes, escaliers, ascenseurs) | Guide, rassure | Effectif inconnu ; un agent ne couvre qu'un point |
| Coordination avec UGC et RATP | Aligne l'heure de sortie du cinéma avec les trains encore actifs | Le 19 oct., le cinéma a été prévenu « à la dernière minute » (Télérama) |
| Confinement (garder les gens dedans) au lieu d'évacuer | Utile si la rue est dangereuse | Après 22 h, plus de métro ; centre ferme à 20 h 30 ; durée et capacité d'accueil de nuit non prévues `[?]` |
| Escalators (arrêt, sens unique) | Peut accélérer la sortie ou la ralentir | CO 34 : 50 % comptent comme sorties ; règle d'arrêt en évacuation `[?]` |
| Demander des renforts à la préfecture | Plus de présence policière autour des portes | Les forces sont déjà mobilisées ; pas de garantie |
| Parking | Évacuer les voitures en plusieurs vagues | Sortie rue Turbigo : peut croiser un périmètre ; non étudié |

## 6. Critères de décision et conflits

À optimiser, dans cet ordre probable (à valider avec Adem, non tranché ici) :
1. **Sécurité des personnes** (pas de bousculade, pas d'exposition à la violence).
2. **Respecter l'ordre de la préfecture** (délai, périmètre).
3. **Ne pas déverser la foule vers une zone de trouble** (rues Berger, Rambuteau, Sébastopol, Renard).
4. **Continuité des correspondances** tant que le métro roule (jusqu'à 22 h).
5. Image et pertes commerciales (remboursements, fermeture anticipée) : critère secondaire, jamais contre 1.

Conflits réels :
- **Sortir vite vs sortir ailleurs** : la sortie la plus proche peut donner sur une rue sous couvre-feu ou barrée.
- **Évacuer vs confiner** : évacuer expose dehors ; confiner dépasse l'heure de fermeture du centre et du métro.
- **Métro encore ouvert jusqu'à 22 h vs 22 h imposé comme coupure** : tout le monde veut y aller en même temps, d'où risque de surcharge d'un lieu qui ferme.
- **Préavis court vs ampleur** : 10-40 min pour des milliers de personnes.
- **Transparence vs panique** : annoncer clairement sans simuler un incendie.

## 7. Tableau pour le simulateur

Type : **D** = donnée chargeable, **P** = paramètre à saisir, **H** = hypothèse.

| Contrainte | Source | Type | Représentation |
|---|---|---|---|
| Couvre-feu 23 h-6 h, périmètre rues | Le Parisien, franceinfo | D | Polygone interdit, activé à une heure |
| Interdiction de manifester dès 20 h | Europe 1 | D | Indicateur de risque dehors |
| Stations fermées dès 22 h | Le Parisien, actu.fr | D | Noeuds de transport qui deviennent inaccessibles à 22 h |
| Heure d'annonce (19 h 20) | BFM, HuffPost | D (scénario) | Heure de déclenchement, réglable |
| Horaire du Forum (20 h 30 ou 21 h) | RATP, OSM | P | Heure de fermeture normale |
| Portes publiques (9 + Canopée) | Westfield | D (liste) | Noeuds de sortie ; positions précises à approximer |
| Niveaux (-4 à 0) | Westfield, Daiztrip | D | Couches avec escaliers/escalators |
| Capacités de sortie, largeurs | non public | H | Valeurs génériques, bien marquées comme inventées |
| Population un lundi 20 h | non public | H/P | Plage min-max de personnes par zone |
| 3 000 spectateurs UGC | BFM | D (cité) | Source de foule groupée |
| Part PMR, familles, touristes | non public | H | Profils de vitesse différents |
| Effectif sécurité | non public | P | Nombre d'agents réglable |
| Escalators comptent 50 % (CO 34) | Légifrance | D (règle) | Capacité de sortie par escalier |
| Alarme générale vs restreinte | Légifrance MS 61-67 | D (règle) | Annonce « douce » possible sans alarme |
| Ordre d'évacuer / autorité | `[?]` | H | Le directeur décide, la préfecture impose les bornes |
| Renforts policiers | non public | P | Option avec incertitude |
| Météo / nuit | `[?]` | P | Nuit : visibilité, attente dehors moins viable |

## 8. Les 5 contraintes qui pèsent le plus (à valider par l'équipe)

1. **Le préavis** : 10 à 40 min pour des milliers de personnes ; tout le reste en découle.
2. **L'heure de 22 h pour les stations** : fenêtre de sortie fermée sans réouverture connue ; elle remplace le couvre-feu de 23 h comme vrai butoir.
3. **Le périmètre autour des portes Berger et Rambuteau** : une partie des sorties donne vers la zone interdite ou de troubles.
4. **Le goulot vertical** : 4 niveaux, escalators comptés à 50 %, ascenseurs peu nombreux, personnes à mobilité réduite.
5. **Le flou de décision** : règlement fait pour l'incendie, pas pour un ordre de préfecture ; savoir qui décide et avec quelles marges n'est pas écrit publiquement.
