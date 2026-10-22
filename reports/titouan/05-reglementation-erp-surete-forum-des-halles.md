# 05 - Réglementation ERP, sûreté et spécificités du Forum des Halles

Périmètre : sources publiques, usage défensif (valider une simulation de sortie de foule d'un cinéma du Forum des Halles le soir, après une alerte de trouble à l'ordre public). Convention : chaque affirmation porte une URL ; « à vérifier » = non confirmé par une source lue pendant cette recherche (connaissance générale ou source secondaire). Les sites type sitesecurite.com reprennent le texte de l'arrêté : vérifier sur Légifrance avant de citer en soutenance.

## 1. Règles chiffrables pour valider la simulation (le plus utile)

Source principale : arrêté du 25 juin 1980, dispositions générales, articles CO 34 à CO 42 (https://sitesecurite.com/contenu/_erp/erp/co34a42.php?id= ; texte officiel : https://legifrance.gouv.fr/codes/section_lc/JORFTEXT000000290033/LEGISCTA000020303940).

| Règle | Valeur | Source |
|---|---|---|
| Unité de passage (UP) | 0,60 m | CO 36 (lien ci-dessus) |
| Largeur réelle si 1 UP | 0,90 m | CO 36 |
| Largeur réelle si 2 UP | 1,40 m | CO 36 |
| Au-delà de 2 UP | n x 0,60 m (déduit de CO 36 §2) | CO 36 |
| Local/niveau de plus de 200 personnes | dégagements normaux d'au moins 2 UP (exception : 1 UP admise si comptée une seule fois) | CO 36 §3 |
| 1 à 19 personnes | 1 dégagement de 1 UP | CO 38 |
| 20 à 50 personnes | 2 dégagements (dont 1 de 1 UP) | CO 38 |
| 51 à 100 personnes | 2 dégagements de 1 UP, ou 1 de 2 UP + 1 accessoire | CO 38 |
| Plus de 100 personnes | 2 dégagements jusqu'à 500 personnes, puis +1 dégagement par tranche de 500 (ou fraction) au-delà | CO 38 §1 d |
| Largeur cumulée | 1 UP par 100 personnes (ou fraction) ; sous 501 personnes, nombre d'UP majoré de 1 | CO 38 §1 d |
| Étages / sous-sols (escaliers) | l'effectif cumule celui du niveau et des niveaux au-dessus (surélévation) ou au-dessous (sous-sol) | CO 38 §2 |
| Sous-sol profond (>2 m sous le seuil des issues et >100 personnes) | effectif arrondi à la centaine supérieure et majoré de 10 % par mètre au-delà de 2 m | CO 39 §2 |
| Escaliers mécaniques / trottoirs roulants | 50 % au plus comptent dans le calcul ; 0,80 m entre mains courantes = 1 UP, 1,20 m = 2 UP | CO 36 §4 |
| Salle de cinéma/spectacle, rangées alternatives | max 50 sièges entre deux circulations (8 si une seule circulation) ; sorties et UP de la salle majorées d'un tiers, chaque sortie d'au moins 3 UP ; circulations de 3 UP si rangées de plus de 32 sièges | L 26 à L 29 : https://sitesecurite.com/contenu/_erp/erpl/l26a29.php?id= |
| Salle de plus de 700 places | dégagement de 2 UP parallèle aux rangées ; au-delà de 1 500 places, blocs de 700 places ceinturés par des circulations de 2 UP | même source |

Exemple de calcul pour le simulateur : une salle de 300 spectateurs au niveau -2 exige, par CO 38, 2 dégagements et 3 + 1 = 4 UP (300/100 = 3, majoré de 1 sous 501 personnes). Ce calcul est une application directe du texte, à faire valider par un SSIAP ou le bureau de contrôle.

**Débit et temps cibles : non fixés par l'arrêté dans les sources lues.** Le règlement dimensionne par largeur, pas par temps. Les ordres de grandeur suivants sont donc des hypothèses de modélisation à vérifier (à vérifier) :
- débit d'une UP : de l'ordre de 40 à 70 personnes par minute selon la littérature de dynamique piétonne (à vérifier, non sourcé ici) ; il vaut mieux le traiter comme paramètre calibrable que comme règle ;
- temps de sortie « de salle » visé : souvent 2 à 3 minutes pour les salles, et ~1 UP/100 personnes est historiquement pensé pour une évacuation en quelques minutes (à vérifier) ;
- l'ancienne grille « 1 UP = 100 personnes » implique, pour 100 personnes par UP à ~60 pers/min, environ 1 min 40 s de débit pur (calcul simple, hypothèse de débit à vérifier).

Recommandation pour le pitch : annoncer que la simulation mesure l'écart par rapport à la capacité théorique des UP (taux d'utilisation des sorties, goulots), et non un « temps réglementaire » qui n'existe pas dans le texte lu.

