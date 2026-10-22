# Catalogue des décisions : leviers, contraintes et dépendances des 6 décideurs

Décision débloquée : coder les menus de décision des agents (lot `decideurs`, ticket #10). Recherche du 22 oct. 2026, sources publiques. `[?]` = non vérifié. `H` = hypothèse à régler (aucun chiffre public). Je n'ai pas relu ce qui est déjà dans `contraintes-forum-des-halles.md`, `instantane-3-agents-decisionnels.md`, `criteres-jugement-crise.md` : je les cite par leur nom court. Garde-fou : protection des personnes ; la menace reste une donnée d'entrée (zone ou issue fermée), jamais un agent.

## 0. Version simple

Six acteurs, mais un seul a un vrai pouvoir sur la foule du Forum : le directeur du centre (ses portes, ses horaires, ses annonces). Les autres posent des bornes de l'extérieur. La préfecture dit « interdit après 23 h » et demande de fermer les stations. La RATP exécute et ne décide presque pas. Le cinéma décide seul de la sortie de ses salles. Les pompiers n'interviennent que s'il y a un sinistre ou un malaise. Le piège de la crise du 19 oct. n'est pas un manque de moyens : c'est que chaque acteur apprend la décision de l'autre trop tard.

Termes : **ERP** = établissement recevant du public, soumis au règlement de sécurité incendie. **SSIAP** = agents de sécurité incendie et d'assistance aux personnes. **PCS** = poste central de sécurité, la pièce d'où le centre pilote alarme, portes, annonces. **BSPP** = brigade des sapeurs-pompiers de Paris. **PC** = poste de commandement. **PMR** = personne à mobilité réduite.

## 1. Qui a l'autorité, sur quelle base

| Décideur | Autorité réelle | Base juridique | Source |
|---|---|---|---|
| Préfecture de police (préfet de police) | Couvre-feu local, interdiction de rassemblement, demande de fermer des stations. Pas de pouvoir direct sur les portes du centre. | Pouvoir de police générale du préfet et du maire, hors état d'urgence ; l'état d'urgence a été écarté le 19 oct. | [Public Sénat](https://publicsenat.fr/actualites/politique/violences-du-17-octobre-pourquoi-letat-durgence-est-ecarte-par-le-gouvernement) |
| | Réquisition possible (prestations, personnes) par arrêté visant L2215-1 CGCT | Code général des collectivités territoriales | [PagesJaunes Justice](https://justice.pagesjaunes.fr/astuce/voir/553677/requisition) (secondaire) |
| | Fermeture d'un ERP en infraction aux règles de sécurité : maire ou préfet de département, après avis de la commission. Un ordre de fermeture pour trouble à l'ordre public relève de la police générale, pas de ce texte | L123-4 CCH | [Weka](https://www.weka.fr/actualite/securite/article_juridique/securite-dans-les-erp-le-pouvoir-du-maire-de-fermer-un-etablissement-recevant-du-public-45551/) |
| | Fermeture du Forum le 10 sept. 2025 : « demandée » puis « recommandée » par le préfet, exécutée par l'exploitant (Westfield) | pas d'arrêté cité | [Le Figaro](https://www.lefigaro.fr/conjoncture/blocages-du-10-septembre-le-centre-commercial-du-forum-des-halles-ferme-apres-des-appels-aux-pillages-20250910) |
| RATP / PC | Exécute : ferme la station, trains sans arrêt, aucune correspondance. Rouvre seulement avec l'accord de la police. | « à la demande de la préfecture de police » | [ftnnews](https://ftnnews.com/travel-news/rail/paris-metro-closes-25-stations-today), [Le Parisien](https://leparisien.fr/info-paris-ile-de-france-oise/transports/manifestations-interdites-a-paris-plusieurs-stations-de-metro-fermees-dont-deux-gares-sncf-a-partir-de-10-heures-ce-jeudi-22-10-2026-3VQMYEFQNFFWZHFWDNV55AGCJI.php) |
| | Procédure interne (colis suspect, Vigipirate) : arrêt de trafic par l'exploitant | plan Vigipirate | [RATP Group](https://ratpgroup.com/fr/solutions-et-expertises/surete/prevention-et-detection-du-risque-attentat/) |
| Chef de sécurité du centre (SSIAP, PCS) | Exécute les consignes de l'exploitant : application des consignes, premières mesures, cheminements libres, évacuation des PMR. Sous l'autorité du directeur. | MS 46, MS 47 | [Cofrasec](https://www.cofrasec.fr/erp-type-m/), [Trinacre](https://trinacre.com/formation-incendie-erp) |
| Directeur du centre (exploitant) | Les procédures et consignes d'évacuation sont élaborées « sous l'autorité de l'exploitant ». Il répond de l'entretien et de la sécurité. Un centre commercial est un groupement d'ERP traité à l'échelle de l'ensemble. | R143-34 CCH, M 1 | [Service-Public](https://entreprendre.service-public.gouv.fr/vosdroits/F31684), [Cofrasec](https://www.cofrasec.fr/erp-type-m/) |
| Exploitant UGC | Maître de ses 27 salles : arrêter une séance, vider, rembourser. A suivi les « consignes préfectorales » (HuffPost) ou un « ordre » (Télérama) : contradiction. | même cadre ERP | [HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html), [Télérama](https://www.telerama.fr/cinema/a-paris-le-cinema-ugc-cine-cite-les-halles-evacue-en-derniere-minute-a-cause-du-couvre-feu-7033457.php) |
| BSPP | Armée de terre mise à disposition du préfet de police ; secours, malaises, levée de risque. Dirige les secours en cas de sinistre. | Code de la défense R1321-19 et suivants | [Wikipedia](https://en.wikipedia.org/wiki/Paris_Fire_Brigade), [Grokipedia](https://grokipedia.com/page/Paris_Fire_Brigade) (secondaires) |

À faire valider par un juriste `[?]` : si le préfet peut ordonner à un centre commercial de fermer sans incendie, et sur quel texte. Dans le simulateur, le préfet « demande » et le directeur « exécute ou négocie ».

## 2. Ordre des décisions et information qui arrive en retard

Chronologie du 19 oct. (sources : [BFM](https://www.bfmtv.com/culture/cinema-series/gardez-votre-ticket-quand-le-couvre-feu-a-paris-interrompt-des-seances-a-l-ugc-cine-les-halles_AN-202610200618.html), [Le Parisien](https://leparisien.fr/info-paris-ile-de-france-oise/transports/couvre-feu-a-paris-des-stations-de-metro-et-rer-fermees-les-correspondances-pas-assurees-19-10-2026-FQUX6KCXZZFYZOJT4S7JONXZ3M.php), [actu.fr](https://actu.fr/ile-de-france/paris_75056/vous-nous-avez-quand-meme-fait-payer-la-colere-des-spectateurs-apres-l-evacuation-de-l-ugc-de-chatelet_64948689.html)) :
1. Midi : Premier ministre demande aux préfets des couvre-feux locaux, Halles et République cités ([Linternaute](https://linternaute.com/actualite/societe/11309491-couvre-feux-en-france-paris-grandes-et-moyennes-villes-quelles-interdictions-a-partir-de-lundi-19-octobre)).
2. ~19 h 20 : préfet de police annonce couvre-feu 23 h-6 h (Halles, République) et interdiction de manifester 20 h-6 h.
3. 19 h 30-20 h : UGC vide ses salles, ~3 000 personnes ; ticket à garder, remboursement plus tard.
4. 22 h : stations Châtelet, Les Halles, Châtelet-Les Halles fermées, trains sans arrêt.
5. 23 h : couvre-feu.

Ordre type : préfecture (borne) -> exploitants (centre, cinéma) et RATP (en parallèle) -> BSPP seulement si incident. L'agent préfecture joue seul au tour 0 ; les trois autres reçoivent son message avec un retard réglable.

Information en retard, faits : UGC dit avoir été prévenu « à la dernière minute » (Télérama, communication UGC). Que ce soit par la Ville plutôt que par la préfecture : **non retrouvé dans les sources** `[?]`, à poser comme scénario (« la préfecture prévient la Ville, la Ville prévient les exploitants ») avec un retard H de 5 à 30 min. Autre fait : le tribunal administratif de Paris a ordonné le 21 oct. de publier les arrêtés de couvre-feu au moins 12 h avant leur entrée en vigueur ([Le Parisien](https://leparisien.fr/paris-75/couvre-feux-a-paris-la-justice-demande-au-prefet-de-publier-ses-arretes-au-moins-12-heures-avant-lentree-en-vigueur-22-10-2026-5X24ZZN5BNDU3NB5DSCCSKWNCA.php)). Conséquence de modélisation : le 19 oct., le préavis réel de 3 h 40 pour un couvre-feu de 23 h était hors de ce futur délai ; pour les scénarios « après le 21 oct. » le préavis passe à 12 h ou plus.

## 3. Retours d'expérience (RETEX = retours d'expérience)

| Cas | Ce qui a marché | Ce qui a échoué | Source |
|---|---|---|---|
| Stade de France, 28 mai 2022 | Séparer les flux RER B/D et ligne 13 (demande FFF) | Filtrage des billets dans un pré-filtre testé une seule fois ; aucune voie d'évacuation pour les refoulés ; report RER B vers D sans voie de délestage ; signalétique de sortie du RER D démontée ; coordination insuffisante | [Ouest-France](https://www.ouest-france.fr/sport/football/direct-incidents-au-stade-de-france-le-senat-rend-ses-conclusions-33c96fb4-028e-11ed-8fbe-98a3866fe2c5), [Sénat](https://www.senat.fr/rap/r21-776/r21-7762.html) |
| | | Rapport UEFA : congestion non résolue, gaz lacrymogène sans justification | [Wikipedia](https://en.wikipedia.org/wiki/2022%20UEFA%20Champions%20League%20final%20chaos) |
| Forum des Halles, 10 sept. 2025 | Fermeture du centre + de la gare par le préfet, le même après-midi ; ambiance calme, agents de sécurité qui orientent | Voyageurs surpris (bagages en consigne) ; pas de réouverture annoncée | [Le Figaro](https://www.lefigaro.fr/conjoncture/blocages-du-10-septembre-le-centre-commercial-du-forum-des-halles-ferme-apres-des-appels-aux-pillages-20250910), [Europe 1](https://europe1.fr/societe/en-direct-mouvement-du-10-septembre-suivez-levolution-de-la-mobilisation-nationale-bloquons-tout-772027) |
| Colis suspects, 2 nov. 2017 | Évacuation de 600+ personnes en 10-15 min, annonce haut-parleurs + agents + police ; alerte levée en ~1 h après arrivée du laboratoire de la préfecture | Mesure « très rare » : normalement on fait un périmètre | [Paris Match](https://www.parismatch.com/Actu/Societe/Paris-le-Forum-des-Halles-evacue-1384190), [Ouest-France](https://www.ouest-france.fr/ile-de-france/paris-75000/paris-le-forum-des-halles-evacue-apres-deux-colis-suspects-5353954) |
| UGC, 19 oct. 2026 | Salles vidées en 30-40 min sans incident connu | Annonce par un employé à voix haute, remboursement différé, spectateurs furieux, préavis court | [HuffPost](https://www.huffingtonpost.fr/culture/article/a-paris-le-couvre-feu-a-eu-des-consequences-inattendues-pour-ces-spectateurs-de-l-ugc-les-halles_342312.html), [La Dépêche](https://www.ladepeche.fr/2026/10/20/violences-du-17-octobre-ils-ont-arrete-la-seance-en-plein-milieu-le-couvre-feu-est-decrete-pendant-leur-film-ils-se-retrouvent-mis-a-la-porte-13611633.php) |

Leçons à coder : (1) ne jamais fermer une entrée sans une voie pour ceux qu'on refoule (SdF) ; (2) rediriger vers une autre station sans délestage crée un nouveau goulot (SdF) ; (3) fermer tôt et complètement est possible quand préfecture et centre se parlent (10 sept.) ; (4) annoncer aux salles par voix humaine, sans alarme, tient (UGC, 2017).

Contraintes physiques en plus pour la RATP : les tapis roulants de Châtelet (RER vers lignes 1, 7, 11) étaient à l'arrêt depuis oct. 2025, réouverture repoussée à septembre 2026 ; le couloir de 160 m se fait à pied ([Sortiraparis](https://sortiraparis.com/en/news/in-paris/articles/337536-transports-the-closure-of-the-chatelet-moving-walkway-has-been-extended-again-until-when)). État au 19 oct. 2026 `[?]`.

## 4. Menus de décision par décideur

Colonne « Choix de l'agent » : **OUI/NON** = question fermée ; **CHOIX** = une option parmi une liste ; **SCORE** = valeur à régler et à comparer par simulation. Délais : `H` sauf source. Chaque levier porte la ligne « base » à afficher dans l'interface.

### 4.1 Préfecture de police (8 leviers) : pose les bornes

| # | Levier | Effet sur la foule | Délai | Contrainte | Choix de l'agent |
|---|---|---|---|---|---|
| P1 | Ne rien annoncer / annoncer | Sans annonce, foule présente jusqu'à la fermeture normale | annonce -> exécution : 10-40 min (BFM, Le Parisien) | Doit publier ≥ 12 h avant (TA, 21 oct.) | OUI/NON + heure d'annonce (SCORE) |
| P2 | Heure de début du couvre-feu (23 h le 19 oct.) | Fixe l'échéance finale | immédiat | Arrêté motivé ; contestable devant le juge | CHOIX {22 h, 23 h, 24 h} |
| P3 | Heure de début de l'interdiction de manifester (20 h) | Change le risque dehors | immédiat | idem | CHOIX {18 h, 20 h, 22 h} |
| P4 | Périmètre : Berger, Rambuteau, Sébastopol, Lingères, Maurice-Quentin, Breton | Zone interdite = sorties du Forum qui deviennent impraticables | immédiat | Exceptions : résidents, travailleurs, secours, commerçants | CHOIX {périmètre restreint, élargi} |
| P5 | Demander la fermeture de stations (Châtelet, Les Halles, RER) et l'heure (22 h) | Coupe la sortie par le métro | RATP applique « sans préavis » (Sortiraparis) | Réouverture seulement sur son accord | CHOIX {pas de fermeture, 22 h, 20 h30, tout de suite} |
| P6 | Demander la fermeture du centre et de l'UGC | Vide la zone | 1 à 3 h H | Pas de texte public sur l'ordre sans incendie `[?]` | OUI/NON |
| P7 | Camions, canons à eau, barrages sur accès | Ferme physiquement des issues | H 15-30 min | Déjà utilisés le 17 oct. (franceinfo) | CHOIX {aucun, rues Berger, Berger + Rambuteau} |
| P8 | Renforts et messages aux exploitants (Ville comprise) | Réduit l'incertitude | H 5-30 min | Forces déjà mobilisées | SCORE (nombre d'unités) |

Dépend de : rien en amont. Ses P5 et P6 imposent un délai à la RATP et au centre. Garde-fou : P7 n'est pas optimisé contre la foule ; c'est un scénario fixé d'avance.

### 4.2 RATP et son PC (8 leviers) : exécute, peut proposer

| # | Levier | Effet | Délai | Contrainte | Choix |
|---|---|---|---|---|---|
| R1 | Garder la station ouverte jusqu'à l'ordre | Fenêtre de sortie vers le métro | immédiat | Surcharge si tout le monde y va | OUI/NON |
| R2 | Fermer la station (trains sans arrêt, sans correspondance) | Supprime la sortie métro ; la foule restante s'accumule en surface | « à la demande », heure annoncée (22 h) | Réouverture sur accord police (ftnnews) | CHOIX {22 h, anticipé de 30 min, tout de suite} |
| R3 | Fermer par étapes (une ligne, un quai, une bouche) | Étale le flux | H 5-10 min | 8 sorties du Forum vers le métro/RER (Bonjour RATP) | CHOIX {sortie 1..8 fermée ou non} |
| R4 | Trains sans arrêt, dérivation RER A/B/D, RER B coupé vers le nord après 22 h 45 | Réduit l'offre de départ | H 10-20 min | Travaux en cours (Sortiraparis) | CHOIX {offre normale, réduite} |
| R5 | Annonces sonores en gare et sur écrans | Informe la foule du métro | H 2-5 min | Messages en deux langues `[?]` | SCORE (nombre de messages) |
| R6 | Contrôle des accès (filtrer l'entrée, sens unique) | Contrôle la densité aux quais | H 5-10 min | Le tapis roulant de Châtelet à l'arrêt | OUI/NON |
| R7 | Lever un doute colis (arrêt du trafic) | Coupe temporairement tout | H 30-60 min (45 min en moyenne, [RATP Group](https://ratpgroup.com/fr/solutions-et-expertises/surete/prevention-et-detection-du-risque-attentat/)) | Hors périmètre du scénario de base | OUI/NON (activable) |
| R8 | Renfort d'agents de station et de sûreté | Guidage, dissuasion | H 15-30 min | Effectifs non publics | SCORE |

Ordre : reçoit P5, répond à P5. Elle peut proposer (R3) à la préfecture mais n'impose rien.

### 4.3 Chef de sécurité du centre / PCS (10 leviers) : exécute pour le directeur

Aucune règle publique ne dit s'il peut décider seul (MS 46 : « sous l'autorité de l'exploitant »).

| # | Levier | Effet | Délai | Contrainte | Choix |
|---|---|---|---|---|---|
| S1 | Ouvrir / fermer une porte précise parmi 9 + Canopée + parking | Redirige la foule | H 2-5 min par porte | Sorties réglementaires non condamnables `[?]` | CHOIX par porte (OUI/NON) |
| S2 | Escaliers mécaniques : laisser, arrêter, inverser | Capacité de sortie (CO 34 : 50 % comptent) | H 1-3 min | Règle d'arrêt en évacuation non lue `[?]` | CHOIX {laisser, arrêter, sens sortie} |
| S3 | Condamner les ascenseurs | Évite le blocage ; piège les PMR | H 1 min | Clé de pilotage tenue à disposition du directeur des secours (AS 4, [SiteSecurite](http://sitesecurite.com/contenu/_erp/erp/as04a05_5POI.php?id=)) | OUI/NON |
| S4 | Annonce par zone ou par niveau, sans alarme générale | Réduit le pré-mouvement ; voix : moyenne 44 s en cinéma (Lund) | H 1-2 min | Alarme générale = risque de panique, à éviter (rapport contraintes) | CHOIX {aucune, restreinte, générale}, défaut « restreinte » |
| S5 | Placer les agents (portes, escaliers, ascenseurs, EAS) | Guide, rassure | H 3-10 min | Effectif non public ; un agent = un point | SCORE (répartition) |
| S6 | Assistance aux PMR : EAS, évacuation différée | Garde les fragiles à l'abri | H 5-15 min | EAS = zone à l'abri (CO 34 §6) ; prise en charge par SSIAP | OUI/NON par niveau |
| S7 | Phaser la sortie : par niveau, par secteur | Évite la cohue aux escaliers | H 5 min par vague | Boutiques = locataires | CHOIX {tous, 2 vagues, 3 vagues} |
| S8 | Confiner (garder dedans) | Évite la rue dangereuse | immédiat | Le centre ferme à 20 h 30 ; durée et capacité d'accueil inconnues `[?]` | OUI/NON + durée (SCORE) |
| S9 | Filtrer les entrées (arrêter l'entrée, sens unique) | Arrête l'accumulation | H 2-5 min | Entrées par métro | OUI/NON |
| S10 | Parking : sortie par vagues (12 rue Turbigo) | Évite la croisée de flux | H 10 min | Peut croiser un périmètre | CHOIX {libre, par vagues, fermé} |

### 4.4 Directeur du centre (9 leviers) : décide, répond de la sécurité

| # | Levier | Effet | Délai | Contrainte | Choix |
|---|---|---|---|---|---|
| D1 | Rester ouvert / fermer plus tôt / fermer maintenant | Heure de début de la sortie | décision -> sortie : 10-40 min | Figaro 2025 : fermeture fait suite à une demande préfectorale | CHOIX {horaire normal, 20 h, immédiat} |
| D2 | Fermer par étapes (niveaux, zones) | Étale | H 5 min par étape | Locataires | CHOIX {1, 2, 3 étapes} |
| D3 | Choix des portes finales (S1) et du chemin | Où va la foule | H 5 min | Éviter Berger/Rambuteau si le périmètre les inclut | CHOIX (liste de portes) |
| D4 | Évacuer vs confiner | Entre rue risquée et nuit sur place | immédiat | Pas de plan de nuit public `[?]` | OUI/NON |
| D5 | Messages aux visiteurs (écrans, haut-parleurs, langues) | Réduit l'incertitude | H 2 min | Pas d'alarme incendie | CHOIX {aucun, FR, FR+EN} |
| D6 | Coordonner avec UGC (heure de sortie des séances) | Évite un pic unique de 3 000 personnes | H 5-15 min | UGC décide seul | SCORE (décalage en min) |
| D7 | Demander à la préfecture un délai ou des renforts | Plus de marge ou plus de présence | H 10-30 min | Préfecture n'est pas tenue de répondre | OUI/NON |
| D8 | Demander à la RATP de garder une bouche ouverte | Sortie encore possible | H 5-15 min | R2 est décidé par la police | OUI/NON |
| D9 | Appeler les secours (BSPP) en renfort préventif | Médicalisation, malaises | H 5-10 min d'arrivée | Hors incendie, seulement sur incident | OUI/NON |

C'est le seul agent qui optimise (matrice plans x scénarios, `instantane-3` §3). Son score : critères C1 à C5 de `criteres-jugement-crise`.

### 4.5 Exploitant UGC (7 leviers)

| # | Levier | Effet | Délai | Contrainte | Choix |
|---|---|---|---|---|---|
| U1 | Laisser finir / arrêter les séances | Envoie 0 ou 3 000 personnes d'un coup | arrêt en 10-30 min H | 27 salles, ~3 800 places | CHOIX {laisser, arrêter, retarder les prochaines} |
| U2 | Phaser la vidange des salles (par vagues) | Divise le flux | H 5 min par vague | Plus long = plus tard dehors | CHOIX {tout, 2 vagues, 4 vagues} |
| U3 | Annonce en salle (voix, lumière) | Pré-mouvement 44 s en moyenne (Lund) | H 1 min | Annonce humaine le 19 oct. | CHOIX {employé, sonorisation, + affichage} |
| U4 | Sorties de salles utilisées (tout par le hall ou toutes les issues) | Capacité de sortie | H 1-2 min | Issues de secours à usage réservé `[?]` | CHOIX |
| U5 | Billets : rembourser sur place / plus tard | Réduit les files aux caisses | immédiat | Le 19 oct. : « gardez votre ticket » | OUI/NON |
| U6 | Fermer les prochaines séances de la soirée | Évite l'arrivée de nouveaux publics | immédiat | Séances 9 h-minuit (Why So France) | OUI/NON |
| U7 | PMR et familles : sortie en dernier ou assistée | Protège les fragiles | H 2 min | Peu de personnel de salle | OUI/NON |

### 4.6 BSPP (4 leviers) : jamais acteur de la décision de masse

| # | Levier | Effet | Délai | Contrainte | Choix |
|---|---|---|---|---|---|
| B1 | Poste de secours avancé près des portes | Réponse rapide aux malaises | H 10 min | Disponibilité (crise urbaine) | OUI/NON |
| B2 | Direction des secours en cas de sinistre | Reprend la main sur les portes | H 10 min d'arrivée (cible de 10 min sur leur zone, Grokipedia, secondaire) | S'applique à l'incendie/accident | OUI/NON déclenché par événement |
| B3 | Levée de doute (colis, odeur, fumée) | Peut déclencher évacuation partielle | 15-60 min (2017 : ~1 h) | Hors scénario de base | OUI/NON activable |
| B4 | Évacuation médicale des blessés et PMR | Retire des gens de la foule | H 15-30 min | Peu de moyens, gros volumes | SCORE |

## 5. Les conflits entre décideurs (à coder comme événements du scénario)

1. **Évacuer vers un métro qui va fermer** : le directeur veut sortir par les stations (fenêtre 19 h 20 -> 22 h), la préfecture fixe 22 h (P5), la RATP tient R2. Plus le centre ferme tard, plus la pression sur les derniers trains monte. Réglage : le centre doit finir sa sortie avant l'heure de R2 moins la durée de remplissage des quais.
2. **Fermer le centre vs confiner** : P6 demande de fermer ; D4 peut juger que sortir est plus dangereux que rester (périmètre autour de Berger/Rambuteau, nuit). Aucun texte public ne tranche `[?]`. L'agent directeur garde le droit de ne pas exécuter une demande non obligatoire et le dit.
3. **UGC vide d'un coup vs le centre phase** : U1 envoie 3 000 personnes en 30 min alors que D2 étale ; sans D6, le pic dépasse la capacité des escaliers. À afficher comme « pic cinéma » dans la courbe.
4. **Information tardive** : P1 arrive en retard à D1 et U1 ; chaque minute de retard consomme la fenêtre de sortie (160 min jusqu'à 22 h, `criteres-jugement-crise` §1). À régler par le curseur « retard de la Ville ».
5. **Refoulement sans issue (SdF)** : S1 + P7 qui ferment des portes sans point de sortie de remplacement pour la foule déjà dans la file. Filtre de faisabilité G0 : un plan qui ferme une issue doit en laisser une praticable.
6. **PMR et ascenseurs** : S3 condamne les ascenseurs pour éviter les bousculades, mais bloque les PMR ; il faut S6 (EAS) en même temps.

## 6. Verdict : comment l'agent choisit

- **Directeur** : plans = combinaisons de D1 à D9 (15 à 30 plans), évaluation par la matrice sur scénarios P/R/U (`instantane-3` §3), choix par critères C1 à C5 avec ligne rouge d'écrasement. Question fermée par levier OUI/NON, choix listé sinon, score réglé par recherche.
- **Préfecture, RATP, UGC, sécurité** : cartes de scénario fixées d'avance, chaque carte = un menu de ce §4 avec valeurs par défaut du 19 oct. (P2 = 23 h, P3 = 20 h, P5 = 22 h, U1 = arrêter, D1 = rejouer l'horaire connu). Le juré modifie un levier ; les autres agents ne l'optimisent pas.
- **Message structuré entre agents** : `{de, à, levier, valeur, minute_d'émission, minute_de_réception}`. La différence entre les deux minutes = le retard d'information.
- **Nombres de leviers** : préfecture 8, RATP 8, sécurité 10, directeur 9, UGC 7, BSPP 4 (46 au total).

## 7. Trous et questions

Trous : base juridique d'un ordre de fermeture d'un ERP sans incendie ; règles écrites pour arrêter/inverser un escalator en évacuation (non lues, AS 6-7) ; effectifs de sécurité et capacité d'accueil de nuit ; qui a réellement prévenu UGC ; réouverture du tapis roulant de Châtelet ; mon accès aux pages complètes (Sénat, Le Parisien) a été refusé par le système, j'ai donc lu les extraits de recherche seulement.

Questions (défaut en l'absence de réponse : 1.a, 2.a) :
1. Faut-il garder la BSPP dans l'interface du jury : a) seulement en bandeau (4 leviers inactifs sauf événement) ; b) comme cinquième agent actif.
2. Le scénario « Ville prévient en retard » : a) curseur de retard de 0 à 30 min sur le message préfecture ; b) cas distinct nommé.