## 2. Classement et cadre général des ERP

| Sujet | Contenu | Source |
|---|---|---|
| Catégories | 1re : plus de 1 500 personnes ; 2e : 701 à 1 500 ; 3e : 301 à 700 ; 4e : jusqu'à 300 (hors 5e) | https://www.rt-events.fr/prestation/lieu-type-categorie/ ; https://aisne.gouv.fr/Actions-de-l-Etat/Securite-et-protection-de-la-population/Service-Interministeriel-de-Defense-et-de-Protection-Civile/ETABLISSEMENTS-RECEVANT-DU-PUBLIC-ERP/La-securite-dans-les-etablissements-recevant-du-public-ERP |
| Types | L : salles d'auditions, conférences, réunions, spectacles ou usage multiple ; M : magasins de vente, centres commerciaux ; GN 1 définit les types | https://legifrance.gouv.fr/codes/id/LEGISCTA000020303815 |
| Principe CCH R123-7 | sorties, espaces d'attente sécurisés et dégagements permettent « l'évacuation ou la mise à l'abri préalable » ; au moins 2 sorties ; nombre et largeur proportionnés | https://culturegrandest.fr/les-essentiels/guide-de-la-securite/laccueil-du-public/levacuation-du-public |
| Commissions de sécurité | visites périodiques : 1re et 2e catégories tous les 3 ans, 3e et 4e tous les 5 ans | https://gammeo.com/gestion-des-risques/la-commission-de-securite-quest-ce-que-cest |
| Autorisation de travaux | autorisée par la mairie après avis de la CCDSA | https://service-public.fr/professionnels-entreprises/vosdroits/F31687 |
| Pouvoir de police du maire | rôle de prévention incendie/panique dans les ERP (à Paris, ce pouvoir est exercé par le préfet de police : à vérifier) | https://www.sdis73.fr/internet/upload/docs/application/pdf/2022-12/guide_erp_a_destination_des_maires_v12.2022.pdf |
| Service de sécurité des centres commerciaux | M 29 : au-delà du noyau SSIAP dédié à l'incendie, d'autres agents peuvent cumuler des tâches de sûreté (dérogation à MS 46) | https://ssiap.pro/glossaire/article-m-29/ |
| Type L et SSIAP | calcul de l'effectif, maîtrise des dégagements, obligations SSIAP | https://www.cofrasec.fr/erp-type-l/ |
| Type M | effectif, maintien des dégagements, désenfumage, éclairage de sécurité | https://www.cofrasec.fr/erp-type-m/ |

Non couvert par une source lue (à vérifier) : valeurs exactes de désenfumage pour M et L, fréquence des exercices d'évacuation (usage courant : au moins semestriel pour les établissements concernés), contenu du registre de sécurité, consignes et plans d'évacuation affichés (art. MS et dispositions générales). Les 4 builders ne doivent pas coder ces valeurs sans les vérifier sur Légifrance.

## 3. Évacuation, mise à l'abri, confinement : à ne pas confondre

| Notion | Sens | Implication pour la simulation |
|---|---|---|
| Évacuation | sortie rapide hors du bâtiment ; logique incendie du règlement ERP | scénario de référence, mesurable par temps de sortie |
| Mise à l'abri | reste dans le bâtiment ou rejoint un lieu protégé en attendant ; le CCH R123-7 parle de « mise à l'abri préalable » (source section 2) | scénario alternatif : comparer sortir vers la rue vs se replier |
| Confinement | rester à l'intérieur, fermer accès ; réflexe type risque extérieur | pertinent si l'extérieur est plus dangereux que l'intérieur |

Pour un trouble à l'ordre public à l'extérieur, la consigne officielle observée côté commerçants est de rester à l'intérieur, de ne pas s'interposer et de composer le 17 (préfet de police Patrice Faure, via franceinfo : https://www.franceinfo.fr/societe/mobilisation-du-17-octobre/info-franceinfo-le-prefet-de-police-de-paris-conseille-aux-commercants-de-renforcer-leur-securite-et-d-adapter-leurs-horaires-avant-les-prochaines-manifestations_8247901.html). Cela signifie qu'une sortie de cinéma qui déverse un millier de personnes dans une zone de trouble est un cas où « sortie différée / mise à l'abri » doit être comparée à l'évacuation immédiate. La définition précise de chaque notion dans les guides SGDSN/ministère de l'Intérieur : à vérifier (la page info.gouv.fr du plan n'a pas pu être lue).

## 4. Vigipirate et guides de sûreté

| Élément | Contenu | Source |
|---|---|---|
| Nouveau plan 2026 | stades « vigilance », « vigilance renforcée », « alerte attentat » ; posture été-automne 2026 effective au 22 juin 2026 | https://seine-maritime.gouv.fr/Actions-de-l-Etat/Securite-et-Defense/Securite-publique/Plan-Vigipirate/Adaptation-de-la-posture-Vigipirate-ete-automne-2025-urgence-attentat |
| Posture précédente | hiver-printemps 2026 au niveau « urgence attentat », accent sur les grands espaces de commerce, tourisme et loisirs | https://ain.gouv.fr/Actions-de-l-Etat/Securite/Protection-civile/Grands-rassemblements-et-Vigipirate/Posture-Vigipirate-hiver-printemps-2026 |
| Principes | évaluer la menace, connaître les vulnérabilités, déterminer un dispositif ; plan relevant du Premier ministre, associant État, collectivités, opérateurs et citoyens | https://info.gouv.fr/risques/le-plan-vigipirate |
| Guides | guide de bonnes pratiques pour organisateurs d'événements ; affiche « Réagir en cas d'attaque terroriste » | https://ain.gouv.fr/Actions-de-l-Etat/Securite/Protection-civile/Grands-rassemblements-et-Vigipirate/Posture-Vigipirate-hiver-printemps-2026 ; https://gironde.gouv.fr/Actions-de-l-Etat/Securite/Securite-interieure/Menace-terroriste/Posture-Vigipirate-le-niveau-urgence-attentat-declare |
| Guide centres commerciaux SGDSN | existence et contenu : à vérifier (non trouvé en lecture) | https://vigipirate.gouv.fr/ (accès indiqué par https://armement.defense.gouv.fr/securite-et-habilitation/formation-en-securite/pour-aller-plus-loin-e-learning) |

Conséquence : le niveau de posture influence les contrôles aux accès et la présence de sûreté, ce qui modifie les débits d'entrée, mais pas les largeurs de sortie. À modéliser comme paramètre « filtrage aux accès ».

## 5. Ordre public : Préfecture de police, couvre-feu, interdictions

Actualité directement pertinente pour le scénario (date de la recherche : 22/10/2026) :

| Fait | Source |
|---|---|
| Arrêté n°2026-01403 de la Préfecture de police : interdiction des rassemblements et manifestations non déclarés le jeudi 22 octobre 2026, de 8h à 20h, dans plusieurs secteurs dont Châtelet, les Halles, l'île de la Cité, le quartier des grands magasins et les abords des gares | https://sortiraparis.com/actualites/a-paris/articles/355468-manifestation-lyceenne-paris-les-rassemblements-non-declares-interdits-des-8h-ce-jeudi-les-quartiers-concernes |
| Couvre-feu dans certains secteurs de Paris de 23h à 6h (nuit de mercredi à jeudi), pris par arrêté de la Préfecture de police, accompagné d'une interdiction de rassemblement non déclaré ; troisième nuit consécutive | https://www.corsematin.com/article/francemonde/4154064516644614/nouveau-couvre-feu-mercredi-soir-dans-certains-secteurs-de-paris-prefecture-de-police ; https://sur.corsematin.com/f40J |
| Fermeture de neuf stations de métro et de gares liée aux interdictions, le 22/10/2026 | https://leparisien.fr/info-paris-ile-de-france-oise/transports/manifestations-interdites-a-paris-plusieurs-stations-de-metro-fermees-dont-deux-gares-sncf-a-partir-de-10-heures-ce-jeudi-22-10-2026-3VQMYEFQNFFWZHFWDNV55AGCJI.php (stations exactes et présence de Châtelet : à vérifier) |
| Régime de la manifestation : simple déclaration préalable (art. L211-1 et s. du code de la sécurité intérieure), interdiction contrôlée par le juge en référé-liberté | https://nausica-avocats.fr/une-interdiction-dune-manifestation-a-lepreuve-du-refere-liberte |

Ce que peut ou doit faire le gestionnaire (sources lues) : suivre les recommandations du préfet de police : renforcer la sécurité privée, vérifier alarmes et vidéoprotection, baisser les rideaux et protéger les vitrines, avancer ou différer la fermeture, rester à l'intérieur et composer le 17 en cas de troubles (franceinfo, lien section 3). Le gestionnaire n'a pas de pouvoir de police sur la voie publique ; ses leviers sont d'exploitation (horaires, accès, sûreté interne). Le fondement juridique exact d'un couvre-feu local et son opposabilité à un ERP : à vérifier. Le rôle de la police municipale à Paris (police municipale parisienne récente, compétences limitées par rapport à la Préfecture de police) : à vérifier.

Point d'attention important pour le jeu de données : si un arrêté prévoit un couvre-feu à 23h, la séance de cinéma de fin de soirée est précisément le cas critique (sortie de salles juste avant ou pendant un couvre-feu, métro/RER partiellement fermés). Ce croisement est une hypothèse de scénario à expliciter, pas un fait sourcé.

## 6. Spécificités du Forum des Halles

| Élément | Contenu | Source / statut |
|---|---|---|
| Gestionnaire/propriétaire du centre | Unibail-Rodamco-Westfield (centre commercial) ; RATP pour le pôle de transport Châtelet-Les Halles | https://wikipedia-org.zproxy.org/wiki/Les_Halles ; https://www.urw.com/fr/portefeuille/westfield-forum-des-halles |
| Surface et parking | 77 500 m2 de GLA ; 879 places de parking ; « cinéma le plus fréquenté d'Europe » (selon URW) | https://www.urw.com/fr/portefeuille/westfield-forum-des-halles |
| Structure | construit en grande partie en sous-sol, relié au hub RER/métro, cinq niveaux sous la canopée, environ 150 boutiques | https://en.wikipedia.org/wiki/Forum_des_Halles ; https://aroundus.com/p/10429094-westfield-forum-des-halles |
| Hub de transport | environ 750 000 voyageurs/jour, cinq lignes de métro et trois lignes RER (source secondaire) | https://malls.com/malls/le-forum-des-halles (à vérifier) |
| Type et catégorie ERP | probablement type M avec parties de type L (cinéma), 1re catégorie vu la fréquentation (hypothèse logique) | à vérifier : aucun texte officiel trouvé |
| Plan, nombre de sorties, effectif autorisé, résultats des commissions | non publics dans les sources lues | à vérifier : demander à URW/PP ou travailler sur des paramètres hypothétiques |
| Fermeture exceptionnelle | le centre a fermé le 10 septembre 2025 lors de la mobilisation « Bloquons Tout » ; la décision est attribuée au Forum des Halles | https://sortiraparis.com/en/news/in-paris/articles/332564-exceptional-closure-of-halles-chatelet-shopping-center-in-paris |
| Tentative de pillage signalée (Adidas) lors de troubles, relayée par réseaux sociaux | source faible | https://cedarnews.net/newstasks/1078822/paris-forum-des-halles-targeted-in-reported-looting-attempt-video (à vérifier) |
| Mouvements de panique sur fausse alerte autour des Halles/Châtelet | 15/11/2015 (République et près des Halles) ; 17/09/2016 (rumeur de prise d'otages à Saint-Leu, foule en fuite, gens réfugiés dans des commerces, fausse alerte) | https://www.lefigaro.fr/actualite-france/2015/11/15/01016-20151115ARTFIG00164-mouvements-de-panique-dans-le-centre-de-paris-suite-a-une-fausse-alerte.php ; https://www.bfmtv.com/police-justice/fausse-alerte-attentat-a-paris-ce-qu-il-s-est-passe-a-chatelet_AV-201609170028.html |

Les incidents 2015 et 2016 sont utiles comme références qualitatives : une rumeur suffit à déclencher une fuite de foule, sans danger réel, et les commerces servent de refuges spontanés.

## 7. Paramètres à injecter dans la simulation

1. Capacité de sortie par salle et par couloir en UP (règle CO 38) avec majoration d'un tiers de L 26 à L 29 le cas échéant.
2. Prise en compte du sous-sol : effectif théorique majoré de 10 %/m au-delà de 2 m (CO 39), cumul d'effectifs pour les escaliers (CO 38 §2), 50 % max des escaliers mécaniques (CO 36 §4).
3. Variable « sortie différée / confinement » contre « évacuation immédiate », avec seuil de décision.
4. Variable « environnement extérieur » : zone interdite aux rassemblements, couvre-feu, stations de métro/RER fermées (réduit les exutoires aval).
5. Métriques proposées : temps de sortie du dernier occupant, densité maximale par m2, taux d'utilisation de chaque sortie, nombre de personnes envoyées vers une zone de trouble. Aucune de ces métriques n'est imposée par un texte : à présenter comme indicateurs de comparaison.

## Résumé en 5 lignes

1. Le dimensionnement réglementaire est en unités de passage : 1 UP = 0,60 m (0,90 m si 1 UP, 1,40 m si 2 UP), 1 UP pour 100 personnes (+1 sous 501), 2 sorties jusqu'à 500 personnes puis +1 par 500 (CO 36 et CO 38).
2. Pour un cinéma (type L), sorties et UP de salle majorées d'un tiers dans le cas des rangées alternatives, avec circulations de 3 UP au-delà de 32 sièges (L 26 à L 29) ; en sous-sol, effectif majoré de 10 % par mètre au-delà de 2 m (CO 39).
3. Aucun temps d'évacuation ni débit par UP n'est fixé dans les textes lus : traiter ces valeurs comme paramètres calibrables et les marquer « à vérifier ».
4. Le contexte du 22/10/2026 est très pertinent : arrêté n°2026-01403 interdisant les rassemblements à Châtelet-Les Halles de 8h à 20h et couvre-feux nocturnes dans des secteurs de Paris ; la consigne officielle côté commerçants est de rester à l'intérieur et d'appeler le 17.
5. Le Forum (URW, 77 500 m2, relié au hub RER/métro Châtelet-Les Halles, probablement 1re catégorie) n'a pas de plan ni de dossier de sécurité public ; à compléter par hypothèses explicites et à vérifier : type/catégorie officiels, guide SGDSN centres commerciaux, rôle de la police municipale, fréquence des exercices.
